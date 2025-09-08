const express = require("express");
const router = express.Router();
const routesController = require("../controllers/routesController");
const { authenticateAdmin, optionalAuth } = require("../middleware/auth");

// GET /api/routes - Get all routes (public)
router.get("/", routesController.getAllRoutes);

// GET /api/routes/:id - Get route by ID with stations (public)
router.get("/:id", routesController.getRouteById);

// POST /api/routes - Create new route (admin only)
router.post("/", authenticateAdmin, routesController.createRoute);

// PUT /api/routes/:id - Update route (admin only)
router.put("/:id", authenticateAdmin, routesController.updateRoute);

// DELETE /api/routes/:id - Delete route (admin only)
router.delete("/:id", authenticateAdmin, routesController.deleteRoute);

// POST /api/routes/:id/stations - Add station to route (admin only)
router.post(
  "/:id/stations",
  authenticateAdmin,
  routesController.addStationToRoute
);

// DELETE /api/routes/:id/stations/:stationId - Remove station from route (admin only)
router.delete(
  "/:id/stations/:stationId",
  authenticateAdmin,
  routesController.removeStationFromRoute
);

// GET /api/routes/:id/stations - Get all stations in a route (public)
router.get("/:id/stations", routesController.getRouteStations);

module.exports = router;
