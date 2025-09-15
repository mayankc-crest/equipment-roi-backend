const express = require("express");
const router = express.Router();
const dashboardCtrl = require("../../controllers/dashboard.controller");

/**
 * @description Get dashboard overview statistics
 * @path /api/dashboard/overview
 * @method GET
 */
router.get("/overview", dashboardCtrl.getDashboardOverview);

/**
 * @description Get recent activities
 * @path /api/dashboard/recent-activities
 * @method GET
 * @query {number} limit - Number of activities to return (optional, default: 10)
 */
router.get("/recent-activities", dashboardCtrl.getRecentActivities);

/**
 * @description Get revenue analytics
 * @path /api/dashboard/revenue-analytics
 * @method GET
 * @query {string} period - Time period (month, quarter, year) (optional, default: month)
 */
router.get("/revenue-analytics", dashboardCtrl.getRevenueAnalytics);

/**
 * @description Get customer analytics
 * @path /api/dashboard/customer-analytics
 * @method GET
 */
router.get("/customer-analytics", dashboardCtrl.getCustomerAnalytics);

/**
 * @description Get leased/sold items analytics
 * @path /api/dashboard/leased-sold-analytics
 * @method GET
 * @query {number} year - Year to filter by (optional, default: current year)
 */
router.get("/leased-sold-analytics", dashboardCtrl.getLeasedSoldAnalytics);

/**
 * @description Get investment vs recouped monthly analytics
 * @path /api/dashboard/investment-recouped-analytics
 * @method GET
 * @query {number} year - Year to filter by (optional, default: current year)
 * @query {number} customer_id - Customer ID to filter by (optional)
 */
router.get(
  "/investment-recouped-analytics",
  dashboardCtrl.getInvestmentRecoupedAnalytics
);

/**
 * @description Get customers total sales analytics
 * @path /api/dashboard/customers-total-sales-analytics
 * @method GET
 * @query {number} year - Year to filter by (optional)
 * @query {number} customer_id - Customer ID to filter by (optional)
 * @query {string} start_date - Start date for date range filter (optional, format: YYYY-MM-DD)
 * @query {string} end_date - End date for date range filter (optional, format: YYYY-MM-DD)
 * @query {number} page - Page number for pagination (optional, default: 1)
 * @query {number} limit - Number of records per page (optional, default: 20)
 */
router.get(
  "/customers-total-sales-analytics",
  dashboardCtrl.getCustomersTotalSalesAnalytics
);

/**
 * @description Get monthly customers sales analytics
 * @path /api/dashboard/monthly-customers-sales-analytics
 * @method GET
 * @query {number} year - Year to filter by (optional, default: current year)
 * @query {number} customer_id - Customer ID to filter by (optional)
 * @query {number} page - Page number for pagination (optional, default: 1)
 * @query {number} limit - Number of records per page (optional, default: 20)
 */
router.get(
  "/monthly-customers-sales-analytics",
  dashboardCtrl.getMonthlyCustomersSalesAnalytics
);

module.exports = router;
