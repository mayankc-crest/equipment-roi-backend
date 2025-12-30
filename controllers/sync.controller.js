const qbXMLHandler = require("../quickbook/qbXMLHandler");
const quickBooksSyncCron = require("../jobs/quickbooksSyncCron");
const yearSyncStatusManager = require("../utils/yearSyncStatus");

/**
 * Generate sync requests for a specific year
 */
async function generateYearBasedSyncRequests(startDate, endDate) {
  try {
    // Generate items query with year date range
    qbXMLHandler.addItemQueryForYear(startDate, endDate);

    // Generate customers query with year date range
    qbXMLHandler.addCustomerQueryForYear(startDate, endDate);

    // Generate invoices query with specific year date range
    await qbXMLHandler.addInvoiceQueryForYear(startDate, endDate);
  } catch (error) {
    throw error;
  }
}

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
      await qbXMLHandler.addItemQuery();

      // Get the request queue to see what was generated
      const requests = [];
      await qbXMLHandler.fetchRequests((err, requestArray) => {
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
      await qbXMLHandler.addCustomerQuery();

      // Get the request queue to see what was generated
      const requests = [];
      await qbXMLHandler.fetchRequests((err, requestArray) => {
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
      await qbXMLHandler.addInvoiceQuery();

      // Get the request queue to see what was generated
      const requests = [];
      await qbXMLHandler.fetchRequests((err, requestArray) => {
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
      await qbXMLHandler.addItemQuery();
      await qbXMLHandler.addCustomerQuery();
      await qbXMLHandler.addInvoiceQuery();

      // Get the request queue to see what was generated
      const requests = [];
      await qbXMLHandler.fetchRequests((err, requestArray) => {
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

  /**
   * Get QuickBooks sync cron status
   */
  async getCronStatus(req, res) {
    try {
      const status = quickBooksSyncCron.getSyncStatus();

      res.status(200).json({
        success: true,
        message: "QuickBooks sync cron status retrieved successfully",
        data: status,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ Error getting cron status:", error);
      res.status(500).json({
        success: false,
        message: "Error getting cron status",
        error: error.message,
      });
    }
  }

  /**
   * Sync all data for a specific year
   */
  async syncByYear(req, res) {
    try {
      const { year } = req.body;

      console.log(`🚀 ===== YEAR SYNC STARTED =====`);
      console.log(`📅 Requested year: ${year}`);
      console.log(`⏰ Sync started at: ${new Date().toISOString()}`);

      // Validate year input
      if (
        !year ||
        !Number.isInteger(parseInt(year)) ||
        year < 2000 ||
        year > new Date().getFullYear() + 1
      ) {
        console.log(`❌ Invalid year validation failed: ${year}`);
        return res.status(400).json({
          success: false,
          message:
            "Invalid year. Please provide a valid year (2000 to current year + 1)",
        });
      }

      console.log(`✅ Year validation passed: ${year}`);
      console.log(`🔄 Starting year-based sync for year: ${year}`);

      // Check if year is in the managed range (2010-2025)
      const isManagedYear = year >= 2010 && year <= 2025;
      console.log(`📊 Is managed year (2010-2025): ${isManagedYear}`);

      if (isManagedYear) {
        console.log(`🔍 Checking year status for managed year: ${year}`);
        // Get current status for the year
        const yearStatus = yearSyncStatusManager.getYearStatus(year);
        console.log(`📋 Current year status:`, yearStatus);

        if (yearStatus && yearStatus.year_status === "completed") {
          console.log(`⚠️ Year ${year} sync is already completed - skipping`);
          return res.status(200).json({
            success: true,
            message: `Year ${year} sync is already completed`,
            data: {
              year: year,
              year_status: "completed",
              last_sync: yearStatus.last_sync,
              note: "This year has already been synced. Use reset endpoint to re-sync if needed.",
            },
            timestamp: new Date().toISOString(),
          });
        }

        // Mark year as pending before starting sync
        yearSyncStatusManager.markYearPending(year);
        console.log(`📝 Marked year ${year} as pending`);
      }

      // Generate date range for the year
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;

      console.log(`📅 Sync date range: ${startDate} to ${endDate}`);

      // Generate sync requests for the specific year
      await generateYearBasedSyncRequests(startDate, endDate);

      // Get the request count WITHOUT clearing the queue
      // The queue will be cleared by QuickBooks Web Connector when it fetches requests
      const requestCount = qbXMLHandler.requestQueue.length;
      console.log(`📊 Generated ${requestCount} requests in queue`);

      // Mark year as completed after successful request generation
      if (isManagedYear) {
        yearSyncStatusManager.markYearCompleted(year);
      }

      res.status(200).json({
        success: true,
        message: `Year-based sync requests generated successfully for ${year}`,
        data: {
          year: year,
          startDate: startDate,
          endDate: endDate,
          requestCount: requestCount,
          year_status: isManagedYear ? "completed" : "not_managed",
          note: "QuickBooks Web Connector needs to be running to process the requests",
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ Error in year-based sync:", error);

      // Mark year as pending if there was an error
      const { year } = req.body;
      if (year >= 2010 && year <= 2025) {
        yearSyncStatusManager.markYearPending(year);
      }
      res.status(500).json({
        success: false,
        message: "Error generating year-based sync requests",
        error: error.message,
      });
    }
  }

  /**
   * Get all years sync status
   */
  async getYearSyncStatus(req, res) {
    try {
      const allStatus = yearSyncStatusManager.getAllYearsStatus();

      // Convert object to array format
      const yearsArray = Object.keys(allStatus).map((year) => ({
        year: parseInt(year),
        year_status: allStatus[year].year_status,
        last_sync: allStatus[year].last_sync,
        start_date: allStatus[year].start_date,
        end_date: allStatus[year].end_date,
      }));

      res.status(200).json({
        success: true,
        message: "Year sync status retrieved successfully",
        data: yearsArray,
        total_years: yearsArray.length,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ Error getting year sync status:", error);
      res.status(500).json({
        success: false,
        message: "Error getting year sync status",
        error: error.message,
      });
    }
  }

  /**
   * Get specific year sync status
   */
  async getSpecificYearStatus(req, res) {
    try {
      const { year } = req.params;

      if (!year || !Number.isInteger(parseInt(year))) {
        return res.status(400).json({
          success: false,
          message: "Invalid year parameter",
        });
      }

      const yearStatus = yearSyncStatusManager.getYearStatus(parseInt(year));

      if (!yearStatus) {
        return res.status(404).json({
          success: false,
          message: `Year ${year} not found in managed years (2010-2025)`,
        });
      }

      res.status(200).json({
        success: true,
        message: `Year ${year} sync status retrieved successfully`,
        data: {
          year: year,
          ...yearStatus,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ Error getting specific year status:", error);
      res.status(500).json({
        success: false,
        message: "Error getting specific year status",
        error: error.message,
      });
    }
  }

  /**
   * Reset year sync status to pending
   */
  async resetYearStatus(req, res) {
    try {
      const { year } = req.body;

      if (!year || !Number.isInteger(parseInt(year))) {
        return res.status(400).json({
          success: false,
          message: "Invalid year parameter",
        });
      }

      const yearNum = parseInt(year);

      if (yearNum < 2010 || yearNum > 2025) {
        return res.status(400).json({
          success: false,
          message: "Year must be between 2010 and 2025",
        });
      }

      yearSyncStatusManager.markYearPending(yearNum);

      res.status(200).json({
        success: true,
        message: `Year ${year} sync status reset to pending`,
        data: {
          year: year,
          year_status: "pending",
          last_sync: null,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ Error resetting year status:", error);
      res.status(500).json({
        success: false,
        message: "Error resetting year status",
        error: error.message,
      });
    }
  }

  /**
   * Reset all years sync status to pending
   */
  async resetAllYearsStatus(req, res) {
    try {
      yearSyncStatusManager.resetAllYears();

      res.status(200).json({
        success: true,
        message: "All years sync status reset to pending",
        data: yearSyncStatusManager.getAllYearsStatus(),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ Error resetting all years status:", error);
      res.status(500).json({
        success: false,
        message: "Error resetting all years status",
        error: error.message,
      });
    }
  }
}

module.exports = new SyncController();
