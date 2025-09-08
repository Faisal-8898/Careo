const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("combined"));

// Database connection
const db = require("./database/connection");

// Authentication routes
app.use("/api/auth", require("./routes/auth"));

// Protected routes
app.use("/api/stations", require("./routes/stations"));
app.use("/api/routes", require("./routes/routes"));
app.use("/api/trains", require("./routes/trains"));
app.use("/api/schedules", require("./routes/schedules"));
app.use("/api/reservations", require("./routes/reservations"));
app.use("/api/payments", require("./routes/payments"));
app.use("/api/audit", require("./routes/audit"));

// Admin routes
app.use("/api/admin", require("./routes/admin"));

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Train Ticket Management System is running",
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: "Something went wrong!",
    details: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    path: req.path,
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});

module.exports = app;
