import React, { useState, useEffect } from "react";
import {
  CalendarDays,
  StickyNote,
  CheckCircle,
  TrendingUp,
  Clock,
  Smile,
  Meh,
  Frown,
  Angry,
  Sparkles,
  Moon,
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function DashHome() {
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState("");
  const [userName, setUserName] = useState("User");

  // ----------------- Header / Greeting -----------------
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => {
        const user = data.user || data;
        setUserName(user.fullName || user.name || "User");
      })
      .catch(() => {
        localStorage.removeItem("token");
        toast.error("Session expired. Please login again.");
        navigate("/login");
      });
  }, [navigate]);

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) setGreeting("🌅 Good Morning");
      else if (hour >= 12 && hour < 17) setGreeting("🌞 Good Afternoon");
      else if (hour >= 17 && hour < 21) setGreeting("🌇 Good Evening");
      else setGreeting("🌙 Good Night");
    };
    updateGreeting();
    const interval = setInterval(updateGreeting, 60000);
    return () => clearInterval(interval);
  }, []);

  // ----------------- Motivation -----------------
  const quotes = [
    {
      quote: "A goal without a plan is just a wish. - Antoine de Saint-Exupéry",
    },
    {
      quote: "Don’t be busy, be productive. - Tim Ferriss",
    },
    {
      quote:
        "The key is not to prioritize what’s on your schedule, but to schedule your priorities. - Stephen Covey",
    },
    {
      quote:
        "Small daily improvements lead to stunning results over time. - Robin Sharma",
    },
    {
      quote:
        "Discipline is choosing between what you want now and what you want most. - Abraham Lincoln",
    },
    {
      quote:
        "Plan your work for today and every day, then work your plan. - Margaret Thatcher",
    },
    {
      quote:
        "Success doesn’t come from what you do occasionally, it comes from what you do consistently. - Marie Forleo",
    },
  ];

  const todayIndex = new Date().getDate() % quotes.length;
  const { quote } = quotes[todayIndex];

  // ----------------- Tasks (existing logic) -----------------
  const API_BASE = "http://localhost:5000/api/tasks";
  const [todayTasks, setTodayTasks] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);

  const PRIORITY_COLORS = {
    Low: "#2a6f41",
    Medium: "#facc15",
    High: "#ef4444",
    Critical: "#8b0000",
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token") || "";
    return {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    };
  };

  const normalizeTask = (t) => ({
    ...t,
    id: t.id || t._id,
    ttodo: Array.isArray(t.ttodo) ? t.ttodo : [],
    priority: t.priority || "Medium",
  });

  const isSameDate = (d1, d2) =>
    new Date(d1).toDateString() === new Date(d2).toDateString();

  const fetchTasks = async () => {
    try {
      const res = await fetch(API_BASE, { headers: getAuthHeaders() });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to fetch tasks");

      const arr = Array.isArray(json?.data) ? json.data.map(normalizeTask) : [];

      // sort by dueDate descending (latest first)
      const sortedArr = arr.sort(
        (a, b) => new Date(b.dueDate) - new Date(a.dueDate)
      );

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayList = sortedArr
        .filter((t) => isSameDate(t.dueDate, today))
        .slice(0, 3);

      const upcomingList = sortedArr
        .filter(
          (t) => new Date(t.dueDate) > today && !isSameDate(t.dueDate, today)
        )
        .slice(0, 3);

      setTodayTasks(todayList);
      setUpcomingTasks(upcomingList);
    } catch (err) {
      console.error("fetchTasks error:", err);
      setTodayTasks([]);
      setUpcomingTasks([]);
    }
  };

  // ----------------- Events (latest 2 created) -----------------
  const [events, setEvents] = useState([]);
  const EVENTS_API = "http://localhost:5000/api/events";

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(EVENTS_API, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      const arr = Array.isArray(data) ? data : data?.data ?? [];

      const formatted = arr.map((ev) => ({
        id: ev._id,
        title: ev.title,
        desc: ev.description,
        start: ev.startDateTime ? new Date(ev.startDateTime) : null,
        end: ev.endDateTime ? new Date(ev.endDateTime) : null,
        color: ev.color || "#000000",
        createdAt: ev.createdAt
          ? new Date(ev.createdAt)
          : ev.startDateTime
          ? new Date(ev.startDateTime)
          : new Date(),
      }));

      //  Removed "latestTwo" filtering logic — keep all events
      setEvents(formatted);
    } catch (err) {
      console.error("fetchEvents error:", err);
      setEvents([]);
    }
  };

  // ----------------- Notes (live) -----------------
  const [notes, setNotes] = useState([]);

  const sortNotes = (notesArr) => {
    return [...notesArr].sort((a, b) => {
      // pinned first
      if ((a.pinned || a.isPinned) && !(b.pinned || b.isPinned)) return -1;
      if (!(a.pinned || a.isPinned) && (b.pinned || b.isPinned)) return 1;
      // pinned same -> newest first
      if ((a.pinned || a.isPinned) && (b.pinned || b.isPinned))
        return new Date(b.createdAt) - new Date(a.createdAt);
      // otherwise older -> newer (you may reverse if you prefer newest first)
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  };

  const fetchNotes = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch("http://localhost:5000/api/notes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      // API might return { success: true, notes: [...] } or array directly
      const arr = Array.isArray(data) ? data : data?.notes ?? data?.data ?? [];
      setNotes(sortNotes(arr));
    } catch (err) {
      console.error("fetchNotes error:", err);
      setNotes([]);
    }
  };

  // ----------------- Finance (transactions) -----------------
  const [transactions, setTransactions] = useState([]);
  const [incomeTotal, setIncomeTotal] = useState(0);
  const [expenseTotal, setExpenseTotal] = useState(0);

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("http://localhost:5000/api/transactions", {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      const data = await res.json();
      const arr = Array.isArray(data) ? data : data?.data ?? [];
      // normalize basic fields
      const normalized = arr.map((t) => ({
        id: t._id || t.id,
        type:
          t.type ||
          t.transactionType ||
          (t.amount && t.amount < 0 ? "Expense" : "Income"),
        amount: Number(t.amount || t.value || 0),
        name: t.name || t.source || t.category || "",
        date: t.date
          ? new Date(t.date)
          : t.createdAt
          ? new Date(t.createdAt)
          : new Date(),
      }));
      setTransactions(normalized);
      const income = normalized
        .filter((x) => (x.type || "").toLowerCase() === "income")
        .reduce((s, x) => s + (Number(x.amount) || 0), 0);
      const expense = normalized
        .filter((x) => (x.type || "").toLowerCase() === "expense")
        .reduce((s, x) => s + (Number(x.amount) || 0), 0);
      setIncomeTotal(income);
      setExpenseTotal(expense);
    } catch (err) {
      console.error("fetchTransactions error:", err);
      setTransactions([]);
      setIncomeTotal(0);
      setExpenseTotal(0);
    }
  };

  // ----------------- Habits (goals) -----------------
  const [habits, setHabits] = useState([]);
  const fetchHabits = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch("http://localhost:5000/api/goals", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      const arr = Array.isArray(data) ? data : data?.data ?? [];

      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];
      const todayDay = today.toLocaleDateString("en-US", { weekday: "short" }); // e.g. "Fri"

      // Helper: find next day from selectedDays (for weekly habits)
      const getNextDay = (selectedDays) => {
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const todayIndex = today.getDay();
        const validDays = selectedDays
          .map((d) => days.indexOf(d))
          .filter((i) => i >= 0);

        if (validDays.length === 0) return todayStr;

        // Find the next index after today
        for (let i = 1; i <= 7; i++) {
          const next = (todayIndex + i) % 7;
          if (validDays.includes(next)) {
            const nextDate = new Date(today);
            nextDate.setDate(today.getDate() + i);
            return nextDate.toISOString().split("T")[0];
          }
        }

        return todayStr; // fallback
      };

      //  Normalize habits for frontend
      const normalized = arr.map((h) => {
        const progress =
          typeof h.progress === "number" ? h.progress : h.completedCount || 0;
        const target = typeof h.target === "number" ? h.target : h.goal || 100;

        //  Determine the proper display date
        let dateValue = todayStr;

        if (h.repeat === "weekly") {
          if (h.selectedDays?.includes(todayDay)) {
            // Scheduled today
            dateValue = todayStr;
          } else {
            // Find the next selected weekday
            dateValue = getNextDay(h.selectedDays || []);
          }
        }

        return {
          id: h._id || h.id,
          title: h.title || h.name || "Untitled Habit",
          date: dateValue,
          repeat: h.repeat,
          selectedDays: h.selectedDays || [],
          createdAt: h.createdAt || new Date().toISOString(),
          done:
            !!h.completed?.[todayStr] ||
            !!h.done ||
            !!h.completedCount ||
            progress >= target,
        };
      });

      setHabits(normalized);
    } catch (err) {
      console.error("fetchHabits error:", err);
      setHabits([]);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchEvents();
    fetchNotes();
    fetchTransactions();
    fetchHabits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----------------- Derived UI data -----------------
  const financeData = [
    { name: "Income", value: incomeTotal },
    { name: "Expense", value: expenseTotal },
  ];
  const COLORS = ["#000000", "#808080"];

  // habit progress (if progress/target given use ratio, else count done)
  const habitProgress = (() => {
    if (!habits || habits.length === 0) return { total: 0, done: 0 };
    // if progress/target provided compute average completion ratio
    const hasTarget = habits.some(
      (h) => h.target && typeof h.target === "number"
    );
    if (hasTarget) {
      const totalTargets = habits.reduce((s, h) => s + (h.target || 0), 0) || 1;
      const totalProgress = habits.reduce((s, h) => s + (h.progress || 0), 0);
      // overall percentage of completion across habits
      const pct = Math.round((totalProgress / totalTargets) * 100);
      // convert to done count vs total for UI consistency
      const done = Math.round((pct / 100) * habits.length);
      return { total: habits.length, done };
    }
    // fallback: treat boolean done flag
    const doneCount = habits.filter((h) => h.done).length;
    return { total: habits.length, done: doneCount };
  })();

  // split events into today/upcoming for the small dashboard list (only from the latest two)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEvents = events.filter(
    (e) => e.start && isSameDate(e.start, today)
  );
  const upcomingEvents = events.filter(
    (e) => e.start && new Date(e.start) > today
  );

  const [moodToday, setMoodToday] = useState(
    localStorage.getItem("moodToday") || ""
  );

  const saveMood = (type) => {
    setMoodToday(type);
    localStorage.setItem("moodToday", type);
    localStorage.setItem("moodDate", new Date().toDateString());
    // toast.success(`Mood recorded: ${type}`);
  };

  // Daily reminder to record mood
  useEffect(() => {
    const lastDate = localStorage.getItem("moodDate");
    const today = new Date().toDateString();
    if (lastDate !== today) {
      toast.info("Don’t forget to record your mood today 💭");
    }
  }, []);

  // ----------------- Render -----------------
  return (
    <div className="min-h-screen bg-white text-gray-900 p-8 transition-all duration-300">
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold text-black">
            {greeting}, {userName}!
          </h1>
          <p className="text-gray-600 font-medium text-xl mt-1">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              day: "numeric",
              month: "short",
            })}
          </p>
        </div>

        {/* Mood */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3 flex items-center gap-3 shadow-xl w-[350px]">
          <div className="flex flex-col items-center w-full">
            <div className="text-md font-bold mb-1">Mood</div>
            <div className="flex gap-2 flex-wrap justify-center">
              {[
                {
                  type: "happy",
                  icon: <Smile className="cursor-pointer" />,
                  color: "bg-gray-100",
                },
                {
                  type: "neutral",
                  icon: <Meh className="cursor-pointer" />,
                  color: "bg-gray-100",
                },
                {
                  type: "sad",
                  icon: <Frown className="cursor-pointer" />,
                  color: "bg-grayv-100",
                },
                {
                  type: "angry",
                  icon: <Angry className="cursor-pointer" />,
                  color: "bg-gray-100",
                },
                {
                  type: "excited",
                  icon: <Sparkles className="cursor-pointer" />,
                  color: "bg-gray-100",
                },
                {
                  type: "tired",
                  icon: <Moon className="cursor-pointer" />,
                  color: "bg-gray-100",
                },
              ].map((mood) => (
                <button
                  key={mood.type}
                  title={mood.type.charAt(0).toUpperCase() + mood.type.slice(1)}
                  onClick={() => saveMood(mood.type)}
                  className={`p-2 rounded-lg transition flex items-center justify-center ${
                    moodToday === mood.type
                      ? "bg-black text-white"
                      : `${mood.color} hover:bg-gray-200`
                  }`}
                >
                  {mood.icon}
                </button>
              ))}
            </div>

            {/* Show today's mood */}
            <div className="text-xs text-gray-600 mt-2">
              {moodToday ? `You feel ${moodToday}` : "Tap to record your mood"}
            </div>

            {/* Smart mood suggestion message */}
            {moodToday && (
              <div className="text-xs text-gray-500 mt-1 italic text-center">
                {
                  {
                    happy:
                      "Keep smiling! Maybe note what made you happy today 🌞",
                    neutral: "A calm day ahead. Stay balanced 🧘",
                    sad: "It’s okay to have off days. Do something you love 💙",
                    angry: "Take a breath. Try journaling or a short walk 💭",
                    excited:
                      "Love that energy! Channel it into something creative ⚡",
                    tired: "Rest up. You’ve earned some recharge time 🌙",
                  }[moodToday]
                }
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {/* Motivation */}
        <div className="bg-black text-white rounded-3xl p-6 shadow-xl flex flex-col justify-center hover:shadow-2xl transition-all duration-300  border border-gray-900">
          <h2 className="text-2xl font-semibold mb-3">✨ Daily Motivation</h2>
          <p className="text-base text-gray-200 italic">“{quote}”</p>
        </div>

        {/* Tasks */}
        <div className="bg-gray-50 border border-gray-200 rounded-3xl p-6 shadow-xl hover:shadow-2xl transition">
          <div className="flex justify-between mb-4 items-center">
            <h2 className="font-bold text-xl flex items-center gap-2 text-black">
              <CheckCircle className="text-black" /> Tasks
            </h2>
            <button
              onClick={() => navigate("/dashboard/tasks")}
              className="text-sm font-medium text-black hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>

          <p className="font-semibold text-lg text-gray-800 mb-2">Today</p>
          {todayTasks.length > 0 ? (
            todayTasks.map((t, i) => (
              <div
                key={t.id || i}
                className="flex items-center gap-2 text-gray-800 mb-1"
              >
                <span
                  className="inline-block w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: PRIORITY_COLORS[t.priority] || "#6b7280",
                  }}
                />
                <span className="truncate">{t.title}</span>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm italic">No tasks for today.</p>
          )}

          <p className="font-semibold text-lg text-gray-800 mt-4 mb-2">
            Upcoming
          </p>
          {upcomingTasks.length > 0 ? (
            upcomingTasks.map((t, i) => (
              <div
                key={t.id || i}
                className="flex items-center gap-2 text-gray-800 mb-1"
              >
                <span
                  className="inline-block w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: PRIORITY_COLORS[t.priority] || "#6b7280",
                  }}
                />
                <span className="truncate">{t.title}</span>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm italic">No upcoming tasks.</p>
          )}
        </div>

        {/* Events */}
        <div className="bg-gray-50 border border-gray-200 rounded-3xl p-6 shadow-xl hover:shadow-2xl transition">
          <div className="flex justify-between mb-4 items-center">
            <h2 className="font-bold text-xl flex items-center gap-2 text-black">
              <CalendarDays className="text-black" /> Events
            </h2>
            <button
              onClick={() => navigate("/dashboard/events")}
              className="text-sm font-medium text-black hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>

          <p className="font-semibold text-lg text-gray-800 mb-2">Today</p>
          {todayEvents.length > 0 ? (
            todayEvents
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) //  Sort by latest createdAt first
              .slice(0, 3) //  Show only the last 2 created events
              .map((e) => (
                <p key={e.id} className="text-gray-800 truncate">
                  • {e.title} (
                  {e.start
                    ? new Date(e.start).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                  )
                </p>
              ))
          ) : (
            <p className="text-gray-500 text-sm italic">No events today.</p>
          )}

          <p className="font-semibold text-lg text-gray-800 mt-4 mb-2">
            Upcoming
          </p>

          {upcomingEvents.length > 0 ? (
            upcomingEvents
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) //  Sort by createdAt (newest first)
              .slice(0, 3) //  Show only the latest 2 created events
              .map((e) => (
                <p key={e._id || e.id} className="text-gray-800 truncate">
                  • {e.title} (
                  {e.start ? new Date(e.start).toDateString() : "—"})
                </p>
              ))
          ) : (
            <p className="text-gray-500 text-sm italic">No upcoming events.</p>
          )}
        </div>

        {/* Finance */}
        <div className="bg-gray-50 border border-gray-200 rounded-3xl p-6 shadow-xl hover:shadow-2xl transition">
          {/* Header */}
          <div className="flex justify-between mb-4 items-center">
            <h2 className="font-bold text-xl flex items-center gap-2 text-gray-900">
              <TrendingUp className="text-gray-900" /> Finance
            </h2>
            <button
              onClick={() => navigate("/dashboard/finance")}
              className="text-sm font-medium text-gray-700 hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>

          {/* Pie Chart with Center Text */}
          <div className="w-full h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: "Income", value: incomeTotal, fill: "#16a34a" }, // Green
                    { name: "Expense", value: expenseTotal, fill: "#dc2626" }, // Red
                    {
                      name: "Balance",
                      value: incomeTotal - expenseTotal,
                      fill: "#3b82f6",
                    }, // Blue
                  ]}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                />

                {/*  Centered Total Balance (Inside Chart) */}
                <text
                  x="50%"
                  y="48%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-gray-900 font-semibold"
                  style={{ fontSize: "14px" }}
                >
                  Total Balance
                </text>
                <text
                  x="50%"
                  y="58%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-gray-900 font-bold"
                  style={{ fontSize: "15px" }}
                >
                  ₹{Number(incomeTotal - expenseTotal || 0).toLocaleString()}
                </text>

                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex justify-between items-center mt-4 text-sm text-gray-700">
            <div className="flex items-center gap-1">
              <span className="h-3 w-3 bg-green-500 rounded-full inline-block"></span>
              Income
            </div>
            <div className="flex items-center gap-1">
              <span className="h-3 w-3 bg-red-500 rounded-full inline-block"></span>
              Expense
            </div>
            <div className="flex items-center gap-1">
              <span className="h-3 w-3 bg-blue-500 rounded-full inline-block"></span>
              Balance
            </div>
          </div>
        </div>

        {/* Habits */}
        <div className="bg-gray-50 border border-gray-200 rounded-3xl p-6 shadow-xl hover:shadow-2xl transition">
          {/* Header */}
          <div className="flex justify-between mb-4 items-center">
            <h2 className="font-bold text-xl flex items-center gap-2 text-black">
              <Clock className="text-black" /> Habits
            </h2>
            <button
              onClick={() => navigate("/dashboard/habits")}
              className="text-sm font-medium text-black hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>

          {(() => {
            const today = new Date();
            const todayStr = today.toISOString().split("T")[0];
            const todayDay = today.toLocaleDateString("en-US", {
              weekday: "short",
            }); // e.g. "Fri"
            const daysOfWeek = [
              "Sun",
              "Mon",
              "Tue",
              "Wed",
              "Thu",
              "Fri",
              "Sat",
            ];
            const todayIndex = today.getDay();

            // Today’s Habits
            const todayHabits = habits.filter((h) => {
              const createdAtDate = new Date(h.createdAt)
                .toISOString()
                .split("T")[0];
              const isCreatedToday = createdAtDate === todayStr;

              if (h.repeat === "daily") return true;

              if (h.repeat === "weekly") {
                return (
                  h.selectedDays.includes(todayDay) ||
                  (isCreatedToday && h.selectedDays.includes(todayDay))
                );
              }

              return false;
            });

            //  Upcoming Habits (only next scheduled day)
            const upcomingHabits = (() => {
              const nextDayIndex = (todayIndex + 1) % 7; // tomorrow (wraps to Sun after Sat)
              const nextDayName = daysOfWeek[nextDayIndex];

              return habits.filter(
                (h) =>
                  h.repeat === "weekly" &&
                  h.selectedDays.includes(nextDayName) && // habit occurs on next day
                  !h.selectedDays.includes(daysOfWeek[todayIndex]) // not today
              );
            })();

            const doneCount = todayHabits.filter(
              (h) => h.completed && h.completed[todayStr]
            ).length;

            const total = todayHabits.length;
            const percent =
              total > 0 ? Math.round((doneCount / total) * 100) : 0;

            return (
              <>
                {/* Today’s Habits */}
                <p className="font-semibold text-lg text-gray-800 mb-2">
                  Today
                </p>
                {todayHabits.length > 0 ? (
                  todayHabits.slice(0, 3).map((h) => (
                    <div
                      key={h._id||h.id}
                      className="flex items-center gap-2 text-gray-800 mb-1"
                    >
                      <span
                        className={`w-3 h-3 rounded-full ${
                          h.completed?.[todayStr] ? "bg-black" : "bg-gray-400"
                        }`}
                      />
                      <span className="truncate">{h.title}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm italic mb-2">
                    No habits for today.
                  </p>
                )}

                {/* Upcoming Habits */}
                <p className="font-semibold text-lg text-gray-800 mt-4 mb-2">
                  Upcoming
                </p>
                {upcomingHabits.length > 0 ? (
                  upcomingHabits.slice(0, 3).map((h) => {
                    // show the *nearest* future day
                    const nextDay =
                      h.selectedDays.find(
                        (d) => daysOfWeek.indexOf(d) > todayIndex
                      ) || "Next";
                    return (
                      <div
                        key={h._id}
                        className="flex items-center gap-2 text-gray-800 mb-1"
                      >
                        <span className="w-3 h-3 bg-gray-400 rounded-full" />
                        <span className="truncate">
                          {h.title} ({nextDay})
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-500 text-sm italic">
                    No upcoming habits.
                  </p>
                )}
              </>
            );
          })()}
        </div>

        {/* Notes */}
        <div className="bg-gray-50 border border-gray-200 rounded-3xl p-6 shadow-xl hover:shadow-2xl transition">
          <div className="flex justify-between mb-4 items-center">
            <h2 className="font-bold text-xl flex items-center gap-2 text-black">
              <StickyNote className="text-black" /> Notes
            </h2>
            <button
              onClick={() => navigate("/dashboard/notes")}
              className="text-sm font-medium text-black hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>

          <p className="font-semibold text-lg text-gray-800 mb-2">
            Recent Notes
          </p>

          {(() => {
            // 🔹 Separate pinned and unpinned
            const pinnedNotes = notes
              .filter((n) => n.pinned || n.isPinned)
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            const unpinnedNotes = notes
              .filter((n) => !n.pinned && !n.isPinned)
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .slice(0, 5); //  chained properly now

            // 🔹 Combine pinned first, then unpinned
            const combinedNotes = [...pinnedNotes, ...unpinnedNotes].slice(
              0,
              5
            );

            return combinedNotes.length > 0 ? (
              combinedNotes.map((n) => (
                <p key={n._id || n.id} className="text-gray-800 truncate">
                  • {n.title || "Untitled"}
                </p>
              ))
            ) : (
              <p className="text-gray-500 text-sm italic">No notes yet.</p>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
