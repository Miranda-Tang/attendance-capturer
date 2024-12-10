import * as React from "react";
import dayjs from "dayjs";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { DataGrid } from "@mui/x-data-grid";
import { CircularProgress, Alert, Box, Modal, Typography } from "@mui/material";
import { getUserId, getSignedImageUrl } from "../services/profilepics";

const API_URL = process.env.REACT_APP_API_URL;

export default function AttendanceCalendar() {
  const [selectedDate, setSelectedDate] = React.useState(dayjs().format("YYYY-MM-DD"));
  const [rows, setRows] = React.useState([]);
  const [filteredRows, setFilteredRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [previewImageUrl, setPreviewImageUrl] = React.useState(null);
  const [signedImageUrl, setSignedImageUrl] = React.useState(null);

  const columns = [
    { field: "profile_id", headerName: "ID", width: 150 },
    { field: "profile_name", headerName: "Name", width: 150 },
    { field: "check_in_time", headerName: "Check-in Time", width: 200 },
    {
		field: "attendance",
		headerName: "Attendance",
		width: 150,
		// if value of attendance is true, display a green checkmark
		renderCell: (params) => (params.row.attendance ? "✅" : "❌"),
	},
    {
      field: "check_in_image",
      headerName: "Check-in Image",
      width: 200,
      renderCell: (params) =>
        params.row?.check_in_image ? (
          <button
            onClick={() => handlePreviewClick(params.row.check_in_image)}
            style={{
              background: "none",
              border: "none",
              color: "#007bff",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Preview Image
          </button>
        ) : (
          "No Image Found"
        ),
    },
  ];

  const processData = (profiles, attendanceRecords) => {
	const attendanceByDate = attendanceRecords.reduce((acc, record) => {
	  const date = dayjs(record.timestamp).format("YYYY-MM-DD");
	  const profileId = record.profile.profile_id;
  
	  if (!acc[date]) {
		acc[date] = new Map();
	  }
  
	  if (
		!acc[date].has(profileId) ||
		new Date(record.timestamp) > new Date(acc[date].get(profileId).timestamp)
	  ) {
		acc[date].set(profileId, {
		  timestamp: record.timestamp,
		  photo: record.photo_url,
		  present: !!record.timestamp,
		});
	  }
  
	  return acc;
	}, {});
  
	const groupedRows = {};
	Object.keys(attendanceByDate).forEach((date) => {
	  groupedRows[date] = profiles.map((profile) => {
		const attendanceInfo = attendanceByDate[date].get(profile.profile_id);
		return {
		  id: `${date}-${profile.profile_id}`,
		  profile_id: profile.profile_id,
		  profile_name: profile.profile_name || "Unknown",
		  check_in_time: attendanceInfo
			? new Date(attendanceInfo.timestamp).toLocaleTimeString()
			: null,
		  attendance: !!attendanceInfo?.timestamp,
		  check_in_image: attendanceInfo ? attendanceInfo.photo : null,
		};
	  });
	});
  
	return groupedRows;
  };
  

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = await getUserId();
        const profilesResponse = await fetch(`${API_URL}/profiles_by_admin/${userId}/`);
        if (!profilesResponse.ok) throw new Error("Failed to fetch profiles");
        const profiles = await profilesResponse.json();

        const attendanceResponse = await fetch(`${API_URL}/attendance/${userId}/`);
        if (!attendanceResponse.ok) throw new Error("Failed to fetch attendance data");
        const attendanceData = await attendanceResponse.json();

        const groupedData = processData(profiles, attendanceData);
        setRows(groupedData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  React.useEffect(() => {
    if (rows[selectedDate]) {
      setFilteredRows(rows[selectedDate]);
    } else {
      setFilteredRows([]);
    }
  }, [selectedDate, rows]);

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate.format("YYYY-MM-DD"));
  };

  const handlePreviewClick = async (imageUrl) => {
    try {
      const signedUrl = await getSignedImageUrl(imageUrl);
      setSignedImageUrl(signedUrl);
      setPreviewImageUrl(imageUrl);
    } catch (error) {
      console.error("Error getting signed URL for preview:", error);
    }
  };

  const handleCloseModal = () => {
    setPreviewImageUrl(null);
    setSignedImageUrl(null);
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <div style={{ margin: "20px" }}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DateCalendar
          value={dayjs(selectedDate)}
          onChange={(newValue) => handleDateChange(newValue)}
        />
      </LocalizationProvider>

      <Box sx={{ height: 400, width: "100%", marginTop: "20px" }}>
        {filteredRows.length === 0 ? (
          <Alert severity="info">No attendance data for the selected date.</Alert>
        ) : (
          <DataGrid
            rows={filteredRows}
            columns={columns}
            pageSize={5}
            rowsPerPageOptions={[5, 10, 20]}
            disableSelectionOnClick
          />
        )}
      </Box>

      <Modal
        open={!!previewImageUrl}
        onClose={handleCloseModal}
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            maxWidth: 500,
            maxHeight: 500,
          }}
        >
          {signedImageUrl ? (
            <img
              src={signedImageUrl}
              alt="Preview"
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                display: "block",
                margin: "0 auto",
              }}
            />
          ) : (
            <Typography>Loading image...</Typography>
          )}
        </Box>
      </Modal>
    </div>
  );
}
