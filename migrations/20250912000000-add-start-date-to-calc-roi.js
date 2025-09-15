"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable("calc_roi");

    if (!table.start_date) {
      // Add column allowing null first to backfill existing rows, then set NOT NULL
      await queryInterface.addColumn("calc_roi", "start_date", {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: "Start date for ROI calculation period",
      });

      // Backfill existing rows with current date
      await queryInterface.sequelize.query(
        "UPDATE calc_roi SET start_date = CURRENT_DATE WHERE start_date IS NULL"
      );

      // Alter to NOT NULL
      await queryInterface.changeColumn("calc_roi", "start_date", {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: "Start date for ROI calculation period",
      });

      // Optional index if we query by date range often
      try {
        await queryInterface.addIndex("calc_roi", ["start_date"], {
          name: "idx_calc_roi_start_date",
        });
      } catch (e) {
        // ignore if exists
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeIndex("calc_roi", "idx_calc_roi_start_date");
    } catch (e) {}
    try {
      await queryInterface.removeColumn("calc_roi", "start_date");
    } catch (e) {}
  },
};
