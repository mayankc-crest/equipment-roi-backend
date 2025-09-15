const express = require("express");
const router = express.Router();
const settingsCtrl = require("../../controllers/settings.controller");

/**
 * @description Get settings
 * @path /api/settings
 * @method GET
 */
router.get("/", settingsCtrl.getSettings);

/**
 * @description Update settings
 * @path /api/settings
 * @method PUT
 */
router.put("/", settingsCtrl.updateSettings);

module.exports = router;
