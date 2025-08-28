"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("calc_invoice_line_items", {
      id: {
        type: Sequelize.BIGINT(20),
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      calc_invoice_id: {
        type: Sequelize.BIGINT(20),
        allowNull: false,
        references: {
          model: "calc_invoices",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      line_item_id: {
        type: Sequelize.BIGINT(20),
        allowNull: false,
        references: {
          model: "invoice_line_items",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      quatity: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 1.0,
        comment: "Quantity of the item",
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
    await queryInterface.addIndex("calc_invoice_line_items", [
      "calc_invoice_id",
    ]);
    await queryInterface.addIndex("calc_invoice_line_items", ["line_item_id"]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("calc_invoice_line_items");
  },
};
