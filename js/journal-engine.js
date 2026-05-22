/**
 * VITTA ERP - Central Journal Engine (Double Entry Validation)
 */

const JRNL_KEY = 'vitta_journals';

// Ensure JRNL_KEY array exists
if (!localStorage.getItem(JRNL_KEY)) {
    localStorage.setItem(JRNL_KEY, JSON.stringify([]));
}

function getJournals() {
    return JSON.parse(localStorage.getItem(JRNL_KEY)) || [];
}

/**
 * Record a journal entry with strict double-entry validation
 * @param {Object} data - { date, memo, lines: [{account, accountName, debit, credit}], refId, type }
 */
function recordJournal(data) {
    if (!data.lines || data.lines.length < 2) {
        throw new Error("Jurnal minimal membutuhkan 2 baris (Debit & Kredit).");
    }

    let totalDebit = 0;
    let totalCredit = 0;

    data.lines.forEach(line => {
        if (!line.account) throw new Error("Semua baris jurnal harus memiliki akun COA.");
        totalDebit += parseFloat(line.debit) || 0;
        totalCredit += parseFloat(line.credit) || 0;
    });

    // Validasi keseimbangan (toleransi 0.01 untuk pembulatan)
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
        throw new Error(`Jurnal tidak balance! Total Debit: ${totalDebit}, Total Kredit: ${totalCredit}`);
    }

    const journals = getJournals();
    const newId = `JRNL-${Date.now()}`;
    
    const entry = {
        id: newId,
        date: data.date || new Date().toISOString().split('T')[0],
        memo: data.memo || '',
        refId: data.refId || '',
        type: data.type || 'GENERAL',
        status: 'posted', // default status
        lines: data.lines,
        createdAt: new Date().toISOString(),
        createdBy: 'System' // can be dynamic based on logged in user
    };

    journals.push(entry);
    localStorage.setItem(JRNL_KEY, JSON.stringify(journals));
    return newId;
}

/**
 * Void a journal entry by creating a reversal entry
 * @param {string} journalId 
 * @param {string} reason 
 */
function voidJournal(journalId, reason) {
    const journals = getJournals();
    const idx = journals.findIndex(j => j.id === journalId);
    if (idx === -1) throw new Error("Jurnal tidak ditemukan.");
    
    const orig = journals[idx];
    if (orig.status === 'void') throw new Error("Jurnal sudah di-void.");

    // Create reversal lines
    const reversedLines = orig.lines.map(line => ({
        account: line.account,
        accountName: line.accountName,
        debit: line.credit, // swap debit and credit
        credit: line.debit
    }));

    const reversalEntry = {
        id: `JRNL-REV-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        memo: `[REVERSAL] ${orig.memo} - Reason: ${reason}`,
        refId: orig.refId,
        type: 'REVERSAL',
        status: 'posted',
        lines: reversedLines,
        createdAt: new Date().toISOString(),
        createdBy: 'System',
        reversesId: journalId
    };

    journals.push(reversalEntry);
    
    // Mark original as void
    journals[idx].status = 'void';
    
    localStorage.setItem(JRNL_KEY, JSON.stringify(journals));
    return reversalEntry.id;
}

window.recordJournal = recordJournal;
window.getJournals = getJournals;
window.voidJournal = voidJournal;
