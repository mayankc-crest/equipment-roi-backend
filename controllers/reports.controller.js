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
    console.log("the getCustomerROIReports controller got called");
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
        customer_name: customer
          ? `${customer.first_name} ${customer.last_name}`
          : "Unknown",
        company_name: customer?.company_name || "",
        total_sales: parseFloat(item.dataValues.total_sales || 0),
        total_months: parseInt(item.dataValues.total_months || 0),
        sales_not_met: parseInt(item.dataValues.sales_not_met || 0),
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
          Sequelize.fn("YEAR", Sequelize.col("invoice_line_items.createdAt")),
          year
        ),
      ];
    }

    // Customer filter
    if (customer_id) {
      whereClause[Sequelize.Op.and] = [
        ...(whereClause[Sequelize.Op.and] || []),
        { customer_id: customer_id },
      ];
    }

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
        roi_percentage: parseFloat(roiPercentage.toFixed(2)),
        number_of_invoices: numberOfInvoices,
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

    // Get product purchase data grouped by product
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
      group: [Sequelize.col("lineItem.product_id"), "lineItem.product.id"],
      order: [
        [
          Sequelize.fn("COUNT", Sequelize.col("calc_invoice_line_items.id")),
          "DESC",
        ],
      ],
      limit: parseInt(limit),
      offset: offset,
    });

    // Calculate drop-off percentage for each product
    const formattedData = await Promise.all(
      productData.map(async (item) => {
        const product = item.lineItem?.product;
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
          product_id: product?.id || null,
          product_name:
            product?.name || product?.full_name || "Unknown Product",
          first_purchase_date: firstPurchaseDate.toISOString().split("T")[0],
          last_purchase_date: lastPurchaseDate.toISOString().split("T")[0],
          total_purchases: totalPurchases,
          drop_off_rate: Math.max(0, parseFloat(dropOffPercentage.toFixed(1))), // Ensure non-negative
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
