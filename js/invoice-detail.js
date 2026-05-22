// ========== DETAIL VIEW ==========
function openDetail(invId) {
    const inv = getInvoiceById(invId);
    if (!inv) { alert('Invoice tidak ditemukan.'); return; }
    addAudit('INVOICE_VIEWED', invId, `Invoice ${invId} dilihat.`);

    const itemRows = (inv.items||[]).map((it,i) => `<tr class="border-b border-dark-700/50"><td class="py-2 pr-2 text-white">${i+1}</td><td class="py-2 pr-2 text-white">${it.name}</td><td class="py-2 pr-2 text-center">${it.qty}</td><td class="py-2 pr-2 text-center">${it.unit}</td><td class="py-2 pr-2 text-right">${formatRp(it.price)}</td><td class="py-2 pr-2 text-right">${it.disc>0?(it.discType==='%'?it.disc+'%':formatRp(it.disc)):'-'}</td><td class="py-2 text-right font-medium">${formatRp(it.lineTotal||(it.qty*it.price))}</td></tr>`).join('');

    const payRows = (inv.payments||[]).map(p => `<tr class="border-b border-dark-700/50"><td class="py-2 pr-2 text-white font-medium">${p.id}</td><td class="py-2 pr-2">${formatDate(p.date)}</td><td class="py-2 pr-2">${p.bankName}</td><td class="py-2 pr-2 text-right text-emerald-400 font-medium">${formatRp(p.amount)}</td><td class="py-2 pr-2 text-right">${p.potongan>0?formatRp(p.potongan):'-'}</td><td class="py-2 pr-2 text-xs">${p.ref||'-'}</td><td class="py-2 text-center"><button onclick="printPaymentReceipt('${inv.id}','${p.id}')" class="text-blue-400 hover:text-blue-300 text-xs">🖨️ Cetak</button></td></tr>`).join('') || '<tr><td colspan="7" class="py-4 text-center text-gray-500">Belum ada pembayaran.</td></tr>';

    const journals = loadData(KEYS.journals).filter(j => j.refId === invId || (inv.payments||[]).some(p => p.id === j.refId));
    const jrnRows = journals.map(j => {
        const lines = j.lines.map(l => `<div class="flex justify-between text-xs py-0.5 ${l.debit>0?'':'pl-6'}"><span>${l.debit>0?'':'— '}${l.accountName}</span><span>${l.debit>0?formatRp(l.debit):''} ${l.credit>0?formatRp(l.credit):''}</span></div>`).join('');
        return `<div class="bg-dark-900/50 p-3 rounded-lg border border-dark-700"><div class="flex justify-between mb-1"><span class="text-xs font-medium text-white">${j.memo}</span><span class="text-xs text-gray-500">${formatDate(j.date)}</span></div>${lines}</div>`;
    }).join('') || '<p class="text-gray-500 text-sm">Tidak ada jurnal.</p>';

    const logs = loadData(KEYS.auditLog).filter(l => l.refId===invId||(inv.payments||[]).some(p=>p.id===l.refId));
    const logRows = logs.slice(0,15).map(l => `<div class="flex gap-2 text-xs py-1 border-b border-dark-700/30"><span class="text-gray-500 whitespace-nowrap">${new Date(l.timestamp).toLocaleString('id-ID')}</span><span class="text-gray-300">${l.detail}</span></div>`).join('');

    const canPay = inv.status!=='lunas' && inv.status!=='void' && inv.sisaTagihan>0;
    const canAction = inv.status!=='void';

    document.getElementById('detailContent').innerHTML = `
    <div class="bg-dark-800 border border-dark-700 rounded-2xl shadow-xl overflow-hidden">
        <!-- Header with combos -->
        <div class="p-5 border-b border-dark-700">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-3">
                <div><h2 class="text-lg font-bold text-white">${inv.id}</h2><p class="text-sm text-gray-400">${inv.customerName}</p></div>
                ${badge(inv.status)}
            </div>
            <div class="flex flex-wrap gap-2">
                <!-- Tombol View ke Dasbor -->
                <button onclick="showView('list')" class="bg-dark-700 hover:bg-dark-600 text-gray-300 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>Daftar Invoice</button>
                ${canPay?`<button onclick="openPayment('${inv.id}')" class="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium">💰 Terima Pembayaran</button>`:''}
                <!-- Combo Bagikan -->
                <div class="relative" id="shareDropdown">
                    <button onclick="toggleDropdown('shareMenu')" class="bg-dark-700 hover:bg-dark-600 text-gray-300 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1">📤 Bagikan <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg></button>
                    <div id="shareMenu" class="hidden absolute top-full left-0 mt-1 bg-dark-700 border border-dark-600 rounded-lg shadow-xl z-20 min-w-[180px]">
                        <button onclick="copyInvoiceLink('${inv.id}');closeDropdowns()" class="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-dark-600 rounded-t-lg">📋 Salin Teks Invoice</button>
                        <button onclick="sendToWA('${inv.id}');closeDropdowns()" class="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-dark-600 rounded-b-lg">💬 Kirim ke WhatsApp</button>
                    </div>
                </div>
                <!-- Combo Print -->
                <div class="relative" id="printDropdown">
                    <button onclick="toggleDropdown('printMenu')" class="bg-dark-700 hover:bg-dark-600 text-gray-300 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1">🖨️ Cetak <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg></button>
                    <div id="printMenu" class="hidden absolute top-full left-0 mt-1 bg-dark-700 border border-dark-600 rounded-lg shadow-xl z-20 min-w-[200px]">
                        <button onclick="printInvoicePDF('${inv.id}');closeDropdowns()" class="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-dark-600 rounded-t-lg">📄 Invoice (Print/PDF)</button>
                        <button onclick="printSuratJalan('${inv.id}');closeDropdowns()" class="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-dark-600 rounded-b-lg">🚚 Surat Jalan (Print/PDF)</button>
                    </div>
                </div>
                <!-- Combo Tindakan -->
                ${canAction?`<div class="relative" id="actionDropdown">
                    <button onclick="toggleDropdown('actionMenu')" class="bg-dark-700 hover:bg-dark-600 text-gray-300 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1">⚙️ Tindakan <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg></button>
                    <div id="actionMenu" class="hidden absolute top-full right-0 mt-1 bg-dark-700 border border-dark-600 rounded-lg shadow-xl z-20 min-w-[160px]">
                        <button onclick="returInvoice('${inv.id}');closeDropdowns()" class="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-dark-600 rounded-t-lg">🔄 Retur</button>
                        <button onclick="voidInvoice('${inv.id}');openDetail('${inv.id}');closeDropdowns()" class="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-dark-600">🚫 Void</button>
                        <button onclick="alert('Fitur ubah akan tersedia segera.');closeDropdowns()" class="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-dark-600">✏️ Ubah</button>
                        <button onclick="deleteInvoice('${inv.id}');closeDropdowns()" class="w-full text-left px-3 py-2 text-xs text-rose-400 hover:bg-dark-600 rounded-b-lg">🗑️ Hapus</button>
                    </div>
                </div>`:''}
            </div>
        </div>

        <!-- Info -->
        <div class="p-5 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm border-b border-dark-700 bg-dark-900/30">
            <div><span class="text-gray-500 text-xs block">Tanggal</span><span class="text-white">${formatDate(inv.date)}</span></div>
            <div><span class="text-gray-500 text-xs block">Jatuh Tempo</span><span class="text-white">${formatDate(inv.dueDate)}</span></div>
            <div><span class="text-gray-500 text-xs block">Termin</span><span class="text-white">Net ${inv.termin} Hari</span></div>
            <div><span class="text-gray-500 text-xs block">Tag</span><span class="text-white">${inv.tag||'-'}</span></div>
        </div>

        <!-- Items -->
        <div class="p-5 border-b border-dark-700">
            <h3 class="text-sm font-semibold text-gray-300 mb-2">Detail Item</h3>
            <div class="overflow-x-auto"><table class="w-full text-sm text-gray-300"><thead class="text-xs text-gray-400 uppercase border-b border-dark-700"><tr><th class="py-1 pr-2 w-8">#</th><th class="py-1 pr-2">Produk</th><th class="py-1 pr-2 text-center">Qty</th><th class="py-1 pr-2 text-center">Satuan</th><th class="py-1 pr-2 text-right">Harga</th><th class="py-1 pr-2 text-right">Diskon</th><th class="py-1 text-right">Jumlah</th></tr></thead><tbody>${itemRows}</tbody></table></div>
        </div>

        <!-- Totals -->
        <div class="p-5 border-b border-dark-700 flex justify-end">
            <div class="w-full md:w-72 space-y-1 text-sm">
                <div class="flex justify-between"><span class="text-gray-400">Subtotal</span><span class="text-white">${formatRp(inv.subtotal)}</span></div>
                ${inv.shipping>0?`<div class="flex justify-between"><span class="text-gray-400">Pengiriman</span><span class="text-white">${formatRp(inv.shipping)}</span></div>`:''}
                ${inv.totalPPN>0?`<div class="flex justify-between"><span class="text-gray-400">PPN</span><span class="text-white">${formatRp(inv.totalPPN)}</span></div>`:''}
                <div class="flex justify-between border-t border-dark-700 pt-1"><span class="text-white font-bold">Total</span><span class="text-blue-400 font-bold text-lg">${formatRp(inv.grandTotal)}</span></div>
                ${inv.dp>0?`<div class="flex justify-between"><span class="text-gray-400">Uang Muka</span><span class="text-emerald-400">${formatRp(inv.dp)}</span></div>`:''}
                <div class="flex justify-between"><span class="text-gray-400">Total Dibayar</span><span class="text-emerald-400">${formatRp(inv.totalPaid)}</span></div>
                <div class="flex justify-between bg-blue-500/10 p-2 rounded border border-blue-500/20 mt-1"><span class="text-blue-300 font-medium">Sisa Tagihan</span><span class="text-blue-400 font-bold">${formatRp(inv.sisaTagihan)}</span></div>
            </div>
        </div>

        <!-- Payments -->
        <div class="p-5 border-b border-dark-700">
            <h3 class="text-sm font-semibold text-gray-300 mb-2">Riwayat Pembayaran</h3>
            <div class="overflow-x-auto"><table class="w-full text-sm text-gray-300"><thead class="text-xs text-gray-400 uppercase border-b border-dark-700"><tr><th class="py-1 pr-2">No</th><th class="py-1 pr-2">Tanggal</th><th class="py-1 pr-2">Akun</th><th class="py-1 pr-2 text-right">Jumlah</th><th class="py-1 pr-2 text-right">Potongan</th><th class="py-1 pr-2">Ref</th><th class="py-1 text-center">Cetak</th></tr></thead><tbody>${payRows}</tbody></table></div>
        </div>

        <!-- Journals -->
        <div class="p-5 border-b border-dark-700"><h3 class="text-sm font-semibold text-gray-300 mb-2">Jurnal Otomatis</h3><div class="space-y-2">${jrnRows}</div></div>
        <!-- Audit -->
        <div class="p-5"><h3 class="text-sm font-semibold text-gray-300 mb-2">Log & Audit</h3><div class="max-h-32 overflow-y-auto">${logRows||'<p class="text-gray-500 text-sm">Tidak ada log.</p>'}</div></div>
    </div>`;

    showView('detail');
}

