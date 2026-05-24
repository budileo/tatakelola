var formatRp = formatRp || ((num) => 'Rp ' + Math.round(num).toLocaleString('id-ID'));


function toggleReport(type) {
    const types = ['pl', 'bs', 'cf', 'sales', 'purchases'];
    types.forEach(t => {
        const el = document.getElementById('report' + t.toUpperCase().replace('SALES','Sales').replace('PURCHASES','Purchases'));
        if (el) {
            if (t === type) {
                el.classList.remove('hidden');
            } else {
                el.classList.add('hidden');
            }
        }
    });
}

function generateReports() {
    const monthVal = document.getElementById('filterMonth').value; // YYYY-MM
    let startDate = null;
    let endDate = null;
    
    if (monthVal) {
        startDate = `${monthVal}-01`;
        // get last day of month
        const [yy, mm] = monthVal.split('-');
        const lastDay = new Date(yy, parseInt(mm), 0).getDate();
        endDate = `${monthVal}-${String(lastDay).padStart(2, '0')}`;
    }

    if (window.VittaReport) {
        const pl = window.VittaReport.generateLabaRugi(startDate, endDate);
        const bs = window.VittaReport.generateNeraca(endDate);
        const cf = window.VittaReport.generateArusKas(startDate, endDate);
        const sales = window.VittaReport.generateLaporanPenjualan(startDate, endDate);
        const purchases = window.VittaReport.generateLaporanPembelian(startDate, endDate);
        
        renderPL(pl, startDate, endDate);
        renderBS(bs, endDate);
        renderCF(cf, startDate, endDate);
        renderSales(sales, startDate, endDate);
        renderPurchases(purchases, startDate, endDate);
    }
}

function renderPL(pl, startDate, endDate) {
    const periodStr = (startDate && endDate) ? `Periode: ${startDate} s/d ${endDate}` : `Semua Periode`;
    
    document.getElementById('reportPL').innerHTML = `
        <div class="text-center mb-8 border-b border-dark-700 print-border pb-6">
            <h2 class="text-2xl font-bold text-white print-text-dark">LAPORAN LABA RUGI</h2>
            <h3 class="text-lg text-gray-300 print-text-dark font-medium">PT PERUSAHAAN CONTOH</h3>
            <p class="text-sm text-gray-400 print-text-dark">${periodStr}</p>
        </div>
        
        <div class="space-y-6 text-sm">
            <!-- PENDAPATAN -->
            <div>
                <h4 class="font-bold text-blue-400 mb-2 uppercase tracking-wide">Pendapatan Operasional</h4>
                ${pl.pendapatan.map(a => `
                    <div class="flex justify-between py-1 text-gray-300 print-text-dark">
                        <span>${a.name}</span>
                        <span>${formatRp(a.balance)}</span>
                    </div>
                `).join('')}
                <div class="flex justify-between py-2 border-t border-dark-700 print-border mt-1 font-semibold text-white print-text-dark">
                    <span>Total Pendapatan</span>
                    <span>${formatRp(pl.totalPendapatan)}</span>
                </div>
            </div>

            <!-- HPP -->
            <div>
                <h4 class="font-bold text-rose-400 mb-2 uppercase tracking-wide">Harga Pokok Penjualan (HPP)</h4>
                ${pl.hpp.map(a => `
                    <div class="flex justify-between py-1 text-gray-300 print-text-dark">
                        <span>${a.name}</span>
                        <span>${formatRp(Math.abs(a.balance))}</span>
                    </div>
                `).join('')}
                <div class="flex justify-between py-2 border-t border-dark-700 print-border mt-1 font-semibold text-white print-text-dark">
                    <span>Total HPP</span>
                    <span>${formatRp(Math.abs(pl.totalHPP))}</span>
                </div>
                <div class="flex justify-between py-2 mt-2 font-bold text-white print-text-dark text-base bg-dark-700/30 p-2 rounded">
                    <span>Laba Kotor</span>
                    <span>${formatRp(pl.labaKotor)}</span>
                </div>
            </div>

            <!-- BEBAN OPERASIONAL -->
            <div>
                <h4 class="font-bold text-amber-400 mb-2 uppercase tracking-wide">Beban Operasional</h4>
                ${pl.beban.map(a => `
                    <div class="flex justify-between py-1 text-gray-300 print-text-dark">
                        <span>${a.name}</span>
                        <span>${formatRp(a.balance)}</span>
                    </div>
                `).join('')}
                <div class="flex justify-between py-2 border-t border-dark-700 print-border mt-1 font-semibold text-white print-text-dark">
                    <span>Total Beban Operasional</span>
                    <span>${formatRp(pl.totalBeban)}</span>
                </div>
            </div>

            <!-- NET PROFIT -->
            <div class="bg-emerald-500/10 p-4 rounded-lg mt-4 border border-emerald-500/20 print-border">
                <div class="flex justify-between items-center font-bold text-lg text-emerald-400 print-text-dark">
                    <span>Laba Bersih (Net Profit)</span>
                    <span>${formatRp(pl.labaBersih)}</span>
                </div>
            </div>
        </div>
    `;
}

