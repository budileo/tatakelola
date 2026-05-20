/**
 * VITTA ERP - Invoice Engine (Penjualan)
 * Double-Entry Accounting + LocalStorage
 */

// ========== MOCK DATABASE ==========
const DB = {
    customers: [
        { id: 'C001', name: 'PT Teknologi Maju', address: 'Jl. Sudirman No. 10, Jakarta', phone: '021-5551234' },
        { id: 'C002', name: 'CV Makmur Jaya', address: 'Jl. Gatot Subroto No. 5, Bandung', phone: '022-7771234' },
        { id: 'C003', name: 'Toko Sinar', address: 'Jl. Ahmad Yani No. 88, Surabaya', phone: '031-3331234' },
        { id: 'C004', name: 'PT Bumi Persada', address: 'Jl. Diponegoro No. 22, Semarang', phone: '024-8881234' },
        { id: 'C005', name: 'UD Harmoni', address: 'Jl. Imam Bonjol No. 15, Medan', phone: '061-4441234' },
    ],
    products: [
        { id: 'P001', name: 'Laptop Asus TUF Gaming', price: 14500000, unit: 'Unit' },
        { id: 'P002', name: 'Mouse Wireless Logitech M331', price: 285000, unit: 'Pcs' },
        { id: 'P003', name: 'Monitor LED 24" Samsung', price: 2750000, unit: 'Unit' },
        { id: 'P004', name: 'Keyboard Mechanical Rexus', price: 450000, unit: 'Pcs' },
        { id: 'P005', name: 'SSD NVMe 512GB Samsung', price: 950000, unit: 'Pcs' },
        { id: 'P006', name: 'Printer Epson L3250', price: 3200000, unit: 'Unit' },
        { id: 'P007', name: 'Webcam Logitech C920', price: 1350000, unit: 'Pcs' },
        { id: 'P008', name: 'Jasa Instalasi Jaringan', price: 2500000, unit: 'Paket' },
    ],
    coa: {
        piutang: { code: '1-10100', name: 'Piutang Usaha' },
        pendapatan: { code: '4-40000', name: 'Pendapatan Penjualan' },
        kas: { code: '1-10001', name: 'Kas Kecil' },
        bankBCA: { code: '1-10002', name: 'Bank BCA' },
        bankMandiri: { code: '1-10003', name: 'Bank Mandiri' },
        utangPPN: { code: '2-20200', name: 'Hutang PPN Keluaran' },
        utangPPh: { code: '2-20300', name: 'Hutang PPh 23' },
        uangMuka: { code: '2-20400', name: 'Uang Muka Pelanggan' },
        bebanPotongan: { code: '6-60200', name: 'Beban Potongan Penjualan' },
    },
    bankAccounts: [
        { code: '1-10001', name: 'Kas Kecil' },
        { code: '1-10002', name: 'Bank BCA' },
        { code: '1-10003', name: 'Bank Mandiri' },
    ],
    taxOptions: [
        { id: 'none', label: 'Tanpa Pajak', rate: 0 },
        { id: 'ppn11', label: 'PPN 11%', rate: 0.11 },
        { id: 'pph23_2', label: 'PPh 23 (2%)', rate: -0.02 },
        { id: 'ppn_pph', label: 'PPN 11% + PPh 23', rate: 0.09 },
    ],
    tags: ['Reguler', 'Proyek', 'Tender', 'Konsinyasi', 'Repeat Order', 'Urgent'],
};

// ========== STORAGE KEYS ==========
const KEYS = {
    invoices: 'vitta_invoices_v2',
    payments: 'vitta_payments',
    journals: 'vitta_journals',
    auditLog: 'vitta_audit_log',
    counter: 'vitta_inv_counter',
    payCounter: 'vitta_pay_counter',
};

// ========== HELPERS ==========
const formatRp = (n) => 'Rp ' + Math.round(n).toLocaleString('id-ID');
const formatDate = (d) => {
    if (!d) return '-';
    const dt = new Date(d);
    return dt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};
