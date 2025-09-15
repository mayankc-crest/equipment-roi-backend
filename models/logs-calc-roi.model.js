"use strict";

module.exports = (sequelize, DataTypes) => {
  const LogsCalcRoi = sequelize.define(
    "logs_calc_roi",
    {
      id: {
        type: DataTypes.BIGINT(20),
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      calc_roi_id: {
        type: DataTypes.BIGINT(20),
        allowNull: false,
        references: {
          model: "calc_roi",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      start_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        comment: "Start date for ROI calculation period",
      },
      net_cost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: null,
      },
      net_products_total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: null,
      },
      net_equipment_total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: null,
      },
      monthly_payment: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: null,
      },
      monthly_sales_required: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: null,
      },
      total_sales: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: null,
      },
      total_recouped: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: null,
      },
      total_months: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      sales_not_met: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      net_cost_left: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: null,
      },
      payback_period: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      tableName: "logs_calc_roi",
      timestamps: true,
      freezeTableName: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  LogsCalcRoi.associate = (models) => {
    LogsCalcRoi.belongsTo(models.calc_roi, {
      foreignKey: "calc_roi_id",
      as: "calcRoi",
    });
  };

  return LogsCalcRoi;
};
