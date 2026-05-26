-- ============================================================
-- Inventory Management System — Database Setup Script
-- ============================================================

-- Create and use the database
CREATE DATABASE IF NOT EXISTS inventory_db;
USE inventory_db;

-- ============================================================
-- Table 1: item_types
-- Stores the category/type of items
-- ============================================================
CREATE TABLE IF NOT EXISTS item_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    type_name VARCHAR(100) NOT NULL UNIQUE
);

-- Insert default item types
INSERT IGNORE INTO item_types (type_name) VALUES
    ('Electronics'),
    ('Furniture'),
    ('Clothing'),
    ('Books'),
    ('Accessories');

-- ============================================================
-- Table 2: items
-- Stores inventory items with FK reference to item_types
-- ============================================================
CREATE TABLE IF NOT EXISTS items (
    id          INT PRIMARY KEY AUTO_INCREMENT,
    name        VARCHAR(255) NOT NULL,
    purchase_date DATE NOT NULL,
    stock_available TINYINT(1) NOT NULL DEFAULT 1,
    item_type_id INT NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_item_type
        FOREIGN KEY (item_type_id) REFERENCES item_types(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

-- ============================================================
-- Useful JOIN query used by GET /api/items
-- ============================================================
-- SELECT
--     items.id,
--     items.name,
--     items.purchase_date,
--     items.stock_available,
--     item_types.type_name,
--     items.created_at
-- FROM items
-- JOIN item_types ON items.item_type_id = item_types.id
-- ORDER BY items.created_at DESC;
