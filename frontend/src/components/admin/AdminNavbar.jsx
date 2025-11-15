import React, { useEffect, useState } from "react";

export default function AdminNavbar({
  user,
  activeItem,
  showProfile,
  setShowProfile,
  profileRef,
  navigate,
  toggleSidebar,
}) {
  const getInitials = (fullName) => {
    if (!fullName) return "U";
    const names = fullName.split(" ");
    const firstInitial = names[0]?.[0] || "";
    const lastInitial = names.length > 1 ? names[names.length - 1][0] : "";
    return (firstInitial + lastInitial).toUpperCase();
  };

  return (
    <nav className="bg-white shadow px-4 py-3 flex items-center justify-between relative">
      {/* Sidebar + Page Title */}
      <div className="flex items-center gap-3">
        <button
          className="md:hidden p-2 text-3xl font-bold cursor-pointer focus:outline-none"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
        >
          ☰
        </button>
        <h1 className="font-bold text-gray-700 text-2xl ml-1 capitalize">
          {activeItem || "Admin Dashboard"}
        </h1>
      </div>

      {/* Profile + Dropdown */}
      <div className="relative flex items-center gap-4" ref={profileRef}>
        <div
          className="w-10 h-10 text-lg rounded-full bg-gray-100 shadow-md cursor-pointer flex items-center justify-center font-bold text-gray-700 hover:bg-gray-200 transition"
          onClick={() => setShowProfile((prev) => !prev)}
          title="Profile Menu"
        >
          {getInitials(user?.fullName)}
        </div>

        {showProfile && (
          <div className="absolute right-0 top-12 w-64 bg-white rounded-xl shadow-lg p-4 border border-gray-100 z-50 animate-fadeIn">
            <div className="flex items-center gap-3 mb-3">
              <div>
                <h3 className="font-semibold text-gray-800">
                  {user?.fullName || "Admin User"}
                </h3>
                <p className="text-gray-500 text-sm break-all">
                  {user?.email || "No Email"}
                </p>
              </div>
            </div>
            <button
              className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-500 transition cursor-pointer"
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                navigate("/login", { replace: true });
              }}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
