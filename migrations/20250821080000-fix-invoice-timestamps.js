"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // First, let's check what columns exist in the invoices table
      const tableDescription = await queryInterface.describeTable("invoices");

      console.log("Current table structure:", Object.keys(tableDescription));

      // Remove custom timestamp columns if they exist
      if (tableDescription.created_at) {
        await queryInterface.removeColumn("invoices", "created_at");
        console.log("Removed created_at column");
      }

      if (tableDescription.updated_at) {
        await queryInterface.removeColumn("invoices", "updated_at");
        console.log("Removed updated_at column");
      }

      // Add Sequelize timestamp columns if they don't exist
      if (!tableDescription.createdAt) {
        await queryInterface.addColumn("invoices", "createdAt", {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        });
        console.log("Added createdAt column");
      }

      if (!tableDescription.updatedAt) {
        await queryInterface.addColumn("invoices", "updatedAt", {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        });
        console.log("Added updatedAt column");
      }

      console.log("Timestamp columns migration completed successfully");
    } catch (error) {
      console.error("Error in timestamp migration:", error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      // Remove Sequelize timestamp columns
      await queryInterface.removeColumn("invoices", "createdAt");
      await queryInterface.removeColumn("invoices", "updatedAt");

      // Add back the custom timestamp columns
      await queryInterface.addColumn("invoices", "created_at", {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      });

      await queryInterface.addColumn("invoices", "updated_at", {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      });

      console.log("Rollback completed - restored custom timestamp columns");
    } catch (error) {
      console.error("Error in rollback:", error);
      throw error;
    }
  },
};
