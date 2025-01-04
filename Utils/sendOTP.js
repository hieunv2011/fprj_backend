const nodemailer = require('nodemailer');
require('dotenv').config();

// Hàm gửi email thông báo
const sendEmail = async (toEmail, subject, text) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: `"Node.js App" <${process.env.EMAIL_USERNAME}>`,
      to: toEmail,
      subject: subject,
      text: text,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

// Hàm gửi OTP
const sendOTP = async (email, otp) => {
  try {
    const subject = 'Your OTP Code';
    const text = `Your OTP code is: ${otp}`;

    await sendEmail(email, subject, text); // Gửi OTP qua email

    console.log('OTP sent to:', email);
  } catch (error) {
    console.error('Error sending OTP:', error);
    throw new Error('Failed to send OTP');
  }
};

module.exports = sendOTP;
