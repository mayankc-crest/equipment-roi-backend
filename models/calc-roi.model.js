"use strict";

module.exports = (sequelize, DataTypes) => {
  const CalcRoi = sequelize.define(
    "calc_roi",
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
      },
    },
    {
      tableName: "calc_roi",
      timestamps: true,
      freezeTableName: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        {
          fields: ["customer_id"],
        },
      ],
    }
  );

  CalcRoi.associate = (models) => {
    CalcRoi.belongsTo(models.customers, {
      foreignKey: "customer_id",
      as: "customer",
    });
  };

  return CalcRoi;
};
