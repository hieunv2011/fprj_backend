const express = require("express");
const connectDB = require("./database/db");
const mqtt = require("mqtt");
const cors = require("cors");
const userRoutes = require("./routes/user");
const deviceRoutes = require("./routes/device");
const Device = require("./models/Device");
const admin = require("firebase-admin");
const serviceAccount = require("./firebase/key.json");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3008;

// Kết nối DB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api/users", userRoutes);
app.use("/api/devices", deviceRoutes);

// FCM
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const mqttClient = mqtt.connect("mqtt://103.1.238.175", {
  port: 1883,
  username: "test",
  password: "testadmin",
});
mqttClient.on("connect", () => {
  console.log("Connected to MQTT broker");
  const topic = "nguyenviethieudevice";
  mqttClient.subscribe(topic, (err) => {
    if (err) {
      console.log("Subscription failed:", err);
    } else {
      console.log(`Subscribed to topic: ${topic}`);
    }
  });
});

// Alert function
function checkForDanger(data) {
  let messageText = "";
  let isDanger = false;

  if (data.gas_ppm > 2000) {
    messageText += "Gas is danger; ";
    isDanger = true;
  }

  if (data.flame_detected === 0) {
    messageText += "Fire is danger; ";
    isDanger = true;
  }

  if (data.temperature > 100) {
    messageText += "Temperature is danger; ";
    isDanger = true;
  }

  if (data.humidity < 30) {
    messageText += "Humidity is danger; ";
    isDanger = true;
  }

  if (data.dust_density > 1000) {
    messageText += "Dust density is danger; ";
    isDanger = true;
  }

  return { messageText, isDanger };
}

// Nhận dữ liệu từ topic 'device' và xử lý
mqttClient.on("message", async (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    console.log(`Data received from topic ${topic}:`, data);

    if (!data || Object.keys(data).length === 0) {
      console.log("Received empty data");
      return;
    }

    for (const deviceName of Object.keys(data)) {
      const deviceData = data[deviceName];

      const { isDanger } = checkForDanger(deviceData);

      const responseData = {
        gas_ppm: deviceData.gas_ppm > 2000 ? "warning" : "normal",
        flame_detected: deviceData.flame_detected === 0 ? "warning" : "normal",
        temperature: deviceData.temperature > 100 ? "warning" : "normal",
        humidity: deviceData.humidity < 30 ? "warning" : "normal",
        dust_density: deviceData.dust_density > 1000 ? "warning" : "normal",
      };

      console.log("Response Data:", responseData);

      // Gửi phản hồi lên topic mới dựa vào tên thiết bị
      const responseTopic = `nguyenviethieu/${deviceName}`;
      mqttClient.publish(responseTopic, JSON.stringify(responseData), (err) => {
        if (err) {
          console.log("Error sending data:", err);
        } else {
          console.log(`Sent data to topic ${responseTopic}`);
        }
      });
      if (!isDanger) {
        console.log("No danger detected; data not saved");
        continue;
      }
      if (isDanger) {
        const device = await Device.findOne({ deviceId: deviceName });
        if (device) {
          device.sensorData.push(deviceData);
          device.lastChecked = Date.now();
          await device.save();
          console.log(`Updated sensorData for device ${deviceName}`);
        } else {
          console.log(`Device with deviceId ${deviceName} not found`);
        }
      }
    }
  } catch (error) {
    console.error("Error parsing message:", error);
  }
});

// Khởi động server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
