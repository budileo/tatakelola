/**
 * VITTA ERP - Invoice Engine (Penjualan)
 * Supabase SaaS Database Query Manager
 */

// ========== CONFIG & STATIC DATA ==========
const DB = {
    taxOptions: [
        { id: 'none', label: 'Tanpa Pajak', rate: 0 },
        { id: 'ppn11', label: 'PPN 11%', rate: 0.11 },
        { id: 'pph23_2', label: 'PPh 23 (2%)', rate: -0.02 },
        { id: 'ppn_pph', label: 'PPN 11% + PPh 23', rate: 0.09 },
    ],
    tags: ['Reguler', 'Proyek', 'Tender', 'Konsinyasi', 'Repeat Order', 'Urgent'],
    coa: {
        piutang: { code: '1-10100', name: 'Piutang Usaha' },
        pendapatan: { code: '4-40000', name: 'Pendapatan Penjualan' },
        utangPPN: { code: '2-20200', name: 'Hutang PPN Keluaran' },
        utangPPh: { code: '2-20300', name: 'Hutang PPh 23' },
        uangMuka: { code: '2-20400', name: 'Uang Muka Pelanggan' },
        bebanPotongan: { code: '6-60200', name: 'Beban Potongan Penjualan' },
    }
};

// ========== HELPERS ==========
var formatRp = formatRp || ((n) => 'Rp ' + Math.round(n).toLocaleString('id-ID'));
var formatDate = formatDate || ((d) => {
    if (!d) return '-';
    const dt = new Date(d);
    return dt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
});
var today = today || (() => new Date().toISOString().split('T')[0]);
var now = now || (() => new Date().toISOString());

// State Cache
window.cachedInvoices = [];

async function getNextInvNo() {
    // A simple generator logic based on count
    const { data } = await readRecords('akt_invoices');
    let c = (data ? data.length : 0) + 1;
    const d = new Date();
    return `INV/${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(c).padStart(4, '0')}`;
}

async function getNextPayNo() {
    let c = 1;
    if (window.cachedInvoices) {
        window.cachedInvoices.forEach(inv => {
            c += (inv.payments ? inv.payments.length : 0);
        });
    }
    const d = new Date();
    return `PAY/${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(c).padStart(4, '0')}`;
}

// ========== AUDIT LOG (Tetap LocalStorage untuk kesederhanaan / non-critical) ==========
function addAudit(action, refId, detail) {
    const key = 'vitta_audit_log';
    const raw = localStorage.getItem(key);
    const logs = raw ? JSON.parse(raw) : [];
    logs.unshift({
        id: 'LOG-' + Date.now(),
        action, refId, detail,
        user: 'User Perusahaan',
        timestamp: now(),
    });
    if (logs.length > 500) logs.length = 500;
    localStorage.setItem(key, JSON.stringify(logs));
}

// ========== JOURNAL ENGINE ==========
async function createJournalEntry(date, memo, lines, refId) {
    if (window.recordJournalAsync) {
        return await window.recordJournalAsync({
            date: date,
            memo: memo,
            lines: lines,
            refId: refId,
            type: 'SALES_INVOICE'
        });
    } else {
        // Fallback save to supabase journals
        const entry = {
            date, memo, lines, ref_id: refId,
            type: 'SALES_INVOICE',
            status: 'posted'
        };
        await insertRecord('akt_journals', entry);
        return entry;
    }
}

// ========== INVOICE CRUD (SUPABASE) ==========

async function getInvoices() {
    const { data, error } = await readRecords('akt_invoices', {}, { order: { column: 'created_at', ascending: false }});
    if (error) {
        console.error("Error fetching invoices:", error);
        return [];
    }
    // Convert to application format
    window.cachedInvoices = data.map(dbInv => ({
        id: dbInv.invoice_no,
        dbId: dbInv.id,
        customerId: dbInv.customer_id,
        customerName: dbInv.customer_name,
        date: dbInv.date,
        dueDate: dbInv.due_date,
        termin: dbInv.termin,
        ref: dbInv.ref,
        tag: dbInv.tag,
        items: dbInv.items,
        subtotal: Number(dbInv.subtotal),
        discInvoice: Number(dbInv.disc_invoice),
        discInvoiceType: dbInv.disc_invoice_type,
        shipping: Number(dbInv.shipping),
        txFee: Number(dbInv.tx_fee),
        totalPPN: Number(dbInv.total_ppn),
        totalPPh: Number(dbInv.total_pph),
        grandTotal: Number(dbInv.grand_total),
        potongan: Number(dbInv.potongan),
        dp: Number(dbInv.dp),
        dpAccount: dbInv.dp_account,
        dpAccountName: dbInv.dp_account_name,
        sisaTagihan: Number(dbInv.sisa_tagihan),
        totalPaid: Number(dbInv.total_paid),
        status: dbInv.status,
        note: dbInv.note,
        message: dbInv.message,
        payments: dbInv.payments || [],
        createdAt: dbInv.created_at
    }));
    return window.cachedInvoices;
}

