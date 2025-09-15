"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable("calc_roi");

    if (!table.net_cost) {
      await queryInterface.addColumn("calc_roi", "net_cost", {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      });
    }

    if (!table.net_products_total) {
      await queryInterface.addColumn("calc_roi", "net_products_total", {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      });
    }

    if (!table.net_equipment_total) {
      await queryInterface.addColumn("calc_roi", "net_equipment_total", {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      });
    }

    if (!table.monthly_payment) {
      await queryInterface.addColumn("calc_roi", "monthly_payment", {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      });
    }

    if (!table.monthly_sales_required) {
      await queryInterface.addColumn("calc_roi", "monthly_sales_required", {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      });
    }

    if (!table.total_sales) {
      await queryInterface.addColumn("calc_roi", "total_sales", {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      });
    }

    if (!table.total_recouped) {
      await queryInterface.addColumn("calc_roi", "total_recouped", {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      });
    }

    if (!table.total_months) {
      await queryInterface.addColumn("calc_roi", "total_months", {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
    }

    if (!table.sales_not_met) {
      await queryInterface.addColumn("calc_roi", "sales_not_met", {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
    }

    if (!table.net_cost_left) {
      await queryInterface.addColumn("calc_roi", "net_cost_left", {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      });
    }

    if (!table.payback_period) {
      await queryInterface.addColumn("calc_roi", "payback_period", {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const columns = [
      "net_cost",
      "net_products_total",
      "net_equipment_total",
      "monthly_payment",
      "monthly_sales_required",
      "total_sales",
      "total_recouped",
      "total_months",
      "sales_not_met",
      "net_cost_left",
      "payback_period",
    ];

    for (const column of columns) {
      try {
        await queryInterface.removeColumn("calc_roi", column);
      } catch (error) {
        // Column might not exist; ignore
      }
    }
  },
};
