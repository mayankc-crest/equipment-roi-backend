module.exports = (sequelize, DataTypes) => {
  const Category = sequelize.define(
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

  // Define associations
  Category.associate = (models) => {
    // Many-to-many relationship with products through category_products junction table
    Category.belongsToMany(models.products, {
      through: "category_products",
      foreignKey: "category_id",
      otherKey: "product_id",
      as: "products",
    });
  };

  return Category;
};
