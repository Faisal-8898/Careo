const express = require("express");
const router = express.Router();
const reservationsController = require("../controllers/reservationsController");
const {
  authenticate,
  authenticatePassenger,
  authenticateAdmin,
} = require("../middleware/auth");

// GET /api/reservations - Get user's reservations (passenger) or all reservations (admin)
router.get("/", authenticate, reservationsController.getReservations);

// GET /api/reservations/:id - Get reservation by ID
router.get("/:id", authenticate, reservationsController.getReservationById);

// POST /api/reservations - Create new reservation (passenger only)
router.post(
  "/",
  authenticatePassenger,
  reservationsController.createReservation
);

// PUT /api/reservations/:id - Update reservation
router.put("/:id", authenticate, reservationsController.updateReservation);

// DELETE /api/reservations/:id - Cancel reservation
router.delete("/:id", authenticate, reservationsController.cancelReservation);

// GET /api/reservations/booking/:bookingRef - Get reservation by booking reference
router.get(
  "/booking/:bookingRef",
  reservationsController.getReservationByBookingRef
);

// GET /api/reservations/schedule/:scheduleId - Get reservations for a schedule (admin only)
router.get(
  "/schedule/:scheduleId",
  authenticateAdmin,
  reservationsController.getReservationsBySchedule
);

// PUT /api/reservations/:id/status - Update reservation status (admin only)
router.put(
  "/:id/status",
  authenticateAdmin,
  reservationsController.updateReservationStatus
);

module.exports = router;
