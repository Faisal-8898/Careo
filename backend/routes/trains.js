const express = require("express");
const router = express.Router();
const trainsController = require("../controllers/trainsController");
const { authenticateAdmin, optionalAuth } = require("../middleware/auth");

// GET /api/trains - Get all trains (public)
router.get("/", trainsController.getAllTrains);

// GET /api/trains/:id - Get train by ID (public)
router.get("/:id", trainsController.getTrainById);

// POST /api/trains - Create new train (admin only)
router.post("/", authenticateAdmin, trainsController.createTrain);

// PUT /api/trains/:id - Update train (admin only)
router.put("/:id", authenticateAdmin, trainsController.updateTrain);

// DELETE /api/trains/:id - Delete train (admin only)
router.delete("/:id", authenticateAdmin, trainsController.deleteTrain);

// GET /api/trains/route/:routeId - Get trains by route (public)
router.get("/route/:routeId", trainsController.getTrainsByRoute);

module.exports = router;
