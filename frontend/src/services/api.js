// get from .env file
import { getTokens, refreshTokens } from "./auth";
import { cognitoConfig } from "../config/cognito";
const API_URL = process.env.REACT_APP_API_URL;

export const fetchPeopleData = async () => {
	try {
		const response = await fetch(`${API_URL}/People/`);
		if (!response.ok) {
			throw new Error("Failed to fetch people data");
		}
		return await response.json();
	} catch (error) {
		console.error("Error fetching people data:", error);
		throw error;
	}
};

export const uploadAttedancePhoto = async (photoBase64, profileID) => {
	//await refreshTokens();
	const { idToken } = getTokens();

	if (!idToken) {
		throw new Error("No ID token available");
	}

	console.log("ID Token exists:", !!idToken);
	console.log("Configuration:", {
		identityPoolId: process.env.REACT_APP_IDENTITY_POOL_ID,
		region: cognitoConfig.region,
		userPoolId: cognitoConfig.userPoolId,
	});

	const loginKey = `cognito-idp.${cognitoConfig.region}.amazonaws.com/${cognitoConfig.userPoolId}`;

	try {
		const response = await fetch(`${API_URL}/upload_attendance_picture/`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				image: photoBase64,
				idToken: idToken,
				identityPoolId: process.env.REACT_APP_IDENTITY_POOL_ID,
				region: cognitoConfig.region,
				userPoolId: cognitoConfig.userPoolId,
				profileID: profileID,
			}),
		});
		if (!response.ok) {
			throw new Error("Failed to upload photo");
		}
		return await response.json();
	} catch (error) {
		console.error("Error uploading photo:", error);
		throw error;
	}
};

export const createProfile = async (profileData) => {
	try {
		const response = await fetch(`${API_URL}/create_profile/`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(profileData),
		});

		if (!response.ok) {
			throw new Error("Failed to create profile");
		}

		return await response.json();
	} catch (error) {
		console.error("Error creating profile:", error);
		throw error;
	}
};
