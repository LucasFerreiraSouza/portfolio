require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log("MongoDB conectado!");
};

module.exports = connectDB;