const today = () => new Date().toISOString().split('T')[0];
const now = () => new Date().toISOString();

// Fungsi untuk mendapatkan Key khusus Departemen (Isolasi Data)
function getScopedKey(baseKey) {
    const activeDept = window.getActiveDept ? window.getActiveDept() : null;
    if (activeDept && activeDept.id) {
        return activeDept.id + '_' + baseKey;
    }
    return baseKey; // Fallback jika tidak ada departemen aktif
}

function getNextInvNo() {
    const key = getScopedKey(KEYS.counter);
    let c = parseInt(localStorage.getItem(key) || '0') + 1;
    localStorage.setItem(key, c);
    const d = new Date();
    return `INV/${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(c).padStart(4, '0')}`;
}
function getNextPayNo() {
    const key = getScopedKey(KEYS.payCounter);
    let c = parseInt(localStorage.getItem(key) || '0') + 1;
    localStorage.setItem(key, c);
    const d = new Date();
    return `PAY/${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(c).padStart(4, '0')}`;
}

// ========== STORAGE ==========
function loadData(key, fallback) {
    const scopedKey = getScopedKey(key);
    const raw = localStorage.getItem(scopedKey);
    return raw ? JSON.parse(raw) : (fallback || []);
}
function saveData(key, data) {
    const scopedKey = getScopedKey(key);
    localStorage.setItem(scopedKey, JSON.stringify(data));
}

// ========== AUDIT LOG ==========
function addAudit(action, refId, detail) {
    const logs = loadData(KEYS.auditLog);
    logs.unshift({
        id: 'LOG-' + Date.now(),
        action, refId, detail,
        user: 'User Perusahaan',
        timestamp: now(),
    });
    if (logs.length > 500) logs.length = 500;
    saveData(KEYS.auditLog, logs);
}

// ========== JOURNAL ENGINE ==========
function createJournalEntry(date, memo, lines, refId) {
    const journals = loadData(KEYS.journals);
    const entry = {
        id: 'JRN-' + Date.now(),
        date, memo, lines, refId,
        createdAt: now(),
    };
    journals.unshift(entry);
    saveData(KEYS.journals, journals);
    return entry;
}

// ========== INVOICE CRUD ==========
function initInvoiceStore() {
    const key = getScopedKey(KEYS.invoices);
    if (!localStorage.getItem(key)) {
        saveData(KEYS.invoices, getDefaultInvoices());
    }
}

function getInvoices() {
    initInvoiceStore();
    return loadData(KEYS.invoices);
}

function getInvoiceById(id) {
    return getInvoices().find(inv => inv.id === id);
}

function saveInvoice(invData) {
    // Validate
    if (!invData.customerId) throw new Error('Pilih pelanggan terlebih dahulu.');
    if (!invData.items || invData.items.length === 0) throw new Error('Tambahkan minimal 1 item produk.');
    if (invData.grandTotal <= 0) throw new Error('Total invoice tidak boleh 0.');

    const invoices = getInvoices();
    invData.id = getNextInvNo();
    invData.createdAt = now();
    invData.createdBy = 'User Perusahaan';
    invData.payments = [];
    invData.totalPaid = 0;

    // Sisa tagihan = grandTotal - potongan - dp
    invData.sisaTagihan = invData.grandTotal - (invData.potongan || 0) - (invData.dp || 0);
    if (invData.sisaTagihan < 0) invData.sisaTagihan = 0;

    // Status awal
    if (invData.dp > 0) {
        invData.totalPaid = invData.dp;
        invData.status = invData.sisaTagihan <= 0 ? 'lunas' : 'sebagian';
    } else {
        invData.status = 'belum';
    }

    invoices.unshift(invData);
    saveData(KEYS.invoices, invoices);

    // === JURNAL HANYA DIBUAT SAAT ADA PEMBAYARAN ===
    // Saat invoice dibuat, TIDAK ada jurnal otomatis.
    // Jurnal hanya terbentuk saat:
    //   1. DP dibayar (di bawah)
    //   2. Pembayaran invoice (recordPayment)

    // Jurnal DP (jika ada uang muka saat buat invoice)
    if (invData.dp > 0) {
        const dpLines = [
            { account: invData.dpAccount || DB.coa.bankBCA.code, accountName: invData.dpAccountName || DB.coa.bankBCA.name, debit: invData.dp, credit: 0 },
            { account: DB.coa.piutang.code, accountName: DB.coa.piutang.name, debit: 0, credit: invData.dp },
        ];
        createJournalEntry(invData.date, `DP Invoice ${invData.id} - ${invData.customerName}`, dpLines, invData.id);
    }

    addAudit('INVOICE_CREATED', invData.id, `Invoice ${invData.id} dibuat. Total: ${formatRp(invData.grandTotal)}`);
    return invData;
}

