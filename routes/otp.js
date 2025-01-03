const express = require("express");
const router = express.Router();
const otpModel = require("../models/Otp");
const nodemailer = require("nodemailer");
const generateRandomOTP = require("../Utils/generateOTP");
require("dotenv").config();

// API tạo OTP và gửi qua email
router.post("/sendOtp", async (req, res) => {
  const { email } = req.body;

  try {
    // Kiểm tra xem email đã tồn tại chưa
    const otpCheck = await otpModel.findOne({ email });
    if (otpCheck) {
      return res.status(400).send("OTP đã được gửi đến email này rồi!");
    }

    const otp = generateRandomOTP(); // Tạo OTP ngẫu nhiên
    const expiresAt = new Date(Date.now() + 120 * 1000); // OTP hết hạn sau 120s

    const newOtp = new otpModel({
      email,
      otp,
      expiresat: expiresAt,
    });

    // Lưu OTP vào DB
    await newOtp.save();

    // Gửi OTP qua email
    await sendOtpEmail(email, otp); // Hàm gửi email OTP

    res.status(200).send("OTP đã được gửi vào email của bạn.");
  } catch (error) {
    res.status(500).send("Đã xảy ra lỗi khi gửi OTP.");
  }
});

// API kiểm tra OTP
router.post("/checkOtp", async (req, res) => {
  const { email, otp } = req.body;

  try {
    const otpCheck = await otpModel.findOne({ email, otp });

    if (!otpCheck) {
      return res.status(400).send("OTP không hợp lệ.");
    }

    if (new Date() > otpCheck.expiresat) {
      return res.status(400).send("OTP đã hết hạn.");
    }

    // Xóa OTP sau khi xác thực thành công
    await otpModel.findOneAndDelete({ email, otp });

    res.status(200).send("OTP hợp lệ.");
  } catch (error) {
    res.status(500).send("Đã xảy ra lỗi khi kiểm tra OTP.");
  }
});

// Hàm gửi email OTP
const sendOtpEmail = async (email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: `"Node.js App" <${process.env.EMAIL_USERNAME}>`,
      to: email,
      subject: "Mã OTP để đăng ký",
      text: `Mã OTP của bạn là: ${otp}`,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Lỗi gửi email:", error);
  }
};

module.exports = router;
