const { sendSuccessRespose, sendErrorResponse } = require("../utils/response");
const {
  categories: Categories,
  category_products: CategoryProduct,
  products: Products,
} = require("../models");

exports.createCategory = async (req, res) => {
  try {
    const { name, description, product_ids } = req.body;

    // Create the category
    const category = await Categories.create({ name, description });

    // If product_ids are provided, create the relationships
    if (product_ids && Array.isArray(product_ids) && product_ids.length > 0) {
      // Verify products exist
      const products = await Products.findAll({
        where: { id: product_ids },
      });

      if (products.length !== product_ids.length) {
        return sendErrorResponse(res, "Some products not found", 400);
      }

      // Create category-product relationships
      const categoryProductData = product_ids.map((product_id) => ({
        category_id: category.id,
        product_id,
      }));

      await CategoryProduct.bulkCreate(categoryProductData, {
        ignoreDuplicates: true,
      });
    }

    return sendSuccessRespose(
      res,
      {
        category,
        products_added: product_ids ? product_ids.length : 0,
      },
      "Category created successfully",
      201
    );
  } catch (error) {
    console.error("Create category error:", error);
    return sendErrorResponse(res, "Failed to create category", 500);
  }
};

exports.getCategories = async (req, res) => {
  try {
    const { include_products } = req.query;

    if (include_products === "true") {
      // Get categories with products
      const categories = await Categories.findAll({
        include: [
          {
            model: Products,
            as: "products",
            attributes: [
              "id",
              "name",
              "full_name",
              "description",
              "price",
              "is_active",
            ],
            through: { attributes: [] }, // Don't include junction table attributes
          },
        ],
      });

      return sendSuccessRespose(
        res,
        categories,
        "Categories with products fetched successfully",
        200
      );
    } else {
      // Get categories without products (default)
      const categories = await Categories.findAll();
      return sendSuccessRespose(
        res,
        categories,
        "Categories fetched successfully",
        200
      );
    }
  } catch (error) {
    console.error("Get categories error:", error);
    return sendErrorResponse(res, "Failed to get categories", 500);
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const { drawer } = req.query;
    const category = await Categories.findByPk(req.params.id);

    if (!category) {
      return sendErrorResponse(res, "Category not found", 404);
    }

    // Get products for this category
    const categoryProducts = await CategoryProduct.findAll({
      where: { category_id: req.params.id },
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
    });

    let products = categoryProducts.map((cp) => cp.product);

    // Transform products to drawer format if requested
    if (drawer === "true") {
      products = products.map((product) => ({
        value: product.id,
        label: product.name,
      }));
    }

    return sendSuccessRespose(
      res,
      {
        ...category.toJSON(),
        products,
      },
      drawer === "true"
        ? "Category with products in drawer format fetched successfully"
        : "Category fetched successfully",
      200
    );
  } catch (error) {
    console.error("Get category by ID error:", error);
    return sendErrorResponse(res, "Failed to get category", 500);
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { name, description, product_ids } = req.body;
    const categoryId = req.params.id;

    // Update the category
    const category = await Categories.update(
      { name, description },
      { where: { id: categoryId } }
    );

    // If product_ids are provided, update the relationships
    if (product_ids && Array.isArray(product_ids)) {
      // First, remove all existing relationships for this category
      await CategoryProduct.destroy({
        where: { category_id: categoryId },
      });

      // If new product_ids are provided, create new relationships
      if (product_ids.length > 0) {
        // Verify products exist
        const products = await Products.findAll({
          where: { id: product_ids },
        });

        if (products.length !== product_ids.length) {
          return sendErrorResponse(res, "Some products not found", 400);
        }

        // Create new category-product relationships
        const categoryProductData = product_ids.map((product_id) => ({
          category_id: categoryId,
          product_id,
        }));

        await CategoryProduct.bulkCreate(categoryProductData, {
          ignoreDuplicates: true,
        });
      }
    }

    return sendSuccessRespose(
      res,
      {
        category_id: categoryId,
        products_updated: product_ids ? product_ids.length : 0,
      },
      "Category updated successfully",
      200
    );
  } catch (error) {
    console.error("Update category error:", error);
    return sendErrorResponse(res, "Failed to update category", 500);
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;

    // First, remove all product relationships for this category
    await CategoryProduct.destroy({
      where: { category_id: categoryId },
    });

    // Then delete the category
    const category = await Categories.destroy({ where: { id: categoryId } });

    return sendSuccessRespose(
      res,
      { category_id: categoryId, deleted: true },
      "Category deleted successfully",
      200
    );
  } catch (error) {
    console.error("Delete category error:", error);
    return sendErrorResponse(res, "Failed to delete category", 500);
  }
};
