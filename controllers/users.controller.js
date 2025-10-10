const bcrypt = require("bcrypt");
const { users } = require("../models");
const { sendSuccessRespose, sendErrorResponse } = require("../utils/response");
const Sequelize = require("sequelize");
const {
  generateFileUrl,
  deleteProfileImage,
  extractFilenameFromUrl,
} = require("../utils/fileUpload");

class UsersController {
  // Create a new user (admin/super only)
  static async createUser(req, res) {
    try {
      let {
        email,
        password,
        first_name,
        last_name,
        phone_number,
        emergency_contact,
        notes,
        street_address,
        city,
        state,
        country,
        zip_code,
        role = "sales representative",
        is_active = true,
        profile_image_url,
      } = req.body;

      // Validate required fields
      if (!email || !password || !first_name || !last_name) {
        return sendErrorResponse(
          res,
          "Email, password, first name, and last name are required",
          400
        );
      }

      // Validate and normalize role field
      if (role && Array.isArray(role)) {
        role = role[0]; // Take the first element if it's an array
      }

      // Validate role value
      const validRoles = [
        "super",
        "admin",
        "Data entry",
        "sales representative",
      ];
      if (role && !validRoles.includes(role)) {
        return sendErrorResponse(
          res,
          `Invalid role. Must be one of: ${validRoles.join(", ")}`,
          400
        );
      }

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

      // Handle profile image URL (from form data or direct URL)
      let finalProfileImageUrl = null;
      if (req.file) {
        // File uploaded via form data
        finalProfileImageUrl = generateFileUrl(req.file.filename);
      } else if (profile_image_url) {
        // Direct URL provided
        finalProfileImageUrl = profile_image_url;
      }

      // Create user
      const user = await users.create({
        email,
        password: hashedPassword,
        first_name,
        last_name,
        phone_number,
        emergency_contact,
        notes,
        street_address,
        city,
        state,
        country,
        zip_code,
        role,
        is_active,
        profile_image_url: finalProfileImageUrl,
      });

      // Remove password from response
      const userResponse = user.toJSON();
      delete userResponse.password;

      return sendSuccessRespose(
        res,
        { user: userResponse },
        "User created successfully",
        201
      );
    } catch (error) {
      console.error("Create user error:", error);
      return sendErrorResponse(res, "Failed to create user", 500);
    }
  }

  // Get all users (admin/super only)
  static async getAllUsers(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        role,
        is_active,
        search,
        all,
        drawer,
      } = req.query;

      // Check if all users are requested
      const shouldGetAll = all === "true";

      // Check if drawer format is requested
      const isDrawerFormat = drawer === "true";

      // Build where clause
      const whereClause = {};
      if (role) whereClause.role = role;
      if (is_active !== undefined) whereClause.is_active = is_active === "true";
      if (search) {
        whereClause[Sequelize.Op.or] = [
          { first_name: { [Sequelize.Op.like]: `%${search}%` } },
          { last_name: { [Sequelize.Op.like]: `%${search}%` } },
          { email: { [Sequelize.Op.like]: `%${search}%` } },
        ];
      }

