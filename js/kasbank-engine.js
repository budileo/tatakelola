// js/kasbank-engine.js

function initKasBankEngine() {
    // COA is auto-seeded by coa-engine.js
    // Journal engine is auto-loaded
}

function getKasBankAccounts() {
    if (window.VittaCOA) {
        return window.VittaCOA.getAccountsByCategory('Kas & Bank').sort((a,b) => a.code.localeCompare(b.code));
    }
    return [];
}

function getAllCoa() {
    if (window.VittaCOA) {
        return window.VittaCOA.getActiveAccounts();
    }
    return [];
}

function addKasBankAccount(data) {
    if(!data.name || !data.code) throw new Error("Nama dan Kode Akun wajib diisi.");
    if (window.VittaCOA) {
        const res = window.VittaCOA.addAccount({
            name: data.name,
            code: data.code,
            category: 'Kas & Bank'
        });
        if (!res.success) throw new Error(res.error);
    } else {
        throw new Error("COA Engine tidak ditemukan");
    }
}

function updateKasBankAccount(oldCode, data) {
    if(!data.name) throw new Error("Nama Akun wajib diisi.");
    if (window.VittaCOA) {
        const acc = window.VittaCOA.getAccountByCode(oldCode);
        if(!acc) throw new Error("Akun tidak ditemukan.");
        
        const res = window.VittaCOA.updateAccount(acc.id, {
            name: data.name,
            code: data.code
        });
        if (!res.success) throw new Error(res.error);
    }
}

function deleteKasBankAccount(code) {
    if (window.VittaCOA) {
        const acc = window.VittaCOA.getAccountByCode(code);
        if(!acc) throw new Error("Akun tidak ditemukan.");
        
        const res = window.VittaCOA.deleteAccount(acc.id);
        if (!res.success) throw new Error(res.error);
    }
}

// Saldo = Total Debit - Total Kredit (untuk akun Asset / Kas)
function calculateBalance(accountCode) {
    if (!window.getJournals) return 0;
    const journals = window.getJournals();
    let balance = 0;
    
    journals.forEach(j => {
        if(j.status !== 'posted') return;
        if(!j.lines) return;
        j.lines.forEach(line => {
            if (line.account === accountCode) {
                balance += (parseFloat(line.debit) || 0);
                balance -= (parseFloat(line.credit) || 0);
            }
        });
    });
    
    return balance;
}

// Saldo seluruh Kas/Bank per akun
function getAllKasBankBalances() {
    const accounts = getKasBankAccounts();
    const journals = window.getJournals ? window.getJournals() : [];
    
    let balances = {};
    let metrics = {}; 
    accounts.forEach(a => {
        balances[a.code] = 0;
        metrics[a.code] = { in: 0, out: 0, txCount: 0 };
    });
    
    journals.forEach(j => {
        if(j.status !== 'posted') return;
        if(!j.lines) return;
        let hasKasBank = false;
        j.lines.forEach(line => {
            if (balances[line.account] !== undefined) {
                hasKasBank = true;
                const deb = parseFloat(line.debit) || 0;
                const cred = parseFloat(line.credit) || 0;
                
                balances[line.account] += deb;
                balances[line.account] -= cred;
                
                metrics[line.account].in += deb;
                metrics[line.account].out += cred;
            }
        });
        if(hasKasBank) {
            j.lines.forEach(line => {
                if (metrics[line.account]) metrics[line.account].txCount++;
            });
        }
    });
    
    return accounts.map(a => ({
        ...a,
        balance: balances[a.code],
        totalIn: metrics[a.code].in,
        totalOut: metrics[a.code].out,
        txCount: metrics[a.code].txCount
    }));
}

function recordKasBankTransaction(data) {
    if(data.amount <= 0) throw new Error("Nominal harus lebih dari 0.");
    if(!data.accountKas || !data.accountLawan) throw new Error("Akun Kas dan Akun Lawan wajib diisi.");
    
    let lines = [];
    if (data.type === 'in') {
        lines.push({ account: data.accountKas, accountName: getAccountName(data.accountKas), debit: data.amount, credit: 0 });
        lines.push({ account: data.accountLawan, accountName: getAccountName(data.accountLawan), debit: 0, credit: data.amount });
    } else if (data.type === 'out') {
        lines.push({ account: data.accountLawan, accountName: getAccountName(data.accountLawan), debit: data.amount, credit: 0 });
        lines.push({ account: data.accountKas, accountName: getAccountName(data.accountKas), debit: 0, credit: data.amount });
    }
    
    if(window.recordJournal) {
        return window.recordJournal({
            date: data.date,
            memo: data.memo,
            lines: lines,
            type: 'KAS_BANK'
        });
    } else {
        throw new Error("Journal Engine tidak ditemukan.");
    }
}

function recordTransfer(data) {
    if(data.amount <= 0) throw new Error("Nominal harus lebih dari 0.");
    if(!data.accountFrom || !data.accountTo) throw new Error("Akun Sumber dan Tujuan wajib diisi.");
    if(data.accountFrom === data.accountTo) throw new Error("Akun Sumber dan Tujuan tidak boleh sama.");
    
    let lines = [];
    lines.push({ account: data.accountTo, accountName: getAccountName(data.accountTo), debit: data.amount, credit: 0 });
    lines.push({ account: data.accountFrom, accountName: getAccountName(data.accountFrom), debit: 0, credit: data.amount });
    
    if(window.recordJournal) {
        return window.recordJournal({
            date: data.date,
            memo: data.memo,
            lines: lines,
            type: 'TRANSFER'
        });
    } else {
        throw new Error("Journal Engine tidak ditemukan.");
    }
}

function getAccountName(code) {
    if (window.VittaCOA) {
        const acc = window.VittaCOA.getAccountByCode(code);
        return acc ? acc.name : code;
    }
    return code;
}

function getNextKasBankCode() {
    if (!window.VittaCOA) return '1104';
    const accounts = window.VittaCOA.getAccounts().filter(a => a.category === 'Kas & Bank');
    let maxNum = 1103; // Default starting for new Kas & Bank if standard is 1101, 1102, 1103
    accounts.forEach(a => {
        // Handle standard 4-digit codes like 1101, 1102
        if (/^\d{4}$/.test(a.code)) {
            const num = parseInt(a.code, 10);
            if (!isNaN(num) && num > maxNum && num < 1199) {
                maxNum = num;
            }
        }
        // Handle old legacy codes like 1-10001
        const parts = a.code.split('-');
        if (parts.length === 2 && parts[0] === '1') {
            const num = parseInt(parts[1], 10);
            // We ignore legacy maxNum for standard generation unless needed
        }
    });
    return String(maxNum + 1);
}
window.getNextKasBankCode = getNextKasBankCode;

// Supaya kasbank.html tetap jalan tanpa crash jika getJournals dicari global
window.getJournals = window.getJournals || (() => []);

var formatRp = formatRp || ((angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka));
var formatDate = formatDate || ((d) => {
    if (!d) return '-';
    const dt = new Date(d);
    return dt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
});
