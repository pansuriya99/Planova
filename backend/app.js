const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const routes = require("./routes");
const { notFound, errorHandler } = require("./middlewares/error.middleware");

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173", // Change if your frontend runs on a different port
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.use(bodyParser.json());

/* ------------------------------- API Routes ------------------------------- */
app.use("/api", routes);

/* ---------------------------- Error Middleware ---------------------------- */
app.use(notFound);
app.use(errorHandler);

module.exports = app;
