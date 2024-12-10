import base64
import datetime
import time
from django.shortcuts import render
from rest_framework import viewsets
from .serializers import AttendanceSerializer, ProfileSerializer
from .models import Attendance, Profile
import boto3
import re
import os
import logging
from django.conf import settings
import json
from rest_framework.decorators import api_view
from rest_framework.response import Response
from botocore.exceptions import ClientError
from dotenv import load_dotenv
import uuid


class PeopleView(viewsets.ModelViewSet):
    serializer_class = AttendanceSerializer, ProfileSerializer


# load variables from .env file
load_dotenv()


def upload_file(file_name, bucket, object_name=None, client=None):
    """
    Upload a file to an S3 bucket.

    :param file_name: File to upload
    :param bucket: Bucket to upload to
    :param object_name: S3 object name, including folder path. If not specified, file_name is used.
    :return: URL of the uploaded file if successful, else False
    """

    # Set object_name to file name if not specified
    if object_name is None:
        object_name = os.path.basename(file_name)

    try:
        # Upload the file to S3
        print(f"Uploading file {file_name} to bucket {bucket} with object name {object_name}")
        client.upload_file(file_name, bucket, object_name)
        file_url = f"https://{bucket}.s3.ca-central-1.amazonaws.com/{object_name}"
        print(f"File uploaded successfully to {file_url}")
        return file_url
    except ClientError as e:
        logging.error(e)
        return False


def get_user_id(id_token):
    """
    Extracts the 'sub' field (Cognito user ID) from a JWT ID token.

    :param id_token: The ID token as a string.
    :return: The 'sub' (user ID) field from the token payload.
    """
    # Split the JWT token to get the payload part
    payload_part = id_token.split(".")[1]

    # Decode the base64 payload (ensure proper padding for base64)
    payload_decoded = base64.b64decode(payload_part + "===")

    # Parse the JSON payload and extract 'sub'
    payload = json.loads(payload_decoded)
    return payload.get("sub")

def invoke_lambda(path, client=None):
    lambda_function_name = 'facialRecognition'
    payload = {
        'path': path
    }
    try:
        response = client.invoke(
            FunctionName=lambda_function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(payload)
        )
        response_payload = json.loads(response['Payload'].read())
        status_code = response_payload.get('statusCode', 500)
        status = response_payload.get('status', 'Unknown error')
        body = response_payload.get('body', 'Unknown error')
        return status_code, status, body
    except ClientError as e:
        raise RuntimeError(f"Error invoking Lambda: {e}")

# store and upload the attendance picture to s3, then delete the file


@api_view(['POST'])
def upload_attendance_picture(request):
    body = json.loads(request.body)
    # transform the base64 image to a file
    image_recovered = base64.b64decode(
        re.sub('^data:image/.+;base64,', '', body['image']))
    # get the current timestamp
    current_timestamp = datetime.datetime.now(
        datetime.timezone.utc).strftime('%Y-%m-%d_%H-%M-%S')
    # generate a uuid for the image
    myuuid = uuid.uuid4()
    profileID = body['profileID']

    client = boto3.client("cognito-identity", region_name=body['region'])
    identity_response = client.get_id(
        IdentityPoolId=body['identityPoolId'],
        Logins={
            'cognito-idp.' + body['region'] + '.amazonaws.com/' + body['userPoolId']: body['idToken']
        }
    )
    identity_id = identity_response['IdentityId']
    response = client.get_credentials_for_identity(
        IdentityId=identity_id,
        Logins={
            'cognito-idp.' + body['region'] + '.amazonaws.com/' + body['userPoolId']: body['idToken']
        }
    )

    s3_client = boto3.client(
        's3',
        aws_access_key_id=response['Credentials']['AccessKeyId'],
        aws_secret_access_key=response['Credentials']['SecretKey'],
        aws_session_token=response['Credentials']['SessionToken']
    )

    cognitoID = get_user_id(body['idToken'])
    attendance_picture_s3_path = cognitoID + "/attendance_" + \
        profileID + "_" + current_timestamp + ".jpg"
    attendance_picture_local_path = "./attendance/attendance_" + \
        current_timestamp + "_" + str(myuuid) + ".jpg"

    with open(attendance_picture_local_path, "wb") as attendance_picture_file:
        attendance_picture_file.write(image_recovered)

    # upload the attendance picture to s3
    attendance_picture_url = upload_file(file_name=attendance_picture_local_path, bucket=os.getenv(
        "ATTENDANCE_PICTURE_BUCKET_NAME"), object_name=attendance_picture_s3_path, client=s3_client)

    # delete the attendance picture file
    os.remove(attendance_picture_local_path)

    lambda_client = boto3.client(
        'lambda',
        region_name='ca-central-1',
        aws_access_key_id=response['Credentials']['AccessKeyId'],
        aws_secret_access_key=response['Credentials']['SecretKey'],
        aws_session_token=response['Credentials']['SessionToken']
    )
    response_status_code, response_status, response_body = invoke_lambda(attendance_picture_url, lambda_client)
    print(f"Lambda invoked for {attendance_picture_url} \n"
      f"Status Code: {response_status_code}\n"
      f"Status: {response_status}\n"
      f"Message: {response_body}")
    return Response({'statusCode': response_status_code, 'status': response_status, 'message': response_body}, status=200)


@api_view(['POST'])
def create_profile(request):
    try:
        body = json.loads(request.body)

        # Create profile record in RDS
        new_profile = Profile.objects.create(
            profile_id=body['profileID'],
            profile_name=body['profileName'],
            profile_image=body['profileImageUrl'],
            admin_id=body['adminID']
        )

        serializer = ProfileSerializer(new_profile)
        return Response(serializer.data, status=201)
    except Exception as e:
        return Response({"error": str(e)}, status=400)

@api_view(['GET'])
# get all profiles for a user from mysql
def get_profiles(request, profile_id):
    try:
        profiles = Profile.objects.filter(profile_id=profile_id)
        serializer = ProfileSerializer(profiles, many=True)
        return Response(serializer.data, status=200)
    except Exception as e:
        return Response({"error": str(e)}, status=400)

@api_view(['GET'])
def get_attendance_by_admin(request, admin_id):
    try:
        profiles = Profile.objects.filter(admin_id=admin_id)
        attendance = Attendance.objects.filter(profile__in=profiles)
        serializer = AttendanceSerializer(attendance, many=True)
        return Response(serializer.data, status=200)
    except Exception as e:
        return Response({"error": str(e)}, status=400)

@api_view(['POST'])
def update_profile(request):
    try:
        body = json.loads(request.body)
        profile = Profile.objects.get(profile_id=body['profileID'])
        profile.profile_name = body['profileName']
        profile.profile_image = body['profileImageUrl']
        profile.save()
        serializer = ProfileSerializer(profile)
        return Response(serializer.data, status=200)
    except Exception as e:
        return Response({"error": str(e)}, status=400)
    
@api_view(['GET'])
def get_profile_by_admin(request, admin_id):
    try:
        profiles = Profile.objects.filter(admin_id=admin_id)
        serializer = ProfileSerializer(profiles, many=True)
        return Response(serializer.data, status=200)
    except Exception as e:
        return Response({"error": str(e)}, status=400)
