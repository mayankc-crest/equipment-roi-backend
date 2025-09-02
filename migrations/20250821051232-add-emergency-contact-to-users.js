"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // await queryInterface.addColumn("users", "emergency_contact", {
    //   type: Sequelize.STRING(20),
    //   allowNull: true,
    //   after: "phone_number",
    // });
  },

  async down(queryInterface, Sequelize) {
    // await queryInterface.removeColumn("users", "emergency_contact");
  },
};
