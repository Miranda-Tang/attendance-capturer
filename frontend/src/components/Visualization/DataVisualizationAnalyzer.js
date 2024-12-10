import React, { useRef, useEffect, useState } from "react";
import { getUserId } from "../../services/profilepics";
import MonthlyHeatMap from "./MonthlyHeatMap";
import AttendancePercentagePieChart from "./AttendancePercentagePieChart";
import Past10DaysLineGraph from "./Past10DaysLineGraph";
import { CircularProgress, Alert } from "@mui/material";

const API_URL = process.env.REACT_APP_API_URL;

const DataVisualizationAnalyzer = () => {
	const [dataGroupByDate, setDataGroupByDate] = useState([]);
	const [profiles, setProfiles] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	function processData(profiles, attendanceRecords) {
		const attendanceByDate = attendanceRecords.reduce((acc, record) => {
			const date = new Date(record.timestamp);
			const dateKey = date.toLocaleDateString("en-US", {
				year: "numeric",
				month: "2-digit",
				day: "2-digit",
			});

			if (!acc[dateKey]) {
				acc[dateKey] = new Map();
			}
			acc[dateKey].set(record.profile.profile_id, {
				present: true,
				photo: record.photo_url,
				time: date.toLocaleTimeString("en-US", {
					hour: "2-digit",
					minute: "2-digit",
					second: "2-digit",
				}),
			});
			return acc;
		}, {});

		// Create a map of dates and their corresponding rows
		const groupedData = {};
		Object.keys(attendanceByDate).forEach((dateKey) => {
			// For each date, create a row for each profile
			groupedData[dateKey] = profiles.map((profile) => {
				const attendanceInfo = attendanceByDate[dateKey].get(
					profile.profile_id
				);
				return {
					id: `${dateKey}-${profile.profile_id}`,
					profile_id: profile.profile_id,
					profile_name: profile.profile_name,
					check_in_time: attendanceInfo?.time || null,
					attendance: attendanceInfo?.present || false,
					check_in_image: attendanceInfo?.photo || null,
				};
			});
		});

		// Sort dates in descending order
		const sortedData = Object.fromEntries(
			Object.entries(groupedData).sort((a, b) => {
				const dateA = new Date(a[0]);
				const dateB = new Date(b[0]);
				return dateB - dateA;
			})
		);

		setDataGroupByDate(sortedData);
	}

	useEffect(() => {
		const fetchData = async () => {
			try {
				const userid = await getUserId();

				// Fetch all profiles under this admin
				const profilesResponse = await fetch(
					`${API_URL}/profiles_by_admin/${userid}/`
				);
				if (!profilesResponse.ok) {
					throw new Error("Failed to fetch profiles");
				}
				const profiles = await profilesResponse.json();
				setProfiles(profiles);

				// Fetch attendance records
				const attendanceResponse = await fetch(
					`${API_URL}/attendance/${userid}/`
				);
				if (!attendanceResponse.ok) {
					throw new Error("Failed to fetch attendance data");
				}
				const attendanceData = await attendanceResponse.json();
				processData(profiles, attendanceData);
			} catch (error) {
				console.error("Error fetching data:", error);
				setError(error.message);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, []);

	if (loading)
		return (
			<div style={{ textAlign: "center", margin: "20px" }}>
				<CircularProgress />
			</div>
		);
	if (error) {
		return <div>Error: {error}</div>;
	}

	if (dataGroupByDate === null || Object.keys(dataGroupByDate).length === 0) {
		return (
			<Alert severity="info">
				No attendance data found. Please add attendance data to show analysis.
			</Alert>
		);
	}

	return (
		<div style={containerStyle}>
			<div style={monthlyHeatMapStyle}>
				<MonthlyHeatMap attendanceData={dataGroupByDate} />
			</div>
			<div style={rowStyle}>
				<div style={chartContainerStyle}>
					<Past10DaysLineGraph
						attendanceData={dataGroupByDate}
						profileCount={profiles.length}
					/>
				</div>
				<div style={chartContainerStyle}>
					<AttendancePercentagePieChart attendanceData={dataGroupByDate} />
				</div>
			</div>
		</div>
	);
};

const containerStyle = {
	display: "flex",
	flexDirection: "column",
	alignItems: "center",
	justifyContent: "center",
	padding: "20px",
};

const monthlyHeatMapStyle = {
	width: "100%",
	marginBottom: "20px",
};

const rowStyle = {
	display: "flex",
	justifyContent: "space-between",
	width: "100%",
};

const chartContainerStyle = {
	width: "48%",
};

export default DataVisualizationAnalyzer;
