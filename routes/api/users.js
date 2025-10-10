const express = require("express");
const router = express.Router();
const UsersController = require("../../controllers/users.controller");
const AuthMiddleware = require("../../middleware/auth.middleware");
const { uploadProfileImage } = require("../../utils/fileUpload");
const multer = require("multer");
const path = require("path");

// All routes require authentication and admin/super privileges
// Note: AuthMiddleware.verifyToken is now applied at the parent level in routes/api/index.js
// router.use(AuthMiddleware.requireAdmin);

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File too large. Maximum size is 5MB.",
        error: err.message,
      });
    }
    return res.status(400).json({
      success: false,
      message: "File upload error",
      error: err.message,
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: "File validation error",
      error: err.message,
    });
  }
  next();
};

// Create a new user (supports both form data and JSON)
router.post(
  "/",
  uploadProfileImage,
  handleMulterError,
  UsersController.createUser
);

// Get all users with pagination and filtering
router.get("/", UsersController.getAllUsers);

// Get user statistics
// router.get("/stats", UsersController.getUserStats);

// Get user by ID
router.get("/:id", UsersController.getUserById);

// Update user (supports both form data and JSON)
router.patch(
  "/:id",
  uploadProfileImage,
  handleMulterError,
  UsersController.updateUser
);

// Delete user (soft delete)
router.delete("/:id", UsersController.deleteUser);

// Bulk create users
// router.post("/bulk", UsersController.bulkCreateUsers);

module.exports = router;
