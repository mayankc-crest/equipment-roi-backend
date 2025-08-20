module.exports = (sequelize, DataTypes) => {
    const Customer = sequelize.define('customers', {
      id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
      quickbook_list_id: { type: DataTypes.STRING(50) },
      first_name: { type: DataTypes.STRING(50) },
      last_name: { type: DataTypes.STRING(50) },
      company_name: { type: DataTypes.STRING(100) },
      email: { type: DataTypes.STRING(100) },
      phone: { type: DataTypes.STRING(20) },
      alt_phone: { type: DataTypes.STRING(20) },
      address_line1: { type: DataTypes.STRING(100) },
      address_line2: { type: DataTypes.STRING(100) },
      city: { type: DataTypes.STRING(50) },
      state: { type: DataTypes.STRING(50) },
      postal_code: { type: DataTypes.STRING(20) },
      customer_type: { type: DataTypes.STRING(50) },
      terms: { type: DataTypes.STRING(50) },
      balance: { type: DataTypes.DECIMAL(10,2), defaultValue: 0.00 },
      total_balance: { type: DataTypes.DECIMAL(10,2), defaultValue: 0.00 },
      job_status: { type: DataTypes.STRING(20) },
      job_description: { type: DataTypes.TEXT },
      job_start_date: { type: DataTypes.DATE },
      job_end_date: { type: DataTypes.DATE },
    }, {
      timestamps: true
    });
  
    return Customer;
  };
  