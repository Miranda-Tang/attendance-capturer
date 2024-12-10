import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import HomeIcon from "@mui/icons-material/Home";
import DashboardIcon from "@mui/icons-material/Dashboard";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Typography from "@mui/material/Typography";
import AttendanceIcon from "@mui/icons-material/DateRange";
import AssessmentIcon from "@mui/icons-material/Assessment";
import { touchIDAuth } from "../services/touchIDAuth";
import "./css/SideNav.css";
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import {logout} from "../services/auth";
import {IconButton, Tooltip} from "@mui/material";

const SideNav = () => {
	const navigate = useNavigate();
	const [error, setError] = useState("");

	const handleProtectedRouteAccess = async (route) => {
		try {
			if (touchIDAuth.isInProtectedArea()) {
				navigate(route);
				return;
			}

			await touchIDAuth.checkSupport();
			if (!touchIDAuth.isRegistered()) {
				navigate("/register-touchid");
				return;
			}

			try {
				await touchIDAuth.verify();
				navigate(route);
			} catch (verifyError) {
				touchIDAuth.clearRegistration();
				navigate("/register-touchid");
			}
		} catch (err) {
			console.error("Access failed:", err);
			setError(err.message);
		}
	}


    const handleLogout = () => {
        logout();
        navigate("/login");
    };

	return (
		<nav style={{ width: 240, background: "#000033" }}>
			<ul className="sidenav-list">
				<Link to="/welcome">
					<li className="sidenav-item">
						<HomeIcon style={{ marginRight: "8px" }} />
						Home
					</li>
				</Link>
				<li
					className="sidenav-item"
					onClick={() => handleProtectedRouteAccess("/dashboard")}
				>
					<DashboardIcon style={{ marginRight: "8px" }} />
					Admin Dashboard
				</li>
				<li
					className="sidenav-item"
					onClick={() => handleProtectedRouteAccess("/attendance-detail")}
				>
					<AttendanceIcon style={{ marginRight: "8px" }} />
					Past Attendance
				</li>
				<li
					className="sidenav-item"
					onClick={() => handleProtectedRouteAccess("/analysis")}
				>
					<AssessmentIcon style={{ marginRight: "8px" }} />
					Analysis
				</li>
				<Link to="/checkin">
					<li className="sidenav-item">
						<CheckCircleIcon style={{ marginRight: "8px" }} />
						Sign Attendance
					</li>
				</Link>
			</ul>
			{error && (
				<Typography variant="body1" color="error">
					{error}
				</Typography>
			)}
			<IconButton
				id={"signout-button"}
				onClick={handleLogout}>
				<ExitToAppIcon fontSize="xl"></ExitToAppIcon>
			</IconButton>
		</nav>
	);
};

export default SideNav;
