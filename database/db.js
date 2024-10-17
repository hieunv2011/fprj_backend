const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(
      'mongodb+srv://kz01123008:1@mymongodb.33jb4.mongodb.net/?retryWrites=true&w=majority&appName=mymongodb',
      { useNewUrlParser: true, useUnifiedTopology: true }
    );
    console.log('MongoDB connected to Atlas');
  } catch (error) {
    console.error('Error connecting to MongoDB Atlas:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
