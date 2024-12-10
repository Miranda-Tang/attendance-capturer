import boto3
import pymysql
import os
import datetime
from botocore.exceptions import ClientError


def lambda_handler(event, context):
    try:
        path = event.get("path")
        print(f"[DEBUG] Processing attendance image: {path}")

        # Get attendance picture bucket name and key
        attend_bucket = os.environ["BUCKET1_NAME"]
        attend_key = path.split(".com/")[-1]

        # Get default profile picture bucket name
        pfp_name = os.environ["BUCKET2_NAME"]

        # Get S3 object url from RDS for default profile picture and extract key
        file_name = attend_key.split("/")[-1]
        file_name_stripped = file_name.split(".")[0]
        components = file_name_stripped.split("_")
        admin_id = attend_key.split("/")[0]
        rds_key = components[1]
        pfp_path = get_path_from_db(admin_id, rds_key)
        print(f"[INFO] Profile picture S3 path retrieved: {pfp_path}")

        if not pfp_path:
            return {
                "statusCode": 404,
                "status": "failure",
                "body": f"Profile picture with ID {rds_key} not found"
            }

        pfp_key = pfp_path.split(".com/")[-1]

        # Use rekognition to do facial comparison
        print(f"[DEBUG] Comparing faces between attendance and profile images")
        comparison_response, error = handle_rekognition(
            attend_bucket, attend_key, pfp_name, pfp_key)

        if error:
            print(f"[ERROR] Rekognition error: {str(error)}")
            error_code = error.response['Error']['Code']
            if error_code == 'InvalidS3ObjectException':
                return {
                    "statusCode": 404,
                    "status": "failure",
                    "body": f"One or both of the S3 objects could not be found: {error.response['Error']['Message']}"
                }
            elif error_code == 'InvalidParameterException':
                return {
                    "statusCode": 400,
                    "status": "failure",
                    "body": "No face detected in one or both images"
                }
            elif error_code == 'AccessDeniedException':
                return {
                    "statusCode": 403,
                    "status": "failure",
                    "body": "Access denied. Check your S3 bucket permissions."
                }
            else:
                return {
                    "statusCode": 500,
                    "status": "failure",
                    "body": f"A Rekognition error occurred: {error.response['Error']['Message']}"
                }

        # Case 1: Face detected and facial comparison passed
        if len(comparison_response['FaceMatches']) == 1:
            timestamp_str = components[2] + '_' + components[3]
            timestamp = datetime.datetime.strptime(
                timestamp_str, "%Y-%m-%d_%H-%M-%S")
            insertion_err = insert_data_into_db(rds_key, path, timestamp)
            if insertion_err:
                print(f"[ERROR] Database insertion error: {insertion_err}")
                return {
                    "statusCode": 400,
                    "status": "failure",
                    "body": f"Error inserting data: {insertion_err}"
                }
            print("[INFO] Face match successful, attendance recorded")
            return {
                "statusCode": 200,
                "status": "success",
                "body": "Face match successful, attendance recorded"
            }
        # Case 2: Failed facial comparison
        else:
            print("[INFO] Face match failed")
            return {
                "statusCode": 200,
                "status": "failure",
                "body": "Face match failed"
            }

    except Exception as e:
        print(f"[ERROR] Unexpected error: {str(e)}")
        return {
            "statusCode": 500,
            "status": "failure",
            "body": f"An error occurred: {str(e)}"
        }

# Pass the two S3 objects to rekognition for facial comparison


def handle_rekognition(bucket1_name, img1_key, bucket2_name, img2_key):
    client = boto3.client('rekognition', region_name='ca-central-1')
    try:
        # First check if faces exist in both images
        source_faces = client.detect_faces(
            Image={'S3Object': {'Bucket': bucket1_name, 'Name': img1_key}}
        )
        
        if not source_faces.get('FaceDetails'):
            print("[ERROR] No face detected in attendance photo")
            return None, ClientError(
                {'Error': {'Code': 'InvalidParameterException', 'Message': 'No face detected in attendance photo'}},
                'CompareFaces'
            )
        
        target_faces = client.detect_faces(
            Image={'S3Object': {'Bucket': bucket2_name, 'Name': img2_key}}
        )
        
        if not target_faces.get('FaceDetails'):
            print("[ERROR] No face detected in profile photo")
            return None, ClientError(
                {'Error': {'Code': 'InvalidParameterException', 'Message': 'No face detected in profile photo'}},
                'CompareFaces'
            )

        comparison_response = client.compare_faces(
            SimilarityThreshold=80,
            SourceImage={'S3Object': {'Bucket': bucket1_name, 'Name': img1_key}},
            TargetImage={'S3Object': {'Bucket': bucket2_name, 'Name': img2_key}}
        )
        return comparison_response, None

    except ClientError as e:
        print(f"[ERROR] Rekognition error: {str(e)}")
        return None, e

# Get S3 url for default profile image from RDS


def get_path_from_db(admin_id, profile_id):
    connection = None
    try:
        # Fetch database credentials from environment variables
        db_host = os.environ["DB_HOST"]
        db_user = os.environ["DB_USER"]
        db_password = os.environ["DB_PASSWORD"]
        db_name = os.environ["DB_NAME"]

        # Connect to the database
        connection = pymysql.connect(
            host=db_host,
            user=db_user,
            password=db_password,
            database=db_name
        )
        cursor = connection.cursor()

        # Fix the tuple syntax and fetch data
        cursor.execute("SELECT profile_image FROM people_profile WHERE profile_id = %s AND admin_id = %s", (profile_id, admin_id))
        result_tuple = cursor.fetchall()
        
        if not result_tuple:
            print(f"[ERROR] No profile found for ID: {profile_id}")
            return None
            
        return result_tuple[0][0]

    except Exception as e:
        print(f"[ERROR] Database error: {str(e)}")
        return str(e)

    finally:
        if connection:
            connection.close()

# Insert attendance picture url into RDS


def insert_data_into_db(profile_id, photo_url, timestamp):
    connection = None
    try:
        # Fetch database credentials from environment variables
        db_host = os.environ["DB_HOST"]
        db_user = os.environ["DB_USER"]
        db_password = os.environ["DB_PASSWORD"]
        db_name = os.environ["DB_NAME"]
        
        # Connect to the database
        connection = pymysql.connect(
            host=db_host,
            user=db_user,
            password=db_password,
            database=db_name
        )
        cursor = connection.cursor()
        
        # Execute the query
        cursor.execute(
            "INSERT INTO people_attendance (profile_id, photo_url, timestamp) VALUES (%s, %s, %s)",
            (profile_id, photo_url, timestamp)
        )
        connection.commit()
        return None
    
    except Exception as e:
        print(f"[ERROR] Database insertion error: {str(e)}")
        return str(e)

    finally:
        if connection:
            connection.close()
