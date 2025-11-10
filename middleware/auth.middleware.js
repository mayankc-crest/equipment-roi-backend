const jwt = require("jsonwebtoken");
const { users } = require("../models");
const { sendErrorResponse } = require("../utils/response");

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

class AuthMiddleware {
  // Verify JWT token and attach user to request
  static async verifyToken(req, res, next) {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return sendErrorResponse(res, "Access token required", 401);
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      try {
        const decoded = jwt.verify(token, JWT_SECRET);

        // Expose token claims to downstream handlers
        req.auth = decoded;
        req.userId = decoded.id;
        req.userRole = decoded.role;

        // Find user in database
        const user = await users.findByPk(decoded.id, {
          attributes: { exclude: ["password"] },
        });

        if (!user || !user.is_active) {
          return sendErrorResponse(res, "Invalid or inactive user", 401);
        }

        // Attach user to request
        req.user = user;
        next();
      } catch (jwtError) {
        if (jwtError.name === "TokenExpiredError") {
          return sendErrorResponse(res, "Token expired", 401);
        } else if (jwtError.name === "JsonWebTokenError") {
          return sendErrorResponse(res, "Invalid token", 401);
        } else {
          return sendErrorResponse(res, "Token verification failed", 401);
        }
      }
    } catch (error) {
      console.error("Auth middleware error:", error);
      return sendErrorResponse(res, "Authentication failed", 500);
    }
  }

  // Check if user has required role
  static requireRole(requiredRoles) {
    return (req, res, next) => {
      try {
        if (!req.user) {
          return sendErrorResponse(res, "Authentication required", 401);
        }

        // Convert single role to array for easier handling
        const roles = Array.isArray(requiredRoles)
          ? requiredRoles
          : [requiredRoles];

        if (!roles.includes(req.user.role)) {
          return sendErrorResponse(res, "Insufficient permissions", 403);
        }

        next();
      } catch (error) {
        console.error("Role check error:", error);
        return sendErrorResponse(res, "Authorization failed", 500);
      }
    };
  }

  // Check if user is super admin
  static requireSuper(req, res, next) {
    return AuthMiddleware.requireRole("super")(req, res, next);
  }

  // Check if user is admin or super
  static requireAdmin(req, res, next) {
    return AuthMiddleware.requireRole(["admin", "super"])(req, res, next);
  }

  // Check if user is data entry or higher
  static requireDataEntry(req, res, next) {
    return AuthMiddleware.requireRole(["Data entry", "admin", "super"])(
      req,
      res,
      next
    );
  }

  // Check if user is sales representative or higher
  static requireSalesRep(req, res, next) {
    return AuthMiddleware.requireRole([
      "sales representative",
      "Data entry",
      "admin",
      "super",
    ])(req, res, next);
  }

  // Optional authentication - attach user if token exists, but don't require it
  static optionalAuth(req, res, next) {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next(); // Continue without user
      }

      const token = authHeader.substring(7);

      try {
        const decoded = jwt.verify(token, JWT_SECRET);

        req.auth = decoded; // Expose claims even in optional auth
        users
          .findByPk(decoded.id, {
            attributes: { exclude: ["password"] },
          })
          .then((user) => {
            if (user && user.is_active) {
              req.user = user;
            }
            next();
          })
          .catch(() => {
            next(); // Continue without user
          });
      } catch (jwtError) {
        next(); // Continue without user
      }
    } catch (error) {
      next(); // Continue without user
    }
  }
}

module.exports = AuthMiddleware;
