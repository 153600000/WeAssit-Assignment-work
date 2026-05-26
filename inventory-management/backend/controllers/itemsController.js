// ============================================================
// itemsController.js — Business Logic for Inventory Items
// Handles all CRUD operations with MySQL JOIN queries
// ============================================================

const pool = require('../db');

// ────────────────────────────────────────────────────────────
// GET ALL ITEMS — with JOIN on item_types
// ────────────────────────────────────────────────────────────
const getAllItems = async (req, res) => {
    try {
        // SQL JOIN: fetch item type name instead of foreign key ID
        const [rows] = await pool.query(`
            SELECT
                items.id,
                items.name,
                items.purchase_date,
                items.stock_available,
                items.item_type_id,
                item_types.type_name,
                items.created_at
            FROM items
            JOIN item_types ON items.item_type_id = item_types.id
            ORDER BY items.created_at DESC
        `);

        return res.status(200).json({
            success: true,
            count: rows.length,
            data: rows,
        });
    } catch (err) {
        console.error('getAllItems Error:', err.message);
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching items.',
        });
    }
};

// ────────────────────────────────────────────────────────────
// ADD MULTIPLE ITEMS (batch insert in one purchase)
// Accepts: { items: [ { name, item_type_id, purchase_date, stock_available }, ... ] }
// ────────────────────────────────────────────────────────────
const addItems = async (req, res) => {
    const { items } = req.body;

    // ── Validate top-level structure ──
    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Request body must contain a non-empty "items" array.',
        });
    }

    // ── Validate each item individually ──
    const errors = [];
    items.forEach((item, index) => {
        if (!item.name || item.name.trim() === '') {
            errors.push(`Item ${index + 1}: Item Name is required.`);
        }
        if (!item.item_type_id) {
            errors.push(`Item ${index + 1}: Item Type is required.`);
        }
        if (!item.purchase_date) {
            errors.push(`Item ${index + 1}: Purchase Date is required.`);
        }
    });

    if (errors.length > 0) {
        return res.status(400).json({ success: false, message: errors.join(' | ') });
    }

    try {
        // ── Build bulk INSERT values ──
        const values = items.map((item) => [
            item.name.trim(),
            item.purchase_date,
            item.stock_available ? 1 : 0,
            item.item_type_id,
        ]);

        const [result] = await pool.query(
            `INSERT INTO items (name, purchase_date, stock_available, item_type_id) VALUES ?`,
            [values]
        );

        return res.status(201).json({
            success: true,
            message: `${items.length} item(s) added successfully.`,
            insertedCount: items.length,
            firstInsertId: result.insertId,
        });
    } catch (err) {
        console.error('addItems Error:', err.message);
        return res.status(500).json({
            success: false,
            message: 'Server error while adding items.',
        });
    }
};

// ────────────────────────────────────────────────────────────
// UPDATE ITEM by ID
// Accepts: { name, item_type_id, purchase_date, stock_available }
// ────────────────────────────────────────────────────────────
const updateItem = async (req, res) => {
    const { id } = req.params;
    const { name, item_type_id, purchase_date, stock_available } = req.body;

    // ── Validation ──
    if (!name || name.trim() === '') {
        return res.status(400).json({ success: false, message: 'Item Name is required.' });
    }
    if (!item_type_id) {
        return res.status(400).json({ success: false, message: 'Item Type is required.' });
    }
    if (!purchase_date) {
        return res.status(400).json({ success: false, message: 'Purchase Date is required.' });
    }

    try {
        // Check item exists
        const [existing] = await pool.query('SELECT id FROM items WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: `Item with ID ${id} not found.` });
        }

        await pool.query(
            `UPDATE items
             SET name = ?, item_type_id = ?, purchase_date = ?, stock_available = ?
             WHERE id = ?`,
            [name.trim(), item_type_id, purchase_date, stock_available ? 1 : 0, id]
        );

        return res.status(200).json({
            success: true,
            message: 'Item updated successfully.',
        });
    } catch (err) {
        console.error('updateItem Error:', err.message);
        return res.status(500).json({
            success: false,
            message: 'Server error while updating item.',
        });
    }
};

// ────────────────────────────────────────────────────────────
// DELETE ITEM by ID
// ────────────────────────────────────────────────────────────
const deleteItem = async (req, res) => {
    const { id } = req.params;

    try {
        const [existing] = await pool.query('SELECT id FROM items WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: `Item with ID ${id} not found.` });
        }

        await pool.query('DELETE FROM items WHERE id = ?', [id]);

        return res.status(200).json({
            success: true,
            message: 'Item deleted successfully.',
        });
    } catch (err) {
        console.error('deleteItem Error:', err.message);
        return res.status(500).json({
            success: false,
            message: 'Server error while deleting item.',
        });
    }
};

// ────────────────────────────────────────────────────────────
// GET ITEM TYPES (for dropdown population)
// ────────────────────────────────────────────────────────────
const getItemTypes = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM item_types ORDER BY type_name ASC');
        return res.status(200).json({ success: true, data: rows });
    } catch (err) {
        console.error('getItemTypes Error:', err.message);
        return res.status(500).json({ success: false, message: 'Server error while fetching item types.' });
    }
};

module.exports = { getAllItems, addItems, updateItem, deleteItem, getItemTypes };
