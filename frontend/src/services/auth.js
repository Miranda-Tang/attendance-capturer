import { CognitoIdentityProvider } from "@aws-sdk/client-cognito-identity-provider";
import { cognitoConfig } from "../config/cognito";

const cognitoIdentityProvider = new CognitoIdentityProvider({
	region: cognitoConfig.region,
});

export const initiateLogin = () => {
	const queryParams = new URLSearchParams({
		client_id: cognitoConfig.userPoolClientId,
		response_type: "code",
		scope: cognitoConfig.oauth.scope.join(" "),
		redirect_uri: cognitoConfig.oauth.redirectSignIn,
	});

	const loginUrl = `${cognitoConfig.oauth.domain}/oauth2/authorize?${queryParams}`;
	window.location.href = loginUrl;
};

export const handleAuthCallback = async (code) => {
	try {
		const tokenEndpoint = `${cognitoConfig.oauth.domain}/oauth2/token`;

		const params = new URLSearchParams();
		params.append("grant_type", "authorization_code");
		params.append("client_id", cognitoConfig.userPoolClientId);
		params.append("code", code);
		params.append("redirect_uri", cognitoConfig.oauth.redirectSignIn);

		const response = await fetch(tokenEndpoint, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: params,
		});

		if (!response.ok) {
			throw new Error("Token exchange failed");
		}

		const tokens = await response.json();

		// Store tokens
		localStorage.setItem("accessToken", tokens.access_token);
		localStorage.setItem("idToken", tokens.id_token);
		localStorage.setItem("refreshToken", tokens.refresh_token);
	} catch (error) {
		console.error("Authentication error:", error);
		throw error;
	}
};

export const getTokens = () => {
	return {
		accessToken: localStorage.getItem("accessToken"),
		idToken: localStorage.getItem("idToken"),
		refreshToken: localStorage.getItem("refreshToken"),
	};
};

export const clearTokens = () => {
	localStorage.removeItem("accessToken");
	localStorage.removeItem("idToken");
	localStorage.removeItem("refreshToken");
};

export const logout = () => {
	clearTokens();

	const redirectUri = `${window.location.origin}/login`;

	const cognitoDomain = cognitoConfig.oauth.domain.startsWith("https://")
		? cognitoConfig.oauth.domain
		: `https://${cognitoConfig.oauth.domain}`;

	const logoutUrl = `${cognitoDomain}/logout?client_id=${cognitoConfig.userPoolClientId}&logout_uri=${encodeURIComponent(redirectUri)}`;

	console.log("Logout URL:", logoutUrl);

	window.location.href = logoutUrl;
};

export const refreshTokens = async () => {
	try {
		const refreshToken = localStorage.getItem("refreshToken");
		if (!refreshToken) {
			throw new Error("No refresh token available");
		}

		const params = {
			ClientId: cognitoConfig.userPoolClientId,
			GrantType: "refresh_token",
			RefreshToken: refreshToken,
		};

		const response = await cognitoIdentityProvider.initiateAuth(params);
		const { AccessToken, IdToken } = response.AuthenticationResult;

		// Update tokens in localStorage
		localStorage.setItem("accessToken", AccessToken);
		localStorage.setItem("idToken", IdToken);
	} catch (error) {
		console.error("Token refresh error:", error);
		clearTokens();
		window.location.href = "/login";
		throw error;
	}
};
