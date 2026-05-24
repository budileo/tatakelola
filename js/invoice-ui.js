// ========== VIEW NAVIGATION ==========
function showView(name) {
    const viewMap = { list: 'viewList', form: 'viewForm', detail: 'viewDetail', pay: 'viewPay' };
    ['viewList','viewForm','viewDetail','viewPay'].forEach(id => {
        document.getElementById(id).classList.add('hidden');
    });
    const targetId = viewMap[name];
    if (targetId) {
        document.getElementById(targetId).classList.remove('hidden');
        document.getElementById(targetId).scrollTop = 0;
    }
    if (name === 'list') renderList();
    if (name === 'form') initForm();
    // Scroll main area to top
    const main = document.querySelector('main');
    if (main) main.scrollTop = 0;
}

// ========== STATUS BADGE ==========
function badge(status) {
    const m = {
        lunas: ['Lunas','bg-emerald-500/10 text-emerald-400 border-emerald-500/20'],
        belum: ['Belum Dibayar','bg-orange-500/10 text-orange-400 border-orange-500/20'],
        sebagian: ['Sebagian','bg-sky-500/10 text-sky-400 border-sky-500/20'],
        jatuh_tempo: ['Jatuh Tempo','bg-rose-500/10 text-rose-400 border-rose-500/20'],
        retur: ['Retur','bg-purple-500/10 text-purple-400 border-purple-500/20'],
        void: ['Void','bg-gray-500/10 text-gray-400 border-gray-500/20'],
    };
    const [label, cls] = m[status] || ['?','bg-gray-500/10 text-gray-400'];
    return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls} border">${label}</span>`;
}

// ========== LIST VIEW ==========
function renderList() {
    let invoices = refreshStatuses();
    const from = document.getElementById('fDateFrom').value;
    const to = document.getElementById('fDateTo').value;
    const status = document.getElementById('fStatus').value;
    const search = document.getElementById('fSearch').value.toLowerCase();

    if (from) invoices = invoices.filter(i => i.date >= from);
    if (to) invoices = invoices.filter(i => i.date <= to);
    if (status) invoices = invoices.filter(i => i.status === status);
    if (search) invoices = invoices.filter(i => i.id.toLowerCase().includes(search) || i.customerName.toLowerCase().includes(search));

    const tbody = document.getElementById('tbodyList');
    if (!invoices.length) { tbody.innerHTML = '<tr><td colspan="8" class="px-4 py-8 text-center text-gray-500">Tidak ada invoice ditemukan.</td></tr>'; return; }

    tbody.innerHTML = invoices.map(inv => `
    <tr class="hover:bg-dark-700/30 transition-colors cursor-pointer" onclick="openDetail('${inv.id}')">
        <td class="px-4 py-3 font-medium text-white">${inv.id}</td>
        <td class="px-4 py-3">${inv.customerName}</td>
        <td class="px-4 py-3">${formatDate(inv.date)}</td>
        <td class="px-4 py-3">${formatDate(inv.dueDate)}</td>
        <td class="px-4 py-3 text-right">${formatRp(inv.grandTotal)}</td>
        <td class="px-4 py-3 text-right ${inv.sisaTagihan > 0 ? 'text-orange-400 font-medium' : 'text-gray-500'}">${formatRp(inv.sisaTagihan)}</td>
        <td class="px-4 py-3 text-center">${badge(inv.status)}</td>
        <td class="px-4 py-3 text-center"><button class="text-blue-400 hover:text-blue-300 text-xs">Detail</button></td>
    </tr>`).join('');
}