function recordPayment(invoiceId, payData) {
    const invoices = getInvoices();
    const idx = invoices.findIndex(inv => inv.id === invoiceId);
    if (idx === -1) throw new Error('Invoice tidak ditemukan.');

    const inv = invoices[idx];
    payData.id = getNextPayNo();
    payData.createdAt = now();
    payData.createdBy = 'User Perusahaan';

    // Tambahkan pembayaran ke daftar
    if (!inv.payments) inv.payments = [];
    inv.payments.push(payData);

    // Hitung ulang total yang sudah dibayar dari SEMUA pembayaran
    let totalPaid = (inv.dp || 0);
    inv.payments.forEach(p => {
        totalPaid += (p.amount || 0) + (p.potongan || 0);
    });
    inv.totalPaid = totalPaid;

    // Hitung sisa tagihan
    const baseAmount = inv.grandTotal - (inv.potongan || 0);
    const remaining = baseAmount - totalPaid;
    inv.sisaTagihan = Math.max(0, remaining);

    // Update status otomatis
    if (inv.sisaTagihan <= 0) {
        inv.status = 'lunas';
        inv.sisaTagihan = 0;
    } else {
        inv.status = 'sebagian';
    }

    // Simpan perubahan ke localStorage
    saveData(KEYS.invoices, invoices);

    // === AUTO JOURNAL: Pembayaran (Double Entry) ===
    // Debit Kas/Bank, Kredit Piutang Usaha
    const jLines = [];
    // Debit: uang masuk ke Kas/Bank
    jLines.push({ account: payData.bankCode, accountName: payData.bankName, debit: payData.amount, credit: 0 });
    // Debit: potongan masuk ke beban (jika ada)
    if (payData.potongan > 0) {
        jLines.push({ account: DB.coa.bebanPotongan.code, accountName: DB.coa.bebanPotongan.name, debit: payData.potongan, credit: 0 });
    }
    // Kredit: Piutang berkurang
    const totalKredit = payData.amount + (payData.potongan || 0);
    jLines.push({ account: DB.coa.piutang.code, accountName: DB.coa.piutang.name, debit: 0, credit: totalKredit });

    createJournalEntry(payData.date, `Pembayaran ${payData.id} untuk ${invoiceId}`, jLines, payData.id);

    addAudit('PAYMENT_RECORDED', payData.id, `Pembayaran ${formatRp(payData.amount)} untuk ${invoiceId}. Sisa: ${formatRp(inv.sisaTagihan)}`);
    return inv;
}

function voidInvoice(invoiceId) {
    const invoices = getInvoices();
    const idx = invoices.findIndex(inv => inv.id === invoiceId);
    if (idx === -1) return;
    invoices[idx].status = 'void';
    saveData(KEYS.invoices, invoices);
    addAudit('INVOICE_VOIDED', invoiceId, `Invoice ${invoiceId} dibatalkan (void).`);
}

