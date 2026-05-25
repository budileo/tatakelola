// ========== HELPERS ==========
var formatRp = formatRp || ((num) => 'Rp ' + Math.round(num || 0).toLocaleString('id-ID'));
var formatDate = formatDate || ((d) => {
    if (!d) return '-';
    const dt = new Date(d);
    return dt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
});
var today = today || (() => new Date().toISOString().split('T')[0]);

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

async function initForm() {
    document.getElementById('expenseDate').value = today();
    
    // Load Kas Bank for Source Account from Supabase
    const sourceSelect = document.getElementById('sourceAccount');
    const { data: bankData } = await readRecords('akt_coa_accounts');
    if (bankData) {
        const banks = bankData.filter(a => a.category === 'Kas & Bank');
        sourceSelect.innerHTML = banks.map(b => `<option value="${b.code}" data-name="${b.name}">${b.name} (${b.code})</option>`).join('');
    }
    
    // Load Contacts for Receiver from Supabase
    const recSelect = document.getElementById('expenseReceiver');
    const { data: contactsList } = await readRecords('akt_contacts');
    if (contactsList) {
        recSelect.innerHTML = '<option value="">-- Pilih Penerima (Kontak) --</option>' + contactsList.map(c => {
            const name = (c.sapaan ? c.sapaan + ' ' : '') + (c.name || c.nama || '');
            return `<option value="${name}">${name}</option>`;
        }).join('');
    }

    // Load Expense Accounts for Item Row from Supabase
    let expOptions = '';
    if (bankData) {
        const exps = bankData.filter(a => a.category.includes('Beban'));
        expOptions = exps.map(b => `<option value="${b.code}" data-name="${b.name}">${b.code} - ${b.name}</option>`).join('');
    }
    window._EXP_ACCOUNTS = expOptions;

    // Load Tags from Supabase
    const tagContainer = document.getElementById('fTagCheckboxes');
    if (tagContainer) {
        const { data: tagData } = await readRecords('akt_tags', { is_active: true });
        if (tagData) {
            const dynamicTags = tagData.filter(t => t.type === 'Global' || t.type === 'Biaya');
            tagContainer.innerHTML = dynamicTags.map(t => `<label class="flex items-center gap-1.5 cursor-pointer hover:bg-dark-700/50 px-2 py-1 rounded"><input type="checkbox" value="${t.name}" class="tagCheck accent-blue-500"><span class="text-sm font-medium" style="color: ${t.color}">${t.name}</span></label>`).join('');
            if (dynamicTags.length === 0) tagContainer.innerHTML = '<span class="text-xs text-gray-500 italic flex items-center">Belum ada tag khusus Biaya yang aktif.</span>';
        } else {
            tagContainer.innerHTML = '<span class="text-xs text-rose-500 italic flex items-center">Gagal memuat tag.</span>';
        }
    }
    
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
    calculateTotal();
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
        const dpp = total / 1.11;
        const ppn = total - dpp;
        document.getElementById('lblDPP').innerText = formatRp(dpp);
        document.getElementById('lblTax').innerText = formatRp(ppn);
    } else {
        taxInfo.classList.add('hidden');
    }

    document.getElementById('lblGrandTotal').innerText = formatRp(total);
}

async function saveExpense() {
    const date = document.getElementById('expenseDate').value;
    let receiver = document.getElementById('expenseReceiver').value;
    if(!receiver) receiver = "Pengeluaran Umum";
    
    if(!date) {
        Swal.fire({icon: 'warning', title: 'Perhatian', text: 'Pilih tanggal terlebih dahulu.', background: '#1f2937', color: '#fff'});
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
        Swal.fire({icon: 'warning', title: 'Perhatian', text: 'Tambahkan minimal 1 baris biaya dengan nominal > 0.', background: '#1f2937', color: '#fff'});
        return;
    }

    // Get selected tags
    const checkedTags = Array.from(document.querySelectorAll('.tagCheck:checked')).map(cb => cb.value);
    const tagString = checkedTags.join(', ');

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
        
        let totalItems = 0;
        items.forEach(it => totalItems += it.amount);
        
        items.forEach(it => {
            it.amount = (it.amount / totalItems) * dpp;
        });
    }

    const d = new Date();
    const expenseNo = `EXP/${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${Math.floor(Math.random() * 9000) + 1000}`;

    const expData = {
        expense_no: expenseNo,
        date, 
        receiver, 
        method, 
        source_code: sourceCode, 
        source_name: sourceName,
        items, 
        tax_amount: taxAmount, 
        grand_total: total,
        tag: tagString,
        notes: ''
    };

    // Save to Supabase akt_expenses
    const { data: savedExp, error } = await insertRecord('akt_expenses', expData);
    if (error) {
        Swal.fire({icon: 'error', title: 'Gagal', text: error.message, background: '#1f2937', color: '#fff'});
        return;
    }

    // AUTO JOURNAL (Supabase akt_journals)
    const jLines = [];
    
    // Debit: Akun-akun biaya
    items.forEach(item => {
        jLines.push({ account: item.accountCode, accountName: item.accountName, debit: item.amount, credit: 0 });
    });

    // Debit: PPN Masukan (Jika ada)
    if (taxAmount > 0) {
        jLines.push({ account: '1-10500', accountName: 'PPN Masukan', debit: taxAmount, credit: 0 });
    }

    // Kredit: Sumber Dana (Kas/Bank atau Hutang)
    let creditCode = sourceCode;
    let creditName = sourceName;
    if (method === 'credit') {
        creditCode = '2-20100'; // Hutang Usaha
        creditName = 'Hutang Usaha';
    }

    jLines.push({ account: creditCode, accountName: creditName, debit: 0, credit: total });
    
    await insertRecord('akt_journals', {
        date: date,
        memo: `Biaya ${expenseNo} - ${receiver}`,
        lines: jLines,
        ref_id: expenseNo,
        type: 'EXPENSE'
    });

    Swal.fire({icon: 'success', title: 'Berhasil', text: 'Biaya berhasil dicatat!', background: '#1f2937', color: '#fff', timer: 1500, showConfirmButton: false});
    document.getElementById('expenseDate').value = '';
    document.getElementById('expenseReceiver').value = '';
    document.getElementById('taxInclusive').checked = false;
    
    renderTable();
    toggleView('list');
}