// ========== INIT FORM ==========
function initForm() {
    const cs = document.getElementById('fCustomer');
    
    // --- Sinkronisasi data kontak dari Master Kontak ---
    let customersList = DB.customers; // default
    const scopedKey = window.getScopedKey ? window.getScopedKey('vitta_contacts') : 'vitta_contacts';
    const localContacts = localStorage.getItem(scopedKey);
    if(localContacts) {
        try {
            const parsed = JSON.parse(localContacts);
            const valid = parsed.filter(c => c.tipe === 'Customer' || c.tipe === 'Keduanya');
            if(valid.length > 0) {
                customersList = valid.map(c => ({ id: c.id, name: (c.sapaan ? c.sapaan + ' ' : '') + c.nama }));
            }
        } catch(e) {}
    }

    cs.innerHTML = '<option value="">-- Pilih Pelanggan --</option>' + customersList.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    // Multi-tag checkboxes
    const tagContainer = document.getElementById('fTagCheckboxes');
    if (tagContainer) {
        tagContainer.innerHTML = DB.tags.map(t => `<label class="flex items-center gap-1.5 cursor-pointer hover:bg-dark-700/50 px-2 py-1 rounded"><input type="checkbox" value="${t}" class="tagCheck accent-blue-500"><span class="text-sm text-gray-300">${t}</span></label>`).join('');
    }
    const da = document.getElementById('fDPAccount');
    let bankOptsList = DB.bankAccounts;
    if (typeof getKasBankAccounts === 'function') {
        bankOptsList = getKasBankAccounts();
    }
    da.innerHTML = bankOptsList.map(b => `<option value="${b.code}">${b.name}</option>`).join('');

    document.getElementById('fInvDate').value = today();
    document.getElementById('fInvNo').value = 'AUTO';
    document.getElementById('fRef').value = '';
    document.getElementById('fDiscInv').value = '0';
    document.getElementById('fShipping').value = '0';
    document.getElementById('fTxFee').value = '0';
    document.getElementById('fPotongan').value = '0';
    document.getElementById('fDP').value = '0';
    document.getElementById('fMessage').value = '';
    document.getElementById('fNote').value = '';
    document.getElementById('itemsBody').innerHTML = '';
    addItemRow();
    calcDueDate();
    calcTotals();
}

function onCustomerChange() {}

function calcDueDate() {
    const d = document.getElementById('fInvDate').value;
    const t = document.getElementById('fTermin').value;
    if (t === 'custom' || !d) return;
    const dt = new Date(d);
    dt.setDate(dt.getDate() + parseInt(t));
    document.getElementById('fDueDate').value = dt.toISOString().split('T')[0];
}

// ========== ITEM ROWS ==========
function addItemRow() {
    const tbody = document.getElementById('itemsBody');
    let prodOpts = '';
    if (window.VittaProduk) {
        const activeProds = window.VittaProduk.getActiveProducts().filter(p => p.is_sold);
        prodOpts = activeProds.map(p => `<option value="${p.id}" data-price="${p.sell_price}" data-unit="${p.unit}" data-stock="${p.is_tracked ? p.current_stock : ''}" data-tracked="${p.is_tracked}">${p.name}</option>`).join('');
    } else {
        prodOpts = DB.products.map(p => `<option value="${p.id}" data-price="${p.price}" data-unit="${p.unit}" data-stock="" data-tracked="false">${p.name}</option>`).join('');
    }
    const taxOpts = DB.taxOptions.map(t => `<option value="${t.id}" data-rate="${t.rate}">${t.label}</option>`).join('');
    const tr = document.createElement('tr');
    tr.className = 'item-row';
    tr.innerHTML = `
        <td class="py-1 pr-1 align-top">
            <select class="w-full text-xs py-1 iProd" onchange="onProdChange(this)">${'<option value="">-- Pilih --</option>'+prodOpts}</select>
            <div class="text-[10px] text-gray-500 mt-0.5 iStockInfo hidden"></div>
        </td>
        <td class="py-1 pr-1 align-top"><input type="text" class="w-full text-xs py-1 iDesc" placeholder="Opsional"></td>
        <td class="py-1 pr-1 align-top"><input type="number" class="w-full text-xs py-1 iQty text-center" value="1" min="1" oninput="calcTotals()"></td>
        <td class="py-1 pr-1 align-top"><input type="text" class="w-full text-xs py-1 iUnit text-center" value="Pcs" readonly></td>
        <td class="py-1 pr-1 align-top"><input type="number" class="w-full text-xs py-1 iPrice text-right" value="0" oninput="calcTotals()"></td>
        <td class="py-1 pr-1 align-top"><input type="number" class="w-full text-xs py-1 iDisc text-right" value="0" oninput="calcTotals()"></td>
        <td class="py-1 pr-1 align-top"><select class="w-10 text-xs py-1 iDiscType" onchange="calcTotals()"><option value="rp">Rp</option><option value="%">%</option></select></td>
        <td class="py-1 pr-1 align-top"><select class="w-full text-xs py-1 iTax" onchange="calcTotals()">${taxOpts}</select></td>
        <td class="py-1 pr-1 text-right align-top"><span class="iLineTotal text-white font-medium text-xs mt-1 block">Rp 0</span></td>
        <td class="py-1 text-center align-top"><button onclick="removeItemRow(this)" class="text-gray-600 hover:text-rose-500 mt-1"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button></td>`;
    tbody.appendChild(tr);
}

