const {
  invoices: Invoices,
  customers: Customers,
  calc_roi: CalcRoi,
  calc_invoices: CalcInvoices,
  calc_invoice_line_items: CalcInvoiceLineItems,
  logs_calc_roi: LogsCalcRoi,
  alerts: Alerts,
  settings: Settings,
  products: Products,
  invoice_line_items: InvoiceLineItems,
} = require("../models");
const Sequelize = require("sequelize");
const { sendSuccessRespose, sendErrorResponse } = require("../utils/response");

exports.getCustomerROIReports = async (req, res) => {
  try {
    const { year, customer_id, page = 1, limit = 10 } = req.query;

    // Build where conditions for raw query
    let whereConditions = [];
    let replacements = {};

    // Year filter
    if (year) {
      whereConditions.push("YEAR(logs_calc_roi.created_at) = :year");
      replacements.year = parseInt(year);
    }

    // Customer filter
    if (customer_id) {
      whereConditions.push("logs_calc_roi.calc_roi_id IN (SELECT id FROM calc_roi WHERE customer_id = :customer_id)");
      replacements.customer_id = parseInt(customer_id);
    }

    const whereSql = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

    // Calculate offset for pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitValue = parseInt(limit);

    // Get customer sales data using raw query
    const customerSalesData = await LogsCalcRoi.sequelize.query(
      `SELECT 
        logs_calc_roi.calc_roi_id,
        SUM(logs_calc_roi.total_sales) as total_sales,
        SUM(logs_calc_roi.total_recouped) as total_recouped,
        SUM(logs_calc_roi.total_months) as total_months,
        SUM(logs_calc_roi.sales_not_met) as sales_not_met,
        COUNT(logs_calc_roi.id) as calculation_count
      FROM logs_calc_roi
      ${whereSql}
      GROUP BY logs_calc_roi.calc_roi_id
      ORDER BY SUM(logs_calc_roi.total_sales) DESC
      LIMIT :limitValue OFFSET :offset`,
      {
        type: Sequelize.QueryTypes.SELECT,
        replacements: { ...replacements, limitValue, offset }
      }
    );

    // Get customer data separately for each calc_roi_id
    const calcRoiIds = customerSalesData.map((item) => item.calc_roi_id);
    
    let calcRoiData = [];
    if (calcRoiIds.length > 0) {
      calcRoiData = await CalcRoi.findAll({
        where: {
          id: {
            [Sequelize.Op.in]: calcRoiIds,
          },
        },
        include: [
          {
            model: Customers,
            as: "customer",
            attributes: ["id", "first_name", "last_name", "company_name"],
          },
        ],
      });
    }

    // Create a map for quick lookup
    const calcRoiMap = {};
    calcRoiData.forEach((roi) => {
      calcRoiMap[roi.id] = roi;
    });

    // Get total count for pagination using raw query
    const totalCountResult = await LogsCalcRoi.sequelize.query(
      `SELECT COUNT(DISTINCT logs_calc_roi.calc_roi_id) as total
      FROM logs_calc_roi
      ${whereSql}`,
      {
        type: Sequelize.QueryTypes.SELECT,
        replacements: replacements
      }
    );

    const totalCount = totalCountResult[0]?.total || 0;

    // Format the response data - raw query returns plain objects
    const formattedData = customerSalesData.map((item) => {
      const calcRoi = calcRoiMap[item.calc_roi_id];
      const customer = calcRoi?.customer;

      return {
        customer_id: customer?.id || null,
        name: customer
          ? `${customer.first_name} ${customer.last_name}`
          : "Unknown",
        company_name: customer?.company_name || "",
        total_sales: parseFloat(item.total_sales || 0),
        recouped: parseFloat(item.total_recouped || 0),
        total_months: parseInt(item.total_months || 0),
        not_met: parseInt(item.sales_not_met || 0),
        calculation_count: parseInt(item.calculation_count || 0),
      };
    });

    const response = {
      data: formattedData,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total_records: totalCount,
        total_pages: Math.ceil(totalCount / parseInt(limit)),
      },
      filters: {
        year: year || null,
        customer_id: customer_id || null,
        // start_date: start_date || null,
        // end_date: end_date || null,
      },
    };

    return sendSuccessRespose(
      res,
      response,
      "Customers total sales analytics retrieved successfully",
      200
    );
  } catch (error) {
    console.log("getCustomerROIReports the error is here:::", error);
    return sendErrorResponse(res, error);
  }
};

