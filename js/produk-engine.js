// ============================================================
// Tata Kelola One — Product Engine (Master Produk)
// Data Layer & Business Logic
// ============================================================

(function () {
    'use strict';

    const STORAGE_KEY = 'vitta_products';
    const CATEGORIES_KEY = 'vitta_product_categories';
    const STOCK_LEDGER_KEY = 'vitta_stock_ledger';
    const AUDIT_LOG_KEY = 'vitta_product_audit_log';
    const SKU_COUNTER_KEY = 'vitta_sku_counter';

    function getScopedKey(baseKey) {
        if (window.getScopedKey) return window.getScopedKey(baseKey);
        const activeDept = window.getActiveDept ? window.getActiveDept() : null;
        if (activeDept && activeDept.id) {
            return activeDept.id + '_' + baseKey;
        }
        return baseKey;
    }

    // ─── DEFAULT CATEGORIES (auto-seed) ──────────────────────
    const DEFAULT_CATEGORIES = [
        'Barang Dagang', 'Jasa', 'Bahan Baku', 'Barang Jadi',
        'ATK', 'Perlengkapan', 'Elektronik', 'Makanan & Minuman'
    ];

    function seedCategories() {
        const existing = getCategories();
        if (existing.length === 0) {
            const cats = DEFAULT_CATEGORIES.map((name, i) => ({
                id: 'cat_' + (i + 1),
                name: name,
                is_active: true,
                created_at: new Date().toISOString()
            }));
            localStorage.setItem(getScopedKey(CATEGORIES_KEY), JSON.stringify(cats));
        }
    }

    // ─── CATEGORIES CRUD ─────────────────────────────────────

    function getCategories() {
        try { return JSON.parse(localStorage.getItem(getScopedKey(CATEGORIES_KEY))) || []; }
        catch (e) { return []; }
    }

    function addCategory(name) {
        const cats = getCategories();
        if (cats.some(c => c.name.toLowerCase() === name.toLowerCase())) {
            return { success: false, error: 'Kategori sudah ada' };
        }
        const cat = {
            id: 'cat_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 4),
            name: name.trim(),
            is_active: true,
            created_at: new Date().toISOString()
        };
        cats.push(cat);
        localStorage.setItem(getScopedKey(CATEGORIES_KEY), JSON.stringify(cats));
        return { success: true, category: cat };
    }

    function deleteCategory(id) {
        let cats = getCategories();
        cats = cats.filter(c => c.id !== id);
        localStorage.setItem(getScopedKey(CATEGORIES_KEY), JSON.stringify(cats));
        return { success: true };
    }

    // ─── SKU GENERATOR ───────────────────────────────────────

    function generateSKU() {
        const prods = getProducts();
        if (prods.length === 0) return 'PRD001';
        
        // Find highest numeric suffix
        let maxId = 0;
        prods.forEach(p => {
            if (!p.sku) return;
            const match = p.sku.match(/PRD(\d+)/i);
            if (match) {
                const num = parseInt(match[1], 10);
                if (num > maxId) maxId = num;
            }
        });
        return 'PRD' + String(maxId + 1).padStart(3, '0');
    }

    function isSKUUnique(sku, excludeId) {
        const products = getProducts();
        return !products.some(p => p.sku === sku && p.id !== excludeId);
    }

    // ─── PRODUCTS CRUD ───────────────────────────────────────

    function getProducts() {
        try { 
            const activeDept = window.getActiveDept ? window.getActiveDept() : null;
            const activeDeptId = activeDept ? activeDept.id : null;
            const scopedKey = getScopedKey(STORAGE_KEY);
            
            let prods = [];
            const scopedRaw = localStorage.getItem(scopedKey);
            
            if (scopedRaw) {
                prods = JSON.parse(scopedRaw) || [];
            } else {
                // Try migrating from legacy unscoped key 'vitta_products'
                const legacyRaw = localStorage.getItem(STORAGE_KEY);
                if (legacyRaw) {
                    const legacyProds = JSON.parse(legacyRaw) || [];
                    if (legacyProds.length > 0 && activeDeptId) {
                        prods = legacyProds.map(p => {
                            p.department_id = activeDeptId;
                            return p;
                        });
                        // Save migrated to scoped key
                        localStorage.setItem(scopedKey, JSON.stringify(prods));
                    }
                }
            }

            if (window.VittaInventory) {
                prods = prods.map(p => {
                    if (p.is_tracked) {
                        const stock = window.VittaInventory.getProductStock(p.id);
                        p.current_stock = stock.qty;
                        // Kita bisa juga assign p.buy_price = stock.hpp jika HPP otomatis update
                    }
                    return p;
                });
            }
            return prods;
        }
        catch (e) { return []; }
    }

    function saveProducts(products) {
        localStorage.setItem(getScopedKey(STORAGE_KEY), JSON.stringify(products));
    }

    function getProductById(id) {
        return getProducts().find(p => p.id === id) || null;
    }

    function getProductBySKU(sku) {
        return getProducts().find(p => p.sku === sku) || null;
    }

    function getActiveProducts() {
        return getProducts().filter(p => p.is_active);
    }

    function getProductsSorted() {
        return getProducts().slice().sort((a, b) => 
            (a.name || '').localeCompare(b.name || '', 'id')
        );
    }

    /** Validate product data before save */
    function validateProduct(data, isEdit, editId) {
        const errors = [];

        // Nama wajib
        if (!data.name || !data.name.trim()) {
            errors.push('Nama Produk wajib diisi');
        }

        // SKU unik
        if (data.sku && !isSKUUnique(data.sku, editId)) {
            errors.push('SKU sudah digunakan oleh produk lain');
        }

        // Harga tidak boleh negatif
        if (data.buy_price !== undefined && data.buy_price !== '' && Number(data.buy_price) < 0) {
            errors.push('Harga Beli tidak boleh negatif');
        }
        if (data.sell_price !== undefined && data.sell_price !== '' && Number(data.sell_price) < 0) {
            errors.push('Harga Jual tidak boleh negatif');
        }

        // Mode aktif tapi akun tidak diisi
        if (data.is_sold && !data.revenue_account_code) {
            errors.push('Mode "Saya menjual" aktif — Akun Penjualan wajib dipilih');
        }
        if (data.is_purchased && !data.cogs_account_code) {
            errors.push('Mode "Saya membeli" aktif — Akun HPP/Pembelian wajib dipilih');
        }
        if (data.is_tracked && !data.inventory_account_code) {
            errors.push('Mode "Lacak Inventory" aktif — Akun Persediaan wajib dipilih');
        }

        // Harga grosir validation
        if (data.wholesale_prices && data.wholesale_prices.length > 0) {
            data.wholesale_prices.forEach((wp, i) => {
                if (!wp.min_qty || Number(wp.min_qty) <= 0) {
                    errors.push(`Harga Grosir #${i + 1}: Min Qty harus lebih dari 0`);
                }
                if (Number(wp.price) < 0) {
                    errors.push(`Harga Grosir #${i + 1}: Harga tidak boleh negatif`);
                }
            });
        }

        return errors;
    }

    /** Create a new product */
    function createProduct(data) {
        const user = window.VITTA_USER || {};
        const sku = data.custom_sku && data.custom_sku.trim() !== '' ? data.custom_sku.trim() : generateSKU();
        data.sku = sku;

        const errors = validateProduct(data, false, null);
        if (errors.length > 0) return { success: false, errors };

        const now = new Date().toISOString();
        const product = {
            id: 'prod_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6),
            name: data.name.trim(),
            sku: sku,
            category_id: data.category_id || '',
            category_name: data.category_name || '',
            unit: data.unit || 'pcs',
            description: data.description || '',
            image_data: data.image_data || '',  // base64 for mock

            is_purchased: !!data.is_purchased,
            is_sold: !!data.is_sold,
            is_tracked: !!data.is_tracked,

            buy_price: parseFloat(data.buy_price) || 0,
            sell_price: parseFloat(data.sell_price) || 0,

            revenue_account_code: data.revenue_account_code || '',
            cogs_account_code: data.cogs_account_code || '',
            inventory_account_code: data.inventory_account_code || '',

            initial_stock: parseFloat(data.initial_stock) || 0,
            current_stock: parseFloat(data.initial_stock) || 0,
            min_stock: parseFloat(data.min_stock) || 0,
            stock_method: data.stock_method || 'FIFO',

            default_sell_tax: data.default_sell_tax || '',
            default_buy_tax: data.default_buy_tax || '',

            wholesale_prices: data.wholesale_prices || [],

            is_active: true,
            created_by: user.username || 'system',
            updated_by: user.username || 'system',
            created_at: now,
            updated_at: now,
        };

        const products = getProducts();
        products.push(product);
        saveProducts(products);

        // Audit log
        addAuditLog(product.id, 'CREATE', null, null, null, product.created_by);

        // Jika tracked, catat stok awal ke ledger
        if (product.is_tracked && product.initial_stock > 0) {
            if (window.VittaInventory) {
                const warehouses = window.VittaInventory.getWarehouses();
                const mainWhId = warehouses.length > 0 ? warehouses[0].id : 'WH-MAIN';
                try {
                    window.VittaInventory.recordStockMovement({
                        product_id: product.id,
                        warehouse_id: mainWhId,
                        tipe: 'in',
                        type_original: 'INITIAL',
                        qty: product.initial_stock,
                        hpp: product.buy_price,
                        reference_id: 'INITIAL',
                        memo: 'Stok awal saat pembuatan produk'
                    });
                } catch (e) {
                    console.error("Gagal mencatat stok awal ke inventory-engine:", e);
                }
            }
            
            // Catat juga ke local ledger untuk histori detail produk
            addStockLedger({
                product_id: product.id,
                type: 'INITIAL',
                reference_no: 'INITIAL',
                qty: product.initial_stock,
                unit_cost: product.buy_price,
                stock_before: 0,
                stock_after: product.initial_stock,
                notes: 'Stok awal saat pembuatan produk',
                created_by: product.created_by
            });
        }

        return { success: true, product };
    }

    /** Update an existing product */
    function updateProduct(id, data) {
        const user = window.VITTA_USER || {};
        const products = getProducts();
        const idx = products.findIndex(p => p.id === id);
        if (idx === -1) return { success: false, errors: ['Produk tidak ditemukan'] };

        const errors = validateProduct(data, true, id);
        if (errors.length > 0) return { success: false, errors };

        const oldProduct = { ...products[idx] };
        const now = new Date().toISOString();

        // Track changed fields for audit
        const fieldsToTrack = [
            'name', 'category_id', 'unit', 'description',
            'is_purchased', 'is_sold', 'is_tracked',
            'buy_price', 'sell_price',
            'revenue_account_code', 'cogs_account_code', 'inventory_account_code',
            'min_stock', 'stock_method',
            'default_sell_tax', 'default_buy_tax'
        ];

        fieldsToTrack.forEach(field => {
            const oldVal = String(oldProduct[field] || '');
            const newVal = String(data[field] !== undefined ? data[field] : oldProduct[field] || '');
            if (oldVal !== newVal) {
                addAuditLog(id, 'UPDATE', field, oldVal, newVal, user.username || 'system');
            }
        });

        // Update product
        products[idx] = {
            ...products[idx],
            name: (data.name || products[idx].name).trim(),
            category_id: data.category_id !== undefined ? data.category_id : products[idx].category_id,
            category_name: data.category_name !== undefined ? data.category_name : products[idx].category_name,
            unit: data.unit || products[idx].unit,
            description: data.description !== undefined ? data.description : products[idx].description,
            image_data: data.image_data !== undefined ? data.image_data : products[idx].image_data,

            is_purchased: data.is_purchased !== undefined ? !!data.is_purchased : products[idx].is_purchased,
            is_sold: data.is_sold !== undefined ? !!data.is_sold : products[idx].is_sold,
            is_tracked: data.is_tracked !== undefined ? !!data.is_tracked : products[idx].is_tracked,

            buy_price: data.buy_price !== undefined ? (parseFloat(data.buy_price) || 0) : products[idx].buy_price,
            sell_price: data.sell_price !== undefined ? (parseFloat(data.sell_price) || 0) : products[idx].sell_price,

            revenue_account_code: data.revenue_account_code !== undefined ? data.revenue_account_code : products[idx].revenue_account_code,
            cogs_account_code: data.cogs_account_code !== undefined ? data.cogs_account_code : products[idx].cogs_account_code,
            inventory_account_code: data.inventory_account_code !== undefined ? data.inventory_account_code : products[idx].inventory_account_code,

            min_stock: data.min_stock !== undefined ? (parseFloat(data.min_stock) || 0) : products[idx].min_stock,
            stock_method: data.stock_method || products[idx].stock_method,

            default_sell_tax: data.default_sell_tax !== undefined ? data.default_sell_tax : products[idx].default_sell_tax,
            default_buy_tax: data.default_buy_tax !== undefined ? data.default_buy_tax : products[idx].default_buy_tax,

            wholesale_prices: data.wholesale_prices !== undefined ? data.wholesale_prices : products[idx].wholesale_prices,

            updated_by: user.username || 'system',
            updated_at: now,
        };

        saveProducts(products);
        return { success: true, product: products[idx] };
    }

    /** Delete a product */
    function deleteProduct(id) {
        const user = window.VITTA_USER || {};
        let products = getProducts();
        const product = products.find(p => p.id === id);
        if (!product) return { success: false, error: 'Produk tidak ditemukan' };

        addAuditLog(id, 'DELETE', null, product.name, null, user.username || 'system');
        products = products.filter(p => p.id !== id);
        saveProducts(products);
        return { success: true };
    }

    // ─── STOCK LEDGER ────────────────────────────────────────

    function getStockLedger(productId) {
        if (window.VittaInventory) {
            const movs = window.VittaInventory.getStockMovements();
            if (productId) return movs.filter(m => m.product_id === productId);
            return movs;
        }
        try {
            const all = JSON.parse(localStorage.getItem(getScopedKey(STOCK_LEDGER_KEY))) || [];
            if (productId) return all.filter(s => s.product_id === productId);
            return all;
        } catch (e) { return []; }
    }

    function addStockLedger(entry) {
        const all = getStockLedger();
        all.push({
            id: 'stk_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 4),
            product_id: entry.product_id,
            type: entry.type,
            reference_no: entry.reference_no || '',
            qty: entry.qty,
            unit_cost: entry.unit_cost || 0,
            stock_before: entry.stock_before,
            stock_after: entry.stock_after,
            notes: entry.notes || '',
            created_by: entry.created_by || 'system',
            created_at: new Date().toISOString()
        });
        localStorage.setItem(getScopedKey(STOCK_LEDGER_KEY), JSON.stringify(all));
    }

    /** Process stock movement (called from sales/purchase modules) */
    function processStockMovement(productId, type, qty, refNo, unitCost, notes) {
        const product = getProductById(productId);
        if (!product || !product.is_tracked) return { success: false, error: 'Produk tidak dilacak' };

        // Determine signed qty
        let signedQty = qty;
        if (type === 'SALE' || type === 'RETURN_BUY') {
            signedQty = -Math.abs(qty);
        } else if (type === 'PURCHASE' || type === 'RETURN_SELL') {
            signedQty = Math.abs(qty);
        }

        // Keep local static stock in vitta_products updated
        const products = getProducts();
        const idx = products.findIndex(p => p.id === productId);
        let stockBefore = product.current_stock;
        let stockAfter = product.current_stock + signedQty;

        if (idx !== -1) {
            stockBefore = parseFloat(products[idx].current_stock) || 0;
            stockAfter = stockBefore + signedQty;
            products[idx].current_stock = stockAfter;
            saveProducts(products);
        }

        if (window.VittaInventory) {
            // Default ke gudang utama
            const whList = window.VittaInventory.getWarehouses();
            const mainWhId = whList.length > 0 ? whList[0].id : null;
            if (!mainWhId) return { success: false, error: 'Gudang tidak ditemukan' };
            
            // Map type
            let mappedType = 'in';
            
            if (type === 'PURCHASE' || type === 'RETURN_SELL') {
                mappedType = 'in';
            } else if (type === 'SALE' || type === 'RETURN_BUY') {
                mappedType = 'out';
            } else {
                mappedType = 'adjustment';
            }
            
            try {
                window.VittaInventory.recordStockMovement({
                    product_id: productId,
                    warehouse_id: mainWhId,
                    tipe: mappedType,
                    type_original: type,
                    qty: signedQty,
                    hpp: unitCost || product.buy_price,
                    reference_id: refNo,
                    memo: notes
                });
                return { success: true, stockBefore, stockAfter };
            } catch (e) {
                return { success: false, error: e.message };
            }
        } else {
            // Fallback: catat ke local ledger untuk histori detail produk
            addStockLedger({
                product_id: productId,
                type: type,
                reference_no: refNo,
                qty: signedQty,
                unit_cost: unitCost || product.buy_price,
                stock_before: stockBefore,
                stock_after: stockAfter,
                notes: notes || 'Fallback Stock Movement',
            });
            return { success: true, stockBefore, stockAfter };
        }
    }

    function updateStock(productId, qty) {
        const products = getProducts();
        const idx = products.findIndex(p => p.id === productId);
        if (idx === -1) return { success: false, error: 'Produk tidak ditemukan' };
        products[idx].current_stock = parseFloat(qty) || 0;
        saveProducts(products);
        return { success: true, product: products[idx] };
    }

    // ─── AUDIT LOG ───────────────────────────────────────────

    function getAuditLog(productId) {
        try {
            const all = JSON.parse(localStorage.getItem(getScopedKey(AUDIT_LOG_KEY))) || [];
            if (productId) return all.filter(l => l.product_id === productId);
            return all;
        } catch (e) { return []; }
    }

    function addAuditLog(productId, action, field, oldVal, newVal, changedBy) {
        const all = getAuditLog();
        all.push({
            id: 'aud_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 4),
            product_id: productId,
            action: action,
            field_changed: field,
            old_value: oldVal,
            new_value: newVal,
            changed_by: changedBy || 'system',
            changed_at: new Date().toISOString()
        });
        localStorage.setItem(getScopedKey(AUDIT_LOG_KEY), JSON.stringify(all));
    }

    // ─── HELPERS ─────────────────────────────────────────────

    function formatRupiah(num) {
        if (num === null || num === undefined || isNaN(num)) return 'Rp 0';
        return 'Rp ' + Number(num).toLocaleString('id-ID', { minimumFractionDigits: 0 });
    }

    function getLowStockProducts() {
        return getProducts().filter(p => 
            p.is_tracked && p.is_active && p.current_stock <= p.min_stock
        );
    }

    function getProductStats() {
        const products = getProducts().filter(p => p.is_active);
        return {
            total: products.length,
            sold: products.filter(p => p.is_sold).length,
            purchased: products.filter(p => p.is_purchased).length,
            tracked: products.filter(p => p.is_tracked).length,
            lowStock: getLowStockProducts().length,
        };
    }

    // ─── INIT & EXPOSE ──────────────────────────────────────

    seedCategories();

    window.VittaProduk = {
        // Categories
        getCategories,
        addCategory,
        deleteCategory,

        // Products
        getProducts,
        getProductById,
        getProductBySKU,
        getActiveProducts,
        getProductsSorted,
        createProduct,
        updateProduct,
        deleteProduct,
        validateProduct,
        generateSKU,

        // Stock
        getStockLedger,
        processStockMovement,
        getLowStockProducts,

        // Update Stock
        updateStock,

        // Audit
        getAuditLog,

        // Helpers
        formatRupiah,
        getProductStats,
    };

})();
