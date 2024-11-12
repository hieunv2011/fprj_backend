const express = require("express");
const connectDB = require("./database/db");
const mqtt = require("mqtt");
const cors = require("cors");
const userRoutes = require("./routes/user");
const deviceRoutes = require("./routes/device");
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3008;

connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Kết nối tới MQTT broker
const mqttClient = mqtt.connect("mqtt://broker.hivemq.com", {
  clientId: "nodejs_mqtt_client",
  port: 1883,
});

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

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
