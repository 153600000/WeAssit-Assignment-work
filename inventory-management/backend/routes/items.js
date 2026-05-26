// ============================================================
// routes/items.js — API Route Definitions
// Maps HTTP methods + paths to controller functions
// ============================================================

const express = require('express');
const router = express.Router();
const {
    getAllItems,
    addItems,
    updateItem,
    deleteItem,
    getItemTypes,
} = require('../controllers/itemsController');

// ── Item Type routes ──
router.get('/item-types', getItemTypes);     // GET  /api/item-types

// ── Items CRUD routes ──
router.get('/', getAllItems);                // GET  /api/items
router.post('/', addItems);                 // POST /api/items   (batch)
router.put('/:id', updateItem);             // PUT  /api/items/:id
router.delete('/:id', deleteItem);          // DELETE /api/items/:id

module.exports = router;
