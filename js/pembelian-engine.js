/**
 * VITTA ERP - Purchase Engine (Pembelian & Hutang)
 * Double-Entry Accounting + LocalStorage
 */

const PUR_KEYS = {
    purchases: 'vitta_purchases',
    counter: 'vitta_pur_counter',
    payCounter: 'vitta_purpay_counter',
};

// COA References (assumed matched with coa-engine.js)
const PUR_COA = {
    hutangUsaha: { code: '2-20100', name: 'Hutang Usaha' },
    persediaan: { code: '1-10200', name: 'Persediaan Barang' },
    ppnMasukan: { code: '1-10500', name: 'PPN Masukan' },
    uangMuka: { code: '1-10403', name: 'Uang Muka' },
    pendapatanLain: { code: '7-70099', name: 'Pendapatan Lain - lain' } // untuk diskon
};

// Helpers
var formatRp = formatRp || ((n) => 'Rp ' + Math.round(n).toLocaleString('id-ID'));
var formatDate = formatDate || ((d) => {
    if (!d) return '-';
    const dt = new Date(d);
    return dt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
});
var today = today || (() => new Date().toISOString().split('T')[0]);
var now = now || (() => new Date().toISOString());

function getNextPurNo() {
    let c = parseInt(localStorage.getItem(PUR_KEYS.counter) || '0') + 1;
    localStorage.setItem(PUR_KEYS.counter, c);
    const d = new Date();
    return `PUR/${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(c).padStart(4, '0')}`;
}

function getNextPurPayNo() {
    let c = parseInt(localStorage.getItem(PUR_KEYS.payCounter) || '0') + 1;
    localStorage.setItem(PUR_KEYS.payCounter, c);
    const d = new Date();
    return `PAY-OUT/${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(c).padStart(4, '0')}`;
}

function getPurchases() {
    return JSON.parse(localStorage.getItem(PUR_KEYS.purchases)) || [];
}

function savePurchases(data) {
    localStorage.setItem(PUR_KEYS.purchases, JSON.stringify(data));
}

function savePurchase(purData) {
    // Validate
    if (!purData.supplierId) throw new Error('Pilih supplier terlebih dahulu.');
    if (!purData.items || purData.items.length === 0) throw new Error('Tambahkan minimal 1 item.');
    if (purData.grandTotal <= 0) throw new Error('Total pembelian tidak boleh 0.');

    const purchases = getPurchases();
    purData.id = getNextPurNo();
    purData.createdAt = now();
    purData.createdBy = (window.VITTA_USER || {}).username || 'System';
    purData.payments = [];
    purData.totalPaid = 0;

    // Sisa hutang = grandTotal - potongan - dp
    purData.sisaHutang = purData.grandTotal - (purData.potongan || 0) - (purData.dp || 0);
    if (purData.sisaHutang < 0) purData.sisaHutang = 0;

    // Status awal
    if (purData.dp > 0) {
        purData.totalPaid = purData.dp;
        purData.status = purData.sisaHutang <= 0 ? 'lunas' : 'sebagian';
    } else {
        purData.status = 'belum';
    }

    purchases.unshift(purData);
    savePurchases(purchases);

    // === AUTO JOURNAL: Pengakuan Persediaan dan Hutang ===
    const jLines = [];
    
    // Debit: Persediaan (Subtotal sebelum PPN + shipping)
    let totalPersediaan = purData.subtotal + (purData.shipping || 0) + (purData.txFee || 0);
    jLines.push({ account: PUR_COA.persediaan.code, accountName: PUR_COA.persediaan.name, debit: totalPersediaan, credit: 0 });

    // Debit: PPN Masukan (Jika ada)
    if (purData.totalPPN > 0) {
        jLines.push({ account: PUR_COA.ppnMasukan.code, accountName: PUR_COA.ppnMasukan.name, debit: purData.totalPPN, credit: 0 });
    }

    // Kredit: Hutang Usaha sejumlah Grand Total
    jLines.push({ account: PUR_COA.hutangUsaha.code, accountName: PUR_COA.hutangUsaha.name, debit: 0, credit: purData.grandTotal });
    
    if (window.recordJournal) {
        window.recordJournal({
            date: purData.date,
            memo: `Pembelian ${purData.id} dari ${purData.supplierName}`,
            lines: jLines,
            refId: purData.id,
            type: 'PURCHASE'
        });
    }

    // Jurnal DP
    if (purData.dp > 0) {
        const dpLines = [
            { account: PUR_COA.hutangUsaha.code, accountName: PUR_COA.hutangUsaha.name, debit: purData.dp, credit: 0 },
            { account: purData.dpAccount, accountName: purData.dpAccountName || 'Kas/Bank', debit: 0, credit: purData.dp },
        ];
        if (window.recordJournal) {
            window.recordJournal({
                date: purData.date,
                memo: `DP Pembelian ${purData.id}`,
                lines: dpLines,
                refId: purData.id,
                type: 'PURCHASE_DP'
            });
        }
    }

    // Update Inventory
    if (window.VittaInventory && window.VittaProduk) {
        purData.items.forEach(item => {
            window.VittaProduk.processStockMovement(item.productId, 'PURCHASE', item.qty, purData.id, item.price, `Pembelian ${purData.id}`);
        });
    }

    return purData;
}

