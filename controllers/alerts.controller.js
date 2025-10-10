const { alerts: Alerts, customers: Customers } = require("../models");
const { sendSuccessRespose, sendErrorResponse } = require("../utils/response");
const Sequelize = require("sequelize");

// Create a new alert
exports.createAlert = async (req, res) => {
  try {
    const { customer_id, alert_type = "3_year_review" } = req.body;

    // Validate required fields
    if (!customer_id) {
      return sendErrorResponse(res, "Customer ID is required", 400);
    }

    // Validate alert_type
    const validAlertTypes = ["3_year_review"];
    if (!validAlertTypes.includes(alert_type)) {
      return sendErrorResponse(res, "Invalid alert type", 400);
    }

    // Check if customer exists
    const customer = await Customers.findByPk(customer_id);
    if (!customer) {
      return sendErrorResponse(res, "Customer not found", 404);
    }

    // Check if alert already exists for this customer and type
    const existingAlert = await Alerts.findOne({
      where: {
        customer_id,
        alert_type,
      },
    });

    if (existingAlert) {
      return sendErrorResponse(
        res,
        "Alert already exists for this customer and type",
        400
      );
    }

    // Create alert
    const alert = await Alerts.create({
      customer_id,
      alert_type,
    });

    // Fetch alert with customer details
    const alertWithCustomer = await Alerts.findByPk(alert.id, {
      include: [
        {
          model: Customers,
          as: "customer",
          attributes: ["id", "first_name", "last_name", "company_name"],
        },
      ],
    });

    return sendSuccessRespose(
      res,
      alertWithCustomer,
      "Alert created successfully",
      201
    );
  } catch (error) {
    console.error("Create alert error:", error);
    return sendErrorResponse(res, "Failed to create alert", 500);
  }
};

// Get all alerts with pagination and filtering
exports.getAllAlerts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      alert_type,
      customer_id,
      search,
      all = false,
      is_read,
    } = req.query;

    // Build where clause
    const whereClause = {};
    if (alert_type) whereClause.alert_type = alert_type;
    if (customer_id) whereClause.customer_id = customer_id;

    // Add is_read filter
    if (is_read !== undefined) {
      whereClause.is_read = is_read === "true";
    }

    if (search) {
      whereClause[Sequelize.Op.or] = [
        { "$customer.first_name$": { [Sequelize.Op.like]: `%${search}%` } },
        { "$customer.last_name$": { [Sequelize.Op.like]: `%${search}%` } },
        { "$customer.company_name$": { [Sequelize.Op.like]: `%${search}%` } },
      ];
    }

    // Check if all alerts are requested
    const shouldGetAll = all === "true";

    if (shouldGetAll) {
      // Get all alerts without pagination
      const allAlerts = await Alerts.findAll({
        where: whereClause,
        include: [
          {
            model: Customers,
            as: "customer",
            attributes: ["id", "first_name", "last_name", "company_name"],
          },
        ],
        order: [["created_at", "DESC"]],
      });

      // Separate alerts into read and unread arrays
      const readAlerts = allAlerts.filter((alert) => alert.is_read === true);
      const unreadAlerts = allAlerts.filter((alert) => alert.is_read === false);

      return sendSuccessRespose(
        res,
        {
          read: readAlerts,
          unread: unreadAlerts,
          totalAlerts: allAlerts.length,
          readCount: readAlerts.length,
          unreadCount: unreadAlerts.length,
        },
        "All alerts retrieved successfully",
        200
      );
    } else {
      // Use pagination for regular requests
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const { count, rows } = await Alerts.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Customers,
            as: "customer",
            attributes: ["id", "first_name", "last_name", "company_name"],
          },
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["created_at", "DESC"]],
        distinct: true,
      });

      const totalPages = Math.ceil(count / limit);

      return sendSuccessRespose(
        res,
        {
          alerts: rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalAlerts: count,
            alertsPerPage: parseInt(limit),
          },
        },
        "Alerts retrieved successfully",
        200
      );
    }
  } catch (error) {
    console.error("Get all alerts error:", error);
    return sendErrorResponse(res, "Failed to get alerts", 500);
  }
};

