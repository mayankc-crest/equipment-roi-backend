"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // await queryInterface.createTable("users", {
    //   id: {
    //     type: Sequelize.BIGINT,
    //     autoIncrement: true,
    //     primaryKey: true,
    //   },
    //   email: {
    //     type: Sequelize.STRING(100),
    //     allowNull: false,
    //     unique: true,
    //   },
    //   password: {
    //     type: Sequelize.STRING(255),
    //     allowNull: false,
    //   },
    //   role: {
    //     type: Sequelize.ENUM(
    //       "super",
    //       "admin",
    //       "Data entry",
    //       "sales representative"
    //     ),
    //     defaultValue: "sales representative",
    //     allowNull: false,
    //   },
    //   first_name: {
    //     type: Sequelize.STRING(100),
    //     allowNull: false,
    //   },
    //   last_name: {
    //     type: Sequelize.STRING(100),
    //     allowNull: false,
    //   },
    //   phone_number: {
    //     type: Sequelize.STRING(20),
    //   },
    //   emergency_contact: {
    //     type: Sequelize.STRING(20),
    //   },
    //   notes: {
    //     type: Sequelize.TEXT,
    //   },
    //   street_address: {
    //     type: Sequelize.STRING(255),
    //   },
    //   city: {
    //     type: Sequelize.STRING(100),
    //   },
    //   state: {
    //     type: Sequelize.STRING(100),
    //   },
    //   country: {
    //     type: Sequelize.STRING(100),
    //   },
    //   zip_code: {
    //     type: Sequelize.STRING(20),
    //   },
    //   is_active: {
    //     type: Sequelize.BOOLEAN,
    //     defaultValue: true,
    //   },
    //   last_login: {
    //     type: Sequelize.DATE,
    //   },
    //   password_reset_token: {
    //     type: Sequelize.STRING(255),
    //   },
    //   password_reset_expires: {
    //     type: Sequelize.DATE,
    //   },
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

    // Add unique index on email
    // await queryInterface.addIndex("users", ["email"], {
    //   unique: true,
    //   name: "users_email_unique",
    // });
  },

  async down(queryInterface, Sequelize) {
    // await queryInterface.dropTable("users");
  },
};