async function getInvoiceById(id) {
    if (!window.cachedInvoices || window.cachedInvoices.length === 0) {
        await getInvoices();
    }
    return window.cachedInvoices.find(inv => inv.id === id);
}

async function saveInvoice(invData) {
    if (!invData.customerId) throw new Error('Pilih pelanggan terlebih dahulu.');
    if (!invData.items || invData.items.length === 0) throw new Error('Tambahkan minimal 1 item produk.');
    if (invData.grandTotal <= 0) throw new Error('Total invoice tidak boleh 0.');

    invData.id = await getNextInvNo();
    invData.payments = [];
    invData.totalPaid = 0;

    invData.sisaTagihan = invData.grandTotal - (invData.potongan || 0) - (invData.dp || 0);
    if (invData.sisaTagihan < 0) invData.sisaTagihan = 0;

    if (invData.dp > 0) {
        invData.totalPaid = invData.dp;
        invData.status = invData.sisaTagihan <= 0 ? 'lunas' : 'sebagian';
    } else {
        invData.status = 'belum';
    }

    // Save to Supabase
    const payload = {
        invoice_no: invData.id,
        customer_id: invData.customerId,
        customer_name: invData.customerName,
        date: invData.date,
        due_date: invData.dueDate,
        termin: invData.termin,
        ref: invData.ref,
        tag: invData.tag,
        items: invData.items,
        subtotal: invData.subtotal,
        disc_invoice: invData.discInvoice,
        disc_invoice_type: invData.discInvoiceType,
        shipping: invData.shipping,
        tx_fee: invData.txFee,
        total_ppn: invData.totalPPN,
        total_pph: invData.totalPPh,
        grand_total: invData.grandTotal,
        potongan: invData.potongan,
        dp: invData.dp,
        dp_account: invData.dpAccount,
        dp_account_name: invData.dpAccountName,
        sisa_tagihan: invData.sisaTagihan,
        total_paid: invData.totalPaid,
        status: invData.status,
        note: invData.note,
        message: invData.message,
        payments: invData.payments
    };

    const { data, error } = await insertRecord('akt_invoices', payload);
    if (error) throw new Error(error.message);

    invData.dbId = data.id;

    // === AUTO JOURNAL ===
    const piutangCode = DB.coa.piutang.code;
    const piutangName = DB.coa.piutang.name;
    const pendapatanCode = DB.coa.pendapatan.code;
    const pendapatanName = DB.coa.pendapatan.name;

    const jLines = [];
    jLines.push({ account: piutangCode, accountName: piutangName, debit: invData.grandTotal, credit: 0 });
    
    let totalPendapatan = invData.subtotal;
    jLines.push({ account: pendapatanCode, accountName: pendapatanName, debit: 0, credit: totalPendapatan });

    if (invData.totalPPN > 0) {
        jLines.push({ account: DB.coa.utangPPN.code, accountName: DB.coa.utangPPN.name, debit: 0, credit: invData.totalPPN });
    }

    const extraPendapatan = (invData.shipping || 0) + (invData.txFee || 0);
    if (extraPendapatan > 0) {
        jLines.push({ account: pendapatanCode, accountName: pendapatanName, debit: 0, credit: extraPendapatan });
    }

    let totalCOGS = 0;
    // For Stock Movement integration
    if (window.VittaProduk && typeof window.VittaProduk.processStockMovementAsync === 'function') {
        for (const item of invData.items) {
            if (item.productId) {
                // Not fully async integrated yet but try
            }
        }
    }

    await createJournalEntry(invData.date, `Invoice Penjualan ${invData.id} - ${invData.customerName}`, jLines, invData.id);

    if (invData.dp > 0) {
        const dpLines = [
            { account: invData.dpAccount || '1-10002', accountName: invData.dpAccountName || 'Bank', debit: invData.dp, credit: 0 },
            { account: piutangCode, accountName: piutangName, debit: 0, credit: invData.dp },
        ];
        await createJournalEntry(invData.date, `DP Invoice ${invData.id} - ${invData.customerName}`, dpLines, invData.id);
    }

    addAudit('INVOICE_CREATED', invData.id, `Invoice ${invData.id} dibuat. Total: ${formatRp(invData.grandTotal)}`);
    return invData;
}

