import "./App.css";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/dashboard/ProtectedRoute";

import Dashboard from "./components/dashboard/Dashboard";
import Auth from "./components/auth/Auth";
import Admin from "./components/admin/Admin";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <>
      <Routes>
        {/* Auth Routes */}
        <Route path="/*" element={<Auth />} />

        {/* Protected User Dashboard */}
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute allowedRole="user">
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Protected Admin Panel */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRole="admin">
              <Admin />
            </ProtectedRoute>
          }
        />
      </Routes>

      {/* Toast for error and sucess */}
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}

export default App;
