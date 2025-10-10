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
      parent_id: {
        type: DataTypes.BIGINT(20),
        allowNull: true,
        references: {
          model: "categories",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      parent_id_tree: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment:
          "Colon-separated path from root to current category (e.g., '1:2:3:4:6')",
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

    // Self-referencing hierarchical relationship
    Category.belongsTo(models.categories, {
      foreignKey: "parent_id",
      as: "parent",
    });
    Category.hasMany(models.categories, {
      foreignKey: "parent_id",
      as: "children",
    });
  };

  return Category;
};
