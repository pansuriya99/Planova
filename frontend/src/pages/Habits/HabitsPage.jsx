import React, { useEffect, useRef, useState } from "react";
import {
  Plus,
  Trash2,
  ArrowLeft,
  Bell,
  BellOff,
  Check,
  Pin,
  PinOff,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";
import "../../app.css";
import { toast } from "react-toastify";

const DEFAULT_AREAS = ["Personal", "Work", "Health", "General", "Study"];
const API_BASE = "http://localhost:5000/api/goals";

export default function HabitsPage() {
  // ------------------- STATE (declare first!) -------------------
  const [habits, setHabits] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState(null);
  const [user, setUser] = useState(null);
  const inputRef = useRef(null);
  const [currentDayOffset, setCurrentDayOffset] = useState(0);

  const [addForm, setAddForm] = useState({
    title: "",
    repeat: "daily",
    selectedDays: [],
    frequency: 1,
    notification: false,
    notifyTime: "",
    area: "Personal",
  });

  const [form, setForm] = useState({
    title: "",
    repeat: "daily",
    selectedDays: [],
    frequency: 1,
    notification: false,
    notifyTime: "",
    area: "Personal",
  });

  // cache to prevent duplicate notifications the same minute
  const lastNotifiedRef = useRef({}); // { "<habitId>|HH:MM": true }

  // ------------------- COMMON FETCH WRAPPER -------------------
  const secureFetch = async (url, options = {}) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("No user/token found. Please login first.");
      window.location.href = "/login";
      throw new Error("No token found");
    }

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    };

    try {
      const res = await fetch(url, { ...options, headers });
      if (res.status === 401) {
        localStorage.removeItem("token");
        toast.error("Session expired. Please log in again.");
        window.location.href = "/login";
        throw new Error("Unauthorized");
      }

      const data = await res.json();

      if (!res.ok) throw new Error(data?.message || "Request failed");
      return data;
    } catch (err) {
      console.error("secureFetch error:", err);
      toast.error(err.message || "Something went wrong");
      throw err;
    }
  };

  // ------------------- API CALLS -------------------
  const fetchHabits = async () => {
    try {
      const data = await secureFetch(API_BASE);
      // server might return { data: [...] } or [...]
      setHabits(data?.data ?? data ?? []);
    } catch (err) {
      console.error("fetchHabits error:", err);
    }
  };

  const createHabitAPI = async (payload) =>
    secureFetch(API_BASE, {
      method: "POST",
      body: JSON.stringify({ ...payload, userId: user?._id }),
    });

  const updateHabitAPI = async (id, payload) =>
    secureFetch(`${API_BASE}/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });

  const deleteHabitAPI = async (id) =>
    secureFetch(`${API_BASE}/${id}`, { method: "DELETE" });

  // ------------------- NOTIFICATIONS: permission + helper -------------------
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  const showNotification = (habit) => {
    // show system notification if allowed, otherwise fallback to toast
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification("⏰ Habit Reminder", {
          body: `Time to do: ${habit.title}`,
          icon: "/src/assets/habit.png",
        });
      } catch (err) {
        // sometimes notifications throw in secure contexts; fallback to toast
        toast.info(`Reminder: ${habit.title}`);
      }
    } else {
      toast.info(`Reminder: ${habit.title}`);
    }
  };

  // ------------------- NOTIFICATION SCHEDULER (checks habits every minute) -------------------
  useEffect(() => {
    const checkNotifications = () => {
      const now = new Date();
      const hhmm = now.toTimeString().slice(0, 5); // "HH:MM"

      // iterate habits and trigger notifications for matching times
      habits.forEach((habit) => {
        if (!habit) return;
        // habit.notification (boolean) and habit.notifyTime in "HH:MM"
        if (habit.notification && habit.notifyTime) {
          // only notify if time strings match
          if (habit.notifyTime === hhmm) {
            const key = `${habit._id}|${hhmm}`;
            if (!lastNotifiedRef.current[key]) {
              // mark as notified this minute and show it
              lastNotifiedRef.current[key] = true;
              showNotification(habit);
            }
          }
        }
      });

      // clear old entries in lastNotifiedRef older than 5 minutes to keep memory small
      // (simple cleanup based on minute string keys)
      // We'll clear any stored minute that isn't current hhmm (so notifications can re-fire next day)
      const keepKey = (k) => k.endsWith(`|${now.toTimeString().slice(0, 5)}`);
      Object.keys(lastNotifiedRef.current).forEach((k) => {
        if (!keepKey(k)) delete lastNotifiedRef.current[k];
      });
    };

    // run immediately to catch notifications that match the current minute
    checkNotifications();
    const interval = setInterval(checkNotifications, 60 * 1000); // every minute
    return () => clearInterval(interval);
  }, [habits]);

  // ------------------- EFFECTS: fetch + focus -------------------
  useEffect(() => {
    const rawUser = localStorage.getItem("user");
    if (rawUser) setUser(JSON.parse(rawUser));

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("No user/token found. Please login first.");
      window.location.href = "/login";
      return;
    }

    fetchHabits();
  }, []);

  useEffect(() => {
    if (showModal && inputRef.current) inputRef.current.focus();
  }, [showModal]);

  // ------------------- UTILITIES -------------------
  const formatDateKey = (date) => new Date(date).toDateString();
  const isSameDate = (d1, d2) =>
    new Date(d1).toDateString() === new Date(d2).toDateString();

  const isHabitScheduledOnDate = (h, date) => {
    try {
      const dayName = date.toLocaleDateString(undefined, { weekday: "short" });
      if (!h) return false;

      if (h.repeat === "daily") {
        // if daily but user specified selectedDays, respect them (optional behavior)
        if (Array.isArray(h.selectedDays) && h.selectedDays.length > 0)
          return h.selectedDays.includes(dayName);
        return true;
      }

      if (h.repeat === "weekly") {
        // weekly: check selectedDays array (preferred) else fallback to createdAt weekday
        if (Array.isArray(h.selectedDays) && h.selectedDays.length > 0) {
          return h.selectedDays.includes(dayName);
        }
        if (h.createdAt) {
          const createdWeekday = new Date(h.createdAt).toLocaleDateString(
            undefined,
            { weekday: "short" }
          );
          return createdWeekday === dayName;
        }
        return true;
      }

      // fallback: match createdAt date
      return isSameDate(h.createdAt || new Date(), date);
    } catch (err) {
      console.warn("isHabitScheduledOnDate error", err);
      return false;
    }
  };

  // ------------------- CRUD -------------------
  const createNewHabit = async () => {
    if (!addForm.title.trim()) return toast.error("Please enter a habit name.");
    try {
      // ensure selectedDays is array and notifyTime is string
      const payload = {
        ...addForm,
        selectedDays: Array.isArray(addForm.selectedDays)
          ? addForm.selectedDays
          : [],
        notifyTime: addForm.notifyTime ?? "",
        notification: !!addForm.notification,
        pinned: false,
      };

      await createHabitAPI(payload);
      setShowAddModal(false);
      setAddForm({
        title: "",
        repeat: "daily",
        selectedDays: [],
        frequency: 1,
        notification: false,
        notifyTime: "",
        area: "Personal",
      });
      fetchHabits();
    } catch (err) {
      // error already handled in secureFetch
    }
  };

  const openEdit = (habit) => {
    setEditingHabit(habit);
    setForm({
      title: habit.title || "",
      repeat: habit.repeat || "daily",
      selectedDays: habit.selectedDays || [],
      frequency: habit.frequency || 1,
      notification: habit.notification || false,
      notifyTime: habit.notifyTime || "",
      area: habit.area || "Personal",
    });
    setShowModal(true);
  };

  const handleSaveModal = async () => {
    if (!editingHabit) return;
    try {
      const payload = {
        ...editingHabit,
        ...form,
        selectedDays: Array.isArray(form.selectedDays) ? form.selectedDays : [],
        notifyTime: form.notifyTime ?? "",
        notification: !!form.notification,
      };
      await updateHabitAPI(editingHabit._id, payload);
      fetchHabits();
    } catch (err) {}
  };

  const confirmDelete = (habit) => {
    setHabitToDelete(habit);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteHabitAPI(id);
      setShowDeleteConfirm(false);
      setHabitToDelete(null);
      if (editingHabit?._id === id) {
        setShowModal(false);
        setEditingHabit(null);
      }
      fetchHabits();
    } catch (err) {}
  };

  const toggleComplete = async (habitId, date) => {
    const key = formatDateKey(date);
    const updated = habits.map((h) =>
      h._id === habitId
        ? { ...h, completed: { ...h.completed, [key]: !h.completed?.[key] } }
        : h
    );
    setHabits(updated);

    try {
      const habit = habits.find((h) => h._id === habitId);
      const updatedCompleted = { ...(habit?.completed || {}) };
      updatedCompleted[key] = !updatedCompleted[key];
      await updateHabitAPI(habitId, { completed: updatedCompleted });
    } catch (err) {
      fetchHabits();
    }
  };

  const togglePin = async (id, current) => {
    try {
      await updateHabitAPI(id, { pinned: !current });
      fetchHabits();
    } catch (err) {}
  };

  const formatHeaderDate = (base = new Date(), offset = 0) => {
    const d = new Date(base);
    d.setDate(d.getDate() + offset);
    return d;
  };

  const headerDate = formatHeaderDate(new Date(), currentDayOffset);
  const changeDay = (by) => {
    setCurrentDayOffset((o) => o + by);
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + currentDayOffset + by);
    setSelectedDate(newDate);
  };

  // ------------------- STATS -------------------
  const scheduledHabits = habits.filter(
    (h) =>
      isHabitScheduledOnDate(h, selectedDate) &&
      !h.completed?.[formatDateKey(selectedDate)]
  );
  const completedHabits = habits.filter(
    (h) =>
      isHabitScheduledOnDate(h, selectedDate) &&
      h.completed?.[formatDateKey(selectedDate)]
  );

  const habitsForDate = scheduledHabits.length + completedHabits.length;
  const completedForDate = completedHabits.length;

  const totalCreated = habits.length;
  const totalCompleted = habits.filter((h) =>
    Object.values(h.completed || {}).some((v) => v)
  ).length;
  const totalRemaining = totalCreated - totalCompleted;

  const last7DaysData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const key = formatDateKey(date);
    const completed = habits.filter((h) => h.completed?.[key]).length;
    const remaining = habits.filter((h) => !h.completed?.[key]).length;
    return {
      date: date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      completed,
      remaining,
      total: completed + remaining,
    };
  });

  // ------------------- RENDER -------------------
  return (
    <>
      {/* HEADER STATS */}
      <div className="min-h-[80px] shadow-lg bg-white mb-6 rounded-2xl flex align-middle items-center justify-around">
        <div className="flex flex-col items-center gap-1 text-lg font-bold">
          <div>{totalCreated}</div>
          <div>Total</div>
        </div>
        <div className="flex flex-col items-center gap-1 text-lg font-bold">
          <div>{totalCompleted}</div>
          <div>Total Completed</div>
        </div>
        <div className="flex flex-col items-center gap-1 text-lg font-bold">
          <div>{totalRemaining}</div>
          <div>Total Remaining</div>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 bg-gray-100">
        {/* LEFT column */}
        <div className="lg:col-span-2 rounded-2xl p-6 bg-white">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="text-2xl font-bold text-gray-900">
                {headerDate.toLocaleDateString(undefined, { weekday: "long" })}
                <div className="text-lg text-gray-500">
                  {headerDate.toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              </div>

              <div className="flex items-center gap-1 rounded px-2 py-1">
                <button
                  onClick={() => changeDay(-1)}
                  className="p-2 rounded-full bg-gray-100 cursor-pointer"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={() => changeDay(1)}
                  className="p-2 rounded-full bg-gray-100 cursor-pointer"
                >
                  <ChevronRight size={24} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddModal(true)}
                className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center shadow hover:scale-110 transition"
                title="New habit"
              >
                <Plus size={28} />
              </button>
            </div>
          </div>

          {/* Scheduled Habits */}
          <div className="space-y-4">
            {scheduledHabits.length === 0 ? (
              <div className="flex flex-col items-center justify-center mt-20 text-gray-500 text-center">
                <img
                  src="/src/assets/habit.png"
                  alt="No habits"
                  className="w-34 h-34 mb-4 opacity-70"
                />
                <p className="text-lg font-medium">
                  Nothing here yet! Add your first habit and start building your
                  routine.
                </p>
              </div>
            ) : (
              scheduledHabits.map((h) => {
                const done = Boolean(
                  h.completed?.[formatDateKey(selectedDate)]
                );
                return (
                  <div
                    key={h._id}
                    className="relative rounded-lg p-4 flex flex-col gap-2 cursor-pointer bg-gray-50 shadow-lg transition transform hover:scale-[1.02] min-h-[100px]"
                    onClick={() => openEdit(h)}
                  >
                    <div className="absolute left-2 top-1/2 -translate-y-1/2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleComplete(h._id, selectedDate);
                        }}
                        className={`w-8 h-8 rounded-full border flex items-center justify-center ${
                          done
                            ? "bg-black text-white"
                            : "bg-transparent border-gray-400"
                        }`}
                      >
                        {done ? <Check size={16} /> : null}
                      </button>
                    </div>

                    <div className="flex flex-col pl-12 pr-4">
                      <div className="flex justify-between items-start">
                        <div className="text-lg font-bold text-gray-900">
                          {h.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(
                            h.createdAt || Date.now()
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </div>
                      </div>
                      {h.area && (
                        <div className="text-sm text-gray-600 mt-1">
                          {h.area}
                        </div>
                      )}
                    </div>

                    <div className="absolute bottom-2 right-2 flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePin(h._id, h.pinned);
                        }}
                        className="p-2 rounded-full bg-gray-200 cursor-pointer"
                      >
                        {h.pinned ? <PinOff size={16} /> : <Pin size={16} />}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          confirmDelete(h);
                        }}
                        className="p-2 rounded-full bg-red-600 hover:bg-red-500  cursor-pointer text-white"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Completed Habits */}
          {completedHabits.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-bold text-gray-500 mb-3">
                Completed Habits
              </h2>
              <div className="space-y-4">
                {completedHabits.map((h) => (
                  <div
                    key={h._id}
                    className="relative rounded-lg p-4 flex flex-col gap-2 bg-gray-50 shadow-lg min-h-[100px] text-gray-400"
                  >
                    <div className="absolute left-2 top-1/2 -translate-y-1/2">
                      <button
                        onClick={() => toggleComplete(h._id, selectedDate)}
                        className="w-8 h-8 rounded-full border flex items-center justify-center bg-black text-white"
                      >
                        <Check size={16} />
                      </button>
                    </div>

                    <div className="flex flex-col pl-12 pr-4">
                      <div className="flex justify-between items-start">
                        <div className="text-lg font-bold">{h.title}</div>
                        <div className="text-xs">
                          {new Date(
                            h.createdAt || Date.now()
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </div>
                      </div>
                      {h.area && <div className="text-sm mt-1">{h.area}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT column */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow flex flex-col items-center">
            <div className="text-2xl font-bold  text-gray-600 mb-3">
              Statistics
            </div>
            <div className="relative">
              <PieChart width={200} height={200}>
                <Pie
                  data={[
                    { name: "Completed", value: completedForDate },
                    {
                      name: "Remaining",
                      value: Math.max(0, habitsForDate - completedForDate),
                    },
                  ]}
                  dataKey="value"
                  innerRadius={60}
                  outerRadius={90}
                  startAngle={90}
                  endAngle={-270}
                >
                  <Cell key="c1" fill="#000000" />
                  <Cell key="c2" fill="#E5E7EB" />
                </Pie>
              </PieChart>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="text-xl font-semibold text-gray-900">
                  {habitsForDate === 0
                    ? "0%"
                    : Math.round((completedForDate / habitsForDate) * 100) +
                      "%"}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Today's Progress
                </div>
              </div>
            </div>
            <div className="w-full mt-4 grid grid-cols-3 gap-4 text-md text-gray-600">
              <div className="text-center">
                <div className="font-semibold text-gray-900">
                  {habitsForDate}
                </div>
                <div>Total Today</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-900">
                  {completedForDate}
                </div>
                <div>Completed Today</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-900">
                  {Math.max(0, habitsForDate - completedForDate)}
                </div>
                <div>Remaining Today</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow">
            <div className="mb-2 text-2xl font-bold text-gray-600">
              Calendar
            </div>
            <Calendar
              value={selectedDate}
              onChange={(d) => setSelectedDate(d)}
            />
          </div>
        </div>
      </div>

      {/* LAST 7 DAYS LINE CHART */}
      <div className="mt-8 bg-white rounded-2xl p-6 shadow">
        <div className="text-xl font-bold text-gray-700 mb-2">
          Last 7 Days Progress
        </div>
        <div className="text-sm text-gray-500 mb-4">
          Showing completed, remaining, and total habits per day
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={last7DaysData}
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" />
            <XAxis dataKey="date" stroke="#374151" />
            <YAxis stroke="#374151" />
            <Tooltip />
            <Legend verticalAlign="top" height={36} />
            <Line
              type="monotone"
              dataKey="completed"
              stroke="#000000"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="remaining"
              stroke="#555555"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#aaaaaa"
              strokeWidth={2}
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ADD HABIT MODAL */}
      {showAddModal && (
        <div className="scrollable-container fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
          <div className="scrollable-container w-full bg-white rounded-2xl shadow-lg overflow-auto max-h-[90vh] max-w-[50vw] p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="pr-1 rounded-full cursor-pointer font-bold"
                >
                  <ArrowLeft size={24} />
                </button>
                <div
                  onClick={() => setShowAddModal(false)}
                  className="mb-1 font-bold text-lg cursor-pointer"
                >
                  Back
                </div>
              </div>
              <div className="text-2xl font-bold text-center">Add Habit</div>
              <div></div>
            </div>

            {/* Form */}
            <div className="space-y-4">
              {/* Habit Name */}
              <div>
                <label className="block text-lg font-bold mb-1">
                  Habit name
                </label>
                <input
                  ref={inputRef}
                  value={addForm.title}
                  onChange={(e) =>
                    setAddForm((s) => ({ ...s, title: e.target.value }))
                  }
                  placeholder="Enter habit name"
                  className="w-full p-2 border border-gray-300 rounded outline-none placeholder-gray-400"
                />
              </div>

              {/* Repeat Options */}
              <div>
                <label className="block text-lg font-bold mb-1">Repeat</label>
                <div className="flex gap-3 mb-2">
                  <button
                    onClick={() =>
                      setAddForm((s) => ({
                        ...s,
                        repeat: "daily",
                        selectedDays: [],
                        frequency: 1,
                      }))
                    }
                    className={`px-4 py-2 rounded ${
                      addForm.repeat === "daily"
                        ? "bg-black text-white"
                        : "bg-gray-100"
                    }`}
                  >
                    Daily
                  </button>
                  <button
                    onClick={() =>
                      setAddForm((s) => ({
                        ...s,
                        repeat: "weekly",
                        selectedDays: [],
                      }))
                    }
                    className={`px-4 py-2 rounded ${
                      addForm.repeat === "weekly"
                        ? "bg-black text-white"
                        : "bg-gray-100"
                    }`}
                  >
                    Weekly
                  </button>
                </div>

                {/* Conditional Fields */}
                {addForm.repeat === "daily" ? (
                  <p className="text-gray-600 text-sm">
                    This habit will repeat every day automatically.
                  </p>
                ) : (
                  <>
                    {/* Select Days */}
                    <label className="block text-md font-semibold mb-2">
                      Select Days
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                        (d) => (
                          <button
                            key={d}
                            onClick={() =>
                              setAddForm((s) => ({
                                ...s,
                                selectedDays: s.selectedDays.includes(d)
                                  ? s.selectedDays.filter((x) => x !== d)
                                  : [...s.selectedDays, d],
                              }))
                            }
                            className={`px-3 py-1 rounded ${
                              addForm.selectedDays.includes(d)
                                ? "bg-black text-white"
                                : "bg-gray-100"
                            }`}
                          >
                            {d}
                          </button>
                        )
                      )}
                    </div>

                    {/* Frequency */}
                    <div>
                      <label className="block text-md font-semibold mb-1">
                        Repeat Every (weeks)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={4}
                        value={addForm.frequency}
                        onChange={(e) =>
                          setAddForm((s) => ({
                            ...s,
                            frequency: Number(e.target.value),
                          }))
                        }
                        className="w-full p-2 border border-gray-300 rounded outline-none placeholder-gray-400"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Notification */}
              <div>
                <label className="block text-lg font-bold mb-1">
                  Notification
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      setAddForm((s) => ({
                        ...s,
                        notification: !s.notification,
                      }))
                    }
                    className="p-2 rounded-full bg-gray-100 cursor-pointer"
                  >
                    {addForm.notification ? (
                      <Bell size={20} />
                    ) : (
                      <BellOff size={20} />
                    )}
                  </button>
                  {addForm.notification && (
                    <input
                      type="time"
                      value={addForm.notifyTime}
                      onChange={(e) =>
                        setAddForm((s) => ({
                          ...s,
                          notifyTime: e.target.value,
                        }))
                      }
                      className="p-2 border border-gray-300 rounded outline-none bg-white text-black"
                    />
                  )}
                </div>
              </div>

              {/* Area */}
              <div>
                <label className="block text-lg font-bold mb-1">Area</label>
                <select
                  value={addForm.area}
                  onChange={(e) =>
                    setAddForm((s) => ({ ...s, area: e.target.value }))
                  }
                  className="w-full p-2 border border-gray-300 rounded outline-none bg-white"
                >
                  {DEFAULT_AREAS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>

              {/* Add Button */}
              <div className="flex justify-end">
                <button
                  onClick={createNewHabit}
                  className="w-full px-6 py-2 bg-black text-white rounded hover:bg-gray-900"
                >
                  Add Habit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL & DELETE POPUP */}
      {showModal && editingHabit && (
        <div className="scrollable-container fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4 ">
          <div className="scrollable-container w-full bg-white rounded-2xl shadow-lg overflow-auto max-h-[90vh] max-w-[50vw] p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingHabit(null);
                  }}
                  className="p-2 rounded-full cursor-pointer font-bold"
                >
                  <ArrowLeft size={24} />
                </button>
                <div
                  onClick={() => {
                    setShowModal(false);
                    setEditingHabit(null);
                  }}
                  className="mb-1 font-bold text-lg cursor-pointer"
                >
                  Back
                </div>
              </div>

              <div className="text-2xl font-bold">Edit Habit</div>

              <div className="flex items-center gap-3">
                <button
                  title="Save"
                  onClick={async () => {
                    await handleSaveModal();
                    setShowModal(false);
                    setEditingHabit(null);
                  }}
                  className="p-2 rounded-full bg-gray-200 cursor-pointer"
                >
                  <Check size={18} />
                </button>
                <button
                  title="Delete"
                  onClick={() => confirmDelete(editingHabit)}
                  className="p-2 rounded-full bg-red-600 hover:bg-red-500 text-white cursor-pointer"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-4">
              {/* Habit Name */}
              <div>
                <label className="block text-lg font-bold mb-1">
                  Habit name
                </label>
                <input
                  ref={inputRef}
                  value={form.title}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, title: e.target.value }))
                  }
                  placeholder="Enter habit name"
                  className="w-full p-2 border border-gray-300 rounded outline-none placeholder-gray-400"
                />
              </div>

              {/* Repeat Section */}
              <div>
                <label className="block text-lg font-bold mb-1">Repeat</label>
                <div className="flex gap-3 mb-2">
                  <button
                    onClick={() =>
                      setForm((s) => ({
                        ...s,
                        repeat: "daily",
                        selectedDays: [],
                        frequency: 1,
                      }))
                    }
                    className={`px-4 py-2 rounded ${
                      form.repeat === "daily"
                        ? "bg-black text-white"
                        : "bg-gray-100"
                    }`}
                  >
                    Daily
                  </button>
                  <button
                    onClick={() =>
                      setForm((s) => ({
                        ...s,
                        repeat: "weekly",
                        selectedDays: [],
                      }))
                    }
                    className={`px-4 py-2 rounded ${
                      form.repeat === "weekly"
                        ? "bg-black text-white"
                        : "bg-gray-100"
                    }`}
                  >
                    Weekly
                  </button>
                </div>

                {form.repeat === "daily" ? (
                  <p className="text-gray-600 text-sm">
                    This habit repeats every day automatically.
                  </p>
                ) : (
                  <>
                    <label className="block text-md font-semibold mb-2">
                      Select Days
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                        (d) => (
                          <button
                            key={d}
                            onClick={() =>
                              setForm((s) => ({
                                ...s,
                                selectedDays: s.selectedDays.includes(d)
                                  ? s.selectedDays.filter((x) => x !== d)
                                  : [...s.selectedDays, d],
                              }))
                            }
                            className={`px-3 py-1 rounded ${
                              form.selectedDays.includes(d)
                                ? "bg-black text-white"
                                : "bg-gray-100"
                            }`}
                          >
                            {d}
                          </button>
                        )
                      )}
                    </div>

                    <div>
                      <label className="block text-md font-semibold mb-1">
                        Repeat Every (weeks)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={4}
                        value={form.frequency}
                        onChange={(e) =>
                          setForm((s) => ({
                            ...s,
                            frequency: Number(e.target.value),
                          }))
                        }
                        className="w-full p-2 border border-gray-300 rounded outline-none placeholder-gray-400"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Notification */}
              <div>
                <label className="block text-lg font-bold mb-1">
                  Notification
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      setForm((s) => ({ ...s, notification: !s.notification }))
                    }
                    className="p-2 rounded-full bg-gray-100 cursor-pointer"
                  >
                    {form.notification ? (
                      <Bell size={20} />
                    ) : (
                      <BellOff size={20} />
                    )}
                  </button>
                  {form.notification && (
                    <input
                      type="time"
                      value={form.notifyTime}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, notifyTime: e.target.value }))
                      }
                      className="p-2 border border-gray-300 rounded outline-none bg-white text-black"
                    />
                  )}
                </div>
              </div>

              {/* Area */}
              <div>
                <label className="block text-lg font-bold mb-1">Area</label>
                <select
                  value={form.area}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, area: e.target.value }))
                  }
                  className="w-full p-2 border border-gray-300 rounded outline-none bg-white"
                >
                  {DEFAULT_AREAS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM */}
      {showDeleteConfirm && habitToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 w-96 text-center shadow-lg">
            <div className="text-xl font-bold mb-4">Delete Confirmation</div>
            <p className="text-md text-gray-600 mb-5">
              Are you sure you want to delete this habit?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setHabitToDelete(null);
                }}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(habitToDelete._id)}
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