      // If getting all users, don't use pagination
      if (shouldGetAll) {
        const fetchedUsers = await users.findAll({
          where: whereClause,
          attributes: isDrawerFormat
            ? ["id", "first_name", "last_name", "role"] // Only essential fields for drawer format
            : { exclude: ["password"] },
          order: [["first_name", "ASC"]],
        });

        // Transform users to drawer format if requested
        let finalUsers = fetchedUsers;
        if (isDrawerFormat) {
          finalUsers = fetchedUsers.map((user) => ({
            value: user.id,
            label: `${user.first_name} ${user.last_name}`,
          }));
        }

        return sendSuccessRespose(
          res,
          {
            users: finalUsers,
            totalCount: fetchedUsers.length,
          },
          isDrawerFormat
            ? "Users fetched in drawer format successfully"
            : "All users fetched successfully",
          200
        );
      } else {
        // Use pagination for regular requests
        const offset = (page - 1) * limit;

        const { count, rows } = await users.findAndCountAll({
          where: whereClause,
          attributes: { exclude: ["password"] },
          limit: parseInt(limit),
          offset: parseInt(offset),
          order: [["createdAt", "DESC"]],
        });

        const totalPages = Math.ceil(count / limit);

        return sendSuccessRespose(
          res,
          {
            users: rows,
            pagination: {
              currentPage: parseInt(page),
              totalPages,
              totalUsers: count,
              usersPerPage: parseInt(limit),
            },
          },
          "Users retrieved successfully",
          200
        );
      }
    } catch (error) {
      console.error("Get all users error:", error);
      return sendErrorResponse(res, "Failed to get users", 500);
    }
  }

  // Get user by ID (admin/super only)
  static async getUserById(req, res) {
    try {
      const { id } = req.params;

      const user = await users.findByPk(id, {
        attributes: { exclude: ["password"] },
      });

      if (!user) {
        return sendErrorResponse(res, "User not found", 404);
      }

      return sendSuccessRespose(res, user, "User retrieved successfully", 200);
    } catch (error) {
      console.error("Get user by ID error:", error);
      return sendErrorResponse(res, "Failed to get user", 500);
    }
  }

  // Update user (admin/super only)
  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      let {
        first_name,
        last_name,
        email,
        phone_number,
        emergency_contact,
        notes,
        street_address,
        city,
        state,
        country,
        zip_code,
        role,
        is_active,
        profile_image_url,
      } = req.body;

      // Validate and normalize role field
      if (role && Array.isArray(role)) {
        role = role[0]; // Take the first element if it's an array
      }

      // Validate role value if provided
      if (role) {
        const validRoles = [
          "super",
          "admin",
          "Data entry",
          "sales representative",
        ];
        if (!validRoles.includes(role)) {
          return sendErrorResponse(
            res,
            "Invalid role. Must be one of: super, admin, Data entry, sales representative",
            400
          );
        }
      }

      const user = await users.findByPk(id);
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

      // Handle profile image update
      let finalProfileImageUrl = user.profile_image_url; // Keep existing if not updating

      if (req.file) {
        if (user.profile_image_url) {
          const oldFilename = extractFilenameFromUrl(user.profile_image_url);
          deleteProfileImage(oldFilename);
        }
        finalProfileImageUrl = generateFileUrl(req.file.filename);
      } else if (profile_image_url !== undefined) {
        // Profile image URL provided (could be null to remove)
        if (
          user.profile_image_url &&
          profile_image_url !== user.profile_image_url
        ) {
          // Delete old profile image if changing to a different URL
          const oldFilename = extractFilenameFromUrl(user.profile_image_url);
          deleteProfileImage(oldFilename);
        }
        finalProfileImageUrl = profile_image_url;
      }

      // Update user
      await user.update({
        first_name: first_name || user.first_name,
        last_name: last_name || user.last_name,
        email: email || user.email,
        phone_number:
          phone_number !== undefined ? phone_number : user.phone_number,
        emergency_contact:
          emergency_contact !== undefined
            ? emergency_contact
            : user.emergency_contact,
        notes: notes !== undefined ? notes : user.notes,
        street_address:
          street_address !== undefined ? street_address : user.street_address,
        city: city !== undefined ? city : user.city,
        state: state !== undefined ? state : user.state,
        country: country !== undefined ? country : user.country,
        zip_code: zip_code !== undefined ? zip_code : user.zip_code,
        role: role || user.role,
        is_active: is_active !== undefined ? is_active : user.is_active,
        profile_image_url: finalProfileImageUrl,
      });

      // Remove password from response
      const userResponse = user.toJSON();
      delete userResponse.password;

      return sendSuccessRespose(
        res,
        { user: userResponse },
        "User updated successfully",
        200
      );
    } catch (error) {
      console.error("Update user error:", error);
      return sendErrorResponse(res, "Failed to update user", 500);
    }
  }

  // Delete user (admin/super only)
  static async deleteUser(req, res) {
    try {
      const { id } = req.params;

      const user = await users.findByPk(id);
      if (!user) {
        return sendErrorResponse(res, "User not found", 404);
      }

      // Prevent deletion of super users
      if (user.role === "super") {
        return sendErrorResponse(res, "Cannot delete super users", 403);
      }

      // Soft delete the user
      await user.destroy();

      return sendSuccessRespose(res, null, "User deleted successfully", 200);
    } catch (error) {
      console.error("Delete user error:", error);
      return sendErrorResponse(res, "Failed to delete user", 500);
    }
  }
}

module.exports = UsersController;
