"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("invoices", {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      txn_id: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      txn_number: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      customer_list_id: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      customer_full_name: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      txn_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      ref_number: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      subtotal: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.0,
      },
      sales_tax_percentage: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0.0,
      },
      sales_tax_total: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.0,
      },
      total_amount: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.0,
      },
      balance_remaining: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.0,
      },
      is_paid: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      deletedAt: {
        type: Sequelize.DATE,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("invoices");
  },
};
