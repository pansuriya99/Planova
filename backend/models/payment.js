const mongoose = require("mongoose");


/* ----------------------------- Payment Schema ----------------------------- */
const PaymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  stripeSessionId: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: "USD" },
  status: { type: String, enum: ["pending", "succeeded", "failed"], default: "pending" },
  paymentDate: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model("Payment", PaymentSchema);
