const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");

// POST /api/auth/passenger/register - Register new passenger
router.post("/passenger/register", authController.registerPassenger);

// POST /api/auth/passenger/login - Passenger login
router.post("/passenger/login", authController.loginPassenger);

// POST /api/auth/admin/login - Admin login
router.post("/admin/login", authController.loginAdmin);

// POST /api/auth/admin/create - Create new admin (requires admin auth)
router.post("/admin/create", authenticate, authController.createAdmin);

// GET /api/auth/profile - Get current user profile
router.get("/profile", authenticate, authController.getProfile);

// PUT /api/auth/profile - Update current user profile
router.put("/profile", authenticate, authController.updateProfile);

// POST /api/auth/change-password - Change password
router.post("/change-password", authenticate, authController.changePassword);

// POST /api/auth/logout - Logout (optional - mainly for client-side token cleanup)
router.post("/logout", authController.logout);

module.exports = router;
