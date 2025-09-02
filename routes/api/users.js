const express = require("express");
const router = express.Router();
const UsersController = require("../../controllers/users.controller");
const AuthMiddleware = require("../../middleware/auth.middleware");

// All routes require authentication and admin/super privileges
// router.use(AuthMiddleware.verifyToken);
// router.use(AuthMiddleware.requireAdmin);

// Create a new user
router.post("/", UsersController.createUser);

// Get all users with pagination and filtering
router.get("/", UsersController.getAllUsers);

// Get user statistics
// router.get("/stats", UsersController.getUserStats);

// Get user by ID
router.get("/:id", UsersController.getUserById);

// Update user
router.patch("/:id", UsersController.updateUser);

// Delete user (soft delete)
router.delete("/:id", UsersController.deleteUser);

// Bulk create users
// router.post("/bulk", UsersController.bulkCreateUsers);

module.exports = router;