function removeItemRow(btn) {
    const tbody = document.getElementById('itemsBody');
    if (tbody.children.length > 1) { btn.closest('tr').remove(); calcTotals(); }
}

function onProdChange(sel) {
    const row = sel.closest('tr');
    const opt = sel.options[sel.selectedIndex];
    row.querySelector('.iPrice').value = opt.dataset.price || 0;
    row.querySelector('.iUnit').value = opt.dataset.unit || 'Pcs';

    const stockInfo = row.querySelector('.iStockInfo');
    if (stockInfo) {
        if (opt.dataset.tracked === 'true') {
            const stock = parseFloat(opt.dataset.stock) || 0;
            stockInfo.textContent = `Stok: ${stock} ${opt.dataset.unit || ''}`;
            stockInfo.classList.remove('hidden');
            if (stock <= 0) {
                stockInfo.classList.add('text-rose-400');
                stockInfo.classList.remove('text-gray-500');
            } else {
                stockInfo.classList.remove('text-rose-400');
                stockInfo.classList.add('text-gray-500');
            }
        } else {
            stockInfo.classList.add('hidden');
        }
    }

    calcTotals();
}

// ========== CALCULATIONS ==========
function calcTotals() {
    const rows = document.querySelectorAll('.item-row');
    let subtotal = 0, totalPPN = 0, totalPPh = 0;
    rows.forEach(row => {
        const qty = parseFloat(row.querySelector('.iQty').value) || 0;
        const price = parseFloat(row.querySelector('.iPrice').value) || 0;
        const disc = parseFloat(row.querySelector('.iDisc').value) || 0;
        const discType = row.querySelector('.iDiscType').value;
        const taxSel = row.querySelector('.iTax');
        const taxRate = parseFloat(taxSel.options[taxSel.selectedIndex].dataset.rate) || 0;

        let gross = qty * price;
        let discAmt = discType === '%' ? gross * (disc / 100) : disc;
        let net = gross - discAmt;
        let taxAmt = net * Math.abs(taxRate);
        if (taxRate > 0) totalPPN += taxAmt;
        if (taxRate < 0) totalPPh += taxAmt;
        let lineTotal = taxRate >= 0 ? net + taxAmt : net - taxAmt;

        row.querySelector('.iLineTotal').innerText = formatRp(lineTotal);
        subtotal += net;
    });

    const discInv = parseFloat(document.getElementById('fDiscInv').value) || 0;
    const discInvType = document.getElementById('fDiscInvType').value;
    const discInvAmt = discInvType === '%' ? subtotal * (discInv / 100) : discInv;
    const shipping = parseFloat(document.getElementById('fShipping').value) || 0;
    const txFee = parseFloat(document.getElementById('fTxFee').value) || 0;
    const potongan = parseFloat(document.getElementById('fPotongan').value) || 0;
    const dp = parseFloat(document.getElementById('fDP').value) || 0;

    const grandTotal = subtotal - discInvAmt + totalPPN - totalPPh + shipping + txFee;
    const sisa = grandTotal - potongan - dp;

    document.getElementById('lblSub').innerText = formatRp(subtotal);
    document.getElementById('lblPPN').innerText = formatRp(totalPPN - totalPPh);
    document.getElementById('lblTotal').innerText = formatRp(grandTotal);
    document.getElementById('lblSisa').innerText = formatRp(Math.max(0, sisa));

    // Show DP account selector
    document.getElementById('dpAccountRow').classList.toggle('hidden', dp <= 0);

    // Store for save
    window._calcData = { subtotal, discInvAmt, discInvType, totalPPN, totalPPh, shipping, txFee, grandTotal, potongan, dp, sisa: Math.max(0, sisa) };
}

