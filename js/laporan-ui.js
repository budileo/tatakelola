const formatRp = (num) => 'Rp ' + Math.round(num).toLocaleString('id-ID');

function toggleReport(type) {
    if (type === 'pl') {
        document.getElementById('reportPL').classList.remove('hidden');
        document.getElementById('reportBS').classList.add('hidden');
    } else {
        document.getElementById('reportPL').classList.add('hidden');
        document.getElementById('reportBS').classList.remove('hidden');
    }
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
        
        renderPL(pl, startDate, endDate);
        renderBS(bs, endDate);
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
                        <span>${formatRp(a.balance)}</span>
                    </div>
                `).join('')}
                <div class="flex justify-between py-2 border-t border-dark-700 print-border mt-1 font-semibold text-white print-text-dark">
                    <span>Total HPP</span>
                    <span>${formatRp(pl.totalHPP)}</span>
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

document.addEventListener('DOMContentLoaded', () => {
    // Set default month
    const d = new Date();
    document.getElementById('filterMonth').value = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    
    // Generate init report
    setTimeout(() => {
        generateReports();
    }, 500);
});
