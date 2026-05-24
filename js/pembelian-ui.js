// ========== HELPERS ==========
var formatRp = formatRp || ((num) => 'Rp ' + Math.round(num || 0).toLocaleString('id-ID'));
var formatDate = formatDate || ((d) => {
    if (!d) return '-';
    const dt = new Date(d);
    return dt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
});


// ========== VIEW NAVIGATION ==========
function toggleView(view) {
    const listEl = document.getElementById('listView');
    const formEl = document.getElementById('formView');
    const detailEl = document.getElementById('detailView');
    const payEl = document.getElementById('payView');

    if (listEl) listEl.classList.add('hidden');
    if (formEl) formEl.classList.add('hidden');
    if (detailEl) detailEl.classList.add('hidden');
    if (payEl) payEl.classList.add('hidden');

    if (view === 'form') {
        if (formEl) {
            formEl.classList.remove('hidden');
            formEl.classList.add('animate-fade-in-up');
        }
        initForm();
    } else if (view === 'detail') {
        if (detailEl) {
            detailEl.classList.remove('hidden');
            detailEl.classList.add('animate-fade-in-up');
        }
    } else if (view === 'pay') {
        if (payEl) {
            payEl.classList.remove('hidden');
            payEl.classList.add('animate-fade-in-up');
        }
    } else {
        if (listEl) listEl.classList.remove('hidden');
        renderTable();
    }
}

// ========== STATUS BADGE ==========
function getBadge(status) {
    const m = {
        lunas: ['Lunas','bg-emerald-500/10 text-emerald-400 border-emerald-500/20'],
        belum: ['Belum Dibayar','bg-orange-500/10 text-orange-400 border-orange-500/20'],
        sebagian: ['Sebagian','bg-sky-500/10 text-sky-400 border-sky-500/20'],
        jatuh_tempo: ['Jatuh Tempo','bg-rose-500/10 text-rose-400 border-rose-500/20'],
        void: ['Void','bg-gray-500/10 text-gray-400 border-gray-500/20'],
    };
    const [label, cls] = m[status] || ['?','bg-gray-500/10 text-gray-400'];
    return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls} border">${label}</span>`;
}

// ========== LIST VIEW ==========
function renderTable() {
    if (!window.VittaPurchase) return;
    let purchases = window.VittaPurchase.refreshPurchaseStatuses();
    
    const tbody = document.getElementById('purchaseTableBody');
    if (!purchases || purchases.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-8 text-center text-gray-500">Belum ada data pembelian.</td></tr>';
        return;
    }
    
    tbody.innerHTML = purchases.map(pur => `
    <tr class="hover:bg-dark-700/30 transition-colors">
        <td class="px-6 py-4 font-medium text-white">${pur.id}</td>
        <td class="px-6 py-4">${pur.supplierName}</td>
        <td class="px-6 py-4">${formatDate(pur.date)}</td>
        <td class="px-6 py-4 text-right">${formatRp(pur.grandTotal)}</td>
        <td class="px-6 py-4 text-right ${pur.sisaHutang > 0 ? 'text-orange-400 font-medium' : 'text-gray-500'}">
            ${pur.sisaHutang === 0 ? 'Rp 0' : formatRp(pur.sisaHutang)}
        </td>
        <td class="px-6 py-4 text-center">${getBadge(pur.status)}</td>
        <td class="px-6 py-4 text-center">
            <button onclick="viewPurchase('${pur.id}')" class="text-blue-400 hover:text-blue-300">Lihat</button>
        </td>
    </tr>`).join('');
}

// ========== FORM VIEW ==========
function initForm() {
    const cs = document.getElementById('supplierSelect');
    
    // --- Sinkronisasi data kontak dari Master Kontak ---
    let suppliersList = [];
    const scopedKey = window.getScopedKey ? window.getScopedKey('vitta_contacts') : 'vitta_contacts';
    const localContacts = localStorage.getItem(scopedKey);
    if(localContacts) {
        try {
            const parsed = JSON.parse(localContacts);
            const valid = parsed.filter(c => c.tipe === 'Supplier' || c.tipe === 'Keduanya');
            if(valid.length > 0) {
                suppliersList = valid.map(c => ({ id: c.id, name: (c.sapaan ? c.sapaan + ' ' : '') + c.nama }));
            }
        } catch(e) {}
    }

    cs.innerHTML = '<option value="">-- Pilih Pemasok --</option>' + suppliersList.map(c => `<option value="${c.id}" data-name="${c.name}">${c.name}</option>`).join('');
    
    // Sinkronisasi Produk dari master produk
    let productsList = [];
    if (window.VittaProduk) {
        productsList = window.VittaProduk.getActiveProducts().filter(p => p.is_purchased || p.is_tracked);
    }
    window._PUR_PRODUCTS = productsList; // cache
    
    const tbody = document.getElementById('itemsBody');
    tbody.innerHTML = `
        <tr class="item-row group">
            <td class="py-2 pr-2">
                <select class="invoice-input product-select focus:border-rose-500 focus:ring-rose-500" onchange="calculateTotal()">
                    <option value="" data-price="0">-- Pilih Produk --</option>
                    ${productsList.map(p => `<option value="${p.id}" data-price="${p.buy_price}">${p.name}</option>`).join('')}
                </select>
            </td>
            <td class="py-2 pr-2"><input type="number" class="invoice-input item-qty focus:border-rose-500 focus:ring-rose-500" value="1" min="1" oninput="calculateTotal()"></td>
            <td class="py-2 pr-2"><input type="number" class="invoice-input item-price text-right focus:border-rose-500 focus:ring-rose-500" value="0" oninput="calculateTotal()"></td>
            <td class="py-2 pr-2"><input type="number" class="invoice-input item-disc text-right focus:border-rose-500 focus:ring-rose-500" value="0" min="0" max="100" oninput="calculateTotal()"></td>
            <td class="py-2 pr-2 text-center">
                <input type="checkbox" class="item-tax h-4 w-4 rounded border-gray-300 text-rose-600 bg-dark-900 focus:ring-rose-500" onchange="calculateTotal()">
                <span class="text-xs text-gray-500 block">PPN 11%</span>
            </td>
            <td class="py-2 pr-2 text-right">
                <span class="item-total text-white font-medium">Rp 0</span>
            </td>
            <td class="py-2 text-right">
                <button onclick="removeRow(this)" class="text-dark-600 hover:text-rose-500 transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            </td>
        </tr>
    `;

    document.getElementById('purchaseDate').value = today();
}

