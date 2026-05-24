// ============================================================
// Tata Kelola One — Product UI (Master Produk)
// UI Rendering & Interaction Layer
// ============================================================

(function () {
    'use strict';

    const P = window.VittaProduk;
    const COA = window.VittaCOA;

    // ─── VIEW SWITCHING ──────────────────────────────────────

    let currentEditId = null;
    let currentDetailId = null;

    window.showView = function (view) {
        document.getElementById('viewList').classList.add('hidden');
        document.getElementById('viewForm').classList.add('hidden');
        document.getElementById('viewDetail').classList.add('hidden');
        document.getElementById('viewList').classList.remove('flex');

        switch (view) {
            case 'list':
                document.getElementById('viewList').classList.remove('hidden');
                renderProductList();
                break;
            case 'form':
                document.getElementById('viewForm').classList.remove('hidden');
                break;
            case 'detail':
                document.getElementById('viewDetail').classList.remove('hidden');
                break;
        }
    };

    // ─── TOAST NOTIFICATION ──────────────────────────────────

    function showToast(message, type) {
        const existing = document.getElementById('vitta-toast');
        if (existing) existing.remove();

        const colors = {
            success: 'bg-emerald-600',
            error: 'bg-rose-600',
            warning: 'bg-amber-600',
            info: 'bg-blue-600'
        };

        const icons = {
            success: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>',
            error: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>',
            warning: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>',
            info: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>'
        };

        const toast = document.createElement('div');
        toast.id = 'vitta-toast';
        toast.className = `fixed top-6 right-6 z-[9999] ${colors[type] || colors.info} text-white px-5 py-3 rounded-xl shadow-2xl flex items-center space-x-3 animate-fade-in-down`;
        toast.innerHTML = `
            <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">${icons[type] || icons.info}</svg>
            <span class="text-sm font-medium">${message}</span>
        `;
        document.body.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.5s'; setTimeout(() => toast.remove(), 500); }, 3500);
    }

    // ─── PRODUCT LIST RENDERING ──────────────────────────────

    function renderProductList() {
        const stats = P.getProductStats();
        const statsContainer = document.getElementById('statsCards');
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class="bg-dark-800 border border-dark-700 rounded-2xl p-5 hover:border-blue-500/50 transition-all duration-300">
                    <div class="flex justify-between items-start">
                        <div><p class="text-sm font-medium text-gray-400">Total Produk</p><h3 class="text-2xl font-bold text-white mt-1">${stats.total}</h3></div>
                        <div class="p-2.5 bg-blue-500/10 rounded-xl"><svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg></div>
                    </div>
                </div>
                <div class="bg-dark-800 border border-dark-700 rounded-2xl p-5 hover:border-emerald-500/50 transition-all duration-300">
                    <div class="flex justify-between items-start">
                        <div><p class="text-sm font-medium text-gray-400">Produk Dijual</p><h3 class="text-2xl font-bold text-emerald-400 mt-1">${stats.sold}</h3></div>
                        <div class="p-2.5 bg-emerald-500/10 rounded-xl"><svg class="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg></div>
                    </div>
                </div>
                <div class="bg-dark-800 border border-dark-700 rounded-2xl p-5 hover:border-purple-500/50 transition-all duration-300">
                    <div class="flex justify-between items-start">
                        <div><p class="text-sm font-medium text-gray-400">Produk Dibeli</p><h3 class="text-2xl font-bold text-purple-400 mt-1">${stats.purchased}</h3></div>
                        <div class="p-2.5 bg-purple-500/10 rounded-xl"><svg class="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg></div>
                    </div>
                </div>
                <div class="bg-dark-800 border border-dark-700 rounded-2xl p-5 hover:border-rose-500/50 transition-all duration-300">
                    <div class="flex justify-between items-start">
                        <div><p class="text-sm font-medium text-gray-400">Stok Rendah</p><h3 class="text-2xl font-bold ${stats.lowStock > 0 ? 'text-rose-400' : 'text-white'} mt-1">${stats.lowStock}</h3></div>
                        <div class="p-2.5 bg-rose-500/10 rounded-xl"><svg class="w-6 h-6 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path></svg></div>
                    </div>
                </div>
            `;
        }

        // Filter
        const searchVal = (document.getElementById('fSearchProduct')?.value || '').toLowerCase();
        const catFilter = document.getElementById('fCategoryFilter')?.value || '';

        let products = P.getProductsSorted();

        if (searchVal) {
            products = products.filter(p =>
                p.name.toLowerCase().includes(searchVal) ||
                p.sku.toLowerCase().includes(searchVal) ||
                (p.description || '').toLowerCase().includes(searchVal)
            );
        }
        if (catFilter) {
            products = products.filter(p => p.category_id === catFilter);
        }

        const tbody = document.getElementById('tbodyProducts');
        if (!tbody) return;

        if (products.length === 0) {
            tbody.innerHTML = `
                <tr><td colspan="9" class="text-center py-12">
                    <div class="flex flex-col items-center">
                        <svg class="w-16 h-16 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                        <p class="text-gray-500 text-lg font-medium">Belum ada produk</p>
                        <p class="text-gray-600 text-sm mt-1">Klik "Tambah Produk" untuk memulai</p>
                    </div>
                </td></tr>
            `;
            return;
        }

        tbody.innerHTML = products.map(p => {
            const imgThumb = p.image_data
                ? `<img src="${p.image_data}" class="w-10 h-10 rounded-lg object-cover border border-dark-600" alt="">`
                : `<div class="w-10 h-10 rounded-lg bg-dark-700 flex items-center justify-center text-gray-500"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>`;

            const stockBadge = p.is_tracked
                ? (p.current_stock <= p.min_stock
                    ? `<span class="bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded text-xs font-medium">${p.current_stock} ${p.unit}</span>`
                    : `<span class="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-xs font-medium">${p.current_stock} ${p.unit}</span>`)
                : `<span class="text-gray-600 text-xs">—</span>`;

            const modeBadges = [];
            if (p.is_sold) modeBadges.push('<span class="bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded text-[10px]">Jual</span>');
            if (p.is_purchased) modeBadges.push('<span class="bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded text-[10px]">Beli</span>');
            if (p.is_tracked) modeBadges.push('<span class="bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded text-[10px]">Stok</span>');

            return `
                <tr class="hover:bg-dark-700/30 transition-colors group cursor-pointer" onclick="openDetail('${p.id}')">
                    <td class="px-4 py-3">${imgThumb}</td>
                    <td class="px-4 py-3 font-mono text-blue-400 text-xs">${p.sku}</td>
                    <td class="px-4 py-3">
                        <div class="font-medium text-white">${escHtml(p.name)}</div>
                        <div class="flex gap-1 mt-1">${modeBadges.join('')}</div>
                    </td>
                    <td class="px-4 py-3 text-gray-400 text-xs">${escHtml(p.category_name || '-')}</td>
                    <td class="px-4 py-3 text-right text-sm">${p.is_purchased ? P.formatRupiah(p.buy_price) : '<span class="text-gray-600">—</span>'}</td>
                    <td class="px-4 py-3 text-right text-sm">${p.is_sold ? P.formatRupiah(p.sell_price) : '<span class="text-gray-600">—</span>'}</td>
                    <td class="px-4 py-3 text-center">${stockBadge}</td>
                    <td class="px-4 py-3 text-right" onclick="event.stopPropagation()">
                        <button onclick="openForm('${p.id}')" class="text-blue-400 hover:text-blue-300 text-xs mr-3 font-medium" title="Edit">Edit</button>
                        <button onclick="confirmDeleteProduct('${p.id}','${escHtml(p.name)}')" class="text-rose-400 hover:text-rose-300 text-xs font-medium" title="Hapus">Hapus</button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // ─── CATEGORY FILTER DROPDOWN ────────────────────────────

    function renderCategoryFilter() {
        const sel = document.getElementById('fCategoryFilter');
        if (!sel) return;
        const cats = P.getCategories();
        sel.innerHTML = '<option value="">Semua Kategori</option>' +
            cats.map(c => `<option value="${c.id}">${escHtml(c.name)}</option>`).join('');
    }

    // ─── FORM RENDERING ─────────────────────────────────────

    window.openForm = function (id) {
        currentEditId = id || null;
        const form = document.getElementById('productForm');
        if (!form) return;

        // Reset form
        form.reset();
        document.getElementById('formTitle').textContent = id ? 'Edit Produk' : 'Tambah Produk Baru';
        const skuInput = document.getElementById('fSKU');
        skuInput.value = id ? '' : P.generateSKU();
        skuInput.readOnly = false; // User bisa ubah SKU
        document.getElementById('wholesaleRows').innerHTML = '';
        document.getElementById('imagePreview').innerHTML = '';
        document.getElementById('formErrors').innerHTML = '';
        document.getElementById('formErrors').classList.add('hidden');

        // Populate category dropdown
        renderCategoryDropdown();
        // Populate COA dropdowns
        renderCOADropdowns();

        if (id) {
            const p = P.getProductById(id);
            if (!p) return;

            document.getElementById('fName').value = p.name;
            document.getElementById('fSKU').value = p.sku;
            document.getElementById('fCategory').value = p.category_id;
            document.getElementById('fUnit').value = p.unit;
            document.getElementById('fDescription').value = p.description || '';

            // Image
            if (p.image_data) {
                document.getElementById('imagePreview').innerHTML = `<img src="${p.image_data}" class="w-32 h-32 object-cover rounded-xl border border-dark-600">`;
            }

            // Toggles
            document.getElementById('toggleBuy').checked = p.is_purchased;
            document.getElementById('toggleSell').checked = p.is_sold;
            document.getElementById('toggleTrack').checked = p.is_tracked;

            // Prices
            document.getElementById('fBuyPrice').value = p.buy_price || '';
            document.getElementById('fSellPrice').value = p.sell_price || '';

            // COA
            document.getElementById('fRevenueAccount').value = p.revenue_account_code || '';
            document.getElementById('fCOGSAccount').value = p.cogs_account_code || '';
            document.getElementById('fInventoryAccount').value = p.inventory_account_code || '';

            // Tax
            document.getElementById('fSellTax').value = p.default_sell_tax || '';
            document.getElementById('fBuyTax').value = p.default_buy_tax || '';

            // Inventory
            document.getElementById('fInitialStock').value = p.initial_stock || '';
            document.getElementById('fMinStock').value = p.min_stock || '';
            document.getElementById('fStockMethod').value = p.stock_method || 'FIFO';

            // Wholesale prices
            if (p.wholesale_prices && p.wholesale_prices.length > 0) {
                p.wholesale_prices.forEach(wp => addWholesaleRow(wp.min_qty, wp.price, wp.label));
            }

            // Toggle sections visibility
            updateToggleSections();
        } else {
            // ── Defaults for new product ──
            document.getElementById('toggleSell').checked = true;

            // Auto-select default COA accounts
            document.getElementById('fRevenueAccount').value = '4-40000';   // Pendapatan
            document.getElementById('fCOGSAccount').value = '5-50000';      // Beban Pokok Pendapatan
            document.getElementById('fInventoryAccount').value = '1-10200'; // Persediaan Barang

            // Auto-select default tax (PPN 11%)
            document.getElementById('fSellTax').value = 'PPN 11%';
            document.getElementById('fBuyTax').value = 'PPN 11%';

            updateToggleSections();
        }

        showView('form');
    };

    function renderCategoryDropdown() {
        const sel = document.getElementById('fCategory');
        if (!sel) return;
        const cats = P.getCategories().filter(c => c.is_active);
        sel.innerHTML = '<option value="">-- Pilih Kategori --</option>' +
            cats.map(c => `<option value="${c.id}">${escHtml(c.name)}</option>`).join('');
    }

    function renderCOADropdowns() {
        if (!COA) return;

        // Revenue accounts (4-xxxxx)
        const revAccounts = COA.getRevenueAccounts();
        const revSel = document.getElementById('fRevenueAccount');
        if (revSel) {
            revSel.innerHTML = '<option value="">-- Pilih Akun Penjualan --</option>' +
                revAccounts.map(a => `<option value="${a.code}">${a.code} — ${escHtml(a.name)}</option>`).join('');
        }

        // COGS accounts (5-xxxxx, 6-xxxxx)
        const cogsAccounts = COA.getCOGSAccounts();
        const cogsSel = document.getElementById('fCOGSAccount');
        if (cogsSel) {
            cogsSel.innerHTML = '<option value="">-- Pilih Akun HPP/Pembelian --</option>' +
                cogsAccounts.map(a => `<option value="${a.code}">${a.code} — ${escHtml(a.name)}</option>`).join('');
        }

        // Inventory accounts (Persediaan)
        const invAccounts = COA.getInventoryAccounts();
        const invSel = document.getElementById('fInventoryAccount');
        if (invSel) {
            invSel.innerHTML = '<option value="">-- Pilih Akun Persediaan --</option>' +
                invAccounts.map(a => `<option value="${a.code}">${a.code} — ${escHtml(a.name)}</option>`).join('');
        }
    }

    // ─── TOGGLE SECTIONS ────────────────────────────────────

    window.updateToggleSections = function () {
        const isBuy = document.getElementById('toggleBuy')?.checked;
        const isSell = document.getElementById('toggleSell')?.checked;
        const isTrack = document.getElementById('toggleTrack')?.checked;

        // Buy section
        const buySection = document.getElementById('sectionBuy');
        if (buySection) {
            buySection.style.maxHeight = isBuy ? buySection.scrollHeight + 'px' : '0';
            buySection.style.opacity = isBuy ? '1' : '0';
            buySection.style.overflow = 'hidden';
        }

        // Sell section
        const sellSection = document.getElementById('sectionSell');
        if (sellSection) {
            sellSection.style.maxHeight = isSell ? sellSection.scrollHeight + 'px' : '0';
            sellSection.style.opacity = isSell ? '1' : '0';
            sellSection.style.overflow = 'hidden';
        }

        // Track section
        const trackSection = document.getElementById('sectionTrack');
        if (trackSection) {
            trackSection.style.maxHeight = isTrack ? trackSection.scrollHeight + 'px' : '0';
            trackSection.style.opacity = isTrack ? '1' : '0';
            trackSection.style.overflow = 'hidden';
        }

        // COA fields visibility
        const cogsRow = document.getElementById('rowCOGS');
        const revRow = document.getElementById('rowRevenue');
        const invRow = document.getElementById('rowInventory');
        if (cogsRow) cogsRow.style.display = isBuy ? '' : 'none';
        if (revRow) revRow.style.display = isSell ? '' : 'none';
        if (invRow) invRow.style.display = isTrack ? '' : 'none';

        // Re-calc max height after a tick (for nested transitions)
        setTimeout(() => {
            [buySection, sellSection, trackSection].forEach(s => {
                if (s && s.style.opacity === '1') s.style.maxHeight = s.scrollHeight + 'px';
            });
        }, 50);
    };

    // ─── WHOLESALE ROWS ─────────────────────────────────────

    window.addWholesaleRow = function (qty, price, label) {
        const container = document.getElementById('wholesaleRows');
        if (!container) return;
        const row = document.createElement('div');
        row.className = 'grid grid-cols-12 gap-2 items-center wholesale-row animate-fade-in-up';
        row.innerHTML = `
            <div class="col-span-3">
                <input type="number" class="w-full ws-qty" placeholder="Min Qty" min="1" value="${qty || ''}">
            </div>
            <div class="col-span-4">
                <input type="number" class="w-full ws-price" placeholder="Harga per unit" min="0" value="${price || ''}">
            </div>
            <div class="col-span-4">
                <input type="text" class="w-full ws-label" placeholder="Label (opsional)" value="${label || ''}">
            </div>
            <div class="col-span-1 flex justify-center">
                <button type="button" onclick="this.closest('.wholesale-row').remove()" class="text-rose-400 hover:text-rose-300 p-1 rounded transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            </div>
        `;
        container.appendChild(row);
    };

    // ─── IMAGE UPLOAD ───────────────────────────────────────

    window.handleImageUpload = function (input) {
        const file = input.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            showToast('Ukuran gambar maksimal 2MB', 'error');
            return;
        }
        const reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById('imagePreview').innerHTML = `
                <div class="relative group">
                    <img src="${e.target.result}" class="w-32 h-32 object-cover rounded-xl border border-dark-600 shadow-lg">
                    <button type="button" onclick="clearImage()" class="absolute -top-2 -right-2 bg-rose-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">✕</button>
                </div>
            `;
            document.getElementById('fImageData').value = e.target.result;
        };
        reader.readAsDataURL(file);
    };

    window.clearImage = function () {
        document.getElementById('imagePreview').innerHTML = '';
        document.getElementById('fImageData').value = '';
        document.getElementById('fImageUpload').value = '';
    };

    // ─── ADD CATEGORY (inline) ──────────────────────────────

    window.showAddCategoryModal = function () {
        const name = prompt('Masukkan nama kategori baru:');
        if (!name || !name.trim()) return;
        const result = P.addCategory(name.trim());
        if (result.success) {
            showToast('Kategori "' + name.trim() + '" berhasil ditambahkan', 'success');
            renderCategoryDropdown();
            renderCategoryFilter();
            // Auto-select the new category
            document.getElementById('fCategory').value = result.category.id;
        } else {
            showToast(result.error, 'error');
        }
    };

    // ─── SAVE PRODUCT ───────────────────────────────────────

    window.saveProduct = function () {
        try {
            const errBox = document.getElementById('formErrors');
            errBox.classList.add('hidden');
            errBox.innerHTML = '';

            // Gather wholesale prices
            const wholesaleRows = document.querySelectorAll('.wholesale-row');
            const wholesalePrices = [];
            wholesaleRows.forEach(row => {
                const qty = row.querySelector('.ws-qty')?.value;
                const price = row.querySelector('.ws-price')?.value;
                const label = row.querySelector('.ws-label')?.value || '';
                if (qty || price) {
                    wholesalePrices.push({
                        min_qty: parseFloat(qty) || 0,
                        price: parseFloat(price) || 0,
                        label: label.trim()
                    });
                }
            });

            // Get category name
            const catSel = document.getElementById('fCategory');
            const catName = catSel.selectedOptions[0]?.text || '';

            const data = {
                name: document.getElementById('fName').value,
                category_id: catSel.value,
                category_name: catSel.value ? catName : '',
                unit: document.getElementById('fUnit').value,
                description: document.getElementById('fDescription').value,
                image_data: document.getElementById('fImageData').value,

                is_purchased: document.getElementById('toggleBuy').checked,
                is_sold: document.getElementById('toggleSell').checked,
                is_tracked: document.getElementById('toggleTrack').checked,

                buy_price: document.getElementById('fBuyPrice').value,
                sell_price: document.getElementById('fSellPrice').value,

                revenue_account_code: document.getElementById('fRevenueAccount').value,
                cogs_account_code: document.getElementById('fCOGSAccount').value,
                inventory_account_code: document.getElementById('fInventoryAccount').value,

                default_sell_tax: document.getElementById('fSellTax').value,
                default_buy_tax: document.getElementById('fBuyTax').value,

                initial_stock: document.getElementById('fInitialStock').value,
                min_stock: document.getElementById('fMinStock').value,
                stock_method: document.getElementById('fStockMethod').value,

                wholesale_prices: wholesalePrices,
            };

                let result;
            if (currentEditId) {
                data.sku = document.getElementById('fSKU').value;
                result = P.updateProduct(currentEditId, data);
            } else {
                // Pass custom SKU jika user mengubahnya
                const skuVal = document.getElementById('fSKU').value.trim();
                if (skuVal) data.custom_sku = skuVal;
                result = P.createProduct(data);
            }

            if (!result.success) {
                errBox.classList.remove('hidden');
                errBox.innerHTML = `
                    <div class="flex items-start">
                        <svg class="w-5 h-5 text-rose-400 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <div>
                            <p class="font-semibold text-rose-400 text-sm">Gagal menyimpan:</p>
                            <ul class="list-disc list-inside mt-1 text-rose-300 text-xs space-y-0.5">
                                ${result.errors.map(e => `<li>${escHtml(e)}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                `;
                errBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return;
            }

            showToast(currentEditId ? 'Produk berhasil diperbarui' : 'Produk baru berhasil disimpan', 'success');
            currentEditId = null;
            showView('list');
        } catch (error) {
            console.error("Error saving product:", error);
            alert("Terjadi kesalahan sistem saat menyimpan produk: " + error.message);
        }
    };

    // ─── DELETE PRODUCT ─────────────────────────────────────

    window.confirmDeleteProduct = function (id, name) {
        // Build custom confirmation modal
        const existing = document.getElementById('deleteModal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'deleteModal';
        modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in-down';
        modal.innerHTML = `
            <div class="bg-dark-800 border border-dark-700 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
                <div class="flex items-center mb-4">
                    <div class="p-3 bg-rose-500/10 rounded-xl mr-4">
                        <svg class="w-6 h-6 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </div>
                    <div>
                        <h3 class="text-lg font-bold text-white">Hapus Produk</h3>
                        <p class="text-sm text-gray-400">Tindakan ini tidak dapat dibatalkan</p>
                    </div>
                </div>
                <p class="text-gray-300 text-sm mb-6">Apakah Anda yakin ingin menghapus produk <strong class="text-white">"${escHtml(name)}"</strong>?</p>
                <div class="flex justify-end gap-3">
                    <button onclick="document.getElementById('deleteModal').remove()" class="px-4 py-2 rounded-lg text-sm text-gray-300 hover:bg-dark-700 transition-colors">Batal</button>
                    <button onclick="doDeleteProduct('${id}')" class="px-4 py-2 rounded-lg text-sm font-medium text-white bg-rose-600 hover:bg-rose-500 transition-colors shadow-lg">Hapus</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    };

    window.doDeleteProduct = function (id) {
        const result = P.deleteProduct(id);
        document.getElementById('deleteModal')?.remove();
        if (result.success) {
            showToast('Produk berhasil dihapus', 'success');
            renderProductList();
        } else {
            showToast(result.error || 'Gagal menghapus produk', 'error');
        }
    };

    // ─── DETAIL VIEW ────────────────────────────────────────

    window.openDetail = function (id) {
        currentDetailId = id;
        const p = P.getProductById(id);
        if (!p) return;

        const container = document.getElementById('detailContent');
        if (!container) return;

        // Get COA names
        const revAccount = COA ? COA.getAccountByCode(p.revenue_account_code) : null;
        const cogsAccount = COA ? COA.getAccountByCode(p.cogs_account_code) : null;
        const invAccount = COA ? COA.getAccountByCode(p.inventory_account_code) : null;

        // Stock ledger
        const ledger = P.getStockLedger(id);
        const auditLog = P.getAuditLog(id);

        const imgSection = p.image_data
            ? `<img src="${p.image_data}" class="w-24 h-24 object-cover rounded-xl border border-dark-600 shadow-lg">`
            : `<div class="w-24 h-24 rounded-xl bg-dark-700 flex items-center justify-center"><svg class="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>`;

        const typeLabels = { INITIAL: 'Stok Awal', PURCHASE: 'Pembelian', SALE: 'Penjualan', RETURN_BUY: 'Retur Beli', RETURN_SELL: 'Retur Jual', ADJUSTMENT: 'Penyesuaian' };
        const typeColors = { INITIAL: 'text-blue-400', PURCHASE: 'text-emerald-400', SALE: 'text-rose-400', RETURN_BUY: 'text-amber-400', RETURN_SELL: 'text-amber-400', ADJUSTMENT: 'text-purple-400' };

        const actionLabels = { CREATE: 'Dibuat', UPDATE: 'Diubah', DELETE: 'Dihapus' };

        container.innerHTML = `
            <div class="bg-dark-800 border border-dark-700 rounded-2xl shadow-xl overflow-hidden">
                <!-- Header -->
                <div class="p-6 border-b border-dark-700 flex flex-col md:flex-row gap-6">
                    ${imgSection}
                    <div class="flex-1">
                        <div class="flex items-start justify-between">
                            <div>
                                <h2 class="text-2xl font-bold text-white">${escHtml(p.name)}</h2>
                                <p class="text-blue-400 font-mono text-sm mt-1">${p.sku}</p>
                            </div>
                            <button onclick="openForm('${p.id}')" class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center shadow-lg shadow-blue-500/20">
                                <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                Edit
                            </button>
                        </div>
                        <div class="flex flex-wrap gap-2 mt-3">
                            ${p.is_sold ? '<span class="bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-lg text-xs font-medium">✓ Dijual</span>' : ''}
                            ${p.is_purchased ? '<span class="bg-purple-500/10 text-purple-400 px-2.5 py-1 rounded-lg text-xs font-medium">✓ Dibeli</span>' : ''}
                            ${p.is_tracked ? '<span class="bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-lg text-xs font-medium">✓ Lacak Stok</span>' : ''}
                        </div>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                            <div><span class="text-gray-500 text-xs block">Kategori</span><span class="text-white">${escHtml(p.category_name || '-')}</span></div>
                            <div><span class="text-gray-500 text-xs block">Satuan</span><span class="text-white">${p.unit}</span></div>
                            ${p.is_purchased ? `<div><span class="text-gray-500 text-xs block">Harga Beli</span><span class="text-white">${P.formatRupiah(p.buy_price)}</span></div>` : ''}
                            ${p.is_sold ? `<div><span class="text-gray-500 text-xs block">Harga Jual</span><span class="text-emerald-400 font-semibold">${P.formatRupiah(p.sell_price)}</span></div>` : ''}
                        </div>
                    </div>
                </div>

                <!-- Info Grid -->
                <div class="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <!-- Akuntansi -->
                    <div class="bg-dark-900/50 rounded-xl p-4 border border-dark-700">
                        <h4 class="text-sm font-semibold text-gray-300 mb-3 flex items-center">
                            <svg class="w-4 h-4 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                            Pengaturan Akuntansi
                        </h4>
                        <div class="space-y-2 text-xs">
                            ${p.is_sold ? `<div class="flex justify-between"><span class="text-gray-500">Akun Penjualan</span><span class="text-white">${revAccount ? revAccount.code + ' — ' + revAccount.name : p.revenue_account_code || '-'}</span></div>` : ''}
                            ${p.is_purchased ? `<div class="flex justify-between"><span class="text-gray-500">Akun HPP</span><span class="text-white">${cogsAccount ? cogsAccount.code + ' — ' + cogsAccount.name : p.cogs_account_code || '-'}</span></div>` : ''}
                            ${p.is_tracked ? `<div class="flex justify-between"><span class="text-gray-500">Akun Persediaan</span><span class="text-white">${invAccount ? invAccount.code + ' — ' + invAccount.name : p.inventory_account_code || '-'}</span></div>` : ''}
                        </div>
                    </div>

                    <!-- Pajak -->
                    <div class="bg-dark-900/50 rounded-xl p-4 border border-dark-700">
                        <h4 class="text-sm font-semibold text-gray-300 mb-3 flex items-center">
                            <svg class="w-4 h-4 mr-2 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"></path></svg>
                            Pajak Default
                        </h4>
                        <div class="space-y-2 text-xs">
                            <div class="flex justify-between"><span class="text-gray-500">Pajak Penjualan</span><span class="text-white">${p.default_sell_tax || '-'}</span></div>
                            <div class="flex justify-between"><span class="text-gray-500">Pajak Pembelian</span><span class="text-white">${p.default_buy_tax || '-'}</span></div>
                        </div>
                    </div>

                    <!-- Inventory -->
                    ${p.is_tracked ? `
                    <div class="bg-dark-900/50 rounded-xl p-4 border border-dark-700">
                        <h4 class="text-sm font-semibold text-gray-300 mb-3 flex items-center">
                            <svg class="w-4 h-4 mr-2 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                            Inventory
                        </h4>
                        <div class="space-y-2 text-xs">
                            <div class="flex justify-between"><span class="text-gray-500">Stok Saat Ini</span><span class="font-bold ${p.current_stock <= p.min_stock ? 'text-rose-400' : 'text-emerald-400'}">${p.current_stock} ${p.unit}</span></div>
                            <div class="flex justify-between"><span class="text-gray-500">Stok Minimal</span><span class="text-white">${p.min_stock} ${p.unit}</span></div>
                            <div class="flex justify-between"><span class="text-gray-500">Metode</span><span class="text-white">${p.stock_method}</span></div>
                        </div>
                    </div>
                    ` : ''}
                </div>

                <!-- Harga Grosir -->
                ${p.wholesale_prices && p.wholesale_prices.length > 0 ? `
                <div class="px-6 pb-6">
                    <div class="bg-dark-900/50 rounded-xl p-4 border border-dark-700">
                        <h4 class="text-sm font-semibold text-gray-300 mb-3">Harga Grosir</h4>
                        <table class="w-full text-xs text-left text-gray-300">
                            <thead class="text-gray-500 uppercase"><tr><th class="py-2">Min Qty</th><th class="py-2">Harga</th><th class="py-2">Label</th></tr></thead>
                            <tbody>${p.wholesale_prices.map(wp => `<tr class="border-t border-dark-700"><td class="py-2">${wp.min_qty}</td><td class="py-2">${P.formatRupiah(wp.price)}</td><td class="py-2 text-gray-500">${escHtml(wp.label || '-')}</td></tr>`).join('')}</tbody>
                        </table>
                    </div>
                </div>
                ` : ''}

                <!-- Stock Ledger -->
                ${p.is_tracked ? `
                <div class="px-6 pb-6">
                    <div class="bg-dark-900/50 rounded-xl p-4 border border-dark-700">
                        <h4 class="text-sm font-semibold text-gray-300 mb-3 flex items-center">
                            <svg class="w-4 h-4 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                            Riwayat Pergerakan Stok
                        </h4>
                        ${ledger.length > 0 ? `
                        <div class="overflow-x-auto">
                            <table class="w-full text-xs text-left text-gray-300">
                                <thead class="text-gray-500 uppercase text-[10px]"><tr><th class="py-2">Tanggal</th><th class="py-2">Tipe</th><th class="py-2">Ref</th><th class="py-2 text-right">Qty</th><th class="py-2 text-right">Sebelum</th><th class="py-2 text-right">Sesudah</th><th class="py-2">Oleh</th></tr></thead>
                                <tbody>${ledger.slice().reverse().map(s => `
                                    <tr class="border-t border-dark-700">
                                        <td class="py-2 text-gray-500">${new Date(s.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                        <td class="py-2 ${typeColors[s.type] || 'text-white'}">${typeLabels[s.type] || s.type}</td>
                                        <td class="py-2">${s.reference_no || '-'}</td>
                                        <td class="py-2 text-right font-mono ${s.qty >= 0 ? 'text-emerald-400' : 'text-rose-400'}">${s.qty >= 0 ? '+' : ''}${s.qty}</td>
                                        <td class="py-2 text-right">${s.stock_before}</td>
                                        <td class="py-2 text-right font-medium">${s.stock_after}</td>
                                        <td class="py-2 text-gray-500">${s.created_by}</td>
                                    </tr>
                                `).join('')}</tbody>
                            </table>
                        </div>
                        ` : '<p class="text-gray-600 text-xs">Belum ada pergerakan stok tercatat.</p>'}
                    </div>
                </div>
                ` : ''}

                <!-- Audit Log -->
                <div class="px-6 pb-6">
                    <div class="bg-dark-900/50 rounded-xl p-4 border border-dark-700">
                        <h4 class="text-sm font-semibold text-gray-300 mb-3 flex items-center">
                            <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            Log Audit
                        </h4>
                        <div class="space-y-1 text-xs">
                            <div class="flex justify-between text-gray-500 border-b border-dark-700 pb-2">
                                <span>Dibuat oleh: <span class="text-white">${p.created_by || '-'}</span></span>
                                <span>${p.created_at ? new Date(p.created_at).toLocaleString('id-ID') : '-'}</span>
                            </div>
                            <div class="flex justify-between text-gray-500 border-b border-dark-700 pb-2">
                                <span>Diubah terakhir: <span class="text-white">${p.updated_by || '-'}</span></span>
                                <span>${p.updated_at ? new Date(p.updated_at).toLocaleString('id-ID') : '-'}</span>
                            </div>
                            ${auditLog.length > 0 ? `
                            <div class="mt-3 max-h-40 overflow-y-auto space-y-1">
                                ${auditLog.slice().reverse().map(log => `
                                    <div class="flex items-center gap-2 text-[11px] py-1 text-gray-500">
                                        <span class="text-gray-600 w-32 flex-shrink-0">${new Date(log.changed_at).toLocaleString('id-ID')}</span>
                                        <span class="font-medium ${log.action === 'CREATE' ? 'text-emerald-400' : log.action === 'DELETE' ? 'text-rose-400' : 'text-blue-400'}">${actionLabels[log.action] || log.action}</span>
                                        ${log.field_changed ? `<span class="text-gray-500">| ${log.field_changed}: "${log.old_value || ''}" → "${log.new_value || ''}"</span>` : ''}
                                        <span class="text-gray-600 ml-auto">${log.changed_by}</span>
                                    </div>
                                `).join('')}
                            </div>
                            ` : ''}
                        </div>
                    </div>
                </div>

                <!-- Deskripsi -->
                ${p.description ? `
                <div class="px-6 pb-6">
                    <div class="bg-dark-900/50 rounded-xl p-4 border border-dark-700">
                        <h4 class="text-sm font-semibold text-gray-300 mb-2">Deskripsi</h4>
                        <p class="text-gray-400 text-sm whitespace-pre-wrap">${escHtml(p.description)}</p>
                    </div>
                </div>
                ` : ''}
            </div>
        `;

        showView('detail');
    };

    // ─── HELPERS ─────────────────────────────────────────────

    function escHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ─── INIT ───────────────────────────────────────────────

    document.addEventListener('DOMContentLoaded', function () {
        renderCategoryFilter();
        renderProductList();

        // Search/filter events
        const searchInput = document.getElementById('fSearchProduct');
        if (searchInput) searchInput.addEventListener('input', renderProductList);

        const catFilter = document.getElementById('fCategoryFilter');
        if (catFilter) catFilter.addEventListener('change', renderProductList);
    });

})();