// Get ROI by Product/Equipment reports
exports.getROIByProductEquipmentReports = async (req, res) => {
  try {
    const { year, customer_id, page = 1, limit = 10 } = req.query;

    // Build where conditions for raw query
    let whereConditions = [];
    let replacements = {};

    // Year filter
    if (year) {
      whereConditions.push("YEAR(invoice_line_items.created_at) = :year");
      replacements.year = parseInt(year);
    }

    // Customer filter
    if (customer_id) {
      whereConditions.push("invoices.customer_id = :customer_id");
      replacements.customer_id = parseInt(customer_id);
    }

    const whereSql = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

    // Calculate offset for pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitValue = parseInt(limit);

    // Get ROI data grouped by product/equipment using raw query
    const roiData = await InvoiceLineItems.sequelize.query(
      `SELECT 
        invoice_line_items.product_id,
        products.id as product_id,
        products.name as product_name,
        products.full_name as product_full_name,
        SUM(invoice_line_items.amount) as total_lease_cost,
        COUNT(invoice_line_items.id) as number_of_invoices,
        SUM(invoice_line_items.amount) as total_sales_profit
      FROM invoice_line_items
      INNER JOIN products ON invoice_line_items.product_id = products.id
      INNER JOIN invoices ON invoice_line_items.invoice_id = invoices.id
      ${whereSql}
      GROUP BY invoice_line_items.product_id, products.id, products.name, products.full_name
      ORDER BY SUM(invoice_line_items.amount) DESC
      LIMIT :limitValue OFFSET :offset`,
      {
        type: Sequelize.QueryTypes.SELECT,
        replacements: { ...replacements, limitValue, offset }
      }
    );

    // Format the response data
    const formattedData = roiData.map((item) => {
      const totalLeaseCost = parseFloat(item.total_lease_cost || 0);
      const totalSalesProfit = parseFloat(item.total_sales_profit || 0);
      const netROI = totalSalesProfit - totalLeaseCost;
      const roiPercentage =
        totalLeaseCost > 0 ? (netROI / totalLeaseCost) * 100 : 0;
      const numberOfInvoices = parseInt(item.number_of_invoices || 0);

      return {
        product_id: item.product_id || null,
        product_name: item.product_name || item.product_full_name || "Unknown Product",
        lease_cost: totalLeaseCost,
        sales_profit: totalSalesProfit,
        net_roi: netROI,
        roi_percent: parseFloat(roiPercentage.toFixed(2)),
        invoices_count: numberOfInvoices,
      };
    });

    // Get total count for pagination using raw query
    const totalCountResult = await InvoiceLineItems.sequelize.query(
      `SELECT COUNT(DISTINCT invoice_line_items.product_id) as total
      FROM invoice_line_items
      INNER JOIN invoices ON invoice_line_items.invoice_id = invoices.id
      ${whereSql}`,
      {
        type: Sequelize.QueryTypes.SELECT,
        replacements: replacements
      }
    );

    const totalCount = totalCountResult[0]?.total || 0;

    const response = {
      data: formattedData,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total_records: totalCount,
        total_pages: Math.ceil(totalCount / parseInt(limit)),
      },
      filters: {
        year: year || new Date().getFullYear(),
        customer_id: customer_id || null,
      },
    };

    return sendSuccessRespose(
      res,
      response,
      "ROI by Product/Equipment reports retrieved successfully",
      200
    );
  } catch (error) {
    console.error("Get ROI by Product/Equipment reports error:", error);
    return sendErrorResponse(
      res,
      "Failed to get ROI by Product/Equipment reports",
      500
    );
  }
};

