const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Device = require('../models/Device');
const router = express.Router();
const authorize = require('../middleware/authorize');


const JWT_SECRET = 'your_jwt_secret_key';

// POST register
router.post('/register', async (req, res) => {
  try {
    const { email, password, username, phone, role, contact, devices } = req.body;

    console.log('Received data:', req.body); // Log dữ liệu nhận được

    const existingUser = await User.findOne({ $or: [{ email }, { username }, { phone }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Email, username, or phone number already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      email,
      password: hashedPassword,
      username,
      phone,
      role,
      contact,
      devices
    });

    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error(error); // Log lỗi nếu có
    res.status(500).json({ message: error.message });
  }
});
// POST login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, role: user.role });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Middleware để xác thực token JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Access token is missing' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });

    req.user = user;
    next();
  });
};

// GET /me - Lấy thông tin người dùng hiện tại
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET / - Lấy danh sách tất cả người dùng
router.get('/', authorize(['admin', 'manager']), async (req, res) => {
  try {
    // Lấy tất cả người dùng, trừ mật khẩu để bảo mật
    const users = await User.find().select('-password');
    
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});
// PUT /users/:id - Cập nhật thông tin người dùng
router.put('/:id', authorize(['admin', 'manager','user']), async (req, res) => {
  const userId = req.params.id;
  const { email, password, username, phone, role, contact, devices } = req.body;

  try {
    // Tìm người dùng theo userId
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Kiểm tra trùng lặp email, username, phone trong cơ sở dữ liệu (ngoại trừ người dùng hiện tại)
    const existingUser = await User.findOne({
      $or: [
        { email },
        { username },
        { phone }
      ],
      _id: { $ne: userId }  // Đảm bảo không trùng với chính người dùng đang cập nhật
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Email, username, or phone number already exists' });
    }

    // Cập nhật các trường nếu có thay đổi
    if (email) user.email = email;
    if (password) user.password = await bcrypt.hash(password, 10); // Nếu có thay đổi mật khẩu thì mã hóa lại
    if (username) user.username = username;
    if (phone) user.phone = phone;
    if (role) user.role = role;
    if (contact) user.contact = contact;
    if (devices) user.devices = devices;

    // Lưu lại thay đổi
    await user.save();

    res.status(200).json({ message: 'User updated successfully', user });
  } catch (error) {
    console.error(error); // Log lỗi nếu có
    res.status(500).json({ message: error.message });
  }
});
// GET /users/:id - Lấy thông tin người dùng theo ID
router.get('/:id', authorize(['admin', 'manager']), async (req, res) => {
  const userId = req.params.id;

  try {
    // Tìm người dùng theo ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Trả về thông tin người dùng
    res.status(200).json({
      email: user.email,
      username: user.username,
      phone: user.phone,
      role: user.role,
      contact: user.contact,
      devices: user.devices
    });
  } catch (error) {
    console.error(error); // Log lỗi nếu có
    res.status(500).json({ message: error.message });
  }
});



//Phần liên quan đến Device
// API để gắn thiết bị vào người dùng
router.post('/assign-device', authorize(['admin', 'manager','user']), async (req, res) => {
  const { userId, deviceId } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    for (let id of deviceId) {
      const device = await Device.findOne({ deviceId: id });
      if (!device) {
        return res.status(404).json({ message: `Device with ID ${id} not found` });
      }

      const existingUser = await User.findOne({ "devices.deviceId": id });
      if (existingUser) {
        return res.status(400).json({ message: `Device with ID ${id} already assigned to another user` });
      }

      user.devices.push({ deviceId: id });
    }

    await user.save();
    res.status(200).json({ message: 'Devices successfully assigned to user' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

// DELETE /remove-device - Xoá thiết bị khỏi người dùng
router.delete('/remove-device', authorize(['admin', 'manager','user']), async (req, res) => {
  const { userId, deviceId } = req.body;

  try {
    // Kiểm tra xem người dùng có tồn tại không
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Kiểm tra xem thiết bị có tồn tại trong danh sách thiết bị của người dùng không
    const deviceIndex = user.devices.findIndex(device => device.deviceId === deviceId);
    if (deviceIndex === -1) {
      return res.status(404).json({ message: `Device with ID ${deviceId} not found for this user` });
    }

    // Xóa thiết bị khỏi danh sách thiết bị của người dùng
    user.devices.splice(deviceIndex, 1);
    await user.save();

    res.status(200).json({ message: `Device ${deviceId} has been successfully removed from user ${user.username}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

// GET /user-devices/:userId - Lấy danh sách thiết bị của người dùng theo userId
router.get('/user-devices/:userId', authorize(['admin', 'manager', 'user']), async (req, res) => {
  try {
    const { userId } = req.params;

    // Tìm người dùng theo userId và lấy danh sách thiết bị
    const user = await User.findById(userId).select('devices');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Lấy thông tin chi tiết từng thiết bị từ Device collection
    const devices = await Device.find({ deviceId: { $in: user.devices.map(d => d.deviceId) } });

    res.status(200).json({ devices });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
