const express = require("express");
const invoicesCtrl = require("../../controllers/invoices.controller");

const router = express.Router();

/**
 * @description Get all invoices
 * @path /api/invoices
 * @method GET
 */
router.get("/", invoicesCtrl.getAllInvoices);

/**
 * @description Get invoice by ID
 * @path /api/invoices/:id
 * @method GET
 */
router.get("/:id", invoicesCtrl.getInvoiceById);

module.exports = router;
