const fs = require("fs");
const path = require("path");
const { XMLParser } = require("fast-xml-parser");
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

    // Initialize sync counter for numbered log files
    this.syncCounter = 0;
    this.initializeSyncCounter();
  }

  /**
   * Initialize sync counter by reading existing log files
   */
  initializeSyncCounter() {
    try {
      const logsDir = path.join(__dirname, "..", "logs");

      if (fs.existsSync(logsDir)) {
        // Read all existing log files to find the highest number
        const files = fs
          .readdirSync(logsDir)
          .filter((file) => file.match(/^timestamp_\d+\.xml$/))
          .map((file) => {
            const match = file.match(/^timestamp_(\d+)\.xml$/);
            return match ? parseInt(match[1]) : 0;
          })
          .sort((a, b) => b - a); // Sort in descending order

        if (files.length > 0) {
          this.syncCounter = files[0]; // Set to highest existing number
          console.log(`📊 Sync counter initialized to: ${this.syncCounter}`);
        } else {
          this.syncCounter = 0;
          console.log(`📊 Sync counter initialized to: 0 (no existing logs)`);
        }
      } else {
        this.syncCounter = 0;
        console.log(
          `📊 Sync counter initialized to: 0 (logs directory doesn't exist)`
        );
      }
    } catch (error) {
      console.error("❌ Error initializing sync counter:", error);
      this.syncCounter = 0;
    }
  }

  /**
   * Builds an array of qbXML commands to be run by QBWC.
   *
   * @param {Function} callback - Callback function(err, requestArray)
   */
  async fetchRequests(callback) {
    try {
      // If we have requests in queue, return them
      if (this.requestQueue.length > 0) {
        const requestsToReturn = [...this.requestQueue];
        this.requestQueue = []; // Clear the queue after returning
        callback(null, requestsToReturn);
        return;
      }

      // If no requests in queue, generate regular sync requests
      await this.generateRegularSyncRequests();

      // Return the generated requests
      const requestsToReturn = [...this.requestQueue];
      this.requestQueue = []; // Clear the queue after returning
      callback(null, requestsToReturn);
    } catch (error) {
      callback(error, null);
    }
  }

  /**
   * Generate regular sync requests (items, customers, invoices)
   */
  async generateRegularSyncRequests() {
    // Check if we have more items to fetch
    if (this.itemPagination.hasMoreItems) {
      await this.addItemQuery();
    }

    // Add Customer query
    await this.addCustomerQuery();

    // Add Invoice query
    await this.addInvoiceQuery();
  }

  /**
   * Add requests to queue for manual sync
   */
  addToQueue(requests) {
    if (Array.isArray(requests)) {
      this.requestQueue.push(...requests);
    } else {
      this.requestQueue.push(requests);
    }
  }

  /**
   * Get current queue length
   */
  getQueueLength() {
    return this.requestQueue.length;
  }

  /**
   * Clear the queue
   */
  clearQueue() {
    this.requestQueue = [];
  }

  /**
   * Called when a qbXML response is returned from QBWC.
   *
   * @param {string} response - qbXML response
   */
  handleResponse(response) {
    try {
      console.log("📥 ===== QBWC RESPONSE RECEIVED ======");
      console.log(`⏰ Response received at: ${new Date().toISOString()}`);
      console.log(
        `📏 Response length: ${response ? response.length : 0} characters`
      );

      // Check if response is empty or null
      if (!response || response.trim() === "") {
        console.log("⚠️ Empty response received from QuickBooks");
        console.log("📥 ===== QBWC RESPONSE HANDLING COMPLETED ======");
        return;
      }

      // Check if response is too short (likely empty)
      if (response.length < 100) {
        console.log(
          "⚠️ Very short response received from QuickBooks:",
          response
        );
        console.log("📥 ===== QBWC RESPONSE HANDLING COMPLETED ======");
        return;
      }

      console.log(
        "✅ Received qbXML response (length:",
        response.length,
        "characters)"
      );

      // Write to debug log
      this.writeYearSyncDebugLog(
        "INFO",
        `QBWC returned response with ${response.length} characters`
      );

      if (this.config.logResponses) {
        this.responseLog.push({
          timestamp: new Date().toISOString(),
          response: response,
        });
      }

      // Parse and process the response
      this.processResponse(response);
    } catch (error) {
      console.error("❌ Error handling response:", error);
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
  async addCustomerQuery() {
    try {
      // Get dynamic date range for customer sync
      const dateRange = await this.getCustomerDateRange();

      // Convert ISO timestamps to date format for QuickBooks
      const fromDate = dateRange.startDate.includes("T")
        ? dateRange.startDate.split("T")[0]
        : dateRange.startDate;
      const toDate = dateRange.endDate.includes("T")
        ? dateRange.endDate.split("T")[0]
        : dateRange.endDate;

      console.log(
        `📅 Converted dates for QuickBooks: ${fromDate} to ${toDate}`
      );

      const customerQuery = `<?xml version="1.0" encoding="utf-8"?>
<?qbxml version="13.0"?>
<QBXML>
    <QBXMLMsgsRq onError="stopOnError">
        <CustomerQueryRq requestID="1">
            <ActiveStatus>All</ActiveStatus>
            <FromModifiedDate>${fromDate}</FromModifiedDate>
            <ToModifiedDate>${toDate}</ToModifiedDate>
        </CustomerQueryRq>
    </QBXMLMsgsRq>
</QBXML>`;

      this.requestQueue.push(customerQuery);
    } catch (error) {
      // Fallback to default query if there's an error
      const fallbackQuery = `<?xml version="1.0" encoding="utf-8"?>
<?qbxml version="13.0"?>
<QBXML>
    <QBXMLMsgsRq onError="stopOnError">
        <CustomerQueryRq requestID="1">
            <ActiveStatus>All</ActiveStatus>
        </CustomerQueryRq>
    </QBXMLMsgsRq>
</QBXML>`;
      console.log("📄 Using fallback customer query (no date filter)");
      this.requestQueue.push(fallbackQuery);
    }
  }

  /**
   * Add a customer query request for a specific year
   */
  addCustomerQueryForYear(startDate, endDate) {
    // Convert ISO timestamps to date format for QuickBooks
    const fromDate = startDate.includes("T")
      ? startDate.split("T")[0]
      : startDate;
    const toDate = endDate.includes("T") ? endDate.split("T")[0] : endDate;

    const customerQuery = `<?xml version="1.0" encoding="utf-8"?>
<?qbxml version="13.0"?>
<QBXML>
    <QBXMLMsgsRq onError="stopOnError">
        <CustomerQueryRq requestID="1">
            <ActiveStatus>All</ActiveStatus>
            <FromModifiedDate>${fromDate}</FromModifiedDate>
            <ToModifiedDate>${toDate}</ToModifiedDate>
        </CustomerQueryRq>
    </QBXMLMsgsRq>
</QBXML>`;

    this.requestQueue.push(customerQuery);
  }

  /**
   * Add an invoice query request to the queue
   */
  async addInvoiceQuery() {
    try {
      // Get dynamic date range for invoice sync
      const dateRange = await this.getInvoiceDateRange();

      // Convert ISO timestamps to date format for QuickBooks
      const fromDate = dateRange.startDate.includes("T")
        ? dateRange.startDate.split("T")[0]
        : dateRange.startDate;
      const toDate = dateRange.endDate.includes("T")
        ? dateRange.endDate.split("T")[0]
        : dateRange.endDate;

      console.log(
        `📅 Converted dates for QuickBooks: ${fromDate} to ${toDate}`
      );

      const invoiceQuery = `<?xml version="1.0" encoding="utf-8"?>
                            <?qbxml version="13.0"?>
                              <QBXML>
                                <QBXMLMsgsRq onError="stopOnError">
                                  <InvoiceQueryRq requestID="2">
                                    <TxnDateRangeFilter>
                                      <FromTxnDate>${fromDate}</FromTxnDate>
                                      <ToTxnDate>${toDate}</ToTxnDate>
                                    </TxnDateRangeFilter>
                                    <IncludeLineItems>true</IncludeLineItems>
                                  </InvoiceQueryRq>
                                </QBXMLMsgsRq>
                              </QBXML>`;

      this.requestQueue.push(invoiceQuery);
    } catch (error) {
      // Fallback to default date range if there's an error
      const fallbackQuery = `<?xml version="1.0" encoding="utf-8"?>
<?qbxml version="13.0"?>
<QBXML>
    <QBXMLMsgsRq onError="stopOnError">
        <InvoiceQueryRq requestID="2">
            <TxnDateRangeFilter>
                <FromTxnDate>2025-01-01</FromTxnDate>
                <ToTxnDate>${new Date().toISOString().split("T")[0]}</ToTxnDate>
            </TxnDateRangeFilter>
            <IncludeLineItems>true</IncludeLineItems>
        </InvoiceQueryRq>
    </QBXMLMsgsRq>
</QBXML>`;
      console.log("📄 Using fallback invoice query (2025-01-01 to now)");
      this.requestQueue.push(fallbackQuery);
    }
  }

  /**
   * Add an invoice query request for a specific year
   */
  async addInvoiceQueryForYear(startDate, endDate) {
    try {
      // Convert ISO timestamps to date format for QuickBooks
      const fromDate = startDate.includes("T")
        ? startDate.split("T")[0]
        : startDate;
      const toDate = endDate.includes("T") ? endDate.split("T")[0] : endDate;

      const invoiceQuery = `<?xml version="1.0" encoding="utf-8"?>
<?qbxml version="13.0"?>
<QBXML>
    <QBXMLMsgsRq onError="stopOnError">
        <InvoiceQueryRq requestID="2">
            <TxnDateRangeFilter>
                <FromTxnDate>${fromDate}</FromTxnDate>
                <ToTxnDate>${toDate}</ToTxnDate>
            </TxnDateRangeFilter>
            <IncludeLineItems>true</IncludeLineItems>
        </InvoiceQueryRq>
    </QBXMLMsgsRq>
</QBXML>`;

      this.requestQueue.push(invoiceQuery);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get dynamic date range for invoice sync
   * @returns {Object} Object with startDate and endDate
   */
  async getInvoiceDateRange() {
    try {
      // Import the Invoice model
      const db = require("../models");
      const Invoices = db.invoices;

      // Get the last invoice's created_at date
      const lastInvoice = await Invoices.findOne({
        order: [["createdAt", "DESC"]],
        attributes: ["createdAt"],
      });

      let startDate;
      let endDate = new Date().toISOString(); // Current date and time in ISO format

      if (lastInvoice && lastInvoice.createdAt) {
        // Use the last invoice's created_at date and time as start date
        startDate = new Date(lastInvoice.createdAt).toISOString();
        console.log(`📅 Found last invoice from: ${startDate}`);
      } else {
        // Edge case: No invoices in database, use default start date
        console.log("in the else condition :: ");
        startDate = "2025-01-01T00:00:00.000Z";
        console.log(
          `📅 No invoices found in database, using default start date: ${startDate}`
        );
      }
      console.log("before the return condition :: ");
      return {
        startDate: startDate,
        endDate: endDate,
      };
    } catch (error) {
      // Return fallback dates if there's an error
      console.log("in the catch condition :: ", error);
      return {
        startDate: "2025-01-01T00:00:00.000Z",
        endDate: new Date().toISOString(),
      };
    }
  }

  /**
   * Get dynamic date range for customer sync
   * @returns {Object} Object with startDate and endDate
   */
  async getCustomerDateRange() {
    try {
      // Import the Customer model
      const db = require("../models");
      const Customers = db.customers;

      // Get the last customer's created_at date
      const lastCustomer = await Customers.findOne({
        order: [["createdAt", "DESC"]],
        attributes: ["createdAt"],
      });

      let startDate;
      let endDate = new Date().toISOString(); // Current date and time in ISO format

      if (lastCustomer && lastCustomer.createdAt) {
        // Use the last customer's created_at date and time as start date
        startDate = new Date(lastCustomer.createdAt).toISOString();
        console.log(`📅 Found last customer from: ${startDate}`);
      } else {
        // Edge case: No customers in database, use default start date
        console.log("in the else condition for customers:: ");
        startDate = "2025-01-01T00:00:00.000Z";
        console.log(
          `📅 No customers found in database, using default start date: ${startDate}`
        );
      }
      console.log("before the return condition for customers:: ");
      return {
        startDate: startDate,
        endDate: endDate,
      };
    } catch (error) {
      // Return fallback dates if there's an error
      console.log("in the catch condition for customers:: ", error);
      return {
        startDate: "2025-01-01T00:00:00.000Z",
        endDate: new Date().toISOString(),
      };
    }
  }

  /**
   * Get dynamic date range for item sync
   * @returns {Object} Object with startDate and endDate
   */
  async getItemDateRange() {
    try {
      // Import the Product model
      const db = require("../models");
      const Products = db.products;

      // Get the last product's created_at date
      const lastProduct = await Products.findOne({
        order: [["createdAt", "DESC"]],
        attributes: ["createdAt"],
      });

      let startDate;
      let endDate = new Date().toISOString(); // Current date and time in ISO format

      if (lastProduct && lastProduct.createdAt) {
        // Use the last product's created_at date and time as start date
        startDate = new Date(lastProduct.createdAt).toISOString();
        console.log(`📅 Found last product from: ${startDate}`);
      } else {
        // Edge case: No products in database, use default start date
        console.log("in the else condition for products:: ");
        startDate = "2025-01-01T00:00:00.000Z";
        console.log(
          `📅 No products found in database, using default start date: ${startDate}`
        );
      }
      console.log("before the return condition for products:: ");
      return {
        startDate: startDate,
        endDate: endDate,
      };
    } catch (error) {
      // Return fallback dates if there's an error
      console.log("in the catch condition for products:: ", error);
      return {
        startDate: "2025-01-01T00:00:00.000Z",
        endDate: new Date().toISOString(),
      };
    }
  }

  /**
   * Add an item query request to the queue
   */
  async addItemQuery() {
    try {
      // Get dynamic date range for item sync
      const dateRange = await this.getItemDateRange();
      console.log("items query has been called:::");

      // Convert ISO timestamps to date format for QuickBooks
      const fromDate = dateRange.startDate.includes("T")
        ? dateRange.startDate.split("T")[0]
        : dateRange.startDate;
      const toDate = dateRange.endDate.includes("T")
        ? dateRange.endDate.split("T")[0]
        : dateRange.endDate;

      console.log(
        `📅 Converted dates for QuickBooks: ${fromDate} to ${toDate}`
      );

      const itemQuery = `<?xml version="1.0" encoding="utf-8"?>
<?qbxml version="7.0"?>
<QBXML>
    <QBXMLMsgsRq onError="stopOnError">
        <ItemQueryRq requestID="1739">
            <ActiveStatus>ActiveOnly</ActiveStatus>
            <FromModifiedDate>${fromDate}</FromModifiedDate>
            <ToModifiedDate>${toDate}</ToModifiedDate>
        </ItemQueryRq>
    </QBXMLMsgsRq>
</QBXML>`;

      console.log(
        `📄 Adding item query (batch: ${this.itemPagination.currentBatch + 1})`
      );
      console.log(
        `🔄 Dynamic query - will fetch items from ${fromDate} to ${toDate}`
      );

      this.requestQueue.push(itemQuery);
    } catch (error) {
      // Fallback to simple query if there's an error
      console.log("items query fallback called:::");
      const fallbackQuery = `<?xml version="1.0" encoding="utf-8"?>
<?qbxml version="7.0"?>
<QBXML>
    <QBXMLMsgsRq onError="stopOnError">
        <ItemQueryRq requestID="1739">
            <ActiveStatus>ActiveOnly</ActiveStatus>
        </ItemQueryRq>
    </QBXMLMsgsRq>
</QBXML>`;
      console.log("📄 Using fallback item query (no date filter)");
      this.requestQueue.push(fallbackQuery);
    }
  }

  /**
   * Add an item query request for a specific year
   */
  addItemQueryForYear(startDate, endDate) {
    // Convert ISO timestamps to date format for QuickBooks
    const fromDate = startDate.includes("T")
      ? startDate.split("T")[0]
      : startDate;
    const toDate = endDate.includes("T") ? endDate.split("T")[0] : endDate;

    const itemQuery = `<?xml version="1.0" encoding="utf-8"?>
<?qbxml version="7.0"?>
<QBXML>
    <QBXMLMsgsRq onError="stopOnError">
        <ItemQueryRq requestID="1739">
            <ActiveStatus>All</ActiveStatus>
            <FromModifiedDate>${fromDate}</FromModifiedDate>
            <ToModifiedDate>${toDate}</ToModifiedDate>
        </ItemQueryRq>
    </QBXMLMsgsRq>
</QBXML>`;

    this.requestQueue.push(itemQuery);
  }

  /**
   * Process the qbXML response
   *
   * @param {string} response - qbXML response string
   */
  processResponse(response) {
    try {
      console.log("🔍 Processing response...");

      // Check if response contains any data
      if (!response.includes("<") || !response.includes(">")) {
        console.log("⚠️ Invalid XML response received - no XML tags found");
        return;
      }

      // Check for QuickBooks errors first
      if (
        response.includes('statusCode="3020"') ||
        response.includes('statusSeverity="Error"')
      ) {
        console.log("❌ QuickBooks returned an error in response");
        this.handleQuickBooksError(response);
        return;
      }

      // Process different types of responses
      if (response.includes("<ItemQueryRs")) {
        console.log("📦 Processing ItemQuery response");
        this.handleItemQueryResponse(response);
      } else if (response.includes("<CustomerQueryRs")) {
        console.log("👥 Processing CustomerQuery response");
        this.handleCustomerQueryResponse(response);
      } else if (response.includes("<InvoiceQueryRs")) {
        console.log("🧾 Processing InvoiceQuery response");
        this.handleInvoiceQueryResponse(response);
      } else {
        console.log(
          "❓ Non-item/customer/invoice response received - skipping processing"
        );
        console.log("Response preview:", response.substring(0, 200) + "...");
      }

      // Save response to file for debugging
      this.saveResponseToFile(response);
    } catch (error) {
      console.error("❌ Error processing response:", error);
    }
  }

  /**
   * Handle QuickBooks errors in response
   * @param {string} response - qbXML response containing error
   */
  handleQuickBooksError(response) {
    try {
      console.log("🚨 ===== QUICKBOOKS ERROR DETECTED ======");

      // Extract error details using regex
      const statusCodeMatch = response.match(/statusCode="([^"]+)"/);
      const statusMessageMatch = response.match(/statusMessage="([^"]+)"/);

      const statusCode = statusCodeMatch ? statusCodeMatch[1] : "Unknown";
      const statusMessage = statusMessageMatch
        ? statusMessageMatch[1]
        : "Unknown error";

      console.log(`❌ Error Code: ${statusCode}`);
      console.log(`❌ Error Message: ${statusMessage}`);

      // Write to debug log
      this.writeYearSyncDebugLog(
        "ERROR",
        `QuickBooks Error ${statusCode}: ${statusMessage}`
      );

      console.log("🚨 ===== QUICKBOOKS ERROR HANDLED ======");
    } catch (error) {
      console.error("❌ Error parsing QuickBooks error:", error);
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
   * Extract customer data from XML
   *
   * @param {Object} customerData - Raw customer data from XML
   * @returns {Object} Processed customer object
   */
  extractCustomerData(customerData) {
    try {
      const customer = {
        listID: customerData.ListID || "",
        name: customerData.Name || "",
        fullName: customerData.FullName || customerData.Name || "",
        companyName: customerData.CompanyName || "",
        firstName: customerData.FirstName || "",
        lastName: customerData.LastName || "",
        isActive: customerData.IsActive !== "false",
        phone: customerData.Phone || "",
        email: customerData.Email || "",
        address1: "",
        address2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "",
      };

      // Extract address information
      if (customerData.BillAddress) {
        customer.address1 = customerData.BillAddress.Addr1 || "";
        customer.address2 = customerData.BillAddress.Addr2 || "";
        customer.city = customerData.BillAddress.City || "";
        customer.state = customerData.BillAddress.State || "";
        customer.postalCode = customerData.BillAddress.PostalCode || "";
        customer.country = customerData.BillAddress.Country || "";
      }

      console.log(
        `�� Extracted customer: ${customer.name} - Company: ${customer.companyName}, Email: ${customer.email}`
      );
      return customer;
    } catch (error) {
      console.error(`❌ Error extracting customer data:`, error);
      return {
        listID: "",
        name: "Error Processing Customer",
        fullName: "Error Processing Customer",
        companyName: "",
        firstName: "",
        lastName: "",
        isActive: false,
        phone: "",
        email: "",
        address1: "",
        address2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "",
      };
    }
  }

  /**
   * Parse customer XML response from QuickBooks
   *
   * @param {string} xmlString - qbXML response string
   * @returns {Array} Array of customer objects
   */
  parseCustomerXML(xmlString) {
    try {
      const customers = [];

      // Parse XML using fast-xml-parser
      const parsed = this.xmlParser.parse(xmlString);

      // Navigate to the customer response
      const customerResponse = parsed?.QBXML?.QBXMLMsgsRs?.CustomerQueryRs;

      if (!customerResponse) {
        console.log("⚠️ No CustomerQueryRs found in response");
        return customers;
      }

      // Handle customer data
      let customerList = customerResponse.CustomerRet;

      if (customerList) {
        // Handle both single customer and multiple customers
        const customersArray = Array.isArray(customerList)
          ? customerList
          : [customerList];

        customersArray.forEach((customerData) => {
          const customer = this.extractCustomerData(customerData);
          if (customer.name) {
            // Only add customers with names
            customers.push(customer);
          }
        });
      }

      console.log(
        `📊 Successfully parsed ${customers.length} customers from XML response`
      );
      return customers;
    } catch (error) {
      console.error("❌ Error parsing customer XML:", error);
      return [];
    }
  }

  /**
   * Save parsed customer data to file for debugging and analysis
   */
  saveParsedCustomerDataToFile(customers, originalXML) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `parsed_customers_${this.syncCounter}.json`;
      const filepath = path.join(__dirname, "..", "logs", filename);

      // Ensure logs directory exists
      const logsDir = path.dirname(filepath);
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }

      const parsedData = {
        syncNumber: this.syncCounter,
        timestamp: new Date().toISOString(),
        totalCustomers: customers.length,
        customers: customers,
        originalXMLLength: originalXML.length,
        parsingSummary: {
          customersWithListID: customers.filter((customer) => customer.listID)
            .length,
          customersWithName: customers.filter((customer) => customer.name)
            .length,
          customersWithEmail: customers.filter((customer) => customer.email)
            .length,
          customersWithPhone: customers.filter((customer) => customer.phone)
            .length,
          customersWithAddress: customers.filter(
            (customer) => customer.address1
          ).length,
        },
      };

      fs.writeFileSync(filepath, JSON.stringify(parsedData, null, 2), "utf8");
      console.log(
        `📁 Parsed customer data saved to: ${filename} (Sync #${this.syncCounter})`
      );
    } catch (error) {
      console.error("❌ Error saving parsed customer data to file:", error);
    }
  }

  /**
   * Sync customers from QuickBooks to database
   *
   * @param {string} response - qbXML response containing customers
   */
  async syncCustomersToDatabase(response) {
    try {
      console.log("💾 Syncing customers to database...");

      // Check if response is empty or invalid
      if (!response || response.trim() === "") {
        console.log("⚠️ Empty response received for customers sync");
        return;
      }

      // First, parse the XML response to extract customers
      const customers = this.parseCustomerXML(response);

      if (!customers || customers.length === 0) {
        console.log("⚠️ No customers found in XML response");
        return;
      }

      console.log(`📊 Found ${customers.length} customers to process`);

      // Import the Customer model
      const db = require("../models");
      const Customers = db.customers;

      let createdCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;

      // Process each parsed customer
      for (const customer of customers) {
        try {
          console.log(`🔄 Processing customer: ${customer.name || "Unknown"}`);

          // Validate customer data
          if (!customer.name) {
            console.log(
              `⚠️ Skipping customer with missing name: ${JSON.stringify(
                customer
              )}`
            );
            skippedCount++;
            continue;
          }

          // Generate fallback ListID if missing
          if (!customer.listID || customer.listID === "") {
            customer.listID = `FALLBACK_${customer.name}_${Date.now()}`;
            console.log(
              `⚠️ Generated fallback ListID for customer: ${customer.name} -> ${customer.listID}`
            );
          }

          // Check if customer already exists
          const existingCustomer = await Customers.findOne({
            where: { quickbook_list_id: customer.listID },
          });

          if (existingCustomer) {
            // Update existing customer
            await existingCustomer.update({
              name: customer.name,
              full_name: customer.fullName || customer.name,
              company_name: customer.companyName || "",
              first_name: customer.firstName || "",
              last_name: customer.lastName || "",
              is_active: customer.isActive !== false,
              phone: customer.phone || "",
              email: customer.email || "",
              address1: customer.address1 || "",
              address2: customer.address2 || "",
              city: customer.city || "",
              state: customer.state || "",
              postal_code: customer.postalCode || "",
              country: customer.country || "",
              updated_at: new Date(),
            });
            console.log(`✅ Updated existing customer: ${customer.name}`);
            updatedCount++;
          } else {
            // Create new customer
            await Customers.create({
              quickbook_list_id: customer.listID,
              name: customer.name,
              full_name: customer.fullName || customer.name,
              company_name: customer.companyName || "",
              first_name: customer.firstName || "",
              last_name: customer.lastName || "",
              is_active: customer.isActive !== false,
              phone: customer.phone || "",
              email: customer.email || "",
              address1: customer.address1 || "",
              address2: customer.address2 || "",
              city: customer.city || "",
              state: customer.state || "",
              postal_code: customer.postalCode || "",
              country: customer.country || "",
              created_at: new Date(),
              updated_at: new Date(),
            });
            console.log(`✅ Created new customer: ${customer.name}`);
            createdCount++;
          }
        } catch (customerError) {
          console.error(
            `❌ Error processing customer ${customer.name || "Unknown"}:`,
            customerError
          );
          skippedCount++;
        }
      }

      // Log summary
      console.log(
        `📊 Customer Sync Summary: Created=${createdCount}, Updated=${updatedCount}, Skipped=${skippedCount}`
      );
      console.log(
        `✅ Successfully synced ${customers.length} customers to database`
      );

      // Save parsed data to file for debugging
      this.saveParsedCustomerDataToFile(customers, response);
    } catch (error) {
      console.error("❌ Error syncing customers to database:", error);
    }
  }

  /**
   * Extract invoice data from XML
   *
   * @param {Object} invoiceData - Raw invoice data from XML
   * @returns {Object} Processed invoice object
   */
  extractInvoiceData(invoiceData) {
    try {
      const invoice = {
        listID: invoiceData.TxnID || "",
        txn_id: invoiceData.TxnID || null, // Add txn_id field
        txn_number: invoiceData.TxnNumber
          ? parseInt(invoiceData.TxnNumber)
          : null, // Add txn_number field
        refNumber: invoiceData.RefNumber || "",
        txnDate: invoiceData.TxnDate || new Date().toISOString().split("T")[0],
        dueDate: invoiceData.DueDate || null,
        customerListID: "",
        customerName: "",
        customerFullName: "",
        subtotal: 0.0,
        totalAmount: 0.0,
        balanceRemaining: 0.0,
        memo: invoiceData.Memo || "",
        isPaid: false,
        isActive: invoiceData.IsActive !== "false",
        invoiceLines: [],
      };

      // Extract customer information
      if (invoiceData.CustomerRef) {
        invoice.customerListID = invoiceData.CustomerRef.ListID || "";
        invoice.customerName = invoiceData.CustomerRef.FullName || "";
        invoice.customerFullName = invoiceData.CustomerRef.FullName || "";
      }

      // Extract financial amounts
      if (invoiceData.Subtotal) {
        invoice.subtotal = parseFloat(invoiceData.Subtotal) || 0.0;
      }
      if (invoiceData.TotalAmount) {
        invoice.totalAmount = parseFloat(invoiceData.TotalAmount) || 0.0;
      }
      if (invoiceData.BalanceRemaining) {
        invoice.balanceRemaining =
          parseFloat(invoiceData.BalanceRemaining) || 0.0;
        invoice.isPaid = invoice.balanceRemaining <= 0;
      }

      // Extract invoice line items
      if (invoiceData.InvoiceLineRet) {
        const lines = Array.isArray(invoiceData.InvoiceLineRet)
          ? invoiceData.InvoiceLineRet
          : [invoiceData.InvoiceLineRet];

        lines.forEach((line, index) => {
          const invoiceLine = {
            lineNumber: index + 1,
            itemListID: "",
            itemName: "",
            description: line.Desc || "",
            quantity: parseFloat(line.Quantity) || 1.0,
            unitPrice: parseFloat(line.Rate) || 0.0,
            amount: parseFloat(line.Amount) || 0.0,
          };

          // Extract item information
          if (line.ItemRef) {
            invoiceLine.itemListID = line.ItemRef.ListID || "";
            invoiceLine.itemName = line.ItemRef.FullName || "";
          }

          invoice.invoiceLines.push(invoiceLine);
        });
      }

      console.log(
        `📄 Extracted invoice: ${invoice.refNumber} - Customer: ${invoice.customerName}, Amount: $${invoice.totalAmount}, Lines: ${invoice.invoiceLines.length}`
      );
      return invoice;
    } catch (error) {
      console.error(`❌ Error extracting invoice data:`, error);
      return {
        listID: "",
        refNumber: "Error Processing Invoice",
        txnDate: new Date().toISOString().split("T")[0],
        dueDate: null,
        customerListID: "",
        customerName: "Error Processing Invoice",
        customerFullName: "Error Processing Invoice",
        subtotal: 0.0,
        totalAmount: 0.0,
        balanceRemaining: 0.0,
        memo: "",
        isPaid: false,
        isActive: false,
        invoiceLines: [],
      };
    }
  }

  /**
   * Parse invoice XML response from QuickBooks
   *
   * @param {string} xmlString - qbXML response string
   * @returns {Array} Array of invoice objects
   */
  parseInvoiceXML(xmlString) {
    try {
      const invoices = [];

      // Parse XML using fast-xml-parser
      const parsed = this.xmlParser.parse(xmlString);

      // Navigate to the invoice response
      const invoiceResponse = parsed?.QBXML?.QBXMLMsgsRs?.InvoiceQueryRs;

      if (!invoiceResponse) {
        console.log("⚠️ No InvoiceQueryRs found in response");
        return invoices;
      }

      // Handle invoice data
      let invoiceList = invoiceResponse.InvoiceRet;

      if (invoiceList) {
        // Handle both single invoice and multiple invoices
        const invoicesArray = Array.isArray(invoiceList)
          ? invoiceList
          : [invoiceList];

        invoicesArray.forEach((invoiceData) => {
          const invoice = this.extractInvoiceData(invoiceData);
          if (
            invoice.refNumber &&
            invoice.refNumber !== "Error Processing Invoice"
          ) {
            // Only add invoices with valid reference numbers
            invoices.push(invoice);
          }
        });
      }

      console.log(
        `📊 Successfully parsed ${invoices.length} invoices from XML response`
      );
      return invoices;
    } catch (error) {
      console.error("❌ Error parsing invoice XML:", error);
      return [];
    }
  }

  /**
   * Save parsed invoice data to file for debugging and analysis
   */
  saveParsedInvoiceDataToFile(invoices, originalXML) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `parsed_invoices_${this.syncCounter}.json`;
      const filepath = path.join(__dirname, "..", "logs", filename);

      // Ensure logs directory exists
      const logsDir = path.dirname(filepath);
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }

      const parsedData = {
        syncNumber: this.syncCounter,
        timestamp: new Date().toISOString(),
        totalInvoices: invoices.length,
        invoices: invoices,
        originalXMLLength: originalXML.length,
        parsingSummary: {
          invoicesWithListID: invoices.filter((invoice) => invoice.listID)
            .length,
          invoicesWithRefNumber: invoices.filter((invoice) => invoice.refNumber)
            .length,
          invoicesWithCustomer: invoices.filter(
            (invoice) => invoice.customerListID
          ).length,
          invoicesWithLines: invoices.filter(
            (invoice) => invoice.invoiceLines.length > 0
          ).length,
          totalInvoiceLines: invoices.reduce(
            (sum, invoice) => sum + invoice.invoiceLines.length,
            0
          ),
          paidInvoices: invoices.filter((invoice) => invoice.isPaid).length,
          unpaidInvoices: invoices.filter((invoice) => !invoice.isPaid).length,
        },
      };

      fs.writeFileSync(filepath, JSON.stringify(parsedData, null, 2), "utf8");
      console.log(
        `📁 Parsed invoice data saved to: ${filename} (Sync #${this.syncCounter})`
      );
    } catch (error) {
      console.error("❌ Error saving parsed invoice data to file:", error);
    }
  }

  /**
   * Sync invoices from QuickBooks to database
   *
   * @param {string} response - qbXML response containing invoices
   */
  async syncInvoicesToDatabase(response) {
    try {
      console.log("🧾 ===== SYNCING INVOICES TO DATABASE ======");
      console.log(`⏰ Sync started at: ${new Date().toISOString()}`);

      // Check if response is empty or invalid
      if (!response || response.trim() === "") {
        console.log("⚠️ Empty response received for invoices sync");
        console.log("🧾 ===== INVOICE SYNC COMPLETED (NO DATA) ======");
        return;
      }

      // First, parse the XML response to extract invoices
      const invoices = this.parseInvoiceXML(response);

      if (!invoices || invoices.length === 0) {
        console.log("⚠️ No invoices found in XML response");
        console.log("🧾 ===== INVOICE SYNC COMPLETED (NO DATA) ======");
        return;
      }

      console.log(`📊 Found ${invoices.length} invoices to process`);

      // Import the Invoice model
      const db = require("../models");
      const Invoices = db.invoices;

      let createdCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;

      // Process each parsed invoice
      for (const invoice of invoices) {
        try {
          console.log(
            `🔄 Processing invoice: ${invoice.refNumber || "Unknown"}`
          );
          let CalROICustomer = false;
          let calROIID = null;
          let net_cost = 0;
          let net_products_total = 0;
          let total_sales = 0;
          let total_recouped = 0;
          let net_cost_left = 0;
          let routeId = null;
          let salesRepId = null;
          let calcInvoiceId = null;
          let productIds = [];
          // Validate invoice data
          if (
            !invoice.refNumber ||
            invoice.refNumber === "Error Processing Invoice"
          ) {
            console.log(
              `⚠️ Skipping invoice with missing reference number: ${JSON.stringify(
                invoice
              )}`
            );
            skippedCount++;
            continue;
          }

          // Generate fallback ListID if missing
          if (!invoice.listID || invoice.listID === "") {
            invoice.listID = `FALLBACK_INV_${invoice.refNumber}_${Date.now()}`;
            console.log(
              `⚠️ Generated fallback ListID for invoice: ${invoice.refNumber} -> ${invoice.listID}`
            );
          }

          // Find the customer by QuickBooks ListID
          let customerId = null;
          if (invoice.customerListID) {
            // this if condition is for customer and get it's data for same
            const customer = await db.customers.findOne({
              where: { quickbook_list_id: invoice.customerListID },
            });
            if (customer) {
              customerId = customer.id;
              console.log(
                `  🔗 Found customer: ${customer.name} (ID: ${customerId})`
              );

              // Check if customer exists in calc_roi table
              const calcRoiExists = await db.calc_roi.findOne({
                where: { customer_id: customerId },
              });

              if (calcRoiExists) {
                CalROICustomer = true;
                calROIID = calcRoiExists.id;
                net_cost = calcRoiExists.net_cost;
                net_products_total = calcRoiExists.net_products_total;
                total_sales = calcRoiExists.total_sales;
                total_recouped = calcRoiExists.total_recouped;
                net_cost_left = calcRoiExists.net_cost_left;

                const calcInvoice = await db.calc_invoices.findOne({
                  where: { roi_id: calcRoiExists.id },
                  attributes: ["route_id", "sales_rep_id"],
                });

                if (calcInvoice) {
                  routeId = calcInvoice.route_id;
                  salesRepId = calcInvoice.sales_rep_id;
                }

                // Get category IDs from calc_roi_categories
                const calcRoiCategories = await db.calc_roi_categories.findAll({
                  where: { roi_id: calcRoiExists.id },
                  attributes: ["category_id"],
                });

                const categoryIds = calcRoiCategories.map(
                  (cat) => cat.category_id
                );
                // Get product IDs from category_products table
                if (categoryIds.length > 0) {
                  const categoryProducts = await db.category_products.findAll({
                    where: {
                      category_id: { [db.Sequelize.Op.in]: categoryIds },
                    },
                    attributes: ["product_id"],
                  });

                  const foundProductIds = categoryProducts.map(
                    (cp) => cp.product_id
                  );
                  productIds = foundProductIds;
                }
              }
            } else {
              console.log(
                `  ⚠️ Customer not found for ListID: ${invoice.customerListID}`
              );
            }
          }

          // Check if invoice already exists
          const existingInvoice = await Invoices.findOne({
            where: { quickbook_list_id: invoice.listID },
          });

          if (existingInvoice) {
            // Update existing invoice
            // console.log("THE existing invoice is here :::", existingInvoice);
            if (CalROICustomer) {
              if (
                !existingInvoice.is_calculated &&
                !existingInvoice.is_sync_calculated
              ) {
                try {
                  const calcInvoice = await db.calc_invoices.create({
                    roi_id: calROIID,
                    invoice_id: existingInvoice.id,
                    customer_id: customerId,
                    route_id: routeId,
                    sales_rep_id: salesRepId,
                    total_amount: existingInvoice.total_amount,
                    installation_date: existingInvoice.txn_date, // You can set this if needed
                  });
                  calcInvoiceId = calcInvoice.id;
                  // we need to add the update for is_calculated
                  await existingInvoice.update({
                    // is_calculated: true,
                    is_sync_calculated: true,
                  });
                  console.log(
                    "invoice got created in the calc_invoice table::: ",
                    calcInvoice
                  );
                } catch (calcInvoiceError) {
                  console.error(
                    `Error creating calc_invoices entry for invoice ${existingInvoice.ref_number}:`,
                    calcInvoiceError
                  );
                }
              }
            }
            await existingInvoice.update({
              txn_id: invoice.txn_id,
              txn_number: invoice.txn_number,
              ref_number: invoice.refNumber,
              txn_date: invoice.txnDate,
              due_date: invoice.dueDate,
              customer_list_id: invoice.customerListID,
              customer_id: customerId,
              customer_name: invoice.customerName,
              customer_full_name: invoice.customerFullName,
              subtotal: invoice.subtotal,
              total_amount: invoice.totalAmount,
              balance_remaining: invoice.balanceRemaining,
              memo: invoice.memo,
              is_paid: invoice.isPaid,
              is_active: invoice.isActive,
              // updatedAt will be automatically set by Sequelize
            });
            console.log(`✅ Updated existing invoice: ${invoice.refNumber}`);
            updatedCount++;

            // Handle invoice line items for updated invoice
            if (invoice.invoiceLines.length > 0) {
              await this.storeInvoiceLineItems(
                invoice.invoiceLines,
                existingInvoice.id,
                calROIID,
                calcInvoiceId,
                productIds,
                net_cost,
                net_products_total,
                total_sales,
                total_recouped,
                net_cost_left
              );
            }
          } else {
            // Create new invoice
            const newInvoice = await Invoices.create({
              quickbook_list_id: invoice.listID,
              txn_id: invoice.txn_id,
              txn_number: invoice.txn_number,
              ref_number: invoice.refNumber,
              txn_date: invoice.txnDate,
              due_date: invoice.dueDate,
              customer_list_id: invoice.customerListID,
              customer_id: customerId,
              customer_name: invoice.customerName,
              customer_full_name: invoice.customerFullName,
              subtotal: invoice.subtotal,
              total_amount: invoice.totalAmount,
              balance_remaining: invoice.balanceRemaining,
              memo: invoice.memo,
              is_paid: invoice.isPaid,
              is_active: invoice.isActive,
              // createdAt and updatedAt will be automatically set by Sequelize
            });
            console.log(`✅ Created new invoice: ${invoice.refNumber}`);
            createdCount++;

            if (CalROICustomer) {
              try {
                const newCalcInvoice = await db.calc_invoices.create({
                  roi_id: calROIID,
                  invoice_id: newInvoice.id,
                  customer_id: customerId,
                  route_id: routeId,
                  sales_rep_id: salesRepId,
                  total_amount: invoice.totalAmount,
                  installation_date: invoice.txnDate,
                });
                calcInvoiceId = newCalcInvoice.id;
                await newInvoice.update({
                  // is_calculated: true,
                  is_sync_calculated: true,
                });
              } catch (error) {
                console.error(
                  "Error while creating new invoice calc_invoice::",
                  error
                );
              }
            }

            // Handle invoice line items for newly created invoice
            if (invoice.invoiceLines.length > 0) {
              await this.storeInvoiceLineItems(
                invoice.invoiceLines,
                newInvoice.id,
                calROIID,
                calcInvoiceId,
                productIds,
                net_cost,
                net_products_total,
                total_sales,
                total_recouped,
                net_cost_left
              );
            }
          }
        } catch (invoiceError) {
          console.error(
            `❌ Error processing invoice ${invoice.refNumber || "Unknown"}:`,
            invoiceError
          );
          skippedCount++;
        }
      }

      // Log summary
      console.log(
        `📊 Invoice Sync Summary: Created=${createdCount}, Updated=${updatedCount}, Skipped=${skippedCount}`
      );

      // Save parsed data to file for debugging
      this.saveParsedInvoiceDataToFile(invoices, response);

      console.log(
        `✅ Successfully synced ${invoices.length} invoices to database`
      );
      console.log(`⏰ Sync completed at: ${new Date().toISOString()}`);
      console.log("🧾 ===== INVOICE SYNC COMPLETED ======");

      // Write to debug log
      this.writeYearSyncDebugLog(
        "INFO",
        `Successfully synced ${invoices.length} invoices to database`
      );
    } catch (error) {
      console.error("❌ Error syncing invoices to database:", error);
      console.log("🧾 ===== INVOICE SYNC FAILED ======");
    }
  }
  /**
   * Handle customer query response
   *
   * @param {string} response - Customer query response
   */
  handleCustomerQueryResponse(response) {
    console.log("👥 Processing customer query response");

    // Check if response is empty
    if (!response || response.trim() === "") {
      console.log("⚠️ Empty response received for customer query");
      return;
    }

    // Implement your customer data processing logic here
    // You might want to parse the XML and store in database
    this.syncCustomersToDatabase(response);
  }

  /**
   * Handle invoice query response
   *
   * @param {string} response - Invoice query response
   */
  handleInvoiceQueryResponse(response) {
    console.log("🧾 Processing invoice query response");

    // Check if response is empty
    if (!response || response.trim() === "") {
      console.log("⚠️ Empty response received for invoice query");
      return;
    }

    // Sync invoices to database
    this.syncInvoicesToDatabase(response);
  }

  /**
   * Handle item query response
   *
   * @param {string} response - Item query response
   */
  handleItemQueryResponse(response) {
    console.log("📦 Processing item query response");

    // Check if response is empty
    if (!response || response.trim() === "") {
      console.log("⚠️ Empty response received for item query");
      return;
    }

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
      console.log("💾 Syncing items to database...");

      // Check if response is empty or invalid
      if (!response || response.trim() === "") {
        console.log("⚠️ Empty response received for items sync");
        return;
      }

      // First, parse the XML response to extract items
      const items = this.parseItemXML(response);

      if (!items || items.length === 0) {
        console.log("⚠️ No items found in XML response");
        return;
      }

      console.log(`📊 Found ${items.length} items to process`);

      // Import the Product model
      const db = require("../models");
      const Products = db.products;

      let createdCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;

      // Process each parsed item
      for (const item of items) {
        try {
          console.log(`🔄 Processing item: ${item.name || "Unknown"}`);

          // Validate item data
          if (!item.name) {
            console.log(
              `⚠️ Skipping item with missing name: ${JSON.stringify(item)}`
            );
            skippedCount++;
            continue;
          }

          // Generate fallback ListID if missing
          if (!item.listID || item.listID === "") {
            item.listID = `FALLBACK_${item.name}_${Date.now()}`;
            console.log(
              `⚠️ Generated fallback ListID for item: ${item.name} -> ${item.listID}`
            );
          }

          // Check if item already exists
          const existingItem = await Products.findOne({
            where: { quickbook_list_id: item.listID },
          });

          if (existingItem) {
            // Update existing item
            await existingItem.update({
              name: item.name,
              full_name: item.fullName || item.name,
              description: item.description || "",
              price: item.price || 0.0,
              is_active: item.isActive !== false, // Default to true if not specified
              account_name: item.accountName || "",
              updated_at: new Date(),
            });
            console.log(`✅ Updated existing item: ${item.name}`);
            updatedCount++;
          } else {
            // Create new item
            await Products.create({
              quickbook_list_id: item.listID,
              name: item.name,
              full_name: item.fullName || item.name,
              description: item.description || "",
              price: item.price || 0.0,
              is_active: item.isActive !== false, // Default to true if not specified
              account_name: item.accountName || "",
              created_at: new Date(),
              updated_at: new Date(),
            });
            console.log(`✅ Created new item: ${item.name}`);
            createdCount++;
          }
        } catch (itemError) {
          console.error(
            `❌ Error processing item ${item.name || "Unknown"}:`,
            itemError
          );
          skippedCount++;
        }
      }

      // Log summary
      console.log(
        `📊 Sync Summary: Created=${createdCount}, Updated=${updatedCount}, Skipped=${skippedCount}`
      );
      console.log(`✅ Successfully synced ${items.length} items to database`);

      // Save parsed data to file for debugging
      this.saveParsedDataToFile(items, response);
    } catch (error) {
      console.error("❌ Error syncing items to database:", error);
    }
  }

  /**
   * Extract item data based on item type
   *
   * @param {Object} itemData - Raw item data from XML
   * @param {string} itemType - Type of item (ItemServiceRet, ItemNonInventoryRet, etc.)
   * @returns {Object} Processed item object
   */
  extractItemData(itemData, itemType) {
    try {
      const item = {
        listID: itemData.ListID || "",
        name: itemData.Name || "",
        fullName: itemData.FullName || itemData.Name || "",
        isActive: itemData.IsActive !== "false",
        type: itemType,
        description: "",
        price: 0.0,
        accountName: "",
      };

      // Extract description, price, and account name based on item type
      switch (itemType) {
        case "ItemNonInventoryRet":
          if (itemData.SalesOrPurchase) {
            item.description = itemData.SalesOrPurchase.Desc || "";
            item.price = parseFloat(itemData.SalesOrPurchase.Price || "0.00");
            if (itemData.SalesOrPurchase.AccountRef) {
              item.accountName =
                itemData.SalesOrPurchase.AccountRef.FullName || "";
            }
          }
          break;

        case "ItemServiceRet":
          if (itemData.SalesOrPurchase) {
            item.description = itemData.SalesOrPurchase.Desc || "";
            item.price = parseFloat(itemData.SalesOrPurchase.Price || "0.00");
            if (itemData.SalesOrPurchase.AccountRef) {
              item.accountName =
                itemData.SalesOrPurchase.AccountRef.FullName || "";
            }
          }
          break;

        case "ItemInventoryRet":
          if (itemData.SalesOrPurchase) {
            item.description = itemData.SalesOrPurchase.Desc || "";
            item.price = parseFloat(itemData.SalesOrPurchase.Price || "0.00");
            if (itemData.SalesOrPurchase.AccountRef) {
              item.accountName =
                itemData.SalesOrPurchase.AccountRef.FullName || "";
            }
          }
          break;

        case "ItemOtherChargeRet":
          if (itemData.SalesOrPurchase) {
            item.description = itemData.SalesOrPurchase.Desc || "";
            item.price = parseFloat(itemData.SalesOrPurchase.Price || "0.00");
            if (itemData.SalesOrPurchase.AccountRef) {
              item.accountName =
                itemData.SalesOrPurchase.AccountRef.FullName || "";
            }
          }
          break;

        default:
          // For other item types, try to extract common fields
          if (itemData.SalesOrPurchase) {
            item.description = itemData.SalesOrPurchase.Desc || "";
            item.price = parseFloat(itemData.SalesOrPurchase.Price || "0.00");
            if (itemData.SalesOrPurchase.AccountRef) {
              item.accountName =
                itemData.SalesOrPurchase.AccountRef.FullName || "";
            }
          }
          break;
      }

      // Ensure price is a valid number
      if (isNaN(item.price)) {
        item.price = 0.0;
      }

      console.log(
        `�� Extracted item: ${item.name} (${itemType}) - Price: ${item.price}, Desc: ${item.description}`
      );
      return item;
    } catch (error) {
      console.error(`❌ Error extracting item data for ${itemType}:`, error);
      return {
        listID: "",
        name: "Error Processing Item",
        fullName: "Error Processing Item",
        isActive: false,
        type: itemType,
        description: "",
        price: 0.0,
        accountName: "",
      };
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

      // Navigate to the item response
      const itemResponse = parsed?.QBXML?.QBXMLMsgsRs?.ItemQueryRs;

      if (!itemResponse) {
        console.log("⚠️ No ItemQueryRs found in response");
        return items;
      }

      // Handle different item types
      const itemTypes = [
        "ItemServiceRet",
        "ItemInventoryRet",
        "ItemNonInventoryRet",
        "ItemOtherChargeRet",
        "ItemSubtotalRet",
        "ItemDiscountRet",
        "ItemPaymentRet",
        "ItemSalesTaxRet",
        "ItemSalesTaxGroupRet",
        "ItemGroupRet",
        "ItemInventoryAssemblyRet",
        "ItemFixedAssetRet",
      ];

      // Process each item type
      itemTypes.forEach((itemType) => {
        let itemList = itemResponse[itemType];

        if (itemList) {
          // Handle both single item and multiple items
          const itemsArray = Array.isArray(itemList) ? itemList : [itemList];

          itemsArray.forEach((itemData) => {
            const item = this.extractItemData(itemData, itemType);
            if (item.name) {
              // Only add items with names
              items.push(item);
            }
          });
        }
      });

      console.log(
        `📊 Successfully parsed ${items.length} items from XML response`
      );
      return items;
    } catch (error) {
      console.error("❌ Error parsing item XML:", error);
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
   * Save parsed data to file for debugging and analysis
   */
  saveParsedDataToFile(items, originalXML) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `parsed_data_${this.syncCounter}.json`;
      const filepath = path.join(__dirname, "..", "logs", filename);

      // Ensure logs directory exists
      const logsDir = path.dirname(filepath);
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }

      const parsedData = {
        syncNumber: this.syncCounter,
        timestamp: new Date().toISOString(),
        totalItems: items.length,
        items: items,
        originalXMLLength: originalXML.length,
        parsingSummary: {
          itemsWithListID: items.filter((item) => item.listID).length,
          itemsWithName: items.filter((item) => item.name).length,
          itemsWithDescription: items.filter((item) => item.description).length,
          itemsWithPrice: items.filter((item) => item.price > 0).length,
          itemsWithAccountName: items.filter((item) => item.accountName).length,
        },
      };

      fs.writeFileSync(filepath, JSON.stringify(parsedData, null, 2), "utf8");
      console.log(
        `📁 Parsed data saved to: ${filename} (Sync #${this.syncCounter})`
      );
    } catch (error) {
      console.error("❌ Error saving parsed data to file:", error);
    }
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
   * Write debug log entry for year sync tracking
   * @param {string} level - Log level (INFO, ERROR, WARN)
   * @param {string} message - Log message
   */
  writeYearSyncDebugLog(level, message) {
    try {
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] [${level}] ${message}\n`;
      const logPath = path.join(__dirname, "..", "logs", "year-sync-debug.log");

      // Ensure logs directory exists
      const logsDir = path.dirname(logPath);
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }

      fs.appendFileSync(logPath, logEntry, "utf8");
    } catch (error) {
      console.error("Error writing year sync debug log:", error);
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
   * Store invoice line items in the database
   *
   * @param {Array} lineItems - Array of line item objects
   * @param {number} invoiceId - ID of the invoice
   */
  async storeInvoiceLineItems(
    lineItems,
    invoiceId,
    calROIID = null,
    calcInvoiceId = null,
    productIds = [],
    old_net_cost = 0,
    old_net_products_total = 0,
    old_total_sales = 0,
    old_total_recouped = 0,
    old_net_cost_left = 0
  ) {
    console.log("the calc is ::", calcInvoiceId);
    console.log("passed product ids are:::", productIds);
    try {
      console.log(
        `📋 Storing ${lineItems.length} line items for invoice ID: ${invoiceId}`
      );

      // Import the InvoiceLineItem model
      const db = require("../models");
      const InvoiceLineItems = db.invoice_line_items;

      let amount = 0; // Move amount outside the loop to accumulate across all line items

      // Store each line item
      for (const lineItem of lineItems) {
        try {
          // Check if line item already exists
          const existingLineItem = await InvoiceLineItems.findOne({
            where: {
              invoice_id: invoiceId,
              line_number: lineItem.lineNumber,
            },
          });

          // Find the product by QuickBooks ListID
          const product = await db.products.findOne({
            where: { quickbook_list_id: lineItem.itemListID },
          });

          if (!product) {
            console.log(
              `  ⚠️ Product not found for ListID: ${lineItem.itemListID}, skipping line item`
            );
            continue;
          }

          const lineItemData = {
            invoice_id: invoiceId,
            line_number: lineItem.lineNumber,
            product_id: product.id,
            quantity: lineItem.quantity,
            unit_price: lineItem.unitPrice,
            amount: lineItem.amount,
          };

          if (existingLineItem) {
            // Update existing line item
            await existingLineItem.update(lineItemData);
            console.log(
              `  ✅ Updated line item ${lineItem.lineNumber}: ${lineItem.itemName}`
            );
            if (calcInvoiceId) {
              if (productIds.includes(product.id)) {
                amount = amount + lineItem.amount;

                // commenting below logic which create products in the calc_invoice_line_items table
                // await db.calc_invoice_line_items.create({
                //   calc_invoice_id: calcInvoiceId,
                //   line_item_id: existingLineItem.id,
                //   quantity: lineItem.quantity,
                //   price: lineItem.unitPrice,
                //   total_price: lineItem.amount,
                //   product_condition: "new",
                //   sale_type: "sold",
                // });
              }
            }
          } else {
            // Create new line item
            const newLineItem = await InvoiceLineItems.create(lineItemData);
            console.log(
              `  ✅ Created line item ${lineItem.lineNumber}: ${lineItem.itemName}`
            );
            if (calcInvoiceId) {
              if (productIds.includes(product.id)) {
                amount = amount + lineItem.amount;

                // commenting below logic which create products in the calc_invoice_line_items table
                // await db.calc_invoice_line_items.create({
                //   calc_invoice_id: calcInvoiceId,
                //   line_item_id: newLineItem.id,
                //   quantity: lineItem.quantity,
                //   price: lineItem.unitPrice,
                //   total_price: lineItem.amount,
                //   product_condition: "new",
                //   sale_type: "sold",
                // });
              }
            }
          }
        } catch (lineItemError) {
          console.error(
            `  ❌ Error processing line item ${lineItem.lineNumber}:`,
            lineItemError
          );
        }
      }

      if (calcInvoiceId) {
        // current recouped amount is
        const current_recouped = amount / 4;

        // calculation to store in the DB
        const net_products_total = +old_net_products_total + amount;
        const total_sales = +old_total_sales + amount;
        const total_recouped = +old_total_recouped + current_recouped;
        const net_cost_left = +old_net_cost - total_recouped;

        // Update calc_roi table
        await db.calc_roi.update(
          {
            net_products_total: net_products_total,
            total_sales: total_sales,
            total_recouped: total_recouped,
            net_cost_left: net_cost_left,
          },
          {
            where: { id: calROIID },
          }
        );
      }

      console.log(
        `✅ Successfully processed ${lineItems.length} line items for invoice ID: ${invoiceId}`
      );
    } catch (error) {
      console.error(`❌ Error storing invoice line items:`, error);
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
