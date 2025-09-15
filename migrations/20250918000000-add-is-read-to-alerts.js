"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add is_read column
    await queryInterface.addColumn("alerts", "is_read", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: "Flag to indicate if alert has been read",
    });

    // Add index for is_read column for better query performance
    await queryInterface.addIndex("alerts", {
      fields: ["is_read"],
      name: "idx_alerts_is_read",
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove index
    await queryInterface.removeIndex("alerts", "idx_alerts_is_read");

    // Remove is_read column
    await queryInterface.removeColumn("alerts", "is_read");
  },
};
