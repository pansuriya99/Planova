import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Routes, Route } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import DashboardContent from "./DashboardContent";
import DashHome from "../../pages/dashboard/DashHome";
import NotesPage from "../../pages/notes/NotesPage";
import TasksPage from "../../pages/tasks/TasksPage";
import EventsPage from "../../pages/events/EventsPage";
import FinancePage from "../../pages/Finances/FinancePage";
import HabitsPage from "../../pages/Habits/HabitsPage";
import StripePage from "../../pages/Stripes/StripePage";
import { isLoginRequired, removeToken, getToken } from "../../utils/TokenCheck";
import { jwtDecode } from "jwt-decode";
import { toast } from "react-toastify";

export default function Dashboard() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const tokenFromUrl = query.get("token");

    if (tokenFromUrl) {
      localStorage.setItem("token", tokenFromUrl);
      window.history.replaceState({}, document.title, "/dashboard");
    }

    const token = tokenFromUrl || getToken();

    //  Check token presence or expiry
    if (!token || isLoginRequired()) {
      removeToken();
      toast.error("Token is invalid or expired. Please login again.");
      navigate("/login");
      return;
    }

    // Decode and validate role
    try {
      const decoded = jwtDecode(token);
      if (decoded.role === "admin") {
        //  Block admin from entering user dashboard
        navigate("/admin");
        return;
      }
    } catch {
      removeToken();
      navigate("/login");
      return;
    }

    //  Fetch user info securely
    fetch(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
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
  }, [navigate]);
  // console.log("ttttttttttt",user);

  //  Close profile dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  //  Page title mapping
  const pathTitleMap = {
    "/dashboard": "Dashboard",
    "/dashboard/notes": "Notes",
    "/dashboard/tasks": "Tasks",
    "/dashboard/events": "Events",
    "/dashboard/finance": "Finance",
    "/dashboard/habits": "Habits",
    "/dashboard/stripe": "Stripe",
  };

  const activeItem = pathTitleMap[location.pathname] || "Dashboard";

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

        <DashboardContent>
          <Routes>
            <Route index element={<DashHome />} />
            <Route path="notes" element={<NotesPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="finance" element={<FinancePage />} />
            <Route path="habits" element={<HabitsPage />} />
            <Route path="stripe" element={<StripePage />} />
          </Routes>
        </DashboardContent>
      </div>
    </div>
  );
}
