const express = require("express");
const router = express.Router();
const syncController = require("../../controllers/sync.controller");
const authMiddleware = require("../../middleware/auth.middleware");

// Apply authentication middleware to all sync routes
// router.use(authMiddleware);

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

module.exports = router;
