"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add product_condition column
    await queryInterface.addColumn(
      "calc_invoice_line_items",
      "product_condition",
      {
        type: Sequelize.ENUM("New", "Used"),
        allowNull: false,
        defaultValue: "New",
        comment: "Condition of the product",
      }
    );

    // Add sale_type column
    await queryInterface.addColumn("calc_invoice_line_items", "sale_type", {
      type: Sequelize.ENUM("sold", "lease"),
      allowNull: false,
      defaultValue: "lease",
      comment: "Type of sale",
    });

    // Add price column
    await queryInterface.addColumn("calc_invoice_line_items", "price", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
      comment: "Price of the item",
    });

    // Add total_price column
    await queryInterface.addColumn("calc_invoice_line_items", "total_price", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
      comment: "Total price of the item",
    });

    // Fix the typo: rename quatity to quantity
    await queryInterface.renameColumn(
      "calc_invoice_line_items",
      "quatity",
      "quantity"
    );
  },

  down: async (queryInterface, Sequelize) => {
    // Remove added columns
    await queryInterface.removeColumn(
      "calc_invoice_line_items",
      "product_condition"
    );
    await queryInterface.removeColumn("calc_invoice_line_items", "sale_type");
    await queryInterface.removeColumn("calc_invoice_line_items", "price");
    await queryInterface.removeColumn("calc_invoice_line_items", "total_price");

    // Rename quantity back to quatity (revert the typo fix)
    await queryInterface.renameColumn(
      "calc_invoice_line_items",
      "quantity",
      "quatity"
    );
  },
};
