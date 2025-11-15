const mongoose = require("mongoose");

/* --------------------------- Mongodb Connection --------------------------- */
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: "planova",
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected: planova");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
