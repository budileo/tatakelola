/**
 * VITTA ERP - Biaya Engine (Expenses)
 * Double-Entry Accounting + LocalStorage
 */

const EXP_KEYS = {
    expenses: 'vitta_expenses',
    counter: 'vitta_exp_counter'
};

var formatRp = formatRp || ((n) => 'Rp ' + Math.round(n).toLocaleString('id-ID'));
var formatDate = formatDate || ((d) => {
    if (!d) return '-';
    const dt = new Date(d);
    return dt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
});
var today = today || (() => new Date().toISOString().split('T')[0]);
var now = now || (() => new Date().toISOString());

function getNextExpNo() {
    let c = parseInt(localStorage.getItem(EXP_KEYS.counter) || '0') + 1;
    localStorage.setItem(EXP_KEYS.counter, c);
    const d = new Date();
    return `EXP/${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(c).padStart(4, '0')}`;
}

function getExpenses() {
    return JSON.parse(localStorage.getItem(EXP_KEYS.expenses)) || [];
}

function saveExpenses(data) {
    localStorage.setItem(EXP_KEYS.expenses, JSON.stringify(data));
}

function saveExpense(expData) {
    // Validate
    if (!expData.items || expData.items.length === 0) throw new Error('Tambahkan minimal 1 baris biaya.');
    if (expData.grandTotal <= 0) throw new Error('Total biaya tidak boleh 0.');

    const expenses = getExpenses();
    expData.id = getNextExpNo();
    expData.createdAt = now();
    expData.createdBy = (window.VITTA_USER || {}).username || 'System';

    expenses.unshift(expData);
    saveExpenses(expenses);

    // === AUTO JOURNAL: Biaya ===
    const jLines = [];
    
    // Debit: Akun-akun biaya
    expData.items.forEach(item => {
        jLines.push({ account: item.accountCode, accountName: item.accountName, debit: item.amount, credit: 0 });
    });

    // Debit: PPN Masukan (Jika ada)
    if (expData.taxAmount > 0) {
        // assume PPN Masukan code is 1-10500
        jLines.push({ account: '1-10500', accountName: 'PPN Masukan', debit: expData.taxAmount, credit: 0 });
    }

    // Kredit: Sumber Dana (Kas/Bank atau Hutang)
    // Jika credit (Hutang), pakai Hutang Usaha (2-20100) atau Hutang Lain (2-20299)
    let creditCode = expData.sourceCode;
    let creditName = expData.sourceName;
    if (expData.method === 'credit') {
        creditCode = '2-20100'; // Hutang Usaha
        creditName = 'Hutang Usaha';
    }

    jLines.push({ account: creditCode, accountName: creditName, debit: 0, credit: expData.grandTotal });
    
    if (window.recordJournal) {
        window.recordJournal({
            date: expData.date,
            memo: `Biaya ${expData.id} - ${expData.receiver}`,
            lines: jLines,
            refId: expData.id,
            type: 'EXPENSE'
        });
    }

    return expData;
}

window.VittaExpense = {
    getExpenses,
    saveExpense
};
