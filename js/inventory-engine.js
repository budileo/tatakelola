/**
 * VITTA ERP - Inventory & Warehouse Engine
 * Fitur: Multi-gudang, Moving Average HPP, Stock Movements, Integrasi Jurnal Akuntansi
 */

const INV_KEYS = {
    warehouses: 'vitta_warehouses',
    inventory: 'vitta_inventory',
    movements: 'vitta_stock_movements'
};

function getScopedKey(baseKey) {
    if (window.getScopedKey) return window.getScopedKey(baseKey);
    const activeDept = window.getActiveDept ? window.getActiveDept() : null;
    if (activeDept && activeDept.id) {
        return activeDept.id + '_' + baseKey;
    }
    return baseKey;
}

// Seed default warehouse if none exists
function initInventoryEngine() {
    const whKey = getScopedKey(INV_KEYS.warehouses);
    const invKey = getScopedKey(INV_KEYS.inventory);
    const movKey = getScopedKey(INV_KEYS.movements);
    
    let wh = JSON.parse(localStorage.getItem(whKey));
    if (!wh || wh.length === 0) {
        wh = [{
            id: 'WH-MAIN',
            nama_gudang: 'Gudang Utama',
            kode_gudang: 'MAIN',
            image: '',
            created_at: new Date().toISOString()
        }];
        localStorage.setItem(whKey, JSON.stringify(wh));
    }
    
    if (!localStorage.getItem(invKey)) {
        localStorage.setItem(invKey, JSON.stringify([]));
    }
    
    if (!localStorage.getItem(movKey)) {
        localStorage.setItem(movKey, JSON.stringify([]));
    }
}

// === WAREHOUSE CRUD ===
function getWarehouses() {
    return JSON.parse(localStorage.getItem(getScopedKey(INV_KEYS.warehouses))) || [];
}

// === INVENTORY CORE ===
function getInventory() {
    return JSON.parse(localStorage.getItem(getScopedKey(INV_KEYS.inventory))) || [];
}

function getStockMovements() {
    return JSON.parse(localStorage.getItem(getScopedKey(INV_KEYS.movements))) || [];
}

function getProductStock(productId, warehouseId = null) {
    const inv = getInventory();
    let totalQty = 0;
    let totalNilai = 0;
    
    inv.forEach(i => {
        if (i.product_id === productId && (!warehouseId || i.warehouse_id === warehouseId)) {
            totalQty += i.qty;
            totalNilai += i.total_nilai;
        }
    });
    
    return {
        qty: totalQty,
        hpp: totalQty > 0 ? (totalNilai / totalQty) : 0,
        total_nilai: totalNilai
    };
}

// Merekam pergerakan stok
function recordStockMovement(data) {
    /* 
    data: {
        product_id, warehouse_id, tipe ('in', 'out', 'transfer', 'adjustment'),
        qty, hpp (untuk 'in' dari pembelian, nilai unit), reference_id, date, memo
    }
    */
    if (!data.product_id || !data.warehouse_id || !data.tipe || !data.qty) {
        throw new Error("Data pergerakan stok tidak lengkap.");
    }
    
    const inv = getInventory();
    let invItem = inv.find(i => i.product_id === data.product_id && i.warehouse_id === data.warehouse_id);
    
    if (!invItem) {
        invItem = {
            id: 'INV-' + Date.now() + Math.random().toString(36).substring(2, 6),
            product_id: data.product_id,
            warehouse_id: data.warehouse_id,
            qty: 0,
            hpp: 0,
            total_nilai: 0
        };
        inv.push(invItem);
    }
    
    let oldQty = invItem.qty;
    let oldNilai = invItem.total_nilai;
    
    if (data.tipe === 'in' || (data.tipe === 'adjustment' && data.qty > 0)) {
        // MOVING AVERAGE HPP CALCULATION
        let incomingNilai = data.qty * (data.hpp || 0);
        let newQty = oldQty + data.qty;
        let newNilai = oldNilai + incomingNilai;
        
        invItem.qty = newQty;
        invItem.total_nilai = newNilai;
        invItem.hpp = newQty > 0 ? (newNilai / newQty) : 0;
        
    } else if (data.tipe === 'out' || (data.tipe === 'adjustment' && data.qty < 0)) {
        // Menggunakan HPP yang ada
        let outQty = Math.abs(data.qty);
        if (oldQty < outQty) {
            throw new Error(`Stok tidak mencukupi untuk produk ${data.product_id} di gudang ${data.warehouse_id}.`);
        }
        
        let outgoingNilai = outQty * invItem.hpp;
        invItem.qty -= outQty;
        invItem.total_nilai -= outgoingNilai;
        // HPP tetap sama
    }
    
    localStorage.setItem(getScopedKey(INV_KEYS.inventory), JSON.stringify(inv));
    
    // Save movement history
    const movs = getStockMovements();
    const movement = {
        id: 'MOV-' + Date.now(),
        product_id: data.product_id,
        warehouse_id: data.warehouse_id,
        tipe: data.tipe,
        type: data.type_original || (data.tipe === 'in' ? 'PURCHASE' : data.tipe === 'out' ? 'SALE' : 'ADJUSTMENT'), // fallback for UI
        qty: data.qty,
        stock_before: oldQty,
        stock_after: invItem.qty,
        hpp: data.tipe === 'in' ? data.hpp : invItem.hpp,
        reference_no: data.reference_id || '',
        memo: data.memo || '',
        created_by: data.created_by || 'system',
        created_at: data.date || new Date().toISOString()
    };
    movs.unshift(movement);
    localStorage.setItem(getScopedKey(INV_KEYS.movements), JSON.stringify(movs));
    
    return movement;
}

// Transfer stok antar gudang
function transferStock(productId, fromWarehouseId, toWarehouseId, qty, referenceId, memo) {
    if (qty <= 0) throw new Error("Kuantitas transfer harus lebih dari 0");
    
    const stockFrom = getProductStock(productId, fromWarehouseId);
    if (stockFrom.qty < qty) {
        throw new Error("Stok gudang asal tidak mencukupi");
    }
    
    const hpp = stockFrom.hpp;
    const date = new Date().toISOString();
    
    // Keluar dari asal
    recordStockMovement({
        product_id: productId, warehouse_id: fromWarehouseId,
        tipe: 'transfer', qty: -qty, hpp: hpp,
        reference_id: referenceId, memo: `Transfer out ke ${toWarehouseId}`, date
    });
    
    // Masuk ke tujuan
    recordStockMovement({
        product_id: productId, warehouse_id: toWarehouseId,
        tipe: 'transfer', qty: qty, hpp: hpp,
        reference_id: referenceId, memo: `Transfer in dari ${fromWarehouseId}`, date
    });
}

// INIT
initInventoryEngine();

window.VittaInventory = {
    getWarehouses,
    getInventory,
    getStockMovements,
    getProductStock,
    recordStockMovement,
    transferStock
};