function renderBS(bs, endDate) {
    const periodStr = endDate ? `Per Tanggal: ${endDate}` : `Semua Periode`;
    
    document.getElementById('reportBS').innerHTML = `
        <div class="text-center mb-8 border-b border-dark-700 print-border pb-6">
            <h2 class="text-2xl font-bold text-white print-text-dark">LAPORAN NERACA</h2>
            <h3 class="text-lg text-gray-300 print-text-dark font-medium">PT PERUSAHAAN CONTOH</h3>
            <p class="text-sm text-gray-400 print-text-dark">${periodStr}</p>
        </div>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 text-sm">
            
            <!-- ASET -->
            <div class="space-y-6">
                <h3 class="text-lg font-bold text-white print-text-dark border-b border-dark-700 print-border pb-2">ASET</h3>
                
                <div>
                    <h4 class="font-semibold text-blue-400 mb-2">Aset Lancar</h4>
                    ${bs.aset.lancar.map(a => `
                        <div class="flex justify-between py-1 text-gray-300 print-text-dark">
                            <span>${a.name}</span>
                            <span>${formatRp(a.balance)}</span>
                        </div>
                    `).join('')}
                </div>

                <div>
                    <h4 class="font-semibold text-blue-400 mb-2">Aset Tetap</h4>
                    ${bs.aset.tetap.map(a => `
                        <div class="flex justify-between py-1 text-gray-300 print-text-dark">
                            <span>${a.name}</span>
                            <span>${formatRp(a.balance)}</span>
                        </div>
                    `).join('')}
                    <div class="flex justify-between py-2 border-t border-dark-700 print-border mt-1 font-semibold text-white print-text-dark">
                        <span>Total Aset</span>
                        <span>${formatRp(bs.aset.total)}</span>
                    </div>
                </div>
            </div>

            <!-- KEWAJIBAN & EKUITAS -->
            <div class="space-y-6">
                <h3 class="text-lg font-bold text-white print-text-dark border-b border-dark-700 print-border pb-2">KEWAJIBAN & EKUITAS</h3>
                
                <div>
                    <h4 class="font-semibold text-rose-400 mb-2">Kewajiban</h4>
                    ${bs.kewajiban.pendek.map(a => `
                        <div class="flex justify-between py-1 text-gray-300 print-text-dark">
                            <span>${a.name}</span>
                            <span>${formatRp(a.balance)}</span>
                        </div>
                    `).join('')}
                    ${bs.kewajiban.panjang.map(a => `
                        <div class="flex justify-between py-1 text-gray-300 print-text-dark">
                            <span>${a.name}</span>
                            <span>${formatRp(a.balance)}</span>
                        </div>
                    `).join('')}
                    <div class="flex justify-between py-2 border-t border-dark-700 print-border mt-1 font-semibold text-white print-text-dark">
                        <span>Total Kewajiban</span>
                        <span>${formatRp(bs.kewajiban.total)}</span>
                    </div>
                </div>

                <div>
                    <h4 class="font-semibold text-amber-400 mb-2">Ekuitas</h4>
                    ${bs.ekuitas.list.map(a => `
                        <div class="flex justify-between py-1 text-gray-300 print-text-dark">
                            <span>${a.name}</span>
                            <span>${formatRp(a.balance)}</span>
                        </div>
                    `).join('')}
                    <div class="flex justify-between py-1 text-gray-300 print-text-dark">
                        <span>Laba Tahun Berjalan</span>
                        <span>${formatRp(bs.ekuitas.labaBerjalan)}</span>
                    </div>
                    <div class="flex justify-between py-2 border-t border-dark-700 print-border mt-1 font-semibold text-white print-text-dark">
                        <span>Total Ekuitas</span>
                        <span>${formatRp(bs.ekuitas.total)}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- BALANCE CHECK -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
            <div class="bg-blue-500/10 p-3 rounded border border-blue-500/20 print-border">
                <div class="flex justify-between font-bold text-blue-400 print-text-dark">
                    <span>TOTAL ASET</span>
                    <span>${formatRp(bs.aset.total)}</span>
                </div>
            </div>
            <div class="bg-blue-500/10 p-3 rounded border border-blue-500/20 print-border">
                <div class="flex justify-between font-bold text-blue-400 print-text-dark">
                    <span>TOTAL KEWAJIBAN & EKUITAS</span>
                    <span>${formatRp(bs.kewajiban.total + bs.ekuitas.total)}</span>
                </div>
            </div>
        </div>
    `;
}

