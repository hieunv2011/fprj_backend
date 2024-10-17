const mongoose = require('mongoose');
require('dotenv').config(); // Thêm dòng này để sử dụng biến môi trường từ file .env

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { // Sử dụng biến môi trường
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected to Atlas');
  } catch (error) {
    console.error('Error connecting to MongoDB Atlas:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
