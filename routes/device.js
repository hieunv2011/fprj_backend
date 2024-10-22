const express = require('express');
const Device = require('../models/Device');
const router = express.Router();

// POST /devices - Thêm mới thiết bị
router.post('/', async (req, res) => {
  try {
    const { deviceId, name, location, status, latitude, longitude } = req.body;

    // Kiểm tra xem deviceId đã tồn tại chưa
    const existingDevice = await Device.findOne({ deviceId });
    if (existingDevice) {
      return res.status(400).json({ message: 'Device ID already exists' });
    }

    // Tạo thiết bị mới
    const newDevice = new Device({
      deviceId,
      name,
      location,
      status,
      latitude,  // Thêm latitude
      longitude, // Thêm longitude
    });

    await newDevice.save();
    res.status(201).json({ message: 'Device added successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// GET /devices - Lấy danh sách tất cả các thiết bị
router.get('/', async (req, res) => {
  try {
    const devices = await Device.find();
    res.status(200).json(devices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
