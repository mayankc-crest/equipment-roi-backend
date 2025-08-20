const express = require("express");
const router = express.Router();
const routesCtrl = require("../../controllers/routes.controller");

/**
 * @description
 * @path /api/
 * @name
 */
router.post("/create", routesCtrl.createRoute);

/**
 * @description
 * @path /api/
 * @name
 */
router.get("/", routesCtrl.getRoutes);

/**
 * @description
 * @path /api/
 * @name
 */
router.get("/:id", routesCtrl.getRouteById);
/**
 * @description
 * @path /api/
 * @name
 */
router.patch("/:id", routesCtrl.updateRoute);

/**
 * @description
 * @path /api/
 * @name
 */
router.delete("/:id", routesCtrl.deleteRoute);
module.exports = router;
