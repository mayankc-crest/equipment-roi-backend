module.exports = (sequelize, DataTypes) => {
  const Routes = sequelize.define(
    "routes",
    {
      id: {
        type: DataTypes.BIGINT(20),
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      route_number: {
        type: DataTypes.STRING(50),
        defaultValue: null,
      },
      route_name: {
        type: DataTypes.STRING(50),
        defaultValue: null,
      },
      route_description: {
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
