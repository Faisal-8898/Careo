const express = require("express");
const router = express.Router();
const paymentsController = require("../controllers/paymentsController");
const {
  authenticate,
  authenticatePassenger,
  authenticateAdmin,
} = require("../middleware/auth");

// GET /api/payments - Get user's payments (passenger) or all payments (admin)
router.get("/", authenticate, paymentsController.getPayments);

// GET /api/payments/:id - Get payment by ID
router.get("/:id", authenticate, paymentsController.getPaymentById);

// POST /api/payments - Create new payment (passenger only)
router.post("/", authenticatePassenger, paymentsController.createPayment);

// PUT /api/payments/:id - Update payment
router.put("/:id", authenticate, paymentsController.updatePayment);

// PUT /api/payments/:id/status - Update payment status (admin only)
router.put(
  "/:id/status",
  authenticateAdmin,
  paymentsController.updatePaymentStatus
);

// POST /api/payments/:id/refund - Process refund (admin only)
router.post("/:id/refund", authenticateAdmin, paymentsController.processRefund);

// GET /api/payments/reservation/:reservationId - Get payments for a reservation
router.get(
  "/reservation/:reservationId",
  authenticate,
  paymentsController.getPaymentsByReservation
);

module.exports = router;
