require("dotenv").config();
const express = require("express");
const expressLayout = require("express-ejs-layouts");
// const flash = require("connect-flash"); // Commented out until installed
const app = express();
const PORT = process.env.PORT || 3000;
const sequelize = require("./config/database");
const path = require('path');
const session = require('express-session');

// Middleware to parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup EJS
app.use(expressLayout);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


// Serve static files from public directory
app.use(express.static('public'));

// Session middleware (after express initialization, before routes)
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// Import routes after middleware
const routes = require("./routes/Routes");
app.use("/", routes);

// 404 Error Handler - Must be placed AFTER all routes
app.use((req, res, next) => {
    res.status(404).render('404', { 
        title: '404 - Page Not Found | FinTrack',
        layout: 'layout' 
    });
});

// Global Error Handler - Must be placed LAST
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong!'
    });
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
