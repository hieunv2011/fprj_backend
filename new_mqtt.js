const mqtt = require("mqtt");

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
mqttClient.on('message', (topic, message) => {
  try {
    // Chuyển đổi message thành JSON
    const data = JSON.parse(message.toString());
    console.log(`Data received from topic ${topic}:`, data);

    if (!data || Object.keys(data).length === 0) {
      console.log("Received empty data");
      return;
    }

    // Duyệt qua từng key trong data (tên thiết bị như 'device002', 'device003')
    Object.keys(data).forEach((deviceName) => {
      const deviceData = data[deviceName];
      
      if (!deviceData) {
        console.log(`No data found for device: ${deviceName}`);
        return;
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
    });

  } catch (error) {
    console.error('Error parsing message:', error);
  }
});
