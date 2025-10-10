const express = require("express");
const categoryRoutes = require("./category");
const routeRoutes = require("./routes");
const customerRoutes = require("./customers");
const productRoutes = require("./products");
const invoiceRoutes = require("./invoices");
const syncRoutes = require("./sync");
const authRoutes = require("./auth");
const userRoutes = require("./users");
const settingsRoutes = require("./settings");
const alertsRoutes = require("./alerts");
const dashboardRoutes = require("./dashboard");
const reportsRoutes = require("./reports");
const AuthMiddleware = require("../../middleware/auth.middleware");

const router = express.Router();

router.get("/ping", async (req, res) => {
  res.send("pong");
});

//auth - No token validation required
router.use("/auth", authRoutes);

//users - Require token validation
router.use("/users", AuthMiddleware.verifyToken, userRoutes);

// routes - Require token validation
router.use("/routes", AuthMiddleware.verifyToken, routeRoutes);

//categories - Require token validation
router.use("/categories", AuthMiddleware.verifyToken, categoryRoutes);

//customers - Require token validation
router.use("/customers", AuthMiddleware.verifyToken, customerRoutes);

//products - Require token validation
router.use("/products", AuthMiddleware.verifyToken, productRoutes);

//invoices - Require token validation
router.use("/invoices", AuthMiddleware.verifyToken, invoiceRoutes);

//sync - Require token validation
router.use("/sync", AuthMiddleware.verifyToken, syncRoutes);

//settings - Require token validation
router.use("/settings", AuthMiddleware.verifyToken, settingsRoutes);

//alerts - Require token validation
router.use("/alerts", AuthMiddleware.verifyToken, alertsRoutes);

//dashboard - Require token validation
router.use("/dashboard", AuthMiddleware.verifyToken, dashboardRoutes);

//reports - Require token validation
router.use("/reports", AuthMiddleware.verifyToken, reportsRoutes);

module.exports = router;
