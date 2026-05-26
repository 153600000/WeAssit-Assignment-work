# 📦 Inventory Management System

A full-stack Inventory Management Web Application built with **Node.js**, **Express.js**, **MySQL**, **HTML**, **CSS**, and **Vanilla JavaScript**.

---

## 🗂️ Project Structure

```
inventory-management/
├── backend/
│   ├── server.js              # Express app entry point
│   ├── db.js                  # MySQL connection pool
│   ├── .env                   # Environment variables (DB credentials)
│   ├── routes/
│   │   └── items.js           # API route definitions
│   ├── controllers/
│   │   └── itemsController.js # CRUD business logic
│   └── package.json
├── frontend/
│   ├── index.html             # Main UI
│   ├── style.css              # Glassmorphism styling
│   └── script.js              # Frontend logic
└── database.sql               # MySQL setup script
```

---

## 🚀 Setup Instructions

### 1. MySQL — Database Setup

Open MySQL shell or MySQL Workbench and run:

```sql
source /path/to/inventory-management/database.sql
```

Or paste the contents of `database.sql` directly.

### 2. Configure Environment Variables

Edit `backend/.env`:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=inventory_db
```

### 3. Install Backend Dependencies

```bash
cd backend
npm install
```

### 4. Start the Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

### 5. Open the App

Visit: **http://localhost:5000**

---

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/items` | Fetch all inventory items (with JOIN) |
| POST | `/api/items` | Add one or more items (batch) |
| PUT | `/api/items/:id` | Update an item by ID |
| DELETE | `/api/items/:id` | Delete an item by ID |
| GET | `/api/item-types` | List all item types |
| GET | `/api/health` | Health check |

### POST /api/items — Request Body

```json
{
  "items": [
    {
      "name": "Dell Laptop",
      "item_type_id": 1,
      "purchase_date": "2024-05-20",
      "stock_available": true
    },
    {
      "name": "Office Chair",
      "item_type_id": 2,
      "purchase_date": "2024-05-20",
      "stock_available": false
    }
  ]
}
```

---

## ✨ Features

- ✅ **Multi-item purchase**: Add multiple items to a queue before submitting
- ✅ **Full CRUD**: Create, Read, Update, Delete
- ✅ **SQL JOIN**: Fetches type names using JOIN between `items` and `item_types`
- ✅ **Search & Filter**: By name, type, and stock status
- ✅ **Summary Dashboard**: Total, in-stock, out-of-stock counts
- ✅ **Toast Notifications**: For all actions
- ✅ **Confirmation Modal**: Before deleting
- ✅ **Glassmorphism UI**: Modern dark theme with animations
- ✅ **Responsive**: Works on mobile and desktop
- ✅ **XSS Protection**: All user input escaped before rendering

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML, CSS (Glassmorphism), Vanilla JavaScript |
| Backend | Node.js, Express.js |
| Database | MySQL (via mysql2) |
