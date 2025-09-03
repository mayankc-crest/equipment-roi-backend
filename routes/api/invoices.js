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
 * @description Get invoices by specific IDs
 * @path /api/invoices/all?ids=1,2,3
 * @method GET
 */
router.get("/all", invoicesCtrl.getAllIDInvoices);

/**
 * @description Get invoice by ID
 * @path /api/invoices/:id
 * @method GET
 */
router.get("/:id", invoicesCtrl.getInvoiceById);

/**
 * @description Get invoice by ID
 * @path /api/invoices/:id
 * @method GET
 */
router.post("/invoice-calculate", invoicesCtrl.invoiceCalculate);

module.exports = router;
