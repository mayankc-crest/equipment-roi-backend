const express = require("express");
const router = express.Router();
const syncController = require("../../controllers/sync.controller");

// Note: AuthMiddleware.verifyToken is now applied at the parent level in routes/api/index.js

/**
 * @route   POST /api/sync/items
 * @desc    Manually sync items from QuickBooks
 * @access  Private
 */
router.post("/items", syncController.syncItems);

/**
 * @route   POST /api/sync/customers
 * @desc    Manually sync customers from QuickBooks
 * @access  Private
 */
router.post("/customers", syncController.syncCustomers);

/**
 * @route   POST /api/sync/invoices
 * @desc    Manually sync invoices from QuickBooks
 * @access  Private
 */
router.post("/invoices", syncController.syncInvoices);

/**
 * @route   POST /api/sync/all
 * @desc    Manually sync all data (items, customers, invoices) from QuickBooks
 * @access  Private
 */
router.post("/all", syncController.syncAll);

/**
 * @route   GET /api/sync/status
 * @desc    Get current sync status and pagination info
 * @access  Private
 */
router.get("/status", syncController.getSyncStatus);

/**
 * @route   POST /api/sync/reset-pagination
 * @desc    Reset pagination state
 * @access  Private
 */
router.post("/reset-pagination", syncController.resetPagination);

/**
 * @route   POST /api/sync/force-next-batch
 * @desc    Force next batch of items
 * @access  Private
 */
router.post("/force-next-batch", syncController.forceNextBatch);

/**
 * @route   GET /api/sync/cron/status
 * @desc    Get QuickBooks sync cron jobs status
 * @access  Private
 */
router.get("/cron/status", syncController.getCronStatus);

/**
 * @route   POST /api/sync/year
 * @desc    Sync all data (items, customers, invoices) for a specific year
 * @access  Private
 */
router.post("/year", syncController.syncByYear);

/**
 * @route   GET /api/sync/year/status
 * @desc    Get all years sync status (2010-2025)
 * @access  Private
 */
router.get("/year/status", syncController.getYearSyncStatus);

/**
 * @route   GET /api/sync/year/status/:year
 * @desc    Get specific year sync status
 * @access  Private
 */
router.get("/year/status/:year", syncController.getSpecificYearStatus);

/**
 * @route   POST /api/sync/year/reset
 * @desc    Reset specific year sync status to pending
 * @access  Private
 */
router.post("/year/reset", syncController.resetYearStatus);

/**
 * @route   POST /api/sync/year/reset-all
 * @desc    Reset all years sync status to pending
 * @access  Private
 */
router.post("/year/reset-all", syncController.resetAllYearsStatus);

module.exports = router;
