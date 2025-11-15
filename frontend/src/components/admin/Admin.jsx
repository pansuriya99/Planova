import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Routes, Route } from "react-router-dom";
import Navbar from "./AdminNavbar";
import Sidebar from "./AdminSidebar";
import AdminDashboardContent from "./AdminDashboardContent";
import AdminHome from "./AdminHome";
import ManageUsers from "./ManageUsers";
// import ManageTasks from "./ManageTasks";
// import ManageEvents from "./ManageEvents";
// import ManageFinances from "./ManageFinances";
// import ManageHabits from "./ManageHabits";
// import ManageNotes from "./ManageNotes";
import { isLoginRequired, removeToken, getToken } from "../../utils/TokenCheck";
import { jwtDecode } from "jwt-decode";
import { toast } from "react-toastify";

export default function AdminDashboard() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = getToken();

    // Validate token existence
    if (!token || isLoginRequired()) {
      removeToken();
      toast.error("Session expired or invalid. Please login again.");
      navigate("/login");
      return;
    }

    try {
      const decoded = jwtDecode(token);

      // Allow only admin
      if (decoded.role !== "admin") {
        toast.error("Access denied. Admins only.");
        navigate("/dashboard"); // redirect non-admin users
        return;
      }

      // Fetch admin data securely
      fetch(
        `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/me`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
        .then((res) => {
          if (!res.ok) throw new Error("Unauthorized");
          return res.json();
        })
        .then((data) => setUser(data.user || data))
        .catch(() => {
          removeToken();
          toast.error("Session expired. Please login again.");
          navigate("/login");
        });
    } catch (err) {
      removeToken();
      navigate("/login");
    }
  }, [navigate]);

  // Close profile dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const pathTitleMap = {
    "/admin": "Admin Dashboard",
    "/admin/manage-users": "Manage Users",
    // "/admin/manage-notes": "Manage Notes",
    // "/admin/manage-tasks": "Manage Tasks",
    // "/admin/manage-events": "Manage Events",
    // "/admin/manage-finance": "Manage Finance",
    // "/admin/manage-habits": "Manage Habits",
  };
  const activeItem = pathTitleMap[location.pathname] || "Admin Dashboard";

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar
          user={user}
          activeItem={activeItem}
          showProfile={showProfile}
          setShowProfile={setShowProfile}
          profileRef={profileRef}
          navigate={navigate}
          toggleSidebar={() => setIsOpen(!isOpen)}
        />

        <AdminDashboardContent>
          <Routes>
            <Route index element={<AdminHome />} />
            <Route path="manage-users" element={<ManageUsers />} />
            {/* <Route path="manage-tasks" element={<ManageTasks />} />
            <Route path="manage-events" element={<ManageEvents />} />
            <Route path="manage-finance" element={<ManageFinances />} />
            <Route path="manage-habits" element={<ManageHabits />} />
            <Route path="manage-notes" element={<ManageNotes />} /> */}
            {/* Add more admin routes here later */}
          </Routes>
        </AdminDashboardContent>
      </div>
    </div>
  );
}