// ========== DROPDOWN HELPER ==========
function toggleDropdown(menuId) {
    closeDropdowns(menuId);
    document.getElementById(menuId).classList.toggle('hidden');
}
function closeDropdowns(except) {
    ['shareMenu','printMenu','actionMenu'].forEach(id => { if(id!==except){ const el=document.getElementById(id); if(el) el.classList.add('hidden'); }});
}
document.addEventListener('click', function(e) {
    if (!e.target.closest('#shareDropdown') && !e.target.closest('#printDropdown') && !e.target.closest('#actionDropdown')) closeDropdowns();
});

// ========== PAYMENT FORM ==========
function openPayment(invId) {
    window._payInvId = invId;
    const inv = getInvoiceById(invId);
    if (!inv) return;
    
    let bankOptsList = DB.bankAccounts;
    if (typeof getKasBankAccounts === 'function') {
        bankOptsList = getKasBankAccounts();
    }
    const bankOpts = bankOptsList.map(b => `<option value="${b.code}" data-name="${b.name}">${b.name}</option>`).join('');

    document.getElementById('payContent').innerHTML = `
    <div class="bg-dark-800 border border-dark-700 rounded-2xl shadow-xl overflow-hidden">
        <div class="p-5 border-b border-dark-700">
            <h2 class="text-lg font-bold text-white">Terima Pembayaran</h2>
            <p class="text-sm text-gray-400">${inv.id} — ${inv.customerName} — Sisa: <span class="text-orange-400 font-bold">${formatRp(inv.sisaTagihan)}</span></p>
        </div>
        <div class="p-5 space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label class="block text-xs text-gray-400 mb-1">No Pembayaran</label><input type="text" id="pPayNo" class="w-full" value="AUTO" readonly></div>
                <div><label class="block text-xs text-gray-400 mb-1">Tanggal</label><input type="date" id="pDate" class="w-full" value="${today()}"></div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label class="block text-xs text-gray-400 mb-1">Dibayar ke Akun *</label><select id="pBank" class="w-full">${bankOpts}</select></div>
                <div><label class="block text-xs text-gray-400 mb-1">Referensi</label><input type="text" id="pRef" class="w-full" placeholder="No. Transfer"></div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label class="block text-xs text-gray-400 mb-1">Total Dibayar *</label><input type="number" id="pAmount" class="w-full text-lg font-bold text-emerald-400" value="${inv.sisaTagihan}"></div>
                <div><label class="block text-xs text-gray-400 mb-1">Pemotongan</label><input type="number" id="pPotongan" class="w-full" value="0" oninput="calcPayTotal()"></div>
            </div>
            <div class="bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20 flex justify-between">
                <span class="text-emerald-300 font-medium">Total Pelunasan</span>
                <span class="text-emerald-400 font-bold text-xl" id="lblPayTotal">${formatRp(inv.sisaTagihan)}</span>
            </div>
        </div>
        <div class="p-5 border-t border-dark-700 flex justify-end gap-3">
            <button onclick="openDetail('${invId}')" class="px-4 py-2 rounded-lg text-sm text-gray-300 hover:bg-dark-700">Batal</button>
            <button onclick="doRecordPayment('${invId}')" class="px-5 py-2 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg flex items-center">✅ Simpan Pembayaran</button>
        </div>
    </div>`;
    showView('pay');
}

