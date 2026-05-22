// ========== HELPERS ==========
const formatRp = (num) => 'Rp ' + Math.round(num || 0).toLocaleString('id-ID');
const formatDate = (d) => {
    if (!d) return '-';
    const dt = new Date(d);
    return dt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};
var today = () => new Date().toISOString().split('T')[0];

function toggleView(view) {
    if (view === 'form') {
        document.getElementById('listView').classList.add('hidden');
        document.getElementById('formView').classList.remove('hidden');
        document.getElementById('formView').classList.add('animate-fade-in-up');
        initForm();
    } else {
        document.getElementById('formView').classList.add('hidden');
        document.getElementById('listView').classList.remove('hidden');
        renderTable();
    }
}

function togglePaymentMethod() {
    const method = document.querySelector('input[name="payment_method"]:checked').value;
    const sourceWrapper = document.getElementById('sourceAccountWrapper');
    if (method === 'credit') {
        sourceWrapper.style.display = 'none';
    } else {
        sourceWrapper.style.display = 'block';
    }
}

function initForm() {
    document.getElementById('expenseDate').value = today();
    
    // Load Kas Bank for Source Account
    const sourceSelect = document.getElementById('sourceAccount');
    if (window.VittaCOA) {
        const banks = window.VittaCOA.getAccounts().filter(a => a.category === 'Kas & Bank');
        sourceSelect.innerHTML = banks.map(b => `<option value="${b.code}" data-name="${b.name}">${b.name} (${b.code})</option>`).join('');
    }
    
    // Load Contacts for Receiver
    const recSelect = document.getElementById('expenseReceiver');
    let contactsList = [];
    const localContacts = localStorage.getItem('vitta_contacts');
    if(localContacts) {
        try {
            contactsList = JSON.parse(localContacts);
        } catch(e) {}
    }
    recSelect.innerHTML = '<option value="">-- Pilih Penerima (Kontak) --</option>' + contactsList.map(c => {
        const name = (c.sapaan ? c.sapaan + ' ' : '') + c.nama;
        return `<option value="${name}">${name}</option>`;
    }).join('');

    // Load Expense Accounts for Item Row
    let expOptions = '';
    if (window.VittaCOA) {
        const exps = window.VittaCOA.getAccounts().filter(a => a.category === 'Beban' || a.category === 'Beban Lainnya' || a.category === 'Beban Operasional');
        expOptions = exps.map(b => `<option value="${b.code}" data-name="${b.name}">${b.code} - ${b.name}</option>`).join('');
    }
    window._EXP_ACCOUNTS = expOptions;
    
    const tbody = document.getElementById('itemsBody');
    tbody.innerHTML = `
        <tr class="item-row group">
            <td class="py-2 pr-2">
                <select class="expense-input product-select focus:border-amber-500 focus:ring-amber-500">
                    <option value="">-- Pilih Akun Biaya --</option>
                    ${expOptions}
                </select>
            </td>
            <td class="py-2 pr-2"><input type="text" class="expense-input desc-input" placeholder="Deskripsi baris..."></td>
            <td class="py-2 pr-2"><input type="number" class="expense-input item-price text-right focus:border-amber-500 focus:ring-amber-500" value="0" oninput="calculateTotal()"></td>
            <td class="py-2 text-right">
                <button onclick="removeRow(this)" class="text-dark-600 hover:text-rose-500 transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            </td>
        </tr>
    `;
}

function addRow() {
    const expOptions = window._EXP_ACCOUNTS || '';
    const tbody = document.getElementById('itemsBody');
    const newRow = document.createElement('tr');
    newRow.className = 'item-row group';
    newRow.innerHTML = `
        <td class="py-2 pr-2">
            <select class="expense-input product-select focus:border-amber-500 focus:ring-amber-500">
                <option value="">-- Pilih Akun Biaya --</option>
                ${expOptions}
            </select>
        </td>
        <td class="py-2 pr-2"><input type="text" class="expense-input desc-input" placeholder="Deskripsi baris..."></td>
        <td class="py-2 pr-2"><input type="number" class="expense-input item-price text-right focus:border-amber-500 focus:ring-amber-500" value="0" oninput="calculateTotal()"></td>
        <td class="py-2 text-right">
            <button onclick="removeRow(this)" class="text-dark-600 hover:text-rose-500 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
        </td>
    `;
    tbody.appendChild(newRow);
}

function removeRow(btn) {
    const tbody = document.getElementById('itemsBody');
    if (tbody.children.length > 1) {
        btn.closest('tr').remove();
        calculateTotal();
    }
}

function calculateTotal() {
    const rows = document.querySelectorAll('.item-row');
    let total = 0;

    rows.forEach(row => {
        const nominal = parseFloat(row.querySelector('.item-price').value) || 0;
        total += nominal;
    });

    const isTaxInclusive = document.getElementById('taxInclusive').checked;
    const taxInfo = document.getElementById('taxInfo');
    
    if (isTaxInclusive && total > 0) {
        taxInfo.classList.remove('hidden');
        // DPP = Total / 1.11, PPN = Total - DPP
        const dpp = total / 1.11;
        const ppn = total - dpp;
        document.getElementById('lblDPP').innerText = formatRp(dpp);
        document.getElementById('lblTax').innerText = formatRp(ppn);
    } else {
        taxInfo.classList.add('hidden');
    }

    document.getElementById('lblGrandTotal').innerText = formatRp(total);
}

