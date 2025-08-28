const { products: Products, categories: Categories } = require("../models");
const { sendSuccessRespose, sendErrorResponse } = require("../utils/response");
const { Op } = require("sequelize");

exports.getAllProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      sortBy = "createdAt",
      sortOrder = "DESC",
      is_active,
      min_price,
      max_price,
      account_name,
      category_id,
      all,
      drawer,
    } = req.query;

    // Check if all products are requested
    const getAllProducts = all === "true";

    // Check if drawer format is requested
    const isDrawerFormat = drawer === "true";

    // Convert page and limit to numbers (only if not getting all products)
    const pageNum = getAllProducts ? 1 : parseInt(page);
    const limitNum = getAllProducts ? null : parseInt(limit);
    const offset = getAllProducts ? 0 : (pageNum - 1) * limitNum;

    // Build where clause
    const whereClause = {};

    // Search functionality
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { full_name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { account_name: { [Op.like]: `%${search}%` } },
      ];
    }

    // Filter by active status
    if (is_active !== undefined) {
      whereClause.is_active = is_active === "true";
    }

    // Filter by price range
    if (min_price !== undefined || max_price !== undefined) {
      whereClause.price = {};
      if (min_price !== undefined) {
        whereClause.price[Op.gte] = parseFloat(min_price);
      }
      if (max_price !== undefined) {
        whereClause.price[Op.lte] = parseFloat(max_price);
      }
    }

    // Filter by account name
    if (account_name) {
      whereClause.account_name = { [Op.like]: `%${account_name}%` };
    }

    // Filter by category
    if (category_id) {
      whereClause.category_id = category_id;
    }

    // Build order clause
    const orderClause = [[sortBy, sortOrder.toUpperCase()]];

    // Get total count for pagination
    const totalCount = await Products.count({ where: whereClause });

    // Get products with pagination and category information
    const products = await Products.findAll({
      attributes: isDrawerFormat
        ? ["id", "name"] // Only id and name for drawer format
        : [
            "id",
            "quickbook_list_id",
            "name",
            "full_name",
            "description",
            "price",
            "is_active",
            "account_name",
            "category_id",
            "createdAt",
            "updatedAt",
          ],
      include: isDrawerFormat
        ? [] // No includes for drawer format
        : [
            {
              model: Categories,
              as: "category",
              attributes: ["id", "name", "description", "status"],
              required: false, // Left join to include products without categories
            },
          ],
      where: whereClause,
      order: orderClause,
      ...(getAllProducts ? {} : { limit: limitNum, offset: offset }),
    });

    // Transform products to drawer format if requested
    let finalProducts = products;
    if (isDrawerFormat) {
      finalProducts = products.map((product) => ({
        value: product.id,
        label: product.name,
      }));
    }

    // Calculate pagination info (only if not getting all products)
    let paginationInfo = null;

    if (!getAllProducts) {
      const totalPages = Math.ceil(totalCount / limitNum);
      const hasNextPage = pageNum < totalPages;
      const hasPrevPage = pageNum > 1;

      paginationInfo = {
        currentPage: pageNum,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limitNum,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? pageNum + 1 : null,
        prevPage: hasPrevPage ? pageNum - 1 : null,
      };
    }

    return sendSuccessRespose(
      res,
      {
        products: finalProducts,
        ...(paginationInfo && { pagination: paginationInfo }),
        ...(getAllProducts && { totalCount }),
      },
      isDrawerFormat
        ? "Products fetched in drawer format successfully"
        : getAllProducts
        ? "All products fetched successfully"
        : "Products fetched successfully",
      200
    );
  } catch (error) {
    console.error("Error fetching products:", error);
    return sendErrorResponse(res, "Failed to fetch products");
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Products.findByPk(req.params.id, {
      include: [
        {
          model: Categories,
          as: "category",
          attributes: ["id", "name", "description", "status"],
          required: false,
        },
      ],
    });

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
    console.error("Error fetching product:", error);
    return sendErrorResponse(res, "Failed to fetch product");
  }
};

// Get product statistics
exports.getProductStats = async (req, res) => {
  try {
    const totalProducts = await Products.count();
    const activeProducts = await Products.count({ where: { is_active: true } });
    const inactiveProducts = await Products.count({
      where: { is_active: false },
    });

    // Get products with prices
    const productsWithPrices = await Products.count({
      where: {
        price: { [Op.gt]: 0 },
      },
    });

    // Get average price
    const avgPriceResult = await Products.findOne({
      attributes: [
        [
          Products.sequelize.fn("AVG", Products.sequelize.col("price")),
          "averagePrice",
        ],
      ],
      where: {
        price: { [Op.gt]: 0 },
      },
    });

    const averagePrice = avgPriceResult
      ? parseFloat(avgPriceResult.dataValues.averagePrice) || 0
      : 0;

    // Get products by account name distribution
    const accountDistribution = await Products.findAll({
      attributes: [
        "account_name",
        [Products.sequelize.fn("COUNT", Products.sequelize.col("id")), "count"],
      ],
      where: {
        account_name: { [Op.ne]: null },
      },
      group: ["account_name"],
      order: [
        [Products.sequelize.fn("COUNT", Products.sequelize.col("id")), "DESC"],
      ],
      limit: 10,
    });

    // Get products by category distribution
    const categoryDistribution = await Products.findAll({
      attributes: [
        "category_id",
        [Products.sequelize.fn("COUNT", Products.sequelize.col("id")), "count"],
      ],
      where: {
        category_id: { [Op.ne]: null },
      },
      group: ["category_id"],
      order: [
        [Products.sequelize.fn("COUNT", Products.sequelize.col("id")), "DESC"],
      ],
      limit: 10,
    });

    // Get category names for the distribution
    const categoryIds = categoryDistribution.map(
      (item) => item.dataValues.category_id
    );
    const categories = await Categories.findAll({
      where: { id: categoryIds },
      attributes: ["id", "name", "description"],
    });

    const categoryDistributionWithNames = categoryDistribution.map((item) => {
      const category = categories.find(
        (cat) => cat.id === item.dataValues.category_id
      );
      return {
        categoryId: item.dataValues.category_id,
        categoryName: category ? category.name : "Unknown",
        categoryDescription: category ? category.description : "",
        count: parseInt(item.dataValues.count),
      };
    });

    const stats = {
      totalProducts,
      activeProducts,
      inactiveProducts,
      productsWithPrices,
      averagePrice: Math.round(averagePrice * 100) / 100, // Round to 2 decimal places
      accountDistribution: accountDistribution.map((item) => ({
        accountName: item.dataValues.account_name,
        count: parseInt(item.dataValues.count),
      })),
      categoryDistribution: categoryDistributionWithNames,
    };

    return sendSuccessRespose(
      res,
      stats,
      "Product statistics fetched successfully",
      200
    );
  } catch (error) {
    console.error("Error fetching product stats:", error);
    return sendErrorResponse(res, "Failed to fetch product statistics");
  }
};
