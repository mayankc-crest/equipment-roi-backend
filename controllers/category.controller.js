const { sendSuccessRespose, sendErrorResponse } = require("../utils/response");
const {
  categories: Categories,
  category_products: CategoryProduct,
  products: Products,
} = require("../models");
const {
  buildParentIdTree,
  getCategoryDepth,
  validateHierarchy,
} = require("../utils/categoryTreeUtils");

exports.createCategory = async (req, res) => {
  try {
    const {
      name,
      description,
      product_ids,
      parent_id,
      status = "active",
    } = req.body;

    // Validate required fields
    if (!name || !description) {
      return sendErrorResponse(res, "Name and description are required", 400);
    }

    // If parent_id is provided, validate it exists and check hierarchy rules
    if (parent_id) {
      // Check if parent category exists
      const parentCategory = await Categories.findByPk(parent_id);
      if (!parentCategory) {
        return sendErrorResponse(res, "Parent category not found", 400);
      }

      // Check if parent is active
      if (parentCategory.status !== "active") {
        return sendErrorResponse(
          res,
          "Cannot create sub-category under inactive parent",
          400
        );
      }

      // Check maximum depth (prevent too deep nesting)
      const parentDepth = await getCategoryDepth(
        parent_id,
        Categories.sequelize
      );
      if (parentDepth >= 5) {
        return sendErrorResponse(
          res,
          "Maximum category depth (5 levels) exceeded",
          400
        );
      }

      // Validate hierarchy (prevent circular references)
      const isValidHierarchy = await validateHierarchy(
        parent_id,
        null,
        Categories.sequelize
      );
      if (!isValidHierarchy) {
        return sendErrorResponse(res, "Invalid category hierarchy", 400);
      }
    }

    // Create the category
    const category = await Categories.create({
      name,
      description,
      parent_id: parent_id || null,
      status,
    });

    // Build parent_id_tree path
    const parentIdTree = await buildParentIdTree(
      category.id,
      parent_id,
      Categories.sequelize
    );
    await category.update({ parent_id_tree: parentIdTree });

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

    // Fetch the complete category with updated parent_id_tree
    const completeCategory = await Categories.findByPk(category.id, {
      include: [
        {
          model: Categories,
          as: "parent",
          attributes: ["id", "name"],
        },
      ],
    });

    return sendSuccessRespose(
      res,
      {
        category: completeCategory,
        products_added: product_ids ? product_ids.length : 0,
        is_subcategory: !!parent_id,
        parent_id_tree: parentIdTree,
      },
      parent_id
        ? "Sub-category created successfully"
        : "Category created successfully",
      201
    );
  } catch (error) {
    console.error("Create category error:", error);
    return sendErrorResponse(res, "Failed to create category", 500);
  }
};

exports.getCategories = async (req, res) => {
  try {
    const { include_products, drawer } = req.query;

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

      // Transform to drawer format if requested
      if (drawer === "true") {
        const transformedCategories = categories.map((category) => ({
          value: category.id,
          ...(drawer === "true" && { label: category.name }),
          products: category.products.map((product) => ({
            value: product.id,
            ...(drawer === "true" && { label: product.name }),
            // full_name: product.full_name,
            // description: product.description,
            // price: product.price,
            // is_active: product.is_active,
          })),
        }));

        return sendSuccessRespose(
          res,
          transformedCategories,
          "Categories with products in drawer format fetched successfully",
          200
        );
      } else {
        return sendSuccessRespose(
          res,
          categories,
          "Categories with products fetched successfully",
          200
        );
      }
    } else {
      // Get categories with product count (default)
      const categories = await Categories.findAll({
        order: [["name", "ASC"]],
      });

      // Get product count for each category
      const categoriesWithCount = await Promise.all(
        categories.map(async (category) => {
          const productCount = await CategoryProduct.count({
            where: { category_id: category.id },
          });

          return {
            ...category.toJSON(),
            product_count: productCount,
          };
        })
      );

      // Build hierarchical tree structure (always return tree format)
      const buildTree = (parentId = null) => {
        return categoriesWithCount
          .filter((category) => category.parent_id === parentId)
          .map((category) => ({
            id: category.id.toString(),
            name: category.name,
            description: category.description,
            status: category.status,
            product_count: category.product_count,
            children: buildTree(category.id),
          }));
      };

      const tree = buildTree();

      return sendSuccessRespose(
        res,
        tree,
        "Categories tree fetched successfully",
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

    let products = categoryProducts.map((cp) => ({
      ...cp.product.toJSON(),
      category: category.name, // Add category name to each product
    }));

    // Transform products to drawer format if requested
    if (drawer === "true") {
      products = products.map((product) => ({
        value: product.id,
        ...(drawer === "true" && { label: product.name }),
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
