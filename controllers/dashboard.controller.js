const {
  invoices: Invoices,
  customers: Customers,
  calc_roi: CalcRoi,
  calc_invoices: CalcInvoices,
  calc_invoice_line_items: CalcInvoiceLineItems,
  logs_calc_roi: LogsCalcRoi,
  alerts: Alerts,
  settings: Settings,
} = require("../models");
const { sendSuccessRespose, sendErrorResponse } = require("../utils/response");
const { parseDateRange } = require("../utils/dateUtils");
const Sequelize = require("sequelize");

// Get dashboard overview statistics
exports.getDashboardOverview = async (req, res) => {
  try {
    // Get total customers count
    const totalCustomers = await Customers.count();

    // Get new customers in last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const newCustomersLast6Months = await Customers.count({
      where: {
        createdAt: {
          [Sequelize.Op.gte]: sixMonthsAgo,
        },
      },
    });

    // Get new customers this month
    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);

    const newCustomersThisMonth = await Customers.count({
      where: {
        createdAt: {
          [Sequelize.Op.gte]: thisMonthStart,
        },
      },
    });

    // Get current 6 months date range
    const current6MonthsStart = new Date();
    current6MonthsStart.setMonth(current6MonthsStart.getMonth() - 6);

    // Get previous 6 months date range (6-12 months ago)
    const previous6MonthsStart = new Date();
    previous6MonthsStart.setMonth(previous6MonthsStart.getMonth() - 12);
    const previous6MonthsEnd = new Date();
    previous6MonthsEnd.setMonth(previous6MonthsEnd.getMonth() - 6);

    // Get total sales amount for current 6 months
    const current6MonthsSales = await LogsCalcRoi.sum("total_sales", {
      where: {
        created_at: {
          [Sequelize.Op.gte]: current6MonthsStart,
        },
      },
    });

    // Get total sales amount for previous 6 months
    const previous6MonthsSales = await LogsCalcRoi.sum("total_sales", {
      where: {
        created_at: {
          [Sequelize.Op.between]: [previous6MonthsStart, previous6MonthsEnd],
        },
      },
    });

    // Get total recouped amount for current 6 months
    const current6MonthsRecouped = await LogsCalcRoi.sum("total_recouped", {
      where: {
        created_at: {
          [Sequelize.Op.gte]: current6MonthsStart,
        },
      },
    });

    // Get total recouped amount for previous 6 months
    const previous6MonthsRecouped = await LogsCalcRoi.sum("total_recouped", {
      where: {
        created_at: {
          [Sequelize.Op.between]: [previous6MonthsStart, previous6MonthsEnd],
        },
      },
    });

    // Calculate percentage changes
    let salesPercentageChange;
    const currentSalesValue = current6MonthsSales || 0;
    const previousSalesValue = previous6MonthsSales || 0;
    if (previousSalesValue > 0) {
      salesPercentageChange =
        ((currentSalesValue - previousSalesValue) / previousSalesValue) * 100;
    } else {
      // If there were no previous sales:
      // - return 100% when there are current sales
      // - return 0% when there are no current sales either (first-time user with no sales yet)
      salesPercentageChange = currentSalesValue > 0 ? 100 : 0;
    }

    let recoupedPercentageChange;
    const currentRecoupedValue = current6MonthsRecouped || 0;
    const previousRecoupedValue = previous6MonthsRecouped || 0;
    if (previousRecoupedValue > 0) {
      recoupedPercentageChange =
        ((currentRecoupedValue - previousRecoupedValue) /
          previousRecoupedValue) *
        100;
    } else {
      recoupedPercentageChange = currentRecoupedValue > 0 ? 100 : 0;
    }

    // Calculate deficit amounts (total_sales - total_recouped)
    const current6MonthsDeficit =
      (current6MonthsSales || 0) - (current6MonthsRecouped || 0);
    const previous6MonthsDeficit =
      (previous6MonthsSales || 0) - (previous6MonthsRecouped || 0);
    
    // Calculate deficit percentage change with the same edge-case handling
    let deficitPercentageChange;
    const currentDeficitValue = current6MonthsDeficit || 0;
    const previousDeficitValue = previous6MonthsDeficit || 0;
    if (Math.abs(previousDeficitValue) > 0) {
      deficitPercentageChange =
        ((currentDeficitValue - previousDeficitValue) /
          Math.abs(previousDeficitValue)) *
        100;
    } else {
      deficitPercentageChange = Math.abs(currentDeficitValue) > 0 ? 100 : 0;
    }

    const response = {
      totalCustomers: {
        value: totalCustomers,
        newCustomersLast6Months: newCustomersLast6Months,
        newCustomersThisMonth: newCustomersThisMonth,
      },
      totalSalesAmount: {
        current6Months: current6MonthsSales || 0,
        previous6Months: previous6MonthsSales || 0,
        percentageChange: parseFloat(salesPercentageChange.toFixed(2)),
      },
      totalRecoupedAmount: {
        current6Months: current6MonthsRecouped || 0,
        previous6Months: previous6MonthsRecouped || 0,
        percentageChange: parseFloat(recoupedPercentageChange.toFixed(2)),
      },
      totalDeficitAmount: {
        current6Months: current6MonthsDeficit,
        previous6Months: previous6MonthsDeficit,
        percentageChange: parseFloat(deficitPercentageChange.toFixed(2)),
      },
    };

    return sendSuccessRespose(
      res,
      response,
      "Dashboard overview retrieved successfully",
      200
    );
  } catch (error) {
    console.error("Get dashboard overview error:", error);
    return sendErrorResponse(res, "Failed to get dashboard overview", 500);
  }
};

