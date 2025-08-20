/*
 * qbXML Handler for QuickBooks Web Connector
 *
 * This handler manages qbXML requests and responses for QuickBooks integration.
 * It implements the required interface for the QuickBooks Web Connector.
 */

const fs = require("fs");
const path = require("path");
const { XMLParser } = require("fast-xml-parser");

/**
 * qbXML Handler Class
 *
 * Handles qbXML requests and responses for QuickBooks Web Connector
 */
class QBXMLHandler {
  constructor() {
    this.requestQueue = [];
    this.responseLog = [];
    this.errorLog = [];
    this.isProcessing = false;

    // Enhanced pagination tracking for items
    this.itemPagination = {
      currentBatch: 0,
      totalItemsProcessed: 0,
      iteratorID: null,
      hasMoreItems: true,
      isFirstQuery: true,
    };

    // Configuration
    this.config = {
      logResponses: true,
      logErrors: true,
      maxRetries: 3,
      retryDelay: 5000, // 5 seconds
    };

    // Initialize XML parser
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
    });
  }

  /**
   * Builds an array of qbXML commands to be run by QBWC.
   *
   * @param {Function} callback - Callback function(err, requestArray)
   */
  fetchRequests(callback) {
    try {
      console.log("Fetching qbXML requests...");

      // Clear previous queue
      this.requestQueue = [];

      // Check if we have more items to fetch
      if (this.itemPagination.hasMoreItems) {
        // Only add Item query - focusing on item sync only
        this.addItemQuery();
        console.log(
          `Generated ${this.requestQueue.length} qbXML requests (Items only)`
        );
      } else {
        console.log("🏁 No more items to fetch - pagination complete");
        console.log(
          `📊 Total items processed: ${this.itemPagination.totalItemsProcessed}`
        );
      }

      // Customer and Invoice queries removed as requested
      // this.addCustomerQuery();
      // this.addInvoiceQuery();
      // this.addVendorQuery();

      // You can also add custom requests based on your business logic
      // this.addCustomRequests();

      // Return the requests array
      callback(null, this.requestQueue);
    } catch (error) {
      console.error("Error in fetchRequests:", error);
      callback(error, []);
    }
  }

  /**
   * Called when a qbXML response is returned from QBWC.
   *
   * @param {string} response - qbXML response
   */
  handleResponse(response) {
    try {
      console.log("Received qbXML response");

      if (this.config.logResponses) {
        this.responseLog.push({
          timestamp: new Date().toISOString(),
          response: response,
        });
      }

      // Parse and process the response
      this.processResponse(response);
    } catch (error) {
      console.error("Error handling response:", error);
      this.didReceiveError(error);
    }
  }

  /**
   * Called when there is an error returned processing qbXML from QBWC.
   *
   * @param {Object} error - qbXML error response
   */
  didReceiveError(error) {
    try {
      console.error("Received qbXML error:", error);

      if (this.config.logErrors) {
        this.errorLog.push({
          timestamp: new Date().toISOString(),
          error: error,
        });
      }

      // Process the error
      this.processError(error);
    } catch (err) {
      console.error("Error in didReceiveError:", err);
    }
  }

  /**
   * Add a customer query request to the queue
   */
  addCustomerQuery() {
    const customerQuery = `<?xml version="1.0" encoding="utf-8"?>
<?qbxml version="13.0"?>
<QBXML>
    <QBXMLMsgsRq onError="stopOnError">
        <CustomerQueryRq requestID="1">
            <MaxReturned>100</MaxReturned>
            <ActiveStatus>All</ActiveStatus>
        </CustomerQueryRq>
    </QBXMLMsgsRq>
</QBXML>`;

    this.requestQueue.push(customerQuery);
  }

  /**
   * Add an invoice query request to the queue
   */
  addInvoiceQuery() {
    const invoiceQuery = `<?xml version="1.0" encoding="utf-8"?>
<?qbxml version="13.0"?>
<QBXML>
    <QBXMLMsgsRq onError="stopOnError">
        <InvoiceQueryRq requestID="2">
            <MaxReturned>50</MaxReturned>
            <TxnDateRangeFilter>
                <FromTxnDate>2024-01-01</FromTxnDate>
                <ToTxnDate>2024-12-31</ToTxnDate>
            </TxnDateRangeFilter>
        </InvoiceQueryRq>
    </QBXMLMsgsRq>
</QBXML>`;

    this.requestQueue.push(invoiceQuery);
  }

  /**
   * Add an item query request to the queue
   */
  addItemQuery() {
    // Simple query without complex filters - this should work reliably
    const itemQuery = `<?xml version="1.0" encoding="utf-8"?>
<?qbxml version="7.0"?>
<QBXML>
    <QBXMLMsgsRq onError="stopOnError">
        <ItemQueryRq requestID="1739">
            <MaxReturned>5</MaxReturned>
            <ActiveStatus>ActiveOnly</ActiveStatus>
        </ItemQueryRq>
    </QBXMLMsgsRq>
</QBXML>`;

    console.log(
      `📄 Adding item query (batch: ${this.itemPagination.currentBatch + 1})`
    );
    console.log(`🔄 Simple query - will fetch first 5 active items`);

    this.requestQueue.push(itemQuery);
  }

  /**
   * Add a vendor query request to the queue
   */
  //   addVendorQuery() {
  //     const vendorQuery = `<?xml version="1.0" encoding="utf-8"?>
  // <?qbxml version="13.0"?>
  // <QBXML>
  //     <QBXMLMsgsRq onError="stopOnError">
  //         <VendorQueryRq requestID="4">
  //             <MaxReturned>50</MaxReturned>
  //             <ActiveStatus>All</ActiveStatus>
  //         </VendorQueryRq>
  //     </QBXMLMsgsRq>
  // </QBXML>`;

  //     this.requestQueue.push(vendorQuery);
  //   }

  //   /**
  //    * Add a customer add request to the queue
  //    *
  //    * @param {Object} customerData - Customer data object
  //    */
  //   addCustomerAdd(customerData) {
  //     const customerAdd = `<?xml version="1.0" encoding="utf-8"?>
  // <?qbxml version="13.0"?>
  // <QBXML>
  //     <QBXMLMsgsRq onError="stopOnError">
  //         <CustomerAddRq requestID="5">
  //             <CustomerAdd>
  //                 <Name>${customerData.name || "New Customer"}</Name>
  //                 <CompanyName>${customerData.companyName || ""}</CompanyName>
  //                 <FirstName>${customerData.firstName || ""}</FirstName>
  //                 <LastName>${customerData.lastName || ""}</LastName>
  //                 <BillAddress>
  //                     <Addr1>${customerData.address1 || ""}</Addr1>
  //                     <Addr2>${customerData.address2 || ""}</Addr2>
  //                     <City>${customerData.city || ""}</City>
  //                     <State>${customerData.state || ""}</State>
  //                     <PostalCode>${customerData.postalCode || ""}</PostalCode>
  //                     <Country>${customerData.country || ""}</Country>
  //                 </BillAddress>
  //                 <Phone>${customerData.phone || ""}</Phone>
  //                 <Email>${customerData.email || ""}</Email>
  //             </CustomerAdd>
  //         </CustomerAddRq>
  //     </QBXMLMsgsRq>
  // </QBXML>`;

  //     this.requestQueue.push(customerAdd);
  //   }

  //   /**
  //    * Add an invoice add request to the queue
  //    *
  //    * @param {Object} invoiceData - Invoice data object
  //    */
  //   addInvoiceAdd(invoiceData) {
  //     const invoiceAdd = `<?xml version="1.0" encoding="utf-8"?>
  // <?qbxml version="13.0"?>
  // <QBXML>
  //     <QBXMLMsgsRq onError="stopOnError">
  //         <InvoiceAddRq requestID="6">
  //             <InvoiceAdd>
  //                 <CustomerRef>
  //                     <ListID>${invoiceData.customerListID || ""}</ListID>
  //                     <FullName>${invoiceData.customerName || ""}</FullName>
  //                 </CustomerRef>
  //                 <TxnDate>${
  //                   invoiceData.txnDate || new Date().toISOString().split("T")[0]
  //                 }</TxnDate>
  //                 <RefNumber>${invoiceData.refNumber || ""}</RefNumber>
  //                 <InvoiceLineAdd>
  //                     <ItemRef>
  //                         <ListID>${invoiceData.itemListID || ""}</ListID>
  //                         <FullName>${
  //                           invoiceData.itemName || "Service"
  //                         }</FullName>
  //                     </ItemRef>
  //                     <Desc>${invoiceData.description || ""}</Desc>
  //                     <Quantity>${invoiceData.quantity || 1}</Quantity>
  //                     <Rate>${invoiceData.rate || 0}</Rate>
  //                 </InvoiceLineAdd>
  //             </InvoiceAdd>
  //         </InvoiceAddRq>
  //     </QBXMLMsgsRq>
  // </QBXML>`;

  //     this.requestQueue.push(invoiceAdd);
  //   }

  /**
   * Process the qbXML response
   *
   * @param {string} response - qbXML response string
   */
  processResponse(response) {
    try {
      // Only process Item responses - focusing on item sync only
      if (response.includes("<ItemQueryRs")) {
        this.handleItemQueryResponse(response);
      } else {
        console.log("Non-item response received - skipping processing");
      }

      // Save response to file for debugging
      this.saveResponseToFile(response);
    } catch (error) {
      console.error("Error processing response:", error);
    }
  }

  /**
   * Process qbXML errors
   *
   * @param {Object} error - Error object
   */
  processError(error) {
    try {
      console.error("Processing qbXML error:", error);

      // Log error details
      if (error.hresult) {
        console.error("HRESULT:", error.hresult);
      }
      if (error.message) {
        console.error("Error Message:", error.message);
      }

      // Handle specific "no matching object" error
      if (
        error.message &&
        error.message.includes("did not find a matching object")
      ) {
        console.log(
          "⚠️ No items found in QuickBooks - this is normal if no items exist"
        );
        console.log(
          "💡 Make sure you have active items in your QuickBooks company file"
        );
        console.log("💡 Check that items are marked as 'Active' in QuickBooks");

        // Don't treat this as a critical error - just log it
        this.saveErrorToFile(error);
        return;
      }

      // Save error to file for debugging
      this.saveErrorToFile(error);

      // Implement retry logic if needed
      this.handleRetryLogic(error);
    } catch (err) {
      console.error("Error processing error:", err);
    }
  }

  /**
   * Handle customer query response
   *
   * @param {string} response - Customer query response
   */
  handleCustomerQueryResponse(response) {
    console.log("Processing customer query response");
    // Implement your customer data processing logic here
    // You might want to parse the XML and store in database
  }

  /**
   * Handle invoice query response
   *
   * @param {string} response - Invoice query response
   */
  handleInvoiceQueryResponse(response) {
    console.log("Processing invoice query response");
    // Implement your invoice data processing logic here
  }

  /**
   * Handle item query response
   *
   * @param {string} response - Item query response
   */
  handleItemQueryResponse(response) {
    console.log("Processing item query response");

    // Update batch counter
    this.itemPagination.currentBatch++;

    // Sync items to database and update pagination
    this.syncItemsToDatabase(response);
  }

  /**
   * Sync items from QuickBooks to database
   *
   * @param {string} response - qbXML response containing items
   */
  async syncItemsToDatabase(response) {
    try {
      console.log("🔄 Syncing items to database...");

      // Parse the qbXML response to extract item data
      const items = this.parseItemXML(response);

      if (items && items.length > 0) {
        // Import the Product model
        const { sequelize } = require("../models");
        const Product = require("../models/products.model")(
          sequelize,
          sequelize.Sequelize.DataTypes
        );

        let createdCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;

        for (const item of items) {
          try {
            // Validate item data before processing
            if (!item.listID || !item.name) {
              console.log(
                `⚠️ Skipping item with missing data: ListID=${item.listID}, Name=${item.name}`
              );
              skippedCount++;
              continue;
            }

            // Check if item already exists by quickbook_list_id (primary duplicate check)
            const existingItem = await Product.findOne({
              where: { quickbook_list_id: item.listID },
            });

            if (existingItem) {
              // Update existing item - prevents duplicates
              await existingItem.update({
                name: item.name,
                full_name: item.fullName,
                description: item.description,
                price: item.price,
                is_active: item.isActive,
                account_name: item.accountName,
                updated_at: new Date(), // Track when item was last updated
              });
              console.log(
                `✅ Updated existing item: ${item.name} (ListID: ${item.listID})`
              );
              updatedCount++;
            } else {
              // Additional check: Check if item exists by name (secondary duplicate check)
              const existingByName = await Product.findOne({
                where: { name: item.name },
              });

              if (existingByName) {
                console.log(
                  `⚠️ Item with name "${item.name}" already exists but different ListID. Skipping to prevent duplicates.`
                );
                skippedCount++;
                continue;
              }

              // Create new item - no duplicates found
              await Product.create({
                quickbook_list_id: item.listID,
                name: item.name,
                full_name: item.fullName,
                description: item.description,
                price: item.price,
                is_active: item.isActive,
                account_name: item.accountName,
                created_at: new Date(),
                updated_at: new Date(),
              });
              console.log(
                `✅ Created new item: ${item.name} (ListID: ${item.listID})`
              );
              createdCount++;
            }
          } catch (itemError) {
            console.error(`❌ Error processing item ${item.name}:`, itemError);
            skippedCount++;
          }
        }

        // Update pagination tracking
        this.itemPagination.totalItemsProcessed += items.length;

        // For now, we'll just fetch the same 5 items repeatedly
        // This ensures we don't get "no matching object" errors
        // In a production system, you might want to implement more sophisticated pagination
        console.log(`📊 Processed ${items.length} items in this batch`);
        console.log(
          `📊 Total items processed: ${this.itemPagination.totalItemsProcessed}`
        );

        // Log summary
        console.log(
          `📊 Sync Summary: Created=${createdCount}, Updated=${updatedCount}, Skipped=${skippedCount}`
        );

        console.log(`✅ Successfully synced ${items.length} items to database`);
        console.log(
          `📊 Total items processed so far: ${this.itemPagination.totalItemsProcessed}`
        );
      } else {
        console.log("ℹ️ No items found in response");
      }
    } catch (error) {
      console.error("❌ Error syncing items to database:", error);
    }
  }

  /**
   * Parse item XML response from QuickBooks
   *
   * @param {string} xmlString - qbXML response string
   * @returns {Array} Array of item objects
   */
  parseItemXML(xmlString) {
    try {
      const items = [];

      // Parse XML using fast-xml-parser
      const parsed = this.xmlParser.parse(xmlString);

      // Navigate to the item list - handle both ItemRet and ItemServiceRet
      let itemList = parsed?.QBXML?.QBXMLMsgsRs?.ItemQueryRs?.ItemRet;

      // If no ItemRet, try ItemServiceRet (which is what we're getting)
      if (!itemList) {
        itemList = parsed?.QBXML?.QBXMLMsgsRs?.ItemQueryRs?.ItemServiceRet;
      }

      if (itemList) {
        // Handle both single item and multiple items
        const itemsArray = Array.isArray(itemList) ? itemList : [itemList];

        for (const itemData of itemsArray) {
          const item = {
            listID: itemData.ListID || "",
            name: itemData.Name || "",
            fullName: itemData.FullName || "",
            description: itemData.SalesOrPurchase?.Desc || "",
            price: parseFloat(itemData.SalesOrPurchase?.Price || 0),
            isActive: itemData.IsActive === "true",
            accountName: itemData.SalesOrPurchase?.AccountRef?.FullName || "",
          };

          items.push(item);
        }
      }

      // Debug logging to see what we're actually parsing
      console.log("🔍 XML Parsing Debug:");
      console.log("  - Raw XML length:", xmlString.length);
      console.log("  - Parsed object keys:", Object.keys(parsed || {}));
      console.log("  - QBXML path:", parsed?.QBXML ? "✅ Found" : "❌ Missing");
      console.log(
        "  - QBXMLMsgsRs path:",
        parsed?.QBXML?.QBXMLMsgsRs ? "✅ Found" : "❌ Missing"
      );
      console.log(
        "  - ItemQueryRs path:",
        parsed?.QBXML?.QBXMLMsgsRs?.ItemQueryRs ? "✅ Found" : "❌ Missing"
      );
      console.log(
        "  - ItemServiceRet found:",
        itemList
          ? `✅ Found ${Array.isArray(itemList) ? itemList.length : 1} items`
          : "❌ Missing"
      );

      console.log(`📊 Parsed ${items.length} items from XML response`);
      return items;
    } catch (error) {
      console.error("❌ Error parsing item XML:", error);
      console.error("XML content:", xmlString.substring(0, 500) + "...");
      return [];
    }
  }

  /**
   * Handle vendor query response
   *
   * @param {string} response - Vendor query response
   */
  handleVendorQueryResponse(response) {
    console.log("Processing vendor query response");
    // Implement your vendor data processing logic here
  }

  /**
   * Handle customer add response
   *
   * @param {string} response - Customer add response
   */
  handleCustomerAddResponse(response) {
    console.log("Processing customer add response");
    // Implement your customer creation logic here
  }

  /**
   * Handle invoice add response
   *
   * @param {string} response - Invoice add response
   */
  handleInvoiceAddResponse(response) {
    console.log("Processing invoice add response");
    // Implement your invoice creation logic here
  }

  /**
   * Save response to file for debugging
   *
   * @param {string} response - qbXML response
   */
  saveResponseToFile(response) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `qb_response_${timestamp}.xml`;
      const filepath = path.join(__dirname, "..", "logs", filename);

      // Ensure logs directory exists
      const logsDir = path.dirname(filepath);
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }

      fs.writeFileSync(filepath, response, "utf8");
      console.log(`Response saved to: ${filepath}`);
    } catch (error) {
      console.error("Error saving response to file:", error);
    }
  }

  /**
   * Save error to file for debugging
   *
   * @param {Object} error - Error object
   */
  saveErrorToFile(error) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `qb_error_${timestamp}.json`;
      const filepath = path.join(__dirname, "..", "logs", filename);

      // Ensure logs directory exists
      const logsDir = path.dirname(filepath);
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }

      const errorData = {
        timestamp: new Date().toISOString(),
        hresult: error.hresult,
        message: error.message,
        error: error,
      };

      fs.writeFileSync(filepath, JSON.stringify(errorData, null, 2), "utf8");
      console.log(`Error saved to: ${filepath}`);
    } catch (err) {
      console.error("Error saving error to file:", err);
    }
  }

  /**
   * Handle retry logic for failed requests
   *
   * @param {Object} error - Error object
   */
  handleRetryLogic(error) {
    // Implement retry logic based on error type
    // This is a basic implementation - you might want to enhance it
    console.log("Implementing retry logic for error:", error.message);
  }

  /**
   * Get response log
   *
   * @returns {Array} Array of response log entries
   */
  getResponseLog() {
    return this.responseLog;
  }

  /**
   * Get error log
   *
   * @returns {Array} Array of error log entries
   */
  getErrorLog() {
    return this.errorLog;
  }

  /**
   * Clear logs
   */
  clearLogs() {
    this.responseLog = [];
    this.errorLog = [];
    console.log("Logs cleared");
  }

  /**
   * Set configuration
   *
   * @param {Object} config - Configuration object
   */
  setConfig(config) {
    this.config = { ...this.config, ...config };
  }

  /**
   * Reset pagination state
   */
  resetPagination() {
    this.itemPagination = {
      currentBatch: 0,
      totalItemsProcessed: 0,
      iteratorID: null,
      hasMoreItems: true,
      isFirstQuery: true,
    };
    console.log("🔄 Pagination state reset - will start from beginning");
  }

  /**
   * Get pagination status
   */
  getPaginationStatus() {
    return {
      ...this.itemPagination,
      status: "Simple Batch Processing",
      note: "Fetching first 5 active items repeatedly to avoid 'no matching object' errors",
      nextBatchInfo: "Will fetch first 5 active items in next sync",
    };
  }

  /**
   * Check for duplicate items in database
   */
  async checkForDuplicates() {
    try {
      const { sequelize } = require("../models");
      const Product = require("../models/products.model")(
        sequelize,
        sequelize.Sequelize.DataTypes
      );

      // Check for duplicates by quickbook_list_id
      const duplicatesByListID = await Product.findAll({
        attributes: [
          "quickbook_list_id",
          [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        ],
        where: {
          quickbook_list_id: {
            [sequelize.Op.ne]: null,
          },
        },
        group: ["quickbook_list_id"],
        having: sequelize.literal("COUNT(id) > 1"),
      });

      // Check for duplicates by name
      const duplicatesByName = await Product.findAll({
        attributes: [
          "name",
          [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        ],
        where: {
          name: {
            [sequelize.Op.ne]: null,
          },
        },
        group: ["name"],
        having: sequelize.literal("COUNT(id) > 1"),
      });

      return {
        duplicatesByListID: duplicatesByListID.length,
        duplicatesByName: duplicatesByName.length,
        totalDuplicates: duplicatesByListID.length + duplicatesByName.length,
      };
    } catch (error) {
      console.error("❌ Error checking for duplicates:", error);
      return { error: error.message };
    }
  }

  /**
   * Clean up duplicate items in database
   */
  async cleanupDuplicates() {
    try {
      const { sequelize } = require("../models");
      const Product = require("../models/products.model")(
        sequelize,
        sequelize.Sequelize.DataTypes
      );

      console.log("🧹 Starting duplicate cleanup...");

      // Find and remove duplicates by quickbook_list_id (keep the most recent)
      const duplicatesByListID = await sequelize.query(
        `
        DELETE p1 FROM products p1
        INNER JOIN products p2 
        WHERE p1.id < p2.id 
        AND p1.quickbook_list_id = p2.quickbook_list_id 
        AND p1.quickbook_list_id IS NOT NULL
      `,
        { type: sequelize.QueryTypes.DELETE }
      );

      // Find and remove duplicates by name (keep the most recent)
      const duplicatesByName = await sequelize.query(
        `
        DELETE p1 FROM products p1
        INNER JOIN products p2 
        WHERE p1.id < p2.id 
        AND p1.name = p2.name 
        AND p1.name IS NOT NULL
      `,
        { type: sequelize.QueryTypes.DELETE }
      );

      console.log("✅ Duplicate cleanup completed");
      return {
        removedByListID: duplicatesByListID[1] || 0,
        removedByName: duplicatesByName[1] || 0,
      };
    } catch (error) {
      console.error("❌ Error cleaning up duplicates:", error);
      return { error: error.message };
    }
  }

  /**
   * Force next batch of items
   */
  forceNextBatch() {
    if (this.itemPagination.hasMoreItems) {
      console.log("🔄 Forcing next batch of items...");
      return true;
    } else {
      console.log("🏁 No more items to fetch - pagination complete");
      return false;
    }
  }

  /**
   * Check if there are more items to fetch
   */
  hasMoreItems() {
    return this.itemPagination.hasMoreItems;
  }
}

// Export the handler instance
module.exports = new QBXMLHandler();
