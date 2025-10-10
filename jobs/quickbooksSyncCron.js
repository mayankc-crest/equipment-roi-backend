const cron = require("node-cron");
const qbXMLHandler = require("../quickbook/qbXMLHandler");

/**
 * QuickBooks Sync Cron Jobs
 * Handles automatic syncing of QuickBooks data at specified intervals
 */
class QuickBooksSyncCron {
  constructor() {
    this.isRunning = false;
    this.syncJobs = {
      items: null,
      invoices: null,
      customers: null,
    };
  }

  /**
   * Start all QuickBooks sync cron jobs
   */
  startSyncCronJobs() {
    try {
      // Items sync - every 10 minutes
      this.syncJobs.items = cron.schedule(
        "*/2 * * * *",
        async () => {
          await this.syncItems();
        },
        {
          scheduled: false,
          timezone: "UTC",
        }
      );

      // Invoices sync - every 1 hour
      this.syncJobs.invoices = cron.schedule(
        "0 * * * *",
        async () => {
          await this.syncInvoices();
        },
        {
          scheduled: false,
          timezone: "UTC",
        }
      );

      // Customers sync - every 1 hour
      this.syncJobs.customers = cron.schedule(
        "*/15 * * * *",
        async () => {
          await this.syncCustomers();
        },
        {
          scheduled: false,
          timezone: "UTC",
        }
      );

      this.syncJobs.items.start();
      this.syncJobs.invoices.start();
      this.syncJobs.customers.start();

      this.isRunning = true;
      const startTime = new Date();
      console.log("🚀 QuickBooks sync cron jobs started successfully");
      console.log(`⏰ Started at: ${startTime.toISOString()}`);
      console.log("📅 Schedule:");
      console.log("- Items: Every 2 minutes");
      console.log("- Invoices: Every 1 hour");
      console.log("- Customers: Every 15 minutes");
      //   console.log("🔄 Cron jobs are now running automatically...");
    } catch (error) {
      console.error("❌ Error starting QuickBooks sync cron jobs:", error);
    }
  }

  //    Stop all QuickBooks sync cron jobs
  stopSyncCronJobs() {
    try {
      console.log("🛑 Stopping QuickBooks sync cron jobs...");

      Object.values(this.syncJobs).forEach((job) => {
        if (job) {
          job.stop();
        }
      });

      this.isRunning = false;
      console.log("✅ QuickBooks sync cron jobs stopped successfully");
    } catch (error) {
      console.error("❌ Error stopping QuickBooks sync cron jobs:", error);
    }
  }

  /**
   * Sync items from QuickBooks
   */
  async syncItems() {
    try {
      const now = new Date();
      const nextRun = new Date(now.getTime() + 2 * 60 * 1000); // Next run in 2 minutes

      console.log("🔄 [CRON] Starting items sync...");
      console.log(`⏰ [CRON] Items sync executed at: ${now.toISOString()}`);
      console.log(
        `⏰ [CRON] Next items sync scheduled at: ${nextRun.toISOString()}`
      );

      // Generate item query request
      await qbXMLHandler.addItemQuery();

      // Get the current request queue length
      const requestCount = qbXMLHandler.requestQueue.length;

      console.log(
        `✅ [CRON] Items sync request generated - ${requestCount} requests`
      );

      // Note: QBWC will automatically process these requests when it connects
      // No need to manually trigger QBWC - it runs on its own schedule
    } catch (error) {
      console.error("❌ [CRON] Error in items sync:", error);
    }
  }

  /**
   * Sync invoices from QuickBooks
   */
  async syncInvoices() {
    try {
      const now = new Date();
      const nextRun = new Date(now.getTime() + 60 * 60 * 1000); // Next run in 1 hour

      console.log("🔄 [CRON] Starting invoices sync...");
      console.log(`⏰ [CRON] Invoices sync executed at: ${now.toISOString()}`);
      console.log(
        `⏰ [CRON] Next invoices sync scheduled at: ${nextRun.toISOString()}`
      );

      // Generate invoice query request
      await qbXMLHandler.addInvoiceQuery();

      // Get the current request queue length
      const requestCount = qbXMLHandler.requestQueue.length;

      console.log(
        `✅ [CRON] Invoices sync request generated - ${requestCount} requests`
      );
    } catch (error) {
      console.error("❌ [CRON] Error in invoices sync:", error);
    }
  }

  /**
   * Sync customers from QuickBooks
   */
  async syncCustomers() {
    try {
      const now = new Date();
      const nextRun = new Date(now.getTime() + 15 * 60 * 1000); // Next run in 15 minutes

      console.log("🔄 [CRON] Starting customers sync...");
      console.log(`⏰ [CRON] Customers sync executed at: ${now.toISOString()}`);
      console.log(
        `⏰ [CRON] Next customers sync scheduled at: ${nextRun.toISOString()}`
      );

      // Generate customer query request
      await qbXMLHandler.addCustomerQuery();

      // Get the current request queue length
      const requestCount = qbXMLHandler.requestQueue.length;

      console.log(
        `✅ [CRON] Customers sync request generated - ${requestCount} requests`
      );
    } catch (error) {
      console.error("❌ [CRON] Error in customers sync:", error);
    }
  }

  /**
   * Get sync status
   */
  getSyncStatus() {
    return {
      isRunning: this.isRunning,
      jobs: {
        items: this.syncJobs.items ? this.syncJobs.items.running : false,
        invoices: this.syncJobs.invoices
          ? this.syncJobs.invoices.running
          : false,
        customers: this.syncJobs.customers
          ? this.syncJobs.customers.running
          : false,
      },
      schedule: {
        items: "Every 10 minutes (*/10 * * * *)",
        invoices: "Every 1 hour (0 * * * *)",
        customers: "Every 1 hour (0 * * * *)",
      },
    };
  }

  /**
   * Manually trigger specific sync
   */
  async triggerSync(type) {
    switch (type) {
      case "items":
        await this.syncItems();
        break;
      case "invoices":
        await this.syncInvoices();
        break;
      case "customers":
        await this.syncCustomers();
        break;
      default:
        throw new Error(`Unknown sync type: ${type}`);
    }
  }
}

// Create singleton instance
const quickBooksSyncCron = new QuickBooksSyncCron();

module.exports = quickBooksSyncCron;