// Get recent activities
exports.getRecentActivities = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Get recent invoices
    const recentInvoices = await Invoices.findAll({
      include: [
        {
          model: Customers,
          as: "customer",
          attributes: ["id", "first_name", "last_name", "company_name"],
        },
      ],
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
      attributes: [
        "id",
        "txn_number",
        "total_amount",
        "is_paid",
        "created_at",
        "invoice_type",
      ],
    });

    // Get recent calculated invoices
    const recentCalcInvoices = await CalcRoi.findAll({
      include: [
        {
          model: Customers,
          as: "customer",
          attributes: ["id", "first_name", "last_name", "company_name"],
        },
      ],
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
      attributes: ["id", "start_date", "created_at"],
    });

    // Get recent alerts
    const recentAlerts = await Alerts.findAll({
      include: [
        {
          model: Customers,
          as: "customer",
          attributes: ["id", "first_name", "last_name", "company_name"],
        },
      ],
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
      attributes: ["id", "alert_type", "created_at"],
    });

    const response = {
      recentInvoices: recentInvoices.map((invoice) => ({
        id: invoice.id,
        type: "invoice",
        txn_number: invoice.txn_number,
        amount: invoice.total_amount,
        is_paid: invoice.is_paid,
        customer_name: invoice.customer
          ? `${invoice.customer.first_name} ${invoice.customer.last_name}`
          : "Unknown",
        created_at: invoice.created_at,
      })),
      recentCalcInvoices: recentCalcInvoices.map((calcRoi) => ({
        id: calcRoi.id,
        type: "calc_invoice",
        customer_name: calcRoi.customer
          ? `${calcRoi.customer.first_name} ${calcRoi.customer.last_name}`
          : "Unknown",
        start_date: calcRoi.start_date,
        created_at: calcRoi.created_at,
      })),
      recentAlerts: recentAlerts.map((alert) => ({
        id: alert.id,
        type: "alert",
        alert_type: alert.alert_type,
        customer_name: alert.customer
          ? `${alert.customer.first_name} ${alert.customer.last_name}`
          : "Unknown",
        created_at: alert.created_at,
      })),
    };

    return sendSuccessRespose(
      res,
      response,
      "Recent activities retrieved successfully",
      200
    );
  } catch (error) {
    console.error("Get recent activities error:", error);
    return sendErrorResponse(res, "Failed to get recent activities", 500);
  }
};

