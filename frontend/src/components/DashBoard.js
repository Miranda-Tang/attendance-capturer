import React, { useState, useEffect } from "react";
import { getUserId, getSignedImageUrl } from "../services/profilepics";
import Box from "@mui/material/Box";
import { DataGrid } from "@mui/x-data-grid";
import AddProfileModal from "./AddProfileModal";
import EditProfileModal from "./EditProfileModal";
import Modal from "@mui/material/Modal";
import {AppBar, Toolbar, Container, CircularProgress, Typography, Tooltip, IconButton} from "@mui/material";
import Button from "@mui/material/Button";
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ModeEditOutlineIcon from '@mui/icons-material/ModeEditOutline';
import "./css/Dashboard.css"

const API_URL = process.env.REACT_APP_API_URL;

const DashBoard = () => {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [previewImageUrl, setPreviewImageUrl] = useState(null);
    const [selectedRow, setSelectedRow] = useState(null);
    const [signedImageUrl, setSignedImageUrl] = useState(null);

    const columns = [
        { field: "profile_id", headerName: "ID", width: 120 },
        { field: "profile_name", headerName: "Name", width: 150 },
        {
            field: "profile_image",
            headerName: "Profile Image",
            width: 200,
            renderCell: (params) => (
                <button
                    onClick={() => handlePreviewClick(params.value)}
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
            ),
        },
    ];

    const handleSaveProfile = async (updatedProfile) => {
        try {
            const response = await fetch(`${API_URL}/update_profile/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    profileID: updatedProfile.profile_id,
                    profileName: updatedProfile.profile_name,
                    profileImageUrl: updatedProfile.profile_image,
                }),
            });
            if (response.ok) {
                setFiles((prevFiles) =>
                    prevFiles.map((file) =>
                        file.profile_id === updatedProfile.profile_id
                            ? updatedProfile
                            : file
                    )
                );
                setShowEditModal(false);
            } else {
                const errorData = await response.json();
                setError(errorData.message);
            }
        } catch (err) {
            setError(err.message);
        }
    };

    const loadFiles = async () => {
        try {
            const userid = await getUserId();
            const response = await fetch(`${API_URL}/profiles_by_admin/${userid}/`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch profiles");
            }

            const profiles = await response.json();
            const formattedFiles = profiles.map((profile, index) => ({
                id: index + 1,
                profile_id: profile.profile_id,
                profile_name: profile.profile_name,
                profile_image: profile.profile_image,
            }));

            setFiles(formattedFiles);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
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

    useEffect(() => {
        loadFiles();
    }, []);

    if (loading) return <div style={{ textAlign: "center", margin: "20px" }}><CircularProgress /></div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div>
            <AppBar position="static" sx={{ background: "#fff", marginBottom: "20px" }}>
                <Container maxWidth="xl">
                    <Toolbar disableGutters>
                        <h2 style={{ color: "#000", width: "100%" }}>Dashboard</h2>
                    </Toolbar>
                </Container>
            </AppBar>
            <div
                style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    marginBottom: "20px",
                }}
            >
                <Tooltip title="Add Profile" arrow>
                    <IconButton color="primary"
                                onClick={() => setShowAddModal(true)}
                                style={{ marginRight: "20px",
                                    width: "60px",
                                    height: "40px",
                                    borderRadius: "4px",
                                }}
                    >
                        <PersonAddIcon />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Edit Profile" arrow>
                    <IconButton color="primary"
                                onClick={() => setShowEditModal(true)}
                                disabled={!selectedRow}
                                style={{
                                    cursor: selectedRow ? "pointer" : "not-allowed",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    textTransform: "none",
                                    width: "60px",
                                    height: "40px",
                                    borderRadius: "4px",
                                }}
                    >
                        <ModeEditOutlineIcon />
                    </IconButton>
                </Tooltip>
            </div>
            <Box sx={{ height: 400, width: "100%" }}>
                <DataGrid
                    rows={files}
                    columns={columns}
                    pageSize={5}
                    rowsPerPageOptions={[5, 10, 20]}
                    disableSelectionOnClick
                    onRowClick={(params) => setSelectedRow(params.row)}
                    sx={{
                        boxShadow: 2,
                        border: 1,
                        borderColor: "grey.400",
                        "& .MuiDataGrid-cell:hover": {
                            color: "primary.main",
                        },
                    }}
                />
            </Box>
            {showAddModal && (
                <AddProfileModal
                    onClose={() => setShowAddModal(false)}
                    onProfileAdded={loadFiles}
                />
            )}
            {showEditModal && (
                <EditProfileModal
                    profile={selectedRow}
                    onClose={() => setShowEditModal(false)}
                    onSave={handleSaveProfile}
                />
            )}
            <Modal
                open={!!previewImageUrl}
                onClose={() => {
                    setPreviewImageUrl(null);
                    setSignedImageUrl(null);
                }}
            >
                <Box
                    sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: 400,
                        bgcolor: "background.paper",
                        boxShadow: 24,
                        p: 4,
                    }}
                >
                    {signedImageUrl ? (
                        <img src={signedImageUrl} alt="Preview" style={{ width: "100%" }} />
                    ) : (
                        <div>Loading image...</div>
                    )}
                </Box>
            </Modal>
        </div>
    );
};

export default DashBoard;
