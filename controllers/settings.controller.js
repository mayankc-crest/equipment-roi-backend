const { settings: Settings } = require("../models");
const { sendSuccessRespose, sendErrorResponse } = require("../utils/response");

// Get settings (there should only be one settings record)
exports.getSettings = async (req, res) => {
  try {
    const settings = await Settings.findOne({
      order: [["id", "ASC"]], // Get the first (and should be only) record
    });

    if (!settings) {
      return sendErrorResponse(res, "Settings not found", 404);
    }

    return sendSuccessRespose(
      res,
      settings,
      "Settings retrieved successfully",
      200
    );
  } catch (error) {
    console.error("Get settings error:", error);
    return sendErrorResponse(res, "Failed to get settings", 500);
  }
};

// Update settings
exports.updateSettings = async (req, res) => {
  try {
    const {
      monthly_payment_divider,
      monthly_sales_required_multiplier,
      monthly_cost_recouped_divider,
      net_cost_left_divider,
      equipment_product_inactive,
      customer_inactive,
    } = req.body;

    // Find the settings record (should be only one)
    const settings = await Settings.findOne({
      order: [["id", "ASC"]],
    });

    if (!settings) {
      return sendErrorResponse(res, "Settings not found", 404);
    }

    // Update only provided fields
    const updateData = {};
    if (monthly_payment_divider !== undefined) {
      updateData.monthly_payment_divider = parseFloat(monthly_payment_divider);
    }
    if (monthly_sales_required_multiplier !== undefined) {
      updateData.monthly_sales_required_multiplier = parseFloat(
        monthly_sales_required_multiplier
      );
    }
    if (monthly_cost_recouped_divider !== undefined) {
      updateData.monthly_cost_recouped_divider = parseFloat(
        monthly_cost_recouped_divider
      );
    }
    if (net_cost_left_divider !== undefined) {
      updateData.net_cost_left_divider = parseFloat(net_cost_left_divider);
    }
    if (equipment_product_inactive !== undefined) {
      updateData.equipment_product_inactive = parseInt(
        equipment_product_inactive
      );
    }
    if (customer_inactive !== undefined) {
      updateData.customer_inactive = parseInt(customer_inactive);
    }

    // Update the settings
    await settings.update(updateData);

    return sendSuccessRespose(
      res,
      settings,
      "Settings updated successfully",
      200
    );
  } catch (error) {
    console.error("Update settings error:", error);
    return sendErrorResponse(res, "Failed to update settings", 500);
  }
};
