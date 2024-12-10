import React from "react";
import { Navigate } from "react-router-dom";
import { touchIDAuth } from "../services/touchIDAuth";
import ProtectedRoute from "./ProtectedRoute";

const AdminRouteContent = ({ children }) => {
	if (!touchIDAuth.isInProtectedArea()) {
		return <Navigate to="/welcome" replace />;
	}

	return children;
};

const AdminRoute = ({ children }) => {
	return (
		<ProtectedRoute>
			<AdminRouteContent>{children}</AdminRouteContent>
		</ProtectedRoute>
	);
};

export default AdminRoute;
