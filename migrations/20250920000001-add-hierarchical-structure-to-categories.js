"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add parent_id column
    await queryInterface.addColumn("categories", "parent_id", {
      type: Sequelize.BIGINT(20),
      allowNull: true,
      references: {
        model: "categories",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });

    // Add parent_id_tree column
    await queryInterface.addColumn("categories", "parent_id_tree", {
      type: Sequelize.TEXT,
      allowNull: true,
      comment:
        "Colon-separated path from root to current category (e.g., '1:2:3:4:6')",
    });

    // Add index on parent_id for better performance
    await queryInterface.addIndex("categories", ["parent_id"], {
      name: "idx_categories_parent_id",
    });

    // Note: Cannot create index on TEXT column without key length in MySQL
    // parent_id_tree will be searched using LIKE queries which may be slower
    // Consider using VARCHAR with appropriate length if performance becomes an issue
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes
    await queryInterface.removeIndex("categories", "idx_categories_parent_id");

    // Remove columns
    await queryInterface.removeColumn("categories", "parent_id_tree");
    await queryInterface.removeColumn("categories", "parent_id");
  },
};
