module.exports = (sequelize, DataTypes) => {
  const Routes = sequelize.define(
    "categories",
    {
      id: {
        type: DataTypes.BIGINT(20),
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(50),
        defaultValue: null,
      },
      description: {
        type: DataTypes.STRING(50),
        defaultValue: null,
      },
      status: {
        type: DataTypes.ENUM("active", "inactive"),
        defaultValue: "active",
        allowNull: false,
      },
    },
    {
      timestamps: true,
      paranoid: true,
    }
  );

  return Routes;
};