// Get top products with drop-offs reports
exports.getTopProductsWithDropoffsReports = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;

    // Calculate offset for pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitValue = parseInt(limit);

    // Build where conditions for raw query
    let whereConditions = [];
    let replacements = {};

    // Search filter
    if (search) {
      whereConditions.push("(products.name LIKE :search OR products.full_name LIKE :search)");
      replacements.search = `%${search}%`;
    }

    const whereSql = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

    // Get product purchase data grouped by product using raw query
    const productData = await CalcInvoiceLineItems.sequelize.query(
      `SELECT 
        invoice_line_items.product_id,
        MIN(calc_invoice_line_items.created_at) as first_purchase_date,
        MAX(calc_invoice_line_items.created_at) as last_purchase_date,
        COUNT(calc_invoice_line_items.id) as total_purchases,
        products.id as product_id,
        products.name as product_name,
        products.full_name as product_full_name
      FROM calc_invoice_line_items
      INNER JOIN invoice_line_items ON calc_invoice_line_items.line_item_id = invoice_line_items.id
      INNER JOIN products ON invoice_line_items.product_id = products.id
      ${whereSql}
      GROUP BY invoice_line_items.product_id, products.id, products.name, products.full_name
      ORDER BY COUNT(calc_invoice_line_items.id) DESC
      LIMIT :limitValue OFFSET :offset`,
      {
        type: Sequelize.QueryTypes.SELECT,
        replacements: { ...replacements, limitValue, offset }
      }
    );

    // Calculate drop-off percentage for each product
    const formattedData = await Promise.all(
      productData.map(async (item) => {
        // Get product data
        const productId = item.product_id;
        const productName = item.product_name;
        const productFullName = item.product_full_name;
        const firstPurchaseDate = new Date(item.first_purchase_date);
        const lastPurchaseDate = new Date(item.last_purchase_date);
        const totalPurchases = parseInt(item.total_purchases || 0);

        // Step 1: Calculate Months Active
        const monthsActive =
          (lastPurchaseDate.getFullYear() - firstPurchaseDate.getFullYear()) *
            12 +
          (lastPurchaseDate.getMonth() - firstPurchaseDate.getMonth()) +
          1;

        // Step 2: Calculate Expected Purchases per Month
        const expectedPurchasesPerMonth = totalPurchases / monthsActive;

        // Step 3: Get Last Month's Purchases
        const lastMonthStart = new Date(
          lastPurchaseDate.getFullYear(),
          lastPurchaseDate.getMonth(),
          1
        );
        const lastMonthEnd = new Date(
          lastPurchaseDate.getFullYear(),
          lastPurchaseDate.getMonth() + 1,
          0,
          23,
          59,
          59
        );

        // Get last month purchases using raw query
        const lastMonthPurchasesResult = await CalcInvoiceLineItems.sequelize.query(
          `SELECT COUNT(calc_invoice_line_items.id) as count
          FROM calc_invoice_line_items
          INNER JOIN invoice_line_items ON calc_invoice_line_items.line_item_id = invoice_line_items.id
          WHERE invoice_line_items.product_id = :product_id
          AND calc_invoice_line_items.created_at BETWEEN :lastMonthStart AND :lastMonthEnd`,
          {
            type: Sequelize.QueryTypes.SELECT,
            replacements: {
              product_id: productId,
              lastMonthStart: lastMonthStart,
              lastMonthEnd: lastMonthEnd
            }
          }
        );

        const lastMonthPurchases = parseInt(lastMonthPurchasesResult[0]?.count || 0);

        // Step 4: Calculate Drop-off Percentage
        const dropOffPercentage =
          expectedPurchasesPerMonth > 0
            ? ((expectedPurchasesPerMonth - lastMonthPurchases) /
                expectedPurchasesPerMonth) *
              100
            : 0;
        return {
          product_id: productId || null,
          product_name: productName || productFullName || "Unknown Product",
          first_purchase_date: firstPurchaseDate.toISOString().split("T")[0],
          last_purchase_date: lastPurchaseDate.toISOString().split("T")[0],
          total_purchases: totalPurchases,
          dropoff_rate: Math.max(0, parseFloat(dropOffPercentage.toFixed(1))), // Ensure non-negative
          months_active: monthsActive,
          expected_purchases_per_month: parseFloat(
            expectedPurchasesPerMonth.toFixed(2)
          ),
          last_month_purchases: lastMonthPurchases,
        };
      })
    );

    // Get total count for pagination using raw query
    const totalCountResult = await CalcInvoiceLineItems.sequelize.query(
      `SELECT COUNT(DISTINCT invoice_line_items.product_id) as count
      FROM calc_invoice_line_items
      INNER JOIN invoice_line_items ON calc_invoice_line_items.line_item_id = invoice_line_items.id
      INNER JOIN products ON invoice_line_items.product_id = products.id
      ${whereSql}`,
      {
        type: Sequelize.QueryTypes.SELECT,
        replacements: replacements
      }
    );

    const totalCount = parseInt(totalCountResult[0]?.count || 0);

    const response = {
      data: formattedData,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total_records: totalCount,
        total_pages: Math.ceil(totalCount / parseInt(limit)),
      },
      filters: {
        search: search || null,
      },
    };

    return sendSuccessRespose(
      res,
      response,
      "Top products with drop-offs reports retrieved successfully",
      200
    );
  } catch (error) {
    console.error("Get top products with drop-offs reports error:", error);
    return sendErrorResponse(
      res,
      "Failed to get top products with drop-offs reports",
      500
    );
  }
};

