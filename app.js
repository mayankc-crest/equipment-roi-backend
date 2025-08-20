require("dotenv").config();
const QuickBooksServer = require("./quickbook/server");
const qbXMLHandler = require("./quickbook/qbXMLHandler");

const express = require("express");
const cors = require("cors");
const indexRoutes = require("./routes");
const app = express();
const port = process.env.SERVER_PORT || 8000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use("/", indexRoutes);

// ITEM Sync control endpoints
app.get("/api/sync/status", async (req, res) => {
  try {
    const qbXMLHandler = require("./quickbook/qbXMLHandler");
    const duplicates = await qbXMLHandler.checkForDuplicates();

    res.json({
      success: true,
      message: "ITEM Sync service status",
      data: {
        syncType: "Items Only",
        autoSyncEnabled: !!global.syncInterval,
        lastSyncTime: global.lastSyncTime || "Never",
        nextSyncTime: global.syncInterval
          ? new Date(Date.now() + 1 * 60 * 1000).toISOString()
          : "Not scheduled",
        syncInterval: "Every 1 minute",
        activeQueries: ["ItemQueryRq (requestID: 1739)"],
        pagination: qbXMLHandler.getPaginationStatus(),
        duplicates: duplicates,
      },
    });
  } catch (error) {
    console.error("❌ Error getting sync status:", error);
    res.status(500).json({
      success: false,
      message: "Error getting sync status",
      error: error.message,
    });
  }
});

// Reset pagination endpoint
app.post("/api/sync/reset-pagination", (req, res) => {
  try {
    console.log("🔄 Resetting pagination state...");
    const qbXMLHandler = require("./quickbook/qbXMLHandler");
    qbXMLHandler.resetPagination();

    res.json({
      success: true,
      message: "Pagination state reset successfully",
      data: {
        pagination: qbXMLHandler.getPaginationStatus(),
      },
    });
  } catch (error) {
    console.error("❌ Error resetting pagination:", error);
    res.status(500).json({
      success: false,
      message: "Error resetting pagination",
      error: error.message,
    });
  }
});

// Check for duplicate items
app.get("/api/sync/check-duplicates", async (req, res) => {
  try {
    console.log("🔍 Checking for duplicate items...");
    const qbXMLHandler = require("./quickbook/qbXMLHandler");
    const duplicates = await qbXMLHandler.checkForDuplicates();

    res.json({
      success: true,
      message: "Duplicate check completed",
      data: duplicates,
    });
  } catch (error) {
    console.error("❌ Error checking duplicates:", error);
    res.status(500).json({
      success: false,
      message: "Error checking duplicates",
      error: error.message,
    });
  }
});

// Clean up duplicate items
app.post("/api/sync/cleanup-duplicates", async (req, res) => {
  try {
    console.log("🧹 Cleaning up duplicate items...");
    const qbXMLHandler = require("./quickbook/qbXMLHandler");
    const cleanupResult = await qbXMLHandler.cleanupDuplicates();

    res.json({
      success: true,
      message: "Duplicate cleanup completed",
      data: cleanupResult,
    });
  } catch (error) {
    console.error("❌ Error cleaning up duplicates:", error);
    res.status(500).json({
      success: false,
      message: "Error cleaning up duplicates",
      error: error.message,
    });
  }
});

// Force next batch of items
app.post("/api/sync/next-batch", async (req, res) => {
  try {
    console.log("🔄 Forcing next batch of items...");
    const qbXMLHandler = require("./quickbook/qbXMLHandler");

    if (qbXMLHandler.hasMoreItems()) {
      // This will trigger the next batch in the next sync cycle
      res.json({
        success: true,
        message: "Next batch will be fetched in next sync cycle",
        data: {
          hasMoreItems: true,
          pagination: qbXMLHandler.getPaginationStatus(),
        },
      });
    } else {
      res.json({
        success: true,
        message: "No more items to fetch - pagination complete",
        data: {
          hasMoreItems: false,
          pagination: qbXMLHandler.getPaginationStatus(),
        },
      });
    }
  } catch (error) {
    console.error("❌ Error forcing next batch:", error);
    res.status(500).json({
      success: false,
      message: "Error forcing next batch",
      error: error.message,
    });
  }
});

