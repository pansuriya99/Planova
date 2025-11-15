import React, { useEffect, useRef, useState } from "react";
import { Plus, Trash2, Edit, X, Check, ArrowLeft } from "lucide-react";
import "../.././app.css";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import Picker from "@emoji-mart/react";
import emojiData from "@emoji-mart/data";
import {
  PieChart,
  Pie,
  ResponsiveContainer as PieResponsiveContainer,
} from "recharts";

const API_URL = "http://localhost:5000/api/transactions"; // <--- change if needed

export default function FinancePage() {
  // ------------------ STATES ------------------
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const [showAddIncomeModal, setShowAddIncomeModal] = useState(false);
  const [showEditIncomeModal, setShowEditIncomeModal] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);

  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showEditExpenseModal, setShowEditExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteType, setDeleteType] = useState(""); // "income" or "expense"

  // form states
  const [incomeForm, setIncomeForm] = useState({
    source: "",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    icon: "",
  });
  const [expenseForm, setExpenseForm] = useState({
    source: "",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    icon: "",
  });

  // emoji picker
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiTargetForm, setEmojiTargetForm] = useState(null); // "income" or "expense"
  const emojiPickerRef = useRef(null);

  const inputRef = useRef(null);
  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, [
    showAddIncomeModal,
    showEditIncomeModal,
    showAddExpenseModal,
    showEditExpenseModal,
  ]);

  // Close emoji picker if clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target)
      ) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ---------- Auth token ----------
  const token = localStorage.getItem("token") || "";

  // ------------------ Helpers ------------------
  // Normalize backend transaction to front-end shape
  const normalize = (t) => ({
    ...t,
    id: t._id || t.id,
    source: t.name || t.source || "",
    amount: t.amount,
    icon: t.icon || "",
    date: t.date ? t.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
    createdAt: t.createdAt || new Date().toISOString(),
    type: t.type,
  });

  // ------------------ FETCH / CRUD ------------------
  const fetchTransactions = async () => {
    try {
      const res = await fetch(API_URL, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      const data = await res.json();
      const arr = Array.isArray(data) ? data : data?.data ?? [];
      const normalized = arr.map(normalize);
      setIncomes(normalized.filter((t) => t.type === "Income"));
      setExpenses(normalized.filter((t) => t.type === "Expense"));
    } catch (err) {
      console.error("fetchTransactions error:", err);
    }
  };

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createTransactionAPI = async (payload) => {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      return data;
    } catch (err) {
      console.error("createTransactionAPI error:", err);
      throw err;
    }
  };

  const updateTransactionAPI = async (id, payload) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      return data;
    } catch (err) {
      console.error("updateTransactionAPI error:", err);
      throw err;
    }
  };

  const deleteTransactionAPI = async (id) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      const data = await res.json();
      return data;
    } catch (err) {
      console.error("deleteTransactionAPI error:", err);
      throw err;
    }
  };

  // ------------------ TOTALS ------------------
  const totalIncome = incomes.reduce(
    (sum, i) => sum + Number(i.amount || 0),
    0
  );
  const totalExpense = expenses.reduce(
    (sum, i) => sum + Number(i.amount || 0),
    0
  );
  const totalBalance = totalIncome - totalExpense;

  // ------------------ CHART DATA ------------------
  const incomeChartData = Object.entries(
    incomes.reduce((acc, i) => {
      const d = i.date || new Date().toISOString().slice(0, 10);
      acc[d] = (acc[d] || 0) + Number(i.amount || 0);
      return acc;
    }, {})
  )
    .sort()
    .map(([date, amount]) => ({ date, amount }));

  const expenseChartData = Object.entries(
    expenses.reduce((acc, i) => {
      const d = i.date || new Date().toISOString().slice(0, 10);
      acc[d] = (acc[d] || 0) + Number(i.amount || 0);
      return acc;
    }, {})
  )
    .sort()
    .map(([date, amount]) => ({ date, amount }));

  // ------------------ HANDLERS (UI + API) ------------------
  // OPEN / EDIT helpers
  const openAddIncome = () => {
    setEditingIncome(null);
    setIncomeForm({
      source: "",
      amount: "",
      date: new Date().toISOString().slice(0, 10),
      icon: "",
    });
    setShowAddIncomeModal(true);
  };
  const openEditIncome = (income) => {
    setEditingIncome(income);
    setIncomeForm({
      source: income.source || income.name || "",
      amount: income.amount || "",
      date: income.date
        ? income.date.slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      icon: income.icon || "",
    });
    setShowEditIncomeModal(true);
  };
  const openAddExpense = () => {
    setEditingExpense(null);
    setExpenseForm({
      source: "",
      amount: "",
      date: new Date().toISOString().slice(0, 10),
      icon: "",
    });
    setShowAddExpenseModal(true);
  };
  const openEditExpense = (expense) => {
    setEditingExpense(expense);
    setExpenseForm({
      source: expense.source || expense.name || "",
      amount: expense.amount || "",
      date: expense.date
        ? expense.date.slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      icon: expense.icon || "",
    });
    setShowEditExpenseModal(true);
  };

  // SAVE (create)
  const handleSaveIncome = async () => {
    if (!incomeForm.source || !incomeForm.amount) return;
    const payload = {
      name: incomeForm.source,
      amount: Number(incomeForm.amount),
      type: "Income",
      category: incomeForm.source,
      icon: incomeForm.icon || null,
      date: incomeForm.date,
    };
    try {
      await createTransactionAPI(payload);
      await fetchTransactions();
      setShowAddIncomeModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveExpense = async () => {
    if (!expenseForm.source || !expenseForm.amount) return;
    const payload = {
      name: expenseForm.source,
      amount: Number(expenseForm.amount),
      type: "Expense",
      category: expenseForm.source,
      icon: expenseForm.icon || null,
      date: expenseForm.date,
    };
    try {
      await createTransactionAPI(payload);
      await fetchTransactions();
      setShowAddExpenseModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  // UPDATE
  const handleUpdateIncome = async () => {
    if (!incomeForm.source || !incomeForm.amount || !editingIncome) return;
    const id = editingIncome.id || editingIncome._id;
    const payload = {
      name: incomeForm.source,
      amount: Number(incomeForm.amount),
      icon: incomeForm.icon || null,
      date: incomeForm.date,
    };
    try {
      await updateTransactionAPI(id, payload);
      await fetchTransactions();
      setShowEditIncomeModal(false);
      setEditingIncome(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateExpense = async () => {
    if (!expenseForm.source || !expenseForm.amount || !editingExpense) return;
    const id = editingExpense.id || editingExpense._id;
    const payload = {
      name: expenseForm.source,
      amount: Number(expenseForm.amount),
      icon: expenseForm.icon || null,
      date: expenseForm.date,
    };
    try {
      await updateTransactionAPI(id, payload);
      await fetchTransactions();
      setShowEditExpenseModal(false);
      setEditingExpense(null);
    } catch (err) {
      console.error(err);
    }
  };

  // DELETE
  const requestDelete = (type, item) => {
    setDeleteType(type);
    setDeleteTarget(item);
    setShowConfirmDelete(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id || deleteTarget._id;
    try {
      await deleteTransactionAPI(id);
      await fetchTransactions();
    } catch (err) {
      console.error(err);
    } finally {
      setShowConfirmDelete(false);
      setDeleteTarget(null);
      setDeleteType("");
    }
  };

  const cancelDelete = () => {
    setShowConfirmDelete(false);
    setDeleteTarget(null);
    setDeleteType("");
  };

  const openEmojiPickerFor = (formType) => {
    setEmojiTargetForm(formType);
    setShowEmojiPicker(true);
  };

  const handleEmojiSelect = (emoji) => {
    if (emojiTargetForm === "income")
      setIncomeForm((f) => ({ ...f, icon: emoji.native }));
    if (emojiTargetForm === "expense")
      setExpenseForm((f) => ({ ...f, icon: emoji.native }));
    setShowEmojiPicker(false);
  };

  // ------------------ UI ------------------
  return (
    <>
      {/* HEADER */}
      <div className="w-full min-h-[80px] shadow-lg bg-white mb-6 rounded-2xl flex flex-col sm:flex-row items-center justify-around gap-4 p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 flex items-center justify-center border border-black rounded-full bg-white overflow-hidden">
            <img
              src="/src/assets/blance.png"
              alt="Balance"
              className="h-6 w-6 object-contain"
            />
          </div>
          <div>
            <div className="text-md font-bold">Total Balance</div>
            <div className="text-lg font-semibold text-black">
              ₹{Number(totalBalance || 0).toLocaleString()}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 flex items-center justify-center border border-black rounded-full bg-white overflow-hidden">
            <img
              src="/src/assets/income.png"
              alt="Income"
              className="h-6 w-6 object-contain"
            />
          </div>
          <div>
            <div className="text-md font-bold">Total Income</div>
            <div className="text-lg font-semibold text-black">
              ₹{Number(totalIncome || 0).toLocaleString()}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 flex items-center justify-center border border-black rounded-full bg-white overflow-hidden">
            <img
              src="/src/assets/expense.png"
              alt="Expense"
              className="h-6 w-6 object-contain"
            />
          </div>
          <div>
            <div className="text-md font-bold">Total Expense</div>
            <div className="text-lg font-semibold text-black">
              ₹{Number(totalExpense || 0).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* LAST 6 ENTRIES & PIE CHART */}
      {(incomes.length > 0 || expenses.length > 0) && (
        <div className="w-full flex flex-col md:flex-row gap-6 mb-8">
          {/* Left: Last 6 incomes and expenses */}
          <div className="flex-1 bg-white rounded-2xl shadow-lg">
            <div className="text-lg font-bold pt-4 pl-4 border-b border-gray-200">
              Recent Transactions
            </div>
            <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto p-2">
              {[...incomes, ...expenses]
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) // sort by createdAt
                .slice(0, 5) // last 5 transactions
                .map((item) => {
                  const isIncome = incomes.find((i) => i.id === item.id);
                  const date = new Date(item.createdAt || Date.now()); // fallback if createdAt missing
                  const day = date.getDate();
                  const month = date.toLocaleString("en-US", {
                    month: "short",
                  });
                  const suffix =
                    day % 10 === 1 && day !== 11
                      ? "st"
                      : day % 10 === 2 && day !== 12
                      ? "nd"
                      : day % 10 === 3 && day !== 13
                      ? "rd"
                      : "th";

                  return (
                    <div
                      key={item.id}
                      className="relative rounded-lg flex flex-col cursor-default bg-white shadow-sm border border-gray-100 min-h-[60px] w-full"
                    >
                      {/* Top-right: time */}
                      <div className="flex justify-end text-xs text-gray-400 pt-1 pr-1">
                        {date.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>

                      {/* Main row: icon, source, date, amount */}
                      <div className="flex items-center gap-2 pb-2 pr-2 pl-5">
                        <div className="h-8 w-8 flex items-center justify-center border border-gray-200 rounded-full overflow-hidden text-lg">
                          {item.icon ? (
                            item.icon
                          ) : (
                            <img
                              src={
                                isIncome
                                  ? "/src/assets/income.png"
                                  : "/src/assets/expense.png"
                              }
                              alt="default"
                              className="h-6 w-6 object-contain"
                            />
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="text-sm font-semibold text-gray-900 truncate">
                            {item.source}
                          </div>
                          <div className="text-xs text-gray-500">
                            {`${day}${suffix}, ${month}`}
                          </div>
                        </div>

                        {/* Amount with light bg */}
                        <div
                          className={`px-2 py-1 rounded text-sm font-semibold ${
                            isIncome
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          ₹{Number(item.amount || 0).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Right: Pie Chart */}
          <div className="w-full md:w-1/3 bg-white p-6 rounded-2xl shadow-lg">
            {/* Title */}
            <div className="text-lg font-bold mb-4">Financial Overview</div>

            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={[
                    { name: "Income", value: totalIncome, fill: "#16a34a" }, // Green
                    { name: "Expense", value: totalExpense, fill: "#dc2626" }, // Red
                    { name: "Balance", value: totalBalance, fill: "#3b82f6" }, // Blue
                  ]}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                />

                {/* Centered total balance */}
                <text
                  x="50%"
                  y="48%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-gray-900 font-bold"
                  style={{ fontSize: "15px" }}
                >
                  Total Balance
                </text>
                <text
                  x="50%"
                  y="57%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-gray-900 font-bold"
                  style={{ fontSize: "15px" }}
                >
                  ₹{Number(totalBalance || 0).toLocaleString()}
                </text>

                <Tooltip />
              </PieChart>
            </ResponsiveContainer>

            {/* Values below chart */}
            <div className="flex justify-between items-center mt-4">
              <div className="flex items-center gap-1">
                <span className="h-3 w-3 bg-green-500 inline-block"></span>
                Income
              </div>
              <div className="flex items-center gap-1">
                <span className="h-3 w-3 bg-red-500 inline-block"></span>
                Expense
              </div>
              <div className="flex items-center gap-1">
                <span className="h-3 w-3 bg-blue-500 inline-block"></span>
                Balance
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INCOME LIST */}
      <Section
        title="Income"
        items={incomes}
        onAdd={openAddIncome}
        onEdit={openEditIncome}
        onDelete={(item) => requestDelete("income", item)}
        defaultImg="/src/assets/income.png"
      />
      {incomes.length > 0 && (
        <Chart title="Income Chart" data={incomeChartData} />
      )}

      {/* EXPENSE LIST */}
      <Section
        title="Expense"
        items={expenses}
        onAdd={openAddExpense}
        onEdit={openEditExpense}
        onDelete={(item) => requestDelete("expense", item)}
        defaultImg="/src/assets/expense.png"
      />
      {expenses.length > 0 && (
        <Chart title="Expense Chart" data={expenseChartData} />
      )}

      {/* ADD MODALS */}
      {(showAddIncomeModal || showAddExpenseModal) && (
        <AddModal
          title={showAddIncomeModal ? "Add Income" : "Add Expense"}
          form={showAddIncomeModal ? incomeForm : expenseForm}
          setForm={showAddIncomeModal ? setIncomeForm : setExpenseForm}
          onClose={() => {
            setShowAddIncomeModal(false);
            setShowAddExpenseModal(false);
          }}
          onSave={showAddIncomeModal ? handleSaveIncome : handleSaveExpense}
          openEmojiPicker={() =>
            openEmojiPickerFor(showAddIncomeModal ? "income" : "expense")
          }
        />
      )}

      {/* EDIT MODALS */}
      {(showEditIncomeModal || showEditExpenseModal) && (
        <EditModal
          title={showEditIncomeModal ? "Edit Income" : "Edit Expense"}
          form={showEditIncomeModal ? incomeForm : expenseForm}
          setForm={showEditIncomeModal ? setIncomeForm : setExpenseForm}
          onBack={() => {
            setShowEditIncomeModal(false);
            setShowEditExpenseModal(false);
            setEditingIncome(null);
            setEditingExpense(null);
          }}
          onSave={
            showEditIncomeModal ? handleUpdateIncome : handleUpdateExpense
          }
          onDelete={
            showEditIncomeModal
              ? () => requestDelete("income", editingIncome)
              : () => requestDelete("expense", editingExpense)
          }
          openEmojiPicker={() =>
            openEmojiPickerFor(showEditIncomeModal ? "income" : "expense")
          }
        />
      )}

      {showEmojiPicker && (
        <div ref={emojiPickerRef} className="fixed z-50 right-10 top-20">
          <Picker data={emojiData} onEmojiSelect={handleEmojiSelect} />
        </div>
      )}

      {showConfirmDelete && (
        <ConfirmDeleteModal
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
          item={deleteTarget}
          type={deleteType}
        />
      )}
    </>
  );
}

// ------------------ GRID SECTION ------------------
function Section({ title, items, onAdd, onEdit, onDelete, defaultImg }) {
  return (
    <div className="w-full rounded-2xl p-6 bg-white mb-8 relative flex justify-center">
      <div className="absolute top-6 left-6 right-6 flex justify-between items-center">
        {/* Title on the left */}
        <div className="text-2xl font-bold">{title} Sources</div>

        {/* Add button on the right */}
        <button
          onClick={onAdd}
          className="p-3 rounded-full bg-black text-white shadow-lg hover:scale-110 transition"
          title={`Add ${title}`}
        >
          <Plus size={28} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 mt-20 mb-10 justify-items-center w-full">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-10 text-gray-500 text-center col-span-2">
            <img
              src={defaultImg}
              alt={`No ${title}`}
              className="w-34 h-34 mb-4 opacity-70"
            />
            <p className="text-lg font-medium">
              Add your first {title.toLowerCase()} and start managing your
              finances.
            </p>
          </div>
        ) : (
          items
            ?.slice()
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
            .map((item) => (
              <div
                key={item.id}
                className="relative rounded-lg pr-4 pl-4 pt-2 pb-2 flex flex-col gap-0 cursor-default bg-gray-50 shadow-lg transition transform hover:scale-[1.02] h-[110px] w-[460px]"
              >
                {/* Top-right create time */}
                <div className="flex justify-end text-xs text-gray-500">
                  {new Date(item.createdAt || Date.now()).toLocaleTimeString(
                    [],
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </div>

                {/* Main row: icon, title/date, amount */}
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 p-2 flex items-center justify-center border border-gray-200 rounded-full overflow-hidden text-xl">
                    {item.icon ? (
                      item.icon
                    ) : (
                      <img
                        src={defaultImg}
                        alt="default"
                        className="h-10 w-10 object-contain"
                      />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="text-lg font-bold text-gray-900 truncate">
                      {item.source}
                    </div>
                    <div className="text-sm text-gray-500">
                      {(() => {
                        const date = new Date(item.date);
                        const day = date.getDate();
                        const month = date.toLocaleString("en-US", {
                          month: "short",
                        });
                        const suffix =
                          day % 10 === 1 && day !== 11
                            ? "st"
                            : day % 10 === 2 && day !== 12
                            ? "nd"
                            : day % 10 === 3 && day !== 13
                            ? "rd"
                            : "th";
                        return `${day}${suffix}, ${month}`;
                      })()}
                    </div>
                  </div>

                  {/* Amount on right */}
                  <div className="flex items-center gap-1">
                    <img
                      src={
                        title.toLowerCase() === "income"
                          ? "/src/assets/profit.png"
                          : "/src/assets/loss.png"
                      }
                      alt={title.toLowerCase() === "income" ? "Profit" : "Loss"}
                      className="h-6 w-6 object-contain"
                    />
                    <div
                      className={`text-lg font-semibold ${
                        title.toLowerCase() === "income"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      ₹{Number(item.amount || 0).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Bottom-right edit/delete */}
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => onEdit(item)}
                    className="p-2 rounded-full bg-gray-200 cursor-pointer"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(item)}
                    className="p-2 rounded-full bg-red-600 text-white hover:bg-red-500 cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}

// ------------------ CHART COMPONENT ------------------
function Chart({ title, data }) {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-lg mb-8">
      <div className="text-lg font-bold mb-2">{title}</div>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="amount"
            stroke="#000"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ------------------ ADD MODAL ------------------
function AddModal({ title, form, setForm, onClose, onSave, openEmojiPicker }) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  return (
    <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 relative">
        <div className="flex justify-between items-center mb-4">
          <div className="text-xl font-bold">{title}</div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-black text-white hover:bg-gray-900 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* ICON PICKER */}
        <div className="flex items-center gap-2 mb-4">
          <div
            className="h-10 w-10 flex items-center justify-center rounded-full border border-gray-800 bg-white text-xl cursor-pointer"
            onClick={openEmojiPicker}
          >
            {form.icon ? (
              form.icon
            ) : (
              <img
                src="/src/assets/img.png"
                alt="default"
                className="h-6 w-6"
              />
            )}
          </div>
          <div className="text-lg font-medium">Pick Icon</div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-md font-semibold">Source</label>
            <input
              ref={inputRef}
              value={form.source}
              onChange={(e) =>
                setForm((s) => ({ ...s, source: e.target.value }))
              }
              placeholder="Enter source name"
              maxLength={30}
              className="w-full p-2 border border-gray-300 rounded outline-none"
            />
          </div>
          <div>
            <label className="block text-md font-semibold">Amount</label>
            <input
              value={form.amount}
              onChange={(e) => {
                let value = e.target.value;
                if (value.length > 10) value = value.slice(0, 10);
                setForm((s) => ({ ...s, amount: value }));
              }}
              placeholder="Enter amount"
              min="0"
              type="number"
              className="w-full p-2 border border-gray-300 rounded outline-none"
            />
          </div>
          <div>
            <label className="block text-md font-semibold">Date</label>
            <input
              value={form.date}
              onChange={(e) => setForm((s) => ({ ...s, date: e.target.value }))}
              type="date"
              className="w-full p-2 border border-gray-300 rounded outline-none"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={onSave}
              className="w-full cursor-pointer hover:bg-gray-900 px-4 py-2 bg-black text-white rounded"
            >
              {title.includes("Income") ? "Add Income" : "Add Expense"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ------------------ EDIT MODAL ------------------
function EditModal({
  title,
  form,
  setForm,
  onBack,
  onSave,
  onDelete,
  openEmojiPicker,
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  return (
    <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 relative">
        <div className="flex justify-between items-center mb-4">
          <div className="font-bold flex items-center gap-2 ">
            <button
              onClick={onBack}
              className="flex items-center cursor-pointer"
            >
              <ArrowLeft size={22} />
              <p className="text-lg text-center ml-1">Back</p>
            </button>
          </div>

          <div className="text-xl font-bold"> {title}</div>
          <div className="flex items-center gap-2">
            <button
              onClick={onSave}
              className="p-2 rounded-full bg-black text-white hover:bg-gray-800 cursor-pointer"
            >
              <Check size={20} />
            </button>
            <button
              onClick={onDelete}
              className="p-2 rounded-full bg-red-600 text-white hover:bg-red-500 cursor-pointer"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>

        {/* ICON PICKER */}
        <div className="flex items-center gap-2 mb-4">
          <div
            className="h-10 w-10 flex items-center justify-center rounded-full border border-gray-800 bg-white text-xl cursor-pointer"
            onClick={openEmojiPicker}
          >
            {form.icon ? (
              form.icon
            ) : (
              <img
                src="/src/assets/img.png"
                alt="default"
                className="h-6 w-6"
              />
            )}
          </div>
          <div className="text-lg font-medium">Pick Icon</div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-md font-semibold">Source</label>
            <input
              ref={inputRef}
              value={form.source}
              maxLength={30}
              onChange={(e) =>
                setForm((s) => ({ ...s, source: e.target.value }))
              }
              placeholder="Enter source name"
              className="w-full p-2 border border-gray-300 rounded outline-none"
            />
          </div>
          <div>
            <label className="block text-md font-semibold">Amount</label>
            <input
              value={form.amount}
              onChange={(e) => {
                let value = e.target.value;
                if (value.length > 10) value = value.slice(0, 10);
                setForm((s) => ({ ...s, amount: value }));
              }}
              placeholder="Enter amount"
              type="number"
              min="0"
              className="w-full p-2 border border-gray-300 rounded outline-none"
            />
          </div>
          <div>
            <label className="block text-md font-semibold">Date</label>
            <input
              value={form.date}
              onChange={(e) => setForm((s) => ({ ...s, date: e.target.value }))}
              type="date"
              className="w-full p-2 border border-gray-300 rounded outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ------------------ CONFIRM DELETE MODAL ------------------
function ConfirmDeleteModal({ onConfirm, onCancel, item, type }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-6 text-center">
        <div className="text-xl font-bold mb-4">Delete Confirmation</div>
        <p className="text-md text-gray-600 mb-5">
          Are you sure you want to delete this {type}?
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-black rounded hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
