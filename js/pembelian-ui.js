// ========== HELPERS ==========
var formatRp = formatRp || ((num) => 'Rp ' + Math.round(num || 0).toLocaleString('id-ID'));
var formatDate = formatDate || ((d) => {
    if (!d) return '-';
    const dt = new Date(d);
    return dt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
});


// ========== VIEW NAVIGATION ==========
function toggleView(view) {
    if (view === 'form') {
        document.getElementById('listView').classList.add('hidden');
        document.getElementById('formView').classList.remove('hidden');
        document.getElementById('formView').classList.add('animate-fade-in-up');
        initForm();
    } else {
        document.getElementById('formView').classList.add('hidden');
        document.getElementById('listView').classList.remove('hidden');
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

// ========== MODAL LOGIC ==========
let currentPurId = null;

function viewPurchase(id) {
    if (!window.VittaPurchase) return;
    const purchases = window.VittaPurchase.getPurchases();
    const pur = purchases.find(p => p.id === id);
    if (!pur) return;

    currentPurId = id;
    document.getElementById('modalPurId').innerText = pur.id;
    document.getElementById('modalPurSupplier').innerText = pur.supplierName;
    document.getElementById('modalPurDate').innerText = formatDate(pur.date);
    document.getElementById('modalPurTotal').innerText = formatRp(pur.grandTotal);
    document.getElementById('modalPurSisa').innerText = formatRp(pur.sisaHutang);

    const tbody = document.getElementById('modalPurItems');
    tbody.innerHTML = pur.items.map(it => `
        <tr>
            <td class="py-2">${it.productName}</td>
            <td class="py-2 text-center">${it.qty}</td>
            <td class="py-2 text-right">${formatRp(it.price)}</td>
        </tr>
    `).join('');

    const paySection = document.getElementById('modalPaySection');
    if (pur.sisaHutang > 0) {
        paySection.classList.remove('hidden');
        document.getElementById('modalPayAmount').value = pur.sisaHutang;
        
        // Load Kas Bank for Payment
        const sourceSelect = document.getElementById('modalPayAccount');
        if (window.VittaCOA) {
            const banks = window.VittaCOA.getAccounts().filter(a => a.category === 'Kas & Bank');
            sourceSelect.innerHTML = banks.map(b => `<option value="${b.code}" data-name="${b.name}">${b.name} (${b.code})</option>`).join('');
        }
    } else {
        paySection.classList.add('hidden');
    }

    document.getElementById('modalPurchase').classList.remove('hidden');
    document.getElementById('modalPurchase').classList.add('flex');
}

function closeModalPurchase() {
    document.getElementById('modalPurchase').classList.add('hidden');
    document.getElementById('modalPurchase').classList.remove('flex');
    currentPurId = null;
}

function submitPayment() {
    if (!currentPurId) return;
    const amount = parseFloat(document.getElementById('modalPayAmount').value) || 0;
    if (amount <= 0) {
        alert('Nominal bayar harus lebih dari 0');
        return;
    }

    const sel = document.getElementById('modalPayAccount');
    const accountCode = sel.value;
    const accountName = sel.options[sel.selectedIndex]?.text.split(' (')[0] || 'Kas';

    try {
        window.VittaPurchase.recordPurchasePayment(currentPurId, { amount: amount, bankCode: accountCode, bankName: accountName, date: new Date().toISOString().split('T')[0] });
        alert('Pembayaran hutang berhasil dicatat!');
        closeModalPurchase();
        renderTable();
    } catch (e) {
        alert(e.message);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.VittaPurchase) {
        renderTable();
    }
});
