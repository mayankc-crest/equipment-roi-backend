"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Update all existing categories to be top-level categories
    // Set parent_id to null and parent_id_tree to their own ID
    await queryInterface.sequelize.query(`
      UPDATE categories 
      SET 
        parent_id = NULL,
        parent_id_tree = CAST(id AS CHAR)
      WHERE parent_id IS NULL AND parent_id_tree IS NULL
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Reset parent_id_tree to null for all categories
    await queryInterface.sequelize.query(`
      UPDATE categories 
      SET parent_id_tree = NULL
    `);
  },
};

