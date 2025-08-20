const { customers: Customers } = require("../models");
const { sendSuccessRespose, sendErrorResponse } = require("../utils/response");

exports.getAllCustomers = async (req, res) => {
  try {
    const customers = await Customers.findAll({
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
      ],
    });
    return sendSuccessRespose(
      res,
      customers,
      "Customers fetched successfully",
      200
    );
  } catch (error) {
    return sendErrorResponse(res, error.message);
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
    return sendErrorResponse(res, error.message);
  }
};
