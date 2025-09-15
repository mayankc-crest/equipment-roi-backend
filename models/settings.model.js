"use strict";

module.exports = (sequelize, DataTypes) => {
  const Settings = sequelize.define(
    "settings",
    {
      id: {
        type: DataTypes.BIGINT(20),
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      monthly_payment_divider: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 1.0,
        comment: "Divider for monthly payment calculations",
      },
      monthly_sales_required_multiplier: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 1.0,
        comment: "Multiplier for monthly sales required calculations",
      },
      monthly_cost_recouped_divider: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 1.0,
        comment: "Divider for monthly cost recouped calculations",
      },
      net_cost_left_divider: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 1.0,
        comment: "Divider for net cost left calculations",
      },
      equipment_product_inactive: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: "Inactive flag for equipment/product calculations",
      },
      customer_inactive: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: "Inactive flag for customer calculations",
      },
    },
    {
      tableName: "settings",
      timestamps: true,
      freezeTableName: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return Settings;
};
