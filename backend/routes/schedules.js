const express = require("express");
const router = express.Router();
const schedulesController = require("../controllers/schedulesController");
const { authenticateAdmin, optionalAuth } = require("../middleware/auth");

// GET /api/schedules - Get all schedules with filters (public)
router.get("/", schedulesController.getAllSchedules);

// GET /api/schedules/:id - Get schedule by ID (public)
router.get("/:id", schedulesController.getScheduleById);

// POST /api/schedules - Create new schedule (admin only)
router.post("/", authenticateAdmin, schedulesController.createSchedule);

// PUT /api/schedules/:id - Update schedule (admin only)
router.put("/:id", authenticateAdmin, schedulesController.updateSchedule);

// DELETE /api/schedules/:id - Delete schedule (admin only)
router.delete("/:id", authenticateAdmin, schedulesController.deleteSchedule);

// GET /api/schedules/search/routes - Search schedules by route (public)
router.get("/search/routes", schedulesController.searchSchedulesByRoute);

// GET /api/schedules/train/:trainId - Get schedules for a specific train (public)
router.get("/train/:trainId", schedulesController.getSchedulesByTrain);

// PUT /api/schedules/:id/status - Update schedule status (admin only)
router.put(
  "/:id/status",
  authenticateAdmin,
  schedulesController.updateScheduleStatus
);

module.exports = router;
