"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("invoice_line_items", {
      id: {
        type: Sequelize.BIGINT(20),
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      invoice_id: {
        type: Sequelize.BIGINT(20),
        allowNull: false,
        references: {
          model: "invoices",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      line_number: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: "Line number/position in the invoice",
      },
      product_id: {
        type: Sequelize.BIGINT(20),
        allowNull: false,
        references: {
          model: "products",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
        comment: "Reference to products table",
      },
      quantity: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 1.0,
        comment: "Quantity of the item",
      },
      unit_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
        comment: "Unit price of the item",
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
        comment: "Total amount for this line (quantity * unit_price)",
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        ),
      },
    });

    // Add indexes for better performance
    await queryInterface.addIndex("invoice_line_items", ["invoice_id"]);
    await queryInterface.addIndex("invoice_line_items", ["product_id"]);
    await queryInterface.addIndex("invoice_line_items", ["line_number"]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("invoice_line_items");
  },
};