function addRow() {
    const productsList = window._PUR_PRODUCTS || [];
    const tbody = document.getElementById('itemsBody');
    const newRow = document.createElement('tr');
    newRow.className = 'item-row group';
    newRow.innerHTML = `
            <td class="py-2 pr-2">
                <select class="invoice-input product-select focus:border-rose-500 focus:ring-rose-500" onchange="calculateTotal()">
                    <option value="" data-price="0">-- Pilih Produk --</option>
                    ${productsList.map(p => `<option value="${p.id}" data-price="${p.buy_price}">${p.name}</option>`).join('')}
                </select>
            </td>
            <td class="py-2 pr-2"><input type="number" class="invoice-input item-qty focus:border-rose-500 focus:ring-rose-500" value="1" min="1" oninput="calculateTotal()"></td>
            <td class="py-2 pr-2"><input type="number" class="invoice-input item-price text-right focus:border-rose-500 focus:ring-rose-500" value="0" oninput="calculateTotal()"></td>
            <td class="py-2 pr-2"><input type="number" class="invoice-input item-disc text-right focus:border-rose-500 focus:ring-rose-500" value="0" min="0" max="100" oninput="calculateTotal()"></td>
            <td class="py-2 pr-2 text-center">
                <input type="checkbox" class="item-tax h-4 w-4 rounded border-gray-300 text-rose-600 bg-dark-900 focus:ring-rose-500" onchange="calculateTotal()">
                <span class="text-xs text-gray-500 block">PPN 11%</span>
            </td>
            <td class="py-2 pr-2 text-right">
                <span class="item-total text-white font-medium">Rp 0</span>
            </td>
            <td class="py-2 text-right">
                <button onclick="removeRow(this)" class="text-dark-600 hover:text-rose-500 transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            </td>
    `;
    tbody.appendChild(newRow);
}

function removeRow(btn) {
    const tbody = document.getElementById('itemsBody');
    if (tbody.children.length > 1) {
        btn.closest('tr').remove();
        calculateTotal();
    }
}

// Auto-fill price when product is selected
document.getElementById('itemsBody')?.addEventListener('change', function(e) {
    if (e.target && e.target.classList.contains('product-select')) {
        const selectedOption = e.target.options[e.target.selectedIndex];
        const price = selectedOption.getAttribute('data-price');
        const row = e.target.closest('tr');
        row.querySelector('.item-price').value = price;
        calculateTotal();
    }
});

function calculateTotal() {
    const rows = document.querySelectorAll('.item-row');
    let subtotal = 0;
    let totalTax = 0;

    rows.forEach(row => {
        const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
        const price = parseFloat(row.querySelector('.item-price').value) || 0;
        const discPct = parseFloat(row.querySelector('.item-disc').value) || 0;
        const isTaxed = row.querySelector('.item-tax').checked;

        const gross = qty * price;
        const discAmt = gross * (discPct / 100);
        const net = gross - discAmt;
        
        let taxAmt = 0;
        if (isTaxed) {
            taxAmt = net * 0.11; // PPN 11%
        }

        row.querySelector('.item-total').innerText = formatRp(net);
        
        subtotal += net;
        totalTax += taxAmt;
    });

    const globalDisc = parseFloat(document.getElementById('globalDisc').value) || 0;
    const dp = parseFloat(document.getElementById('downPayment').value) || 0;

    const grandTotal = subtotal - globalDisc + totalTax;
    const sisa = grandTotal - dp;

    // Update DOM
    document.getElementById('lblSubtotal').innerText = formatRp(subtotal);
    document.getElementById('lblTax').innerText = formatRp(totalTax);
    document.getElementById('lblGrandTotal').innerText = formatRp(grandTotal);
    document.getElementById('lblSisaHutang').innerText = formatRp(sisa);
}

