const { customers: Customers } = require("../models");
const { sendSuccessRespose, sendErrorResponse } = require("../utils/response");
const Sequelize = require("sequelize");

exports.getAllCustomers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      customer_type,
      job_status,
      search,
      all,
    } = req.query;

    const getAllCustomers = all === "true";
    // Build where clause
    const whereClause = {};
    if (customer_type) whereClause.customer_type = customer_type;
    if (job_status) whereClause.job_status = job_status;
    if (search) {
      whereClause[Sequelize.Op.or] = [
        { first_name: { [Sequelize.Op.like]: `%${search}%` } },
        { last_name: { [Sequelize.Op.like]: `%${search}%` } },
        { company_name: { [Sequelize.Op.like]: `%${search}%` } },
        { email: { [Sequelize.Op.like]: `%${search}%` } },
      ];
    }

    if (getAllCustomers) {
      const customers = await Customers.findAll({
        where: whereClause,
        attributes: [
          "id",
          "first_name",
          "last_name",
          "company_name",
          "email",
          "phone",
          "customer_type",
          "job_status",
          "balance",
          "total_balance",
          "quickbook_list_id",
          "createdAt",
          "updatedAt",
        ],
      });
      return sendSuccessRespose(
        res,
        customers,
        "Customers fetched successfully",
        200
      );
    } else {
      const offset = (page - 1) * limit;
      const { count, rows } = await Customers.findAndCountAll({
        where: whereClause,
        attributes: [
          "id",
          "first_name",
          "last_name",
          "company_name",
          "email",
          "phone",
          "customer_type",
          "job_status",
          "balance",
          "total_balance",
          "quickbook_list_id",
          "createdAt",
          "updatedAt",
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["createdAt", "DESC"]],
      });

      const totalPages = Math.ceil(count / limit);

      return sendSuccessRespose(
        res,
        {
          customers: rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalCustomers: count,
            customersPerPage: parseInt(limit),
          },
        },
        "Customers fetched successfully",
        200
      );
    }
  } catch (error) {
    console.error("Get all customers error:", error);
    return sendErrorResponse(res, "Failed to get customers", 500);
  }
};

exports.getCustomerById = async (req, res) => {
  try {
    const customer = await Customers.findByPk(req.params.id);
    if (!customer) {
      return sendErrorResponse(res, "Customer not found", 404);
    }
    return sendSuccessRespose(
      res,
      customer,
      "Customer fetched successfully",
      200
    );
  } catch (error) {
    console.error("Get customer by ID error:", error);
    return sendErrorResponse(res, "Failed to get customer", 500);
  }
};

// Get customer statistics (admin/super only)
exports.getCustomerStats = async (req, res) => {
  try {
    const totalCustomers = await Customers.count();

    // Get customer type distribution
    const customerTypeStats = await Customers.findAll({
      attributes: [
        "customer_type",
        [Sequelize.fn("COUNT", Sequelize.col("id")), "count"],
      ],
      group: ["customer_type"],
    });

    const customerTypeDistribution = {};
    customerTypeStats.forEach((stat) => {
      customerTypeDistribution[stat.customer_type] = parseInt(
        stat.dataValues.count
      );
    });

    // Get job status distribution
    const jobStatusStats = await Customers.findAll({
      attributes: [
        "job_status",
        [Sequelize.fn("COUNT", Sequelize.col("id")), "count"],
      ],
      group: ["job_status"],
    });

    const jobStatusDistribution = {};
    jobStatusStats.forEach((stat) => {
      jobStatusDistribution[stat.job_status] = parseInt(stat.dataValues.count);
    });

    // Calculate total balance
    const totalBalanceResult = await Customers.findOne({
      attributes: [
        [Sequelize.fn("SUM", Sequelize.col("total_balance")), "totalBalance"],
      ],
    });
    const totalBalance =
      parseFloat(totalBalanceResult.dataValues.totalBalance) || 0;

    return sendSuccessRespose(
      res,
      {
        totalCustomers,
        totalBalance,
        customerTypeDistribution,
        jobStatusDistribution,
      },
      "Customer statistics retrieved successfully",
      200
    );
  } catch (error) {
    console.error("Get customer stats error:", error);
    return sendErrorResponse(res, "Failed to get customer statistics", 500);
  }
};
