require("dotenv").config();
const QuickBooksServer = require("./quickbook/server");
const qbXMLHandler = require("./quickbook/qbXMLHandler");
const { startThreeYearReviewCron } = require("./jobs/threeYearReviewCron");
const quickBooksSyncCron = require("./jobs/quickbooksSyncCron");
const AuthMiddleware = require("./middleware/auth.middleware");

const express = require("express");
const cors = require("cors");
const indexRoutes = require("./routes");
const app = express();
const port = process.env.SERVER_PORT || 8000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Serve static files for uploaded profile images
app.use("/uploads", express.static("uploads"));

app.use("/", indexRoutes);

// Update the sync status endpoint
app.get("/api/sync/status", AuthMiddleware.verifyToken, async (req, res) => {
  try {
    const qbXMLHandler = require("./quickbook/qbXMLHandler");
    const duplicates = await qbXMLHandler.checkForDuplicates();

    res.json({
      success: true,
      message: "ITEM Sync service status",
      data: {
        syncType: "Initial QuickBooks Call + XML File Management",
        autoSyncEnabled: false, // Changed to false
        lastSyncTime: global.lastSyncTime || "Never",
        nextSyncTime: "Manual - No automatic sync",
        syncInterval: "Disabled - Using XML files after initial fetch",
        activeQueries: ["ItemQueryRq (requestID: 1739) - Initial call only"],
        pagination: qbXMLHandler.getPaginationStatus(),
        duplicates: duplicates,
        syncCounter: qbXMLHandler.getSyncCounter(),
        lastLogFile: `timestamp_${qbXMLHandler.getSyncCounter()}.xml`,
        batchProcessing: {
          available: true,
          lastBatchTime: global.lastBatchTime || "Never",
          description: "Process products from XML files in batches",
          endpoints: [
            "GET /api/batch/status - Get batch processing status",
            "POST /api/batch/start - Process all XML files",
            "POST /api/batch/process-file - Process specific file",
            "GET /api/batch/files - List available files",
          ],
        },
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
app.post(
  "/api/sync/reset-pagination",
  AuthMiddleware.verifyToken,
  (req, res) => {
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
  }
);

// Check for duplicate items
app.get(
  "/api/sync/check-duplicates",
  AuthMiddleware.verifyToken,
  async (req, res) => {
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
  }
);

// Clean up duplicate items
app.post(
  "/api/sync/cleanup-duplicates",
  AuthMiddleware.verifyToken,
  async (req, res) => {
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
  }
);

// Force next batch of items
app.post(
  "/api/sync/next-batch",
  AuthMiddleware.verifyToken,
  async (req, res) => {
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
  }
);

// Get sync progress
app.get("/api/sync/progress", AuthMiddleware.verifyToken, async (req, res) => {
  try {
    console.log("📊 Getting sync progress...");
    const qbXMLHandler = require("./quickbook/qbXMLHandler");
    const progress = qbXMLHandler.getSyncProgress();

    res.json({
      success: true,
      message: "Sync progress retrieved successfully",
      data: progress,
    });
  } catch (error) {
    console.error("❌ Error getting sync progress:", error);
    res.status(500).json({
      success: false,
      message: "Error getting sync progress",
      error: error.message,
    });
  }
});

// Get detailed sync statistics
app.get(
  "/api/sync/statistics",
  AuthMiddleware.verifyToken,
  async (req, res) => {
    try {
      console.log("📊 Getting detailed sync statistics...");
      const qbXMLHandler = require("./quickbook/qbXMLHandler");
      const statistics = qbXMLHandler.getSyncStatistics();

      res.json({
        success: true,
        message: "Sync statistics retrieved successfully",
        data: statistics,
      });
    } catch (error) {
      console.error("❌ Error getting sync statistics:", error);
      res.status(500).json({
        success: false,
        message: "Error getting sync statistics",
        error: error.message,
      });
    }
  }
);

// Get numbered log files
app.get("/api/sync/logs", AuthMiddleware.verifyToken, async (req, res) => {
  try {
    console.log("📁 Getting numbered log files...");
    const qbXMLHandler = require("./quickbook/qbXMLHandler");
    const logFiles = qbXMLHandler.getNumberedLogFiles();

    res.json({
      success: true,
      message: "Numbered log files retrieved successfully",
      data: logFiles,
    });
  } catch (error) {
    console.error("❌ Error getting numbered log files:", error);
    res.status(500).json({
      success: false,
      message: "Error getting numbered log files",
      error: error.message,
    });
  }
});

// Reset sync counter
app.post("/api/sync/reset-counter", AuthMiddleware.verifyToken, (req, res) => {
  try {
    console.log("🔄 Resetting sync counter...");
    const qbXMLHandler = require("./quickbook/qbXMLHandler");
    qbXMLHandler.resetSyncCounter();

    res.json({
      success: true,
      message: "Sync counter reset successfully",
      data: {
        newCounter: qbXMLHandler.getSyncCounter(),
        pagination: qbXMLHandler.getPaginationStatus(),
      },
    });
  } catch (error) {
    console.error("❌ Error resetting sync counter:", error);
    res.status(500).json({
      success: false,
      message: "Error resetting sync counter",
      error: error.message,
    });
  }
});

// Switch pagination strategy
app.post(
  "/api/sync/switch-strategy",
  AuthMiddleware.verifyToken,
  async (req, res) => {
    try {
      console.log("🔄 Switching pagination strategy...");
      const qbXMLHandler = require("./quickbook/qbXMLHandler");
      qbXMLHandler.switchPaginationStrategy();

      res.json({
        success: true,
        message: "Pagination strategy switched successfully",
        data: {
          newStrategy: qbXMLHandler.itemPagination.paginationStrategy,
          pagination: qbXMLHandler.getPaginationStatus(),
        },
      });
    } catch (error) {
      console.error("❌ Error switching pagination strategy:", error);
      res.status(500).json({
        success: false,
        message: "Error switching pagination strategy",
        error: error.message,
      });
    }
  }
);

// Manual ITEM sync triggered via API
app.post("/api/sync/now", AuthMiddleware.verifyToken, async (req, res) => {
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

// Comprehensive ITEM sync with improved pagination
app.post(
  "/api/sync/comprehensive",
  AuthMiddleware.verifyToken,
  async (req, res) => {
    try {
      console.log("🚀 Comprehensive ITEM sync triggered via API");

      // Import the QBXMLHandler
      const qbXMLHandler = require("./quickbook/qbXMLHandler");

      // Start comprehensive sync
      const result = await qbXMLHandler.syncAllItemsComprehensive();

      global.lastSyncTime = new Date().toISOString();

      res.json({
        success: true,
        message: "Comprehensive ITEM sync completed successfully",
        data: {
          syncTime: global.lastSyncTime,
          syncType: "Comprehensive Items Sync",
          itemsProcessed: result ? result.length : 0,
          pagination: qbXMLHandler.getPaginationStatus(),
          strategy: qbXMLHandler.itemPagination.paginationStrategy,
        },
      });
    } catch (error) {
      console.error("❌ Error in comprehensive ITEM sync:", error);
      res.status(500).json({
        success: false,
        message: "Error during comprehensive ITEM sync",
        error: error.message,
      });
    }
  }
);

// Batch processing endpoints
// Get batch processing status
app.get("/api/batch/status", AuthMiddleware.verifyToken, async (req, res) => {
  try {
    console.log("📊 Getting batch processing status...");
    const qbXMLHandler = require("./quickbook/qbXMLHandler");
    const status = qbXMLHandler.getBatchProcessingStatus();

    res.json({
      success: true,
      message: "Batch processing status retrieved successfully",
      data: status,
    });
  } catch (error) {
    console.error("❌ Error getting batch processing status:", error);
    res.status(500).json({
      success: false,
      message: "Error getting batch processing status",
      error: error.message,
    });
  }
});

// Start batch processing from parsed data files
app.post("/api/batch/start", AuthMiddleware.verifyToken, async (req, res) => {
  try {
    const { batchSize = 100, sourceFile = null } = req.body;

    console.log(`🚀 Starting batch processing with batch size: ${batchSize}`);
    if (sourceFile) {
      console.log(`📁 Processing specific file: ${sourceFile}`);
    }

    // Validate batch size
    if (batchSize < 1 || batchSize > 1000) {
      return res.status(400).json({
        success: false,
        message: "Batch size must be between 1 and 1000",
        data: { batchSize, validRange: "1-1000" },
      });
    }

    const qbXMLHandler = require("./quickbook/qbXMLHandler");

    // Start batch processing
    const result = await qbXMLHandler.processProductsFromParsedFiles(
      batchSize,
      sourceFile
    );

    global.lastBatchTime = new Date().toISOString();

    res.json({
      success: true,
      message: "Batch processing completed successfully",
      data: {
        batchTime: global.lastBatchTime,
        batchSize: batchSize,
        sourceFile: sourceFile || "All parsed data files",
        result: result,
      },
    });
  } catch (error) {
    console.error("❌ Error in batch processing:", error);
    res.status(500).json({
      success: false,
      message: "Error during batch processing",
      error: error.message,
    });
  }
});

// Process specific parsed data file
app.post(
  "/api/batch/process-file",
  AuthMiddleware.verifyToken,
  async (req, res) => {
    try {
      const { filename, batchSize = 100 } = req.body;

      if (!filename) {
        return res.status(400).json({
          success: false,
          message: "Filename is required",
          data: { required: "filename" },
        });
      }

      console.log(
        `📄 Processing specific file: ${filename} with batch size: ${batchSize}`
      );

      const qbXMLHandler = require("./quickbook/qbXMLHandler");

      // Process specific file
      const result = await qbXMLHandler.processProductsFromParsedFiles(
        batchSize,
        filename
      );

      global.lastBatchTime = new Date().toISOString();

      res.json({
        success: true,
        message: `File ${filename} processed successfully`,
        data: {
          batchTime: global.lastBatchTime,
          filename: filename,
          batchSize: batchSize,
          result: result,
        },
      });
    } catch (error) {
      console.error("❌ Error processing specific file:", error);
      res.status(500).json({
        success: false,
        message: "Error processing specific file",
        error: error.message,
      });
    }
  }
);

// Get list of available parsed data files
app.get("/api/batch/files", AuthMiddleware.verifyToken, async (req, res) => {
  try {
    console.log("📁 Getting list of parsed data files...");
    const qbXMLHandler = require("./quickbook/qbXMLHandler");
    const status = qbXMLHandler.getBatchProcessingStatus();

    if (status.error) {
      return res.status(500).json({
        success: false,
        message: "Error getting parsed data files",
        error: status.error,
      });
    }

    res.json({
      success: true,
      message: "Parsed data files retrieved successfully",
      data: {
        totalFiles: status.totalParsedFiles,
        totalItems: status.totalItemsAvailable,
        files: status.files,
        batchProcessing: status.batchProcessing,
      },
    });
  } catch (error) {
    console.error("❌ Error getting parsed data files:", error);
    res.status(500).json({
      success: false,
      message: "Error getting parsed data files",
      error: error.message,
    });
  }
});

// ... existing code ...

const server = app.listen(port, () => {
  try {
    console.log(`🚀 Server connected on port ${port}`);

    console.log("🔗 Attaching QuickBooks SOAP service...");
    const qbServer = new QuickBooksServer();
    qbServer.setQBXMLHandler(qbXMLHandler);
    qbServer.attachToServer(server, "/wsdl");

    console.log("✅ QuickBooks SOAP service attached successfully!");
    console.log(
      "🔌 QBWC should connect to: http://localhost:" + port + "/wsdl"
    );
    console.log(
      "�� Server is ready to handle both API requests and QuickBooks operations"
    );

    // REMOVE THE AUTOMATIC SYNC - QuickBooks will be called only once initially
    console.log(
      "⏰ Automatic sync DISABLED - QuickBooks will be called once initially"
    );
    console.log(
      "�� After initial data fetch, use batch processing from XML files:"
    );
    console.log("   - POST /api/batch/start - Process all XML files");
    console.log("   - POST /api/batch/process-file - Process specific file");
    console.log("   - GET /api/batch/status - Check available files");

    // No more setInterval - QuickBooks sync happens only when QBWC connects
    global.syncInterval = null; // No automatic sync

    // Start the 3-year review cron job
    console.log("🕐 Starting 3-year review cron job...");
    startThreeYearReviewCron();

    // Start QuickBooks sync cron jobs
    // console.log("🔄 Starting QuickBooks sync cron jobs...");
    // quickBooksSyncCron.startSyncCronJobs();
  } catch (error) {
    console.log("❌ Error connecting to server:", error);
  }
});
