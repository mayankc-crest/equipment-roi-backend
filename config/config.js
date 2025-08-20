require("dotenv").config();
module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    post: process.env.DB_PORT,
    dialect: process.env.DIALECT,
    // timezone: "Asia/Kolkata",
    // timezone: "+05:30",
  },
  test: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    post: process.env.DB_PORT,
    dialect: process.env.DIALECT,
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    post: process.env.DB_PORT,
    dialect: process.env.DIALECT,
    // timezone: 'Asia/Kolkata',
    // timezone: "+05:30",
  },
};
