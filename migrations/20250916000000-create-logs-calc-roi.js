"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("logs_calc_roi", {
      id: {
        type: Sequelize.BIGINT(20),
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      calc_roi_id: {
        type: Sequelize.BIGINT(20),
        allowNull: false,
        references: {
          model: "calc_roi",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: "Start date for ROI calculation period",
      },
      net_cost: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: null,
      },
      net_products_total: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: null,
      },
      net_equipment_total: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: null,
      },
      monthly_payment: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: null,
      },
      monthly_sales_required: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: null,
      },
      total_sales: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: null,
      },
      total_recouped: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: null,
      },
      total_months: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      sales_not_met: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      net_cost_left: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: null,
      },
      payback_period: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null,
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
    await queryInterface.addIndex("logs_calc_roi", ["calc_roi_id"], {
      name: "idx_logs_calc_roi_calc_roi_id",
    });

    await queryInterface.addIndex("logs_calc_roi", ["start_date"], {
      name: "idx_logs_calc_roi_start_date",
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes first
    await queryInterface.removeIndex(
      "logs_calc_roi",
      "idx_logs_calc_roi_calc_roi_id"
    );
    await queryInterface.removeIndex(
      "logs_calc_roi",
      "idx_logs_calc_roi_start_date"
    );

    // Drop the table
    await queryInterface.dropTable("logs_calc_roi");
  },
};
