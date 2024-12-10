import React from "react";
import { initiateLogin } from "../services/auth";
import Button from "@mui/material/Button";
import loginBackground from "../assets/login_background.mp4";

const Login = () => {
	const background = {
		position: "fixed",
		top: 0,
		left: 0,
		width: "100%",
		height: "100%",
		overflow: "hidden",
	};
	const videoStyle = {
		objectFit: "cover",
		width: "100%",
		height: "100%",
	};
	return (
		<div>
			<div style={background}>
				<video autoPlay loop muted style={videoStyle}>
					<source src={loginBackground} type="video/mp4" />
				</video>
			</div>
			<div
				style={{
					zIndex: 1,
					position: "fixed",
					color: "#fff",
					fontWeight: "bold",
					fontSize: "xx-large",
					left: "50px",
					top: "50%",
					display: "flex",
					flexDirection: "column",
				}}
			>
				<h1
					style={{
						marginBottom: "10px",
						textShadow: "3px 3px 6px rgba(0, 0, 0, 0.9)",
					}}
				>
					Authenticate with Confidence,{" "}
				</h1>
				<h1
					style={{
						display: "flex",
						margin: "0 10px 20px 0",
						textShadow: "3px 3px 6px rgba(0, 0, 0, 0.9)",
					}}
				>
					Attend with Ease.
				</h1>
				<Button
					variant="contained"
					onClick={initiateLogin}
					sx={{
						color: "#000",
						borderRadius: "10px",
						width: "200px",
						height: "60px",
						padding: "15px",
						fontSize: "18px",
						background: "rgba(255, 255, 255, 0.95)",
						boxShadow: "0 4px 8px rgba(0, 0, 0, 0.5)",
						"&:hover": {
							background: "#fff",
							transform: "translateY(-2px)",
							transition: "all 0.2s ease-in-out",
							boxShadow: "0 6px 12px rgba(0, 0, 0, 0.6)",
						},
					}}
				>
					Sign in
				</Button>
			</div>
		</div>
	);
};

export default Login;
