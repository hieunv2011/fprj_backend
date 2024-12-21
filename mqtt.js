const mqtt = require('mqtt');

// Kết nối tới MQTT Broker
const client = mqtt.connect('mqtt://broker.hivemq.com'); // Sử dụng MQTT qua TCP

// Khi kết nối thành công
client.on('connect', () => {
  console.log('Đã kết nối thành công với MQTT Broker');
  
  const topic = 'nguyenviethieudevice'; // Tên topic cần theo dõi

  // Đăng ký lắng nghe topic
  client.subscribe(topic, (err) => {
    if (err) {
      console.error('Lỗi khi đăng ký lắng nghe topic:', err);
    } else {
      console.log(`Đang lắng nghe dữ liệu từ topic: "${topic}"`);
    }
  });
});

// Khi nhận được dữ liệu từ topic
client.on('message', (topic, message) => {
  console.log(`Nhận dữ liệu từ topic "${topic}": ${message.toString()}`);
});

// Khi gặp lỗi
client.on('error', (err) => {
  console.error('Lỗi kết nối MQTT:', err);
});
