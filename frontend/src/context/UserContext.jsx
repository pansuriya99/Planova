import React, { createContext, useContext, useState, useEffect } from "react";
import { getToken, isLoginRequired, removeToken } from "../utils/TokenCheck";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = getToken();

    if (!token || isLoginRequired()) {
      removeToken();
      toast.error("Token is invalid or expired. Please login again.");
      navigate("/login", { replace: true });
      return;
    }

    /* ------------------- Only fetch user if not already set ------------------- */
    if (!user) {
      fetch(
        `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/me`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
        .then((res) => {
          if (res.status === 401) throw new Error("Unauthorized");
          return res.json();
        })
        .then((data) => setUser(data.user || data))
        .catch(() => {
          removeToken();
          toast.error("Session expired. Please login again.");
          navigate("/login", { replace: true });
        });
    }
  }, [navigate, user]); // reruns only if user changes

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

/* ----------------------- Hook to access user context ---------------------- */
export const useUser = () => useContext(UserContext);
