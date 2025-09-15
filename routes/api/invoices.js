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
 * @description Get sales/lease percentage by year
 * @path /api/invoices/sales-percentage
 * @method GET
 * @query {number} year - Year to filter by
 */
router.get("/sales-percentage", invoicesCtrl.getSalesPercentageByYear);

router.get("/invoice-calculate/:id", invoicesCtrl.getInvoiceCalculateForView);

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

/**
 * @description Get calculated invoice data by ROI ID
 * @path /api/invoices/invoice-calculate/:id
 * @method GET
 */
router.get("/invoice-calculate/:id", invoicesCtrl.getInvoiceCalculate);

/**
 * @description Get detailed calculated invoice data for editing
 * @path /api/invoices/calc-invoice-details/:id
 * @method GET
 */
router.get("/calc-invoice-details/:id", invoicesCtrl.getCalcInvoiceDetails);

router.patch("/invoice-category/:id", invoicesCtrl.invoiceCategory);

module.exports = router;
