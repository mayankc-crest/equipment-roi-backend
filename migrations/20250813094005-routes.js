"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // await queryInterface.createTable("routes", {
    //   id: {
    //     type: Sequelize.BIGINT(20),
    //     allowNull: false,
    //     primaryKey: true,
    //     autoIncrement: true,
    //   },
    //   route_number: {
    //     type: Sequelize.STRING(50),
    //     defaultValue: null,
    //   },
    //   route_name: {
    //     type: Sequelize.STRING(50),
    //     defaultValue: null,
    //   },
    //   route_description: {
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
    // await queryInterface.dropTable("routes");
  },
};
