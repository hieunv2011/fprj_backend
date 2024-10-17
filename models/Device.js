//   // const mongoose = require('mongoose');
//   // const Schema = mongoose.Schema;

//   // const deviceSchema = new Schema({
//   //   deviceId: {
//   //     type: String,
//   //     required: true,
//   //     unique: true
//   //   },
//   //   name: {
//   //     type: String,
//   //     required: true
//   //   },
//   //   location: {
//   //     type: String,
//   //     required: true
//   //   },
//   //   status: {
//   //     type: String,
//   //     enum: ['active', 'inactive', 'maintenance'],
//   //     default: 'active'
//   //   },
//   //   lastChecked: {
//   //     type: Date,
//   //     default: Date.now
//   //   }
//   // });

//   // const Device = mongoose.model('Device', deviceSchema);

//   // module.exports = Device;
//   const mongoose = require('mongoose');
// const Schema = mongoose.Schema;

// const sensorDataSchema = new Schema({
//   mq: {
//     type: Number,
//     default: null
//   },
//   temperature: {
//     type: Number,
//     default: null
//   },
//   humidity: {
//     type: Number,
//     default: null
//   },
//   timestamp: {
//     type: Date,
//     default: Date.now
//   }
// });

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
//   lastChecked: {
//     type: Date,
//     default: Date.now
//   },
//   sensorData: [sensorDataSchema] // Thay đổi thành mảng chứa các đối tượng sensorData
// });

// const Device = mongoose.model('Device', deviceSchema);

// module.exports = Device;

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

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
  sensorData: { type: Array, default: [] }, 
  lastChecked: {
    type: Date,
    default: Date.now
  }
});

const Device = mongoose.model('Device', deviceSchema);
module.exports = Device; // Đảm bảo rằng bạn export mô hình đúng cách
