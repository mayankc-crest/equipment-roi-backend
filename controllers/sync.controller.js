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

      // Generate the item query request
      const itemQuery = qbXMLHandler.addItemQuery();

      // Get the request queue to see what was generated
      const requests = [];
      qbXMLHandler.fetchRequests((err, requestArray) => {
        if (err) {
          console.error("Error generating requests:", err);
          return;
        }
        requests.push(...requestArray);
      });

      res.status(200).json({
        success: true,
        message:
          "Item sync request generated successfully. QuickBooks Web Connector needs to be running to process the request.",
        data: {
          requestGenerated: true,
          requestCount: requests.length,
          note: "The actual sync will happen when QuickBooks Web Connector processes the request and returns data",
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ Error in manual items sync:", error);
      res.status(500).json({
        success: false,
        message: "Error generating item sync request",
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

      // Generate the customer query request
      qbXMLHandler.addCustomerQuery();

      // Get the request queue to see what was generated
      const requests = [];
      qbXMLHandler.fetchRequests((err, requestArray) => {
        if (err) {
          console.error("Error generating requests:", err);
          return;
        }
        requests.push(...requestArray);
      });

      res.status(200).json({
        success: true,
        message:
          "Customer sync request generated successfully. QuickBooks Web Connector needs to be running to process the request.",
        data: {
          requestGenerated: true,
          // requestCount: requests.length,
          note: "The actual sync will happen when QuickBooks Web Connector processes the request and returns data",
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ Error in manual customers sync:", error);
      res.status(500).json({
        success: false,
        message: "Error generating customer sync request",
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

      // Generate the invoice query request
      qbXMLHandler.addInvoiceQuery();

      // Get the request queue to see what was generated
      const requests = [];
      qbXMLHandler.fetchRequests((err, requestArray) => {
        if (err) {
          console.error("Error generating requests:", err);
          return;
        }
        requests.push(...requestArray);
      });

      res.status(200).json({
        success: true,
        message:
          "Invoice sync request generated successfully. QuickBooks Web Connector needs to be running to process the request.",
        data: {
          requestGenerated: true,
          requestCount: requests.length,
          note: "The actual sync will happen when QuickBooks Web Connector processes the request and returns data",
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ Error in manual invoices sync:", error);
      res.status(500).json({
        success: false,
        message: "Error generating invoice sync request",
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

      // Generate all query requests
      qbXMLHandler.addItemQuery();
      qbXMLHandler.addCustomerQuery();
      qbXMLHandler.addInvoiceQuery();

      // Get the request queue to see what was generated
      const requests = [];
      qbXMLHandler.fetchRequests((err, requestArray) => {
        if (err) {
          console.error("Error generating requests:", err);
          return;
        }
        requests.push(...requestArray);
      });

      res.status(200).json({
        success: true,
        message:
          "All sync requests generated successfully. QuickBooks Web Connector needs to be running to process the requests.",
        data: {
          requestGenerated: true,
          requestCount: requests.length,
          requestsGenerated: {
            items: true,
            customers: true,
            invoices: true,
          },
          note: "The actual sync will happen when QuickBooks Web Connector processes the requests and returns data",
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ Error in manual sync all:", error);
      res.status(500).json({
        success: false,
        message: "Error generating sync requests",
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
