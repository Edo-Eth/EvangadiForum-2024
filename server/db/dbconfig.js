const mysql2 = require("mysql2");
const dotenv = require("dotenv");
dotenv.config();

const dbConnection = mysql2.createPool({
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  password: process.env.DB_PASS,
});

// Connect to the database
// dbConnection.getConnection((err) => {
//   if (err) {
//     console.error("Database connection failed:", err.message);
//     return;
//   } else {
//     // console.log("Connected to the Hostinger database successfully!");
//   }
// });
module.exports = dbConnection.promise();
