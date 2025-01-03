const nodemailer = require("nodemailer");
require("dotenv").config();

const sendEmail = async () => {
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
      to: "kz01123008@gmail.com",
      subject: "Hello from Node.js",
      text: "Hello from Node.js! This is a test email sent using nodemailer.",
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

sendEmail();
