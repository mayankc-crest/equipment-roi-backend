const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { users } = require("../models");
const { sendSuccessRespose, sendErrorResponse } = require("../utils/response");

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";

class AuthController {
  // User registration
  static async register(req, res) {
    try {
      const {
        email,
        password,
        first_name,
        last_name,
        phone_number,
        notes,
        street_address,
        city,
        state,
        country,
        zip_code,
        role = "sales representative",
      } = req.body;

      // Check if user already exists
      const existingUser = await users.findOne({ where: { email } });
      if (existingUser) {
        return sendErrorResponse(
          res,
          "User with this email already exists",
          400
        );
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user
      const user = await users.create({
        email,
        password: hashedPassword,
        first_name,
        last_name,
        phone_number,
        notes,
        street_address,
        city,
        state,
        country,
        zip_code,
        role,
      });

      // Generate JWT token
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      // Remove password from response
      const userResponse = user.toJSON();
      delete userResponse.password;

      return sendSuccessRespose(
        res,
        {
          user: userResponse,
          token,
        },
        "User registered successfully",
        201
      );
    } catch (error) {
      console.error("Registration error:", error);
      return sendErrorResponse(res, "Registration failed", 500);
    }
  }

  // User login
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await users.findOne({ where: { email } });
      if (!user) {
        return sendErrorResponse(res, "Invalid credentials", 401);
      }

      // Check if user is active
      if (!user.is_active) {
        return sendErrorResponse(res, "Account is deactivated", 401);
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return sendErrorResponse(res, "Invalid credentials", 401);
      }

      // Update last login
      await user.update({ last_login: new Date() });

      // Generate JWT token
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      // Remove password from response
      const userResponse = user.toJSON();
      delete userResponse.password;

      return sendSuccessRespose(
        res,
        {
          user: userResponse,
          token,
        },
        "Login successful",
        200
      );
    } catch (error) {
      console.error("Login error:", error);
      return sendErrorResponse(res, "Login failed", 500);
    }
  }

  // Get current user profile
  static async getProfile(req, res) {
    try {
      const userId = req.user.id;
      const user = await users.findByPk(userId, {
        attributes: { exclude: ["password"] },
      });

      if (!user) {
        return sendErrorResponse(res, "User not found", 404);
      }

      return sendSuccessRespose(
        res,
        { user },
        "Profile retrieved successfully",
        200
      );
    } catch (error) {
      console.error("Get profile error:", error);
      return sendErrorResponse(res, "Failed to get profile", 500);
    }
  }

  // Update user profile
  static async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const {
        first_name,
        last_name,
        email,
        phone_number,
        notes,
        street_address,
        city,
        state,
        country,
        zip_code,
      } = req.body;

      const user = await users.findByPk(userId);
      if (!user) {
        return sendErrorResponse(res, "User not found", 404);
      }

      // Check if email is being changed and if it's already taken
      if (email && email !== user.email) {
        const existingUser = await users.findOne({ where: { email } });
        if (existingUser) {
          return sendErrorResponse(res, "Email already taken", 400);
        }
      }

      // Update user
      await user.update({
        first_name: first_name || user.first_name,
        last_name: last_name || user.last_name,
        email: email || user.email,
        phone_number:
          phone_number !== undefined ? phone_number : user.phone_number,
        notes: notes !== undefined ? notes : user.notes,
        street_address:
          street_address !== undefined ? street_address : user.street_address,
        city: city !== undefined ? city : user.city,
        state: state !== undefined ? state : user.state,
        country: country !== undefined ? country : user.country,
        zip_code: zip_code !== undefined ? zip_code : user.zip_code,
      });

      // Remove password from response
      const userResponse = user.toJSON();
      delete userResponse.password;

      return sendSuccessRespose(
        res,
        {
          user: userResponse,
        },
        "Profile updated successfully",
        200
      );
    } catch (error) {
      console.error("Update profile error:", error);
      return sendErrorResponse(res, "Failed to update profile", 500);
    }
  }

  // Change password
  static async changePassword(req, res) {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;

      const user = await users.findByPk(userId);
      if (!user) {
        return sendErrorResponse(res, "User not found", 404);
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(
        currentPassword,
        user.password
      );
      if (!isValidPassword) {
        return sendErrorResponse(res, "Current password is incorrect", 400);
      }

      // Hash new password
      const saltRounds = 10;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await user.update({ password: hashedNewPassword });

      return sendSuccessRespose(
        res,
        null,
        "Password changed successfully",
        200
      );
    } catch (error) {
      console.error("Change password error:", error);
      return sendErrorResponse(res, "Failed to change password", 500);
    }
  }

  // Logout (client-side token removal)
  static async logout(req, res) {
    try {
      // In JWT, logout is typically handled client-side by removing the token
      // But we can log the logout event if needed
      return sendSuccessRespose(res, null, "Logout successful", 200);
    } catch (error) {
      console.error("Logout error:", error);
      return sendErrorResponse(res, "Logout failed", 500);
    }
  }
}

module.exports = AuthController;
