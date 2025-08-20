const express = require("express");
const router = express.Router();
const AuthController = require("../../controllers/auth.controller");
const AuthMiddleware = require("../../middleware/auth.middleware");

// Public routes (no authentication required)
router.post("/register", AuthController.register);
router.post("/login", AuthController.login);

// Protected routes (authentication required)
router.get("/profile", AuthMiddleware.verifyToken, AuthController.getProfile);
router.put(
  "/profile",
  AuthMiddleware.verifyToken,
  AuthController.updateProfile
);
router.post(
  "/change-password",
  AuthMiddleware.verifyToken,
  AuthController.changePassword
);
router.post("/logout", AuthMiddleware.verifyToken, AuthController.logout);

// Admin only routes
router.get(
  "/users",
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireAdmin,
  (req, res) => {
    // TODO: Implement get all users for admin
    res.json({ message: "Get all users - to be implemented" });
  }
);

module.exports = router;
