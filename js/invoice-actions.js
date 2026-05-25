// ========== SHARE & PRINT HELPERS ==========

function getDeptHeader() {
    if (window.getDeptInfo) return window.getDeptInfo();
    return { name: 'Vitta ERP', address: '-', email: '-', phone: '-', whatsapp: '-', ownerName: '-', ownerPhone: '-', logo: '' };
}

function buildKopSurat(dept) {
    return `
        <div style="border-bottom:2px solid #333; padding-bottom:12px; margin-bottom:16px;">
            <h1 style="margin:0; font-size:20px; color:#1a1a1a;">${dept.name}</h1>
            <p style="margin:2px 0; font-size:12px; color:#555;">${dept.address}</p>
            <p style="margin:2px 0; font-size:12px; color:#555;">
                Telp: ${dept.phone} | WA: ${dept.whatsapp} | Email: ${dept.email}
            </p>
        </div>
    `;
}

async function getInvoiceText(inv) {
    const dept = getDeptHeader();
    let txt = `📋 INVOICE ${inv.id}\n`;
    txt += `🏢 ${dept.name}\n`;
    txt += `📍 ${dept.address}\n`;
    txt += `📞 Telp: ${dept.phone} | WA: ${dept.whatsapp}\n`;
    txt += `📧 Email: ${dept.email}\n\n`;
    txt += `Kepada: ${inv.customerName}\n`;
    txt += `Tanggal: ${formatDate(inv.date)}\nJatuh Tempo: ${formatDate(inv.dueDate)}\n\n`;
    txt += `--- Detail Item ---\n`;
    (inv.items||[]).forEach((it,i) => { txt += `${i+1}. ${it.name} x${it.qty} = ${formatRp(it.qty*it.price)}\n`; });
    txt += `\nTotal: ${formatRp(inv.grandTotal)}\nSisa Tagihan: ${formatRp(inv.sisaTagihan)}\n`;
    txt += `Status: ${inv.status.toUpperCase()}\n\nTerima kasih atas kepercayaan Anda.`;
    return txt;
}

async function copyInvoiceLink(invId) {
    const inv = await getInvoiceById(invId);
    if (!inv) return;
    const txt = await getInvoiceText(inv);
    navigator.clipboard.writeText(txt).then(() => alert('✅ Teks invoice berhasil disalin ke clipboard!')).catch(() => {
        prompt('Salin teks di bawah:', txt);
    });
}

async function sendToWA(invId) {
    const inv = await getInvoiceById(invId);
    if (!inv) return;
    const txt = encodeURIComponent(await getInvoiceText(inv));
    window.open(`https://wa.me/?text=${txt}`, '_blank');
}

async function printInvoicePDF(invId) {
    const inv = await getInvoiceById(invId);
    if (!inv) return;
    const dept = getDeptHeader();
    const w = window.open('','','width=800,height=600');
    const rows = (inv.items||[]).map((it,i) => `<tr><td style="padding:4px;border:1px solid #ddd">${i+1}</td><td style="padding:4px;border:1px solid #ddd">${it.name}</td><td style="padding:4px;border:1px solid #ddd;text-align:center">${it.qty}</td><td style="padding:4px;border:1px solid #ddd;text-align:center">${it.unit}</td><td style="padding:4px;border:1px solid #ddd;text-align:right">${formatRp(it.price)}</td><td style="padding:4px;border:1px solid #ddd;text-align:right">${formatRp(it.qty*it.price)}</td></tr>`).join('');
    w.document.write(`<html><head><title>Invoice ${inv.id}</title><style>body{font-family:Arial,sans-serif;padding:30px;color:#333}table{width:100%;border-collapse:collapse;margin:16px 0}th{background:#f5f5f5;padding:6px;border:1px solid #ddd;text-align:left;font-size:12px}td{font-size:12px}.text-right{text-align:right}</style></head><body>
    ${buildKopSurat(dept)}
    <h2 style="margin-top:0">INVOICE</h2>
    <p>Ref: ${inv.id}</p>
    <table><tr><td width="50%"><strong>Kepada:</strong><br>${inv.customerName}</td><td><strong>Tanggal:</strong> ${formatDate(inv.date)}<br><strong>Jatuh Tempo:</strong> ${formatDate(inv.dueDate)}<br><strong>Termin:</strong> Net ${inv.termin} Hari</td></tr></table>
    <table><thead><tr><th>#</th><th>Produk</th><th>Qty</th><th>Satuan</th><th class="text-right">Harga</th><th class="text-right">Jumlah</th></tr></thead><tbody>${rows}</tbody></table>
    <table><tr><td></td><td style="text-align:right;padding:4px"><strong>Subtotal:</strong> ${formatRp(inv.subtotal)}</td></tr><tr><td></td><td style="text-align:right;padding:4px"><strong>Total:</strong> ${formatRp(inv.grandTotal)}</td></tr><tr><td></td><td style="text-align:right;padding:4px"><strong>Sisa Tagihan:</strong> ${formatRp(inv.sisaTagihan)}</td></tr></table>
    <br><p style="font-size:11px;color:#888">Dicetak oleh ${dept.name} (Vitta ERP) pada ${new Date().toLocaleString('id-ID')}</p></body></html>`);
    w.document.close(); w.print();
}

