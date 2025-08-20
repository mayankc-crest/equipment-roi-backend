const express = require("express");
const customersCtrl = require("../../controllers/customers.controller");

const router = express.Router();

/**
 * @description Get all customers
 * @path /api/customers
 * @method GET
 */
router.get("/", customersCtrl.getAllCustomers);

/**
 * @description Get customer by ID
 * @path /api/customers/:id
 * @method GET
 */
router.get("/:id", customersCtrl.getCustomerById);

module.exports = router;
