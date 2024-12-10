import React, { useState, useEffect } from "react";
import SideNav from "./SideNav";
import { Collapse, IconButton } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

const Layout = ({ children, showSideNav }) => {
	const [isNavOpen, setIsNavOpen] = useState(showSideNav);

	useEffect(() => {
		setIsNavOpen(showSideNav);
	}, [showSideNav]);

	return (
		<div
			style={{
				display: "flex",
				minHeight: "100vh",
			}}
		>
			<div
				style={{
					position: "fixed",
					top: 0,
					bottom: 0,
					left: 0,
					display: "flex",
					flexDirection: "column",
					height: "100%",
				}}
			>
				<Collapse
					in={isNavOpen}
					orientation="horizontal"
					sx={{
						height: "100%",
						"& .MuiCollapse-wrapperInner": {
							height: "100%",
						},
					}}
				>
					<div
						style={{
							height: "100%",
							background: "#000033",
							width: 240,
						}}
					>
						<SideNav />
					</div>
				</Collapse>

				<IconButton
					onClick={() => setIsNavOpen(!isNavOpen)}
					sx={{
						position: "absolute",
						right: "-20px",
						top: "85%",
						transform: "translateY(-50%)",
						background: "#000033",
						color: "white",
						width: "40px",
						height: "40px",
						"&:hover": {
							background: "#000044",
							boxShadow: "0 0 10px rgba(0,0,0,0.3)",
						},
						boxShadow: "0 0 5px rgba(0,0,0,0.2)",
						border: "2px solid rgba(255,255,255,0.1)",
						"& .MuiTouchRipple-root": {
							display: "none",
						},
						"& .MuiSvgIcon-root": {
							fontSize: "28px",
						},
					}}
				>
					{isNavOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
				</IconButton>
			</div>

			<main
				style={{
					flexGrow: 1,
					padding: "20px",
					marginLeft: isNavOpen ? "240px" : "40px",
					transition: "margin-left 0.3s ease",
				}}
			>
				{children}
			</main>
		</div>
	);
};

export default Layout;
