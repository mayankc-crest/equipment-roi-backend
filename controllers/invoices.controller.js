const {
  invoices: Invoices,
  invoice_line_items: InvoiceLineItems,
  products: Products,
  customers: Customers,
  calc_roi: CalcRoi,
  calc_roi_categories: CalcRoiCategories,
  calc_invoice_line_items: CalcInvoiceLineItems,
  calc_invoices: CalcInvoices,
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
        { customer_id: { [Sequelize.Op.like]: `%${search}%` } },
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
      include: [
        {
          model: Customers,
          as: "customer",
          attributes: ["id", "first_name", "last_name", "company_name"],
        },
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
  try {
    const ids = req.query.ids.split(",").map((id) => id.trim());

    const invoices = await Invoices.findAll({
      where: {
        id: {
          [Sequelize.Op.in]: ids,
        },
      },
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
    // console.log("invoices:::", invoices);

    // Add invoice_type and rename lineItems to invoice_line_items for consistency
    const invoicesWithType = invoices.map((invoice) => {
      const invoiceData = invoice.toJSON();
      return {
        ...invoiceData,
        invoice_type: "qb_invoice",
        invoice_line_items: invoiceData.lineItems || [], // Rename for frontend consistency
      };
    });

    return sendSuccessRespose(
      res,
      invoicesWithType,
      "Invoices fetched successfully",
      200
    );
  } catch (error) {
    console.error("Get all ID invoices error:", error);
    return sendErrorResponse(res, "Failed to get invoices", 500);
  }
};

exports.invoiceCalculate = async (req, res) => {
  try {
    // console.log("Invoice calculate controller has been called:::", req.body);

    const { invoices } = req.body;

    const customerId = invoices[0].customer_id;

    const customer = await Customers.findByPk(customerId);
    if (!customer) {
      return sendErrorResponse(res, "Customer not found", 404);
    }

    const existingCalcRoi = await CalcRoi.findOne({
      where: { customer_id: customerId },
    });

    let calcRoi;

    if (existingCalcRoi) {
      calcRoi = existingCalcRoi;
      console.log(
        `Using existing calc_roi entry for customer ID: ${customerId}`
      );
    } else {
      calcRoi = await CalcRoi.create({
        customer_id: customerId,
      });
      console.log(`Created new calc_roi entry for customer ID: ${customerId}`);
    }

    const createdCalcInvoices = [];

    for (const invoice of invoices) {
      try {
        const existingCalcInvoice = await CalcInvoices.findOne({
          where: { invoice_id: invoice.invoice_id },
        });

        if (existingCalcInvoice) {
          await existingCalcInvoice.update({
            roi_id: calcRoi.id,
            customer_id: customerId,
            route_id: invoice.route_id || 1, // Default route_id if not provided
            sales_rep_id: invoice.sales_rep_id || 1, // Default sales_rep_id if not provided
            total_amount: invoice.total_amount || 0.0,
          });
          createdCalcInvoices.push(existingCalcInvoice);
        } else {
          const calcInvoice = await CalcInvoices.create({
            roi_id: calcRoi.id,
            invoice_id: invoice.invoice_id,
            customer_id: customerId,
            route_id: invoice.route_id || 1, // Default route_id if not provided
            sales_rep_id: invoice.sales_rep_id || 1, // Default sales_rep_id if not provided
            total_amount: invoice.total_amount || 0.0,
          });
          createdCalcInvoices.push(calcInvoice);
          console.log(
            `Created new calc_invoice for invoice ID: ${invoice.invoice_id}`
          );
        }

        const calcInvoiceId = existingCalcInvoice
          ? existingCalcInvoice.id
          : createdCalcInvoices[createdCalcInvoices.length - 1].id;

        // Create calc_invoice_line_items for each line item in the invoice
        if (invoice.line_items && invoice.line_items.length > 0) {
          for (const lineItem of invoice.line_items) {
            // Check if calc_invoice_line_item already exists
            const existingCalcLineItem = await CalcInvoiceLineItems.findOne({
              where: {
                calc_invoice_id: calcInvoiceId,
                line_item_id: lineItem.line_item_id,
              },
            });

            if (existingCalcLineItem) {
              // Update existing calc_invoice_line_item
              await existingCalcLineItem.update({
                product_condition: lineItem.new_used === "new" ? "New" : "Used",
                sale_type: lineItem.sold_lease,
                quantity: parseFloat(lineItem.quantity),
                price: parseFloat(lineItem.unit_price),
                total_price: parseFloat(lineItem.amount),
              });
              console.log(
                `Updated calc_invoice_line_item for line_item_id: ${lineItem.line_item_id}`
              );
            } else {
              // Create new calc_invoice_line_item
              await CalcInvoiceLineItems.create({
                calc_invoice_id: calcInvoiceId,
                line_item_id: lineItem.line_item_id,
                product_condition: lineItem.new_used === "new" ? "New" : "Used",
                sale_type: lineItem.sold_lease,
                quantity: parseFloat(lineItem.quantity),
                price: parseFloat(lineItem.unit_price),
                total_price: parseFloat(lineItem.amount),
              });
              console.log(
                `Created new calc_invoice_line_item for line_item_id: ${lineItem.line_item_id}`
              );
            }
          }
        }
      } catch (error) {
        console.error(`Error processing invoice ${invoice.id}:`, error.message);
        throw error; // Re-throw to stop processing
      }
    }

    return sendSuccessRespose(
      res,
      // {
      //   calc_roi_id: calcRoi.id,
      //   customer_id: customerId,
      //   customer_name:
      //     customer.company_name ||
      //     `${customer.first_name} ${customer.last_name}`,
      //   invoices_count: invoices.length,
      //   message: existingCalcRoi
      //     ? "Updated existing ROI calculation"
      //     : "Created new ROI calculation",
      // },
      "ROI calculation created/updated successfully",
      201
    );
  } catch (error) {
    console.error("Invoice calculate error:", error);
    return sendErrorResponse(res, "Failed to calculate invoice", 500);
  }
};