function renderCF(cf, startDate, endDate) {
    const periodStr = (startDate && endDate) ? `Periode: ${startDate} s/d ${endDate}` : `Semua Periode`;
    
    document.getElementById('reportCF').innerHTML = `
        <div class="text-center mb-8 border-b border-dark-700 print-border pb-6">
            <h2 class="text-2xl font-bold text-white print-text-dark">LAPORAN ARUS KAS</h2>
            <h3 class="text-lg text-gray-300 print-text-dark font-medium">PT PERUSAHAAN CONTOH</h3>
            <p class="text-sm text-gray-400 print-text-dark">${periodStr}</p>
        </div>
        
        <div class="space-y-6 text-sm max-w-2xl mx-auto">
            <div>
                <h4 class="font-bold text-emerald-400 mb-2 uppercase tracking-wide">Uang Masuk</h4>
                ${(cf.masuk || []).map(a => `
                    <div class="flex justify-between py-1 text-gray-300 print-text-dark border-b border-dark-700/50 print-border">
                        <div>
                            <span class="block text-white">${a.memo || 'Penerimaan'}</span>
                            <span class="text-xs text-gray-500">${a.date}</span>
                        </div>
                        <span class="font-mono text-emerald-400 print-text-dark">${formatRp(a.amount)}</span>
                    </div>
                `).join('')}
                <div class="flex justify-between py-2 border-t border-dark-700 print-border mt-2 font-semibold text-white print-text-dark">
                    <span>Total Uang Masuk</span>
                    <span class="text-emerald-400 print-text-dark">${formatRp(cf.totalMasuk || 0)}</span>
                </div>
            </div>

            <div class="pt-4">
                <h4 class="font-bold text-rose-400 mb-2 uppercase tracking-wide">Uang Keluar</h4>
                ${(cf.keluar || []).map(a => `
                    <div class="flex justify-between py-1 text-gray-300 print-text-dark border-b border-dark-700/50 print-border">
                        <div>
                            <span class="block text-white">${a.memo || 'Pengeluaran'}</span>
                            <span class="text-xs text-gray-500">${a.date}</span>
                        </div>
                        <span class="font-mono text-rose-400 print-text-dark">${formatRp(a.amount)}</span>
                    </div>
                `).join('')}
                <div class="flex justify-between py-2 border-t border-dark-700 print-border mt-2 font-semibold text-white print-text-dark">
                    <span>Total Uang Keluar</span>
                    <span class="text-rose-400 print-text-dark">${formatRp(cf.totalKeluar || 0)}</span>
                </div>
            </div>

            <div class="bg-blue-500/10 p-4 rounded-lg mt-6 border border-blue-500/20 print-border">
                <div class="flex justify-between items-center font-bold text-lg text-blue-400 print-text-dark">
                    <span>Arus Kas Bersih</span>
                    <span>${formatRp(cf.netCashFlow || 0)}</span>
                </div>
            </div>
        </div>
    `;
}

