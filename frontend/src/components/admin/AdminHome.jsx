import React, { useEffect, useState } from "react";
import {
  Users,
  StickyNote,
  CheckCircle,
  CalendarDays,
  Clock,
  TrendingUp,
  UserPlus,
  Target,
  Activity,
  PieChart as PieChartIcon,
  Zap,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { toast } from "react-toastify";

export default function AdminHome() {
  const [stats, setStats] = useState({
    users: 0,
    tasks: 0,
    events: 0,
    finances: 0,
    notes: 0,
    goals: 0,
  });

  const [recentData, setRecentData] = useState({
    users: [],
    tasks: [],
    events: [],
    finances: [],
    notes: [],
    goals: [],
  });

  const [userGrowthData, setUserGrowthData] = useState([]);
  const [mostActiveUsers, setMostActiveUsers] = useState([]);
  const [featureUsage, setFeatureUsage] = useState([]);
  const [averageUsage, setAverageUsage] = useState([]);
  const [activityFeed, setActivityFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const token = localStorage.getItem("token");

  // Colors for charts (grayscale)
  const COLORS = [
    "#111827", // Deep Black
    "#1F2937", // Dark Gray
    "#334155", // Slate Gray
    "#475569", // Medium Gray
    "#6B7280", // Light Gray
    "#9CA3AF", // Very Light Gray
  ];

  // Fetch data from APIs
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const urls = {
        users: "http://localhost:5000/api/users",
        tasks: "http://localhost:5000/api/tasks",
        events: "http://localhost:5000/api/events",
        transactions: "http://localhost:5000/api/transactions",
        notes: "http://localhost:5000/api/notes",
        goals: "http://localhost:5000/api/goals",
      };

      const responses = await Promise.all(
        Object.values(urls).map((url) => fetch(url, { headers }))
      );
      const data = await Promise.all(responses.map((r) => r.json()));

      const [
        usersData,
        tasksData,
        eventsData,
        financeData,
        notesData,
        goalsData,
      ] = data;

      const allUsers = usersData?.users || [];
      const allTasks = tasksData?.tasks || tasksData?.data || [];
      const allEvents = eventsData?.events || eventsData?.data || [];
      const allTransactions =
        financeData?.transactions || financeData?.data || [];
      const allNotes = notesData?.notes || notesData?.data || [];
      const allGoals = goalsData?.goals || goalsData?.data || [];

      // Filter normal users (exclude admin accounts)
      const normalUsers = allUsers.filter(
        (u) =>
          u.role !== "admin" && !u.email?.toLowerCase()?.startsWith("admin")
      );

      // Sort notes (most recent first)
      const sortedNotes = [...allNotes].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      // Update counts
      setStats({
        users: normalUsers.length,
        tasks: allTasks.length,
        events: allEvents.length,
        finances: allTransactions.length,
        notes: sortedNotes.length,
        goals: allGoals.length,
      });

      // Keep recent data (use more items so analytics can compute)
      setRecentData({
        users: normalUsers,
        tasks: allTasks,
        events: allEvents,
        finances: allTransactions,
        notes: sortedNotes,
        goals: allGoals,
      });

      // Notify new users
      const storedCount = localStorage.getItem("userCount");
      if (storedCount && normalUsers.length > parseInt(storedCount)) {
      }
      localStorage.setItem("userCount", normalUsers.length);

      // Build user map for quick lookup by id
      const userMap = {};
      normalUsers.forEach((u) => {
        userMap[u._id] = u;
      });

      // -------------------------------
      // Most Active Users (top 5)
      // Count records by userId across modules
      const userActivityCount = {};

      const collectUserId = (item) => {
        // item may have fields: userId (object or string), user (object), createdBy, etc.
        if (!item) return null;
        if (typeof item.userId === "object" && item.userId !== null)
          return item.userId._id || item.userId.id;
        if (typeof item.userId === "string") return item.userId;
        if (typeof item.user === "object" && item.user !== null)
          return item.user._id || item.user.id;
        if (typeof item.createdBy === "object" && item.createdBy !== null)
          return item.createdBy._id || item.createdBy.id;
        if (typeof item.createdBy === "string") return item.createdBy;
        return null;
      };

      [
        ...allTasks,
        ...allEvents,
        ...allNotes,
        ...allGoals,
        ...allTransactions,
      ].forEach((rec) => {
        const uid = collectUserId(rec);
        if (!uid) return;
        userActivityCount[uid] = (userActivityCount[uid] || 0) + 1;
      });

      const topUsers = Object.entries(userActivityCount)
        .map(([uid, count]) => {
          const user = userMap[uid];
          return {
            _id: uid,
            name: user ? user.fullName || user.name || user.email : uid,
            count,
          };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setMostActiveUsers(topUsers);

      // Feature Usage (simple counts)
      const features = [
        { name: "Notes", value: allNotes.length },
        { name: "Tasks", value: allTasks.length },
        { name: "Events", value: allEvents.length },
        { name: "Finances", value: allTransactions.length },
        { name: "Goals", value: allGoals.length },
      ];
      setFeatureUsage(features);

      // Average Daily Usage (last 7 days)
      const allRecords = [
        ...allNotes,
        ...allTasks,
        ...allEvents,
        ...allGoals,
        ...allTransactions,
      ];

      const today = new Date();
      const last7 = Array.from({ length: 7 }).map((_, idx) => {
        const d = new Date(today);
        d.setDate(today.getDate() - (6 - idx)); // oldest first
        const iso = d.toISOString().split("T")[0];
        const dayLabel = d.toLocaleDateString("en-GB", { weekday: "short" });
        const count = allRecords.filter(
          (r) => r.createdAt && r.createdAt.startsWith(iso)
        ).length;
        return { day: dayLabel, count };
      });
      setAverageUsage(last7);

      // Recent Activity Feed (latest 10)
      const mapActivity = (rec, type) => {
        const uid = collectUserId(rec);
        const user = uid && (userMap[uid] || null);
        return {
          type,
          name: rec.title || rec.name || rec.title || "Untitled",
          userName: user ? user.fullName || user.name || user.email : "Unknown",
          createdAt: rec.createdAt || rec.date || rec.updatedAt || null,
        };
      };

      const activities = [
        ...allNotes.map((n) => mapActivity(n, "Note")),
        ...allTasks.map((t) => mapActivity(t, "Task")),
        ...allEvents.map((e) => mapActivity(e, "Event")),
        ...allTransactions.map((f) => mapActivity(f, "Finance")),
        ...allGoals.map((g) => mapActivity(g, "Goal")),
      ]
        .filter((a) => a.createdAt)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10);

      setActivityFeed(activities);

      // User Growth by month (for chart)
      const userCountByMonth = {};
      normalUsers.forEach((u) => {
        if (u.createdAt) {
          const month = new Date(u.createdAt).toLocaleString("en-US", {
            month: "short",
          });
          userCountByMonth[month] = (userCountByMonth[month] || 0) + 1;
        }
      });

      const monthsOrder = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const chartData = monthsOrder.map((m) => ({
        month: m,
        users: userCountByMonth[m] || 0,
      }));
      setUserGrowthData(chartData);
    } catch (err) {
      // console.error("Dashboard fetch error:", err);
      toast.error("Error loading dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="p-10 text-center text-gray-500 font-medium">
        Loading dashboard...
      </div>
    );
  }

  // Filter notes for search (client-side)
  const filteredNotes = recentData.notes.filter((n) =>
    n.title?.toLowerCase().includes(search.toLowerCase())
  );

  // Today's counts (derived from recentData arrays)
  const isoToday = new Date().toISOString().split("T")[0];
  const todayUsers = recentData.users.filter(
    (u) => u.createdAt && u.createdAt.startsWith(isoToday)
  );
  const todayTasks = recentData.tasks.filter(
    (t) => t.createdAt && t.createdAt.startsWith(isoToday)
  );
  const todayEvents = recentData.events.filter(
    (e) => e.createdAt && e.createdAt.startsWith(isoToday)
  );
  const todayFinances = recentData.finances.filter(
    (f) => f.createdAt && f.createdAt.startsWith(isoToday)
  );
  const todayNotes = recentData.notes.filter(
    (n) => n.createdAt && n.createdAt.startsWith(isoToday)
  );
  const todayGoals = recentData.goals.filter(
    (g) => g.createdAt && g.createdAt.startsWith(isoToday)
  );

  // Greeting (show logged in user name if available)
  const hour = new Date().getHours();
  const userData =
    JSON.parse(localStorage.getItem("userData")) ||
    JSON.parse(localStorage.getItem("user")) ||
    {};
  const name = userData?.fullName || userData?.name || "Admin";
  const greeting =
    hour < 12
      ? `🌅 Good Morning, ${name}!`
      : hour < 17
      ? `🌞 Good Afternoon, ${name}!`
      : hour < 20
      ? `🌇 Good Evening, ${name}!`
      : `🌙 Good Night, ${name}!`;

  return (
    <div className="p-4 sm:p-6 bg-gray-100 min-h-screen text-gray-900">
      {/* Header */}
      <div className="mb-6 text-center sm:text-left">
        <h1 className="text-3xl font-bold text-gray-900">{greeting}</h1>
        <p className="text-gray-600 mt-1">
          {new Date().toLocaleDateString("en-GB", {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {[
          { title: "Users", count: stats.users, icon: <Users color="black" /> },
          {
            title: "Tasks",
            count: stats.tasks,
            icon: <CheckCircle color="black" />,
          },
          {
            title: "Events",
            count: stats.events,
            icon: <CalendarDays color="black" />,
          },
          {
            title: "Finances",
            count: stats.finances,
            icon: <TrendingUp color="black" />,
          },
          {
            title: "Notes",
            count: stats.notes,
            icon: <StickyNote color="black" />,
          },
          {
            title: "Goals",
            count: stats.goals,
            icon: <Target color="black" />,
          },
        ].map((item, idx) => (
          <div
            key={idx}
            className="bg-white hover:bg-gray-50 border border-gray-200 p-4 rounded-2xl shadow-sm hover:shadow-lg transition cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{item.title}</p>
                <h3 className="text-xl font-bold text-gray-900">
                  {item.count}
                </h3>
              </div>
              <div className="text-gray-800 bg-gray-100 p-3 rounded-xl">
                {item.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Today's Summary */}
      <div className="bg-white rounded-2xl shadow p-5 mb-6 border border-gray-200">
        <h2 className="text-lg font-bold mb-4 text-gray-900 flex items-center gap-2">
          <Clock color="black" /> Today’s Summary
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm ">
          <div className="bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl p-3 transition cursor-pointer">
            <p className="text-gray-600 flex items-center gap-2">
              <UserPlus size={16} color="black" /> Users Registered Today
            </p>
            <p className="text-xl font-bold text-gray-900">
              {todayUsers.length}
            </p>
          </div>

          <div className="bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl p-3 transition cursor-pointer">
            <p className="text-gray-600 flex items-center gap-2">
              <CheckCircle size={16} color="black" /> Tasks Added Today
            </p>
            <p className="text-xl font-bold text-gray-900">
              {todayTasks.length}
            </p>
          </div>

          <div className="bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl p-3 transition cursor-pointer">
            <p className="text-gray-600 flex items-center gap-2">
              <CalendarDays size={16} color="black" /> Events Added Today
            </p>
            <p className="text-xl font-bold text-gray-900">
              {todayEvents.length}
            </p>
          </div>

          <div className="bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl p-3 transition cursor-pointer">
            <p className="text-gray-600 flex items-center gap-2">
              <TrendingUp size={16} color="black" /> Finances Added Today
            </p>
            <p className="text-xl font-bold text-gray-900">
              {todayFinances.length}
            </p>
          </div>

          <div className="bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl p-3 transition cursor-pointer">
            <p className="text-gray-600 flex items-center gap-2">
              <StickyNote size={16} color="black" /> Notes Created Today
            </p>
            <p className="text-xl font-bold text-gray-900">
              {todayNotes.length}
            </p>
          </div>

          <div className="bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl p-3 transition cursor-pointer">
            <p className="text-gray-600 flex items-center gap-2">
              <Target size={16} color="black" /> Goals Created Today
            </p>
            <p className="text-xl font-bold text-gray-900">
              {todayGoals.length}
            </p>
          </div>
        </div>
      </div>

      {/* Charts + Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* User Growth */}
        <div className="bg-white rounded-2xl shadow p-5">
          <h2 className="text-lg font-bold mb-3 text-gray-900 flex items-center gap-2">
            <TrendingUp color="black" /> User Growth Overview
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={userGrowthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="users"
                stroke="#111827"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Feature Usage */}
        <div className="bg-white rounded-2xl shadow p-5">
          <h2 className="text-lg font-bold mb-3 text-gray-900 flex items-center gap-2">
            <PieChartIcon color="black" /> Top Features Used
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={featureUsage}
                dataKey="value"
                nameKey="name"
                outerRadius={90}
                innerRadius={40}
                label
              >
                {featureUsage.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Most Active Users */}
        <div className="bg-white rounded-2xl shadow p-5 border border-gray-200">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Activity color="black" /> Most Active Users
          </h2>
          <ul className="space-y-2">
            {mostActiveUsers.length === 0 ? (
              <li className="text-gray-500">No data available</li>
            ) : (
              mostActiveUsers.map((u, i) => (
                <li
                  key={u._id || i}
                  className="flex justify-between bg-gray-50 rounded-lg p-2 hover:bg-gray-100 cursor-pointer"
                >
                  <div>
                    <p className="font-medium text-gray-900">{u.name}</p>
                    <p className="text-xs text-gray-500">Top creator</p>
                  </div>
                  <div className="flex items-center">
                    <span className="font-semibold text-gray-900 mr-2">
                      {u.count}
                    </span>
                    <span className="text-xs text-gray-500">actions</span>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Average Daily Usage */}
        <div className="bg-white rounded-2xl shadow p-5 border border-gray-200">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Zap color="black" /> Average Daily Usage (Last 7 Days)
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={averageUsage}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Bar dataKey="count" fill="#111827" radius={8} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="bg-white rounded-2xl shadow p-5 mb-6 border border-gray-200">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Clock color="black" /> Recent Activity Feed
        </h2>
        <div className="max-h-[600px] overflow-y-auto">
          {activityFeed.length === 0 ? (
            <p className="text-gray-500">No recent activity</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {activityFeed.map((a, i) => (
                <li
                  key={i}
                  className="flex justify-between bg-gray-50 cursor-pointer p-2 rounded-lg hover:bg-gray-100"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {a.type}: {a.name}
                    </p>
                    <p className="text-xs text-gray-500">by {a.userName}</p>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(a.createdAt).toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