// ========== STATUS UPDATER ==========
function refreshStatuses() {
    const invoices = getInvoices();
    const todayStr = today();
    let changed = false;
    invoices.forEach(inv => {
        if (inv.status === 'lunas' || inv.status === 'void' || inv.status === 'retur') return;
        if (inv.dueDate && inv.dueDate < todayStr && inv.sisaTagihan > 0) {
            if (inv.status !== 'jatuh_tempo') { inv.status = 'jatuh_tempo'; changed = true; }
        }
    });
    if (changed) saveData(KEYS.invoices, invoices);
    return invoices;
}

// ========== DEFAULT SEED DATA ==========
function getDefaultInvoices() {
    return [
        { id: 'INV/2026/05/0001', customerId: 'C001', customerName: 'PT Teknologi Maju', date: '2026-05-12', dueDate: '2026-06-11', termin: '30', items: [{ productId: 'P001', name: 'Laptop Asus TUF Gaming', qty: 2, unit: 'Unit', price: 14500000, discType: '%', disc: 0, taxId: 'ppn11', taxAmt: 3190000, lineTotal: 29000000 }], subtotal: 29000000, discInvoice: 0, discInvoiceType: 'rp', shipping: 0, txFee: 0, totalPPN: 3190000, totalPPh: 0, grandTotal: 32190000, potongan: 0, dp: 0, dpAccount: '', dpAccountName: '', sisaTagihan: 0, totalPaid: 32190000, status: 'lunas', ref: '', tag: 'Reguler', note: '', message: '', payments: [{ id: 'PAY/2026/05/0001', amount: 32190000, potongan: 0, date: '2026-05-15', bankCode: '1-10002', bankName: 'Bank BCA', ref: 'TF-001', createdAt: '2026-05-15T10:00:00Z', createdBy: 'User Perusahaan' }], createdAt: '2026-05-12T08:00:00Z', createdBy: 'User Perusahaan' },
        { id: 'INV/2026/05/0002', customerId: 'C002', customerName: 'CV Makmur Jaya', date: '2026-05-15', dueDate: '2026-06-14', termin: '30', items: [{ productId: 'P003', name: 'Monitor LED 24" Samsung', qty: 5, unit: 'Unit', price: 2750000, discType: '%', disc: 5, taxId: 'ppn11', taxAmt: 1436875, lineTotal: 13062500 }], subtotal: 13062500, discInvoice: 0, discInvoiceType: 'rp', shipping: 150000, txFee: 0, totalPPN: 1436875, totalPPh: 0, grandTotal: 14649375, potongan: 0, dp: 0, dpAccount: '', dpAccountName: '', sisaTagihan: 14649375, totalPaid: 0, status: 'belum', ref: 'PO-2026-088', tag: '', note: '', message: '', payments: [], createdAt: '2026-05-15T09:00:00Z', createdBy: 'User Perusahaan' },
        { id: 'INV/2026/04/0045', customerId: 'C003', customerName: 'Toko Sinar', date: '2026-04-20', dueDate: '2026-05-05', termin: '15', items: [{ productId: 'P006', name: 'Printer Epson L3250', qty: 3, unit: 'Unit', price: 3200000, discType: 'rp', disc: 200000, taxId: 'none', taxAmt: 0, lineTotal: 9400000 }], subtotal: 9400000, discInvoice: 0, discInvoiceType: 'rp', shipping: 0, txFee: 0, totalPPN: 0, totalPPh: 0, grandTotal: 9400000, potongan: 0, dp: 2000000, dpAccount: '1-10002', dpAccountName: 'Bank BCA', sisaTagihan: 3200000, totalPaid: 6200000, status: 'jatuh_tempo', ref: '', tag: 'Repeat Order', note: '', message: '', payments: [{ id: 'PAY/2026/05/0002', amount: 4200000, potongan: 0, date: '2026-05-01', bankCode: '1-10001', bankName: 'Kas Kecil', ref: '', createdAt: '2026-05-01T10:00:00Z', createdBy: 'User Perusahaan' }], createdAt: '2026-04-20T08:00:00Z', createdBy: 'User Perusahaan' },
    ];
}
