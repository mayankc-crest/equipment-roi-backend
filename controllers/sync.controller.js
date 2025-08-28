const qbXMLHandler = require("../quickbook/qbXMLHandler");

/**
 * Manual sync controller for QuickBooks data
 */
class SyncController {
  /**
   * Sync items from QuickBooks
   */
  async syncItems(req, res) {
    try {
      console.log("🔄 Manual sync items triggered via API");

      const syncResult = await qbXMLHandler.syncItemsToDatabase("");

      res.status(200).json({
        success: true,
        message: "Items sync completed successfully",
        data: {
          itemsSynced: syncResult?.itemsSynced || 0,
          itemsUpdated: syncResult?.itemsUpdated || 0,
          totalItems: syncResult?.totalItems || 0,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ Error in manual items sync:", error);
      res.status(500).json({
        success: false,
        message: "Error syncing items",
        error: error.message,
      });
    }
  }

  /**
   * Sync customers from QuickBooks
   */
  async syncCustomers(req, res) {
    try {
      console.log("🔄 Manual sync customers triggered via API");

      const syncResult = await qbXMLHandler.syncCustomersToDatabase("");

      res.status(200).json({
        success: true,
        message: "Customers sync completed successfully",
        data: {
          customersSynced: syncResult?.customersSynced || 0,
          customersUpdated: syncResult?.customersUpdated || 0,
          totalCustomers: syncResult?.totalCustomers || 0,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ Error in manual customers sync:", error);
      res.status(500).json({
        success: false,
        message: "Error syncing customers",
        error: error.message,
      });
    }
  }

  /**
   * Sync invoices from QuickBooks
   */
  async syncInvoices(req, res) {
    try {
      console.log("🔄 Manual sync invoices triggered via API");

      // Call the existing sync function with empty response data
      const syncResult = await qbXMLHandler.syncInvoicesToDatabase("");

      res.status(200).json({
        success: true,
        message: "Invoices sync completed successfully",
        data: {
          invoicesSynced: syncResult?.invoicesSynced || 0,
          invoicesUpdated: syncResult?.invoicesUpdated || 0,
          totalInvoices: syncResult?.totalInvoices || 0,
          lineItemsSynced: syncResult?.lineItemsSynced || 0,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ Error in manual invoices sync:", error);
      res.status(500).json({
        success: false,
        message: "Error syncing invoices",
        error: error.message,
      });
    }
  }

  /**
   * Sync all data (items, customers, invoices)
   */
  async syncAll(req, res) {
    try {
      console.log("🔄 Manual sync all data triggered via API");

      // Call all existing sync functions with empty response data
      const itemsResult = await qbXMLHandler.syncItemsToDatabase("");
      const customersResult = await qbXMLHandler.syncCustomersToDatabase("");
      const invoicesResult = await qbXMLHandler.syncInvoicesToDatabase("");

      res.status(200).json({
        success: true,
        message: "All data sync completed successfully",
        data: {
          items: {
            itemsSynced: itemsResult?.itemsSynced || 0,
            itemsUpdated: itemsResult?.itemsUpdated || 0,
            totalItems: itemsResult?.totalItems || 0,
          },
          customers: {
            customersSynced: customersResult?.customersSynced || 0,
            customersUpdated: customersResult?.customersUpdated || 0,
            totalCustomers: customersResult?.totalCustomers || 0,
          },
          invoices: {
            invoicesSynced: invoicesResult?.invoicesSynced || 0,
            invoicesUpdated: invoicesResult?.invoicesUpdated || 0,
            totalInvoices: invoicesResult?.totalInvoices || 0,
            lineItemsSynced: invoicesResult?.lineItemsSynced || 0,
          },
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ Error in manual sync all:", error);
      res.status(500).json({
        success: false,
        message: "Error syncing all data",
        error: error.message,
      });
    }
  }

  /**
   * Get sync status and pagination info
   */
  async getSyncStatus(req, res) {
    try {
      const status = qbXMLHandler.getPaginationStatus();

      res.status(200).json({
        success: true,
        data: status,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ Error getting sync status:", error);
      res.status(500).json({
        success: false,
        message: "Error getting sync status",
        error: error.message,
      });
    }
  }

  /**
   * Reset pagination state
   */
  async resetPagination(req, res) {
    try {
      console.log("🔄 Resetting pagination state via API");

      qbXMLHandler.resetPagination();

      res.status(200).json({
        success: true,
        message: "Pagination state reset successfully",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ Error resetting pagination:", error);
      res.status(500).json({
        success: false,
        message: "Error resetting pagination",
        error: error.message,
      });
    }
  }

  /**
   * Force next batch of items
   */
  async forceNextBatch(req, res) {
    try {
      console.log("🔄 Forcing next batch via API");

      const result = qbXMLHandler.forceNextBatch();

      res.status(200).json({
        success: true,
        message: "Next batch forced successfully",
        data: { hasMoreItems: result },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ Error forcing next batch:", error);
      res.status(500).json({
        success: false,
        message: "Error forcing next batch",
        error: error.message,
      });
    }
  }
}

module.exports = new SyncController();
