"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable("invoices");

    if (!table.is_calculated) {
      await queryInterface.addColumn("invoices", "is_calculated", {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Flag to indicate invoice is included in ROI calculation",
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn("invoices", "is_calculated");
    } catch (e) {
      // ignore if not present
    }
  },
};