// Get customer drop-off by product reports
exports.getCustomerDropoffByProductReports = async (req, res) => {
  try {
    const {
      product_name,
      customer_name,
      page = 1,
      limit = 10,
      sort_by = "days_since_last_purchase",
      sort_order = "DESC",
    } = req.query;

    // Build where conditions for raw query
    let whereConditions = [];
    let replacements = {};

    // Product name filter
    if (product_name) {
      whereConditions.push("(products.name LIKE :product_name OR products.full_name LIKE :product_name)");
      replacements.product_name = `%${product_name}%`;
    }

    // Customer name filter
    if (customer_name) {
      whereConditions.push("(customers.first_name LIKE :customer_name OR customers.last_name LIKE :customer_name OR customers.company_name LIKE :customer_name)");
      replacements.customer_name = `%${customer_name}%`;
    }

    const whereSql = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

    // Build ORDER BY clause
    let orderByClause = "MAX(calc_invoice_line_items.created_at) DESC";
    if (sort_by === "product_name") {
      orderByClause = "products.name " + (sort_order.toUpperCase() === "ASC" ? "ASC" : "DESC");
    } else if (sort_by === "customer_name") {
      orderByClause = "customers.first_name " + (sort_order.toUpperCase() === "ASC" ? "ASC" : "DESC");
    } else if (sort_by === "days_since_last_purchase") {
      orderByClause = "MAX(calc_invoice_line_items.created_at) " + (sort_order.toUpperCase() === "ASC" ? "ASC" : "DESC");
    }

    // Calculate offset for pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitValue = parseInt(limit);

    // Get customer drop-off data grouped by product and customer using raw query
    const dropoffData = await CalcInvoiceLineItems.sequelize.query(
      `SELECT 
        invoice_line_items.product_id,
        calc_roi.customer_id,
        MIN(calc_invoice_line_items.created_at) as first_purchase_date,
        MAX(calc_invoice_line_items.created_at) as last_purchase_date,
        COUNT(calc_invoice_line_items.id) as total_purchases,
        products.id as product_id,
        products.name as product_name,
        products.full_name as product_full_name,
        customers.id as customer_id,
        customers.first_name as customer_first_name,
        customers.last_name as customer_last_name,
        customers.company_name as customer_company_name
      FROM calc_invoice_line_items
      INNER JOIN invoice_line_items ON calc_invoice_line_items.line_item_id = invoice_line_items.id
      INNER JOIN products ON invoice_line_items.product_id = products.id
      INNER JOIN calc_invoices ON calc_invoice_line_items.calc_invoice_id = calc_invoices.id
      INNER JOIN calc_roi ON calc_invoices.roi_id = calc_roi.id
      INNER JOIN customers ON calc_roi.customer_id = customers.id
      ${whereSql}
      GROUP BY invoice_line_items.product_id, calc_roi.customer_id, products.id, products.name, products.full_name, customers.id, customers.first_name, customers.last_name, customers.company_name
      ORDER BY ${orderByClause}
      LIMIT :limitValue OFFSET :offset`,
      {
        type: Sequelize.QueryTypes.SELECT,
        replacements: { ...replacements, limitValue, offset }
      }
    );

    // Calculate days since last purchase and format data
    const formattedData = dropoffData.map((item) => {
      const firstPurchaseDate = new Date(item.first_purchase_date);
      const lastPurchaseDate = new Date(item.last_purchase_date);
      const totalPurchases = parseInt(item.total_purchases || 0);

      // Calculate days since last purchase
      const currentDate = new Date();
      const daysSinceLastPurchase = Math.floor(
        (currentDate - lastPurchaseDate) / (1000 * 60 * 60 * 24)
      );

      const customerName = item.customer_first_name && item.customer_last_name
        ? `${item.customer_first_name} ${item.customer_last_name}`.trim()
        : item.customer_company_name || "Unknown Customer";

      return {
        product_id: item.product_id || null,
        product_name: item.product_name || item.product_full_name || "Unknown Product",
        customer_id: item.customer_id || null,
        customer_name: customerName,
        first_purchase_date: firstPurchaseDate.toISOString().split("T")[0],
        last_purchase_date: lastPurchaseDate.toISOString().split("T")[0],
        total_purchases: totalPurchases,
        days_since_last_purchase: daysSinceLastPurchase,
      };
    });

    // Get total count for pagination using raw query
    const totalCountResult = await CalcInvoiceLineItems.sequelize.query(
      `SELECT COUNT(DISTINCT CONCAT(invoice_line_items.product_id, '-', calc_roi.customer_id)) as total
      FROM calc_invoice_line_items
      INNER JOIN invoice_line_items ON calc_invoice_line_items.line_item_id = invoice_line_items.id
      INNER JOIN products ON invoice_line_items.product_id = products.id
      INNER JOIN calc_invoices ON calc_invoice_line_items.calc_invoice_id = calc_invoices.id
      INNER JOIN calc_roi ON calc_invoices.roi_id = calc_roi.id
      INNER JOIN customers ON calc_roi.customer_id = customers.id
      ${whereSql}`,
      {
        type: Sequelize.QueryTypes.SELECT,
        replacements: replacements
      }
    );

    const totalCount = totalCountResult[0]?.total || 0;

    const response = {
      data: formattedData,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total_records: totalCount,
        total_pages: Math.ceil(totalCount / parseInt(limit)),
      },
      filters: {
        product_name: product_name || null,
        customer_name: customer_name || null,
        sort_by: sort_by || "days_since_last_purchase",
        sort_order: sort_order || "DESC",
      },
    };

    return sendSuccessRespose(
      res,
      response,
      "Customer drop-off by product reports retrieved successfully",
      200
    );
  } catch (error) {
    console.error("Get customer drop-off by product reports error:", error);
    return sendErrorResponse(
      res,
      "Failed to get customer drop-off by product reports",
      500
    );
  }
};

