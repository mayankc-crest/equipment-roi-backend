"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("calc_roi_categories", {
      id: {
        type: Sequelize.BIGINT(20),
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      roi_id: {
        type: Sequelize.BIGINT(20),
        allowNull: false,
        references: {
          model: "calc_roi",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        comment: "Reference to calc_roi table",
      },
      category_id: {
        type: Sequelize.BIGINT(20),
        allowNull: false,
        references: {
          model: "categories",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        comment: "Reference to categories table",
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        ),
      },
    });

    // Add indexes for better performance
    await queryInterface.addIndex("calc_roi_categories", ["roi_id"], {
      name: "idx_calc_roi_categories_roi_id",
    });

    await queryInterface.addIndex("calc_roi_categories", ["category_id"], {
      name: "idx_calc_roi_categories_category_id",
    });

    // Add composite unique index to prevent duplicate roi-category combinations
    await queryInterface.addIndex(
      "calc_roi_categories",
      ["roi_id", "category_id"],
      {
        unique: true,
        name: "idx_calc_roi_categories_unique",
      }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("calc_roi_categories");
  },
};
