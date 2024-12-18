// const express = require("express");
// const connectDB = require("./database/db");
// const mqtt = require("mqtt");
// const cors = require("cors");
// const userRoutes = require("./routes/user");
// const deviceRoutes = require("./routes/device");
// require('dotenv').config();

// const app = express();
// const port = process.env.PORT || 3008;

// connectDB();

// // Middleware
// app.use(cors());
// app.use(express.json());


// // Định nghĩa routes cho API
// app.use("/api/users", userRoutes);
// app.use("/api/devices", deviceRoutes);

// app.listen(port, () => {
//   console.log(`Server running on port ${port}`);
// });
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
connectDB();
// Kết nối tới MQTT broker
const mqttClient = mqtt.connect('mqtt://103.1.238.175', {
  port: 1883,
  username: 'test',
  password: 'testadmin'
});

// Kết nối và subscribe tới topic 'device'
mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker');
  const topic = 'device'; // Đặt tên topic là 'device'
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

    // Đảm bảo hàm xử lý là async để sử dụng await
    for (const deviceName of Object.keys(data)) {
      const deviceData = data[deviceName];

      //Xử lý MongoDb
      const device = await Device.findOne({ deviceId: deviceName });  // Thêm đúng key 'deviceId'
      if (device) {
        device.sensorData.push(deviceData);
        device.lastChecked = Date.now();
        await device.save(); // Lưu lại dữ liệu vào cơ sở dữ liệu
        console.log(`Updated sensorData for device ${deviceName}`);
      } else {
        console.log(`Device with deviceId ${deviceName} not found`);
      }


      if (!deviceData) {
        console.log(`No data found for device: ${deviceName}`);
        continue;
      }

      let responseData = {
        gas_ppm: "normal",
        flame_detected: "normal",
        temperature: "normal",
        humidity: "normal",
        dust_density: "normal"
      }; // Khởi tạo tất cả là 'normal'
      let warning = false;

      // Kiểm tra các giá trị trong data và tạo cảnh báo nếu cần
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
      const responseTopic = `response/${deviceName}`;
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
// Định nghĩa routes cho API
app.use("/api/users", userRoutes);
app.use("/api/devices", deviceRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});