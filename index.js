require("dotenv").config();
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
const sequelize = require("./config/database");
const path = require('path');
const routes = require("./routes/Routes");

// Middleware to parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.use("/", routes);

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
