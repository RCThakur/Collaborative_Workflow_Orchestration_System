const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./src/config/db.js");

dotenv.config();
connectDB();

const app = express();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
