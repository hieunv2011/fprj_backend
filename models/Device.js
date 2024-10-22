// const mongoose = require('mongoose');
// const Schema = mongoose.Schema;

// const deviceSchema = new Schema({
//   deviceId: {
//     type: String,
//     required: true,
//     unique: true
//   },
//   name: {
//     type: String,
//     required: true
//   },
//   location: {
//     type: String,
//     required: true
//   },
//   status: {
//     type: String,
//     enum: ['active', 'inactive', 'maintenance'],
//     default: 'active'
//   },
//   sensorData: { type: Array, default: [] }, 
//   lastChecked: {
//     type: Date,
//     default: Date.now
//   }
// });

// const Device = mongoose.model('Device', deviceSchema);
// module.exports = Device; // Đảm bảo rằng bạn export mô hình đúng cách
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const sensorDataSchema = new Schema({
  mq: {
    type: Number,
    default: null
  },
  temperature: {
    type: Number,
    default: null
  },
  humidity: {
    type: Number,
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const deviceSchema = new Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active'
  },
  latitude: { // Thêm trường latitude
    type: Number,
    required: true
  },
  longitude: { // Thêm trường longitude
    type: Number,
    required: true
  },
  sensorData: { 
    type: Array, 
    default: [] 
  },
  lastChecked: {
    type: Date,
    default: Date.now
  }
});

const Device = mongoose.model('Device', deviceSchema);
module.exports = Device; // Đảm bảo rằng bạn export mô hình đúng cách

