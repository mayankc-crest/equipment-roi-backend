const { invoices: Invoices } = require("../models");
const { sendSuccessRespose, sendErrorResponse } = require("../utils/response");

exports.getAllInvoices = async (req, res) => {
  try {
    
    const invoices = await Invoices.findAll({
      attributes: [
        "id",
        "txn_id",
        "txn_number",
        "customer_full_name",
        "txn_date",
        "ref_number",
        "subtotal",
        "sales_tax_total",
        "total_amount",
        "balance_remaining",
        "is_paid",
      ],
      order: [["txn_date", "DESC"]],
    });
    return sendSuccessRespose(
      res,
      invoices,
      "Invoices fetched successfully",
      200
    );
  } catch (error) {
    return sendErrorResponse(res, error.message);
  }
};

exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoices.findByPk(req.params.id);
    if (!invoice) {
      return sendErrorResponse(res, "Invoice not found", 404);
    }
    return sendSuccessRespose(
      res,
      invoice,
      "Invoice fetched successfully",
      200
    );
  } catch (error) {
    return sendErrorResponse(res, error.message);
  }
};