function savePurchase() {
    const supplierSel = document.getElementById('supplierSelect');
    const supplierId = supplierSel.value;
    const supplierName = supplierSel.options[supplierSel.selectedIndex]?.text;
    const date = document.getElementById('purchaseDate').value;
    
    if(!supplierId || !date) {
        alert('Pilih pemasok dan tanggal terlebih dahulu.');
        return;
    }

    const rows = document.querySelectorAll('.item-row');
    const items = [];
    rows.forEach(row => {
        const sel = row.querySelector('.product-select');
        const productId = sel.value;
        const productName = sel.options[sel.selectedIndex]?.text;
        const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
        const price = parseFloat(row.querySelector('.item-price').value) || 0;
        if (productId && qty > 0) {
            items.push({ productId, productName, qty, price });
        }
    });

    if (items.length === 0) {
        alert('Tambahkan minimal 1 produk.');
        return;
    }

    const subtotalStr = document.getElementById('lblSubtotal').innerText.replace(/[^\d]/g, '');
    const taxStr = document.getElementById('lblTax').innerText.replace(/[^\d]/g, '');
    const grandTotalStr = document.getElementById('lblGrandTotal').innerText.replace(/[^\d]/g, '');
    
    const purData = {
        supplierId,
        supplierName,
        date,
        items,
        subtotal: parseInt(subtotalStr) || 0,
        totalPPN: parseInt(taxStr) || 0,
        potongan: parseFloat(document.getElementById('globalDisc').value) || 0,
        dp: parseFloat(document.getElementById('downPayment').value) || 0,
        dpAccount: '', // Default kas/bank bisa di set ke Kas Kecil (1-10001) kalau butuh
        grandTotal: parseInt(grandTotalStr) || 0
    };
    if (purData.dp > 0) {
        purData.dpAccount = '1-10001'; // Default ke kas kecil utk DP.
    }

    try {
        window.VittaPurchase.savePurchase(purData);
        alert('Pembelian berhasil disimpan!');
        toggleView('list');
    } catch (e) {
        alert(e.message);
    }
}

// ========== DETAIL VIEW & PAYMENT ==========
let currentPurId = null;

// Helper to log purchase audit trails
function addPurAudit(purId, detail) {
    const key = window.getScopedKey ? window.getScopedKey('vitta_pur_audit_log') : 'vitta_pur_audit_log';
    const logs = JSON.parse(localStorage.getItem(key)) || [];
    logs.unshift({
        id: 'LOG-PUR-' + Date.now(),
        purId,
        detail,
        timestamp: new Date().toISOString()
    });
    localStorage.setItem(key, JSON.stringify(logs.slice(0, 100)));
}

