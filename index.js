require("dotenv").config();
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
const sequelize = require("./config/database");

// Middleware to parse JSON
app.use(express.json());

// Simple route
app.get("/", (req, res) => {
  res.send("Hello, Express + Sequelize + MySQL!");
});

// Connect to DB
sequelize.authenticate().then(() => {
    console.log("✅ Database connected...");
}).catch((err) => {
    console.error("❌ Error connecting to DB:", err);
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
