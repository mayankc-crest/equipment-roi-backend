"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add message column
    await queryInterface.addColumn("alerts", "message", {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: "Alert message content",
    });

    // Add calc_line_items_id column
    await queryInterface.addColumn("alerts", "calc_line_items_id", {
      type: Sequelize.BIGINT(20),
      allowNull: true,
      comment: "Reference to calc_invoice_line_items table",
    });

    // Add foreign key constraint for calc_line_items_id
    await queryInterface.addConstraint("alerts", {
      fields: ["calc_line_items_id"],
      type: "foreign key",
      name: "fk_alerts_calc_line_items_id",
      references: {
        table: "calc_invoice_line_items",
        field: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });

    // Add index for calc_line_items_id
    await queryInterface.addIndex("alerts", {
      fields: ["calc_line_items_id"],
      name: "idx_alerts_calc_line_items_id",
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove foreign key constraint
    await queryInterface.removeConstraint(
      "alerts",
      "fk_alerts_calc_line_items_id"
    );

    // Remove index
    await queryInterface.removeIndex("alerts", "idx_alerts_calc_line_items_id");

    // Remove calc_line_items_id column
    await queryInterface.removeColumn("alerts", "calc_line_items_id");

    // Remove message column
    await queryInterface.removeColumn("alerts", "message");
  },
};
