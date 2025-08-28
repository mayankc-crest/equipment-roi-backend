const express = require("express");
const productsCtrl = require("../../controllers/products.controller");

const router = express.Router();

/**
 * @description Get all products
 * @path /api/products
 * @method GET
 */
router.get("/", productsCtrl.getAllProducts);

/**
 * @description Get product statistics
 * @path /api/products/stats
 * @method GET
 */
router.get("/stats", productsCtrl.getProductStats);

/**
 * @description Get product by ID`
 * @path /api/products/:id
 * @method GET
 */
router.get("/:id", productsCtrl.getProductById);

module.exports = router;