function calcPayTotal() {
    const a = parseFloat(document.getElementById('pAmount').value)||0;
    const p = parseFloat(document.getElementById('pPotongan').value)||0;
    document.getElementById('lblPayTotal').innerText = formatRp(a+p);
}

function doRecordPayment(invId) {
    try {
        const bankSel = document.getElementById('pBank');
        const amt = parseFloat(document.getElementById('pAmount').value)||0;
        const pot = parseFloat(document.getElementById('pPotongan').value)||0;
        if (amt <= 0) { alert('⚠️ Jumlah harus > 0.'); return; }

        const payData = {
            amount: amt, potongan: pot,
            date: document.getElementById('pDate').value,
            bankCode: bankSel.value,
            bankName: bankSel.options[bankSel.selectedIndex].text,
            ref: document.getElementById('pRef').value,
        };

        const inv = recordPayment(invId, payData);
        const lastPay = inv.payments[inv.payments.length - 1];

        // Tampilkan bukti bayar, bukan langsung ke detail
        showPaymentReceipt(invId, lastPay);
    } catch (e) {
        alert('⚠️ ' + e.message);
    }
}

// ========== BUKTI BAYAR VIEW ==========
function showPaymentReceipt(invId, pay) {
    const inv = getInvoiceById(invId);
    if (!inv) return;

    document.getElementById('payContent').innerHTML = `
    <div class="bg-dark-800 border border-dark-700 rounded-2xl shadow-xl overflow-hidden">
        <div class="p-5 border-b border-dark-700 bg-emerald-500/5">
            <div class="flex items-center gap-2 mb-1"><span class="text-2xl">✅</span><h2 class="text-lg font-bold text-emerald-400">Pembayaran Berhasil Dicatat</h2></div>
            <p class="text-sm text-gray-400">Jurnal otomatis telah terbentuk.</p>
        </div>
        <div class="p-5 space-y-3">
            <div class="grid grid-cols-2 gap-3 text-sm">
                <div><span class="text-gray-500 text-xs block">No. Pembayaran</span><span class="text-white font-medium">${pay.id}</span></div>
                <div><span class="text-gray-500 text-xs block">Untuk Invoice</span><span class="text-white font-medium">${invId}</span></div>
                <div><span class="text-gray-500 text-xs block">Pelanggan</span><span class="text-white">${inv.customerName}</span></div>
                <div><span class="text-gray-500 text-xs block">Tanggal Bayar</span><span class="text-white">${formatDate(pay.date)}</span></div>
                <div><span class="text-gray-500 text-xs block">Dibayar ke</span><span class="text-white">${pay.bankName}</span></div>
                <div><span class="text-gray-500 text-xs block">Referensi</span><span class="text-white">${pay.ref||'-'}</span></div>
            </div>
            <div class="bg-dark-900/50 p-4 rounded-xl border border-dark-700 space-y-2">
                <div class="flex justify-between text-sm"><span class="text-gray-400">Jumlah Bayar</span><span class="text-emerald-400 font-bold text-lg">${formatRp(pay.amount)}</span></div>
                ${pay.potongan>0?`<div class="flex justify-between text-sm"><span class="text-gray-400">Potongan</span><span class="text-white">${formatRp(pay.potongan)}</span></div>`:''}
                <div class="flex justify-between text-sm border-t border-dark-700 pt-2"><span class="text-gray-400">Sisa Tagihan</span><span class="text-blue-400 font-bold">${formatRp(inv.sisaTagihan)}</span></div>
                <div class="flex justify-between text-sm"><span class="text-gray-400">Status</span>${badge(inv.status)}</div>
            </div>
        </div>
        <div class="p-5 border-t border-dark-700 flex flex-wrap gap-2 justify-end">
            <button onclick="printPaymentReceipt('${invId}','${pay.id}')" class="bg-dark-700 hover:bg-dark-600 text-gray-300 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1">🖨️ Cetak Bukti Bayar</button>
            <button onclick="openDetail('${invId}')" class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium">Lihat Detail Invoice</button>
        </div>
    </div>`;
    // Stay on pay view to show receipt
}
