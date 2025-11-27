// ============================================
// BACKEND - Node.js + Express + MongoDB + Firebase Auth
// Habits Tracker API - Secure & Production Ready
// ============================================

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Import routes
const habitRoutes = require('./routes/habitRoutes');

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// Helmet - Sets various HTTP headers for security
app.use(helmet());

// CORS - Configure Cross-Origin Resource Sharing
app.use(
    cors({
        origin: process.env.CORS_ORIGIN || '*', // In production, set specific origins
        credentials: true,
    })
);

// Rate Limiting - Prevent abuse
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        success: false,
        error: 'Too many requests',
        message: 'Please try again later',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(limiter);

// ============================================
// GENERAL MIDDLEWARE
// ============================================

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging (development)
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
        next();
    });
}

// ============================================
// DATABASE CONNECTION
// ============================================

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/habits';

mongoose
    .connect(MONGODB_URI)
    .then(() => {
        console.log('✅ MongoDB connected successfully');
        console.log(`📊 Database: ${mongoose.connection.name}`);
    })
    .catch((err) => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    });

// ============================================
// ROUTES
// ============================================

// Health check route (public)
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: '🚀 Habit Tracker API - Secure Edition',
        version: '2.0.0',
        status: 'running',
        endpoints: {
            habits: '/habits (GET, POST, PUT, DELETE) - Requires Firebase token',
        },
        documentation: 'See README.md for API documentation',
    });
});

// API status route (public)
app.get('/api/status', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString(),
    });
});

// Habit routes (protected with Firebase auth)
app.use('/habits', habitRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 - Route not found
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Not found',
        message: `Route ${req.method} ${req.path} not found`,
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('❌ Unhandled error:', err);

    // Don't leak error details in production
    const message =
        process.env.NODE_ENV === 'production'
            ? 'An unexpected error occurred'
            : err.message;

    res.status(err.status || 500).json({
        success: false,
        error: 'Server error',
        message,
    });
});

// ============================================
// SERVER STARTUP
// ============================================

const server = app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════╗
║   🚀 Habit Tracker API - Secure Edition   ║
║                                            ║
║   Port:        ${PORT.toString().padEnd(30)}║
║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(30)}║
║   MongoDB:     ${mongoose.connection.readyState === 1 ? 'Connected ✅' : 'Pending...'}              ║
║                                            ║
║   🔐 Firebase Auth: Enabled                ║
║   🛡️  Security:      Helmet + Rate Limit   ║
╚════════════════════════════════════════════╝
  `);
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

const gracefulShutdown = async (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);

    // Close server
    server.close(() => {
        console.log('✅ HTTP server closed');

        // Close database connection
        mongoose.connection.close(false, () => {
            console.log('✅ MongoDB connection closed');
            process.exit(0);
        });
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
        console.error('⚠️  Forced shutdown after timeout');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = app;
