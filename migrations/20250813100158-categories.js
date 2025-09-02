"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    // await queryInterface.createTable("categories", {
    //   id: {
    //     type: Sequelize.BIGINT(20),
    //     allowNull: false,
    //     primaryKey: true,
    //     autoIncrement: true,
    //   },
    //   name: {
    //     type: Sequelize.STRING(50),
    //     defaultValue: null,
    //   },
    //   description: {
    //     type: Sequelize.STRING(50),
    //     defaultValue: null,
    //   },
    //   status: {
    //     type: Sequelize.ENUM("active", "inactive"),
    //     defaultValue: "active",
    //     allowNull: false,
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
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    // await queryInterface.dropTable("categories");
  },
};
