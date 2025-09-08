const express = require("express");
const router = express.Router();
const stationsController = require("../controllers/stationsController");
const { authenticateAdmin, optionalAuth } = require("../middleware/auth");

// GET /api/stations - Get all stations (public)
router.get("/", stationsController.getAllStations);

// GET /api/stations/:id - Get station by ID (public)
router.get("/:id", stationsController.getStationById);

// POST /api/stations - Create new station (admin only)
router.post("/", authenticateAdmin, stationsController.createStation);

// PUT /api/stations/:id - Update station (admin only)
router.put("/:id", authenticateAdmin, stationsController.updateStation);

// DELETE /api/stations/:id - Delete station (admin only)
router.delete("/:id", authenticateAdmin, stationsController.deleteStation);

// GET /api/stations/search/:term - Search stations by name or code (public)
router.get("/search/:term", stationsController.searchStations);

module.exports = router;
