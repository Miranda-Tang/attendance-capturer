import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { touchIDAuth } from "../services/touchIDAuth";
import { getTokens } from "../services/auth";
import { Button, Typography } from "@mui/material";
import FingerprintIcon from "@mui/icons-material/Fingerprint";

const TouchIDRegistration = () => {
	const navigate = useNavigate();
	const [error, setError] = useState("");

	const registerTouchID = async () => {
		try {
			await touchIDAuth.checkSupport();
			const { idToken } = getTokens();
			const payload = JSON.parse(atob(idToken.split(".")[1]));
			const userEmail = payload.email;

			await touchIDAuth.register(userEmail);
			navigate("/welcome");
		} catch (error) {
			console.error("Registration failed:", error);
			setError(error.message);
		}
	};

	return (
		<div
			className="registration-page"
			style={{
				display: "flex",
				flexDirection: "column",
				height: "100vh",
				justifyContent: "center",
			}}
		>
			<Typography variant="h3" component="h1" gutterBottom>
				TouchID Registration
			</Typography>

			<div style={{ display: "flex", justifyContent: "center" }}>
				<Typography gutterBottom sx={{ maxWidth: "50%" }}>
					To access the dashboard, you need to register your device's TouchID.
					This ensures secure access to sensitive attendance information. Click
					the button below to start the registration process. You'll be prompted
					to use your device's TouchID or biometric authentication.
				</Typography>
			</div>

			<br />

			<div
				className="options"
				style={{
					display: "flex",
					alignItems: "center",
					gap: "20px",
					width: "100%",
					justifyContent: "center",
					paddingBottom: "30px",
				}}
			>
				<Button
					variant="contained"
					startIcon={<FingerprintIcon style={{ fontSize: 40 }} />}
					onClick={registerTouchID}
					style={{
						fontSize: "1.2rem",
						padding: "10px 20px",
						borderRadius: "50px",
						background: "#000",
					}}
				>
					Register TouchID
				</Button>
			</div>
			{error && (
				<Typography variant="body1" color="error">
					{error}
				</Typography>
			)}
		</div>
	);
};

export default TouchIDRegistration;
