const express = require("express");
const router = express.Router();
const reportsCtrl = require("../../controllers/reports.controller");

/**
 * @description Get customer ROI reports
 * @path /api/reports/customer-roi
 * @method GET
 */
router.get("/customer-roi", reportsCtrl.getCustomerROIReports);

/**
 * @description Get ROI by Product/Equipment reports
 * @path /api/reports/roi-by-product-equipment
 * @method GET
 * @query {number} year - Year to filter by (optional)
 * @query {number} customer_id - Customer ID to filter by (optional)
 * @query {number} page - Page number for pagination (optional, default: 1)
 * @query {number} limit - Number of records per page (optional, default: 10)
 */
router.get(
  "/roi-by-product-equipment",
  reportsCtrl.getROIByProductEquipmentReports
);

/**
 * @description Get top products with drop-offs reports
 * @path /api/reports/top-products-with-dropoffs
 * @method GET
 * @query {string} search - Search term for product name (optional)
 * @query {number} page - Page number for pagination (optional, default: 1)
 * @query {number} limit - Number of records per page (optional, default: 10)
 */
router.get(
  "/top-products-with-dropoffs",
  reportsCtrl.getTopProductsWithDropoffsReports
);

module.exports = router;
