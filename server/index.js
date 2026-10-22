
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");

const instituteRoutes = require("./routes/instituteRoutes");
const studentAuthRoutes = require("./routes/studentAuthRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/institutes", instituteRoutes);
app.use("/api/auth", studentAuthRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "EduFind API is running",
  });
});

const PORT = process.env.PORT || 5000;

if (!process.env.MONGO_URI) {
  console.error("MONGO_URI is missing in .env file");
  process.exit(1);
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
  });
