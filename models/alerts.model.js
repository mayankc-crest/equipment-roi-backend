"use strict";

module.exports = (sequelize, DataTypes) => {
  const Alerts = sequelize.define(
    "alerts",
    {
      id: {
        type: DataTypes.BIGINT(20),
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      customer_id: {
        type: DataTypes.BIGINT(20),
        allowNull: false,
        references: {
          model: "customers",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        comment: "Reference to customers table",
      },
      alert_type: {
        type: DataTypes.ENUM("3_year_review"),
        allowNull: false,
        defaultValue: "3_year_review",
        comment: "Type of alert (3_year_review, etc.)",
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Alert message content",
      },
      calc_line_items_id: {
        type: DataTypes.BIGINT(20),
        allowNull: true,
        references: {
          model: "calc_invoice_line_items",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        comment: "Reference to calc_invoice_line_items table",
      },
      is_read: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Flag to indicate if alert has been read",
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
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "Soft delete timestamp",
      },
    },
    {
      tableName: "alerts",
      timestamps: true,
      freezeTableName: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      deletedAt: "deleted_at",
      paranoid: true, // Enable soft deletes
      indexes: [
        {
          fields: ["customer_id"],
        },
        {
          fields: ["alert_type"],
        },
        {
          fields: ["calc_line_items_id"],
        },
        {
          fields: ["is_read"],
        },
        {
          fields: ["deleted_at"],
        },
      ],
    }
  );

  Alerts.associate = (models) => {
    Alerts.belongsTo(models.customers, {
      foreignKey: "customer_id",
      as: "customer",
    });

    Alerts.belongsTo(models.calc_invoice_line_items, {
      foreignKey: "calc_line_items_id",
      as: "calcLineItem",
    });
  };

  return Alerts;
};
