// inventori-ui.js

var formatRp = formatRp || ((num) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);
});


document.addEventListener('DOMContentLoaded', () => {
    renderInventoryTable();
    populateProductSelect();
    renderStats();
});

function renderStats() {
    const inv = window.VittaInventory ? window.VittaInventory.getInventory() : [];
    let totalItems = 0;
    let totalValue = 0;

    // We only count tracked products from VittaProduk
    const products = window.VittaProduk ? window.VittaProduk.getProducts() : [];
    const trackedProducts = products.filter(p => p.is_tracked);

    trackedProducts.forEach(p => {
        if (window.VittaInventory) {
            const stock = window.VittaInventory.getProductStock(p.id);
            totalItems += stock.qty;
            totalValue += stock.total_nilai;
        } else {
            totalItems += p.current_stock || 0;
            totalValue += (p.current_stock || 0) * (p.buy_price || 0);
        }
    });

    const cardsHtml = `
        <div class="bg-dark-800 p-4 rounded-xl border border-dark-700 flex items-center shadow-sm">
            <div class="p-3 bg-blue-500/10 rounded-lg mr-4">
                <svg class="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
            </div>
            <div>
                <p class="text-gray-400 text-xs font-medium uppercase tracking-wider">Total Item Dilacak</p>
                <p class="text-xl font-bold text-white mt-1">${trackedProducts.length} <span class="text-sm font-normal text-gray-500">SKU</span></p>
            </div>
        </div>
        <div class="bg-dark-800 p-4 rounded-xl border border-dark-700 flex items-center shadow-sm">
            <div class="p-3 bg-emerald-500/10 rounded-lg mr-4">
                <svg class="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
            </div>
            <div>
                <p class="text-gray-400 text-xs font-medium uppercase tracking-wider">Total Kuantitas Stok</p>
                <p class="text-xl font-bold text-white mt-1">${totalItems} <span class="text-sm font-normal text-gray-500">Unit</span></p>
            </div>
        </div>
        <div class="bg-dark-800 p-4 rounded-xl border border-dark-700 flex items-center shadow-sm lg:col-span-2">
            <div class="p-3 bg-purple-500/10 rounded-lg mr-4">
                <svg class="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <div>
                <p class="text-gray-400 text-xs font-medium uppercase tracking-wider">Total Nilai Persediaan</p>
                <p class="text-xl font-bold text-white mt-1">${formatRp(totalValue)}</p>
            </div>
        </div>
    `;
    const container = document.getElementById('statsCards');
    if (container) container.innerHTML = cardsHtml;
}

function renderInventoryTable() {
    const tbody = document.getElementById('tbodyInventory');
    if (!tbody) return;

    const searchTerm = document.getElementById('fSearchInv')?.value.toLowerCase() || '';
    
    let products = window.VittaProduk ? window.VittaProduk.getProducts() : [];
    products = products.filter(p => p.is_tracked); // Hanya produk yang dilacak

    if (searchTerm) {
        products = products.filter(p => 
            p.name.toLowerCase().includes(searchTerm) || 
            (p.sku && p.sku.toLowerCase().includes(searchTerm))
        );
    }

    let html = '';
    
    if (products.length === 0) {
        html = `<tr><td colspan="5" class="px-4 py-8 text-center text-gray-500">Tidak ada produk inventori yang ditemukan</td></tr>`;
    } else {
        products.forEach(p => {
            let qty = 0;
            let hpp = p.buy_price || 0;
            let totalNilai = 0;

            if (window.VittaInventory) {
                const stockInfo = window.VittaInventory.getProductStock(p.id);
                qty = stockInfo.qty;
                hpp = stockInfo.hpp || p.buy_price || 0;
                totalNilai = stockInfo.total_nilai || (qty * hpp);
            } else {
                qty = p.current_stock || 0;
                totalNilai = qty * hpp;
            }

            html += `
                <tr class="transition-colors group hover:bg-dark-700/30 cursor-pointer" ondblclick="openMovementsModal('${p.id}')" title="Klik 2 kali untuk melihat detail pergerakan stok">
                    <td class="px-4 py-3 font-mono text-gray-400 text-xs">${p.sku || '-'}</td>
                    <td class="px-4 py-3">
                        <div class="font-medium text-white group-hover:text-blue-400 transition-colors">${p.name}</div>
                        <div class="text-xs text-gray-500">${p.unit}</div>
                    </td>
                    <td class="px-4 py-3 text-center">
                        <span class="px-2 py-1 rounded text-xs font-medium ${qty <= (p.min_stock||0) ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}">
                            ${qty}
                        </span>
                    </td>
                    <td class="px-4 py-3 text-right font-mono text-xs">${formatRp(hpp)}</td>
                    <td class="px-4 py-3 text-right font-medium text-white">${formatRp(totalNilai)}</td>
                </tr>
            `;
        });
    }
    
    tbody.innerHTML = html;
}