// Get product lifecycle reports
exports.getProductLifecycleReports = async (req, res) => {
  try {
    const {
      customer_id,
      page = 1,
      limit = 10,
      sort_by = "total_customers",
      sort_order = "DESC",
    } = req.query;

    // Calculate offset for pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Get customer_inactive setting value
    const settings = await Settings.findOne();
    const customerInactiveDays = settings?.customer_inactive || 90; // Default to 90 days if not set

    // Build where conditions for raw query
    let whereConditions = [];
    let replacements = {};

    // Customer filter
    if (customer_id) {
      whereConditions.push("calc_roi.customer_id = :customer_id");
      replacements.customer_id = parseInt(customer_id);
    }

    const whereSql = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

    // Build ORDER BY clause
    let orderByClause = "COUNT(DISTINCT calc_roi.customer_id) DESC";
    if (sort_by === "product_name") {
      orderByClause = "products.name " + (sort_order.toUpperCase() === "ASC" ? "ASC" : "DESC");
    } else if (sort_by === "total_customers") {
      orderByClause = "COUNT(DISTINCT calc_roi.customer_id) " + (sort_order.toUpperCase() === "ASC" ? "ASC" : "DESC");
    }

    const limitValue = parseInt(limit);

    // Get product lifecycle data grouped by product using raw query
    const lifecycleData = await CalcInvoiceLineItems.sequelize.query(
      `SELECT 
        invoice_line_items.product_id,
        products.id as product_id,
        products.name as product_name,
        products.full_name as product_full_name,
        COUNT(DISTINCT calc_roi.customer_id) as total_customers,
        MIN(calc_invoice_line_items.created_at) as first_purchase_date,
        MAX(calc_invoice_line_items.created_at) as last_purchase_date
      FROM calc_invoice_line_items
      INNER JOIN invoice_line_items ON calc_invoice_line_items.line_item_id = invoice_line_items.id
      INNER JOIN products ON invoice_line_items.product_id = products.id
      INNER JOIN calc_invoices ON calc_invoice_line_items.calc_invoice_id = calc_invoices.id
      INNER JOIN calc_roi ON calc_invoices.roi_id = calc_roi.id
      ${whereSql}
      GROUP BY invoice_line_items.product_id, products.id, products.name, products.full_name
      ORDER BY ${orderByClause}
      LIMIT :limitValue OFFSET :offset`,
      {
        type: Sequelize.QueryTypes.SELECT,
        replacements: { ...replacements, limitValue, offset }
      }
    );

    // Calculate active and lapsed customers for each product
    const formattedData = await Promise.all(
      lifecycleData.map(async (item) => {
        const productId = item.product_id;
        const totalCustomers = parseInt(item.total_customers || 0);

        // Get all customers who purchased this product using raw query
        const customerData = await CalcInvoiceLineItems.sequelize.query(
          `SELECT 
            calc_roi.customer_id,
            MAX(calc_invoice_line_items.created_at) as last_purchase_date
          FROM calc_invoice_line_items
          INNER JOIN invoice_line_items ON calc_invoice_line_items.line_item_id = invoice_line_items.id
          INNER JOIN calc_invoices ON calc_invoice_line_items.calc_invoice_id = calc_invoices.id
          INNER JOIN calc_roi ON calc_invoices.roi_id = calc_roi.id
          WHERE invoice_line_items.product_id = :productId
          ${customer_id ? "AND calc_roi.customer_id = :customer_id" : ""}
          GROUP BY calc_roi.customer_id`,
          {
            type: Sequelize.QueryTypes.SELECT,
            replacements: { productId, ...(customer_id ? { customer_id: parseInt(customer_id) } : {}) }
          }
        );

        // Calculate active and lapsed customers
        const currentDate = new Date();
        let activeCustomers = 0;
        let lapsedCustomers = 0;

        customerData.forEach((customer) => {
          const lastPurchaseDate = new Date(customer.last_purchase_date);
          const daysSinceLastPurchase = Math.floor(
            (currentDate - lastPurchaseDate) / (1000 * 60 * 60 * 24)
          );

          if (daysSinceLastPurchase <= customerInactiveDays) {
            activeCustomers++;
          } else {
            lapsedCustomers++;
          }
        });

        return {
          product_id: productId,
          product_name: item.product_name || item.product_full_name || "Unknown Product",
          total_customers_purchased: totalCustomers,
          active_customers: activeCustomers,
          lapsed_customers: lapsedCustomers,
        };
      })
    );

    // Get total count for pagination using raw query
    const totalCountResult = await CalcInvoiceLineItems.sequelize.query(
      `SELECT COUNT(DISTINCT invoice_line_items.product_id) as total
      FROM calc_invoice_line_items
      INNER JOIN invoice_line_items ON calc_invoice_line_items.line_item_id = invoice_line_items.id
      INNER JOIN calc_invoices ON calc_invoice_line_items.calc_invoice_id = calc_invoices.id
      INNER JOIN calc_roi ON calc_invoices.roi_id = calc_roi.id
      ${whereSql}`,
      {
        type: Sequelize.QueryTypes.SELECT,
        replacements: replacements
      }
    );

    const totalCount = totalCountResult[0]?.total || 0;

    const response = {
      data: formattedData,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total_records: totalCount,
        total_pages: Math.ceil(totalCount / parseInt(limit)),
      },
      filters: {
        customer_id: customer_id || null,
        sort_by: sort_by || "total_customers",
        sort_order: sort_order || "DESC",
        customer_inactive_days: customerInactiveDays,
      },
    };

    return sendSuccessRespose(
      res,
      response,
      "Product lifecycle reports retrieved successfully",
      200
    );
  } catch (error) {
    console.error("Get product lifecycle reports error:", error);
    return sendErrorResponse(
      res,
      "Failed to get product lifecycle reports",
      500
    );
  }
};

