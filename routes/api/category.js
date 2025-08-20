const express = require("express");
const router = express.Router();
const categoryCtrl = require("../../controllers/category.controller");

/**
 * @description
 * @path /api/
 * @name
 */
router.post("/create", categoryCtrl.createCategory);

/**
 * @description
 * @path /api/
 * @name
 */
router.get("/", categoryCtrl.getCategories);

/**
 * @description
 * @path /api/
 * @name
 */
router.get("/:id", categoryCtrl.getCategoryById);

/**
 * @description
 * @path /api/
 * @name
 */
router.patch("/:id", categoryCtrl.updateCategory);

/**
 * @description
 * @path /api/
 * @name
 */
router.delete("/:id", categoryCtrl.deleteCategory);

module.exports = router;
