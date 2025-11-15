import React, { useEffect, useRef, useState } from "react";
import { Plus, Trash2, ArrowLeft, Check, Edit } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const PRIORITY_COLORS = {
  Low: "#2a6f41",
  Medium: "#ff6600",
  High: "#ff1a1a",
};

const STATUS_COLORS = {
  "In Progress": "#0099cc",
  Pending: "#5900b3",
  Completed: "#009900",
};

const API_BASE = "http://localhost:5000/api/tasks";

export default function TaskPage() {
  // ------------------- STATE -------------------
  const [tasks, setTasks] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [viewTask, setViewTask] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const inputRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    startDate: new Date().toISOString(),
    dueDate: "",
    priority: "Medium",
    tags: [],
    ttodo: [],
    status: "Pending",
    newSubTask: "",
    newTag: "",
  });

  // ------------------- UTILITIES -------------------
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token") || "";
    return {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    };
  };

  const normalize = (t) => {
    if (!t) return t;
    return {
      ...t,
      id: t.id || t._id || (t._id ? String(t._id) : undefined),
      _id: t._id || t.id,
      ttodo: Array.isArray(t.ttodo) ? t.ttodo : [],
    };
  };

  const formatDateKey = (date) => new Date(date).toDateString();
  const isSameDate = (d1, d2) =>
    new Date(d1).toDateString() === new Date(d2).toDateString();
  const isTaskScheduledOnDate = (t, date) =>
    t.dueDate ? isSameDate(t.dueDate, date) : true;

  // compute status (use backend-compatible strings)
  const computeStatus = (t) => {
    const total = t.ttodo?.length || 0;
    const completed = t.ttodo?.filter((td) => td.completed).length || 0;
    if (total === 0) return t.status || "Pending";
    if (completed === 0) return "Pending";
    if (completed === total) return "Completed";
    return "In Progress";
  };

  // ------------------- API CALLS -------------------
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_BASE, { headers: getAuthHeaders() });
      const json = await res.json();
      // console.log(" Fetched response:", json);
      if (!res.ok) throw new Error(json?.message || "Failed to fetch tasks");
      const arr = Array.isArray(json?.data) ? json.data : [];

      //  Sort by creation time (oldest first → newest last)
      const sorted = arr.sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );

      setTasks(sorted.map(normalize));
    } catch (err) {
      console.error("fetchTasks error:", err);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const createTaskAPI = async (payload) => {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.message || "Failed to create task");
    return normalize(json.data);
  };

  const updateTaskAPI = async (id, payload) => {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.message || "Failed to update task");
    return normalize(json.data);
  };

  const deleteTaskAPI = async (id) => {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.message || "Failed to delete task");
    return json;
  };

  // ------------------- EFFECTS -------------------
  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if ((showAddModal || showEditModal) && inputRef.current)
      inputRef.current.focus();
  }, [showAddModal, showEditModal]);

  // ------------------- CRUD HANDLERS -------------------
  const openEdit = (task) => {
    const t = normalize(task);
    setEditingTask(t);
    setForm({
      title: t.title || "",
      description: t.description || "",
      startDate: t.startDate || new Date().toISOString(),
      dueDate: t.dueDate
        ? t.dueDate.slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      priority: t.priority || "Medium",
      status: t.status || computeStatus(t),
      tags: t.tags || [],
      ttodo: t.ttodo || [],
      newSubTask: "",
      newTag: "",
    });
    setShowEditModal(true);
  };

  const openAdd = () => {
    setEditingTask(null);
    setForm({
      title: "",
      description: "",
      startDate: new Date().toISOString(),
      dueDate: new Date().toISOString().slice(0, 10),
      priority: "Medium",
      status: "Pending",
      tags: [],
      ttodo: [],
      newSubTask: "",
      newTag: "",
    });
    setShowAddModal(true);
  };

  const openShow = (task) => {
    setViewTask(normalize(task));
    setShowViewModal(true);
  };

  const confirmDelete = (task) => {
    setTaskToDelete(normalize(task));
    setShowDeleteConfirm(true);
  };

  // CREATE
  const handleSaveAdd = async () => {
    try {
      if (!form.title || form.title.trim() === "") return;
      const payload = {
        title: form.title,
        description: form.description,
        startDate: form.startDate,
        dueDate: form.dueDate,
        priority: form.priority,
        ttodo: form.ttodo || [],
        tags: form.tags || [],
        status: computeStatus(form),
      };
      const saved = await createTaskAPI(payload);
      // show immediately (top)
      //   setTasks((prev) => [saved, ...prev]);
      // show immediately (end)
      setTasks((prev) => [...prev, saved]);

      setShowAddModal(false);
      setForm({
        title: "",
        description: "",
        startDate: new Date().toISOString(),
        dueDate: new Date().toISOString().slice(0, 10),
        priority: "Medium",
        status: "Pending",
        tags: [],
        ttodo: [],
        newSubTask: "",
        newTag: "",
      });
    } catch (err) {
      console.error("Add task error:", err);
      // optionally show toast
    }
  };

  // UPDATE (edit)
  const handleSaveEdit = async () => {
    try {
      if (!editingTask) return;
      const id = editingTask.id || editingTask._id;
      const payload = {
        title: form.title,
        description: form.description,
        startDate: form.startDate,
        dueDate: form.dueDate,
        priority: form.priority,
        ttodo: form.ttodo || editingTask.ttodo || [],
        tags: form.tags || editingTask.tags || [],
        // compute status before sending
        status: computeStatus({
          ...editingTask,
          ...form,
          ttodo: form.ttodo || editingTask.ttodo,
        }),
      };
      const saved = await updateTaskAPI(id, payload);
      setTasks((prev) =>
        prev.map((t) => (t.id === saved.id || t._id === saved._id ? saved : t))
      );
      setShowEditModal(false);
      setEditingTask(null);
    } catch (err) {
      console.error("Edit task error:", err);
    }
  };

  // DELETE
  const handleDelete = async (idOrObj) => {
    try {
      const id =
        typeof idOrObj === "string" ? idOrObj : idOrObj?.id || idOrObj?._id;
      if (!id) return;
      await deleteTaskAPI(id);
      setTasks((prev) => prev.filter((t) => t.id !== id && t._id !== id));
      setShowDeleteConfirm(false);
      setTaskToDelete(null);
      if (editingTask?.id === id || editingTask?._id === id)
        setShowEditModal(false);
      if (viewTask?.id === id || viewTask?._id === id) setShowViewModal(false);
    } catch (err) {
      console.error("Delete task error:", err);
    }
  };

  // Toggle a todo checkbox (updates backend)
  const toggleTodo = async (taskId, todoIndex) => {
    try {
      const t = tasks.find((x) => x.id === taskId || x._id === taskId);
      if (!t) return;

      const newTtodo = (t.ttodo || []).map((td, idx) =>
        idx === todoIndex ? { ...td, completed: !td.completed } : td
      );

      const payload = {
        ttodo: newTtodo,
        status: computeStatus({ ...t, ttodo: newTtodo }),
      };

      // optimistic update
      const optimistic = { ...t, ttodo: newTtodo, status: payload.status };
      setTasks((prev) =>
        prev.map((p) => (p.id === t.id || p._id === t._id ? optimistic : p))
      );
      if (viewTask && (viewTask.id === t.id || viewTask._id === t._id))
        setViewTask(optimistic);

      const saved = await updateTaskAPI(t.id || t._id, payload);
      setTasks((prev) =>
        prev.map((p) => (p.id === saved.id || p._id === saved._id ? saved : p))
      );
      if (viewTask && (viewTask.id === saved.id || viewTask._id === saved._id))
        setViewTask(saved);
    } catch (err) {
      console.error("Toggle todo error:", err);
      // fallback: refetch to be consistent
      fetchTasks();
    }
  };

  // // ------------------- FILTER TASKS -------------------

  const remainingTasks = tasks;

  // Use computeStatus to derive totals
  const totalCreated = tasks.length;
  const totalCompleted = tasks.filter(
    (t) => computeStatus(t) === "Completed"
  ).length;
  const totalInProgress = tasks.filter(
    (t) => computeStatus(t) === "In Progress"
  ).length;
  const total = totalCompleted + totalInProgress;
  const totalRemaining = totalCreated - total;

  // ------------------- RENDER -------------------
  return (
    <>
      {/* HEADER STATS */}
      <div className="w-full min-h-[80px] shadow-lg bg-white mb-6 rounded-2xl flex flex-wrap gap-4 justify-around items-center p-4">
        <div className="flex flex-col items-center gap-1 text-lg font-bold">
          <div>{totalCreated}</div>
          <div>Total</div>
        </div>
        <div className="flex flex-col items-center gap-1 text-lg font-bold">
          <div>{totalCompleted}</div>
          <div>Total Completed</div>
        </div>
        <div className="flex flex-col items-center gap-1 text-lg font-bold">
          <div>{totalInProgress}</div>
          <div>Total In Progress</div>
        </div>
        <div className="flex flex-col items-center gap-1 text-lg font-bold">
          <div>{totalRemaining}</div>
          <div>Total Pending</div>
        </div>
      </div>

      {/* MAIN TASK LIST */}
      <div className="w-full rounded-2xl p-6 bg-white mb-4 relative flex justify-center">
        <div className="absolute right-4 top-4">
          <button
            onClick={openAdd}
            className="p-3 rounded-full bg-black text-white shadow-lg hover:scale-110 transition"
            title="Add Task"
          >
            <Plus size={28} />
          </button>
        </div>

        {/* Task Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 mt-16 mb-10 justify-items-center w-full">
          {remainingTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center mt-10 text-gray-500 text-center col-span-3">
              <img
                src="/src/assets/task.png"
                alt="No tasks"
                className="w-34 h-34 mb-4 opacity-70"
              />
              <p className="text-lg font-medium">
                Nothing here yet! Add your first task and start organizing your
                day.
              </p>
            </div>
          ) : (
            remainingTasks.map((t) => {
              const total = t.ttodo?.length || 0;
              const completed =
                t.ttodo?.filter((td) => td.completed).length || 0;
              const progress = total > 0 ? (completed / total) * 100 : 0;
              const displayStatus = computeStatus(t);

              return (
                <div
                  key={t.id || t._id}
                  className="relative rounded-lg p-4 flex flex-col gap-2 cursor-pointer bg-gray-50 shadow-lg transition transform hover:scale-[1.02] min-h-[150px] w-[300px] sm:w-[280px] md:w-[320px] lg:w-[300px] items-center justify-between"
                  onClick={() => openShow(t)}
                >
                  <div className="flex flex-col pl-4 pr-4 w-full">
                    <div className="flex justify-between gap-0 items-center text-center">
                      {displayStatus && (
                        <div
                          className="text-xs font-bold p-1 rounded text-center"
                          style={{
                            color: STATUS_COLORS[displayStatus] || "gray",
                            backgroundColor:
                              displayStatus === "Completed"
                                ? "#e6ffe6"
                                : displayStatus === "In Progress"
                                ? "#e6f9ff"
                                : "#f2e6ff",
                          }}
                        >
                          {displayStatus === "In Progress"
                            ? "In Progress"
                            : displayStatus}
                        </div>
                      )}

                      {t.priority && (
                        <div
                          className="text-xs font-bold p-1 rounded text-center"
                          style={{
                            color: PRIORITY_COLORS[t.priority],
                            backgroundColor:
                              t.priority === "High"
                                ? "#ffe6e6"
                                : t.priority === "Medium"
                                ? "#fff0e6"
                                : "#daf1e2",
                          }}
                        >
                          {t.priority} Priority
                        </div>
                      )}

                      <div className="text-xs text-center">
                        {new Date(
                          t.startDate || Date.now()
                        ).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="text-lg mt-2 font-bold text-gray-900 truncate w-full">
                      {t.title || "New Task"}
                    </div>

                    <div className="text-sm mt-1 text-gray-900 truncate w-full">
                      {t.description || "This is default task description."}
                    </div>

                    <div className="text-sm">
                      <div className="text-gray-700 font-semibold mb-2 mt-2">
                        Task Done:{" "}
                        <span className="font-bold">
                          {completed} / {total}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-300 overflow-hidden">
                        <div
                          className="h-full bg-black transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex justify-between gap-8 mb-10 mt-2">
                      <div>
                        <div className="text-sm font-semibold text-gray-800">
                          Start Date
                        </div>
                        <div className="text-xs text-gray-700">
                          {t.startDate
                            ? new Date(t.startDate).toLocaleDateString()
                            : new Date().toLocaleDateString()}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-800">
                          Due Date
                        </div>
                        <div className="text-xs text-gray-700">
                          {t.dueDate
                            ? new Date(t.dueDate).toLocaleDateString()
                            : new Date().toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-2 right-2 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(t);
                      }}
                      className="p-2 rounded-full bg-gray-200 cursor-pointer"
                    >
                      <Edit size={16} />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmDelete(t);
                      }}
                      className="p-2 rounded-full bg-red-600 hover:bg-red-500 cursor-pointer text-white"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* CHARTS */}
      <div className="w-full flex flex-col lg:flex-row gap-6 mt-8 mb-10">
        <div className="w-full lg:w-1/2 bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold mb-4">Task Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Tooltip />
              <Pie
                data={[
                  {
                    name: "Pending",
                    value: tasks.filter((t) => computeStatus(t) === "Pending")
                      .length,
                  },
                  {
                    name: "In Progress",
                    value: tasks.filter(
                      (t) => computeStatus(t) === "In Progress"
                    ).length,
                  },
                  {
                    name: "Completed",
                    value: tasks.filter((t) => computeStatus(t) === "Completed")
                      .length,
                  },
                ]}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                label={false}
              >
                {[
                  { name: "Pending" },
                  { name: "In Progress" },
                  { name: "Completed" },
                ].map((entry, index) => (
                  <Cell
                    key={`cell-status-${index}`}
                    fill={
                      entry.name === "Pending"
                        ? STATUS_COLORS.Pending
                        : entry.name === "In Progress"
                        ? STATUS_COLORS["In Progress"]
                        : STATUS_COLORS.Completed
                    }
                  />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="w-full lg:w-1/2 bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold mb-4">Task Priority Levels</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={[
                {
                  name: "High",
                  value: tasks.filter((t) => t.priority === "High").length,
                },
                {
                  name: "Medium",
                  value: tasks.filter((t) => t.priority === "Medium").length,
                },
                {
                  name: "Low",
                  value: tasks.filter((t) => t.priority === "Low").length,
                },
              ]}
              margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
            >
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip cursor={false} />
              <Bar dataKey="value">
                {[{ name: "High" }, { name: "Medium" }, { name: "Low" }].map(
                  (entry, index) => (
                    <Cell
                      key={`cell-priority-${index}`}
                      fill={PRIORITY_COLORS[entry.name]}
                    />
                  )
                )}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ADD / EDIT / VIEW MODALS (unchanged UI logic) */}
      {showAddModal && (
        <TaskModal
          form={form}
          setForm={setForm}
          inputRef={inputRef}
          onClose={() => setShowAddModal(false)}
          onSave={handleSaveAdd}
          title="Add Task"
        />
      )}

      {showEditModal && (
        <TaskModal
          form={form}
          setForm={setForm}
          inputRef={inputRef}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveEdit}
          title="Edit Task"
          showDelete={true}
          onDelete={() => confirmDelete(editingTask)}
        />
      )}

      {showViewModal && viewTask && (
        <ViewModal
          viewTask={viewTask}
          setViewTask={setViewTask}
          setTasks={setTasks}
          toggleTodo={toggleTodo}
        />
      )}

      {showDeleteConfirm && taskToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 w-96 text-center shadow-lg">
            <div className="text-xl font-bold mb-4">Delete Confirmation</div>
            <p className="text-md text-gray-600 mb-5">
              Are you sure you want to delete this task?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setTaskToDelete(null);
                }}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  handleDelete(taskToDelete.id || taskToDelete._id)
                }
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// -------------------- TASK MODAL COMPONENT --------------------
const TaskModal = ({
  form,
  setForm,
  inputRef,
  onClose,
  onSave,
  title,
  showDelete,
  onDelete,
}) => {
  return (
    <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
      <div className="w-full bg-white rounded-2xl shadow-lg max-h-[90vh] max-w-[600px] overflow-hidden relative">
        <div className="flex items-center justify-between pt-4 pb-0 pr-4 pl-4 bg-white sticky top-0 z-50">
          <div className="flex items-center">
            <button
              onClick={onClose}
              className="p-2 rounded-full cursor-pointer font-bold"
            >
              <ArrowLeft size={24} />
            </button>
            <div onClick={onClose} className="font-bold text-lg cursor-pointer">
              Back
            </div>
          </div>
          <div className="text-2xl font-bold">{title}</div>
          <div className="flex items-center gap-3">
            <button
              title="Save"
              onClick={onSave}
              className="p-2 rounded-full bg-gray-200 cursor-pointer"
            >
              <Check size={18} />
            </button>
            {showDelete && (
              <button
                title="Delete"
                onClick={onDelete}
                className="p-2 rounded-full bg-red-600 hover:bg-red-500 text-white cursor-pointer"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-2 scrollable-container pt-1 pb-4 pl-4 pr-4 overflow-auto max-h-[calc(90vh-80px)]">
          <div>
            <label className="block text-lg font-bold mb-1 text-black">
              Task name
            </label>
            <input
              ref={inputRef}
              value={form.title}
              onChange={(e) =>
                setForm((s) => ({ ...s, title: e.target.value }))
              }
              placeholder="Enter task name"
              className="w-full p-2 border border-gray-400 rounded text-black placeholder-gray-400 outline-none"
            />
          </div>

          <div>
            <label className="block text-lg font-bold mb-1 text-black">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((s) => ({ ...s, description: e.target.value }))
              }
              placeholder="Task description"
              className="w-full p-2 border border-gray-400 rounded text-black placeholder-gray-400 outline-none"
            />
          </div>

          <div>
            <label className="block text-lg font-bold mb-1 text-black">
              Todo Checklist
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={form.newSubTask || ""}
                onChange={(e) =>
                  setForm((s) => ({ ...s, newSubTask: e.target.value }))
                }
                placeholder="Add a todo checklist"
                className="flex-1 p-2 border border-gray-400 rounded outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (!form.newSubTask) return;
                  setForm((s) => ({
                    ...s,
                    ttodo: [
                      ...(s.ttodo || []),
                      { title: s.newSubTask, completed: false },
                    ],
                    newSubTask: "",
                  }));
                }}
                className="p-2 bg-black text-white rounded"
              >
                <Plus size={16} />
              </button>
            </div>
            <ul className="space-y-1">
              {form.ttodo &&
                form.ttodo.map((todo, i) => (
                  <li
                    key={i}
                    className="flex items-center p-2 bg-gray-100 rounded"
                  >
                    <span className="font-bold">{i + 1}.</span>
                    <span
                      className={`ml-2 ${
                        todo.completed ? " text-gray-500" : ""
                      }`}
                    >
                      {todo.title}
                    </span>
                    <button
                      onClick={() =>
                        setForm((s) => ({
                          ...s,
                          ttodo: s.ttodo.filter((_, idx) => idx !== i),
                        }))
                      }
                      className="ml-auto p-1 bg-red-600 hover:bg-red-500 text-white rounded-full flex items-center justify-center"
                      title="Delete todo"
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
            </ul>
          </div>

          <div>
            <label className="block text-lg font-bold mb-1 text-black">
              Tags
            </label>
            <div className="flex gap-2 items-center mt-2">
              <input
                type="text"
                value={form.newTag || ""}
                onChange={(e) =>
                  setForm((s) => ({ ...s, newTag: e.target.value }))
                }
                placeholder="Add a tag"
                className="flex-1 p-2 border border-gray-400 rounded outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (!form.newTag) return;
                  setForm((s) => ({
                    ...s,
                    tags: [...(s.tags || []), s.newTag],
                    newTag: "",
                  }));
                }}
                className="p-2 bg-black text-white rounded"
              >
                <Plus size={16} />
              </button>
            </div>
            {form.tags && form.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {form.tags.map((tag, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1 px-2 py-1 bg-gray-200 text-black rounded text-sm"
                  >
                    <span>#{tag}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((s) => ({
                          ...s,
                          tags: s.tags.filter((_, idx) => idx !== i),
                        }))
                      }
                      className="text-red-600 font-bold text-lg"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-lg font-bold mb-1 text-black">
                Priority
              </label>
              <select
                value={form.priority}
                onChange={(e) =>
                  setForm((s) => ({ ...s, priority: e.target.value }))
                }
                className="w-full p-2 border border-gray-400 rounded outline-none bg-white"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-lg font-bold mb-1 text-black">
                Due Date
              </label>
              <input
                type="date"
                value={
                  form.dueDate
                    ? form.dueDate.slice(0, 10)
                    : new Date().toISOString().slice(0, 10)
                }
                onChange={(e) =>
                  setForm((s) => ({ ...s, dueDate: e.target.value }))
                }
                className="w-full p-2 border border-gray-400 rounded outline-none bg-white"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// -------------------- VIEW MODAL COMPONENT --------------------
const ViewModal = ({ viewTask, setViewTask, setTasks, toggleTodo }) => {
  if (!viewTask) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-[50vw] p-6 text-left relative overflow-auto max-h-[60vh] scrollable-container">
        <button
          onClick={() => setViewTask(null)}
          className="absolute top-3 right-3 text-gray-600 hover:text-black text-lg font-bold"
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-4">Task Details</h2>

        <h2 className="text-2xl  text-gray-900 mb-4 break-words">
          {viewTask.title || "New Task"}
        </h2>

        <div className="mb-4 break-words">
          <p className="text-gray-800">
            {viewTask.description || "This is default task description."}
          </p>
        </div>

        {viewTask.tags && viewTask.tags.length > 0 && (
          <div className="mb-4">
            <div className="text-lg font-semibold text-gray-800 mb-2">Tags</div>
            <div className="flex flex-wrap gap-2">
              {viewTask.tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-gray-200 text-gray-800 rounded text-sm"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-start gap-28 mb-4">
          <div>
            <div className="text-lg mb-1 font-semibold text-gray-800">
              Priority
            </div>
            <div
              className="text-sm font-bold p-1 rounded text-center"
              style={{
                color: PRIORITY_COLORS[viewTask.priority] || "orange",
                backgroundColor:
                  viewTask.priority === "High"
                    ? " #ffe6e6"
                    : viewTask.priority === "Medium"
                    ? "#fff5e6"
                    : "#eafaea",
              }}
            >
              {viewTask.priority || "Medium"}
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg mb-1 font-semibold text-gray-800">
              Due Date
            </div>
            <div className="text-sm text-gray-700">
              {viewTask.dueDate
                ? new Date(viewTask.dueDate).toLocaleDateString()
                : new Date().toLocaleDateString()}
            </div>
          </div>
        </div>

        {viewTask.ttodo && viewTask.ttodo.length > 0 && (
          <div className="mb-4">
            <div className="text-lg font-semibold text-gray-700 mb-2">
              Todo Checklist
            </div>
            <ul className="space-y-2">
              {viewTask.ttodo.map((todo, i) => (
                <li key={i} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!todo.completed}
                    onChange={() => toggleTodo(viewTask.id || viewTask._id, i)}
                    className="w-4 h-4 accent-black"
                  />
                  <span className={todo.completed ? " text-gray-500" : ""}>
                    {todo.title}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
