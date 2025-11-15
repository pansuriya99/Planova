import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaLock } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import { FiEye, FiEyeOff } from "react-icons/fi";
import GoogleAuthButton from "./GoogleAuthButton";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Login() {
  const API = import.meta.env.VITE_BACKEND_URL;
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const navigate = useNavigate();

  const validate = () => {
    const newErrors = { email: "", password: "" };
    if (!email) newErrors.email = "Email is required";
    else if (!email.includes("@") || !email.includes("."))
      newErrors.email = "Invalid email format";
    if (!password) newErrors.password = "Password is required";
    return newErrors;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setHasSubmitted(true);

    const validationErrors = validate();
    setErrors(validationErrors);
    if (validationErrors.email || validationErrors.password) return;

    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        //  Save token in localStorage
        localStorage.setItem("token", data.token);
        toast.success("Login successful!");

        //  Secure role-based redirect
        setTimeout(async () => {
          try {
            const userRes = await fetch(`${API}/users`, {
              headers: { Authorization: `Bearer ${data.token}` },
            });
            const userData = await userRes.json();

            if (userData?.user?.role === "admin") {
              navigate("/admin");
            } else {
              navigate("/dashboard");
            }
          } catch (error) {
            console.error(error);
            navigate("/dashboard");
          }
        }, 1500);
      } else {
        // Handle backend errors
        if (data.message?.toLowerCase().includes("email")) {
          toast.error("This email account does not exist");
        } else if (data.message?.toLowerCase().includes("password")) {
          toast.error("Incorrect password", { autoClose: 3000 });
        } else {
          toast.error(data.message || "Login failed");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  //  Auto-redirect if already logged in
  useEffect(() => {
    const checkLogin = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await fetch(`${API}/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (data?.user?.role === "admin") navigate("/admin");
        else if (data?.user) navigate("/dashboard");
      } catch {
        // invalid token
        localStorage.removeItem("token");
      }
    };

    checkLogin();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen text-black px-4">
      <ToastContainer position="top-right" />
      <div className="w-full max-w-md p-6 space-y-6">
        <div className="w-16 h-16 flex items-center justify-center mx-auto">
          <img
            src="/src/assets/logo.png"
            alt="logo"
            className="w-16 h-16 p-[1px]"
          />
        </div>

        <GoogleAuthButton />

        <div className="flex items-center">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-2 text-gray-500 text-sm">or</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        <form className="space-y-4" onSubmit={handleLogin}>
          {/* Email Field */}
          <div className="relative flex flex-col">
            <div className="relative flex items-center">
              <MdEmail className="absolute left-3 text-gray-500" />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none ${
                  hasSubmitted && errors.email
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                disabled={loading}
              />
            </div>
            {hasSubmitted && errors.email && (
              <span className="text-red-500 text-xs mt-1">{errors.email}</span>
            )}
          </div>

          {/* Password Field */}
          <div className="relative flex flex-col">
            <div className="relative flex items-center">
              <FaLock className="absolute left-3 text-gray-500" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none ${
                  hasSubmitted && errors.password
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                disabled={loading}
              />
              <button
                type="button"
                className="absolute right-3 text-gray-500"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {hasSubmitted && errors.password && (
              <span className="text-red-500 text-xs mt-1">
                {errors.password}
              </span>
            )}
          </div>

          <button
            type="submit"
            className={`w-full py-2 text-white rounded-lg font-medium transition ${
              loading
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-black hover:bg-gray-800"
            }`}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-center text-gray-600 text-sm">
          Don’t have an account?{" "}
          <Link
            to="/signup"
            className="text-black font-semibold hover:underline"
          >
            create one
          </Link>
        </p>
      </div>
    </div>
  );
}
