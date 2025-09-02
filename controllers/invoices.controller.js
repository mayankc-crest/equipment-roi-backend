const {
  invoices: Invoices,
  invoice_line_items: InvoiceLineItems,
  products: Products,
} = require("../models");
const { sendSuccessRespose, sendErrorResponse } = require("../utils/response");
const Sequelize = require("sequelize");

exports.getAllInvoices = async (req, res) => {
  try {
    const { page = 1, limit = 10, is_paid, search } = req.query;
    const offset = (page - 1) * limit;

    console.log("get All Invoices controller has been called:::");
    // Build where clause
    const whereClause = {};
    if (is_paid !== undefined) whereClause.is_paid = is_paid;
    if (search) {
      whereClause[Sequelize.Op.or] = [
        { customer_full_name: { [Sequelize.Op.like]: `%${search}%` } },
        { txn_number: { [Sequelize.Op.like]: `%${search}%` } },
        { ref_number: { [Sequelize.Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Invoices.findAndCountAll({
      where: whereClause,
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
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["txn_date", "DESC"]],
    });

    // Add invoice_type to each invoice
    const invoicesWithType = rows.map((invoice) => ({
      ...invoice.toJSON(),
      invoice_type: "qb_invoice",
    }));

    const totalPages = Math.ceil(count / limit);

    return sendSuccessRespose(
      res,
      {
        invoices: invoicesWithType,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalInvoices: count,
          invoicesPerPage: parseInt(limit),
        },
      },
      "Invoices fetched successfully",
      200
    );
  } catch (error) {
    console.error("Get all invoices error:", error);
    return sendErrorResponse(res, "Failed to get invoices", 500);
  }
};

exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoices.findByPk(req.params.id, {
      include: [
        {
          model: InvoiceLineItems,
          as: "lineItems",
          include: [
            {
              model: Products,
              as: "product",
              attributes: [
                "id",
                "name",
                "full_name",
                "description",
                "price",
                "is_active",
                "account_name",
              ],
            },
          ],
          attributes: ["id", "line_number", "quantity", "unit_price", "amount"],
        },
      ],
    });

    if (!invoice) {
      return sendErrorResponse(res, "Invoice not found", 404);
    }

    // Add invoice_type to the invoice and rename lineItems to invoice_line_items for consistency
    const invoiceData = invoice.toJSON();
    const invoiceWithType = {
      ...invoiceData,
      invoice_type: "qb_invoice",
      invoice_line_items: invoiceData.lineItems || [], // Rename for frontend consistency
    };

    return sendSuccessRespose(
      res,
      invoiceWithType,
      "Invoice fetched successfully",
      200
    );
  } catch (error) {
    console.error("Get invoice by ID error:", error);
    return sendErrorResponse(res, "Failed to fetch invoice", 500);
  }
};


exports.getAllIDInvoices = async (req, res) => {
  try{
    
  }
  catch{}
}