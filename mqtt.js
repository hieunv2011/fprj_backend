const express = require("express");
const connectDB = require("./database/db");
const mqtt = require("mqtt");
const cors = require("cors");
const userRoutes = require("./routes/user");
const deviceRoutes = require("./routes/device");
const Device = require("./models/Device"); // Import model Device
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3008;

// Kết nối tới MongoDB
connectDB();

// Kết nối tới MQTT broker
const mqttClient = mqtt.connect('mqtt://103.1.238.175', {
  port: 1883,
  username: 'test',
  password: 'testadmin'
});

// Middleware
app.use(cors());
app.use(express.json());

// Lắng nghe dữ liệu từ các topic (ví dụ: device002, device003)
mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker');
  const topics = ['device002', 'device003']; // Các topic cần subscribe
  mqttClient.subscribe(topics, (err) => {
    if (err) {
      console.log('Subscription failed:', err);
    } else {
      console.log('Subscribed to topics:', topics.join(', '));
    }
  });
});

// Khi nhận được dữ liệu từ topic, cập nhật vào sensorData của thiết bị
mqttClient.on('message', async (topic, message) => {  
  try {
    const data = JSON.parse(message.toString()); // Chuyển dữ liệu từ MQTT thành JSON
    console.log(`Data received from topic ${topic}:`, data); // Kiểm tra dữ liệu nhận được từ MQTT

    // Tìm thiết bị theo deviceId từ topic
    const deviceId = topic; // Giả sử tên topic chính là deviceId, ví dụ 'device002', 'device003'
    const device = await Device.findOne({ deviceId });

    if (device) {
      // Kiểm tra xem dữ liệu nhận được có chứa sensorData không
      if (data && data.sensorData) {
        const sensorData = data.sensorData;

        // Thêm dữ liệu sensorData vào mảng sensorData của thiết bị
        device.sensorData.push(sensorData);
        device.lastChecked = Date.now();  // Cập nhật thời gian kiểm tra cuối cùng
        await device.save(); // Lưu lại dữ liệu vào cơ sở dữ liệu
        console.log(`Updated sensorData for device ${deviceId}`);
      } else {
        console.log('No sensorData in message');
      }
    } else {
      console.log(`Device with deviceId ${deviceId} not found`);
    }
  } catch (error) {
    console.error('Error parsing message:', error);
  }
});


// Định nghĩa routes cho API
app.use("/api/users", userRoutes);
app.use("/api/devices", deviceRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
