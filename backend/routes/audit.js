const express = require("express");
const router = express.Router();
const auditController = require("../controllers/auditController");
const { authenticateAdmin } = require("../middleware/auth");

// All audit routes require admin authentication

// GET /api/audit/trains - Get audit trail for trains
router.get("/trains", authenticateAdmin, auditController.getTrainAudit);

// GET /api/audit/trains/:id - Get audit trail for specific train
router.get("/trains/:id", authenticateAdmin, auditController.getTrainAuditById);

// GET /api/audit/schedules - Get audit trail for schedules
router.get("/schedules", authenticateAdmin, auditController.getScheduleAudit);

// GET /api/audit/schedules/:id - Get audit trail for specific schedule
router.get(
  "/schedules/:id",
  authenticateAdmin,
  auditController.getScheduleAuditById
);

// GET /api/audit/passengers - Get audit trail for passengers (reservations)
router.get("/passengers", authenticateAdmin, auditController.getPassengerAudit);

// GET /api/audit/passengers/:id - Get audit trail for specific reservation
router.get(
  "/passengers/:id",
  authenticateAdmin,
  auditController.getPassengerAuditById
);

// GET /api/audit/payments - Get audit trail for payments
router.get("/payments", authenticateAdmin, auditController.getPaymentAudit);

// GET /api/audit/payments/:id - Get audit trail for specific payment
router.get(
  "/payments/:id",
  authenticateAdmin,
  auditController.getPaymentAuditById
);

// GET /api/audit/user/:userId - Get all actions by a specific user
router.get("/user/:userId", authenticateAdmin, auditController.getAuditByUser);

// GET /api/audit/daterange - Get audit records within date range
router.get(
  "/daterange",
  authenticateAdmin,
  auditController.getAuditByDateRange
);

// GET /api/audit/summary - Get audit summary statistics
router.get("/summary", authenticateAdmin, auditController.getAuditSummary);

module.exports = router;
