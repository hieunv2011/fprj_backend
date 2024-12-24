const admin = require('firebase-admin');
const mqtt = require('mqtt');
const serviceAccount = require('./firebase/key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const registrationToken = 'dIP65YJMTyitkDk04_eJZR:APA91bF8fbOm3RrO5MhMQZztPBQdTeZ7i9tzx4V6gpoQeYbpWE1MSt9e5eZMU0O6-XUPSwKoMDAYTS9EmYjBqFKtz7tD3fyjrZ4dIG4V6a7Xe4f04mAlu70';

// Kết nối MQTT
const mqttClient = mqtt.connect('mqtt://103.1.238.175', {
  port: 1883,
  username: 'test',
  password: 'testadmin',
});

mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker');
  const topic = 'nvhdevice'; // Topic mà bạn muốn subscribe
  mqttClient.subscribe(topic, (err) => {
    if (err) {
      console.log('Subscription failed:', err);
    } else {
      console.log(`Subscribed to topic: ${topic}`);
    }
  });
});

// Hàm kiểm tra các chỉ số và tạo thông báo cảnh báo
function checkForDanger(data) {
  let messageText = '';
  let isDanger = false;

  if (data.gas_ppm > 2000) {
    messageText += 'Gas is danger; ';
    isDanger = true;
  }
  
  if (data.flame_detected === 0) {
    messageText += 'Fire is danger; ';
    isDanger = true;
  }
  
  if (data.temperature > 100) {
    messageText += 'Temperature is danger; ';
    isDanger = true;
  }
  
  if (data.humidity < 30) {
    messageText += 'Humidity is danger; ';
    isDanger = true;
  }
  
  if (data.dust_density > 1000) {
    messageText += 'Dust density is danger; ';
    isDanger = true;
  }

  return { messageText, isDanger };
}

// Nhận dữ liệu từ MQTT và kiểm tra
mqttClient.on('message', async (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    console.log(`Data received from topic ${topic}:`, data);

    if (!data || Object.keys(data).length === 0) {
      console.log("Received empty data");
      return;
    }

    for (const deviceName of Object.keys(data)) {
      const deviceData = data[deviceName];
      
      // Kiểm tra dữ liệu và gửi thông báo nếu có nguy hiểm
      const { messageText, isDanger } = checkForDanger(deviceData);
      if (isDanger) {
        const notificationMessage = {
          notification: {
            title: 'Cảnh báo!',
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
      } else {
        console.log('No danger detected.');
      }
    }

  } catch (error) {
    console.error('Error parsing message:', error);
  }
});
