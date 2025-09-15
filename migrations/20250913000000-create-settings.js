"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("settings", {
      id: {
        type: Sequelize.BIGINT(20),
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      monthly_payment_divider: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 1.0,
        comment: "Divider for monthly payment calculations",
      },
      monthly_sales_required_multiplier: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 1.0,
        comment: "Multiplier for monthly sales required calculations",
      },
      monthly_cost_recouped_divider: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 1.0,
        comment: "Divider for monthly cost recouped calculations",
      },
      net_cost_left_divider: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 1.0,
        comment: "Divider for net cost left calculations",
      },
      equipment_product_inactive: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: "Inactive flag for equipment/product calculations",
      },
      customer_inactive: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: "Inactive flag for customer calculations",
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

    // Insert default settings record
    await queryInterface.bulkInsert("settings", [
      {
        monthly_payment_divider: 1.0,
        monthly_sales_required_multiplier: 1.0,
        monthly_cost_recouped_divider: 1.0,
        net_cost_left_divider: 1.0,
        equipment_product_inactive: 0,
        customer_inactive: 0,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("settings");
  },
};