function viewPurchase(id) {
    if (!window.VittaPurchase) return;
    const purchases = window.VittaPurchase.getPurchases();
    const pur = purchases.find(p => p.id === id);
    if (!pur) return;

    currentPurId = id;
    addPurAudit(id, `Purchase Order ${id} dilihat.`);

    // Item Rows
    const itemRows = (pur.items || []).map((it, i) => `
        <tr class="border-b border-dark-700/50">
            <td class="py-2.5 pr-2 text-white">${i + 1}</td>
            <td class="py-2.5 pr-2 text-white font-medium">${it.productName}</td>
            <td class="py-2.5 pr-2 text-center text-white">${it.qty}</td>
            <td class="py-2.5 pr-2 text-center text-gray-400">Pcs</td>
            <td class="py-2.5 pr-2 text-right text-white">${formatRp(it.price)}</td>
            <td class="py-2.5 pr-2 text-right text-gray-500">-</td>
            <td class="py-2.5 text-right font-medium text-white">${formatRp(it.qty * it.price)}</td>
        </tr>
    `).join('');

    // Payment Rows
    const payRows = (pur.payments || []).map(p => `
        <tr class="border-b border-dark-700/50">
            <td class="py-2.5 pr-2 text-white font-medium">${p.id}</td>
            <td class="py-2.5 pr-2 text-gray-300">${formatDate(p.date)}</td>
            <td class="py-2.5 pr-2 text-gray-300">${p.bankName}</td>
            <td class="py-2.5 pr-2 text-right text-emerald-400 font-semibold">${formatRp(p.amount)}</td>
            <td class="py-2.5 pr-2 text-right text-gray-500">-</td>
            <td class="py-2.5 pr-2 text-gray-400">${p.ref || '-'}</td>
            <td class="py-2.5 text-center">
                <button onclick="printPaymentReceipt('${pur.id}','${p.id}')" class="text-blue-400 hover:text-blue-300 text-xs flex items-center justify-center gap-1 mx-auto">🖨️ Cetak</button>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="7" class="py-4 text-center text-gray-500 text-sm">Belum ada pembayaran.</td></tr>';

    // Journals matching PO or payments
    const allJournals = window.getJournals ? window.getJournals() : (JSON.parse(localStorage.getItem('vitta_journals')) || []);
    const journals = allJournals.filter(j => j.refId === id || (pur.payments || []).some(p => p.id === j.refId));
    const jrnRows = journals.map(j => {
        const lines = j.lines.map(l => `
            <div class="flex justify-between text-xs py-1 ${l.debit > 0 ? '' : 'pl-6'}">
                <span class="${l.debit > 0 ? 'text-gray-300' : 'text-gray-400'}">${l.debit > 0 ? '' : '— '}${l.accountName || l.account}</span>
                <span class="font-mono">${l.debit > 0 ? formatRp(l.debit) : ''} ${l.credit > 0 ? formatRp(l.credit) : ''}</span>
            </div>
        `).join('');
        return `
            <div class="bg-dark-900/50 p-4 rounded-xl border border-dark-700 space-y-2">
                <div class="flex justify-between border-b border-dark-700/50 pb-1.5 mb-1.5">
                    <span class="text-xs font-bold text-blue-400">${j.memo}</span>
                    <span class="text-xs text-gray-500">${formatDate(j.date)}</span>
                </div>
                ${lines}
            </div>
        `;
    }).join('') || '<p class="text-gray-500 text-sm">Tidak ada jurnal otomatis yang tercatat.</p>';

    // Audit logs for PO
    const key = window.getScopedKey ? window.getScopedKey('vitta_pur_audit_log') : 'vitta_pur_audit_log';
    const auditLogs = (JSON.parse(localStorage.getItem(key)) || []).filter(l => l.purId === id);
    const logRows = auditLogs.map(l => `
        <div class="flex gap-2 text-xs py-1.5 border-b border-dark-700/30">
            <span class="text-gray-500 whitespace-nowrap">${new Date(l.timestamp).toLocaleString('id-ID')}</span>
            <span class="text-gray-300">${l.detail}</span>
        </div>
    `).join('');

    const canPay = pur.status !== 'lunas' && pur.status !== 'void' && pur.sisaHutang > 0;
    const canAction = pur.status !== 'void';

    document.getElementById('detailContent').innerHTML = `
    <div class="bg-dark-800 border border-dark-700 rounded-2xl shadow-xl overflow-hidden animate-fade-in-up">
        <!-- Header with Action Bar -->
        <div class="p-6 border-b border-dark-700">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <div>
                    <h2 class="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                        <span>${pur.id}</span>
                        ${getBadge(pur.status)}
                    </h2>
                    <p class="text-sm text-gray-400 mt-1">Pemasok: <strong class="text-white">${pur.supplierName}</strong></p>
                </div>
                <div class="flex flex-wrap gap-2">
                    <button onclick="toggleView('list')" class="bg-dark-700 hover:bg-dark-600 text-gray-300 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>
                        Kembali ke Daftar
                    </button>
                    ${canPay ? `<button onclick="openPayment('${pur.id}')" class="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all hover:shadow-emerald-600/40">💰 Catat Pelunasan</button>` : ''}
                    
                    <!-- Share Dropdown -->
                    <div class="relative" id="shareDropdown">
                        <button onclick="toggleDropdown('shareMenu')" class="bg-dark-700 hover:bg-dark-600 text-gray-300 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors">
                            📤 Bagikan <svg class="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                        </button>
                        <div id="shareMenu" class="hidden absolute top-full left-0 mt-1 bg-dark-700 border border-dark-600 rounded-xl shadow-xl z-20 min-w-[180px]">
                            <button onclick="copyPurchaseLink('${pur.id}');closeDropdowns()" class="w-full text-left px-4 py-2.5 text-xs text-gray-300 hover:bg-dark-600 rounded-t-xl">📋 Salin Teks PO</button>
                            <button onclick="sendToWA('${pur.id}');closeDropdowns()" class="w-full text-left px-4 py-2.5 text-xs text-gray-300 hover:bg-dark-600 rounded-b-xl">💬 Kirim ke WhatsApp</button>
                        </div>
                    </div>

                    <!-- Print Dropdown -->
                    <div class="relative" id="printDropdown">
                        <button onclick="toggleDropdown('printMenu')" class="bg-dark-700 hover:bg-dark-600 text-gray-300 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors">
                            🖨️ Cetak <svg class="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                        </button>
                        <div id="printMenu" class="hidden absolute top-full left-0 mt-1 bg-dark-700 border border-dark-600 rounded-xl shadow-xl z-20 min-w-[180px]">
                            <button onclick="printPurchasePDF('${pur.id}');closeDropdowns()" class="w-full text-left px-4 py-2.5 text-xs text-gray-300 hover:bg-dark-600 rounded-t-xl">📄 Cetak PO (PDF)</button>
                            <button onclick="alert('Fitur tanda terima gudang segera hadir!');closeDropdowns()" class="w-full text-left px-4 py-2.5 text-xs text-gray-300 hover:bg-dark-600 rounded-b-xl">📦 Tanda Terima Barang</button>
                        </div>
                    </div>

                    <!-- Action Dropdown -->
                    ${canAction ? `
                    <div class="relative" id="actionDropdown">
                        <button onclick="toggleDropdown('actionMenu')" class="bg-dark-700 hover:bg-dark-600 text-gray-300 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors">
                            ⚙️ Tindakan <svg class="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                        </button>
                        <div id="actionMenu" class="hidden absolute top-full right-0 mt-1 bg-dark-700 border border-dark-600 rounded-xl shadow-xl z-20 min-w-[160px]">
                            <button onclick="voidPurchase('${pur.id}');closeDropdowns()" class="w-full text-left px-4 py-2.5 text-xs text-gray-300 hover:bg-dark-600 rounded-t-xl">🚫 Void PO</button>
                            <button onclick="deletePurchase('${pur.id}');closeDropdowns()" class="w-full text-left px-4 py-2.5 text-xs text-rose-400 hover:bg-dark-600 rounded-b-xl font-medium">🗑️ Hapus PO</button>
                        </div>
                    </div>` : ''}
                </div>
            </div>
        </div>

        <!-- Info Grid -->
        <div class="p-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm border-b border-dark-700 bg-dark-900/30">
            <div><span class="text-gray-500 text-xs block mb-0.5">Tanggal Order</span><span class="text-white font-medium">${formatDate(pur.date)}</span></div>
            <div><span class="text-gray-500 text-xs block mb-0.5">Jatuh Tempo</span><span class="text-white font-medium">${formatDate(new Date(new Date(pur.date).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])}</span></div>
            <div><span class="text-gray-500 text-xs block mb-0.5">Termin Pembayaran</span><span class="text-white font-medium">Net 30 Hari</span></div>
            <div><span class="text-gray-500 text-xs block mb-0.5">Dibuat Oleh</span><span class="text-white font-medium">${pur.createdBy || 'Admin'}</span></div>
        </div>

        <!-- Product Table -->
        <div class="p-6 border-b border-dark-700">
            <h3 class="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">Detail Item Produk</h3>
            <div class="overflow-x-auto">
                <table class="w-full text-sm text-gray-300">
                    <thead class="text-xs text-gray-400 uppercase border-b border-dark-700">
                        <tr>
                            <th class="py-2 pr-2 w-8 text-left">#</th>
                            <th class="py-2 pr-2 text-left">Nama Produk</th>
                            <th class="py-2 pr-2 text-center">Kuantitas</th>
                            <th class="py-2 pr-2 text-center">Satuan</th>
                            <th class="py-2 pr-2 text-right">Harga Beli</th>
                            <th class="py-2 pr-2 text-right">Diskon</th>
                            <th class="py-2 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-dark-700/50">
                        ${itemRows}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Totals Section -->
        <div class="p-6 border-b border-dark-700 flex justify-end">
            <div class="w-full md:w-80 space-y-2 text-sm">
                <div class="flex justify-between text-gray-400"><span>Subtotal</span><span class="text-white font-medium">${formatRp(pur.subtotal)}</span></div>
                ${pur.potongan > 0 ? `<div class="flex justify-between text-gray-400"><span>Potongan Potongan</span><span class="text-rose-400">-${formatRp(pur.potongan)}</span></div>` : ''}
                ${pur.totalPPN > 0 ? `<div class="flex justify-between text-gray-400"><span>PPN Masukan (11%)</span><span class="text-white font-medium">${formatRp(pur.totalPPN)}</span></div>` : ''}
                <div class="flex justify-between border-t border-dark-700 pt-2 mt-1"><span class="text-white font-bold">Total Pembelian</span><span class="text-blue-400 font-bold text-lg">${formatRp(pur.grandTotal)}</span></div>
                ${pur.dp > 0 ? `<div class="flex justify-between text-gray-400"><span>Uang Muka (DP)</span><span class="text-emerald-400">${formatRp(pur.dp)}</span></div>` : ''}
                <div class="flex justify-between text-gray-400"><span>Total Dibayar</span><span class="text-emerald-400 font-semibold">${formatRp(pur.totalPaid)}</span></div>
                <div class="flex justify-between bg-orange-500/10 p-3 rounded-xl border border-orange-500/20 mt-2 font-medium">
                    <span class="text-orange-300">Sisa Hutang Usaha</span>
                    <span class="text-orange-400 font-bold text-lg">${formatRp(pur.sisaHutang)}</span>
                </div>
            </div>
        </div>

        <!-- Payment History -->
        <div class="p-6 border-b border-dark-700">
            <h3 class="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">Riwayat Pelunasan Hutang</h3>
            <div class="overflow-x-auto">
                <table class="w-full text-sm text-gray-300">
                    <thead class="text-xs text-gray-400 uppercase border-b border-dark-700">
                        <tr>
                            <th class="py-2 pr-2 text-left">No. Kuitansi</th>
                            <th class="py-2 pr-2 text-left">Tanggal</th>
                            <th class="py-2 pr-2 text-left">Sumber Akun</th>
                            <th class="py-2 pr-2 text-right">Jumlah Pelunasan</th>
                            <th class="py-2 pr-2 text-right">Potongan</th>
                            <th class="py-2 pr-2 text-left">Referensi</th>
                            <th class="py-2 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-dark-700/50">
                        ${payRows}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Automatic Journal Entries -->
        <div class="p-6 border-b border-dark-700 bg-dark-900/10">
            <h3 class="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">Jurnal Transaksi (Double Entry)</h3>
            <div class="grid grid-cols-1 gap-3">
                ${jrnRows}
            </div>
        </div>

        <!-- Audit Trail Log -->
        <div class="p-6 bg-dark-800">
            <h3 class="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">Jejak Audit PO</h3>
            <div class="max-h-36 overflow-y-auto space-y-1 pr-2">
                ${logRows || '<p class="text-gray-600 text-xs">Belum ada aktivitas tercatat.</p>'}
            </div>
        </div>
    </div>`;

    toggleView('detail');
}

// Dropdown support
function toggleDropdown(menuId) {
    closeDropdowns(menuId);
    const el = document.getElementById(menuId);
    if (el) el.classList.toggle('hidden');
}

function closeDropdowns(except) {
    ['shareMenu', 'printMenu', 'actionMenu'].forEach(id => {
        if (id !== except) {
            const el = document.getElementById(id);
            if (el) el.classList.add('hidden');
        }
    });
}

// Click outside closes dropdowns
document.addEventListener('click', function (e) {
    if (!e.target.closest('#shareDropdown') && !e.target.closest('#printDropdown') && !e.target.closest('#actionDropdown')) {
        closeDropdowns();
    }
});

// Dropdown actions for purchasing

function printPurchasePDF(id) {
    const purchases = window.VittaPurchase.getPurchases();
    const pur = purchases.find(p => p.id === id);
    if (!pur) return;

    const w = window.open('', '_blank');
    const itemsHtml = pur.items.map((it, i) => `
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${i + 1}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${it.productName}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${it.qty}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatRp(it.price)}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right; font-weight: bold;">${formatRp(it.qty * it.price)}</td>
        </tr>
    `).join('');

    w.document.write(`
        <html>
        <head>
            <title>Purchase Order ${pur.id}</title>
            <style>
                body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #333; margin: 40px; }
                .header { display: flex; justify-content: space-between; border-bottom: 3px solid #f43f5e; padding-bottom: 20px; }
                .logo { font-size: 28px; font-weight: bold; color: #f43f5e; }
                .title { font-size: 24px; font-weight: bold; margin-top: 30px; text-align: center; text-transform: uppercase; letter-spacing: 1px; }
                .info { display: flex; justify-content: space-between; margin-top: 30px; line-height: 1.6; }
                table { width: 100%; border-collapse: collapse; margin-top: 40px; }
                th { background-color: #f43f5e; color: white; padding: 12px 8px; text-align: left; }
                .totals { float: right; width: 300px; margin-top: 40px; line-height: 2; font-size: 14px; }
                .totals .row { display: flex; justify-content: space-between; }
                .totals .grand { font-size: 18px; font-weight: bold; color: #f43f5e; border-top: 2px solid #ddd; padding-top: 5px; }
                .footer { margin-top: 100px; font-size: 12px; text-align: center; color: #777; border-top: 1px solid #eee; padding-top: 20px; }
            </style>
        </head>
        <body onload="window.print()">
            <div class="header">
                <div><div class="logo">VITTA ERP</div><div>Tata Kelola One — Modul Pembelian</div></div>
                <div style="text-align: right;"><strong>PURCHASE ORDER</strong><br>No: ${pur.id}</div>
            </div>
            <div class="title">Surat Pemesanan Pembelian</div>
            <div class="info">
                <div><strong>Kepada Pemasok (Supplier):</strong><br>${pur.supplierName}<br>Kemitraan Terdaftar ERP</div>
                <div style="text-align: right;"><strong>Tanggal PO:</strong> ${formatDate(pur.date)}<br><strong>Termin:</strong> Net 30 Hari<br><strong>Status:</strong> ${pur.status.toUpperCase()}</div>
            </div>
            <table>
                <thead>
                    <tr><th style="width: 5%">#</th><th>Nama Barang</th><th style="text-align: center; width: 15%">Qty</th><th style="text-align: right; width: 20%">Harga Beli</th><th style="text-align: right; width: 25%">Jumlah</th></tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>
            <div class="totals">
                <div class="row"><span>Subtotal</span><span>${formatRp(pur.subtotal)}</span></div>
                ${pur.totalPPN > 0 ? `<div class="row"><span>PPN (11%)</span><span>${formatRp(pur.totalPPN)}</span></div>` : ''}
                <div class="row grand"><span>Total Pemesanan</span><span>${formatRp(pur.grandTotal)}</span></div>
                <div class="row" style="color: #10b981;"><span>Total Dibayar</span><span>${formatRp(pur.totalPaid)}</span></div>
                <div class="row" style="color: #f59e0b; font-weight: bold;"><span>Sisa Hutang</span><span>${formatRp(pur.sisaHutang)}</span></div>
            </div>
            <div style="clear: both;"></div>
            <div class="footer">Terima kasih atas kerja sama bisnis Anda.<br>&copy; 2026 Vitta ERP - All Rights Reserved.</div>
        </body>
        </html>
    `);
    w.document.close();
}

function printPaymentReceipt(purId, payId) {
    const purchases = window.VittaPurchase.getPurchases();
    const pur = purchases.find(p => p.id === purId);
    if (!pur) return;
    const pay = pur.payments.find(p => p.id === payId);
    if (!pay) return;

    const w = window.open('', '_blank');
    w.document.write(`
        <html>
        <head>
            <title>Kuitansi Pelunasan Hutang - ${pay.id}</title>
            <style>
                body { font-family: Arial, sans-serif; color: #333; margin: 50px; line-height: 1.6; }
                .receipt-box { border: 2px solid #ddd; padding: 30px; border-radius: 12px; max-width: 600px; margin: 0 auto; }
                .header { text-align: center; border-bottom: 2px dashed #ddd; padding-bottom: 15px; margin-bottom: 20px; }
                .title { font-size: 20px; font-weight: bold; color: #10b981; text-transform: uppercase; }
                .amount-box { background: #e6f4ea; border: 1px solid #10b981; color: #10b981; font-size: 24px; font-weight: bold; text-align: center; padding: 10px; margin: 20px 0; border-radius: 8px; }
                .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; font-size: 14px; }
                .footer { text-align: center; margin-top: 30px; font-size: 11px; color: #999; }
            </style>
        </head>
        <body onload="window.print()">
            <div class="receipt-box">
                <div class="header">
                    <div class="title">Kuitansi Pengeluaran Kas (Pelunasan Hutang)</div>
                    <div style="font-size: 12px; color: #666; margin-top: 5px;">No. Kuitansi: ${pay.id}</div>
                </div>
                <div class="row"><span>Tanggal Bayar</span><strong>${formatDate(pay.date)}</strong></div>
                <div class="row"><span>Dibayarkan Kepada</span><strong>${pur.supplierName}</strong></div>
                <div class="row"><span>Untuk Pembelian PO</span><strong>${pur.id}</strong></div>
                <div class="row"><span>Dibayar dari Akun</span><strong>${pay.bankName}</strong></div>
                <div class="row"><span>Referensi Pembayaran</span><strong>${pay.ref || '-'}</strong></div>
                
                <div class="amount-box">
                    ${formatRp(pay.amount)}
                </div>
                
                <div class="row" style="border:none;"><span>Sisa Hutang Sekarang</span><strong style="color:#f59e0b;">${formatRp(pur.sisaHutang)}</strong></div>
                
                <div class="footer">&copy; 2026 Vitta ERP - Bukti Transaksi Resmi Terkomputerisasi.</div>
            </div>
        </body>
        </html>
    `);
    w.document.close();
}

function copyPurchaseLink(id) {
    const purchases = window.VittaPurchase.getPurchases();
    const pur = purchases.find(p => p.id === id);
    if (!pur) return;
    const txt = `PURCHASE ORDER VITTA ERP\n\nNo PO: ${pur.id}\nPemasok: ${pur.supplierName}\nTanggal: ${formatDate(pur.date)}\nTotal: ${formatRp(pur.grandTotal)}\nSisa Hutang: ${formatRp(pur.sisaHutang)}\nStatus: ${pur.status.toUpperCase()}\n\nHarap diproses secepatnya. Terima kasih.`;
    navigator.clipboard.writeText(txt).then(() => {
        alert('Teks Ringkasan Purchase Order berhasil disalin ke clipboard!');
    });
}

function sendToWA(id) {
    const purchases = window.VittaPurchase.getPurchases();
    const pur = purchases.find(p => p.id === id);
    if (!pur) return;
    const txt = encodeURIComponent(`Halo, berikut detail Purchase Order kami:\n\nNo PO: ${pur.id}\nPemasok: ${pur.supplierName}\nTanggal: ${formatDate(pur.date)}\nTotal: ${formatRp(pur.grandTotal)}\nSisa Hutang: ${formatRp(pur.sisaHutang)}\nStatus: ${pur.status.toUpperCase()}\n\nMohon dicek kembali. Terima kasih.`);
    window.open(`https://api.whatsapp.com/send?text=${txt}`, '_blank');
}

function voidPurchase(id) {
    if (!confirm('Apakah Anda yakin ingin membatalkan (void) Purchase Order ini? Jurnal akuntansi terkait akan dibatalkan otomatis.')) return;
    window.VittaPurchase.voidPurchase(id);
    addPurAudit(id, `Purchase Order di-void.`);
    alert('Purchase Order berhasil dibatalkan (void)!');
    viewPurchase(id);
}

function deletePurchase(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus permanen Purchase Order ini? Tindakan ini menghapus seluruh pembayaran dan mutasi persediaan terkait.')) return;
    
    // Hapus dari localStorage
    const key = window.getScopedKey ? window.getScopedKey('vitta_purchases') : 'vitta_purchases';
    const purchases = JSON.parse(localStorage.getItem(key)) || [];
    const filtered = purchases.filter(p => p.id !== id);
    localStorage.setItem(key, JSON.stringify(filtered));

    // Void Jurnal terkait jika ada
    if (window.voidJournal && window.getJournals) {
        const journals = window.getJournals();
        journals.forEach(j => {
            if (j.refId === id && j.status !== 'void') {
                window.voidJournal(j.id, "Penghapusan Pembelian");
            }
        });
    }

    alert('Purchase Order berhasil dihapus!');
    toggleView('list');
}

// Payment Checkout Page
function openPayment(purId) {
    window._payPurId = purId;
    const purchases = window.VittaPurchase.getPurchases();
    const pur = purchases.find(p => p.id === purId);
    if (!pur) return;

    // Load Kas & Bank accounts from COA
    let bankAccounts = [{ code: '1-10001', name: 'Kas Kecil' }, { code: '1-10003', name: 'Rekening Mandiri' }];
    if (window.VittaCOA) {
        bankAccounts = window.VittaCOA.getAccounts().filter(a => a.category === 'Kas & Bank' && a.is_active);
    }
    const bankOpts = bankAccounts.map(b => `<option value="${b.code}">${b.name} (${b.code})</option>`).join('');

    document.getElementById('payContent').innerHTML = `
    <div class="bg-dark-800 border border-dark-700 rounded-2xl shadow-xl overflow-hidden animate-fade-in-up">
        <div class="p-6 border-b border-dark-700">
            <h2 class="text-xl font-bold text-white tracking-tight">💰 Catat Pelunasan Hutang</h2>
            <p class="text-sm text-gray-400 mt-1">${pur.id} — ${pur.supplierName} — Sisa Hutang: <span class="text-orange-400 font-bold">${formatRp(pur.sisaHutang)}</span></p>
        </div>
        <div class="p-6 space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label class="block text-xs text-gray-400 mb-1">No Kuitansi</label><input type="text" class="invoice-input w-full bg-dark-800 text-gray-500" value="AUTO" readonly></div>
                <div><label class="block text-xs text-gray-400 mb-1">Tanggal Bayar</label><input type="date" id="pPurDate" class="invoice-input w-full" value="${new Date().toISOString().split('T')[0]}"></div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label class="block text-xs text-gray-400 mb-1">Sumber Dana Kas/Bank *</label><select id="pPurBank" class="invoice-input w-full">${bankOpts}</select></div>
                <div><label class="block text-xs text-gray-400 mb-1">No. Referensi (Transfer/Cek)</label><input type="text" id="pPurRef" class="invoice-input w-full" placeholder="No. Transaksi Bank"></div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label class="block text-xs text-gray-400 mb-1">Jumlah Nominal Bayar *</label><input type="number" id="pPurAmount" class="invoice-input w-full text-lg font-bold text-emerald-400" value="${pur.sisaHutang}"></div>
                <div><label class="block text-xs text-gray-400 mb-1">Potongan Tambahan</label><input type="number" id="pPurPotongan" class="invoice-input w-full text-white" value="0" oninput="calcPurPayTotal()"></div>
            </div>
            
            <div class="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20 flex justify-between items-center mt-6">
                <span class="text-emerald-300 font-medium">Total Pelunasan Hutang</span>
                <span class="text-emerald-400 font-bold text-2xl" id="lblPurPayTotal">${formatRp(pur.sisaHutang)}</span>
            </div>
        </div>
        <div class="p-6 border-t border-dark-700 bg-dark-800/50 flex justify-end gap-3">
            <button onclick="viewPurchase('${purId}')" class="px-4 py-2.5 rounded-xl text-sm text-gray-300 hover:bg-dark-700 transition-colors">Batal</button>
            <button onclick="doRecordPurPayment('${purId}')" class="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20">✅ Simpan Pelunasan</button>
        </div>
    </div>`;

    toggleView('pay');
}

function calcPurPayTotal() {
    const a = parseFloat(document.getElementById('pPurAmount').value) || 0;
    const p = parseFloat(document.getElementById('pPurPotongan').value) || 0;
    document.getElementById('lblPurPayTotal').innerText = formatRp(a + p);
}

function doRecordPurPayment(purId) {
    try {
        const amt = parseFloat(document.getElementById('pPurAmount').value) || 0;
        const pot = parseFloat(document.getElementById('pPurPotongan').value) || 0;
        if (amt <= 0) {
            alert('⚠️ Jumlah nominal bayar harus lebih dari 0.');
            return;
        }

        const bankSel = document.getElementById('pPurBank');
        const payData = {
            amount: amt,
            potongan: pot,
            date: document.getElementById('pPurDate').value,
            bankCode: bankSel.value,
            bankName: bankSel.options[bankSel.selectedIndex].text,
            ref: document.getElementById('pPurRef').value
        };

        const pur = window.VittaPurchase.recordPurchasePayment(purId, payData);
        addPurAudit(purId, `Pelunasan hutang sebesar ${formatRp(amt)} berhasil dicatat.`);
        const lastPay = pur.payments[pur.payments.length - 1];

        // Bukti Bayar / Receipt Screen
        showPurPaymentReceipt(purId, lastPay);
    } catch (e) {
        alert('⚠️ Gagal: ' + e.message);
    }
}

function showPurPaymentReceipt(purId, pay) {
    const purchases = window.VittaPurchase.getPurchases();
    const pur = purchases.find(p => p.id === purId);
    if (!pur) return;

    document.getElementById('payContent').innerHTML = `
    <div class="bg-dark-800 border border-dark-700 rounded-2xl shadow-xl overflow-hidden animate-fade-in-up max-w-xl mx-auto">
        <div class="p-6 border-b border-dark-700 bg-emerald-500/5">
            <div class="flex items-center gap-2 mb-1">
                <span class="text-2xl">✅</span>
                <h2 class="text-lg font-bold text-emerald-400">Pembayaran Hutang Berhasil Dicatat</h2>
            </div>
            <p class="text-sm text-gray-400">Jurnal pembukuan double entry kas & hutang otomatis terbuat.</p>
        </div>
        <div class="p-6 space-y-4">
            <div class="grid grid-cols-2 gap-4 text-sm">
                <div><span class="text-gray-500 text-xs block mb-0.5">No. Kuitansi</span><span class="text-white font-medium">${pay.id}</span></div>
                <div><span class="text-gray-500 text-xs block mb-0.5">Untuk Purchase Order</span><span class="text-white font-medium">${purId}</span></div>
                <div><span class="text-gray-500 text-xs block mb-0.5">Pemasok</span><span class="text-white font-medium">${pur.supplierName}</span></div>
                <div><span class="text-gray-500 text-xs block mb-0.5">Tanggal Bayar</span><span class="text-white font-medium">${formatDate(pay.date)}</span></div>
                <div><span class="text-gray-500 text-xs block mb-0.5">Sumber Pembayaran</span><span class="text-white font-medium">${pay.bankName}</span></div>
                <div><span class="text-gray-500 text-xs block mb-0.5">No. Referensi</span><span class="text-white font-medium">${pay.ref || '-'}</span></div>
            </div>
            <div class="bg-dark-900/50 p-4 rounded-xl border border-dark-700 space-y-2 mt-4">
                <div class="flex justify-between items-center"><span class="text-gray-400">Nominal Dibayar</span><span class="text-emerald-400 font-bold text-xl">${formatRp(pay.amount)}</span></div>
                ${pay.potongan > 0 ? `<div class="flex justify-between items-center"><span class="text-gray-400">Potongan Potongan</span><span class="text-white">${formatRp(pay.potongan)}</span></div>` : ''}
                <div class="flex justify-between items-center border-t border-dark-700 pt-2.5 mt-2.5"><span class="text-gray-400">Sisa Hutang Usaha</span><span class="text-orange-400 font-bold text-lg">${formatRp(pur.sisaHutang)}</span></div>
                <div class="flex justify-between items-center"><span class="text-gray-400">Status PO</span>${getBadge(pur.status)}</div>
            </div>
        </div>
        <div class="p-6 border-t border-dark-700 bg-dark-800/50 flex flex-wrap gap-2 justify-end">
            <button onclick="printPaymentReceipt('${purId}','${pay.id}')" class="bg-dark-700 hover:bg-dark-600 text-gray-300 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors">🖨️ Cetak Kuitansi</button>
            <button onclick="viewPurchase('${purId}')" class="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold">Lihat Detail PO</button>
        </div>
    </div>`;
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.VittaPurchase) {
        renderTable();
    }
});