// === MODAL PENYESUAIAN STOK ===

function openAdjustmentModal() {
    const modal = document.getElementById('modalAdjustment');
    if (modal) {
        document.getElementById('adjQty').value = '';
        document.getElementById('adjHpp').value = '';
        document.getElementById('adjMemo').value = '';
        
        // Pilih produk pertama secara default
        const select = document.getElementById('adjProduct');
        if (select.options.length > 0) {
            select.selectedIndex = 0;
            updateCurrentStockDisplay();
        }
        
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

function closeAdjustmentModal() {
    const modal = document.getElementById('modalAdjustment');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

function populateProductSelect() {
    const select = document.getElementById('adjProduct');
    if (!select) return;
    
    let products = window.VittaProduk ? window.VittaProduk.getProducts() : [];
    products = products.filter(p => p.is_tracked);
    
    let html = '';
    products.forEach(p => {
        html += `<option value="${p.id}">${p.sku ? '['+p.sku+'] ' : ''}${p.name}</option>`;
    });
    
    select.innerHTML = html;
    
    select.addEventListener('change', updateCurrentStockDisplay);
}

function updateCurrentStockDisplay() {
    const productId = document.getElementById('adjProduct').value;
    const inputCurrent = document.getElementById('adjCurrentStock');
    
    if (!productId || !inputCurrent) return;
    
    if (window.VittaInventory) {
        const stock = window.VittaInventory.getProductStock(productId);
        inputCurrent.value = stock.qty;
    } else {
        const product = window.VittaProduk.getProductById(productId);
        inputCurrent.value = product ? (product.current_stock || 0) : 0;
    }
}

function saveAdjustment() {
    const productId = document.getElementById('adjProduct').value;
    const qtyStr = document.getElementById('adjQty').value;
    const memo = document.getElementById('adjMemo').value;
    const hppStr = document.getElementById('adjHpp').value;
    
    if (!productId || !qtyStr) {
        alert("Pilih produk dan masukkan kuantitas penyesuaian.");
        return;
    }
    
    const qty = parseFloat(qtyStr);
    if (isNaN(qty) || qty === 0) {
        alert("Kuantitas penyesuaian tidak valid.");
        return;
    }
    
    if (!window.VittaProduk) {
        alert("Engine Produk tidak ditemukan.");
        return;
    }

    const product = window.VittaProduk.getProductById(productId);
    if (!product) return;

    let hpp = parseFloat(hppStr);
    if (isNaN(hpp) || hpp <= 0) {
        // Gunakan HPP yang ada jika tidak diisi
        if (window.VittaInventory) {
            const stock = window.VittaInventory.getProductStock(productId);
            hpp = stock.hpp || product.buy_price;
        } else {
            hpp = product.buy_price;
        }
    }

    // Process Stock Movement
    const res = window.VittaProduk.processStockMovement(productId, 'ADJUSTMENT', qty, 'ADJ-'+Date.now(), hpp, memo || 'Penyesuaian Stok Manual');
    
    if (res.success) {
        // Auto Journal (Optional - tapi best practice di akuntansi)
        if (window.VittaJournal && product.inventory_account && product.cogs_account) {
            const totalVal = Math.abs(qty) * hpp;
            const jLines = [];
            
            if (qty > 0) {
                // Tambah stok: Debit Persediaan, Kredit HPP/Penyesuaian
                jLines.push({ account: product.inventory_account, debit: totalVal, credit: 0 });
                jLines.push({ account: product.cogs_account, debit: 0, credit: totalVal });
            } else {
                // Kurangi stok: Debit HPP/Penyesuaian, Kredit Persediaan
                jLines.push({ account: product.cogs_account, debit: totalVal, credit: 0 });
                jLines.push({ account: product.inventory_account, debit: 0, credit: totalVal });
            }
            
            try {
                window.VittaJournal.createJournalEntry(new Date().toISOString().split('T')[0], `Penyesuaian Stok ${product.name}`, jLines, 'ADJ-'+Date.now());
            } catch (e) {
                console.warn("Gagal membuat jurnal penyesuaian:", e);
            }
        }

        closeAdjustmentModal();
        renderInventoryTable();
        renderStats();
        // Update dashboard/header notifications if any
        if (typeof alert === 'function') {
            // alert('Penyesuaian stok berhasil disimpan.');
        }
    } else {
        alert("Gagal melakukan penyesuaian: " + res.error);
    }
}

// === DETAIL PERGERAKAN STOK (DOUBLE CLICK) ===

window.openMovementsModal = function (productId) {
    const product = window.VittaProduk ? window.VittaProduk.getProductById(productId) : null;
    if (!product) return;

    const existing = document.getElementById('modalMovements');
    if (existing) existing.remove();

    const movements = window.VittaInventory 
        ? window.VittaInventory.getStockMovements().filter(m => m.product_id === productId)
        : [];

    const typeBadges = {
        in: '<span class="bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded text-xs font-medium border border-emerald-500/20">Masuk</span>',
        out: '<span class="bg-rose-500/10 text-rose-400 px-2.5 py-0.5 rounded text-xs font-medium border border-rose-500/20">Keluar</span>',
        adjustment: '<span class="bg-purple-500/10 text-purple-400 px-2.5 py-0.5 rounded text-xs font-medium border border-purple-500/20">Penyesuaian</span>',
        transfer: '<span class="bg-blue-500/10 text-blue-400 px-2.5 py-0.5 rounded text-xs font-medium border border-blue-500/20">Transfer</span>'
    };

    let movementsHtml = '';
    if (movements.length === 0) {
        movementsHtml = `<tr><td colspan="6" class="px-4 py-8 text-center text-gray-500 text-sm">Belum ada riwayat transaksi masuk/keluar untuk produk ini.</td></tr>`;
    } else {
        movements.forEach(m => {
            const dateStr = new Date(m.created_at || m.date).toLocaleString('id-ID', {
                day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
            });
            const badge = typeBadges[m.tipe] || `<span class="bg-gray-500/10 text-gray-400 px-2 py-0.5 rounded text-xs font-medium">${m.tipe}</span>`;
            const qtySign = m.qty > 0 ? '+' : '';
            const qtyClass = m.qty > 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold';
            
            movementsHtml += `
                <tr class="border-b border-dark-700 text-xs hover:bg-dark-700/20 transition-colors">
                    <td class="px-4 py-3 text-gray-400 font-medium">${dateStr}</td>
                    <td class="px-4 py-3">${badge}</td>
                    <td class="px-4 py-3 text-white font-mono">${m.reference_no || m.id || '-'}</td>
                    <td class="px-4 py-3 text-gray-300 max-w-[200px] truncate" title="${m.memo || ''}">${m.memo || '-'}</td>
                    <td class="px-4 py-3 text-right ${qtyClass}">${qtySign}${m.qty}</td>
                    <td class="px-4 py-3 text-right font-medium text-white">${m.stock_after}</td>
                </tr>
            `;
        });
    }

    const modal = document.createElement('div');
    modal.id = 'modalMovements';
    modal.className = 'fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm animate-fade-in px-4';
    modal.innerHTML = `
        <div class="bg-dark-800 border border-dark-700 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl animate-fade-in-up">
            <div class="p-6 border-b border-dark-700 flex justify-between items-center sticky top-0 bg-dark-800/90 backdrop-blur-sm rounded-t-2xl">
                <div>
                    <h3 class="text-lg font-bold text-white">Riwayat Mutasi Barang</h3>
                    <p class="text-xs text-gray-400 mt-1">${product.sku ? '[' + product.sku + '] ' : ''}${product.name}</p>
                </div>
                <button onclick="document.getElementById('modalMovements').remove()" class="text-gray-400 hover:text-white transition-colors">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
            
            <div class="overflow-y-auto p-6 flex-1">
                <table class="w-full text-left text-sm text-gray-300">
                    <thead class="bg-dark-700/50 text-gray-400 border-b border-dark-700 text-xs uppercase tracking-wider sticky top-0">
                        <tr>
                            <th class="px-4 py-3 font-semibold">Tanggal</th>
                            <th class="px-4 py-3 font-semibold">Tipe</th>
                            <th class="px-4 py-3 font-semibold">No. Ref</th>
                            <th class="px-4 py-3 font-semibold">Catatan / Keterangan</th>
                            <th class="px-4 py-3 font-semibold text-right">Kuantitas (Qty)</th>
                            <th class="px-4 py-3 font-semibold text-right">Stok Akhir</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-dark-700 bg-dark-800/20">
                        ${movementsHtml}
                    </tbody>
                </table>
            </div>
            
            <div class="p-4 border-t border-dark-700 bg-dark-800 flex justify-end rounded-b-2xl">
                <button onclick="document.getElementById('modalMovements').remove()" class="px-5 py-2.5 bg-dark-700 hover:bg-dark-600 rounded-xl text-sm font-medium text-gray-300 transition-colors">Tutup</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
};
