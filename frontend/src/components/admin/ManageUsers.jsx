import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Trash2, X } from "lucide-react";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  //  Fetch all users
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("No token found. Please log in again.");
        return;
      }

      const res = await fetch("http://localhost:5000/api/users", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      // console.log("Response:", data);

      if (res.ok && data.success && Array.isArray(data.users)) {
        //  Show only users with role "user"
        setUsers(data.users.filter((u) => u.role === "user"));
      } else {
        toast.error(data.message || "Failed to fetch users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Network error while fetching users");
    }
  };

  //  Handle delete confirm click
  const confirmDelete = (user) => {
    setSelectedUser(user);
    setShowConfirm(true);
  };

  // Delete API call
  const handleDelete = async () => {
    if (!selectedUser) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:5000/api/users/${selectedUser._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();
      if (res.ok && data.success) {
        setUsers(users.filter((u) => u._id !== selectedUser._id));
      } else {
        toast.error(data.message || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Error deleting user");
    } finally {
      setShowConfirm(false);
      setSelectedUser(null);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">All Users</h2>

      {users.length === 0 ? (
        <p className="text-gray-500">No users found</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-transparent">
            <thead>
              <tr className="text-left text-gray-600 font-semibold border-b border-gray-200">
                <th className="py-3 px-4">Full Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Created At</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user._id}
                  className="hover:bg-gray-50 transition-all cursor-pointer"
                >
                  <td className="py-3 px-4">{user.fullName}</td>
                  <td className="py-3 px-4">{user.email}</td>
                  <td className="py-3 px-4">
                    {new Date(user.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => confirmDelete(user)}
                      className="text-red-600 hover:text-red-500 transition cursor-pointer"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/*  Delete Confirmation Modal */}
      {showConfirm && selectedUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full text-center">
            <div className="text-xl font-bold mb-4">Delete Confirmation</div>
            <p className="text-gray-600 text-sm mb-5">
              Are you sure you want to delete{" "}
              <span className="font-medium text-red-600">
                {selectedUser.fullName}
              </span>
              ?
            </p>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