async function printSuratJalan(invId) {
    const inv = await getInvoiceById(invId);
    if (!inv) return;
    const dept = getDeptHeader();
    const w = window.open('','','width=800,height=600');
    const rows = (inv.items||[]).map((it,i) => `<tr><td style="padding:4px;border:1px solid #ddd">${i+1}</td><td style="padding:4px;border:1px solid #ddd">${it.name}</td><td style="padding:4px;border:1px solid #ddd;text-align:center">${it.qty}</td><td style="padding:4px;border:1px solid #ddd;text-align:center">${it.unit}</td></tr>`).join('');
    w.document.write(`<html><head><title>Surat Jalan ${inv.id}</title><style>body{font-family:Arial,sans-serif;padding:30px;color:#333}table{width:100%;border-collapse:collapse;margin:16px 0}th{background:#f5f5f5;padding:6px;border:1px solid #ddd;text-align:left;font-size:12px}td{font-size:12px}</style></head><body>
    ${buildKopSurat(dept)}
    <h2 style="margin-top:0">SURAT JALAN</h2>
    <p>Ref: ${inv.id}</p>
    <table><tr><td width="50%"><strong>Kepada:</strong><br>${inv.customerName}</td><td><strong>Tanggal:</strong> ${formatDate(inv.date)}</td></tr></table>
    <table><thead><tr><th>#</th><th>Produk</th><th>Qty</th><th>Satuan</th></tr></thead><tbody>${rows}</tbody></table>
    <br><br>
    <table width="100%"><tr><td style="text-align:center;padding-top:60px;border-top:1px solid #333;width:33%">Pengirim<br><span style="font-size:10px">${dept.name}</span></td><td width="33%"></td><td style="text-align:center;padding-top:60px;border-top:1px solid #333;width:33%">Penerima</td></tr></table></body></html>`);
    w.document.close(); w.print();
}

async function printPaymentReceipt(invId, payId) {
    const inv = await getInvoiceById(invId);
    if (!inv) return;
    const pay = (inv.payments||[]).find(p => p.id === payId);
    if (!pay) return;
    const dept = getDeptHeader();
    const w = window.open('','','width=800,height=600');
    w.document.write(`<html><head><title>Bukti Bayar ${pay.id}</title><style>body{font-family:Arial,sans-serif;padding:30px;color:#333}table{width:100%;border-collapse:collapse;margin:16px 0}td{padding:6px;font-size:13px}.label{color:#666;width:40%}.val{font-weight:bold}</style></head><body>
    ${buildKopSurat(dept)}
    <h2 style="margin-top:0">BUKTI PENERIMAAN PEMBAYARAN</h2>
    <hr>
    <table>
        <tr><td class="label">No. Pembayaran</td><td class="val">${pay.id}</td></tr>
        <tr><td class="label">Untuk Invoice</td><td class="val">${invId}</td></tr>
        <tr><td class="label">Pelanggan</td><td class="val">${inv.customerName}</td></tr>
        <tr><td class="label">Tanggal Bayar</td><td class="val">${formatDate(pay.date)}</td></tr>
        <tr><td class="label">Dibayar ke</td><td class="val">${pay.bankName}</td></tr>
        <tr><td class="label">Referensi</td><td class="val">${pay.ref||'-'}</td></tr>
        <tr><td class="label">Jumlah Bayar</td><td class="val" style="font-size:18px;color:#16a34a">${formatRp(pay.amount)}</td></tr>
        ${pay.potongan>0?`<tr><td class="label">Potongan</td><td class="val">${formatRp(pay.potongan)}</td></tr>`:''}
        <tr><td class="label">Sisa Tagihan</td><td class="val">${formatRp(inv.sisaTagihan)}</td></tr>
        <tr><td class="label">Status Invoice</td><td class="val">${inv.status.toUpperCase()}</td></tr>
    </table>
    <br><br>
    <table width="100%"><tr><td style="text-align:center;padding-top:50px;border-top:1px solid #333;width:50%">Penerima<br><span style="font-size:10px">${dept.name}</span></td><td style="text-align:center;padding-top:50px;border-top:1px solid #333;width:50%">Pembayar</td></tr></table>
    <p style="font-size:10px;color:#999;margin-top:30px">Dicetak oleh ${dept.name} (Vitta ERP) - ${new Date().toLocaleString('id-ID')}</p></body></html>`);
    w.document.close(); w.print();
}

async function deleteInvoice(invId) {
    if (!confirm('Hapus invoice ' + invId + '? Data tidak bisa dikembalikan.')) return;
    const inv = await getInvoiceById(invId);
    if (!inv) return;
    
    // Reverse Stock Movement (Pulihkan stok barang yang terjual)
    if (window.VittaProduk && inv.items && typeof window.VittaProduk.processStockMovementAsync === 'function') {
        for (const item of inv.items) {
            if (item.productId) {
                // Not fully integrated
            }
        }
    }

    const { error } = await deleteRecord('akt_invoices', inv.dbId);
    if (error) {
        alert('Gagal menghapus: ' + error.message);
        return;
    }

    // invalidate cache
    window.cachedInvoices = window.cachedInvoices.filter(i => i.id !== invId);
    
    addAudit('INVOICE_DELETED', invId, `Invoice ${invId} dihapus.`);
    alert('Invoice dihapus.'); showView('list');
}

async function returInvoice(invId) {
    const inv = await getInvoiceById(invId);
    if (!inv) return;

    // Reverse Stock Movement (Pulihkan stok barang karena retur)
    if (window.VittaProduk && inv.items) {
        // Not fully integrated
    }

    const { error } = await updateRecord('akt_invoices', inv.dbId, { status: 'retur' });
    if (error) {
        alert('Gagal meretur: ' + error.message);
        return;
    }

    inv.status = 'retur';
    addAudit('INVOICE_RETUR', invId, `Invoice ${invId} diretur.`);
    openDetail(invId);
}
