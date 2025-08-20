const { products: Products } = require("../models");
const { sendSuccessRespose, sendErrorResponse } = require("../utils/response");

exports.getAllProducts = async (req, res) => {
  try {
    const products = await Products.findAll({
      attributes: [
        "id",
        "quickbook_list_id",
        "name",
        "full_name",
        "description",
        "price",
        "is_active",
        "account_name",
      ],
      where: {
        is_active: true,
      },
    });
    return sendSuccessRespose(
      res,
      products,
      "Products fetched successfully",
      200
    );
  } catch (error) {
    return sendErrorResponse(res, error.message);
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Products.findByPk(req.params.id);
    if (!product) {
      return sendErrorResponse(res, "Product not found", 404);
    }
    return sendSuccessRespose(
      res,
      product,
      "Product fetched successfully",
      200
    );
  } catch (error) {
    return sendErrorResponse(res, error.message);
  }
};