async function recordPayment(invoiceId, payData) {
    const inv = await getInvoiceById(invoiceId);
    if (!inv) throw new Error('Invoice tidak ditemukan.');

    payData.id = await getNextPayNo();
    payData.createdAt = now();
    payData.createdBy = 'User Perusahaan';

    if (!inv.payments) inv.payments = [];
    inv.payments.push(payData);

    let totalPaid = (inv.dp || 0);
    inv.payments.forEach(p => {
        totalPaid += (p.amount || 0) + (p.potongan || 0);
    });
    inv.totalPaid = totalPaid;

    const baseAmount = inv.grandTotal - (inv.potongan || 0);
    const remaining = baseAmount - totalPaid;
    inv.sisaTagihan = Math.max(0, remaining);

    if (inv.sisaTagihan <= 0) {
        inv.status = 'lunas';
        inv.sisaTagihan = 0;
    } else {
        inv.status = 'sebagian';
    }

    // Update to Supabase
    const payload = {
        payments: inv.payments,
        total_paid: inv.totalPaid,
        sisa_tagihan: inv.sisaTagihan,
        status: inv.status
    };

    const { error } = await updateRecord('akt_invoices', inv.dbId, payload);
    if (error) throw new Error(error.message);

    // === AUTO JOURNAL ===
    const jLines = [];
    jLines.push({ account: payData.bankCode, accountName: payData.bankName, debit: payData.amount, credit: 0 });
    if (payData.potongan > 0) {
        jLines.push({ account: DB.coa.bebanPotongan.code, accountName: DB.coa.bebanPotongan.name, debit: payData.potongan, credit: 0 });
    }
    const totalKredit = payData.amount + (payData.potongan || 0);
    jLines.push({ account: DB.coa.piutang.code, accountName: DB.coa.piutang.name, debit: 0, credit: totalKredit });

    await createJournalEntry(payData.date, `Pembayaran ${payData.id} untuk ${invoiceId}`, jLines, payData.id);

    addAudit('PAYMENT_RECORDED', payData.id, `Pembayaran ${formatRp(payData.amount)} untuk ${invoiceId}. Sisa: ${formatRp(inv.sisaTagihan)}`);
    return inv;
}

async function voidInvoice(invoiceId) {
    const inv = await getInvoiceById(invoiceId);
    if (!inv) return;

    const { error } = await updateRecord('akt_invoices', inv.dbId, { status: 'void' });
    if (error) throw new Error(error.message);

    inv.status = 'void';
    addAudit('INVOICE_VOIDED', invoiceId, `Invoice ${invoiceId} dibatalkan (void).`);
}

// ========== STATUS UPDATER ==========
async function refreshStatuses() {
    const invoices = await getInvoices();
    const todayStr = today();
    let changed = false;
    for (const inv of invoices) {
        if (inv.status === 'lunas' || inv.status === 'void' || inv.status === 'retur') continue;
        if (inv.dueDate && inv.dueDate < todayStr && inv.sisaTagihan > 0) {
            if (inv.status !== 'jatuh_tempo') { 
                inv.status = 'jatuh_tempo'; 
                await updateRecord('akt_invoices', inv.dbId, { status: 'jatuh_tempo' });
                changed = true; 
            }
        }
    }
    return invoices;
}

// MOCK getKasBankAccounts (If not present globally)
async function getDynamicKasBankAccounts() {
    const { data, error } = await readRecords('akt_coa_accounts', { "group": "Kas & Bank" });
    if (error || !data) return [];
    return data.map(d => ({ code: d.code, name: d.name }));
}

async function getDynamicProducts() {
    const { data, error } = await readRecords('akt_products', { is_sold: true });
    if (error || !data) return [];
    return data.map(d => ({ id: d.id, name: d.name, price: d.sell_price, unit: d.unit, stock: d.current_stock, tracked: d.is_tracked }));
}

async function getDynamicCustomers() {
    const { data, error } = await readRecords('akt_contacts');
    if (error || !data) return [];
    return data.filter(c => c.type === 'Customer' || c.type === 'Keduanya').map(c => ({ id: c.id, name: c.name }));
}
