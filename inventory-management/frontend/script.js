// ============================================================
// script.js — Inventory Management System Frontend Logic
// Handles CRUD, multi-item queue, search, filter, toasts, modal
// ============================================================

// ── API Base URL (auto-detects origin) ──
const API_BASE = `${window.location.protocol}//${window.location.hostname}:5000/api`;

// ────────────────────────────────────────────────────────────
// STATE
// ────────────────────────────────────────────────────────────
let allItems = [];          // All items fetched from the server
let purchaseQueue = [];     // Temporary queue for multi-item batch add
let deletePendingId = null; // ID of item to be deleted (awaiting confirmation)
let isEditMode = false;     // Whether the form is in edit mode

// ────────────────────────────────────────────────────────────
// DOM REFERENCES
// ────────────────────────────────────────────────────────────
const itemForm      = document.getElementById('itemForm');
const itemNameEl    = document.getElementById('itemName');
const itemTypeEl    = document.getElementById('itemType');
const purchaseDateEl= document.getElementById('purchaseDate');
const stockCheckbox = document.getElementById('stockAvailable');
const editItemIdEl  = document.getElementById('editItemId');

const addToQueueBtn   = document.getElementById('addToQueueBtn');
const resetFormBtn    = document.getElementById('resetFormBtn');
const savePurchaseBtn = document.getElementById('savePurchaseBtn');
const clearQueueBtn   = document.getElementById('clearQueueBtn');
const saveEditBtn     = document.getElementById('saveEditBtn');
const cancelEditBtn   = document.getElementById('cancelEditBtn');
const refreshBtn      = document.getElementById('refreshBtn');

const purchaseQueueEl = document.getElementById('purchaseQueue');
const queueListEl     = document.getElementById('queueList');
const queueBadgeEl    = document.getElementById('queueBadge');
const editActionsEl   = document.getElementById('editActions');
const formActionsEl   = document.getElementById('formActions');
const modeBannerEl    = document.getElementById('modeBanner');
const formTitleEl     = document.getElementById('formTitle');

const tableBody     = document.getElementById('tableBody');
const searchInput   = document.getElementById('searchInput');
const filterType    = document.getElementById('filterType');
const filterStock   = document.getElementById('filterStock');

const deleteModal     = document.getElementById('deleteModal');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const confirmDeleteBtn= document.getElementById('confirmDeleteBtn');
const modalMessage    = document.getElementById('modalMessage');

const statTotal   = document.getElementById('statTotal');
const statInStock = document.getElementById('statInStock');
const statOutStock= document.getElementById('statOutStock');

// ────────────────────────────────────────────────────────────
// UTILITY: Live Clock
// ────────────────────────────────────────────────────────────
function updateClock() {
    const el = document.getElementById('navbarTime');
    if (!el) return;
    el.textContent = new Date().toLocaleString('en-IN', {
        weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
    });
}
setInterval(updateClock, 1000);
updateClock();

// ────────────────────────────────────────────────────────────
// UTILITY: Toast Notifications
// ────────────────────────────────────────────────────────────
const TOAST_ICONS = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };

function showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <span class="toast-icon">${TOAST_ICONS[type]}</span>
        <span class="toast-message">${message}</span>
        <button class="toast-close" aria-label="Close notification">&times;</button>
    `;

    // Close button
    toast.querySelector('.toast-close').addEventListener('click', () => dismissToast(toast));

    container.appendChild(toast);

    // Auto-dismiss
    const timer = setTimeout(() => dismissToast(toast), duration);
    toast._timer = timer;
}

function dismissToast(toast) {
    clearTimeout(toast._timer);
    toast.classList.add('hiding');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
}

// ────────────────────────────────────────────────────────────
// UTILITY: Loading State for Buttons
// ────────────────────────────────────────────────────────────
function setButtonLoading(btn, loading) {
    btn.disabled = loading;
    btn.classList.toggle('loading', loading);
}

// ────────────────────────────────────────────────────────────
// UTILITY: Format Date (YYYY-MM-DD → DD Mon YYYY)
// ────────────────────────────────────────────────────────────
function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    // Adjust for timezone offset so date doesn't shift
    const utc = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
    return utc.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ────────────────────────────────────────────────────────────
// UTILITY: Get Type Emoji
// ────────────────────────────────────────────────────────────
function typeEmoji(typeName) {
    const map = {
        Electronics: '💻', Furniture: '🪑', Clothing: '👕',
        Books: '📚', Accessories: '💍',
    };
    return map[typeName] || '📦';
}

// ────────────────────────────────────────────────────────────
// FORM VALIDATION
// ────────────────────────────────────────────────────────────
function validateForm() {
    let valid = true;

    // Clear previous errors
    document.querySelectorAll('.form-control.error').forEach(el => el.classList.remove('error'));
    document.querySelectorAll('.field-error.visible').forEach(el => el.classList.remove('visible'));

    const name = itemNameEl.value.trim();
    const type = itemTypeEl.value;
    const date = purchaseDateEl.value;

    if (!name) {
        itemNameEl.classList.add('error');
        document.getElementById('itemNameError').classList.add('visible');
        valid = false;
    }
    if (!type) {
        itemTypeEl.classList.add('error');
        document.getElementById('itemTypeError').classList.add('visible');
        valid = false;
    }
    if (!date) {
        purchaseDateEl.classList.add('error');
        document.getElementById('purchaseDateError').classList.add('visible');
        valid = false;
    }

    return valid;
}

// Remove inline error on input change
[itemNameEl, itemTypeEl, purchaseDateEl].forEach(el => {
    el.addEventListener('input', () => {
        el.classList.remove('error');
        const errEl = document.getElementById(`${el.id}Error`);
        if (errEl) errEl.classList.remove('visible');
    });
    el.addEventListener('change', () => {
        el.classList.remove('error');
        const errEl = document.getElementById(`${el.id}Error`);
        if (errEl) errEl.classList.remove('visible');
    });
});

// ────────────────────────────────────────────────────────────
// FORM: Reset to default state
// ────────────────────────────────────────────────────────────
function resetForm() {
    itemForm.reset();
    editItemIdEl.value = '';
    stockCheckbox.checked = true;
    document.querySelectorAll('.form-control.error').forEach(el => el.classList.remove('error'));
    document.querySelectorAll('.field-error.visible').forEach(el => el.classList.remove('visible'));
}

// ────────────────────────────────────────────────────────────
// MODE: Switch between Add Mode and Edit Mode
// ────────────────────────────────────────────────────────────
function enterAddMode() {
    isEditMode = false;
    resetForm();
    formTitleEl.textContent = 'Add New Purchase';
    formActionsEl.style.display = 'flex';
    editActionsEl.style.display = 'none';
    modeBannerEl.classList.remove('visible', 'edit-mode');
    // Show queue if items exist
    renderQueue();
}

function enterEditMode(item) {
    isEditMode = true;
    clearQueue(); // Clear any pending queue items when editing

    // Populate form fields
    editItemIdEl.value    = item.id;
    itemNameEl.value      = item.name;
    itemTypeEl.value      = item.item_type_id;
    purchaseDateEl.value  = item.purchase_date ? item.purchase_date.split('T')[0] : '';
    stockCheckbox.checked = !!item.stock_available;

    formTitleEl.textContent = `Edit Item #${item.id}`;
    formActionsEl.style.display = 'none';
    editActionsEl.style.display = 'block';

    modeBannerEl.classList.add('visible', 'edit-mode');

    // Scroll to form
    document.querySelector('.glass-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ────────────────────────────────────────────────────────────
// PURCHASE QUEUE: Multi-item before DB save
// ────────────────────────────────────────────────────────────
function renderQueue() {
    if (purchaseQueue.length === 0) {
        purchaseQueueEl.classList.remove('visible');
        return;
    }

    purchaseQueueEl.classList.add('visible');
    queueBadgeEl.textContent = `${purchaseQueue.length} item${purchaseQueue.length > 1 ? 's' : ''}`;

    queueListEl.innerHTML = purchaseQueue.map((item, index) => `
        <div class="queue-item" data-index="${index}">
            <span class="queue-item-icon">${typeEmoji(item.typeName)}</span>
            <div class="queue-item-info">
                <div class="queue-item-name">${escapeHtml(item.name)}</div>
                <div class="queue-item-meta">
                    ${item.typeName} &bull; ${formatDate(item.purchase_date)}
                    &bull; ${item.stock_available ? '✅ In Stock' : '❌ Out of Stock'}
                </div>
            </div>
            <button class="queue-item-remove" data-index="${index}" title="Remove item" aria-label="Remove ${escapeHtml(item.name)} from queue">
                ✕
            </button>
        </div>
    `).join('');

    // Attach remove handlers
    queueListEl.querySelectorAll('.queue-item-remove').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = parseInt(btn.getAttribute('data-index'));
            purchaseQueue.splice(idx, 1);
            renderQueue();
            showToast('Item removed from queue.', 'info', 2500);
        });
    });
}

