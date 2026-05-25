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
async function renderTable() {
    const { data: purchases, error } = await readRecords('akt_purchases', {}, { order: { column: 'date', ascending: false } });
    
    const tbody = document.getElementById('purchaseTableBody');
    if (!purchases || purchases.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-8 text-center text-gray-500">Belum ada data pembelian.</td></tr>';
        return;
    }
    
    tbody.innerHTML = purchases.map(pur => `
    <tr class="hover:bg-dark-700/30 transition-colors">
        <td class="px-6 py-4 font-medium text-white">${pur.purchase_no}</td>
        <td class="px-6 py-4">${pur.supplier_name}</td>
        <td class="px-6 py-4">${formatDate(pur.date)}</td>
        <td class="px-6 py-4 text-right">${formatRp(pur.grand_total)}</td>
        <td class="px-6 py-4 text-right ${pur.sisa_hutang > 0 ? 'text-orange-400 font-medium' : 'text-gray-500'}">
            ${pur.sisa_hutang === 0 ? 'Rp 0' : formatRp(pur.sisa_hutang)}
        </td>
        <td class="px-6 py-4 text-center">${getBadge(pur.status)}</td>
        <td class="px-6 py-4 text-center">
            <button onclick="viewPurchase('${pur.id}')" class="text-blue-400 hover:text-blue-300">Lihat</button>
        </td>
    </tr>`).join('');
}

