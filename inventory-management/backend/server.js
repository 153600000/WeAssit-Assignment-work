// ============================================================
// server.js — Express Application Entry Point
// Inventory Management System Backend
// ============================================================

require('dotenv').config(); // Load .env variables

const express = require('express');
const cors = require('cors');
const path = require('path');

const itemsRouter = require('./routes/items');

const app = express();
const PORT = process.env.PORT || 5000;

// ────────────────────────────────────────────────────────────
// Middleware
// ────────────────────────────────────────────────────────────

// Enable CORS for all origins (restrict in production)
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files from ../frontend
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ────────────────────────────────────────────────────────────
// API Routes
// ────────────────────────────────────────────────────────────
app.use('/api/items', itemsRouter);
app.use('/api/item-types', itemsRouter); // also expose item-types here

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Inventory API is running ✅', timestamp: new Date() });
});

// ────────────────────────────────────────────────────────────
// Catch-all — serve frontend for any unmatched route
// ────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// ────────────────────────────────────────────────────────────
// Global Error Handler
// ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err.stack);
    res.status(500).json({
        success: false,
        message: 'An unexpected server error occurred.',
    });
});

// ────────────────────────────────────────────────────────────
// Start Server
// ────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\n🚀 Inventory Management Server running on http://localhost:${PORT}`);
    console.log(`📦 API Base URL: http://localhost:${PORT}/api`);
    console.log(`🌐 Frontend:     http://localhost:${PORT}\n`);
});

module.exports = app;
