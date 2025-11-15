const Transaction = require("../models/transaction");

/* ---------------------------- Create transactio --------------------------- */
exports.createTransaction = async (req, res) => {
  try {
    const { amount, type, category, name, icon, date } = req.body;

    if (!amount || !type || !name || !date) {
      return res
        .status(400)
        .json({ error: "All required fields must be provided" });
    }

    const transaction = new Transaction({
      userId: req.user.id,
      amount,
      type,
      category: category || "General",
      name,
      icon: icon || null,
      date,
    });

    const savedTransaction = await transaction.save();
    res.status(201).json({
      success: true,
      message: "Transaction created successfully",
      data: savedTransaction,
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

/* -------------------------- Get all transactions -------------------------- */
exports.getTransactions = async (req, res) => {
  try {
    let transactions;

    if (req.user.role === "admin") {
      transactions = await Transaction.find()
        .populate("userId", "fullName email")
        .sort({ date: -1 });
    } else {
      transactions = await Transaction.find({ userId: req.user.id }).sort({
        date: -1,
      });
    }

    res.json({ success: true, data: transactions });
  } catch (err) {
    console.error("getTransactions error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* -------------------------- Get transaction by id ------------------------- */
exports.getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user.id,
    }).populate("userId", "name email");

    if (!transaction) {
      return res
        .status(404)
        .json({ success: false, error: "Transaction not found" });
    }

    res.status(200).json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/* --------------------------- Update transaction --------------------------- */
exports.updateTransaction = async (req, res) => {
  try {
    const { amount, type, category, name, icon, date } = req.body;

    const updatedTransaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { amount, type, category, name, icon, date },
      { new: true, runValidators: true }
    );

    if (!updatedTransaction) {
      return res
        .status(404)
        .json({ success: false, error: "Transaction not found" });
    }

    res.status(200).json({
      success: true,
      message: "Transaction updated successfully",
      data: updatedTransaction,
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

/* --------------------------- Delete transaction --------------------------- */
exports.deleteTransaction = async (req, res) => {
  try {
    const deletedTransaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!deletedTransaction) {
      return res
        .status(404)
        .json({ success: false, error: "Transaction not found" });
    }

    res.status(200).json({
      success: true,
      message: "Transaction deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