function saveExpense() {
    const date = document.getElementById('expenseDate').value;
    let receiver = document.getElementById('expenseReceiver').value;
    if(!receiver) receiver = "Pengeluaran Umum";
    
    if(!date) {
        alert('Pilih tanggal terlebih dahulu.');
        return;
    }

    const method = document.querySelector('input[name="payment_method"]:checked').value;
    let sourceCode = "";
    let sourceName = "Bayar Nanti (Hutang)";
    if (method === 'cash') {
        const srcSel = document.getElementById('sourceAccount');
        sourceCode = srcSel.value;
        sourceName = srcSel.options[srcSel.selectedIndex]?.text.split(' (')[0] || '';
    }

    const rows = document.querySelectorAll('.item-row');
    const items = [];
    rows.forEach(row => {
        const sel = row.querySelector('.product-select');
        const accountCode = sel.value;
        const accountName = sel.options[sel.selectedIndex]?.getAttribute('data-name');
        const desc = row.querySelector('.desc-input').value;
        const amount = parseFloat(row.querySelector('.item-price').value) || 0;
        
        if (accountCode && amount > 0) {
            items.push({ accountCode, accountName, desc, amount });
        }
    });

    if (items.length === 0) {
        alert('Tambahkan minimal 1 baris biaya dengan nominal > 0.');
        return;
    }

    const grandTotalStr = document.getElementById('lblGrandTotal').innerText.replace(/[^\d]/g, '');
    const total = parseInt(grandTotalStr) || 0;

    const isTaxInclusive = document.getElementById('taxInclusive').checked;
    let dpp = total;
    let taxAmount = 0;
    
    if (isTaxInclusive) {
        const dppStr = document.getElementById('lblDPP').innerText.replace(/[^\d]/g, '');
        const taxStr = document.getElementById('lblTax').innerText.replace(/[^\d]/g, '');
        dpp = parseInt(dppStr) || 0;
        taxAmount = parseInt(taxStr) || 0;
        
        // Adjust the amounts in items to be DPP proportional if needed
        let totalItems = 0;
        items.forEach(it => totalItems += it.amount);
        
        items.forEach(it => {
            // proporsional dpp
            it.amount = (it.amount / totalItems) * dpp;
        });
    }

    const expData = {
        date, receiver, method, sourceCode, sourceName,
        items, taxAmount, grandTotal: total, isTaxInclusive
    };

    try {
        window.VittaExpense.saveExpense(expData);
        alert('Biaya berhasil dicatat!');
        document.getElementById('expenseDate').value = '';
        document.getElementById('expenseReceiver').value = '';
        document.getElementById('taxInclusive').checked = false;
        
        renderTable();
        toggleView('list');
    } catch (e) {
        alert(e.message);
    }
}

function renderTable() {
    if (!window.VittaExpense) return;
    const expenses = window.VittaExpense.getExpenses();

    const tbody = document.getElementById('expenseTableBody');
    if (!expenses || expenses.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-gray-500">Belum ada data pengeluaran.</td></tr>';
        return;
    }
    
    tbody.innerHTML = expenses.map(exp => {
        let sourceBadge = '';
        if(exp.method === 'cash') sourceBadge = `<span class="bg-blue-500/10 text-blue-400 px-2 py-1 rounded text-xs">${exp.sourceName}</span>`;
        else sourceBadge = `<span class="bg-orange-500/10 text-orange-400 px-2 py-1 rounded text-xs">Hutang Usaha</span>`;

        return `
        <tr class="hover:bg-dark-700/30 transition-colors">
            <td class="px-6 py-4 font-medium text-white">${exp.id}</td>
            <td class="px-6 py-4">${formatDate(exp.date)}</td>
            <td class="px-6 py-4">${exp.receiver}</td>
            <td class="px-6 py-4">${sourceBadge}</td>
            <td class="px-6 py-4 text-right">${formatRp(exp.grandTotal)}</td>
            <td class="px-6 py-4 text-center">
                <button onclick="viewExpense('${exp.id}')" class="text-blue-400 hover:text-blue-300">Lihat</button>
            </td>
        </tr>`;
    }).join('');
}

// ========== MODAL LOGIC ==========
function viewExpense(id) {
    if (!window.VittaExpense) return;
    const expenses = window.VittaExpense.getExpenses();
    const exp = expenses.find(e => e.id === id);
    if (!exp) return;

    document.getElementById('modalExpId').innerText = exp.id;
    document.getElementById('modalExpDate').innerText = formatDate(exp.date);
    document.getElementById('modalExpReceiver').innerText = exp.receiver;
    document.getElementById('modalExpMethod').innerText = exp.method === 'cash' ? exp.sourceName : 'Hutang Usaha';
    document.getElementById('modalExpTotal').innerText = formatRp(exp.grandTotal);

    const tbody = document.getElementById('modalExpItems');
    tbody.innerHTML = exp.items.map(it => `
        <tr>
            <td class="py-2">${it.accountName} <span class="text-xs text-gray-500">(${it.accountCode})</span></td>
            <td class="py-2">${it.desc || '-'}</td>
            <td class="py-2 text-right">${formatRp(it.amount)}</td>
        </tr>
    `).join('');

    const taxInfo = document.getElementById('modalExpTaxInfo');
    if (exp.taxAmount > 0) {
        taxInfo.innerHTML = `Termasuk PPN Masukan: <b>${formatRp(exp.taxAmount)}</b>`;
    } else {
        taxInfo.innerHTML = '';
    }

    document.getElementById('modalExpense').classList.remove('hidden');
    document.getElementById('modalExpense').classList.add('flex');
}

function closeModalExpense() {
    document.getElementById('modalExpense').classList.add('hidden');
    document.getElementById('modalExpense').classList.remove('flex');
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.VittaExpense) {
        renderTable();
    }
});
