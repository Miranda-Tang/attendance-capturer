import React from "react";
import { Navigate } from "react-router-dom";
import { getTokens } from "../services/auth";

const ProtectedRoute = ({ children }) => {
	const { idToken } = getTokens();

	if (!idToken) {
		return <Navigate to="/login" replace />;
	}

	return children;
};

export default ProtectedRoute;