// Manual ITEM sync triggered via API
app.post("/api/sync/now", async (req, res) => {
  try {
    console.log("🔧 Manual ITEM sync triggered via API");

    // Import the QBXMLHandler
    const qbXMLHandler = require("./quickbook/qbXMLHandler");

    // Read the latest response file and sync it
    const fs = require("fs");
    const path = require("path");
    const logsDir = path.join(__dirname, "logs");

    if (fs.existsSync(logsDir)) {
      const files = fs
        .readdirSync(logsDir)
        .filter(
          (file) => file.startsWith("qb_response_") && file.endsWith(".xml")
        )
        .sort()
        .reverse(); // Get most recent first

      if (files.length > 0) {
        const latestFile = files[0];
        const filePath = path.join(logsDir, latestFile);
        const responseContent = fs.readFileSync(filePath, "utf8");

        console.log(`📁 Processing latest response file: ${latestFile}`);

        // Only sync if it's an item response
        if (responseContent.includes("<ItemQueryRs")) {
          await qbXMLHandler.syncItemsToDatabase(responseContent);
          console.log("✅ Manual ITEM sync completed successfully");

          global.lastSyncTime = new Date().toISOString();

          res.json({
            success: true,
            message: "Manual ITEM sync completed successfully",
            data: {
              processedFile: latestFile,
              syncTime: global.lastSyncTime,
              syncType: "Items Only",
            },
          });
        } else {
          res.status(400).json({
            success: false,
            message:
              "Latest response file is not an item query - no sync performed",
            data: {
              processedFile: latestFile,
              responseType: "Non-item response",
            },
          });
        }
      } else {
        res.status(404).json({
          success: false,
          message: "No response files found for sync",
        });
      }
    } else {
      res.status(404).json({
        success: false,
        message: "Logs directory not found",
      });
    }
  } catch (error) {
    console.error("❌ Error in manual ITEM sync:", error);
    res.status(500).json({
      success: false,
      message: "Error during manual ITEM sync",
      error: error.message,
    });
  }
});

const server = app.listen(port, () => {
  try {
    console.log(`🚀 Server connected on port ${port}`);

    // console.log("🔗 Attaching QuickBooks SOAP service...");
    // const qbServer = new QuickBooksServer();
    // qbServer.setQBXMLHandler(qbXMLHandler);
    // qbServer.attachToServer(server, "/wsdl");

    console.log("✅ QuickBooks SOAP service attached successfully!");
    console.log(
      "🔌 QBWC should connect to: http://localhost:" + port + "/wsdl"
    );
    console.log(
      "📊 Server is ready to handle both API requests and QuickBooks operations"
    );

    // Start automatic item sync every 1 minute
    console.log("⏰ Starting automatic ITEM sync every 1 minute...");
    // const syncInterval = setInterval(async () => {
    //   try {
    //     console.log(
    //       `\n🔄 [AUTO-SYNC] Starting scheduled ITEM sync at ${new Date().toLocaleString()}`
    //     );

    //     // Import the QBXMLHandler
    //     const qbXMLHandler = require("./quickbook/qbXMLHandler");

    //     // Read the latest response file and sync it
    //     const fs = require("fs");
    //     const path = require("path");
    //     const logsDir = path.join(__dirname, "logs");

    //     if (fs.existsSync(logsDir)) {
    //       const files = fs
    //         .readdirSync(logsDir)
    //         .filter(
    //           (file) => file.startsWith("qb_response_") && file.endsWith(".xml")
    //         )
    //         .sort()
    //         .reverse(); // Get most recent first

    //       if (files.length > 0) {
    //         const latestFile = files[0];
    //         const filePath = path.join(logsDir, latestFile);
    //         const responseContent = fs.readFileSync(filePath, "utf8");

    //         console.log(`📁 Processing latest response file: ${latestFile}`);

    //         // Only sync if it's an item response
    //         if (responseContent.includes("<ItemQueryRs")) {
    //           await qbXMLHandler.syncItemsToDatabase(responseContent);
    //           console.log("✅ [AUTO-SYNC] Items synced successfully");
    //         } else {
    //           console.log("ℹ️ [AUTO-SYNC] Non-item response - skipping sync");
    //         }
    //       } else {
    //         console.log("ℹ️ No response files found for auto-sync");
    //       }
    //     }

    //     console.log("✅ [AUTO-SYNC] Scheduled ITEM sync completed");
    //   } catch (error) {
    //     console.error("❌ [AUTO-SYNC] Error in scheduled ITEM sync:", error);
    //   }
    // }, 1 * 60 * 1000); // 1 minute in milliseconds

    // // Store interval reference for cleanup
    // global.syncInterval = syncInterval;
  } catch (error) {
    console.log("❌ Error connecting to server:", error);
  }
});

// Graceful shutdown
// process.on("SIGINT", () => {
//   console.log("\n🛑 Shutting down server gracefully...");
//   server.close(() => {
//     console.log("✅ Server closed successfully");
//     process.exit(0);
//   });
// });

// console.log("🎯 Integrated QuickBooks Server starting...");
// console.log("📝 Environment variables:");
// console.log("   QB_USERNAME:", process.env.QB_USERNAME || "NOT SET");
// console.log("   QB_PASSWORD:", process.env.QB_PASSWORD || "NOT SET");
// console.log("   SERVER_PORT:", process.env.SERVER_PORT || "8000 (default)");
