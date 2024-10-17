// const express = require("express");
// const mongoose = require("mongoose");
// const path = require("path");
// const connectDB = require("./database/db");
// const userRoutes = require("./routes/user");
// const deviceRoutes = require("./routes/device");
// const authorize = require('./middleware/authorize');

// const app = express();
// const port = 3008;

// connectDB();

// app.use(express.json());

// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// app.use((req, res, next) => {
//   if (req.path.startsWith('/api/users/register')) {
//     authorize(['admin'])(req, res, next);
//   } else if (req.path.startsWith('/api/devices') && req.method === 'POST') {
//     authorize(['admin', 'manager'])(req, res, next);
//   } else if (!req.path.startsWith('/api/users/login')) {
//     authorize(['admin', 'manager', 'user'])(req, res, next);
//   } else {
//     next();
//   }
// });

// app.use("/api/users", userRoutes);
// app.use("/api/devices", deviceRoutes);

// app.listen(port, () => {
//   console.log(`Server running on port ${port}`);
// });

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const connectDB = require("./database/db");
const Device = require("./models/Device");
const mqtt = require("mqtt");
const userRoutes = require("./routes/user"); // Bổ sung lại route người dùng
const deviceRoutes = require("./routes/device");
const authorize = require("./middleware/authorize");

const app = express();
const port = 3008;

connectDB();

app.use(express.json());

// Kết nối tới MQTT broker với clientId duy nhất
const mqttClient = mqtt.connect("mqtt://broker.hivemq.com", {
  clientId: "nodejs_mqtt_client",
  port: 1883,
});

// Khi kết nối thành công với MQTT broker
mqttClient.on("connect", () => {
  console.log("Connected to MQTT broker");

  mqttClient.subscribe("device001", (err) => {
    if (!err) {
      console.log("Subscribed to device001");
    } else {
      console.error("Error subscribing: ", err);
    }
  });

  mqttClient.subscribe("device002", (err) => {
    if (!err) {
      console.log("Subscribed to device002");
    } else {
      console.error("Error subscribing: ", err);
    }
  });
});

// mqttClient.on("message", async (topic, message) => {
//     console.log(`Received message on topic ${topic}: ${message.toString()}`);

//     const deviceId = topic.split('/')[0];  // Tách deviceId từ topic
//     let sensorData;
//     try {
//         sensorData = JSON.parse(message.toString());  // Chuyển đổi dữ liệu nhận được sang JSON
//     } catch (error) {
//         console.error(`Error parsing message: ${error}`);
//         return;
//     }

//     console.log(`Parsed sensor data for ${deviceId}:`, sensorData);

//     try {
//         const updatedDevice = await Device.findOneAndUpdate(
//             { deviceId: deviceId },
//             { $push: { sensorData: sensorData }, lastChecked: new Date() },
//             { new: true, upsert: false }
//         );

//         if (updatedDevice) {
//             console.log(`Data updated for ${deviceId}`);
//         } else {
//             console.log(`Device with ID ${deviceId} not found`);
//         }
//     } catch (error) {
//         console.error(`Error updating data for ${deviceId}:`, error);
//     }
// });

// Định nghĩa routes cho API
app.use("/api/users", userRoutes); // Bổ sung lại route người dùng để xử lý đăng nhập
app.use("/api/devices", deviceRoutes);

// Middleware authorize như trước
app.use((req, res, next) => {
  if (req.path.startsWith("/api/users/register")) {
    authorize(["admin"])(req, res, next);
  } else if (req.path.startsWith("/api/devices") && req.method === "POST") {
    authorize(["admin", "manager"])(req, res, next);
  } else if (!req.path.startsWith("/api/users/login")) {
    authorize(["admin", "manager", "user"])(req, res, next);
  } else if (!req.path.startsWith("/api/users/me")) {
    authorize(["admin", "manager", "user"])(req, res, next);
  } else {
    next();
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
