import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { touchIDAuth } from "../services/touchIDAuth";
import AccountBoxIcon from "@mui/icons-material/AccountBox";
import AddAPhotoIcon from "@mui/icons-material/AddAPhoto";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

const WelcomePage = () => {
	const navigate = useNavigate();
	const [error, setError] = useState("");

	useEffect(() => {
		// Clear protected area state when entering welcome page
		touchIDAuth.clearProtectedAreaState();
	}, []);

	const handleDashboardAccess = async () => {
		try {
			await touchIDAuth.checkSupport();

			if (!touchIDAuth.isRegistered()) {
				navigate("/register-touchid");
				return;
			}

			try {
				await touchIDAuth.verify();
				navigate("/dashboard");
			} catch (verifyError) {
				touchIDAuth.clearRegistration();
				navigate("/register-touchid");
			}
		} catch (err) {
			console.error("Access failed:", err);
			setError(err.message);

			if (err.message === "TouchID registration expired") {
				navigate("/register-touchid");
			}
		}
	};

	const handleSignAttendance = () => {
		navigate("/checkin");
	};

	return (
		<div
			className="welcome-page"
			style={{
				display: "flex",
				flexDirection: "column",
				height: "calc(100vh - 40px)",
				justifyContent: "center",
			}}
		>
			<Typography variant="h3" component="h1" gutterBottom>
				Effortless Attendance Management
			</Typography>

			<div style={{ display: "flex", justifyContent: "center" }}>
				<Typography gutterBottom sx={{ maxWidth: "50%" }}>
					Welcome to the smarter way of tracking attendance. 
				</Typography>
			</div>

			<div style={{ display: "flex", justifyContent: "center" }}>
				<Typography gutterBottom sx={{ maxWidth: "50%" }}>
					Harness the power of AI-driven facial recognition to simplify and secure your attendance process. No cards, no pens – just you.
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
					startIcon={<AccountBoxIcon style={{ fontSize: 40 }} />}
					onClick={handleDashboardAccess}
					style={{
						fontSize: "1.2rem",
						padding: "10px 20px",
						borderRadius: "50px",
						background: "#000",
					}}
				>
					Access Dashboard
				</Button>
				<Button
					variant="contained"
					startIcon={<AddAPhotoIcon style={{ fontSize: 40 }} />}
					onClick={handleSignAttendance}
					style={{
						fontSize: "1.2rem",
						padding: "10px 20px",
						borderRadius: "50px",
						background: "#fff",
						color: "#000",
					}}
				>
					SIGN ATTENDANCE
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

export default WelcomePage;