// Get underperforming customers reports
exports.getUnderperformingCustomersReports = async (req, res) => {
  try {
    const {
      year = new Date().getFullYear(),
      page = 1,
      limit = 10,
      sort_by = "sales_gap",
      sort_order = "DESC",
    } = req.query;

    // Calculate offset for pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitValue = parseInt(limit);

    // Build where conditions for raw query
    let whereConditions = [];
    let replacements = {};

    // Year filter
    if (year) {
      whereConditions.push("YEAR(logs_calc_roi.created_at) = :year");
      replacements.year = parseInt(year);
    }

    const whereSql = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

    // Determine order by clause
    let orderByClause = "total_minimum_sales_required DESC";
    if (sort_by === "sales_gap") {
      // We'll sort by sales_gap after calculating it
      orderByClause = "total_minimum_sales_required " + (sort_order.toUpperCase() === "ASC" ? "ASC" : "DESC");
    } else {
      orderByClause = "total_minimum_sales_required " + (sort_order.toUpperCase() === "ASC" ? "ASC" : "DESC");
    }

    // Get underperforming customers data from logs_calc_roi using raw query
    const underperformingData = await LogsCalcRoi.sequelize.query(
      `SELECT 
        logs_calc_roi.calc_roi_id,
        SUM(logs_calc_roi.monthly_sales_required) as total_minimum_sales_required,
        SUM(logs_calc_roi.total_sales) as total_actual_sales,
        COUNT(logs_calc_roi.id) as calculation_count,
        calc_roi.customer_id,
        customers.id as customer_id,
        customers.first_name,
        customers.last_name,
        customers.company_name
      FROM logs_calc_roi
      INNER JOIN calc_roi ON logs_calc_roi.calc_roi_id = calc_roi.id
      INNER JOIN customers ON calc_roi.customer_id = customers.id
      ${whereSql}
      GROUP BY logs_calc_roi.calc_roi_id, calc_roi.customer_id, customers.id, customers.first_name, customers.last_name, customers.company_name
      ORDER BY ${orderByClause}
      LIMIT :limitValue OFFSET :offset`,
      {
        type: Sequelize.QueryTypes.SELECT,
        replacements: { ...replacements, limitValue, offset }
      }
    );

    // Calculate sales gap and format data
    const formattedData = underperformingData.map((item) => {
      const totalMinimumSalesRequired = parseFloat(
        item.total_minimum_sales_required || 0
      );
      const totalActualSales = parseFloat(
        item.total_actual_sales || 0
      );
      const salesGap = Math.max(
        0,
        totalMinimumSalesRequired - totalActualSales
      );
      const status = salesGap > 0 ? "Not Met" : "Met";
      const calculationCount = parseInt(item.calculation_count || 0);

      const customerName = item.first_name && item.last_name
        ? `${item.first_name} ${item.last_name}`.trim()
        : item.company_name || "Unknown Customer";

      return {
        customer_id: item.customer_id || null,
        customer_name: customerName,
        minimum_sales_required: totalMinimumSalesRequired,
        actual_sales: totalActualSales,
        sales_gap: salesGap,
        status: status,
        calculation_count: calculationCount,
      };
    });

    // Sort by sales gap if that's the sort criteria
    if (sort_by === "sales_gap") {
      formattedData.sort((a, b) => {
        return sort_order.toUpperCase() === "DESC"
          ? b.sales_gap - a.sales_gap
          : a.sales_gap - b.sales_gap;
      });
    }

    // Get total count for pagination using raw query
    const totalCountResult = await LogsCalcRoi.sequelize.query(
      `SELECT COUNT(DISTINCT logs_calc_roi.calc_roi_id) as count
      FROM logs_calc_roi
      ${whereSql}`,
      {
        type: Sequelize.QueryTypes.SELECT,
        replacements: replacements
      }
    );

    const totalCount = parseInt(totalCountResult[0]?.count || 0);

    const response = {
      data: formattedData,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total_records: totalCount,
        total_pages: Math.ceil(totalCount / parseInt(limit)),
      },
      filters: {
        year: year || new Date().getFullYear(),
        sort_by: sort_by || "sales_gap",
        sort_order: sort_order || "DESC",
      },
    };

    return sendSuccessRespose(
      res,
      response,
      "Underperforming customers reports retrieved successfully",
      200
    );
  } catch (error) {
    console.error("Get underperforming customers reports error:", error);
    return sendErrorResponse(
      res,
      "Failed to get underperforming customers reports",
      500
    );
  }
};

