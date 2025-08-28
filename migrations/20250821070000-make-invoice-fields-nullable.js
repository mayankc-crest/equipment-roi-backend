"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Make txn_id nullable
    await queryInterface.changeColumn("invoices", "txn_id", {
      type: Sequelize.STRING(50),
      allowNull: true,
      comment: "QuickBooks Transaction ID (optional)",
    });

    // Make txn_number nullable
    await queryInterface.changeColumn("invoices", "txn_number", {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: "QuickBooks Transaction Number (optional)",
    });

    // Make customer_list_id nullable
    await queryInterface.changeColumn("invoices", "customer_list_id", {
      type: Sequelize.STRING(50),
      allowNull: true,
      comment: "QuickBooks Customer List ID",
    });

    // Make customer_full_name nullable
    await queryInterface.changeColumn("invoices", "customer_full_name", {
      type: Sequelize.STRING(150),
      allowNull: true,
      comment: "Customer full name from QuickBooks",
    });

    // Make txn_date nullable
    await queryInterface.changeColumn("invoices", "txn_date", {
      type: Sequelize.DATEONLY,
      allowNull: true,
      comment: "Transaction date from QuickBooks",
    });

    // Make ref_number nullable
    await queryInterface.changeColumn("invoices", "ref_number", {
      type: Sequelize.STRING(50),
      allowNull: true,
      comment: "Invoice reference number",
    });

    // Make subtotal nullable
    await queryInterface.changeColumn("invoices", "subtotal", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0.0,
    });

    // Make sales_tax_percentage nullable
    await queryInterface.changeColumn("invoices", "sales_tax_percentage", {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: 0.0,
    });

    // Make sales_tax_total nullable
    await queryInterface.changeColumn("invoices", "sales_tax_total", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0.0,
    });

    // Make total_amount nullable
    await queryInterface.changeColumn("invoices", "total_amount", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0.0,
    });

    // Make balance_remaining nullable
    await queryInterface.changeColumn("invoices", "balance_remaining", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0.0,
    });

    // Make is_paid nullable
    await queryInterface.changeColumn("invoices", "is_paid", {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert txn_id to not null
    await queryInterface.changeColumn("invoices", "txn_id", {
      type: Sequelize.STRING(50),
      allowNull: false,
    });

    // Revert txn_number to not null
    await queryInterface.changeColumn("invoices", "txn_number", {
      type: Sequelize.INTEGER,
      allowNull: false,
    });

    // Revert customer_list_id to not null
    await queryInterface.changeColumn("invoices", "customer_list_id", {
      type: Sequelize.STRING(50),
      allowNull: false,
    });

    // Revert customer_full_name to not null
    await queryInterface.changeColumn("invoices", "customer_full_name", {
      type: Sequelize.STRING(150),
      allowNull: false,
    });

    // Revert txn_date to not null
    await queryInterface.changeColumn("invoices", "txn_date", {
      type: Sequelize.DATEONLY,
      allowNull: false,
    });

    // Revert ref_number to not null
    await queryInterface.changeColumn("invoices", "ref_number", {
      type: Sequelize.STRING(50),
      allowNull: false,
    });

    // Revert subtotal to not null
    await queryInterface.changeColumn("invoices", "subtotal", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
    });

    // Revert sales_tax_percentage to not null
    await queryInterface.changeColumn("invoices", "sales_tax_percentage", {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0.0,
    });

    // Revert sales_tax_total to not null
    await queryInterface.changeColumn("invoices", "sales_tax_total", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
    });

    // Revert total_amount to not null
    await queryInterface.changeColumn("invoices", "total_amount", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
    });

    // Revert balance_remaining to not null
    await queryInterface.changeColumn("invoices", "balance_remaining", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
    });

    // Revert is_paid to not null
    await queryInterface.changeColumn("invoices", "is_paid", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },
};
