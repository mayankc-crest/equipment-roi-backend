const { routes: Routes } = require("../models");
const { sendSuccessRespose, sendErrorResponse } = require("../utils/response");
const Sequelize = require("sequelize");

exports.createRoute = async (req, res) => {
  try {
    const { route_number, route_name, route_description } = req.body;
    const route = await Routes.create({
      route_number,
      route_name,
      route_description,
    });
    return sendSuccessRespose(res, route, "Route created successfully", 201);
  } catch (error) {
    return sendErrorResponse(res, error.message);
  }
};

exports.getRoutes = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      all,
      drawer,
      search,
      sortBy = "route_name",
      sortOrder = "ASC",
    } = req.query;

    // Check if all routes are requested
    const getAllRoutes = all === "true";

    // Check if drawer format is requested
    const isDrawerFormat = drawer === "true";

    // Build where clause
    const whereClause = {};
    if (search) {
      whereClause[Sequelize.Op.or] = [
        { route_number: { [Sequelize.Op.like]: `%${search}%` } },
        { route_name: { [Sequelize.Op.like]: `%${search}%` } },
        { route_description: { [Sequelize.Op.like]: `%${search}%` } },
      ];
    }

    // Build order clause
    const orderClause = [[sortBy, sortOrder.toUpperCase()]];

    // If getting all routes, don't use pagination
    if (getAllRoutes) {
      const routes = await Routes.findAll({
        where: whereClause,
        attributes: isDrawerFormat
          ? ["id", "route_number", "route_name"] // Only essential fields for drawer format
          : [
              "id",
              "route_number",
              "route_name",
              "route_description",
              "createdAt",
              "updatedAt",
            ],
        order: orderClause,
      });

      // Transform routes to drawer format if requested
      let finalRoutes = routes;
      if (isDrawerFormat) {
        finalRoutes = routes.map((route) => ({
          value: route.id,
          label: `${route.route_number} - ${route.route_name}`,
        }));
      }

      return sendSuccessRespose(
        res,
        {
          routes: finalRoutes,
          totalCount: routes.length,
        },
        isDrawerFormat
          ? "Routes fetched in drawer format successfully"
          : "All routes fetched successfully",
        200
      );
    } else {
      // Use pagination for regular requests
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const offset = (pageNum - 1) * limitNum;

      const { count, rows } = await Routes.findAndCountAll({
        where: whereClause,
        attributes: [
          "id",
          "route_number",
          "route_name",
          "route_description",
          "createdAt",
          "updatedAt",
        ],
        order: orderClause,
        limit: limitNum,
        offset: offset,
      });

      // Transform routes to drawer format if requested
      let finalRoutes = rows;
      if (isDrawerFormat) {
        finalRoutes = rows.map((route) => ({
          value: route.id,
          label: `${route.route_number} - ${route.route_name}`,
        }));
      }

      const totalPages = Math.ceil(count / limitNum);
      const hasNextPage = pageNum < totalPages;
      const hasPrevPage = pageNum > 1;

      return sendSuccessRespose(
        res,
        {
          routes: finalRoutes,
          pagination: {
            currentPage: pageNum,
            totalPages,
            totalRoutes: count,
            routesPerPage: limitNum,
            hasNextPage,
            hasPrevPage,
            nextPage: hasNextPage ? pageNum + 1 : null,
            prevPage: hasPrevPage ? pageNum - 1 : null,
          },
        },
        isDrawerFormat
          ? "Routes fetched in drawer format successfully"
          : "Routes fetched successfully",
        200
      );
    }
  } catch (error) {
    console.error("Get routes error:", error);
    return sendErrorResponse(res, "Failed to get routes", 500);
  }
};

exports.getRouteById = async (req, res) => {
  try {
    const route = await Routes.findByPk(req.params.id);
    return sendSuccessRespose(res, route, "Route fetched successfully", 200);
  } catch (error) {
    return sendErrorResponse(res, error.message);
  }
};

exports.updateRoute = async (req, res) => {
  try {
    const { route_number, route_name, route_description } = req.body;
    console.log("the id is here:::", req.params.id);
    const route = await Routes.update(
      {
        route_number,
        route_name,
        route_description,
      },
      {
        where: { id: req.params.id },
      }
    );
    return sendSuccessRespose(res, route, "Route updated successfully", 200);
  } catch (error) {
    return sendErrorResponse(res, error.message);
  }
};

exports.deleteRoute = async (req, res) => {
  try {
    const route = await Routes.destroy({
      where: { id: req.params.id },
    });
    return sendSuccessRespose(res, route, "Route deleted successfully", 200);
  } catch (error) {
    return sendErrorResponse(res, error.message);
  }
};
