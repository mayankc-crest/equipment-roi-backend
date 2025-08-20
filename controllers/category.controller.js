const { sendSuccessRespose, sendErrorResponse } = require("../utils/response");
const { categories: Categories } = require("../models");

exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const category = await Categories.create({ name, description });
    return sendSuccessRespose(
      res,
      category,
      "Category created successfully",
      201
    );
  } catch (error) {
    return sendErrorResponse(res, error.message);
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await Categories.findAll();
    return sendSuccessRespose(
      res,
      categories,
      "Categories fetched successfully",
      200
    );
  } catch (error) {
    return sendErrorResponse(res, error.message);
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const category = await Categories.findByPk(req.params.id);
    return sendSuccessRespose(
      res,
      category,
      "Category fetched successfully",
      200
    );
  } catch (error) {
    return sendErrorResponse(res, error.message);
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const category = await Categories.update(
      { name, description },
      { where: { id: req.params.id } }
    );
    return sendSuccessRespose(
      res,
      category,
      "Category updated successfully",
      200
    );
  } catch (error) {
    return sendErrorResponse(res, error.message);
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const category = await Categories.destroy({ where: { id: req.params.id } });
    return sendSuccessRespose(
      res,
      category,
      "Category deleted successfully",
      200
    );
  } catch (error) {
    return sendErrorResponse(res, error.message);
  }
};
