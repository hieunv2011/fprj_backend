// Import các thư viện cần thiết
const mqtt = require("mqtt");
const admin = require("firebase-admin");

// Tải tệp serviceAccountKey.json từ Firebase Console
const serviceAccount = require("./firebase/node.json"); // Đảm bảo bạn thay đổi đúng đường dẫn

// Khởi tạo Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://nodejs-271db-default-rtdb.firebaseio.com" // Đảm bảo URL trùng với Firebase Realtime Database của bạn
});

// Truy cập vào Firebase Realtime Database
const db = admin.database();

// Kết nối với MQTT broker
const mqttClient = mqtt.connect('mqtt://103.1.238.175', {
  port: 1883,
  username: 'test',
  password: 'testadmin'
});

// Đăng ký để nhận dữ liệu từ topic MQTT (ví dụ: "sensor/data")
mqttClient.on('connect', () => {
  console.log("Kết nối thành công với MQTT Broker!");
  mqttClient.subscribe('device', (err) => {
    if (err) {
      console.log("Lỗi khi đăng ký topic:", err);
    } else {
      console.log("Đã đăng ký nhận dữ liệu từ topic 'device'");
    }
  });
});

// Lắng nghe và xử lý dữ liệu nhận từ MQTT
mqttClient.on('message', (topic, message) => {
  console.log(`Đã nhận dữ liệu từ topic ${topic}:`, message.toString());

  // Dữ liệu nhận được từ MQTT (ví dụ: JSON data)
  const data = JSON.parse(message.toString());

  // Đẩy dữ liệu lên Firebase Realtime Database
  const ref = db.ref("sensorData"); // Chọn node 'sensorData'
  const newDataRef = ref.push();  // Tạo ID ngẫu nhiên cho dữ liệu mới
  newDataRef.set(data, (error) => {
    if (error) {
      console.log("Dữ liệu không thể lưu:", error);
    } else {
      console.log("Dữ liệu đã được lưu thành công vào Firebase!");
    }
  });
});

// Lắng nghe sự kiện lỗi MQTT
mqttClient.on('error', (err) => {
  console.log("Lỗi MQTT:", err);
});
