// const express = require("express");
// const connectDB = require("./database/db");
// const mqtt = require("mqtt");
// const userRoutes = require("./routes/user");
// const deviceRoutes = require("./routes/device");
// const authorize = require("./middleware/authorize");
// require('dotenv').config(); // Thêm dòng này để sử dụng biến môi trường từ file .env

// const app = express();
// const port = process.env.PORT || 3008; // Sử dụng biến môi trường PORT

// connectDB();

// app.use(express.json());

// // Kết nối tới MQTT broker với clientId duy nhất
// const mqttClient = mqtt.connect("mqtt://broker.hivemq.com", {
//   clientId: "nodejs_mqtt_client",
//   port: 1883,
// });

// // Khi kết nối thành công với MQTT broker
// mqttClient.on("connect", () => {
//   console.log("Connected to MQTT broker");

//   mqttClient.subscribe("device001", (err) => {
//     if (!err) {
//       console.log("Subscribed to device001");
//     } else {
//       console.error("Error subscribing: ", err);
//     }
//   });

//   mqttClient.subscribe("device002", (err) => {
//     if (!err) {
//       console.log("Subscribed to device002");
//     } else {
//       console.error("Error subscribing: ", err);
//     }
//   });
// });

// // Định nghĩa routes cho API
// app.use("/api/users", userRoutes);
// app.use("/api/devices", deviceRoutes);

// // Middleware authorize như trước
// app.use((req, res, next) => {
//   if (req.path.startsWith("/api/users/register")) {
//     authorize(["admin"])(req, res, next);
//   } else if (req.path.startsWith("/api/devices") && req.method === "POST") {
//     authorize(["admin", "manager"])(req, res, next);
//   } else if (!req.path.startsWith("/api/users/login")) {
//     authorize(["admin", "manager", "user"])(req, res, next);
//   } else if (!req.path.startsWith("/api/users/me")) {
//     authorize(["admin", "manager", "user"])(req, res, next);
//   } else {
//     next();
//   }
// });

// app.listen(port, () => {
//   console.log(`Server running on port ${port}`);
// });

const express = require("express");
const connectDB = require("./database/db");
const mqtt = require("mqtt");
const cors = require("cors"); // Import cors
const userRoutes = require("./routes/user");
const deviceRoutes = require("./routes/device");
const authorize = require("./middleware/authorize");
require('dotenv').config(); // Sử dụng biến môi trường từ file .env

const app = express();
const port = process.env.PORT || 3008; // Sử dụng biến môi trường PORT

connectDB();

// Middleware
app.use(cors()); // Thêm cors middleware
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

// Định nghĩa routes cho API
app.use("/api/users", userRoutes);
app.use("/api/devices", deviceRoutes);

// Middleware authorize
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

// Khởi động server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

