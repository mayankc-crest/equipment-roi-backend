const express = require("express");
const router = express.Router();
const alertsCtrl = require("../../controllers/alerts.controller");

/**
 * @description Create a new alert
 * @path /api/alerts
 * @method POST
 * @body {number} customer_id - Customer ID (required)
 * @body {string} alert_type - Alert type (optional, defaults to "3_year_review")
 */
router.post("/", alertsCtrl.createAlert);

/**
 * @description Get all alerts with pagination and filtering
 * @path /api/alerts
 * @method GET
 * @query {number} page - Page number (optional, default: 1)
 * @query {number} limit - Items per page (optional, default: 10)
 * @query {string} alert_type - Filter by alert type (optional)
 * @query {number} customer_id - Filter by customer ID (optional)
 * @query {string} search - Search in customer name/company (optional)
 */
router.get("/", alertsCtrl.getAllAlerts);

/**
 * @description Get alert by ID
 * @path /api/alerts/:id
 * @method GET
 */
router.get("/:id", alertsCtrl.getAlertById);

/**
 * @description Update alert
 * @path /api/alerts/:id
 * @method PUT
 * @body {string} alert_type - Alert type (optional)
 */
router.put("/:id", alertsCtrl.updateAlert);

/**
 * @description Delete alert (soft delete)
 * @path /api/alerts/:id
 * @method DELETE
 */
router.delete("/:id", alertsCtrl.deleteAlert);

/**
 * @description Get alerts by customer ID
 * @path /api/alerts/customer/:customer_id
 * @method GET
 * @query {string} alert_type - Filter by alert type (optional)
 */
router.get("/customer/:customer_id", alertsCtrl.getAlertsByCustomer);

module.exports = router;
