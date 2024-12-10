import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { handleAuthCallback } from "../services/auth";

const AuthCallback = () => {
	const navigate = useNavigate();

	useEffect(() => {
		const handleAuth = async () => {
			const urlParams = new URLSearchParams(window.location.search);
			const code = urlParams.get("code");

			if (code) {
				try {
					await handleAuthCallback(code);
					navigate("/welcome");
				} catch (error) {
					console.error("Auth callback error:", error);
					navigate("/login");
				}
			}
		};

		handleAuth();
	}, [navigate]);

	return <div>Processing authentication...</div>;
};

export default AuthCallback;