function recordPurchasePayment(purchaseId, payData) {
    const purchases = getPurchases();
    const idx = purchases.findIndex(p => p.id === purchaseId);
    if (idx === -1) throw new Error('Pembelian tidak ditemukan.');

    const pur = purchases[idx];
    payData.id = getNextPurPayNo();
    payData.createdAt = now();
    payData.createdBy = (window.VITTA_USER || {}).username || 'System';

    if (!pur.payments) pur.payments = [];
    pur.payments.push(payData);

    let totalPaid = (pur.dp || 0);
    pur.payments.forEach(p => {
        totalPaid += (p.amount || 0) + (p.potongan || 0);
    });
    pur.totalPaid = totalPaid;

    const baseAmount = pur.grandTotal - (pur.potongan || 0);
    const remaining = baseAmount - totalPaid;
    pur.sisaHutang = Math.max(0, remaining);

    if (pur.sisaHutang <= 0) {
        pur.status = 'lunas';
        pur.sisaHutang = 0;
    } else {
        pur.status = 'sebagian';
    }

    savePurchases(purchases);

    // === AUTO JOURNAL: Pembayaran Hutang ===
    const jLines = [];
    // Debit: Hutang berkurang
    const totalDebit = payData.amount + (payData.potongan || 0);
    jLines.push({ account: PUR_COA.hutangUsaha.code, accountName: PUR_COA.hutangUsaha.name, debit: totalDebit, credit: 0 });
    
    // Kredit: uang keluar dari Kas/Bank
    jLines.push({ account: payData.bankCode, accountName: payData.bankName, debit: 0, credit: payData.amount });
    
    // Kredit: potongan jadi pendapatan (diskon pembelian)
    if (payData.potongan > 0) {
        jLines.push({ account: PUR_COA.pendapatanLain.code, accountName: PUR_COA.pendapatanLain.name, debit: 0, credit: payData.potongan });
    }
    
    if (window.recordJournal) {
        window.recordJournal({
            date: payData.date,
            memo: `Pelunasan Hutang ${payData.id} untuk ${purchaseId}`,
            lines: jLines,
            refId: payData.id,
            type: 'PURCHASE_PAYMENT'
        });
    }

    return pur;
}

function refreshPurchaseStatuses() {
    const purchases = getPurchases();
    const todayStr = today();
    let changed = false;
    purchases.forEach(pur => {
        if (pur.status === 'lunas' || pur.status === 'void') return;
        if (pur.dueDate && pur.dueDate < todayStr && pur.sisaHutang > 0) {
            if (pur.status !== 'jatuh_tempo') { pur.status = 'jatuh_tempo'; changed = true; }
        }
    });
    if (changed) savePurchases(purchases);
    return purchases;
}

function voidPurchase(purchaseId) {
    const purchases = getPurchases();
    const idx = purchases.findIndex(p => p.id === purchaseId);
    if (idx === -1) return;
    
    purchases[idx].status = 'void';
    savePurchases(purchases);
    
    // Reverse Journals
    if (window.getJournals && window.voidJournal) {
        const journals = window.getJournals();
        journals.forEach(j => {
            if (j.refId === purchaseId && j.status !== 'void') {
                window.voidJournal(j.id, "Pembatalan Pembelian");
            }
        });
    }
}

window.VittaPurchase = {
    getPurchases,
    savePurchase,
    recordPurchasePayment,
    refreshPurchaseStatuses,
    voidPurchase
};
