import {
	S3Client,
	ListObjectsV2Command,
	PutObjectCommand,
	GetObjectCommand,
} from "@aws-sdk/client-s3";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers";
import { getTokens } from "./auth";
import { cognitoConfig } from "../config/cognito";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let s3Client = null;
let profileBucket = process.env.REACT_APP_S3_BUCKET_PROFILE;

const getS3Client = async () => {
	const { idToken } = getTokens();

	if (!idToken) {
		throw new Error("No ID token available");
	}

	const loginKey = `cognito-idp.${cognitoConfig.region}.amazonaws.com/${cognitoConfig.userPoolId}`;

	if (!s3Client) {
		s3Client = new S3Client({
			region: cognitoConfig.region,
			credentials: fromCognitoIdentityPool({
				clientConfig: { region: cognitoConfig.region },
				identityPoolId: process.env.REACT_APP_IDENTITY_POOL_ID,
				logins: {
					[loginKey]: idToken,
				},
			}),
		});
	}

	try {
		// Force credentials refresh to verify they're working
		const credentials = await s3Client.config.credentials();
	} catch (error) {
		console.error("Error getting credentials:", error);
		throw error;
	}

	return s3Client;
};

export const getUserId = async () => {
	const { idToken } = getTokens();
	const payload = JSON.parse(atob(idToken.split(".")[1]));
	return payload.sub; // Cognito user ID
};

export const createUserFolder = async () => {
	try {
		const client = await getS3Client();
		const userId = await getUserId();

		const command = new PutObjectCommand({
			Bucket: profileBucket,
			Key: `${userId}/`, // The trailing slash makes it a folder
			Body: "", // Empty content
		});

		await client.send(command);
		console.log(`Created folder for user: ${userId}`);
	} catch (error) {
		console.error("Error creating user folder:", error);
		throw error;
	}
};

export const listProfiles = async () => {
	try {
		const client = await getS3Client();
		const userId = await getUserId();

		const command = new ListObjectsV2Command({
			Bucket: profileBucket,
			Prefix: `${userId}/`,
		});

		const response = await client.send(command);

		// If no Contents array or it's empty, create the folder
		if (!response.Contents || response.Contents.length === 0) {
			console.log("No files found, creating user folder");
			await createUserFolder();
			return []; // Return empty array as there are no files yet
		}

		return response.Contents.filter((item) => !item.Key.endsWith("/"));
	} catch (error) {
		console.error("Error listing files:", error);
		throw error;
	}
};

export const uploadProfilePicture = async (file, profileId) => {
	try {
		const client = await getS3Client();
		const userId = await getUserId();

		const fileExtension = file.name.split(".").pop().toLowerCase();
		const timestamp = new Date()
			.toISOString()
			.replace(/[:\-T]/g, "")
			.split(".")[0]; // Format: YYYYMMDDHHMMSS

		const command = new PutObjectCommand({
			Bucket: profileBucket,
			Key: `${userId}/${profileId}_${timestamp}.${fileExtension}`,
			Body: file,
			ContentType: file.type,
		});

		await client.send(command);

		// Construct the S3 URL for the uploaded image
		const imageUrl = `https://${profileBucket}.s3.${cognitoConfig.region}.amazonaws.com/${userId}/${profileId}_${timestamp}.${fileExtension}`;
		console.log(`Uploaded profile picture: ${imageUrl}`);
		return imageUrl;
	} catch (error) {
		console.error("Error uploading profile picture:", error);
		throw error;
	}
};

export const getSignedImageUrl = async (imageUrl) => {
	try {
		const client = await getS3Client();

		// Extract bucket and key from the full S3 URL
		const url = new URL(imageUrl);
		const bucket = url.hostname.split(".")[0];
		const key = decodeURIComponent(url.pathname.substring(1));

		const command = new GetObjectCommand({
			Bucket: bucket,
			Key: key,
		});

		// Get signed URL that expires in 5 minutes
		const signedUrl = await getSignedUrl(client, command, { expiresIn: 300 });
		return signedUrl;
	} catch (error) {
		console.error("Error getting signed URL:", error);
		throw error;
	}
};
