import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaUser, FaLock } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import { FiEye, FiEyeOff } from "react-icons/fi";
import GoogleAuthButton from "./GoogleAuthButton";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Signup() {
  const API = import.meta.env.VITE_BACKEND_URL;
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const validateFields = () => {
    const newErrors = {};

    if (!fullName.trim()) {
      newErrors.fullName = "Full Name is required";
    } else if (!/^[A-Za-z\s]+$/.test(fullName)) {
      newErrors.fullName = "Full Name can only contain letters and spaces";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Invalid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6 || password.length > 10) {
      newErrors.password = "Password must be 6 to 10 characters";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const fieldErrors = validateFields();
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Registration failed");
        if (data.message.includes("Email")) setErrors({ email: data.message });
        if (data.message.includes("Full Name"))
          setErrors({ fullName: data.message });
        setLoading(false);
        return;
      }

      //  Store token securely
      localStorage.setItem("token", data.token);
      toast.success("Registered successfully!");

      //  Secure redirect based on role from backend
      setTimeout(async () => {
        try {
          const res = await fetch(`${API}/users`, {
            headers: { Authorization: `Bearer ${data.token}` },
          });
          const userData = await res.json();

          if (userData?.user?.role === "admin") {
            navigate("/admin");
          } else {
            navigate("/dashboard");
          }
        } catch {
          navigate("/dashboard");
        }
      }, 1000);
    } catch (err) {
      console.error(err);
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (googleData) => {
    if (loading) return;
    setLoading(true);
    setErrors({});

    try {
      const response = await fetch(`${API}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: googleData.token }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Google signup failed");
        if (data.message.includes("Email")) setErrors({ email: data.message });
        setLoading(false);
        return;
      }

      localStorage.setItem("token", data.token);
      toast.success("Logged in with Google successfully!");

      // Secure role-based redirect
      setTimeout(async () => {
        try {
          const res = await fetch(`${API}/users`, {
            headers: { Authorization: `Bearer ${data.token}` },
          });
          const userData = await res.json();

          if (userData?.user?.role === "admin") {
            navigate("/admin");
          } else {
            navigate("/dashboard");
          }
        } catch {
          navigate("/dashboard");
        }
      }, 1000);
    } catch (err) {
      console.error(err);
      toast.error("Google signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen text-black px-4">
      <div className="w-full max-w-md p-6 space-y-6">
        <div className="w-16 h-16 flex items-center justify-center mx-auto">
          <img
            src="/src/assets/logo.png"
            alt="logo"
            className="w-16 h-16 p-[1px]"
          />
        </div>

        <GoogleAuthButton onSuccess={handleGoogleSuccess} />

        <div className="flex items-center">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-2 text-gray-500 text-sm">or</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {errors.general && (
          <p className="text-red-500 text-sm text-center">{errors.general}</p>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className="relative flex flex-col">
            <div className="relative flex items-center">
              <FaUser className="absolute left-3 text-gray-500" />
              <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none ${
                  errors.fullName ? "border-red-500" : "border-gray-300"
                }`}
              />
            </div>
            {errors.fullName && (
              <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>
            )}
          </div>

          {/* Email */}
          <div className="relative flex flex-col">
            <div className="relative flex items-center">
              <MdEmail className="absolute left-3 text-gray-500" />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none ${
                  errors.email ? "border-red-500" : "border-gray-300"
                }`}
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div className="relative flex flex-col">
            <div className="relative flex items-center">
              <FaLock className="absolute left-3 text-gray-500" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none ${
                  errors.password ? "border-red-500" : "border-gray-300"
                }`}
              />
              <button
                type="button"
                className="absolute right-3 text-gray-500"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition font-medium disabled:opacity-50"
          >
            {loading ? "Signing Up..." : "Sign Up"}
          </button>
        </form>

        <p className="text-center text-gray-600 text-sm">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-black font-semibold hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
