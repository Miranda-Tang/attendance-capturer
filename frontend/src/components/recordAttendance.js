import React, { useState, useEffect } from "react";
import Webcam from "react-webcam";
import { uploadAttedancePhoto } from "../services/api";
import { useNavigate } from "react-router-dom";
import Container from "@mui/material/Container";
import { touchIDAuth } from "../services/touchIDAuth";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import { 
	TextField, 
	Button, 
	Select, 
	MenuItem, 
	InputLabel, 
	FormControl,
	AppBar, 
	Toolbar, 
	CircularProgress, 
	Box, 
	Typography, 
	Modal 
} from "@mui/material";

export const WebcamCapture = () => {
	const navigate = useNavigate();
	const [deviceId, setDeviceId] = useState({});
	const [devices, setDevices] = useState([]);
	const [profileID, setProfileID] = useState("");
	const [error, setError] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadResult, setUploadResult] = useState(null);

	const handleDevices = (mediaDevices) => {
		const list = mediaDevices.filter(({ kind }) => kind === "videoinput");
		setDevices(list);
		setDeviceId(list[0].deviceId);
	};

	const handleDeviceChange = (event) => {
		setDeviceId(event.target.value);
	};

	const handleNameChange = (event) => {
		setProfileID(event.target.value);
	};

	useEffect(() => {
		touchIDAuth.clearProtectedAreaState();

		const handleNavigation = () => {
			navigate("/welcome", { replace: true });
		};

		window.addEventListener("popstate", handleNavigation);

		window.history.pushState(null, "", "/checkin");

		return () => {
			window.removeEventListener("popstate", handleNavigation);
		};
	}, [navigate]);

	React.useEffect(() => {
		navigator.mediaDevices.enumerateDevices().then(handleDevices);
	}, []);

	return (
		<>
			<AppBar
				position="static"
				sx={{ background: "#fff", marginBottom: "20px" }}
			>
				<Container maxWidth="xl">
					<Toolbar disableGutters>
						<h2 style={{ color: "#000", width: "100%" }}>Sign Attendance</h2>
					</Toolbar>
				</Container>
			</AppBar>
			<div>
				<Webcam
					audio={false}
					height={360}
					screenshotFormat="image/jpeg"
					width={640}
					videoConstraints={{
						width: 640,
						height: 360,
						facingMode: "user",
						deviceId: deviceId,
					}}
				>
					{({ getScreenshot }) => (
						<div
							style={{
								position: "fixed",
								right: "10px",
								bottom: "10px",
							}}
						>
							<Button
								variant="contained"
								disabled={isUploading}
								onClick={async () => {
									if (!profileID || profileID.trim() === "") {
										setError(true);
										return;
									}
									setError(false);
									setIsUploading(true);
									setUploadResult(null);
									const imageBase64 = getScreenshot();
									await uploadAttedancePhoto(imageBase64, profileID);
									const { statusCode, status, message } = await uploadAttedancePhoto(
										imageBase64,
										profileID
									);
									if (statusCode === 200 && status === "success") {
										setUploadResult({ success: true, message });
									} else {
										setUploadResult({ success: false, message: "Face match failed, please try again" });
									}
									setIsUploading(false);
								}}
								sx={{ background: "#000" }}
							>
								Capture photo
							</Button>

							<Modal open={isUploading || uploadResult !== null} aria-labelledby="modal-title">
								<Box
									sx={{
										display: "flex",
										flexDirection: "column",
										alignItems: "center",
										justifyContent: "center",
										position: "fixed",
										top: 0,
										left: 0,
										width: "100%",
										height: "100%",
										bgcolor: "rgba(255, 255, 255, 0.8)",
										zIndex: 1300,
									}}
								>
									{isUploading && (
										<>
											<CircularProgress size={60} />
											<Typography variant="h6" sx={{ mt: 2 }}>
												Face captured. Analyzing...
											</Typography>
										</>
									)}
									{uploadResult && (
										<>
											{uploadResult.success ? (
												<CheckCircleIcon color="success" sx={{ fontSize: 60 }} />
											) : (
												<CancelIcon color="error" sx={{ fontSize: 60 }} />
											)}
											<Typography
												variant="h6"
												sx={{ mt: 2, textAlign: "center", px: 2 }}
											>
												{uploadResult.message}
											</Typography>
											<Button
												variant="contained"
												sx={{ mt: 3 }}
												onClick={() => setUploadResult(null)}
											>
												OK
											</Button>
										</>
									)}
								</Box>
							</Modal>
						</div>
					)}
				</Webcam>
			</div>
			<div>
				<TextField
					required
					id="profileId"
					label="profile ID"
					variant="outlined"
					value={profileID}
					onChange={handleNameChange}
					error={error}
					helperText={error ? "Please enter a valid profile ID" : ""}
					sx={{
						width: "210px",
						margin: "10px 0",
					}}
				/>
				<div style={{ display: "flex", justifyContent: "center" }}>
					<div style={{ margin: "10px 0", width: "210px" }}>
						<FormControl fullWidth>
							<InputLabel id="demo-simple-select-label">camera</InputLabel>
							<Select
								value={deviceId}
								label="camera"
								onChange={handleDeviceChange}
							>
								{devices.map((device, key) => (
									<MenuItem value={device.deviceId}>
										{device.label || `Device ${key + 1}`}
									</MenuItem>
								))}
							</Select>
						</FormControl>
					</div>
				</div>
			</div>
		</>
	);
};
