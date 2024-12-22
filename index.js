const express = require("express");
const connectDB = require("./database/db");
const mqtt = require("mqtt");
const cors = require("cors");
const userRoutes = require("./routes/user");
const deviceRoutes = require("./routes/device");
const Device = require("./models/Device");
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3008;
// Kết nối DB
connectDB();
// Middleware
app.use(cors());
app.use(express.json());
// Định nghĩa routes cho API
app.use("/api/users", userRoutes);
app.use("/api/devices", deviceRoutes);

const mqttClient = mqtt.connect('mqtt://103.1.238.175', {
  port: 1883,
  username: 'test',
  password: 'testadmin'
});
// const mqttClient = mqtt.connect('mqtt://broker.hivemq.com');

// Kết nối và subscribe tới topic 'device'
mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker');
  const topic = 'nguyenviethieudevice'; // Đặt tên topic là 'device'
  mqttClient.subscribe(topic, (err) => {
    if (err) {
      console.log('Subscription failed:', err);
    } else {
      console.log(`Subscribed to topic: ${topic}`);
    }
  });
});

// Nhận dữ liệu từ topic 'device' và xử lý
mqttClient.on('message', async (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    console.log(`Data received from topic ${topic}:`, data);

    if (!data || Object.keys(data).length === 0) {
      console.log("Received empty data");
      return;
    }

    for (const deviceName of Object.keys(data)) {
      const deviceData = data[deviceName];
      const device = await Device.findOne({ deviceId: deviceName });

      if (device) {
        device.sensorData.push(deviceData);
        device.lastChecked = Date.now();
        await device.save();
        console.log(`Updated sensorData for device ${deviceName}`);
      } else {
        console.log(`Device with deviceId ${deviceName} not found`);
      }

      let responseData = {
        gas_ppm: "normal",
        flame_detected: "normal",
        temperature: "normal",
        humidity: "normal",
        dust_density: "normal"
      };
      let warning = false;

      if (deviceData.gas_ppm > 2000) {
        responseData.gas_ppm = "warning";
        warning = true;
      }

      if (deviceData.flame_detected === 0) {
        responseData.flame_detected = "warning";
        warning = true;
      }

      if (deviceData.temperature > 100) {
        responseData.temperature = "warning";
        warning = true;
      }

      if (deviceData.humidity < 30) {
        responseData.humidity = "warning";
        warning = true;
      }

      if (deviceData.dust_density > 1000) {
        responseData.dust_density = "warning";
        warning = true;
      }

      console.log("Response Data:", responseData);

      // Gửi phản hồi lên topic mới dựa vào tên thiết bị
      const responseTopic = `nguyenviethieu/${deviceName}`;
      // const responseTopic = `nguyenviethieu`;
      mqttClient.publish(responseTopic, JSON.stringify(responseData), (err) => {
        if (err) {
          console.log('Error sending data:', err);
        } else {
          console.log(`Sent data to topic ${responseTopic}`);
        }
      });
    }

  } catch (error) {
    console.error('Error parsing message:', error);
  }
});


// Khởi động server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

