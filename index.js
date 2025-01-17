const express = require("express");
const connectDB = require("./database/db");
const mqtt = require("mqtt");
const cors = require("cors");
const userRoutes = require("./routes/user");
const deviceRoutes = require("./routes/device");
const otpRoutes = require("./routes/otp");
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
app.use("/api/otp",otpRoutes)

// FCM
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const registrationToken = 'eN1BplU5S0KLqb99f380kW:APA91bFc9ZgQPsywg3l1Em7-24_eumss1IJFnbv8kNY8xuk-cvx1bbzCPdGZqHaQxPoEWrEqQWTQyM8FRtptiZstmITEkmEeoZog6BIDmjQtdFwInATMh6E';

const mqttClient = mqtt.connect("mqtt://103.1.238.175", {
  port: 1883,
  username: "test",
  password: "testadmin",
});

mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker');
  const topic = 'nvhdevice'; // Đặt tên topic là 'device'
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
  const dangers = [];

  if (data.gas_ppm > 300) {
    dangers.push("Gas is danger");
    isDanger = true;
  }

  if (data.flame_detected === 0) {
    dangers.push("Fire is danger");
    isDanger = true;
  }

  if (data.temperature > 60) {
    dangers.push("Temperature is danger");
    isDanger = true;
  }

  if (data.humidity < 29) {
    dangers.push("Humidity is danger");
    isDanger = true;
  }

  messageText = dangers.join('; ');

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

    let allWarnings = true;

    for (const deviceName of Object.keys(data)) {
      const deviceData = data[deviceName];

      const { isDanger } = checkForDanger(deviceData);

      const responseData = {
        gas_ppm: deviceData.gas_ppm > 300 ? "warning" : "normal",
        flame_detected: deviceData.flame_detected === 0 ? "warning" : "normal",
        temperature: deviceData.temperature > 60 ? "warning" : "normal",
        humidity: deviceData.humidity < 29 ? "warning" : "normal",
      };

      console.log("Response Data:", responseData);

      // Kiểm tra nếu tất cả các giá trị đều không phải warning
      if (Object.values(responseData).includes("normal")) {
        allWarnings = false;
      }

      // Gửi phản hồi lên topic mới dựa vào tên thiết bị
      const responseTopic = `nvhresponse/${deviceName}`;
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
        // Kiểm tra dữ liệu và gửi thông báo nếu có nguy hiểm
        const { messageText } = checkForDanger(deviceData);
        const notificationMessage = {
          notification: {
            title: deviceName,
            body: messageText,
          },
          data: {
            score: '850',
            time: '2:45',
          },
          token: registrationToken,
        };

        admin.messaging()
          .send(notificationMessage)
          .then((response) => {
            console.log('Successfully sent message:', response);
          })
          .catch((error) => {
            console.error('Error sending message:', error);
          });

        // MongoDB Update
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

    // Gửi topic nvhalarm với giá trị on/off
    const alarmStatus = allWarnings ? "on" : "off";
    mqttClient.publish("nvhalarm", alarmStatus, (err) => {
      if (err) {
        console.log("Error sending alarm status:", err);
      } else {
        console.log(`Alarm status set to: ${alarmStatus}`);
      }
    });
  } catch (error) {
    console.error("Error parsing message:", error);
  }
});

// Khởi động server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
