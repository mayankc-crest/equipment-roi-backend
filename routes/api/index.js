const express = require("express");
const categoryRoutes = require("./category");
const routeRoutes = require("./routes");
const customerRoutes = require("./customers");
const productRoutes = require("./products");
const invoiceRoutes = require("./invoices");
const syncRoutes = require("./sync");
const authRoutes = require("./auth");
const userRoutes = require("./users");

const router = express.Router();

router.get("/ping", async (req, res) => {
  res.send("pong");
});

//auth
router.use("/auth", authRoutes);

//users
router.use("/users", userRoutes);

// routes
router.use("/routes", routeRoutes);

//categories
router.use("/categories", categoryRoutes);

//customers
router.use("/customers", customerRoutes);

//products
router.use("/products", productRoutes);

//invoices
router.use("/invoices", invoiceRoutes);

//sync
router.use("/sync", syncRoutes);

module.exports = router;