function renderSales(sales, startDate, endDate) {
    const periodStr = (startDate && endDate) ? `Periode: ${startDate} s/d ${endDate}` : `Semua Periode`;
    
    document.getElementById('reportSales').innerHTML = `
        <div class="text-center mb-8 border-b border-dark-700 print-border pb-6">
            <h2 class="text-2xl font-bold text-white print-text-dark">LAPORAN PENJUALAN</h2>
            <h3 class="text-lg text-gray-300 print-text-dark font-medium">PT PERUSAHAAN CONTOH</h3>
            <p class="text-sm text-gray-400 print-text-dark">${periodStr}</p>
        </div>
        
        <div class="overflow-x-auto text-sm">
            <table class="w-full text-left">
                <thead class="bg-dark-700/50 text-gray-400 border-b border-dark-700 text-xs uppercase">
                    <tr>
                        <th class="px-4 py-2 font-semibold print-text-dark">Tanggal</th>
                        <th class="px-4 py-2 font-semibold print-text-dark">No. Invoice</th>
                        <th class="px-4 py-2 font-semibold print-text-dark">Pelanggan</th>
                        <th class="px-4 py-2 font-semibold print-text-dark text-right">Subtotal</th>
                        <th class="px-4 py-2 font-semibold print-text-dark text-right">Grand Total</th>
                        <th class="px-4 py-2 font-semibold print-text-dark text-right">Terbayar</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-dark-700 print-border text-gray-300 print-text-dark">
                    ${sales.items.length === 0 ? '<tr><td colspan="6" class="px-4 py-4 text-center">Tidak ada data</td></tr>' : ''}
                    ${sales.items.map(s => `
                        <tr>
                            <td class="px-4 py-2">${s.date}</td>
                            <td class="px-4 py-2 font-medium">${s.id}</td>
                            <td class="px-4 py-2">${s.customerName || '-'}</td>
                            <td class="px-4 py-2 text-right">${formatRp(s.subtotal)}</td>
                            <td class="px-4 py-2 text-right font-medium text-emerald-400 print-text-dark">${formatRp(s.grandTotal)}</td>
                            <td class="px-4 py-2 text-right">${formatRp(s.totalPaid || 0)}</td>
                        </tr>
                    `).join('')}
                </tbody>
                <tfoot class="bg-dark-800 border-t border-dark-700 font-bold text-white print-text-dark print-border">
                    <tr>
                        <td colspan="4" class="px-4 py-3 text-right uppercase">Total Penjualan</td>
                        <td class="px-4 py-3 text-right text-emerald-400 print-text-dark">${formatRp(sales.total)}</td>
                        <td class="px-4 py-3"></td>
                    </tr>
                </tfoot>
            </table>
        </div>
    `;
}

function renderPurchases(purs, startDate, endDate) {
    const periodStr = (startDate && endDate) ? `Periode: ${startDate} s/d ${endDate}` : `Semua Periode`;
    
    document.getElementById('reportPurchases').innerHTML = `
        <div class="text-center mb-8 border-b border-dark-700 print-border pb-6">
            <h2 class="text-2xl font-bold text-white print-text-dark">LAPORAN PEMBELIAN</h2>
            <h3 class="text-lg text-gray-300 print-text-dark font-medium">PT PERUSAHAAN CONTOH</h3>
            <p class="text-sm text-gray-400 print-text-dark">${periodStr}</p>
        </div>
        
        <div class="overflow-x-auto text-sm">
            <table class="w-full text-left">
                <thead class="bg-dark-700/50 text-gray-400 border-b border-dark-700 text-xs uppercase">
                    <tr>
                        <th class="px-4 py-2 font-semibold print-text-dark">Tanggal</th>
                        <th class="px-4 py-2 font-semibold print-text-dark">No. Referensi</th>
                        <th class="px-4 py-2 font-semibold print-text-dark">Vendor</th>
                        <th class="px-4 py-2 font-semibold print-text-dark text-right">Subtotal</th>
                        <th class="px-4 py-2 font-semibold print-text-dark text-right">Grand Total</th>
                        <th class="px-4 py-2 font-semibold print-text-dark text-right">Terbayar</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-dark-700 print-border text-gray-300 print-text-dark">
                    ${purs.items.length === 0 ? '<tr><td colspan="6" class="px-4 py-4 text-center">Tidak ada data</td></tr>' : ''}
                    ${purs.items.map(p => `
                        <tr>
                            <td class="px-4 py-2">${p.date}</td>
                            <td class="px-4 py-2 font-medium">${p.id}</td>
                            <td class="px-4 py-2">${p.supplierName || p.vendorName || '-'}</td>
                            <td class="px-4 py-2 text-right">${formatRp(p.subtotal)}</td>
                            <td class="px-4 py-2 text-right font-medium text-rose-400 print-text-dark">${formatRp(p.grandTotal)}</td>
                            <td class="px-4 py-2 text-right">${formatRp(p.totalPaid || 0)}</td>
                        </tr>
                    `).join('')}
                </tbody>
                <tfoot class="bg-dark-800 border-t border-dark-700 font-bold text-white print-text-dark print-border">
                    <tr>
                        <td colspan="4" class="px-4 py-3 text-right uppercase">Total Pembelian</td>
                        <td class="px-4 py-3 text-right text-rose-400 print-text-dark">${formatRp(purs.total)}</td>
                        <td class="px-4 py-3"></td>
                    </tr>
                </tfoot>
            </table>
        </div>
    `;
}

document.addEventListener('DOMContentLoaded', () => {
    // Set default month
    const d = new Date();
    document.getElementById('filterMonth').value = \`\${d.getFullYear()}-\${String(d.getMonth()+1).padStart(2,'0')}\`;
    
    // Check local storage or default to PL
    setTimeout(() => {
        const select = document.getElementById('reportTypeSelect');
        if (select) {
            toggleReport(select.value);
            generateReports();
        }
    }, 500);
});