async function renderTable() {
    const { data: expenses, error } = await readRecords('akt_expenses', {}, { order: { column: 'date', ascending: false } });
    if (error) {
        console.error("Gagal load expenses:", error);
        return;
    }

    const tbody = document.getElementById('expenseTableBody');
    if (!expenses || expenses.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-gray-500">Belum ada data pengeluaran.</td></tr>';
        return;
    }
    
    tbody.innerHTML = expenses.map(exp => {
        let sourceBadge = '';
        if(exp.method === 'cash') sourceBadge = `<span class="bg-blue-500/10 text-blue-400 px-2 py-1 rounded text-xs">${exp.source_name}</span>`;
        else sourceBadge = `<span class="bg-orange-500/10 text-orange-400 px-2 py-1 rounded text-xs">Hutang Usaha</span>`;

        let tagBadge = exp.tag ? `<br><span class="inline-block mt-1 text-[10px] bg-dark-700 text-gray-300 px-2 py-0.5 rounded">${exp.tag}</span>` : '';

        return `
        <tr class="hover:bg-dark-700/30 transition-colors">
            <td class="px-6 py-4 font-medium text-white">${exp.expense_no}</td>
            <td class="px-6 py-4">${formatDate(exp.date)}</td>
            <td class="px-6 py-4">
                ${exp.receiver}
                ${tagBadge}
            </td>
            <td class="px-6 py-4">${sourceBadge}</td>
            <td class="px-6 py-4 text-right">${formatRp(exp.grand_total)}</td>
            <td class="px-6 py-4 text-center">
                <button onclick="viewExpense('${exp.id}')" class="text-blue-400 hover:text-blue-300">Lihat</button>
            </td>
        </tr>`;
    }).join('');
}

async function viewExpense(id) {
    const { data: expenses } = await readRecords('akt_expenses', { id: id });
    if (!expenses || expenses.length === 0) return;
    const exp = expenses[0];

    document.getElementById('modalExpId').innerText = exp.expense_no;
    document.getElementById('modalExpDate').innerText = formatDate(exp.date);
    document.getElementById('modalExpReceiver').innerText = exp.receiver;
    document.getElementById('modalExpMethod').innerText = exp.method === 'cash' ? exp.source_name : 'Hutang Usaha';
    document.getElementById('modalExpTotal').innerText = formatRp(exp.grand_total);

    const tbody = document.getElementById('modalExpItems');
    tbody.innerHTML = exp.items.map(it => `
        <tr>
            <td class="py-2">${it.accountName} <span class="text-xs text-gray-500">(${it.accountCode})</span></td>
            <td class="py-2">${it.desc || '-'}</td>
            <td class="py-2 text-right">${formatRp(it.amount)}</td>
        </tr>
    `).join('');

    const taxInfo = document.getElementById('modalExpTaxInfo');
    if (exp.tax_amount > 0) {
        taxInfo.innerHTML = `Termasuk PPN Masukan: <b>${formatRp(exp.tax_amount)}</b>`;
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
    // Inject SweetAlert2
    if(typeof Swal === 'undefined'){
        const script = document.createElement('script');
        script.src = "https://cdn.jsdelivr.net/npm/sweetalert2@11";
        document.head.appendChild(script);
    }
    
    // Auto render table when ready
    if (window.supabaseClient) {
        renderTable();
    } else {
        window.addEventListener('vitta-saas-ready', () => {
            renderTable();
        });
    }
});
