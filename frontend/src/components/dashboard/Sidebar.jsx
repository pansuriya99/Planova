import React from "react";
import {
  LayoutDashboard,
  StickyNote,
  CheckSquare,
  Calendar,
  DollarSign,
  Clock,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function Sidebar({ isOpen, setIsOpen }) {
  const location = useLocation();

  const menuItems = [
    {
      name: "Dashboard",
      icon: <LayoutDashboard size={20} />,
      path: "/dashboard",
    },
    { name: "Notes", icon: <StickyNote size={20} />, path: "/dashboard/notes" },
    {
      name: "Tasks",
      icon: <CheckSquare size={20} />,
      path: "/dashboard/tasks",
    },
    { name: "Events", icon: <Calendar size={20} />, path: "/dashboard/events" },
    {
      name: "Finance",
      icon: <DollarSign size={20} />,
      path: "/dashboard/finance",
    },
    {
      name: "Habits",
      icon: <Clock size={20} />,
      path: "/dashboard/habits",
    },
    // { name: "Stripe", icon: <DollarSign size={20} />, path: "/dashboard/stripe" },
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-10 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      <aside
        className={`fixed md:static top-0 left-0 z-20 h-full w-60 bg-white shadow-md p-4 transition-transform transform
        ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <div className="flex gap-2  mb-6 items-center">
          <img
            src="/src/assets/logo.png"
            alt="Logo"
            className="w-8 h-8 rounded-full"
          />
          <h2 className="text-xl font-bold  text-gray-700 items-center">
            PLANOVA
          </h2>
        </div>
        <ul className="space-y-3">
          {menuItems.map((item, idx) => (
            <li key={idx}>
              <Link
                to={item.path}
                className={`flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100
                  ${
                    item.name === "Dashboard" && location.pathname === item.path
                      ? "bg-gray-200 text-gray-900 font-bold text-lg" //dashboard active
                      : item.name === "Dashboard"
                      ? "font-bold text-lg" //always for dashboard
                      : location.pathname === item.path
                      ? "bg-gray-200 text-gray-900 font-bold" //other active item
                      : "text-gray-700" //noactive item
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
