const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const mongoose = require('mongoose');
const connectDB = require('./database/db'); // Kết nối MongoDB từ file db.js
require('dotenv').config(); // Đảm bảo dotenv được sử dụng

// Thiết lập Express
const app = express();
const server = http.createServer(app);

// Tạo WebSocket server
const wss = new WebSocket.Server({ server });

// Kết nối MongoDB
connectDB();

// Mongoose Model cho Device
const Device = mongoose.model('Device', new mongoose.Schema({
  deviceId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  location: { type: String, required: true },
  status: { type: String, enum: ['active', 'inactive', 'maintenance'], default: 'active' },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  sensorData: { type: Array, default: [] },
  lastChecked: { type: Date, default: Date.now }
}));

// WebSocket connection và xử lý
wss.on('connection', (ws) => {
  console.log('Client connected');

  // Khi nhận dữ liệu từ client
  ws.on('message', async (message) => {
    console.log('Received:', message);

    // Giả sử client gửi deviceId, chúng ta truy vấn thông tin từ MongoDB
    const deviceId = message; // Giả sử deviceId được gửi qua WebSocket

    try {
      const device = await Device.findOne({ deviceId });
      if (!device) {
        ws.send(JSON.stringify({ error: 'Device not found' }));
      } else {
        ws.send(JSON.stringify(device)); // Gửi dữ liệu của thiết bị
      }
    } catch (error) {
      ws.send(JSON.stringify({ error: 'Error fetching device data' }));
    }
  });

  // Khi client ngắt kết nối
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Lắng nghe server tại port 3008
const PORT = process.env.PORT || 3008;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
