"use strict";

module.exports = (sequelize, DataTypes) => {
  const CalcRoiCategory = sequelize.define(
    "calc_roi_categories",
    {
      id: {
        type: DataTypes.BIGINT(20),
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      roi_id: {
        type: DataTypes.BIGINT(20),
        allowNull: false,
        references: {
          model: "calc_roi",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      category_id: {
        type: DataTypes.BIGINT(20),
        allowNull: false,
        references: {
          model: "categories",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "calc_roi_categories",
      freezeTableName: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  CalcRoiCategory.associate = (models) => {
    CalcRoiCategory.belongsTo(models.calc_roi, {
      foreignKey: "roi_id",
      as: "roi",
    });
    CalcRoiCategory.belongsTo(models.categories, {
      foreignKey: "category_id",
      as: "category",
    });
  };

  return CalcRoiCategory;
};
