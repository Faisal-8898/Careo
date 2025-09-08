const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { authenticateAdmin } = require("../middleware/auth");

// All admin routes require admin authentication

// GET /api/admin/dashboard - Get dashboard statistics
router.get("/dashboard", adminController.getDashboard);

// GET /api/admin/users - Get all users (passengers and admins)
router.get("/users", adminController.getAllUsers);

// GET /api/admin/users/:id - Get user by ID
router.get("/users/:id", adminController.getUserById);

// PUT /api/admin/users/:id/status - Update user status
router.put("/users/:id/status", adminController.updateUserStatus);

// GET /api/admin/reports/bookings - Get booking reports
router.get("/reports/bookings", adminController.getBookingReports);

// GET /api/admin/reports/revenue - Get revenue reports
router.get("/reports/revenue", adminController.getRevenueReports);

// GET /api/admin/reports/trains - Get train utilization reports
router.get("/reports/trains", adminController.getTrainReports);

module.exports = router;
