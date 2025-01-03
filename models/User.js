const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  username: {  
    type: String,
    required: true,
    unique: true
  },
  phone: {  
    type: String,
    required: true,
    unique: true  
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'manager'], 
    default: 'user'
  },
  contact: {
    email: String,
    address: String,
    coordinates: {
      lat: { type: Number, required: false },
      lng: { type: Number, required: false }
    },
    building: String,
    emergencyContact: String
  },
  devices: [
    {
      deviceId: { type: String, required: true },
    }
  ],
  fcmtoken: {
    type: String,
    required: false
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
