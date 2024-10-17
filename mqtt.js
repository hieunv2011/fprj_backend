const mqtt = require("mqtt");

const brokerUrl = "mqtt://broker.hivemq.com"; // URL broker
const clientId = "simplePublisher"; // Client ID

// Create client
const client = mqtt.connect(brokerUrl, {
  clientId,
  clean: true,
});

// Kết nối thành công
client.on("connect", () => {
  console.log("Đã kết nối thành công với HiveMQ.");

  // JSON dữ liệu cần đẩy lên
  const data = {
    deviceId: "device001",
    temperature: 25,
    humidity: 60,
  };

  // Gửi dữ liệu lên topic "devices/data"
  client.publish("devices/data", JSON.stringify(data), (err) => {
    if (!err) {
      console.log(`Đã gửi dữ liệu: ${JSON.stringify(data)}`);
    } else {
      console.error("Lỗi khi gửi dữ liệu:", err);
    }
  });
});

// Xử lý lỗi kết nối
client.on("error", (err) => {
  console.error("Lỗi kết nối:", err);
});
