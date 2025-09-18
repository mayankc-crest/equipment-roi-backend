const {
  invoices: Invoices,
  invoice_line_items: InvoiceLineItems,
  products: Products,
  customers: Customers,
  categories: Categories,
  calc_roi: CalcRoi,
  calc_roi_categories: CalcRoiCategories,
  calc_invoice_line_items: CalcInvoiceLineItems,
  calc_invoices: CalcInvoices,
  logs_calc_roi: LogsCalcRoi,
} = require("../models");
const { getInvoicesIds } = require("../services/invoices.services");
const { sendSuccessRespose, sendErrorResponse } = require("../utils/response");
const Sequelize = require("sequelize");

exports.getAllInvoices = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      is_paid,
      search,
      invoice_type,
      customer_id,
    } = req.query;
    const offset = (page - 1) * limit;

    // Handle calc_invoice type
    if (invoice_type === "calc_invoice") {
      // Build where clause for calc_roi
      const whereClause = {};
      if (search) {
        whereClause[Sequelize.Op.or] = [
          { "$customer.first_name$": { [Sequelize.Op.like]: `%${search}%` } },
          { "$customer.last_name$": { [Sequelize.Op.like]: `%${search}%` } },
          { "$customer.company_name$": { [Sequelize.Op.like]: `%${search}%` } },
        ];
      }
      if (customer_id !== "all") {
        // console.log("in the get all invoices :::", customer_id);
        whereClause.customer_id = customer_id;
      }
      const { count, rows } = await CalcRoi.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Customers,
            as: "customer",
            attributes: ["id", "first_name", "last_name", "company_name"],
          },
          {
            model: CalcInvoices,
            as: "calcInvoices",
            attributes: ["id"],
            required: false, // LEFT JOIN to include ROI even if no calc_invoices exist
          },
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["created_at", "DESC"]],
        distinct: true, // Important for correct count when using includes
      });
      // console.log("the found invoices are::", rows);
      // Transform data for calc_invoice response
      const calcInvoicesWithType = rows.map((calcRoi) => {
        const totalSales = calcRoi.total_sales;
        const customer = calcRoi.customer;
        const totalInvoices = calcRoi.calcInvoices
          ? calcRoi.calcInvoices.length
          : 0;

        return {
          id: calcRoi.id,
          customer_name: customer
            ? `${customer.first_name || ""} ${customer.last_name || ""}`.trim()
            : "",
          company_name: customer ? customer.company_name : "",
          total_invoices_included: totalInvoices,
          total_sales: totalSales,
          created_at: calcRoi.created_at,
          updated_at: calcRoi.updated_at,
          invoice_type: "calc_invoice",
        };
      });

      const totalPages = Math.ceil(count / limit);

      return sendSuccessRespose(
        res,
        {
          invoices: calcInvoicesWithType,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalInvoices: count,
            invoicesPerPage: parseInt(limit),
          },
        },
        "Calc invoices fetched successfully",
        200
      );
    }

    // Handle qb_invoice type (default behavior)
    // Build where clause
    const whereClause = {};
    if (is_paid !== undefined) whereClause.is_paid = is_paid;
    if (search) {
      whereClause[Sequelize.Op.or] = [
        { customer_full_name: { [Sequelize.Op.like]: `%${search}%` } },
        { txn_number: { [Sequelize.Op.like]: `%${search}%` } },
        { ref_number: { [Sequelize.Op.like]: `%${search}%` } },
        // { customer_id: { [Sequelize.Op.like]: `%${search}%` } },
      ];
    }
    if (customer_id !== "all") {
      whereClause.customer_id = customer_id;
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
        "is_calculated",
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
    const { invoice_id: cal_invoice_id } = req.query;
    const { is_edit } = req.body;
    if (cal_invoice_id) {
      const {
        net_cost,
        net_products_total,
        net_equipment_total,
        monthly_payment,
        monthly_sales_required,
        total_sales,
        total_recouped,
        total_months,
        sales_not_met,
        net_cost_left,
        payback_period,
      } = req.body;

      const roi = await CalcRoi.findByPk(parseInt(cal_invoice_id));
      if (!roi) {
        return sendErrorResponse(res, "ROI not found", 404);
      }

      if (is_edit) {
        // Create log entry in logs_calc_roi table with values from request body
        console.log("In the is_edit block");

        await roi.update({
          net_cost: net_cost || null,
          net_products_total: net_products_total || null,
          net_equipment_total: net_equipment_total || null,
          monthly_payment: monthly_payment || null,
          monthly_sales_required: monthly_sales_required || null,
          total_sales: total_sales || null,
          total_recouped: total_recouped || null,
          total_months: total_months || null,
          sales_not_met: sales_not_met || null,
          net_cost_left: net_cost_left || null,
          payback_period: payback_period || null,
        });

        await LogsCalcRoi.create({
          calc_roi_id: roi.id,
          start_date: roi.start_date,
          net_cost: net_cost || null,
          net_products_total: net_products_total || null,
          net_equipment_total: net_equipment_total || null,
          monthly_payment: monthly_payment || null,
          monthly_sales_required: monthly_sales_required || null,
          total_sales: total_sales || null,
          total_recouped: total_recouped || null,
          total_months: total_months || null,
          sales_not_met: sales_not_met || null,
          net_cost_left: net_cost_left || null,
          payback_period: payback_period || null,
        });

        return sendSuccessRespose(
          res,
          { calc_roi_id: roi.id },
          "ROI updated successfully",
          200
        );
      }

      await LogsCalcRoi.create({
        calc_roi_id: roi.id,
        start_date: roi.start_date,
        net_cost: net_cost || null,
        net_products_total: net_products_total || null,
        net_equipment_total: net_equipment_total || null,
        monthly_payment: monthly_payment || null,
        monthly_sales_required: monthly_sales_required || null,
        total_sales: total_sales || null,
        total_recouped: total_recouped || null,
        total_months: total_months || null,
        sales_not_met: sales_not_met || null,
        net_cost_left: net_cost_left || null,
        payback_period: payback_period || null,
      });

      const toDecimal = (value) =>
        value === undefined || value === null || value === ""
          ? null
          : parseFloat(value);
      const toInteger = (value) =>
        value === undefined || value === null || value === ""
          ? null
          : parseInt(value);
      const toNumber = (value) =>
        value === undefined || value === null || value === ""
          ? null
          : Number(value);

      const addDecimal = (existing, incoming) => {
        if (incoming === null) return existing; // no change if nothing provided
        const existingNum =
          existing === null || existing === undefined
            ? 0
            : parseFloat(existing);
        const result = existingNum + parseFloat(incoming);
        return result;
      };

      const addInteger = (existing, incoming) => {
        if (incoming === null) return existing; // no change if nothing provided
        const existingNum =
          existing === null || existing === undefined ? 0 : parseInt(existing);
        const result = existingNum + parseInt(incoming);
        return result;
      };

      const current = roi.toJSON();

      const nextValues = {
        net_cost: addDecimal(current.net_cost, toDecimal(net_cost)),
        net_products_total: addDecimal(
          current.net_products_total,
          toDecimal(net_products_total)
        ),
        net_equipment_total: addDecimal(
          current.net_equipment_total,
          toDecimal(net_equipment_total)
        ),
        monthly_payment: addDecimal(
          current.monthly_payment,
          toDecimal(monthly_payment)
        ),
        monthly_sales_required: addDecimal(
          current.monthly_sales_required,
          toDecimal(monthly_sales_required)
        ),
        total_sales: addDecimal(current.total_sales, toDecimal(total_sales)),
        total_recouped: addDecimal(
          current.total_recouped,
          toDecimal(total_recouped)
        ),
        total_months: addInteger(current.total_months, toInteger(total_months)),
        sales_not_met: addInteger(
          current.sales_not_met,
          toInteger(sales_not_met)
        ),
        net_cost_left: addDecimal(
          current.net_cost_left,
          toDecimal(net_cost_left)
        ),
        payback_period: addInteger(
          current.payback_period,
          toInteger(payback_period)
        ),
      };

      await roi.update(nextValues);

      return sendSuccessRespose(
        res,
        { calc_roi_id: roi.id },
        "ROI updated successfully",
        200
      );
    }
    const { invoices, start_date } = req.body;
    console.log("start_date:::", start_date);

    const invoicesIds = getInvoicesIds(invoices);
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
      // logic to add the start_date
      if (start_date) {
        const isValidDateOnly = (value) =>
          typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
        const incomingStr = String(start_date);
        if (isValidDateOnly(incomingStr)) {
          const existingStr = calcRoi.start_date
            ? String(calcRoi.start_date).slice(0, 10)
            : null;
          if (!existingStr || incomingStr < existingStr) {
            await calcRoi.update({ start_date: incomingStr });
          }
        }
      }
      console.log(
        `Using existing calc_roi entry for customer ID: ${customerId}`
      );
    } else {
      calcRoi = await CalcRoi.create({
        customer_id: customerId,
        start_date: start_date,
      });
      console.log(`Created new calc_roi entry for customer ID: ${customerId}`);
    }

    const createdCalcInvoices = [];

    for (const invoice of invoices) {
      try {
        const existingCalcInvoice = await CalcInvoices.findOne({
          where: { invoice_id: invoice.invoice_id },
        });
        console.log(
          `checked the invoice ${invoice.invoice_id}: `,
          existingCalcInvoice
        );

        if (existingCalcInvoice) {
          await existingCalcInvoice.update({
            roi_id: calcRoi.id,
            customer_id: customerId,
            route_id: invoice.route_id || 1, // Default route_id if not provided
            sales_rep_id: invoice.sales_rep_id || 1, // Default sales_rep_id if not provided
            total_amount: invoice.total_amount || 0.0,
            installation_date: invoice.due_date || null,
          });
          await Invoices.update(
            { is_calculated: true },
            { where: { id: invoice.invoice_id } }
          );
          createdCalcInvoices.push(existingCalcInvoice);
        } else {
          const calcInvoice = await CalcInvoices.create({
            roi_id: calcRoi.id,
            invoice_id: invoice.invoice_id,
            customer_id: customerId,
            route_id: invoice.route_id || 1, // Default route_id if not provided
            sales_rep_id: invoice.sales_rep_id || 1, // Default sales_rep_id if not provided
            total_amount: invoice.total_amount || 0.0,
            installation_date: invoice.due_date || null,
          });
          await Invoices.update(
            { is_calculated: true },
            { where: { id: invoice.invoice_id } }
          );
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

    console.log(`the created invoices are: ${createdCalcInvoices}`);
    return sendSuccessRespose(
      res,
      {
        calc_roi_id: calcRoi.id,
        // customer_id: customerId,
        // customer_name:
        //   customer.company_name ||
        //   `${customer.first_name} ${customer.last_name}`,
        // invoices_count: invoices.length,
        // message: existingCalcRoi
        //   ? "Updated existing ROI calculation"
        //   : "Created new ROI calculation",
      },
      "ROI calculation created/updated successfully",
      201
    );
  } catch (error) {
    console.error("Invoice calculate error:", error);
    return sendErrorResponse(res, "Failed to calculate invoice", 500);
  }
};

exports.getInvoiceCalculate = async (req, res) => {
  try {
    console.log(
      "Get invoice calculate controller has been called:::",
      req.params
    );

    const { id: roiId } = req.params;

    // Validate input
    if (!roiId) {
      return sendErrorResponse(res, "ROI ID is required", 400);
    }

    // Find the calc_roi with all related data
    const calcRoi = await CalcRoi.findByPk(roiId, {
      include: [
        {
          model: Customers,
          as: "customer",
          attributes: ["id", "first_name", "last_name", "company_name"],
        },
        {
          model: CalcInvoices,
          as: "calcInvoices",
          include: [
            {
              model: CalcInvoiceLineItems,
              as: "lineItems",
              include: [
                {
                  model: InvoiceLineItems,
                  as: "lineItem",
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
                },
              ],
            },
          ],
        },
        {
          model: CalcRoiCategories,
          as: "calcRoiCategories",
          include: [
            {
              model: Categories,
              as: "category",
              attributes: ["id", "name"],
            },
          ],
        },
      ],
    });

    if (!calcRoi) {
      return sendErrorResponse(res, "ROI calculation not found", 404);
    }

    // Transform the data to match the structure expected by frontend
    const customer = calcRoi.customer;
    const invoices = calcRoi.calcInvoices || [];
    const categories = calcRoi.calcRoiCategories || [];

    // Transform invoices to match the structure from invoiceCalculate
    const transformedInvoices = invoices.map((calcInvoice) => {
      const lineItems = calcInvoice.lineItems || [];

      // Transform line items to match the structure from invoiceCalculate
      const transformedLineItems = lineItems.map((calcLineItem) => {
        const originalLineItem = calcLineItem.lineItem;
        const product = originalLineItem?.product;

        return {
          line_item_id: calcLineItem.line_item_id,
          line_number: originalLineItem?.line_number || 0,
          quantity: calcLineItem.quantity.toString(),
          unit_price: calcLineItem.price.toString(),
          amount: calcLineItem.total_price,
          new_used: calcLineItem.product_condition.toLowerCase(),
          sold_lease: calcLineItem.sale_type,
          product: product
            ? {
                id: product.id,
                name: product.name,
                full_name: product.full_name,
                description: product.description || "",
                price: product.price || "0.00",
                is_active: product.is_active,
                account_name: product.account_name || "",
              }
            : null,
        };
      });

      return {
        invoice_id: calcInvoice.invoice_id,
        customer_id: calcInvoice.customer_id,
        route_id: calcInvoice.route_id,
        sales_rep_id: calcInvoice.sales_rep_id,
        total_amount: calcInvoice.total_amount,
        line_items: transformedLineItems,
      };
    });

    // Transform categories
    const transformedCategories = categories.map((calcRoiCategory) => ({
      id: calcRoiCategory.category.id,
      name: calcRoiCategory.category.name,
    }));

    // Build response matching invoiceCalculate structure
    const response = {
      calc_roi_id: calcRoi.id,
      customer_id: calcRoi.customer_id,
      customer_name: customer
        ? customer.company_name ||
          `${customer.first_name} ${customer.last_name}`
        : "",
      invoices: transformedInvoices,
      categories: transformedCategories,
      invoices_count: invoices.length,
      categories_count: categories.length,
      created_at: calcRoi.created_at,
      updated_at: calcRoi.updated_at,
    };

    return sendSuccessRespose(
      res,
      response,
      "ROI calculation data retrieved successfully",
      200
    );
  } catch (error) {
    console.error("Get invoice calculate error:", error);
    return sendErrorResponse(
      res,
      "Failed to retrieve ROI calculation data",
      500
    );
  }
};

exports.invoiceCategory = async (req, res) => {
  try {
    console.log("Invoice category controller has been called:::", req.body);

    const { id: roiId } = req.params;
    const { category_id } = req.body;

    // Validate input
    if (!roiId) {
      return sendErrorResponse(res, "ROI ID is required", 400);
    }

    if (
      !category_id ||
      !Array.isArray(category_id) ||
      category_id.length === 0
    ) {
      return sendErrorResponse(res, "Category IDs array is required", 400);
    }

    // Check if calc_roi exists
    const existingCalcRoi = await CalcRoi.findByPk(roiId);
    if (!existingCalcRoi) {
      return sendErrorResponse(res, "ROI calculation not found", 404);
    }

    // Get existing categories for this ROI
    const existingCategories = await CalcRoiCategories.findAll({
      where: { roi_id: roiId },
      attributes: ["category_id"],
    });

    const existingCategoryIds = existingCategories.map(
      (cat) => cat.category_id
    );
    console.log(
      `Existing categories for ROI ID ${roiId}:`,
      existingCategoryIds
    );

    // Find categories that need to be added (not already existing)
    const categoriesToAdd = category_id.filter(
      (categoryId) => !existingCategoryIds.includes(categoryId)
    );
    console.log(`Categories to add:`, categoriesToAdd);

    // Create only new category entries
    const createdCategories = [];

    for (const categoryId of categoriesToAdd) {
      // Check if category exists in categories table
      const category = await Categories.findByPk(categoryId);
      if (!category) {
        console.log(
          `Category with ID ${categoryId} not found in categories table, skipping`
        );
        continue;
      }

      // Check if this combination already exists (double-check)
      const existingEntry = await CalcRoiCategories.findOne({
        where: {
          roi_id: roiId,
          category_id: categoryId,
        },
      });

      if (existingEntry) {
        console.log(
          `Category ${categoryId} already exists for ROI ${roiId}, skipping`
        );
        continue;
      }

      // Create calc_roi_category entry
      const calcRoiCategory = await CalcRoiCategories.create({
        roi_id: roiId,
        category_id: categoryId,
      });
      createdCategories.push(calcRoiCategory);
      console.log(
        `Created new category association: ROI ${roiId} -> Category ${categoryId}`
      );
    }

    return sendSuccessRespose(
      res,
      {
        roi_id: roiId,
        categories_added: createdCategories.length,
        categories_skipped: category_id.length - createdCategories.length,
        total_requested: category_id.length,
        category_ids: category_id,
        message: `Successfully processed categories. Added: ${
          createdCategories.length
        }, Skipped (already exist): ${
          category_id.length - createdCategories.length
        }`,
      },
      "Categories processed successfully",
      200
    );
  } catch (error) {
    console.error("Invoice category error:", error);
    return sendErrorResponse(
      res,
      "Failed to add categories to ROI calculation",
      500
    );
  }
};

// Get sales/lease percentage by year
exports.getSalesPercentageByYear = async (req, res) => {
  try {
    const { year } = req.query;

    console.log(
      "Get sales percentage by year controller has been called:::",
      req.query
    );
    // Validate year parameter
    if (!year) {
      return sendErrorResponse(res, "Year parameter is required", 400);
    }

    const yearInt = parseInt(year);
    if (isNaN(yearInt) || yearInt < 1900 || yearInt > 2100) {
      return sendErrorResponse(res, "Invalid year format", 400);
    }

    // Get the start and end dates for the year
    const startDate = new Date(yearInt, 0, 1); // January 1st
    const endDate = new Date(yearInt, 11, 31, 23, 59, 59); // December 31st

    // Get all calc_invoices for the specified year
    const calcInvoices = await CalcInvoices.findAll({
      where: {
        created_at: {
          [Sequelize.Op.between]: [startDate, endDate],
        },
      },
      include: [
        {
          model: CalcInvoiceLineItems,
          as: "lineItems",
          attributes: ["sale_type", "product_condition", "total_price"],
        },
      ],
    });

    // Calculate totals
    let totalSold = 0;
    let totalLeased = 0;
    let totalNew = 0;
    let totalUsed = 0;
    let totalAmount = 0;

    calcInvoices.forEach((invoice) => {
      totalAmount += parseFloat(invoice.total_amount) || 0;

      invoice.lineItems.forEach((lineItem) => {
        const price = parseFloat(lineItem.total_price) || 0;

        if (lineItem.sale_type === "sold") {
          totalSold += price;
        } else if (lineItem.sale_type === "lease") {
          totalLeased += price;
        }

        if (lineItem.product_condition === "New") {
          totalNew += price;
        } else if (lineItem.product_condition === "Used") {
          totalUsed += price;
        }
      });
    });

    const grandTotal = totalSold + totalLeased;

    // Calculate percentages
    const soldPercentage = grandTotal > 0 ? (totalSold / grandTotal) * 100 : 0;
    const leasedPercentage =
      grandTotal > 0 ? (totalLeased / grandTotal) * 100 : 0;
    const newPercentage = grandTotal > 0 ? (totalNew / grandTotal) * 100 : 0;
    const usedPercentage = grandTotal > 0 ? (totalUsed / grandTotal) * 100 : 0;

    return sendSuccessRespose(
      res,
      {
        year: yearInt,
        summary: {
          totalInvoices: calcInvoices.length,
          totalAmount: totalAmount,
          grandTotal: grandTotal,
        },
        salesBreakdown: {
          sold: {
            amount: totalSold,
            percentage: parseFloat(soldPercentage.toFixed(2)),
          },
          leased: {
            amount: totalLeased,
            percentage: parseFloat(leasedPercentage.toFixed(2)),
          },
        },
        productConditionBreakdown: {
          new: {
            amount: totalNew,
            percentage: parseFloat(newPercentage.toFixed(2)),
          },
          used: {
            amount: totalUsed,
            percentage: parseFloat(usedPercentage.toFixed(2)),
          },
        },
      },
      "Sales percentage data retrieved successfully",
      200
    );
  } catch (error) {
    console.error("Get sales percentage error:", error);
    return sendErrorResponse(res, "Failed to get sales percentage data", 500);
  }
};

exports.getInvoiceCalculateForView = async (req, res) => {
  try {
    const { id: roiId } = req.params;
    const calcRoi = await CalcRoi.findByPk(roiId, {
      include: [
        {
          model: Customers,
          as: "customer",
        },
      ],
    });

    if (!calcRoi) {
      return sendErrorResponse(res, "ROI calculation not found", 404);
    }

    const totalCalculatedInvoices = await CalcInvoices.count({
      where: { roi_id: roiId },
    });

    const payload = {
      ...calcRoi.toJSON(),
      total_calculated_invoices: totalCalculatedInvoices,
    };

    return sendSuccessRespose(
      res,
      payload,
      "Invoice calculate retrieved successfully",
      200
    );
  } catch (error) {
    console.error("Get invoice calculate error:", error);
    return sendErrorResponse(res, "Failed to get invoice calculate", 500);
  }
};

// Get detailed calculated invoice data for editing
exports.getCalcInvoiceDetails = async (req, res) => {
  try {
    const { id: roiId } = req.params;

    // Find the calc_roi with all related data
    const calcRoi = await CalcRoi.findByPk(roiId, {
      include: [
        {
          model: Customers,
          as: "customer",
          attributes: ["id", "first_name", "last_name", "company_name"],
        },
        {
          model: CalcRoiCategories,
          as: "calcRoiCategories",
          include: [
            {
              model: Categories,
              as: "category",
              attributes: ["id", "name", "description"],
            },
          ],
        },
        {
          model: CalcInvoices,
          as: "calcInvoices",
          include: [
            {
              model: Invoices,
              as: "invoice",
              attributes: ["id", "txn_number", "txn_id", "ref_number"],
            },
            {
              model: CalcInvoiceLineItems,
              as: "lineItems",
              include: [
                {
                  model: InvoiceLineItems,
                  as: "lineItem",
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
                },
              ],
            },
          ],
        },
      ],
    });

    if (!calcRoi) {
      return sendErrorResponse(res, "ROI calculation not found", 404);
    }

    // Transform the data to match the structure expected by frontend
    const customer = calcRoi.customer;
    const invoices = calcRoi.calcInvoices || [];

    // Transform invoices to match the structure from getAllIDInvoices
    const transformedInvoices = invoices.map((calcInvoice) => {
      const lineItems = calcInvoice.lineItems || [];

      // Transform line items to match the structure from getAllIDInvoices
      const transformedLineItems = lineItems.map((calcLineItem) => {
        const originalLineItem = calcLineItem.lineItem;
        const product = originalLineItem?.product;

        return {
          id: calcLineItem.line_item_id,
          line_number: originalLineItem?.line_number || 0,
          quantity: calcLineItem.quantity.toString(),
          unit_price: calcLineItem.price.toString(),
          amount: calcLineItem.total_price,
          new_used: calcLineItem.product_condition.toLowerCase(),
          sold_lease: calcLineItem.sale_type,
          product: product
            ? {
                id: product.id,
                name: product.name,
                full_name: product.full_name,
                description: product.description || "",
                price: product.price || "0.00",
                is_active: product.is_active,
                account_name: product.account_name || "",
              }
            : null,
        };
      });
      // console.log("the calcInvoice is here::", calcInvoice);
      return {
        invoice_id: calcInvoice.invoice_id,
        installation_date: calcInvoice.installation_date,
        txn_number: calcInvoice.invoice?.txn_number || null,
        txn_id: calcInvoice.invoice?.txn_id || null,
        ref_number: calcInvoice.invoice?.ref_number || null,
        customer_id: calcInvoice.customer_id,
        customer_name: customer
          ? `${customer.first_name} ${customer.last_name}`
          : "",
        route_id: calcInvoice.route_id,
        sales_rep_id: calcInvoice.sales_rep_id,
        total_amount: calcInvoice.total_amount,
        line_items: transformedLineItems,
      };
    });

    // Extract category IDs from calcRoiCategories
    const categoryIds = calcRoi.calcRoiCategories
      ? calcRoi.calcRoiCategories.map((roiCategory) => roiCategory.category_id)
      : [];

    // Build response matching getAllIDInvoices structure
    const response = {
      calc_roi_id: calcRoi.id,
      customer_id: calcRoi.customer_id,
      customer_name: customer
        ? customer.company_name ||
          `${customer.first_name} ${customer.last_name}`
        : "",
      start_date: calcRoi.start_date,
      category_ids: categoryIds,
      invoices: transformedInvoices,
      invoices_count: invoices.length,
      created_at: calcRoi.created_at,
      updated_at: calcRoi.updated_at,
    };

    return sendSuccessRespose(
      res,
      response,
      "Calculated invoice details retrieved successfully",
      200
    );
  } catch (error) {
    console.error("Get calc invoice details error:", error);
    return sendErrorResponse(
      res,
      "Failed to retrieve calculated invoice details",
      500
    );
  }
};
