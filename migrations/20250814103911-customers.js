"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // await queryInterface.createTable("customers", {
    //   id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
    //   quickbook_list_id: { type: Sequelize.STRING(50) },
    //   first_name: { type: Sequelize.STRING(50) },
    //   last_name: { type: Sequelize.STRING(50) },
    //   company_name: { type: Sequelize.STRING(100) },
    //   email: { type: Sequelize.STRING(100) },
    //   phone: { type: Sequelize.STRING(20) },
    //   alt_phone: { type: Sequelize.STRING(20) },
    //   address_line1: { type: Sequelize.STRING(100) },
    //   address_line2: { type: Sequelize.STRING(100) },
    //   city: { type: Sequelize.STRING(50) },
    //   state: { type: Sequelize.STRING(50) },
    //   postal_code: { type: Sequelize.STRING(20) },
    //   customer_type: { type: Sequelize.STRING(50) },
    //   terms: { type: Sequelize.STRING(50) },
    //   balance: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0.0 },
    //   total_balance: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0.0 },
    //   job_status: { type: Sequelize.STRING(20) },
    //   job_description: { type: Sequelize.TEXT },
    //   job_start_date: { type: Sequelize.DATE },
    //   job_end_date: { type: Sequelize.DATE },
    //   createdAt: {
    //     allowNull: false,
    //     type: Sequelize.DATE,
    //   },
    //   updatedAt: {
    //     allowNull: false,
    //     type: Sequelize.DATE,
    //   },
    //   deletedAt: {
    //     type: Sequelize.DATE,
    //   },
    // });
  },

  async down(queryInterface, Sequelize) {
    // await queryInterface.dropTable("customers");
  },
};