// ========== FORM VIEW ==========
async function initForm() {
    const cs = document.getElementById('supplierSelect');
    
    // --- Sinkronisasi data kontak dari Master Kontak ---
    const { data: contactsData } = await readRecords('akt_contacts');
    let suppliersList = [];
    if (contactsData) {
        suppliersList = contactsData.filter(c => c.type === 'Supplier' || c.type === 'Keduanya' || c.tipe === 'Supplier');
    }
    cs.innerHTML = '<option value="">-- Pilih Pemasok --</option>' + suppliersList.map(c => `<option value="${c.id}" data-name="${c.name || c.nama}">${c.name || c.nama}</option>`).join('');
    
    // Sinkronisasi Produk dari master produk
    const { data: productsData } = await readRecords('akt_products');
    let productsList = productsData || [];
    window._PUR_PRODUCTS = productsList; // cache
    
    // Load Tags from Supabase
    const tagContainer = document.getElementById('fTagCheckboxes');
    if (tagContainer) {
        const { data: tagData } = await readRecords('akt_tags', { is_active: true });
        if (tagData) {
            const dynamicTags = tagData.filter(t => t.type === 'Global' || t.type === 'Pembelian');
            tagContainer.innerHTML = dynamicTags.map(t => `<label class="flex items-center gap-1.5 cursor-pointer hover:bg-dark-700/50 px-2 py-1 rounded"><input type="checkbox" value="${t.name}" class="tagCheck accent-blue-500"><span class="text-sm font-medium" style="color: ${t.color}">${t.name}</span></label>`).join('');
            if (dynamicTags.length === 0) tagContainer.innerHTML = '<span class="text-xs text-gray-500 italic flex items-center">Belum ada tag khusus Pembelian yang aktif.</span>';
        } else {
            tagContainer.innerHTML = '<span class="text-xs text-rose-500 italic flex items-center">Gagal memuat tag.</span>';
        }
    }

    const tbody = document.getElementById('itemsBody');
    tbody.innerHTML = `
        <tr class="item-row group">
            <td class="py-2 pr-2">
                <select class="invoice-input product-select focus:border-rose-500 focus:ring-rose-500" onchange="calculateTotal()">
                    <option value="" data-price="0">-- Pilih Produk --</option>
                    ${productsList.map(p => `<option value="${p.id}" data-price="${p.buy_price || p.sell_price || 0}">${p.name}</option>`).join('')}
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

    document.getElementById('purchaseDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('purchaseRef').value = '';
    document.getElementById('globalDisc').value = '0';
    document.getElementById('downPayment').value = '0';
    calculateTotal();
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
                    ${productsList.map(p => `<option value="${p.id}" data-price="${p.buy_price || p.sell_price || 0}">${p.name}</option>`).join('')}
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
document.addEventListener('change', function(e) {
    if (e.target && e.target.classList.contains('product-select')) {
        const selectedOption = e.target.options[e.target.selectedIndex];
        if (selectedOption) {
            const price = selectedOption.getAttribute('data-price');
            const row = e.target.closest('tr');
            if (row) {
                row.querySelector('.item-price').value = price;
                calculateTotal();
            }
        }
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
    if (document.getElementById('lblSubtotal')) document.getElementById('lblSubtotal').innerText = formatRp(subtotal);
    if (document.getElementById('lblTax')) document.getElementById('lblTax').innerText = formatRp(totalTax);
    if (document.getElementById('lblGrandTotal')) document.getElementById('lblGrandTotal').innerText = formatRp(grandTotal);
    if (document.getElementById('lblSisaHutang')) document.getElementById('lblSisaHutang').innerText = formatRp(sisa);
}

async function savePurchase() {
    const supplierSel = document.getElementById('supplierSelect');
    const supplierId = supplierSel.value;
    const supplierName = supplierSel.options[supplierSel.selectedIndex]?.text;
    const date = document.getElementById('purchaseDate').value;
    const ref = document.getElementById('purchaseRef').value;
    
    if(!supplierId || !date) {
        Swal.fire({icon: 'warning', title: 'Perhatian', text: 'Pilih pemasok dan tanggal terlebih dahulu.', background: '#1f2937', color: '#fff'});
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
        Swal.fire({icon: 'warning', title: 'Perhatian', text: 'Tambahkan minimal 1 produk.', background: '#1f2937', color: '#fff'});
        return;
    }

    // Get Tags
    const checkedTags = Array.from(document.querySelectorAll('.tagCheck:checked')).map(cb => cb.value);
    const tagString = checkedTags.join(', ');

    const subtotalStr = document.getElementById('lblSubtotal').innerText.replace(/[^\d]/g, '');
    const taxStr = document.getElementById('lblTax').innerText.replace(/[^\d]/g, '');
    const grandTotalStr = document.getElementById('lblGrandTotal').innerText.replace(/[^\d]/g, '');
    const subtotal = parseInt(subtotalStr) || 0;
    const totalPPN = parseInt(taxStr) || 0;
    const grandTotal = parseInt(grandTotalStr) || 0;
    const potongan = parseFloat(document.getElementById('globalDisc').value) || 0;
    const dp = parseFloat(document.getElementById('downPayment').value) || 0;
    
    let status = 'belum';
    let sisaHutang = grandTotal - dp;
    if (dp > 0) {
        status = sisaHutang <= 0 ? 'lunas' : 'sebagian';
    }

    const d = new Date();
    const purchaseNo = `PUR/${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${Math.floor(Math.random() * 9000) + 1000}`;

    const purData = {
        purchase_no: purchaseNo,
        supplier_id: supplierId,
        supplier_name: supplierName,
        date,
        ref,
        tag: tagString,
        items,
        subtotal,
        total_ppn: totalPPN,
        potongan,
        dp,
        dp_account: dp > 0 ? '1-10001' : '',
        grand_total: grandTotal,
        sisa_hutang: sisaHutang,
        total_paid: dp,
        status,
        note: '',
        payments: []
    };

    const { data: savedPur, error } = await insertRecord('akt_purchases', purData);
    if (error) {
        Swal.fire({icon: 'error', title: 'Gagal', text: error.message, background: '#1f2937', color: '#fff'});
        return;
    }

    // AUTO JOURNAL (Supabase akt_journals)
    const jLines = [];
    
    // Debit: Persediaan (Subtotal)
    jLines.push({ account: '1-10200', accountName: 'Persediaan Barang', debit: subtotal, credit: 0 });

    // Debit: PPN Masukan (Jika ada)
    if (totalPPN > 0) {
        jLines.push({ account: '1-10500', accountName: 'PPN Masukan', debit: totalPPN, credit: 0 });
    }

    // Kredit: Hutang Usaha sejumlah Grand Total
    jLines.push({ account: '2-20100', accountName: 'Hutang Usaha', debit: 0, credit: grandTotal });
    
    await insertRecord('akt_journals', {
        date: date,
        memo: `Pembelian ${purchaseNo} dari ${supplierName}`,
        lines: jLines,
        ref_id: purchaseNo,
        type: 'PURCHASE'
    });

    if (dp > 0) {
        const dpLines = [
            { account: '2-20100', accountName: 'Hutang Usaha', debit: dp, credit: 0 },
            { account: '1-10001', accountName: 'Kas Kecil', debit: 0, credit: dp },
        ];
        await insertRecord('akt_journals', {
            date: date,
            memo: `DP Pembelian ${purchaseNo}`,
            lines: dpLines,
            ref_id: purchaseNo,
            type: 'PURCHASE_DP'
        });
    }

    Swal.fire({icon: 'success', title: 'Berhasil', text: 'Pembelian berhasil dicatat!', background: '#1f2937', color: '#fff', timer: 1500, showConfirmButton: false});
    toggleView('list');
}

// ========== DETAIL VIEW & PAYMENT ==========
let currentPurId = null;

async function viewPurchase(id) {
    const { data: purchases } = await readRecords('akt_purchases', { id: id });
    if (!purchases || purchases.length === 0) return;
    const pur = purchases[0];

    currentPurId = id;

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
                <button class="text-gray-400 hover:text-white text-xs flex items-center justify-center gap-1 mx-auto">Selesai</button>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="7" class="py-4 text-center text-gray-500 text-sm">Belum ada pembayaran.</td></tr>';

    const canPay = pur.status !== 'lunas' && pur.status !== 'void' && pur.sisa_hutang > 0;
    const canAction = pur.status !== 'void';

    document.getElementById('detailContent').innerHTML = `
    <div class="bg-dark-800 border border-dark-700 rounded-2xl shadow-xl overflow-hidden animate-fade-in-up">
        <!-- Header with Action Bar -->
        <div class="p-6 border-b border-dark-700">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <div>
                    <h2 class="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                        <span>${pur.purchase_no}</span>
                        ${getBadge(pur.status)}
                    </h2>
                    <p class="text-sm text-gray-400 mt-1">Pemasok: <strong class="text-white">${pur.supplier_name}</strong></p>
                    ${pur.tag ? `<p class="text-sm text-gray-400 mt-1">Tag: <strong class="text-blue-400">${pur.tag}</strong></p>` : ''}
                </div>
                <div class="flex flex-wrap gap-2">
                    <button onclick="toggleView('list')" class="bg-dark-700 hover:bg-dark-600 text-gray-300 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>
                        Kembali ke Daftar
                    </button>
                    ${canPay ? `<button onclick="openPayment('${pur.id}')" class="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all hover:shadow-emerald-600/40">💰 Catat Pelunasan</button>` : ''}
                    
                    ${canAction ? `
                    <div class="relative" id="actionDropdown">
                        <button onclick="document.getElementById('actionMenu').classList.toggle('hidden')" class="bg-dark-700 hover:bg-dark-600 text-gray-300 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors">
                            ⚙️ Tindakan <svg class="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                        </button>
                        <div id="actionMenu" class="hidden absolute top-full right-0 mt-1 bg-dark-700 border border-dark-600 rounded-xl shadow-xl z-20 min-w-[160px]">
                            <button onclick="voidPurchase('${pur.id}');document.getElementById('actionMenu').classList.add('hidden')" class="w-full text-left px-4 py-2.5 text-xs text-gray-300 hover:bg-dark-600 rounded-t-xl">🚫 Void PO</button>
                            <button onclick="deletePurchase('${pur.id}');document.getElementById('actionMenu').classList.add('hidden')" class="w-full text-left px-4 py-2.5 text-xs text-rose-400 hover:bg-dark-600 rounded-b-xl font-medium">🗑️ Hapus PO</button>
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
            <div><span class="text-gray-500 text-xs block mb-0.5">Dibuat Oleh</span><span class="text-white font-medium">Admin</span></div>
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
                ${pur.potongan > 0 ? `<div class="flex justify-between text-gray-400"><span>Potongan</span><span class="text-rose-400">-${formatRp(pur.potongan)}</span></div>` : ''}
                ${pur.total_ppn > 0 ? `<div class="flex justify-between text-gray-400"><span>PPN Masukan (11%)</span><span class="text-white font-medium">${formatRp(pur.total_ppn)}</span></div>` : ''}
                <div class="flex justify-between border-t border-dark-700 pt-2 mt-1"><span class="text-white font-bold">Total Pembelian</span><span class="text-blue-400 font-bold text-lg">${formatRp(pur.grand_total)}</span></div>
                ${pur.dp > 0 ? `<div class="flex justify-between text-gray-400"><span>Uang Muka (DP)</span><span class="text-emerald-400">${formatRp(pur.dp)}</span></div>` : ''}
                <div class="flex justify-between text-gray-400"><span>Total Dibayar</span><span class="text-emerald-400 font-semibold">${formatRp(pur.total_paid)}</span></div>
                <div class="flex justify-between bg-orange-500/10 p-3 rounded-xl border border-orange-500/20 mt-2 font-medium">
                    <span class="text-orange-300">Sisa Hutang Usaha</span>
                    <span class="text-orange-400 font-bold text-lg">${formatRp(pur.sisa_hutang)}</span>
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

    </div>`;

    toggleView('detail');
}

// Payment Checkout Page
async function openPayment(id) {
    window._payPurId = id;
    const { data: purchases } = await readRecords('akt_purchases', { id: id });
    if (!purchases || purchases.length === 0) return;
    const pur = purchases[0];

    // Load Kas & Bank accounts from Supabase
    const { data: bankData } = await readRecords('akt_coa_accounts');
    let bankAccounts = [{ code: '1-10001', name: 'Kas Kecil' }, { code: '1-10003', name: 'Rekening Mandiri' }];
    if (bankData) {
        bankAccounts = bankData.filter(a => a.category === 'Kas & Bank');
    }
    const bankOpts = bankAccounts.map(b => `<option value="${b.code}">${b.name} (${b.code})</option>`).join('');

    document.getElementById('payContent').innerHTML = `
    <div class="bg-dark-800 border border-dark-700 rounded-2xl shadow-xl overflow-hidden animate-fade-in-up">
        <div class="p-6 border-b border-dark-700">
            <h2 class="text-xl font-bold text-white tracking-tight">💰 Catat Pelunasan Hutang</h2>
            <p class="text-sm text-gray-400 mt-1">${pur.purchase_no} — ${pur.supplier_name} — Sisa Hutang: <span class="text-orange-400 font-bold">${formatRp(pur.sisa_hutang)}</span></p>
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
                <div><label class="block text-xs text-gray-400 mb-1">Jumlah Nominal Bayar *</label><input type="number" id="pPurAmount" class="invoice-input w-full text-lg font-bold text-emerald-400" value="${pur.sisa_hutang}" oninput="calcPurPayTotal()"></div>
                <div><label class="block text-xs text-gray-400 mb-1">Potongan Tambahan</label><input type="number" id="pPurPotongan" class="invoice-input w-full text-white" value="0" oninput="calcPurPayTotal()"></div>
            </div>
            
            <div class="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20 flex justify-between items-center mt-6">
                <span class="text-emerald-300 font-medium">Total Pelunasan Hutang</span>
                <span class="text-emerald-400 font-bold text-2xl" id="lblPurPayTotal">${formatRp(pur.sisa_hutang)}</span>
            </div>
        </div>
        <div class="p-6 border-t border-dark-700 bg-dark-800/50 flex justify-end gap-3">
            <button onclick="viewPurchase('${id}')" class="px-4 py-2.5 rounded-xl text-sm text-gray-300 hover:bg-dark-700 transition-colors">Batal</button>
            <button onclick="doRecordPurPayment('${id}')" class="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20">✅ Simpan Pelunasan</button>
        </div>
    </div>`;

    toggleView('pay');
}

window.calcPurPayTotal = function() {
    const a = parseFloat(document.getElementById('pPurAmount').value) || 0;
    const p = parseFloat(document.getElementById('pPurPotongan').value) || 0;
    document.getElementById('lblPurPayTotal').innerText = formatRp(a + p);
}

async function doRecordPurPayment(purId) {
    const amt = parseFloat(document.getElementById('pPurAmount').value) || 0;
    const pot = parseFloat(document.getElementById('pPurPotongan').value) || 0;
    if (amt <= 0) {
        Swal.fire({icon: 'warning', title: 'Perhatian', text: 'Jumlah nominal bayar harus lebih dari 0.', background: '#1f2937', color: '#fff'});
        return;
    }

    const { data: purchases } = await readRecords('akt_purchases', { id: purId });
    const pur = purchases[0];

    const bankSel = document.getElementById('pPurBank');
    const payData = {
        id: `PAY-OUT/${new Date().getFullYear()}/${Math.floor(Math.random() * 9000) + 1000}`,
        amount: amt,
        potongan: pot,
        date: document.getElementById('pPurDate').value,
        bankCode: bankSel.value,
        bankName: bankSel.options[bankSel.selectedIndex].text,
        ref: document.getElementById('pPurRef').value
    };

    pur.payments.push(payData);
    let totalPaid = pur.dp;
    pur.payments.forEach(p => totalPaid += (p.amount + (p.potongan || 0)));
    pur.total_paid = totalPaid;
    pur.sisa_hutang = Math.max(0, pur.grand_total - totalPaid);
    
    if (pur.sisa_hutang <= 0) {
        pur.status = 'lunas';
        pur.sisa_hutang = 0;
    } else {
        pur.status = 'sebagian';
    }

    const { error } = await updateRecord('akt_purchases', purId, {
        payments: pur.payments,
        total_paid: pur.total_paid,
        sisa_hutang: pur.sisa_hutang,
        status: pur.status
    });

    if (error) {
        Swal.fire({icon: 'error', title: 'Gagal', text: error.message, background: '#1f2937', color: '#fff'});
        return;
    }

    // JOURNAL
    const jLines = [];
    jLines.push({ account: '2-20100', accountName: 'Hutang Usaha', debit: amt + pot, credit: 0 });
    jLines.push({ account: payData.bankCode, accountName: payData.bankName, debit: 0, credit: amt });
    if (pot > 0) {
        jLines.push({ account: '7-70099', accountName: 'Pendapatan Lain - lain', debit: 0, credit: pot });
    }
    
    await insertRecord('akt_journals', {
        date: payData.date,
        memo: `Pelunasan Hutang ${payData.id} untuk ${pur.purchase_no}`,
        lines: jLines,
        ref_id: payData.id,
        type: 'PURCHASE_PAYMENT'
    });

    Swal.fire({icon: 'success', title: 'Berhasil', text: 'Pelunasan berhasil dicatat.', background: '#1f2937', color: '#fff', timer: 1500, showConfirmButton: false});
    viewPurchase(purId);
}

async function voidPurchase(id) {
    if (!confirm('Apakah Anda yakin ingin membatalkan (void) Purchase Order ini?')) return;
    await updateRecord('akt_purchases', id, { status: 'void' });
    Swal.fire({icon: 'success', title: 'Berhasil', text: 'Purchase Order dibatalkan.', background: '#1f2937', color: '#fff', timer: 1500, showConfirmButton: false});
    viewPurchase(id);
}

async function deletePurchase(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus permanen Purchase Order ini?')) return;
    await deleteRecord('akt_purchases', id);
    Swal.fire({icon: 'success', title: 'Berhasil', text: 'Purchase Order dihapus.', background: '#1f2937', color: '#fff', timer: 1500, showConfirmButton: false});
    toggleView('list');
}

document.addEventListener('DOMContentLoaded', () => {
    // Inject SweetAlert2
    if(typeof Swal === 'undefined'){
        const script = document.createElement('script');
        script.src = "https://cdn.jsdelivr.net/npm/sweetalert2@11";
        document.head.appendChild(script);
    }
    
    // Auto render table when ready
    if (window.supabaseClient) {
        renderTable();
    } else {
        window.addEventListener('vitta-saas-ready', () => {
            renderTable();
        });
    }
});
