import React from "react";
import { Navigate } from "react-router-dom";
import { toast } from "react-toastify";

const ProtectedRoute = ({ children, allowedRole }) => {
  const token = localStorage.getItem("token");
  const user = token ? JSON.parse(atob(token.split(".")[1])) : null;

  if (!token || !user) {
    toast.error("Please login first!");
    return <Navigate to="/login" replace />;
  }

  // Token expired (optional check if backend doesn't already handle)
  const currentTime = Date.now() / 1000;
  if (user.exp && user.exp < currentTime) {
    localStorage.removeItem("token");
    toast.error("Session expired. Please login again.");
    return <Navigate to="/login" replace />;
  }

  //  Prevent unauthorized access
  if (allowedRole && user.role !== allowedRole) {
    toast.error("Unauthorized access!");
    return (
      <Navigate to={user.role === "admin" ? "/admin" : "/dashboard"} replace />
    );
  }

  return children;
};

export default ProtectedRoute;
