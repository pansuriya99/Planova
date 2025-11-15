import React from "react";

export default function Navbar({
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
      <div className="flex items-center gap-3">
        <button
          className="md:hidden p-2 text-3xl font-bold cursor-pointer"
          onClick={toggleSidebar}
        >
          ☰
        </button>
        <h1 className="font-bold text-gray-700 text-2xl ml-1">{activeItem}</h1>
      </div>

      <div className="relative flex items-center gap-4" ref={profileRef}>
        <div
          className="w-10 h-10 text-lg rounded-full shadow-lg p-4 z-50 cursor-pointer text-center flex items-center justify-center font-bold hover:bg-gray-100"
          onClick={() => setShowProfile((prev) => !prev)}
        >
          {getInitials(user?.fullName)}
        </div>

        {showProfile && (
          <div className="absolute right-2 top-2 mt-12 w-64 bg-white rounded shadow-lg p-4 z-50">
            <div className="flex items-center gap-3 mb-3">
              <div>
                <h3 className="font-semibold text-gray-800">
                  {user?.fullName || "User"}
                </h3>
                <p className="text-gray-500 text-sm">
                  {user?.email || "No Email"}
                </p>
              </div>
            </div>
            <button
              className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-500 cursor-pointer"
              onClick={() => {
                localStorage.removeItem("token");
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
