const { routes: Routes } = require("../models");
const { sendSuccessRespose, sendErrorResponse } = require("../utils/response");

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
    const routes = await Routes.findAll();
    return sendSuccessRespose(res, routes, "Routes fetched successfully", 200);
  } catch (error) {
    return sendErrorResponse(res, error.message);
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
