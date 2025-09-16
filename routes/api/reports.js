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

/**
 * @description Get customer drop-off by product reports
 * @path /api/reports/customer-dropoff-by-product
 * @method GET
 * @query {string} product_name - Filter by product name (optional)
 * @query {string} customer_name - Filter by customer name (optional)
 * @query {number} page - Page number for pagination (optional, default: 1)
 * @query {number} limit - Number of records per page (optional, default: 10)
 * @query {string} sort_by - Sort by field (optional, default: "days_since_last_purchase")
 * @query {string} sort_order - Sort order (optional, default: "DESC")
 */
router.get(
  "/customer-dropoff-by-product",
  reportsCtrl.getCustomerDropoffByProductReports
);

/**
 * @description Get product lifecycle reports
 * @path /api/reports/product-lifecycle
 * @method GET
 * @query {number} customer_id - Filter by customer ID (optional)
 * @query {number} page - Page number for pagination (optional, default: 1)
 * @query {number} limit - Number of records per page (optional, default: 10)
 * @query {string} sort_by - Sort by field (optional, default: "total_customers")
 * @query {string} sort_order - Sort order (optional, default: "DESC")
 */
router.get("/product-lifecycle", reportsCtrl.getProductLifecycleReports);

/**
 * @description Get underperforming customers reports
 * @path /api/reports/underperforming-customers
 * @method GET
 * @query {number} year - Filter by year (optional, default: current year)
 * @query {number} page - Page number for pagination (optional, default: 1)
 * @query {number} limit - Number of records per page (optional, default: 10)
 * @query {string} sort_by - Sort by field (optional, default: "sales_gap")
 * @query {string} sort_order - Sort order (optional, default: "DESC")
 */
router.get(
  "/underperforming-customers",
  reportsCtrl.getUnderperformingCustomersReports
);

/**
 * @description Get outstanding performance customers reports
 * @path /api/reports/outstanding-performance-customers
 * @method GET
 * @query {number} year - Filter by year (optional, default: current year)
 * @query {number} page - Page number for pagination (optional, default: 1)
 * @query {number} limit - Number of records per page (optional, default: 10)
 * @query {string} sort_by - Sort by field (optional, default: "performance_percentage")
 * @query {string} sort_order - Sort order (optional, default: "DESC")
 */
router.get(
  "/outstanding-performance-customers",
  reportsCtrl.getOutstandingPerformanceCustomersReports
);

module.exports = router;
