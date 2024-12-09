const express = require("express");
const connectDB = require("./database/db");
const mqtt = require("mqtt");
const cors = require("cors");
const userRoutes = require("./routes/user");
const deviceRoutes = require("./routes/device");
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3008;

connectDB();

// Middleware
app.use(cors());
app.use(express.json());


// Định nghĩa routes cho API
app.use("/api/users", userRoutes);
app.use("/api/devices", deviceRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
