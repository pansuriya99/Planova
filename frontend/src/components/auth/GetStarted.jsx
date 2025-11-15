import { useNavigate } from "react-router-dom";

export default function GetStarted() {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-full bg-white flex items-center justify-center px-4">
      <div className="text-center max-w-lg md:max-w-2xl lg:max-w-3xl space-y-6">
        {/* Logo / Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-black mb-4 animate-fadeIn">
          PLANOVA
        </h1>

        {/* Subtitle */}
        <p className="text-md sm:text-lg md:text-xl font-medium text-gray-700 mb-8 animate-slideUp">
          Your Personal Digital Life Organizer – Simplify, Plan & Achieve
        </p>

        {/* Get Started Button */}
        <button
          onClick={() => navigate("/login")}
          className="px-8 py-3 bg-black text-white font-semibold rounded-3xl shadow-lg hover:bg-gray-800 hover:scale-105 transform transition duration-300"
        >
          Get Started →
        </button>

        {/* Optional small tagline */}
        <p className="text-sm text-gray-500 mt-4">
          Plan smarter, achieve faster.
        </p>
      </div>
    </div>
  );
}