// Get revenue analytics
exports.getRevenueAnalytics = async (req, res) => {
  try {
    const { period = "month" } = req.query; // month, quarter, year

    let dateFilter = {};
    const now = new Date();

    switch (period) {
      case "month":
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        dateFilter = {
          created_at: {
            [Sequelize.Op.gte]: monthAgo,
          },
        };
        break;
      case "quarter":
        const quarterAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        dateFilter = {
          created_at: {
            [Sequelize.Op.gte]: quarterAgo,
          },
        };
        break;
      case "year":
        const yearAgo = new Date(now.getFullYear() - 1, 0, 1);
        dateFilter = {
          created_at: {
            [Sequelize.Op.gte]: yearAgo,
          },
        };
        break;
    }

    // Get paid vs unpaid revenue
    const paidRevenue = await Invoices.sum("total_amount", {
      where: {
        ...dateFilter,
        is_paid: true,
      },
    });

    const unpaidRevenue = await Invoices.sum("total_amount", {
      where: {
        ...dateFilter,
        is_paid: false,
      },
    });

    // Get revenue by month for chart
    const monthlyRevenue = await Invoices.findAll({
      attributes: [
        [
          Sequelize.fn("DATE_FORMAT", Sequelize.col("created_at"), "%Y-%m"),
          "month",
        ],
        [Sequelize.fn("SUM", Sequelize.col("total_amount")), "revenue"],
        [Sequelize.fn("COUNT", Sequelize.col("id")), "count"],
      ],
      where: dateFilter,
      group: [
        Sequelize.fn("DATE_FORMAT", Sequelize.col("created_at"), "%Y-%m"),
      ],
      order: [
        [
          Sequelize.fn("DATE_FORMAT", Sequelize.col("created_at"), "%Y-%m"),
          "ASC",
        ],
      ],
    });

    const response = {
      period,
      summary: {
        paidRevenue: paidRevenue || 0,
        unpaidRevenue: unpaidRevenue || 0,
        totalRevenue: (paidRevenue || 0) + (unpaidRevenue || 0),
      },
      monthlyData: monthlyRevenue.map((item) => ({
        month: item.dataValues.month,
        revenue: parseFloat(item.dataValues.revenue) || 0,
        count: parseInt(item.dataValues.count) || 0,
      })),
    };

    return sendSuccessRespose(
      res,
      response,
      "Revenue analytics retrieved successfully",
      200
    );
  } catch (error) {
    console.error("Get revenue analytics error:", error);
    return sendErrorResponse(res, "Failed to get revenue analytics", 500);
  }
};

// Get customer analytics
exports.getCustomerAnalytics = async (req, res) => {
  try {
    // Get customer count by creation date
    const customerGrowth = await Customers.findAll({
      attributes: [
        [
          Sequelize.fn("DATE_FORMAT", Sequelize.col("created_at"), "%Y-%m"),
          "month",
        ],
        [Sequelize.fn("COUNT", Sequelize.col("id")), "count"],
      ],
      group: [
        Sequelize.fn("DATE_FORMAT", Sequelize.col("created_at"), "%Y-%m"),
      ],
      order: [
        [
          Sequelize.fn("DATE_FORMAT", Sequelize.col("created_at"), "%Y-%m"),
          "ASC",
        ],
      ],
    });

    // Get customers with most invoices
    const topCustomers = await Invoices.findAll({
      attributes: [
        "customer_id",
        [Sequelize.fn("COUNT", Sequelize.col("id")), "invoice_count"],
        [Sequelize.fn("SUM", Sequelize.col("total_amount")), "total_spent"],
      ],
      include: [
        {
          model: Customers,
          as: "customer",
          attributes: ["id", "first_name", "last_name", "company_name"],
        },
      ],
      group: ["customer_id"],
      order: [[Sequelize.fn("COUNT", Sequelize.col("id")), "DESC"]],
      limit: 10,
    });

    const response = {
      customerGrowth: customerGrowth.map((item) => ({
        month: item.dataValues.month,
        count: parseInt(item.dataValues.count) || 0,
      })),
      topCustomers: topCustomers.map((item) => ({
        customer_id: item.customer_id,
        customer_name: item.customer
          ? `${item.customer.first_name} ${item.customer.last_name}`
          : "Unknown",
        company_name: item.customer?.company_name || "",
        invoice_count: parseInt(item.dataValues.invoice_count) || 0,
        total_spent: parseFloat(item.dataValues.total_spent) || 0,
      })),
    };

    return sendSuccessRespose(
      res,
      response,
      "Customer analytics retrieved successfully",
      200
    );
  } catch (error) {
    console.error("Get customer analytics error:", error);
    return sendErrorResponse(res, "Failed to get customer analytics", 500);
  }
};

