const mongoose = require("mongoose");

const otp = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    otp: {
      type: String,
      required: true,
    },
    expiresat: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

otp.index({ expiresat: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("opt", otp);
