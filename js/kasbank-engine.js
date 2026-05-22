// js/kasbank-engine.js

// Konstanta Storage
const KB_KEYS = {
    coa: 'vitta_coa',
    journals: 'vitta_journals'
};

// Default Kas & Bank
const DEFAULT_KAS_BANK = [
    { code: '1-10001', name: 'Kas Kecil', category: 'Kas & Bank', is_system: true },
    { code: '1-10002', name: 'Bank BCA', category: 'Kas & Bank', is_system: true },
    { code: '1-10003', name: 'Bank Mandiri', category: 'Kas & Bank', is_system: true },
];

function initKasBankEngine() {
    let coa = JSON.parse(localStorage.getItem(KB_KEYS.coa));
    if (!coa) {
        // Jika belum ada COA sama sekali, buat dengan data Kas/Bank
        localStorage.setItem(KB_KEYS.coa, JSON.stringify(DEFAULT_KAS_BANK));
    } else {
        // Pastikan akun default ada
        let changed = false;
        DEFAULT_KAS_BANK.forEach(def => {
            if (!coa.find(c => c.code === def.code)) {
                coa.push(def);
                changed = true;
            }
        });
        if (changed) localStorage.setItem(KB_KEYS.coa, JSON.stringify(coa));
    }
}

function getKasBankAccounts() {
    let coa = JSON.parse(localStorage.getItem(KB_KEYS.coa)) || [];
    return coa.filter(c => c.category === 'Kas & Bank').sort((a,b) => a.code.localeCompare(b.code));
}

function getAllCoa() {
    let coa = JSON.parse(localStorage.getItem(KB_KEYS.coa));
    if(!coa) {
        // fallback dummy COA untuk lawan akun jika belum ada
        coa = [
            ...DEFAULT_KAS_BANK,
            { code: '4-40000', name: 'Pendapatan Lain-lain', category: 'Pendapatan', is_system: false },
            { code: '6-60000', name: 'Biaya Administrasi Bank', category: 'Biaya', is_system: false },
            { code: '3-30000', name: 'Modal Pemilik', category: 'Ekuitas', is_system: false }
        ];
        localStorage.setItem(KB_KEYS.coa, JSON.stringify(coa));
    }
    return coa;
}

function addKasBankAccount(data) {
    if(!data.name || !data.code) throw new Error("Nama dan Kode Akun wajib diisi.");
    let coa = JSON.parse(localStorage.getItem(KB_KEYS.coa)) || [];
    if(coa.find(c => c.code === data.code)) throw new Error("Kode Akun sudah digunakan.");
    
    coa.push({
        code: data.code,
        name: data.name,
        category: 'Kas & Bank',
        parent: data.parent || null,
        is_system: false,
        createdAt: new Date().toISOString()
    });
    
    localStorage.setItem(KB_KEYS.coa, JSON.stringify(coa));
}

function updateKasBankAccount(oldCode, data) {
    if(!data.name) throw new Error("Nama Akun wajib diisi.");
    let coa = JSON.parse(localStorage.getItem(KB_KEYS.coa)) || [];
    let accIndex = coa.findIndex(c => c.code === oldCode);
    if(accIndex === -1) throw new Error("Akun tidak ditemukan.");
    
    // Check if new code is already used by another account
    if (data.code !== oldCode && coa.find(c => c.code === data.code)) {
        throw new Error("Kode Akun sudah digunakan oleh akun lain.");
    }

    coa[accIndex].name = data.name;
    if (data.code) coa[accIndex].code = data.code;
    // We do not change category, is_system, etc.

    localStorage.setItem(KB_KEYS.coa, JSON.stringify(coa));
    
    // Note: If code changed, ideally we should update all journals that use oldCode.
    // For simplicity of this basic implementation, we just update the COA.
}

function getJournals() {
    return JSON.parse(localStorage.getItem(KB_KEYS.journals)) || [];
}

// Saldo = Total Debit - Total Kredit (untuk akun Asset / Kas)
function calculateBalance(accountCode) {
    const journals = getJournals();
    let balance = 0;
    
    journals.forEach(j => {
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
    const journals = getJournals();
    
    let balances = {};
    let metrics = {}; 
    accounts.forEach(a => {
        balances[a.code] = 0;
        metrics[a.code] = { in: 0, out: 0, txCount: 0 };
    });
    
    journals.forEach(j => {
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

function saveTransactionJournal(date, memo, lines, refId) {
    let journals = getJournals();
    const entry = {
        id: 'JRN-KB-' + Date.now(),
        date: date,
        memo: memo,
        lines: lines,
        refId: refId || '',
        createdAt: new Date().toISOString()
    };
    journals.unshift(entry);
    localStorage.setItem(KB_KEYS.journals, JSON.stringify(journals));
    return entry;
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
    
    return saveTransactionJournal(data.date, data.memo, lines);
}

function recordTransfer(data) {
    if(data.amount <= 0) throw new Error("Nominal harus lebih dari 0.");
    if(!data.accountFrom || !data.accountTo) throw new Error("Akun Sumber dan Tujuan wajib diisi.");
    if(data.accountFrom === data.accountTo) throw new Error("Akun Sumber dan Tujuan tidak boleh sama.");
    
    let lines = [];
    lines.push({ account: data.accountTo, accountName: getAccountName(data.accountTo), debit: data.amount, credit: 0 });
    lines.push({ account: data.accountFrom, accountName: getAccountName(data.accountFrom), debit: 0, credit: data.amount });
    
    return saveTransactionJournal(data.date, data.memo, lines);
}

function getAccountName(code) {
    let coa = getAllCoa();
    let acc = coa.find(c => c.code === code);
    return acc ? acc.name : code;
}

const formatRp = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
const formatDate = (d) => {
    if (!d) return '-';
    const dt = new Date(d);
    return dt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};
