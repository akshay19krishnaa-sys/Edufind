
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");

const instituteRoutes = require("./routes/instituteRoutes");
const studentAuthRoutes = require("./routes/studentAuthRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const adminRoutes = require("./routes/adminRoutes");
const reportRoutes = require("./routes/reportRoutes");
const { initializeAdminSystem } = require("./utils/adminSetup");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/institutes", instituteRoutes);
app.use("/api/auth", studentAuthRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reports", reportRoutes);

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
  .then(async () => {
    console.log("MongoDB connected successfully");

    // Initialize baseline admin account and platform settings if not present
    await initializeAdminSystem();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
  });

