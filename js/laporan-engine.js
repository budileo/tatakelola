/**
 * VITTA ERP - Laporan Keuangan Dinamis (Laporan Engine)
 * Menghitung Laba Rugi, Neraca, dan Arus Kas berdasarkan Jurnal
 */

function buildTrialBalance(startDate, endDate) {
    if (!window.getJournals || !window.VittaCOA) return {};
    
    const journals = window.getJournals().filter(j => j.status === 'posted');
    const accounts = window.VittaCOA.getAccounts();
    const trialBalance = {};
    
    // Inisialisasi
    accounts.forEach(acc => {
        trialBalance[acc.code] = {
            name: acc.name,
            category: acc.category,
            type: acc.type,
            debit: 0,
            credit: 0,
            balance: 0
        };
    });
    
    // Akumulasi Jurnal
    journals.forEach(j => {
        if ((startDate && j.date < startDate) || (endDate && j.date > endDate)) return;
        
        j.lines.forEach(line => {
            if (!trialBalance[line.account]) {
                trialBalance[line.account] = {
                    name: line.accountName,
                    category: 'Unknown',
                    type: 'Unknown',
                    debit: 0,
                    credit: 0,
                    balance: 0
                };
            }
            trialBalance[line.account].debit += (line.debit || 0);
            trialBalance[line.account].credit += (line.credit || 0);
        });
    });
    
    // Hitung Saldo Normal
    Object.keys(trialBalance).forEach(code => {
        const acc = trialBalance[code];
        // Asset & Expense -> Normal Debit
        if (['Asset', 'Expense'].includes(acc.type)) {
            acc.balance = acc.debit - acc.credit;
        } else {
            // Liability, Equity, Revenue -> Normal Credit
            acc.balance = acc.credit - acc.debit;
        }
    });
    
    return trialBalance;
}

function generateLabaRugi(startDate, endDate) {
    const tb = buildTrialBalance(startDate, endDate);
    
    const report = {
        pendapatan: [],
        hpp: [],
        beban: [],
        totalPendapatan: 0,
        totalHPP: 0,
        totalBeban: 0,
        labaKotor: 0,
        labaBersih: 0
    };
    
    Object.keys(tb).forEach(code => {
        const acc = tb[code];
        if (acc.balance === 0) return;
        
        if (acc.type === 'Revenue') {
            report.pendapatan.push(acc);
            report.totalPendapatan += acc.balance;
        } else if (acc.category === 'Harga Pokok Penjualan') {
            report.hpp.push(acc);
            report.totalHPP += acc.balance;
        } else if (acc.type === 'Expense' && acc.category !== 'Harga Pokok Penjualan') {
            report.beban.push(acc);
            report.totalBeban += acc.balance;
        }
    });
    
    report.labaKotor = report.totalPendapatan - report.totalHPP;
    report.labaBersih = report.labaKotor - report.totalBeban;
    
    return report;
}

function generateNeraca(endDate) {
    const tb = buildTrialBalance(null, endDate); // Neraca adalah akumulasi dari awal sampai endDate
    const lr = generateLabaRugi(null, endDate); // Laba tahun berjalan
    
    const report = {
        aset: { lancar: [], tetap: [], total: 0 },
        kewajiban: { pendek: [], panjang: [], total: 0 },
        ekuitas: { list: [], labaBerjalan: lr.labaBersih, total: lr.labaBersih }
    };
    
    Object.keys(tb).forEach(code => {
        const acc = tb[code];
        if (acc.balance === 0) return;
        
        if (acc.type === 'Asset') {
            if (acc.category === 'Aktiva Lancar' || acc.category === 'Kas & Bank' || acc.category === 'Persediaan') {
                report.aset.lancar.push(acc);
            } else {
                report.aset.tetap.push(acc);
            }
            report.aset.total += acc.balance;
        } else if (acc.type === 'Liability') {
            if (acc.category === 'Kewajiban Jangka Pendek') {
                report.kewajiban.pendek.push(acc);
            } else {
                report.kewajiban.panjang.push(acc);
            }
            report.kewajiban.total += acc.balance;
        } else if (acc.type === 'Equity') {
            report.ekuitas.list.push(acc);
            report.ekuitas.total += acc.balance;
        }
    });
    
    return report;
}

function generateArusKas(startDate, endDate) {
    // Arus kas sederhana: Menganalisa perubahan pada akun Kas & Bank
    if (!window.getJournals || !window.VittaCOA) return {};
    
    const journals = window.getJournals().filter(j => j.status === 'posted');
    const kasBankCodes = window.VittaCOA.getAccounts().filter(a => a.category === 'Kas & Bank').map(a => a.code);
    
    const report = {
        masuk: [], // Operasional masuk (Penjualan, DP)
        keluar: [], // Operasional keluar (Pembelian, Biaya)
        totalMasuk: 0,
        totalKeluar: 0,
        netCashFlow: 0
    };
    
    journals.forEach(j => {
        if ((startDate && j.date < startDate) || (endDate && j.date > endDate)) return;
        
        let kasMasuk = 0;
        let kasKeluar = 0;
        
        j.lines.forEach(line => {
            if (kasBankCodes.includes(line.account)) {
                kasMasuk += (line.debit || 0);
                kasKeluar += (line.credit || 0);
            }
        });
        
        if (kasMasuk > 0) {
            report.masuk.push({ date: j.date, memo: j.memo, amount: kasMasuk });
            report.totalMasuk += kasMasuk;
        }
        if (kasKeluar > 0) {
            report.keluar.push({ date: j.date, memo: j.memo, amount: kasKeluar });
            report.totalKeluar += kasKeluar;
        }
    });
    
    report.netCashFlow = report.totalMasuk - report.totalKeluar;
    
    return report;
}

function generateLaporanPenjualan(startDate, endDate) {
    if (typeof getInvoices !== 'function') return { items: [], total: 0 };
    let invs = getInvoices();
    if (startDate) invs = invs.filter(i => i.date >= startDate);
    if (endDate) invs = invs.filter(i => i.date <= endDate);
    
    let total = 0;
    invs.forEach(i => total += i.grandTotal || 0);
    
    return { items: invs, total: total };
}

function generateLaporanPembelian(startDate, endDate) {
    if (typeof getPurchases !== 'function') return { items: [], total: 0 };
    let purs = getPurchases();
    if (startDate) purs = purs.filter(p => p.date >= startDate);
    if (endDate) purs = purs.filter(p => p.date <= endDate);
    
    let total = 0;
    purs.forEach(p => total += p.grandTotal || 0);
    
    return { items: purs, total: total };
}

window.VittaReport = {
    buildTrialBalance,
    generateLabaRugi,
    generateNeraca,
    generateArusKas,
    generateLaporanPenjualan,
    generateLaporanPembelian
};