// Mark all alerts as read
exports.markAllAlertsAsRead = async (req, res) => {
  try {
    const { read } = req.body;

    // Validate request
    if (read !== true) {
      return sendErrorResponse(
        res,
        "Invalid request. Expected 'read': true in request body",
        400
      );
    }

    // Update all unread alerts to read
    const [updatedCount] = await Alerts.update(
      { is_read: true },
      {
        where: {
          is_read: false,
        },
      }
    );

    return sendSuccessRespose(
      res,
      {
        updatedCount,
        message: `Successfully marked ${updatedCount} alerts as read`,
      },
      "All alerts marked as read successfully",
      200
    );
  } catch (error) {
    console.error("Mark all alerts as read error:", error);
    return sendErrorResponse(res, "Failed to mark alerts as read", 500);
  }
};

// Get alert by ID
exports.getAlertById = async (req, res) => {
  try {
    const { id } = req.params;

    const alert = await Alerts.findByPk(id, {
      include: [
        {
          model: Customers,
          as: "customer",
          attributes: ["id", "first_name", "last_name", "company_name"],
        },
      ],
    });

    if (!alert) {
      return sendErrorResponse(res, "Alert not found", 404);
    }

    return sendSuccessRespose(res, alert, "Alert retrieved successfully", 200);
  } catch (error) {
    console.error("Get alert by ID error:", error);
    return sendErrorResponse(res, "Failed to get alert", 500);
  }
};

// Update alert
exports.updateAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const { alert_type } = req.body;

    const alert = await Alerts.findByPk(id);
    if (!alert) {
      return sendErrorResponse(res, "Alert not found", 404);
    }

    // Validate alert_type if provided
    if (alert_type) {
      const validAlertTypes = ["3_year_review"];
      if (!validAlertTypes.includes(alert_type)) {
        return sendErrorResponse(res, "Invalid alert type", 400);
      }
    }

    // Update alert
    await alert.update({
      alert_type: alert_type || alert.alert_type,
    });

    // Fetch updated alert with customer details
    const updatedAlert = await Alerts.findByPk(id, {
      include: [
        {
          model: Customers,
          as: "customer",
          attributes: ["id", "first_name", "last_name", "company_name"],
        },
      ],
    });

    return sendSuccessRespose(
      res,
      updatedAlert,
      "Alert updated successfully",
      200
    );
  } catch (error) {
    console.error("Update alert error:", error);
    return sendErrorResponse(res, "Failed to update alert", 500);
  }
};

// Delete alert (soft delete)
exports.deleteAlert = async (req, res) => {
  try {
    const { id } = req.params;

    const alert = await Alerts.findByPk(id);
    if (!alert) {
      return sendErrorResponse(res, "Alert not found", 404);
    }

    // Soft delete
    await alert.destroy();

    return sendSuccessRespose(res, null, "Alert deleted successfully", 200);
  } catch (error) {
    console.error("Delete alert error:", error);
    return sendErrorResponse(res, "Failed to delete alert", 500);
  }
};

// Get alerts by customer ID
exports.getAlertsByCustomer = async (req, res) => {
  try {
    const { customer_id } = req.params;
    const { alert_type } = req.query;

    // Check if customer exists
    const customer = await Customers.findByPk(customer_id);
    if (!customer) {
      return sendErrorResponse(res, "Customer not found", 404);
    }

    // Build where clause
    const whereClause = { customer_id };
    if (alert_type) whereClause.alert_type = alert_type;

    const alerts = await Alerts.findAll({
      where: whereClause,
      include: [
        {
          model: Customers,
          as: "customer",
          attributes: ["id", "first_name", "last_name", "company_name"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    return sendSuccessRespose(
      res,
      { alerts, customer },
      "Customer alerts retrieved successfully",
      200
    );
  } catch (error) {
    console.error("Get alerts by customer error:", error);
    return sendErrorResponse(res, "Failed to get customer alerts", 500);
  }
};