// Get leased/sold items analytics
exports.getLeasedSoldAnalytics = async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;

    // Validate year
    const yearInt = parseInt(year);
    if (isNaN(yearInt) || yearInt < 1900 || yearInt > 2100) {
      return sendErrorResponse(res, "Invalid year format", 400);
    }

    // Get start and end dates for the year
    const startDate = new Date(yearInt, 0, 1); // January 1st
    const endDate = new Date(yearInt, 11, 31, 23, 59, 59); // December 31st

    // Get all calc_invoice_line_items for the specified year
    const lineItems = await CalcInvoiceLineItems.findAll({
      include: [
        {
          model: CalcInvoices,
          as: "calcInvoice",
          where: {
            created_at: {
              [Sequelize.Op.between]: [startDate, endDate],
            },
          },
          attributes: [],
        },
      ],
      attributes: ["sale_type", "total_price"],
    });

    // Calculate totals
    let leasedCount = 0;
    let soldCount = 0;
    let leasedAmount = 0;
    let soldAmount = 0;

    lineItems.forEach((item) => {
      const price = parseFloat(item.total_price) || 0;

      if (item.sale_type === "lease") {
        leasedCount++;
        leasedAmount += price;
      } else if (item.sale_type === "sold") {
        soldCount++;
        soldAmount += price;
      }
    });

    const totalCount = leasedCount + soldCount;
    const totalAmount = leasedAmount + soldAmount;

    // Calculate percentages
    const leasedPercentage =
      totalCount > 0 ? (leasedCount / totalCount) * 100 : 0;
    const soldPercentage = totalCount > 0 ? (soldCount / totalCount) * 100 : 0;

    const response = {
      year: yearInt,
      summary: {
        totalItems: totalCount,
        totalAmount: totalAmount,
      },
      leased: {
        count: leasedCount,
        amount: leasedAmount,
        percentage: parseFloat(leasedPercentage.toFixed(2)),
      },
      sold: {
        count: soldCount,
        amount: soldAmount,
        percentage: parseFloat(soldPercentage.toFixed(2)),
      },
    };

    return sendSuccessRespose(
      res,
      response,
      "Leased/Sold analytics retrieved successfully",
      200
    );
  } catch (error) {
    console.error("Get leased/sold analytics error:", error);
    return sendErrorResponse(res, "Failed to get leased/sold analytics", 500);
  }
};

// Get investment vs recouped monthly analytics
exports.getInvestmentRecoupedAnalytics = async (req, res) => {
  try {
    const { year, customer_id } = req.query;

    // Build where clause for filters
    let whereClause = {};

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

    // Get monthly data grouped by month
    // Build where conditions for raw query
    let whereConditions = [];
    let replacements = {};
    
    if (year) {
      whereConditions.push("YEAR(logs_calc_roi.created_at) = :year");
      replacements.year = parseInt(year);
    }
    
    if (customer_id) {
      whereConditions.push("logs_calc_roi.calc_roi_id IN (SELECT id FROM calc_roi WHERE customer_id = :customer_id)");
      replacements.customer_id = parseInt(customer_id);
    }
    
    const whereSql = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";
    
    const monthlyData = await LogsCalcRoi.sequelize.query(
      `SELECT 
        MONTH(logs_calc_roi.created_at) as month,
        SUM(logs_calc_roi.total_sales) as totalInvestment,
        SUM(logs_calc_roi.total_recouped) as totalRecouped
      FROM logs_calc_roi
      ${whereSql}
      GROUP BY MONTH(logs_calc_roi.created_at)
      ORDER BY MONTH(logs_calc_roi.created_at) ASC`,
      {
        type: Sequelize.QueryTypes.SELECT,
        replacements: replacements
      }
    );
    // Create array for all 12 months with default values
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const monthlyChartData = months?.map((monthName, index) => {
      const monthNumber = index + 1;
      const monthData = monthlyData.find(
        (item) => item.month === monthNumber
      );

      return {
        month: monthName,
        investment: parseFloat(monthData?.totalInvestment || 0),
        recouped: parseFloat(monthData?.totalRecouped || 0),
      };
    });

    // Calculate totals for the selected period
    const totalInvestment = monthlyData.reduce(
      (sum, item) => sum + parseFloat(item.totalInvestment || 0),
      0
    );

    const totalRecouped = monthlyData.reduce(
      (sum, item) => sum + parseFloat(item.totalRecouped || 0),
      0
    );

    const response = {
      monthlyData: monthlyChartData,
      totals: {
        totalInvestment: totalInvestment,
        totalRecouped: totalRecouped,
        deficit: totalInvestment - totalRecouped,
      },
      filters: {
        year: year || new Date().getFullYear(),
        customer_id: customer_id || null,
      },
    };

    return sendSuccessRespose(
      res,
      response,
      "Investment vs Recouped analytics retrieved successfully",
      200
    );
  } catch (error) {
    console.error("Get investment recouped analytics error:", error);
    return sendErrorResponse(
      res,
      "Failed to get investment recouped analytics",
      500
    );
  }
};