// Get outstanding performance customers reports
exports.getOutstandingPerformanceCustomersReports = async (req, res) => {
  try {
    const {
      year = new Date().getFullYear(),
      page = 1,
      limit = 10,
      sort_by = "performance_percentage",
      sort_order = "DESC",
    } = req.query;

    // Calculate offset for pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitValue = parseInt(limit);

    // Build where conditions for raw query
    let whereConditions = [];
    let replacements = {};

    // Year filter
    if (year) {
      whereConditions.push("YEAR(logs_calc_roi.created_at) = :year");
      replacements.year = parseInt(year);
    }

    const whereSql = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

    // Determine order by clause
    let orderByClause = "total_actual_sales DESC";
    if (sort_by === "performance_percentage") {
      // We'll sort by performance_percentage after calculating it
      orderByClause = "total_actual_sales " + (sort_order.toUpperCase() === "ASC" ? "ASC" : "DESC");
    } else {
      orderByClause = "total_actual_sales " + (sort_order.toUpperCase() === "ASC" ? "ASC" : "DESC");
    }

    // Get outstanding performance customers data from logs_calc_roi using raw query
    const outstandingData = await LogsCalcRoi.sequelize.query(
      `SELECT 
        logs_calc_roi.calc_roi_id,
        SUM(logs_calc_roi.monthly_sales_required) as total_target_sales,
        SUM(logs_calc_roi.total_sales) as total_actual_sales,
        COUNT(logs_calc_roi.id) as calculation_count,
        calc_roi.customer_id,
        customers.id as customer_id,
        customers.first_name,
        customers.last_name,
        customers.company_name
      FROM logs_calc_roi
      INNER JOIN calc_roi ON logs_calc_roi.calc_roi_id = calc_roi.id
      INNER JOIN customers ON calc_roi.customer_id = customers.id
      ${whereSql}
      GROUP BY logs_calc_roi.calc_roi_id, calc_roi.customer_id, customers.id, customers.first_name, customers.last_name, customers.company_name
      ORDER BY ${orderByClause}
      LIMIT :limitValue OFFSET :offset`,
      {
        type: Sequelize.QueryTypes.SELECT,
        replacements: { ...replacements, limitValue, offset }
      }
    );

    // Calculate performance metrics and format data
    const formattedData = outstandingData
      .map((item) => {
        const totalTargetSales = parseFloat(
          item.total_target_sales || 0
        );
        const totalActualSales = parseFloat(
          item.total_actual_sales || 0
        );
        const calculationCount = parseInt(
          item.calculation_count || 0
        );

        // Calculate performance metrics
        const performancePercentage =
          totalTargetSales > 0
            ? (totalActualSales / totalTargetSales) * 100
            : 0;
        const overachievement = Math.max(
          0,
          totalActualSales - totalTargetSales
        );

        const customerName = item.first_name && item.last_name
          ? `${item.first_name} ${item.last_name}`.trim()
          : item.company_name || "Unknown Customer";

        return {
          customer_id: item.customer_id || null,
          customer_name: customerName,
          target_sales: totalTargetSales,
          actual_sales: totalActualSales,
          performance_percentage: parseFloat(performancePercentage.toFixed(1)),
          overachievement: overachievement,
          calculation_count: calculationCount,
        };
      })
      .filter((item) => item.actual_sales > item.target_sales); // Only include customers who exceeded targets

    // Sort by performance percentage if that's the sort criteria
    if (sort_by === "performance_percentage") {
      formattedData.sort((a, b) => {
        return sort_order.toUpperCase() === "DESC"
          ? b.performance_percentage - a.performance_percentage
          : a.performance_percentage - b.performance_percentage;
      });
    } else if (sort_by === "overachievement") {
      formattedData.sort((a, b) => {
        return sort_order.toUpperCase() === "DESC"
          ? b.overachievement - a.overachievement
          : a.overachievement - b.overachievement;
      });
    }

    // Get total count for pagination (only count customers who exceeded targets) using raw query
    const allOutstandingData = await LogsCalcRoi.sequelize.query(
      `SELECT 
        logs_calc_roi.calc_roi_id,
        SUM(logs_calc_roi.monthly_sales_required) as total_target_sales,
        SUM(logs_calc_roi.total_sales) as total_actual_sales
      FROM logs_calc_roi
      ${whereSql}
      GROUP BY logs_calc_roi.calc_roi_id`,
      {
        type: Sequelize.QueryTypes.SELECT,
        replacements: replacements
      }
    );

    // Filter to only include customers who exceeded targets
    const outstandingCustomers = allOutstandingData.filter((item) => {
      const totalTargetSales = parseFloat(item.total_target_sales || 0);
      const totalActualSales = parseFloat(item.total_actual_sales || 0);
      return totalActualSales > totalTargetSales;
    });

    const totalCount = outstandingCustomers.length;

    const response = {
      data: formattedData,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total_records: totalCount,
        total_pages: Math.ceil(totalCount / parseInt(limit)),
      },
      filters: {
        year: year || new Date().getFullYear(),
        sort_by: sort_by || "performance_percentage",
        sort_order: sort_order || "DESC",
      },
    };

    return sendSuccessRespose(
      res,
      response,
      "Outstanding performance customers reports retrieved successfully",
      200
    );
  } catch (error) {
    console.error(
      "Get outstanding performance customers reports error:",
      error
    );
    return sendErrorResponse(
      res,
      "Failed to get outstanding performance customers reports",
      500
    );
  }
};