// ========== SAVE INVOICE ==========
function doSaveInvoice() {
    try {
        const custSel = document.getElementById('fCustomer');
        const custId = custSel.value;
        const custName = custSel.options[custSel.selectedIndex]?.text || '';

        const items = [];
        document.querySelectorAll('.item-row').forEach(row => {
            const prodSel = row.querySelector('.iProd');
            if (!prodSel.value) return;
            items.push({
                productId: prodSel.value,
                name: prodSel.options[prodSel.selectedIndex].text,
                desc: row.querySelector('.iDesc').value,
                qty: parseFloat(row.querySelector('.iQty').value) || 0,
                unit: row.querySelector('.iUnit').value,
                price: parseFloat(row.querySelector('.iPrice').value) || 0,
                discType: row.querySelector('.iDiscType').value,
                disc: parseFloat(row.querySelector('.iDisc').value) || 0,
                taxId: row.querySelector('.iTax').value,
                taxAmt: 0,
                lineTotal: 0,
            });
        });

        const c = window._calcData || {};
        const dpAccSel = document.getElementById('fDPAccount');

        const inv = saveInvoice({
            customerId: custId, customerName: custName,
            date: document.getElementById('fInvDate').value,
            dueDate: document.getElementById('fDueDate').value,
            termin: document.getElementById('fTermin').value,
            ref: document.getElementById('fRef').value,
            tag: Array.from(document.querySelectorAll('.tagCheck:checked')).map(c => c.value).join(', '),
            items, subtotal: c.subtotal || 0,
            discInvoice: parseFloat(document.getElementById('fDiscInv').value) || 0,
            discInvoiceType: document.getElementById('fDiscInvType').value,
            shipping: c.shipping || 0, txFee: c.txFee || 0,
            totalPPN: c.totalPPN || 0, totalPPh: c.totalPPh || 0,
            grandTotal: c.grandTotal || 0, potongan: c.potongan || 0,
            dp: c.dp || 0,
            dpAccount: c.dp > 0 ? dpAccSel.value : '',
            dpAccountName: c.dp > 0 ? dpAccSel.options[dpAccSel.selectedIndex].text : '',
            sisaTagihan: c.sisa || 0,
            message: document.getElementById('fMessage').value,
            note: document.getElementById('fNote').value,
        });

        alert(`✅ Invoice ${inv.id} berhasil disimpan!\nToken dipotong: 1`);
        openDetail(inv.id);
    } catch (e) {
        alert('⚠️ ' + e.message);
    }
}

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', () => {
    // Clear data lama dari versi sebelumnya (v1)
    if (localStorage.getItem('vitta_invoices') && !localStorage.getItem('vitta_invoices_v2_migrated')) {
        localStorage.removeItem('vitta_invoices');
        localStorage.setItem('vitta_invoices_v2_migrated', '1');
    }
    renderList();
});
