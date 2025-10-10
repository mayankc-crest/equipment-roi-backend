const express = require("express");
const customersCtrl = require("../../controllers/customers.controller");

const router = express.Router();

/**
 * @description Get all customers with pagination and filtering
 * @path /api/customers
 * @method GET
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Customers per page (default: 10)
 * @query {string} customer_type - Filter by customer type
 * @query {string} job_status - Filter by job status
 * @query {string} search - Search in first name, last name, company name, or email
 */
router.get("/", customersCtrl.getAllCustomers);

/**
 * @description Get customer statistics
 * @path /api/customers/stats
 * @method GET
 */
router.get("/stats", customersCtrl.getCustomerStats);

/**
 * @description Get customer by ID
 * @path /api/customers/:id
 * @method GET
 */
router.get("/:id", customersCtrl.getCustomerById);

/**
 * @description Get customer ROI products
 * @path /api/customers/:customer_id/roi-products
 * @method GET
 * @param {number} customer_id - Customer ID
 */
router.get("/roi-products/:customer_id/", customersCtrl.getCustomerROIProducts);

module.exports = router;