function clearQueue() {
    purchaseQueue = [];
    renderQueue();
}

// ── Add current form values to queue ──
addToQueueBtn.addEventListener('click', () => {
    if (!validateForm()) {
        showToast('Please fill all required fields before adding to queue.', 'warning');
        return;
    }

    const selectedOption = itemTypeEl.options[itemTypeEl.selectedIndex];
    purchaseQueue.push({
        name:            itemNameEl.value.trim(),
        item_type_id:    parseInt(itemTypeEl.value),
        typeName:        selectedOption.text,
        purchase_date:   purchaseDateEl.value,
        stock_available: stockCheckbox.checked,
    });

    showToast(`"${itemNameEl.value.trim()}" added to queue!`, 'success', 2500);
    resetForm();
    renderQueue();
});

// ── Reset form button ──
resetFormBtn.addEventListener('click', () => {
    resetForm();
    showToast('Form cleared.', 'info', 2000);
});

// ── Clear entire queue ──
clearQueueBtn.addEventListener('click', () => {
    if (purchaseQueue.length === 0) return;
    clearQueue();
    showToast('Purchase queue cleared.', 'info', 2000);
});

// ────────────────────────────────────────────────────────────
// API: SAVE PURCHASE (POST /api/items — batch)
// ────────────────────────────────────────────────────────────
savePurchaseBtn.addEventListener('click', async () => {
    // Also add current form if filled
    const name = itemNameEl.value.trim();
    if (name && itemTypeEl.value && purchaseDateEl.value) {
        if (!validateForm()) {
            showToast('Fix form errors before saving.', 'warning');
            return;
        }
        const selectedOption = itemTypeEl.options[itemTypeEl.selectedIndex];
        purchaseQueue.push({
            name,
            item_type_id:    parseInt(itemTypeEl.value),
            typeName:        selectedOption.text,
            purchase_date:   purchaseDateEl.value,
            stock_available: stockCheckbox.checked,
        });
    }

    if (purchaseQueue.length === 0) {
        showToast('No items in queue. Add at least one item.', 'warning');
        return;
    }

    setButtonLoading(savePurchaseBtn, true);
    try {
        const response = await fetch(`${API_BASE}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: purchaseQueue }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Failed to save purchase.');
        }

        showToast(`🎉 ${data.message}`, 'success');
        clearQueue();
        resetForm();
        await loadItems(); // Refresh table
    } catch (err) {
        console.error('Save Purchase Error:', err);
        showToast(err.message || 'Error saving purchase. Check backend connection.', 'error');
    } finally {
        setButtonLoading(savePurchaseBtn, false);
    }
});

// ────────────────────────────────────────────────────────────
// API: GET ALL ITEMS (GET /api/items)
// ────────────────────────────────────────────────────────────
async function loadItems() {
    tableBody.innerHTML = `
        <tr class="loading-row">
            <td colspan="6">
                <div style="text-align:center; padding:2rem; color:var(--text-muted);">
                    Loading inventory<span class="loading-dots"></span>
                </div>
            </td>
        </tr>`;

    try {
        const response = await fetch(`${API_BASE}/items`);
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Failed to load items.');
        }

        allItems = data.data;
        updateSummaryCards();
        renderTable(allItems);
    } catch (err) {
        console.error('loadItems Error:', err);
        tableBody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        <div class="empty-state-icon">⚠️</div>
                        <h3>Failed to load inventory</h3>
                        <p>${escapeHtml(err.message)}</p>
                        <p style="margin-top:0.5rem; font-size:0.8rem; color:var(--text-muted);">
                            Make sure the backend server is running on port 5000 and MySQL is connected.
                        </p>
                    </div>
                </td>
            </tr>`;
        showToast('Could not connect to the server. Is the backend running?', 'error', 6000);
    }
}

// ────────────────────────────────────────────────────────────
// RENDER TABLE
// ────────────────────────────────────────────────────────────
function renderTable(items) {
    if (items.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        <div class="empty-state-icon">📭</div>
                        <h3>No items found</h3>
                        <p>Add your first inventory item using the form above.</p>
                    </div>
                </td>
            </tr>`;
        return;
    }

    tableBody.innerHTML = items.map(item => `
        <tr data-id="${item.id}">
            <td class="col-id">#${item.id}</td>
            <td style="font-weight:600;">${escapeHtml(item.name)}</td>
            <td>
                <span class="type-badge">
                    ${typeEmoji(item.type_name)} ${escapeHtml(item.type_name)}
                </span>
            </td>
            <td>${formatDate(item.purchase_date)}</td>
            <td>
                <span class="stock-badge ${item.stock_available ? 'in-stock' : 'out-of-stock'}">
                    ${item.stock_available ? '✅ In Stock' : '❌ Out of Stock'}
                </span>
            </td>
            <td>
                <div class="actions-cell">
                    <button
                        class="btn btn-primary btn-sm"
                        onclick="handleEdit(${item.id})"
                        title="Edit item"
                        aria-label="Edit ${escapeHtml(item.name)}"
                    >
                        ✏️ Edit
                    </button>
                    <button
                        class="btn btn-danger btn-sm"
                        onclick="handleDeletePrompt(${item.id}, '${escapeHtml(item.name)}')"
                        title="Delete item"
                        aria-label="Delete ${escapeHtml(item.name)}"
                    >
                        🗑️ Delete
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ────────────────────────────────────────────────────────────
// UPDATE SUMMARY CARDS
// ────────────────────────────────────────────────────────────
function updateSummaryCards() {
    const total   = allItems.length;
    const inStock = allItems.filter(i => i.stock_available).length;
    const out     = total - inStock;

    statTotal.textContent   = total;
    statInStock.textContent = inStock;
    statOutStock.textContent= out;
}

// ────────────────────────────────────────────────────────────
// SEARCH & FILTER
// ────────────────────────────────────────────────────────────
function applyFilters() {
    const query      = searchInput.value.toLowerCase().trim();
    const typeFilter = filterType.value;
    const stockFilter= filterStock.value;

    let filtered = allItems.filter(item => {
        const matchName  = item.name.toLowerCase().includes(query);
        const matchType  = typeFilter ? item.type_name === typeFilter : true;
        const matchStock = stockFilter !== '' ? String(item.stock_available ? 1 : 0) === stockFilter : true;
        return matchName && matchType && matchStock;
    });

    renderTable(filtered);
}

searchInput.addEventListener('input', applyFilters);
filterType.addEventListener('change', applyFilters);
filterStock.addEventListener('change', applyFilters);
refreshBtn.addEventListener('click', async () => {
    searchInput.value = '';
    filterType.value  = '';
    filterStock.value = '';
    showToast('Refreshing inventory…', 'info', 2000);
    await loadItems();
});

// ────────────────────────────────────────────────────────────
// EDIT — Populate form with item data
// ────────────────────────────────────────────────────────────
function handleEdit(id) {
    const item = allItems.find(i => i.id === id);
    if (!item) {
        showToast('Item not found.', 'error');
        return;
    }
    enterEditMode(item);
}

// ── Save Edit button ──
saveEditBtn.addEventListener('click', async () => {
    if (!validateForm()) {
        showToast('Please fill all required fields.', 'warning');
        return;
    }

    const id = editItemIdEl.value;
    if (!id) return;

    setButtonLoading(saveEditBtn, true);
    try {
        const response = await fetch(`${API_BASE}/items/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name:            itemNameEl.value.trim(),
                item_type_id:    parseInt(itemTypeEl.value),
                purchase_date:   purchaseDateEl.value,
                stock_available: stockCheckbox.checked,
            }),
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Update failed.');
        }

        showToast('✅ Item updated successfully!', 'success');
        enterAddMode();
        await loadItems();
    } catch (err) {
        console.error('Update Error:', err);
        showToast(err.message || 'Error updating item.', 'error');
    } finally {
        setButtonLoading(saveEditBtn, false);
    }
});

// ── Cancel Edit ──
cancelEditBtn.addEventListener('click', () => {
    enterAddMode();
    showToast('Edit cancelled.', 'info', 2000);
});

// ────────────────────────────────────────────────────────────
// DELETE — Confirmation Modal
// ────────────────────────────────────────────────────────────
function handleDeletePrompt(id, name) {
    deletePendingId = id;
    modalMessage.textContent = `Are you sure you want to delete "${name}" (#${id})? This action cannot be undone.`;
    deleteModal.classList.add('visible');
}

cancelDeleteBtn.addEventListener('click', () => {
    deleteModal.classList.remove('visible');
    deletePendingId = null;
});

// Close modal on overlay click
deleteModal.addEventListener('click', (e) => {
    if (e.target === deleteModal) {
        deleteModal.classList.remove('visible');
        deletePendingId = null;
    }
});

// Keyboard: close on Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && deleteModal.classList.contains('visible')) {
        deleteModal.classList.remove('visible');
        deletePendingId = null;
    }
});

confirmDeleteBtn.addEventListener('click', async () => {
    if (!deletePendingId) return;

    setButtonLoading(confirmDeleteBtn, true);
    try {
        const response = await fetch(`${API_BASE}/items/${deletePendingId}`, {
            method: 'DELETE',
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Delete failed.');
        }

        showToast('🗑️ Item deleted successfully!', 'success');
        deleteModal.classList.remove('visible');
        deletePendingId = null;

        // If currently editing the deleted item, reset to add mode
        if (isEditMode && parseInt(editItemIdEl.value) === deletePendingId) {
            enterAddMode();
        }

        await loadItems();
    } catch (err) {
        console.error('Delete Error:', err);
        showToast(err.message || 'Error deleting item.', 'error');
    } finally {
        setButtonLoading(confirmDeleteBtn, false);
    }
});

// ────────────────────────────────────────────────────────────
// UTILITY: Escape HTML to prevent XSS
// ────────────────────────────────────────────────────────────
function escapeHtml(str) {
    if (typeof str !== 'string') return str;
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ────────────────────────────────────────────────────────────
// INIT: Set today's date as default in date picker
// ────────────────────────────────────────────────────────────
function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    purchaseDateEl.value = today;
    purchaseDateEl.max = today;
}

// ────────────────────────────────────────────────────────────
// INIT: Bootstrap
// ────────────────────────────────────────────────────────────
(async function init() {
    setDefaultDate();
    await loadItems();
    enterAddMode();
    console.log('🚀 Inventory Management System initialized.');
})();
