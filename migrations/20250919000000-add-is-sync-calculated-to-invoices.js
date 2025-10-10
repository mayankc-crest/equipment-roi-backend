"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("invoices", "is_sync_calculated", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: "Flag to indicate invoice sync calculation status",
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("invoices", "is_sync_calculated");
  },
};
