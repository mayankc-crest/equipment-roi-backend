const cron = require("node-cron");
const { Op } = require("sequelize");
const {
  calc_invoice_line_items: CalcInvoiceLineItems,
  calc_invoices: CalcInvoices,
  calc_roi: CalcRoi,
  customers: Customers,
  alerts: Alerts,
} = require("../models");

/**
 * Cron job to check for 3-year review alerts
 * Runs every day at 5:00 AM UTC
 */
const threeYearReviewCron = cron.schedule(
  "0 5 * * *", // 5:00 AM UTC every day
  async () => {
    try {
      console.log("Starting 3-year review cron job...");

      // Get current date
      const today = new Date();
      const threeYearsAgo = new Date(today);
      threeYearsAgo.setFullYear(today.getFullYear() - 3);

      // Format dates for comparison (YYYY-MM-DD)
      const todayStr = today.toISOString().split("T")[0];
      const threeYearsAgoStr = threeYearsAgo.toISOString().split("T")[0];

      console.log(`Checking for items purchased on: ${threeYearsAgoStr}`);

      // Find calc_invoice_line_items that were created exactly 3 years ago
      const threeYearOldItems = await CalcInvoiceLineItems.findAll({
        include: [
          {
            model: CalcInvoices,
            as: "calcInvoice",
            attributes: ["id", "created_at"],
            include: [
              {
                model: CalcRoi,
                as: "calcRoi",
                attributes: ["id", "customer_id"],
                include: [
                  {
                    model: Customers,
                    as: "customer",
                    attributes: [
                      "id",
                      "first_name",
                      "last_name",
                      "company_name",
                    ],
                  },
                ],
              },
            ],
          },
        ],
        where: {
          created_at: {
            [Op.between]: [
              new Date(threeYearsAgoStr + " 00:00:00"),
              new Date(threeYearsAgoStr + " 23:59:59"),
            ],
          },
        },
      });

      console.log(
        `Found ${threeYearOldItems.length} items that are 3 years old today`
      );

      // Process each item and create alerts
      for (const item of threeYearOldItems) {
        try {
          const customer = item.calcInvoice?.calcRoi?.customer;

          if (!customer) {
            console.log(`Skipping item ${item.id} - no customer found`);
            continue;
          }

          // Check if alert already exists for this item
          const existingAlert = await Alerts.findOne({
            where: {
              customer_id: customer.id,
              calc_line_items_id: item.id,
              alert_type: "3_year_review",
            },
          });

          if (existingAlert) {
            console.log(
              `Alert already exists for customer ${customer.id} and item ${item.id}`
            );
            continue;
          }

          // Create alert message
          const message = `3-Year Review Alert: ${customer.first_name} ${
            customer.last_name
          } from ${customer.company_name} purchased ${
            item.product_name || "an item"
          } exactly 3 years ago today (${threeYearsAgoStr}). Time for a review!`;

          // Create new alert
          await Alerts.create({
            customer_id: customer.id,
            alert_type: "3_year_review",
            message: message,
            calc_line_items_id: item.id,
          });

          console.log(
            `Created 3-year review alert for customer ${customer.id} (${customer.first_name} ${customer.last_name})`
          );
        } catch (itemError) {
          console.error(`Error processing item ${item.id}:`, itemError);
        }
      }

      console.log("3-year review cron job completed successfully");
    } catch (error) {
      console.error("Error in 3-year review cron job:", error);
    }
  },
  {
    scheduled: false, // Don't start automatically
    timezone: "UTC",
  }
);

/**
 * Start the cron job
 */
const startThreeYearReviewCron = () => {
  threeYearReviewCron.start();
  console.log("3-year review cron job started - runs daily at 5:00 AM UTC");
};

/**
 * Stop the cron job
 */
const stopThreeYearReviewCron = () => {
  threeYearReviewCron.stop();
  console.log("3-year review cron job stopped");
};

/**
 * Get cron job status
 */
const getCronStatus = () => {
  return {
    running: threeYearReviewCron.running,
    scheduled: threeYearReviewCron.scheduled,
  };
};

module.exports = {
  threeYearReviewCron,
  startThreeYearReviewCron,
  stopThreeYearReviewCron,
  getCronStatus,
};
