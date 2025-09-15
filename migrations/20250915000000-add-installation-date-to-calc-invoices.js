"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable("calc_invoices");

    if (!table.installation_date) {
      await queryInterface.addColumn("calc_invoices", "installation_date", {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: "Installation date for the invoice",
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn("calc_invoices", "installation_date");
    } catch (e) {
      // ignore if not present
    }
  },
};
