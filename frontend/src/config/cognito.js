export const cognitoConfig = {
	userPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID,
	userPoolClientId: process.env.REACT_APP_COGNITO_CLIENT_ID,
	region: process.env.REACT_APP_AWS_REGION,
	oauth: {
		domain: process.env.REACT_APP_COGNITO_DOMAIN,
		scope: ["email", "openid", "profile"],
		redirectSignIn: process.env.REACT_APP_REDIRECT_SIGNIN,
		redirectSignOut: process.env.REACT_APP_REDIRECT_SIGNOUT,
		responseType: "code",
	},
};