// Get customers total sales analytics
exports.getCustomersTotalSalesAnalytics = async (req, res) => {
  try {
    const {
      year,
      customer_id,
      start_date,
      end_date,
      page = 1,
      limit = 20,
    } = req.query;
    
    // Build where conditions for raw query
    let whereConditions = [];
    let replacements = {};
    
    // Year filter
    if (year) {
      whereConditions.push("YEAR(logs_calc_roi.created_at) = :year");
      replacements.year = parseInt(year);
    }
    
    // Date range filter
    if (start_date && end_date) {
      try {
        const { startDate, endDate } = parseDateRange(start_date, end_date);
        whereConditions.push("logs_calc_roi.created_at BETWEEN :startDate AND :endDate");
        replacements.startDate = startDate;
        replacements.endDate = endDate;
      } catch (error) {
        return sendErrorResponse(res, error.message, 400);
      }
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
    
    // Get customer sales data with pagination using raw query
    const customerSalesData = await LogsCalcRoi.sequelize.query(
      `SELECT 
        logs_calc_roi.calc_roi_id,
        SUM(logs_calc_roi.total_sales) as total_sales,
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

    const formattedData = customerSalesData.map((item) => {
      const calcRoi = calcRoiMap[item.calc_roi_id];
      const customer = calcRoi?.customer;

      return {
        customer_id: customer?.id || null,
        customer_name: customer
          ? `${customer.first_name} ${customer.last_name}`
          : "Unknown",
        company_name: customer?.company_name || "",
        total_sales: parseFloat(item.total_sales || 0),
        total_months: parseInt(item.total_months || 0),
        sales_not_met: parseInt(item.sales_not_met || 0),
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
        start_date: start_date || null,
        end_date: end_date || null,
      },
    };

    return sendSuccessRespose(
      res,
      response,
      "Customers total sales analytics retrieved successfully",
      200
    );
  } catch (error) {
    console.error("Get customers total sales analytics error:", error);
    return sendErrorResponse(
      res,
      "Failed to get customers total sales analytics",
      500
    );
  }
};

// Get monthly customers sales analytics
exports.getMonthlyCustomersSalesAnalytics = async (req, res) => {
  try {
    const { year, customer_id, page = 1, limit = 20 } = req.query;

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
    
    // Get monthly sales data grouped by month using raw query
    const monthlySalesData = await LogsCalcRoi.sequelize.query(
      `SELECT 
        MONTH(logs_calc_roi.created_at) as month,
        SUM(logs_calc_roi.total_sales) as total_sales,
        AVG(logs_calc_roi.monthly_sales_required) as min_sales
      FROM logs_calc_roi
      ${whereSql}
      GROUP BY MONTH(logs_calc_roi.created_at)
      ORDER BY MONTH(logs_calc_roi.created_at) ASC
      LIMIT :limitValue OFFSET :offset`,
      {
        type: Sequelize.QueryTypes.SELECT,
        replacements: { ...replacements, limitValue, offset }
      }
    );

    // Create array for all 12 months with default values
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const monthlyChartData = months.map((monthName, index) => {
      const monthNumber = index + 1;
      const monthData = monthlySalesData.find(
        (item) => item.month === monthNumber
      );

      const sales = parseFloat(monthData?.total_sales || 0);
      const minSales = parseFloat(monthData?.min_sales || 0);
      const deficit = sales < minSales ? minSales - sales : 0;

      return {
        month: monthName,
        sales: sales,
        min: minSales,
        deficit: deficit,
      };
    });

    // Get total count for pagination - count distinct months using raw query
    const totalCountResult = await LogsCalcRoi.sequelize.query(
      `SELECT COUNT(DISTINCT MONTH(logs_calc_roi.created_at)) as count
      FROM logs_calc_roi
      ${whereSql}`,
      {
        type: Sequelize.QueryTypes.SELECT,
        replacements: replacements
      }
    );

    const totalCount = totalCountResult[0]?.count || 0;

    const response = {
      data: monthlyChartData,
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
      "Monthly customers sales analytics retrieved successfully",
      200
    );
  } catch (error) {
    console.error("Get monthly customers sales analytics error:", error);
    return sendErrorResponse(
      res,
      "Failed to get monthly customers sales analytics",
      500
    );
  }
};
