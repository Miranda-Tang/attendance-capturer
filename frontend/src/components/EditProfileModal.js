import React, { useState } from "react";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import DragDrop from "./DragDrop";
import {Button} from "@mui/material";

const EditProfileModal = ({ profile, onClose, onSave }) => {
    const [profileName, setProfileName] = useState(profile.profile_name);
    const [profileImage, setProfileImage] = useState(profile.profile_image);
    const [newImageUrl, setNewImageUrl] = useState(null);

    const handleSave = () => {
        const updatedProfile = {
            ...profile,
            profile_name: profileName,
            profile_image: newImageUrl || profileImage,
        };
        onSave(updatedProfile);
    };

    const isValidProfileName = /^[a-zA-Z0-9\s]*$/.test(profileName) && profileName.length < 60 && profileName.trim().length > 0;


    return (
        <Modal open={true} onClose={onClose}>
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
                <h2>Edit Profile</h2>
                <TextField
                    required
                    id="profileName"
                    label="Profile Name"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    style={{ marginBottom: "20px" }}
                    helperText={
                        !isValidProfileName
                            ? "Profile Name must contain only letters, numbers, spaces, and be less than 60 characters"
                            : ""
                    }
                    error={!isValidProfileName && profileName.length > 0}
                />
                <DragDrop
                    profileID={profile.profile_id}
                    onUploadSuccess={(url) => setNewImageUrl(url)}
                />
                <Button variant="outlined" onClick={handleSave}>Save</Button>
            </Box>
        </Modal>
    );
};

export default EditProfileModal;