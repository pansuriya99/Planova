import React from "react";
import {
  User,
  LayoutDashboard,
  StickyNote,
  CheckSquare,
  Calendar,
  DollarSign,
  Clock,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function AdminSidebar({ isOpen, setIsOpen }) {
  const location = useLocation();

  const menuItems = [
    {
      name: "Admin Dashboard",
      icon: <LayoutDashboard size={20} />,
      path: "/admin",
    },
    {
      name: "Manage Users",
      icon: <User size={20} />,
      path: "/admin/manage-users",
    },
    //     {
    //       name: "Manage Tasks",
    //       icon: <CheckSquare size={20} />,
    //       path: "/admin/manage-tasks",
    //     },
    //  { name: "Manage Events", icon: <Calendar size={20} />, path: "/admin/manage-events" },
    //     {
    //       name: "Manage Finance",
    //       icon: <DollarSign size={20} />,
    //       path: "/admin/manage-finance",
    //     },
    //     {
    //       name: "Manage Habits",
    //       icon: <Clock size={20} />,
    //       path: "/admin/manage-habits",
    //     },
    //     { name: "Manage Notes", icon: <StickyNote size={20} />, path: "/admin/manage-notes" }
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-10 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static top-0 left-0 z-20 h-full w-60 bg-white shadow-md p-4 transition-transform transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        {/* Logo Section */}
        <div className="flex items-center gap-2 mb-6">
          <img
            src="/src/assets/logo.png"
            alt="Logo"
            className="w-8 h-8 rounded-full"
          />
          <h2 className="text-xl font-bold text-gray-700">PLANOVA</h2>
        </div>

        {/* Menu Items */}
        <ul className="space-y-3">
          {menuItems.map((item, idx) => (
            <li key={idx}>
              <Link
                to={item.path}
                className={`flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-all
                  ${
                    item.name === "Admin Dashboard" &&
                    location.pathname === item.path
                      ? "bg-gray-200 text-gray-900 font-bold text-lg" // Dashboard active
                      : item.name === "Admin Dashboard"
                      ? "font-bold text-lg" // Always bold for dashboard
                      : location.pathname === item.path
                      ? "bg-gray-200 text-gray-900 font-bold" // Other active
                      : "text-gray-700" // Inactive
                  }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </aside>
    </>
  );
}
