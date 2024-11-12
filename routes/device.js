const express = require('express');
const Device = require('../models/Device');
const User = require('../models/User');
const authorize = require('../middleware/authorize');
const router = express.Router();

// POST /devices - Thêm mới thiết bị
router.post('/', authorize(['admin', 'manager']), async (req, res) => {
  try {
    const { deviceId, name, location, status, latitude, longitude } = req.body;

    const existingDevice = await Device.findOne({ deviceId });
    if (existingDevice) {
      return res.status(400).json({ message: 'Device ID already exists' });
    }

    const newDevice = new Device({
      deviceId,
      name,
      location,
      status,
      latitude,
      longitude,
    });

    await newDevice.save();
    res.status(201).json({ message: 'Device added successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /devices - Lấy danh sách tất cả các thiết bị
router.get('/', authorize(['admin', 'manager']), async (req, res) => {
  try {
    const devices = await Device.find();
    res.status(200).json(devices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// GET /devices/:deviceId - Lấy thông tin của thiết bị theo deviceId
router.get('/:deviceId', authorize(['admin', 'manager', 'user']), async (req, res) => {
  const deviceId = req.params.deviceId;

  try {
    // Tìm thiết bị theo deviceId
    const device = await Device.findOne({ deviceId });
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    // Trả về thông tin thiết bị
    res.status(200).json({
      deviceId: device.deviceId,
      name: device.name,
      location: device.location,
      status: device.status,
      latitude: device.latitude,
      longitude: device.longitude,
      sensorData: device.sensorData,
      lastChecked: device.lastChecked
    });
  } catch (error) {
    console.error(error); // Log lỗi nếu có
    res.status(500).json({ message: error.message });
  }
});



// GET /user-devices/:userId - Lấy danh sách thiết bị của người dùng theo userId
router.get('/user-devices/:userId', authorize(['admin', 'manager','user']), async (req, res) => {
  try {
    const userId = req.params.userId;

    // Tìm người dùng theo userId
    const user = await User.findById(userId).populate('devices.deviceId');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Nếu người dùng có thiết bị, trả về danh sách thiết bị
    if (user.devices && user.devices.length > 0) {
      const deviceList = user.devices.map(device => device.deviceId);
      res.status(200).json(deviceList);
    } else {
      res.status(404).json({ message: 'No devices found for this user' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});


module.exports = router;
