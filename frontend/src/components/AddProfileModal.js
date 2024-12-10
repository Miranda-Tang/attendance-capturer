import React, { useState } from "react";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import DragDrop from "./DragDrop";
import TextField from "@mui/material/TextField";
import { createProfile } from "../services/api";
import { getTokens } from "../services/auth";
import {Step, StepLabel, Stepper} from "@mui/material";
import Button from "@mui/material/Button";

const AddProfileModal = ({ onClose, onProfileAdded }) => {
    const [activeStep, setActiveStep] = useState(0);
    const [profileID, setProfileID] = useState("");
    const [profileName, setProfileName] = useState("");
    const [uploadStatus, setUploadStatus] = useState(null);
    const steps = ["Enter Profile ID And Name",  "Upload Profile"];

    const handleNext = () => {
        if (activeStep < steps.length - 1) {
            setActiveStep((prevStep) => prevStep + 1);
        }
    };


    const handleBack = () => {
        setActiveStep((prevStep) => prevStep - 1);
    };

    const isNextDisabled = () => {
        if (activeStep === 0) {
            return !isValidProfileID  || !isValidProfileName;
        } else if (activeStep === 1) {
            return uploadStatus !== null && uploadStatus.type !== "success";
        }
        return false;
    };

    const isValidProfileID = /^[a-zA-Z0-9]*$/.test(profileID) && profileID.trim().length > 0 && profileID.length < 60;
    const isValidProfileName = /^[a-zA-Z0-9\s]*$/.test(profileName) && profileName.length < 60 && profileName.trim().length > 0;

    const handleProfileCreation = async (s3ImageUrl) => {
        try {
            const { idToken } = getTokens();
            const payload = JSON.parse(atob(idToken.split(".")[1]));
            const adminID = payload.sub;


            await createProfile({
                profileID: profileID,
                profileName: profileName,
                profileImageUrl: s3ImageUrl,
                adminID: adminID,
            });

            setUploadStatus({
                type: "success",
                message: "Profile created successfully!",
            });

            setTimeout(() => {
                onClose();
                if (typeof onProfileAdded === 'function') {
                    onProfileAdded();
                } else {
                    console.error("onProfileAdded is not a function");
                }
            }, 2000);
        } catch (error) {
            setUploadStatus({ type: "error", message: error.message });
        }
    };

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
                <h2>Add New Profile</h2>
                <Stepper activeStep={activeStep} alternativeLabel>
                    {steps.map((label, index) => (
                        <Step key={index}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>
                <Box sx={{ mt: 3 }}>
                    {activeStep === 0 && (
                        <div>
                        <TextField
                            required
                            id="profileID"
                            label="Profile ID"
                            value={profileID}
                            onChange={(e) => setProfileID(e.target.value)}
                            fullWidth
                            margin="normal"
                            helperText={
                                !isValidProfileID
                                    ? "Profile ID must be alphanumeric and less than 60 characters"
                                    : ""
                            }
                            error={!isValidProfileID && profileID.length > 0}
                        />
                        <TextField
                        required
                        id="profileName"
                        label="Profile Name"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        fullWidth
                        margin="normal"
                        helperText={
                            !isValidProfileName
                                ? "Profile Name must contain only letters, numbers, spaces, and be less than 60 characters"
                                : ""
                        }
                        error={!isValidProfileName && profileName.length > 0}
                        />
                        </div>
                    )}
                    {activeStep === 1 && (
                        <DragDrop profileID={profileID} onUploadSuccess={handleProfileCreation} />
                    )}
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
                    <Button
                        disabled={activeStep === 0}
                        onClick={handleBack}
                        variant="outlined"
                    >
                        Back
                    </Button>
                    <Button
                        onClick={handleNext}
                        variant="contained"
                        disabled={isNextDisabled()}
                    >
                        {activeStep === steps.length - 1 ? "Finish" : "Next"}
                    </Button>

                </Box>
                {uploadStatus && (
                    <div className={`status-message ${uploadStatus.type}`} style={{ marginTop: "20px" }}>
                        {uploadStatus.message}
                    </div>
                )}
            </Box>
        </Modal>
    );
};

export default AddProfileModal;
