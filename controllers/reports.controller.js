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

    let whereClause = {};

    // Year filter
    if (year) {
      whereClause[Sequelize.Op.and] = [
        Sequelize.where(
          Sequelize.fn("YEAR", Sequelize.col("created_at")),
          year
        ),
      ];
    }

    if (customer_id) {
      whereClause.calc_roi_id = {
        [Sequelize.Op.in]: Sequelize.literal(`(
            SELECT id FROM calc_roi WHERE customer_id = ${customer_id}
          )`),
      };
    }

    // Calculate offset for pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const customerSalesData = await LogsCalcRoi.findAll({
      attributes: [
        "calc_roi_id",
        [
          Sequelize.fn("SUM", Sequelize.col("logs_calc_roi.total_sales")),
          "total_sales",
        ],
        [
          Sequelize.fn("SUM", Sequelize.col("logs_calc_roi.total_recouped")),
          "total_recouped",
        ],
        [
          Sequelize.fn("SUM", Sequelize.col("logs_calc_roi.total_months")),
          "total_months",
        ],
        [
          Sequelize.fn("SUM", Sequelize.col("logs_calc_roi.sales_not_met")),
          "sales_not_met",
        ],
        [
          Sequelize.fn("COUNT", Sequelize.col("logs_calc_roi.id")),
          "calculation_count",
        ],
      ],
      where: whereClause,
      group: ["calc_roi_id"],
      order: [
        [
          Sequelize.fn("SUM", Sequelize.col("logs_calc_roi.total_sales")),
          "DESC",
        ],
      ],
      limit: parseInt(limit),
      offset: offset,
    });

    // Get customer data separately for each calc_roi_id
    const calcRoiIds = customerSalesData.map((item) => item.calc_roi_id);
    const calcRoiData = await CalcRoi.findAll({
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

    // Create a map for quick lookup
    const calcRoiMap = {};
    calcRoiData.forEach((roi) => {
      calcRoiMap[roi.id] = roi;
    });

    // Get total count for pagination
    const totalCount = await LogsCalcRoi.count({
      where: whereClause,
      group: ["calc_roi_id"],
      distinct: true,
      col: "calc_roi_id",
    });

    const formattedData = customerSalesData.map((item) => {
      const calcRoi = calcRoiMap[item.calc_roi_id];
      const customer = calcRoi?.customer;

      return {
        customer_id: customer?.id || null,
        name: customer
          ? `${customer.first_name} ${customer.last_name}`
          : "Unknown",
        company_name: customer?.company_name || "",
        total_sales: parseFloat(item.dataValues.total_sales || 0),
        recouped: parseFloat(item.dataValues.total_recouped || 0),
        total_months: parseInt(item.dataValues.total_months || 0),
        not_met: parseInt(item.dataValues.sales_not_met || 0),
        calculation_count: parseInt(item.dataValues.calculation_count || 0),
      };
    });

    const response = {
      data: formattedData,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total_records: Array.isArray(totalCount)
          ? totalCount.length
          : totalCount,
        total_pages: Math.ceil(
          (Array.isArray(totalCount) ? totalCount.length : totalCount) /
            parseInt(limit)
        ),
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

    // Build where clause for filters
    let whereClause = {};

    // Year filter
    if (year) {
      whereClause[Sequelize.Op.and] = [
        Sequelize.where(
          Sequelize.fn("YEAR", Sequelize.col("invoice_line_items.created_at")),
          year
        ),
      ];
    }

    // Customer filter - handled in the invoice include below

    // Calculate offset for pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Get ROI data grouped by product/equipment
    const roiData = await InvoiceLineItems.findAll({
      attributes: [
        "product_id",
        [
          Sequelize.fn("SUM", Sequelize.col("invoice_line_items.amount")),
          "total_lease_cost",
        ],
        [
          Sequelize.fn("COUNT", Sequelize.col("invoice_line_items.id")),
          "number_of_invoices",
        ],
        [
          Sequelize.fn("SUM", Sequelize.col("invoice_line_items.amount")),
          "total_sales_profit",
        ],
      ],
      include: [
        {
          model: Products,
          as: "product",
          attributes: ["id", "name", "full_name"],
          required: true,
        },
        {
          model: Invoices,
          as: "invoice",
          attributes: [],
          where: customer_id ? { customer_id: customer_id } : {},
          required: true,
        },
      ],
      where: whereClause,
      group: ["product_id", "product.id"],
      order: [
        [
          Sequelize.fn("SUM", Sequelize.col("invoice_line_items.amount")),
          "DESC",
        ],
      ],
      limit: parseInt(limit),
      offset: offset,
    });

    // Format the response data
    const formattedData = roiData.map((item) => {
      const product = item.product;
      const totalLeaseCost = parseFloat(item.dataValues.total_lease_cost || 0);
      const totalSalesProfit = parseFloat(
        item.dataValues.total_sales_profit || 0
      );
      const netROI = totalSalesProfit - totalLeaseCost;
      const roiPercentage =
        totalLeaseCost > 0 ? (netROI / totalLeaseCost) * 100 : 0;
      const numberOfInvoices = parseInt(
        item.dataValues.number_of_invoices || 0
      );

      return {
        product_id: product?.id || null,
        product_name: product?.name || product?.full_name || "Unknown Product",
        lease_cost: totalLeaseCost,
        sales_profit: totalSalesProfit,
        net_roi: netROI,
        roi_percent: parseFloat(roiPercentage.toFixed(2)),
        invoices_count: numberOfInvoices,
      };
    });

    // Get total count for pagination
    const totalCountResult = await InvoiceLineItems.findAll({
      attributes: [
        [
          Sequelize.fn(
            "COUNT",
            Sequelize.fn("DISTINCT", Sequelize.col("product_id"))
          ),
          "count",
        ],
      ],
      include: [
        {
          model: Invoices,
          as: "invoice",
          attributes: [],
          where: customer_id ? { customer_id: customer_id } : {},
          required: true,
        },
      ],
      where: whereClause,
      raw: true,
    });

    const totalCount = totalCountResult[0]?.count || 0;

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

    // Get product purchase data grouped by product using raw query approach
    const productData = await CalcInvoiceLineItems.findAll({
      attributes: [
        [Sequelize.col("lineItem.product_id"), "product_id"],
        [
          Sequelize.fn(
            "MIN",
            Sequelize.col("calc_invoice_line_items.created_at")
          ),
          "first_purchase_date",
        ],
        [
          Sequelize.fn(
            "MAX",
            Sequelize.col("calc_invoice_line_items.created_at")
          ),
          "last_purchase_date",
        ],
        [
          Sequelize.fn("COUNT", Sequelize.col("calc_invoice_line_items.id")),
          "total_purchases",
        ],
      ],
      include: [
        {
          model: InvoiceLineItems,
          as: "lineItem",
          attributes: [],
          required: true,
          include: [
            {
              model: Products,
              as: "product",
              attributes: ["id", "name", "full_name"],
              required: true,
              where: search
                ? {
                    [Sequelize.Op.or]: [
                      { name: { [Sequelize.Op.like]: `%${search}%` } },
                      { full_name: { [Sequelize.Op.like]: `%${search}%` } },
                    ],
                  }
                : {},
            },
          ],
        },
      ],
      group: [Sequelize.col("lineItem.product_id")],
      order: [
        [
          Sequelize.fn("COUNT", Sequelize.col("calc_invoice_line_items.id")),
          "DESC",
        ],
      ],
      limit: parseInt(limit),
      offset: offset,
    });

    // Get product details separately
    const productIds = productData.map((item) => item.dataValues.product_id);
    const products = await Products.findAll({
      where: {
        id: {
          [Sequelize.Op.in]: productIds,
        },
      },
      attributes: ["id", "name", "full_name"],
    });

    // Create a map for quick lookup
    const productMap = {};
    products.forEach((product) => {
      productMap[product.id] = product;
    });

    // Calculate drop-off percentage for each product

    const formattedData = await Promise.all(
      productData.map(async (item) => {
        // Get product data from the product map
        const productId = item.dataValues.product_id;
        const product = productMap[productId];
        const productName = product?.name;
        const productFullName = product?.full_name;
        const firstPurchaseDate = new Date(item.dataValues.first_purchase_date);
        const lastPurchaseDate = new Date(item.dataValues.last_purchase_date);
        const totalPurchases = parseInt(item.dataValues.total_purchases || 0);

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

        const lastMonthPurchases = await CalcInvoiceLineItems.count({
          where: {
            created_at: {
              [Sequelize.Op.between]: [lastMonthStart, lastMonthEnd],
            },
          },
          include: [
            {
              model: InvoiceLineItems,
              as: "lineItem",
              where: {
                product_id: item.dataValues.product_id,
              },
              required: true,
            },
          ],
        });

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

    // Get total count for pagination
    const totalCountResult = await CalcInvoiceLineItems.findAll({
      attributes: [
        [
          Sequelize.fn(
            "COUNT",
            Sequelize.fn("DISTINCT", Sequelize.col("lineItem.product_id"))
          ),
          "count",
        ],
      ],
      include: [
        {
          model: InvoiceLineItems,
          as: "lineItem",
          attributes: [],
          required: true,
          include: [
            {
              model: Products,
              as: "product",
              attributes: [],
              required: true,
              where: search
                ? {
                    [Sequelize.Op.or]: [
                      { name: { [Sequelize.Op.like]: `%${search}%` } },
                      { full_name: { [Sequelize.Op.like]: `%${search}%` } },
                    ],
                  }
                : {},
            },
          ],
        },
      ],
      raw: true,
    });

    const totalCount = totalCountResult[0]?.count || 0;

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

    // Calculate offset for pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause for filters
    let whereClause = {};

    // Product name filter
    if (product_name) {
      whereClause[Sequelize.Op.and] = [
        ...(whereClause[Sequelize.Op.and] || []),
        {
          "$lineItem.product.name$": {
            [Sequelize.Op.like]: `%${product_name}%`,
          },
        },
      ];
    }

    // Customer name filter
    if (customer_name) {
      whereClause[Sequelize.Op.and] = [
        ...(whereClause[Sequelize.Op.and] || []),
        {
          [Sequelize.Op.or]: [
            {
              "$calcInvoice.roi.customer.first_name$": {
                [Sequelize.Op.like]: `%${customer_name}%`,
              },
            },
            {
              "$calcInvoice.roi.customer.last_name$": {
                [Sequelize.Op.like]: `%${customer_name}%`,
              },
            },
            {
              "$calcInvoice.roi.customer.company_name$": {
                [Sequelize.Op.like]: `%${customer_name}%`,
              },
            },
          ],
        },
      ];
    }

    // Get customer drop-off data grouped by product and customer
    const dropoffData = await CalcInvoiceLineItems.findAll({
      attributes: [
        [Sequelize.col("lineItem.product_id"), "product_id"],
        [Sequelize.col("calcInvoice.roi.customer_id"), "customer_id"],
        [
          Sequelize.fn(
            "MIN",
            Sequelize.col("calc_invoice_line_items.created_at")
          ),
          "first_purchase_date",
        ],
        [
          Sequelize.fn(
            "MAX",
            Sequelize.col("calc_invoice_line_items.created_at")
          ),
          "last_purchase_date",
        ],
        [
          Sequelize.fn("COUNT", Sequelize.col("calc_invoice_line_items.id")),
          "total_purchases",
        ],
      ],
      include: [
        {
          model: InvoiceLineItems,
          as: "lineItem",
          attributes: [],
          required: true,
          include: [
            {
              model: Products,
              as: "product",
              attributes: ["id", "name", "full_name"],
              required: true,
            },
          ],
        },
        {
          model: CalcInvoices,
          as: "calcInvoice",
          attributes: [],
          required: true,
          include: [
            {
              model: CalcRoi,
              as: "roi",
              attributes: [],
              required: true,
              include: [
                {
                  model: Customers,
                  as: "customer",
                  attributes: ["id", "first_name", "last_name", "company_name"],
                  required: true,
                },
              ],
            },
          ],
        },
      ],
      where: whereClause,
      group: [
        Sequelize.col("lineItem.product_id"),
        Sequelize.col("calcInvoice.roi.customer_id"),
      ],
      order: [
        [
          Sequelize.col(
            sort_by === "days_since_last_purchase"
              ? "last_purchase_date"
              : sort_by === "product_name"
              ? "lineItem.product.name"
              : sort_by === "customer_name"
              ? "calcInvoice.roi.customer.first_name"
              : "last_purchase_date"
          ),
          sort_order.toUpperCase(),
        ],
      ],
      limit: parseInt(limit),
      offset: offset,
    });

    // Get product and customer details separately for better performance
    const productIds = [
      ...new Set(dropoffData.map((item) => item.dataValues.product_id)),
    ];
    const customerIds = [
      ...new Set(dropoffData.map((item) => item.dataValues.customer_id)),
    ];

    const [products, customers] = await Promise.all([
      Products.findAll({
        where: { id: { [Sequelize.Op.in]: productIds } },
        attributes: ["id", "name", "full_name"],
      }),
      Customers.findAll({
        where: { id: { [Sequelize.Op.in]: customerIds } },
        attributes: ["id", "first_name", "last_name", "company_name"],
      }),
    ]);

    // Create maps for quick lookup
    const productMap = {};
    products.forEach((product) => {
      productMap[product.id] = product;
    });

    const customerMap = {};
    customers.forEach((customer) => {
      customerMap[customer.id] = customer;
    });

    // Calculate days since last purchase and format data
    const formattedData = dropoffData.map((item) => {
      const productId = item.dataValues.product_id;
      const customerId = item.dataValues.customer_id;
      const product = productMap[productId];
      const customer = customerMap[customerId];

      const firstPurchaseDate = new Date(item.dataValues.first_purchase_date);
      const lastPurchaseDate = new Date(item.dataValues.last_purchase_date);
      const totalPurchases = parseInt(item.dataValues.total_purchases || 0);

      // Calculate days since last purchase
      const currentDate = new Date();
      const daysSinceLastPurchase = Math.floor(
        (currentDate - lastPurchaseDate) / (1000 * 60 * 60 * 24)
      );

      return {
        product_id: productId,
        product_name: product?.name || product?.full_name || "Unknown Product",
        customer_id: customerId,
        customer_name: customer
          ? `${customer.first_name} ${customer.last_name}`.trim() ||
            customer.company_name
          : "Unknown Customer",
        first_purchase_date: firstPurchaseDate.toISOString().split("T")[0],
        last_purchase_date: lastPurchaseDate.toISOString().split("T")[0],
        total_purchases: totalPurchases,
        days_since_last_purchase: daysSinceLastPurchase,
      };
    });

    // Get total count for pagination
    const totalCountResult = await CalcInvoiceLineItems.findAll({
      attributes: [
        [
          Sequelize.fn(
            "COUNT",
            Sequelize.fn(
              "DISTINCT",
              Sequelize.fn(
                "CONCAT",
                Sequelize.col("lineItem.product_id"),
                "-",
                Sequelize.col("calcInvoice.roi.customer_id")
              )
            )
          ),
          "count",
        ],
      ],
      include: [
        {
          model: InvoiceLineItems,
          as: "lineItem",
          attributes: [],
          required: true,
          include: [
            {
              model: Products,
              as: "product",
              attributes: [],
              required: true,
            },
          ],
        },
        {
          model: CalcInvoices,
          as: "calcInvoice",
          attributes: [],
          required: true,
          include: [
            {
              model: CalcRoi,
              as: "roi",
              attributes: [],
              required: true,
              include: [
                {
                  model: Customers,
                  as: "customer",
                  attributes: [],
                  required: true,
                },
              ],
            },
          ],
        },
      ],
      where: whereClause,
      raw: true,
    });

    const totalCount = totalCountResult[0]?.count || 0;

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

    // Build where clause for filters
    let whereClause = {};

    // Customer filter
    if (customer_id) {
      whereClause[Sequelize.Op.and] = [
        ...(whereClause[Sequelize.Op.and] || []),
        {
          "$calcInvoice.roi.customer_id$": customer_id,
        },
      ];
    }

    // Get product lifecycle data grouped by product
    const lifecycleData = await CalcInvoiceLineItems.findAll({
      attributes: [
        [Sequelize.col("lineItem.product_id"), "product_id"],
        [
          Sequelize.fn(
            "COUNT",
            Sequelize.fn(
              "DISTINCT",
              Sequelize.col("calcInvoice.roi.customer_id")
            )
          ),
          "total_customers",
        ],
        [
          Sequelize.fn(
            "MIN",
            Sequelize.col("calc_invoice_line_items.created_at")
          ),
          "first_purchase_date",
        ],
        [
          Sequelize.fn(
            "MAX",
            Sequelize.col("calc_invoice_line_items.created_at")
          ),
          "last_purchase_date",
        ],
      ],
      include: [
        {
          model: InvoiceLineItems,
          as: "lineItem",
          attributes: [],
          required: true,
          include: [
            {
              model: Products,
              as: "product",
              attributes: ["id", "name", "full_name"],
              required: true,
            },
          ],
        },
        {
          model: CalcInvoices,
          as: "calcInvoice",
          attributes: [],
          required: true,
          include: [
            {
              model: CalcRoi,
              as: "roi",
              attributes: [],
              required: true,
            },
          ],
        },
      ],
      where: whereClause,
      group: [Sequelize.col("lineItem.product_id")],
      order: [
        [
          Sequelize.col(
            sort_by === "total_customers"
              ? "total_customers"
              : sort_by === "product_name"
              ? "lineItem.product.name"
              : "total_customers"
          ),
          sort_order.toUpperCase(),
        ],
      ],
      limit: parseInt(limit),
      offset: offset,
    });

    // Get product details separately for better performance
    const productIds = [
      ...new Set(lifecycleData.map((item) => item.dataValues.product_id)),
    ];
    const products = await Products.findAll({
      where: { id: { [Sequelize.Op.in]: productIds } },
      attributes: ["id", "name", "full_name"],
    });

    // Create a map for quick lookup
    const productMap = {};
    products.forEach((product) => {
      productMap[product.id] = product;
    });

    // Calculate active and lapsed customers for each product
    const formattedData = await Promise.all(
      lifecycleData.map(async (item) => {
        const productId = item.dataValues.product_id;
        const product = productMap[productId];
        const totalCustomers = parseInt(item.dataValues.total_customers || 0);

        // Get all customers who purchased this product
        const customerData = await CalcInvoiceLineItems.findAll({
          attributes: [
            [Sequelize.col("calcInvoice.roi.customer_id"), "customer_id"],
            [
              Sequelize.fn(
                "MAX",
                Sequelize.col("calc_invoice_line_items.created_at")
              ),
              "last_purchase_date",
            ],
          ],
          include: [
            {
              model: InvoiceLineItems,
              as: "lineItem",
              attributes: [],
              required: true,
              where: { product_id: productId },
            },
            {
              model: CalcInvoices,
              as: "calcInvoice",
              attributes: [],
              required: true,
              include: [
                {
                  model: CalcRoi,
                  as: "roi",
                  attributes: [],
                  required: true,
                },
              ],
            },
          ],
          group: [Sequelize.col("calcInvoice.roi.customer_id")],
          raw: true,
        });

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
          product_name:
            product?.name || product?.full_name || "Unknown Product",
          total_customers_purchased: totalCustomers,
          active_customers: activeCustomers,
          lapsed_customers: lapsedCustomers,
        };
      })
    );

    // Get total count for pagination
    const totalCountResult = await CalcInvoiceLineItems.findAll({
      attributes: [
        [
          Sequelize.fn(
            "COUNT",
            Sequelize.fn("DISTINCT", Sequelize.col("lineItem.product_id"))
          ),
          "count",
        ],
      ],
      include: [
        {
          model: InvoiceLineItems,
          as: "lineItem",
          attributes: [],
          required: true,
          include: [
            {
              model: Products,
              as: "product",
              attributes: [],
              required: true,
            },
          ],
        },
        {
          model: CalcInvoices,
          as: "calcInvoice",
          attributes: [],
          required: true,
          include: [
            {
              model: CalcRoi,
              as: "roi",
              attributes: [],
              required: true,
            },
          ],
        },
      ],
      where: whereClause,
      raw: true,
    });

    const totalCount = totalCountResult[0]?.count || 0;

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

    // Build where clause for year filter
    let whereClause = {};
    if (year) {
      whereClause[Sequelize.Op.and] = [
        Sequelize.where(
          Sequelize.fn("YEAR", Sequelize.col("logs_calc_roi.created_at")),
          year
        ),
      ];
    }

    // Get underperforming customers data from logs_calc_roi
    const underperformingData = await LogsCalcRoi.findAll({
      attributes: [
        "calc_roi_id",
        [
          Sequelize.fn(
            "SUM",
            Sequelize.col("logs_calc_roi.monthly_sales_required")
          ),
          "total_minimum_sales_required",
        ],
        [
          Sequelize.fn("SUM", Sequelize.col("logs_calc_roi.total_sales")),
          "total_actual_sales",
        ],
        [
          Sequelize.fn("COUNT", Sequelize.col("logs_calc_roi.id")),
          "calculation_count",
        ],
      ],
      where: whereClause,
      group: ["calc_roi_id"],
      order: [
        [
          Sequelize.col(
            sort_by === "sales_gap"
              ? "total_minimum_sales_required"
              : "total_minimum_sales_required"
          ),
          sort_order.toUpperCase(),
        ],
      ],
      limit: parseInt(limit),
      offset: offset,
    });

    // Get customer details separately for better performance
    const calcRoiIds = [
      ...new Set(underperformingData.map((item) => item.calc_roi_id)),
    ];
    const calcRoiData = await CalcRoi.findAll({
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

    // Create a map for quick lookup
    const calcRoiMap = {};
    calcRoiData.forEach((roi) => {
      calcRoiMap[roi.id] = roi;
    });

    // Calculate sales gap and format data
    const formattedData = underperformingData.map((item) => {
      const calcRoi = calcRoiMap[item.calc_roi_id];
      const customer = calcRoi?.customer;
      const totalMinimumSalesRequired = parseFloat(
        item.dataValues.total_minimum_sales_required || 0
      );
      const totalActualSales = parseFloat(
        item.dataValues.total_actual_sales || 0
      );
      const salesGap = Math.max(
        0,
        totalMinimumSalesRequired - totalActualSales
      );
      const status = salesGap > 0 ? "Not Met" : "Met";
      const calculationCount = parseInt(item.dataValues.calculation_count || 0);

      return {
        customer_id: customer?.id || null,
        customer_name: customer
          ? `${customer.first_name} ${customer.last_name}`.trim() ||
            customer.company_name
          : "Unknown Customer",
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

    // Get total count for pagination
    const totalCountResult = await LogsCalcRoi.findAll({
      attributes: [
        [
          Sequelize.fn(
            "COUNT",
            Sequelize.fn("DISTINCT", Sequelize.col("calc_roi_id"))
          ),
          "count",
        ],
      ],
      where: whereClause,
      raw: true,
    });

    const totalCount = totalCountResult[0]?.count || 0;

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

    // Build where clause for year filter
    let whereClause = {};
    if (year) {
      whereClause[Sequelize.Op.and] = [
        Sequelize.where(
          Sequelize.fn("YEAR", Sequelize.col("logs_calc_roi.created_at")),
          year
        ),
      ];
    }

    // Get outstanding performance customers data from logs_calc_roi
    const outstandingData = await LogsCalcRoi.findAll({
      attributes: [
        "calc_roi_id",
        [
          Sequelize.fn(
            "SUM",
            Sequelize.col("logs_calc_roi.monthly_sales_required")
          ),
          "total_target_sales",
        ],
        [
          Sequelize.fn("SUM", Sequelize.col("logs_calc_roi.total_sales")),
          "total_actual_sales",
        ],
        [
          Sequelize.fn("COUNT", Sequelize.col("logs_calc_roi.id")),
          "calculation_count",
        ],
      ],
      where: whereClause,
      group: ["calc_roi_id"],
      order: [
        [
          Sequelize.col(
            sort_by === "performance_percentage"
              ? "total_actual_sales"
              : "total_actual_sales"
          ),
          sort_order.toUpperCase(),
        ],
      ],
      limit: parseInt(limit),
      offset: offset,
    });

    // Get customer details separately for better performance
    const calcRoiIds = [
      ...new Set(outstandingData.map((item) => item.calc_roi_id)),
    ];
    const calcRoiData = await CalcRoi.findAll({
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

    // Create a map for quick lookup
    const calcRoiMap = {};
    calcRoiData.forEach((roi) => {
      calcRoiMap[roi.id] = roi;
    });

    // Calculate performance metrics and format data
    const formattedData = outstandingData
      .map((item) => {
        const calcRoi = calcRoiMap[item.calc_roi_id];
        const customer = calcRoi?.customer;
        const totalTargetSales = parseFloat(
          item.dataValues.total_target_sales || 0
        );
        const totalActualSales = parseFloat(
          item.dataValues.total_actual_sales || 0
        );
        const calculationCount = parseInt(
          item.dataValues.calculation_count || 0
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

        return {
          customer_id: customer?.id || null,
          customer_name: customer
            ? `${customer.first_name} ${customer.last_name}`.trim() ||
              customer.company_name
            : "Unknown Customer",
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

    // Get total count for pagination (only count customers who exceeded targets)
    const allOutstandingData = await LogsCalcRoi.findAll({
      attributes: [
        "calc_roi_id",
        [
          Sequelize.fn(
            "SUM",
            Sequelize.col("logs_calc_roi.monthly_sales_required")
          ),
          "total_target_sales",
        ],
        [
          Sequelize.fn("SUM", Sequelize.col("logs_calc_roi.total_sales")),
          "total_actual_sales",
        ],
      ],
      where: whereClause,
      group: ["calc_roi_id"],
      raw: true,
    });

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
