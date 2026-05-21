// ============================================================
// Tata Kelola One — COA Engine (Chart of Accounts)
// FIXED SYSTEM + AUTO SEED DATABASE
// ============================================================
// Semua user langsung punya COA lengkap tanpa setup manual.
// Akun sistem (is_system=true) tidak bisa dihapus/diedit.
// User bisa menambah akun custom baru.
// ============================================================

(function () {
    'use strict';

    const STORAGE_KEY = 'vitta_coa_accounts';
    const SEED_FLAG   = 'vitta_coa_seeded';

    // ─── SYSTEM ACCOUNTS SEED DATA ───────────────────────────
    // Format: [name, code, category, system_code]
    const SYSTEM_ACCOUNTS = [
        // ══ 1 - ASET ══
        // Kas & Bank
        ['Kas', '1-10001', 'Kas & Bank', 'CASH'],
        ['Rekening Mandiri', '1-10003', 'Kas & Bank', 'BANK_MANDIRI'],
        // Akun Piutang
        ['Piutang Usaha', '1-10100', 'Akun Piutang', 'AR'],
        ['Piutang Belum Ditagih', '1-10101', 'Akun Piutang', 'AR_UNBILLED'],
        ['Cadangan Kerugian Piutang', '1-10102', 'Akun Piutang', 'AR_ALLOWANCE'],
        ['Piutang Customer', '1-10103', 'Akun Piutang', 'AR_CUSTOMER'],
        // Persediaan
        ['Persediaan Barang', '1-10200', 'Persediaan', 'INVENTORY'],
        // Aktiva Lancar Lainnya
        ['Piutang Lainnya', '1-10300', 'Aktiva Lancar Lainnya', 'AR_OTHER'],
        ['Piutang Karyawan', '1-10301', 'Aktiva Lancar Lainnya', 'AR_EMPLOYEE'],
        ['Iuran BPJS', '1-10302', 'Akun Piutang', 'BPJS_RECEIVABLE'],
        ['Dana Belum Disetor', '1-10400', 'Aktiva Lancar Lainnya', 'UNDEPOSITED_FUNDS'],
        ['Aset Lancar Lainnya', '1-10401', 'Aktiva Lancar Lainnya', 'OTHER_CURRENT_ASSET'],
        ['Biaya Dibayar Di Muka', '1-10402', 'Aktiva Lancar Lainnya', 'PREPAID_EXPENSE'],
        ['Uang Muka', '1-10403', 'Aktiva Lancar Lainnya', 'ADVANCE_PAYMENT'],
        ['PPN Masukan', '1-10500', 'Aktiva Lancar Lainnya', 'VAT_IN'],
        ['Pajak Dibayar Di Muka - PPh 22', '1-10501', 'Aktiva Lancar Lainnya', 'PREPAID_TAX_22'],
        ['Pajak Dibayar Di Muka - PPh 23', '1-10502', 'Aktiva Lancar Lainnya', 'PREPAID_TAX_23'],
        ['Pajak Dibayar Di Muka - PPh 25', '1-10503', 'Aktiva Lancar Lainnya', 'PREPAID_TAX_25'],
        // Aktiva Tetap
        ['Aset Tetap - Tanah', '1-10700', 'Aktiva Tetap', 'FA_LAND'],
        ['Aset Tetap - Bangunan', '1-10701', 'Aktiva Tetap', 'FA_BUILDING'],
        ['Aset Tetap - Building Improvements', '1-10702', 'Aktiva Tetap', 'FA_BUILDING_IMP'],
        ['Aset Tetap - Kendaraan', '1-10703', 'Aktiva Tetap', 'FA_VEHICLE'],
        ['Aset Tetap - Mesin & Peralatan', '1-10704', 'Aktiva Tetap', 'FA_MACHINE'],
        ['Aset Tetap - Perlengkapan Kantor', '1-10705', 'Aktiva Tetap', 'FA_OFFICE_EQUIP'],
        ['Aset Tetap - Aset Sewa Guna Usaha', '1-10706', 'Aktiva Tetap', 'FA_LEASED'],
        ['Aset Tak Berwujud', '1-10707', 'Aktiva Tetap', 'INTANGIBLE_ASSET'],
        // Depresiasi & Amortisasi
        ['Akumulasi Penyusutan - Bangunan', '1-10751', 'Depresiasi & Amortisasi', 'ACCUM_DEP_BUILDING'],
        ['Akumulasi Penyusutan - Building Improvements', '1-10752', 'Depresiasi & Amortisasi', 'ACCUM_DEP_BUILDING_IMP'],
        ['Akumulasi penyusutan - Kendaraan', '1-10753', 'Depresiasi & Amortisasi', 'ACCUM_DEP_VEHICLE'],
        ['Akumulasi Penyusutan - Mesin & Peralatan', '1-10754', 'Depresiasi & Amortisasi', 'ACCUM_DEP_MACHINE'],
        ['Akumulasi Penyusutan - Peralatan Kantor', '1-10755', 'Depresiasi & Amortisasi', 'ACCUM_DEP_OFFICE'],
        ['Akumulasi Penyusutan - Aset Sewa Guna Usaha', '1-10756', 'Depresiasi & Amortisasi', 'ACCUM_DEP_LEASED'],
        ['Akumulasi Amortisasi', '1-10757', 'Depresiasi & Amortisasi', 'ACCUM_AMORT'],
        // Aktiva Lainnya
        ['Investasi', '1-10800', 'Aktiva Lainnya', 'INVESTMENT'],

        // ══ 2 - KEWAJIBAN ══
        // Akun Hutang
        ['Hutang Usaha', '2-20100', 'Akun Hutang', 'AP'],
        ['Hutang Belum Ditagih', '2-20101', 'Akun Hutang', 'AP_UNBILLED'],
        ['HUTANG BPJS', '2-20102', 'Akun Hutang', 'AP_BPJS'],
        ['Hutang Pelanggan', '2-20103', 'Akun Hutang', 'AP_CUSTOMER'],
        ['PPN KURANG BAYAR', '2-20104', 'Akun Hutang', 'VAT_PAYABLE_SHORT'],
        ['HUTANG PEMBELIAN ASET', '2-20105', 'Akun Hutang', 'AP_ASSET_PURCHASE'],
        ['Uang Titipan Pajak Reklame', '2-20106', 'Akun Hutang', 'TAX_DEPOSIT_ADV'],
        // Kewajiban Lancar Lainnya
        ['Hutang Lain Lain', '2-20200', 'Kewajiban Lancar Lainnya', 'AP_OTHER'],
        ['Hutang Gaji', '2-20201', 'Kewajiban Lancar Lainnya', 'AP_SALARY'],
        ['Hutang Deviden', '2-20202', 'Kewajiban Lancar Lainnya', 'AP_DIVIDEND'],
        ['Pendapatan Diterima Di Muka', '2-20203', 'Kewajiban Lancar Lainnya', 'UNEARNED_REVENUE'],
        ['Hutang Konsinyasi', '2-20205', 'Kewajiban Lancar Lainnya', 'AP_CONSIGNMENT'],
        ['Sarana Kantor Terhutang', '2-20301', 'Kewajiban Lancar Lainnya', 'ACCRUED_OFFICE'],
        ['Bunga Terhutang', '2-20302', 'Kewajiban Lancar Lainnya', 'ACCRUED_INTEREST'],
        ['Biaya Terhutang Lainnya', '2-20399', 'Kewajiban Lancar Lainnya', 'ACCRUED_OTHER'],
        ['Hutang Bank', '2-20400', 'Kewajiban Lancar Lainnya', 'BANK_LOAN'],
        ['PPN Keluaran', '2-20500', 'Kewajiban Lancar Lainnya', 'VAT_OUT'],
        ['Hutang Pajak - PPh 21', '2-20501', 'Kewajiban Lancar Lainnya', 'TAX_PAYABLE_21'],
        ['Hutang Pajak - PPh 22', '2-20502', 'Kewajiban Lancar Lainnya', 'TAX_PAYABLE_22'],
        ['Hutang Pajak - PPh 23', '2-20503', 'Kewajiban Lancar Lainnya', 'TAX_PAYABLE_23'],
        ['Hutang Pajak - PPh 29', '2-20504', 'Kewajiban Lancar Lainnya', 'TAX_PAYABLE_29'],
        ['Hutang Pajak Lainnya', '2-20599', 'Kewajiban Lancar Lainnya', 'TAX_PAYABLE_OTHER'],
        ['Hutang dari Pemegang Saham', '2-20600', 'Kewajiban Lancar Lainnya', 'SHAREHOLDER_LOAN'],
        ['Kewajiban Lancar Lainnya', '2-20601', 'Kewajiban Lancar Lainnya', 'OTHER_CURRENT_LIABILITY'],
        // Kewajiban Jangka Panjang
        ['Kewajiban Manfaat Karyawan', '2-20700', 'Kewajiban Jangka Panjang', 'EMPLOYEE_BENEFIT_LIABILITY'],

        // ══ 3 - EKUITAS ══
        ['Modal Saham', '3-30000', 'Ekuitas', 'SHARE_CAPITAL'],
        ['Tambahan Modal Disetor', '3-30001', 'Ekuitas', 'ADDITIONAL_PAID_IN'],
        ['Laba Ditahan', '3-30100', 'Ekuitas', 'RETAINED_EARNINGS'],
        ['Deviden', '3-30200', 'Ekuitas', 'DIVIDEND'],
        ['Pendapatan Komprehensif Lainnya', '3-30300', 'Ekuitas', 'OCI'],
        ['Ekuitas Saldo Awal', '3-30999', 'Ekuitas', 'OPENING_EQUITY'],

        // ══ 4 - PENDAPATAN ══
        ['Pendapatan', '4-40000', 'Pendapatan', 'REVENUE'],
        ['Diskon Penjualan', '4-40100', 'Pendapatan', 'SALES_DISCOUNT'],
        ['Retur Penjualan', '4-40200', 'Pendapatan', 'SALES_RETURN'],
        ['Pendapatan Belum Ditagih', '4-40201', 'Pendapatan', 'UNBILLED_REVENUE'],

        // ══ 5 - HARGA POKOK PENJUALAN ══
        ['Beban Pokok Pendapatan', '5-50000', 'Harga Pokok Penjualan', 'COGS'],
        ['Diskon Pembelian', '5-50100', 'Harga Pokok Penjualan', 'PURCHASE_DISCOUNT'],
        ['Retur Pembelian', '5-50200', 'Harga Pokok Penjualan', 'PURCHASE_RETURN'],
        ['Pengiriman & Pengangkutan', '5-50300', 'Harga Pokok Penjualan', 'SHIPPING_COST'],
        ['Biaya Impor', '5-50400', 'Harga Pokok Penjualan', 'IMPORT_COST'],
        ['Biaya Produksi', '5-50500', 'Harga Pokok Penjualan', 'PRODUCTION_COST'],

        // ══ 6 - BEBAN ══
        ['Iklan & Promosi', '6-60001', 'Beban', 'EXP_ADVERTISING'],
        ['Komisi & Fee', '6-60002', 'Beban', 'EXP_COMMISSION'],
        ['Bensin, Tol dan Parkir - Penjualan', '6-60003', 'Beban', 'EXP_FUEL_SALES'],
        ['Perjalanan Dinas - Penjualan', '6-60004', 'Beban', 'EXP_TRAVEL_SALES'],
        ['Komunikasi - Penjualan', '6-60005', 'Beban', 'EXP_COMM_SALES'],
        ['Bunga Pinjaman Bank', '6-60006', 'Beban', 'EXP_BANK_INTEREST'],
        ['Biaya MDR Penjualan', '6-60007', 'Beban', 'EXP_MDR'],
        ['Gaji', '6-60101', 'Beban', 'EXP_SALARY'],
        ['Upah', '6-60102', 'Beban', 'EXP_WAGE'],
        ['Makanan & Transportasi', '6-60103', 'Beban', 'EXP_MEAL_TRANSPORT'],
        ['Lembur', '6-60104', 'Beban', 'EXP_OVERTIME'],
        ['Pengobatan', '6-60105', 'Beban', 'EXP_MEDICAL'],
        ['THR & Bonus', '6-60106', 'Beban', 'EXP_THR_BONUS'],
        ['Jamsostek', '6-60107', 'Beban', 'EXP_JAMSOSTEK'],
        ['Insentif', '6-60108', 'Beban', 'EXP_INCENTIVE'],
        ['Pesangon', '6-60109', 'Beban', 'EXP_SEVERANCE'],
        ['Manfaat dan Tunjangan Lain', '6-60110', 'Beban', 'EXP_OTHER_BENEFIT'],
        ['Donasi', '6-60200', 'Beban', 'EXP_DONATION'],
        ['Hiburan', '6-60201', 'Beban', 'EXP_ENTERTAINMENT'],
        ['Bensin, Tol dan Parkir - Umum', '6-60202', 'Beban', 'EXP_FUEL_GENERAL'],
        ['Perbaikan & Pemeliharaan', '6-60203', 'Beban', 'EXP_MAINTENANCE'],
        ['Perjalanan Dinas - Umum', '6-60204', 'Beban', 'EXP_TRAVEL_GENERAL'],
        ['Makanan', '6-60205', 'Beban', 'EXP_FOOD'],
        ['Komunikasi - Umum', '6-60206', 'Beban', 'EXP_COMM_GENERAL'],
        ['Telpon dan Wifi', '6-60207', 'Beban', 'EXP_PHONE_WIFI'],
        ['Asuransi', '6-60208', 'Beban', 'EXP_INSURANCE'],
        ['Legal & Profesional', '6-60209', 'Beban', 'EXP_LEGAL'],
        ['Beban Manfaat Karyawan', '6-60210', 'Beban', 'EXP_EMPLOYEE_BENEFIT'],
        ['Sarana Kantor', '6-60211', 'Beban', 'EXP_OFFICE_FACILITY'],
        ['Pelatihan & Pengembangan', '6-60212', 'Beban', 'EXP_TRAINING'],
        ['Beban Piutang Tak Tertagih', '6-60213', 'Beban', 'EXP_BAD_DEBT'],
        ['Pajak Reklame, PPh, PBB dan Perizinan', '6-60214', 'Beban', 'EXP_TAX_LICENSE'],
        ['Denda', '6-60215', 'Beban', 'EXP_PENALTY'],
        ['Pengeluaran Barang Rusak', '6-60216', 'Beban', 'EXP_DAMAGED_GOODS'],
        ['Listrik', '6-60217', 'Beban', 'EXP_ELECTRICITY'],
        ['Air', '6-60218', 'Beban', 'EXP_WATER'],
        ['IPL', '6-60219', 'Beban', 'EXP_IPL'],
        ['Langganan Software', '6-60220', 'Beban', 'EXP_SOFTWARE'],
        ['Telepon', '6-60221', 'Beban', 'EXP_TELEPHONE'],
        ['Jasa Konsultan Pajak', '6-60222', 'Beban', 'EXP_TAX_CONSULTANT'],
        ['Beban Kantor', '6-60300', 'Beban', 'EXP_OFFICE'],
        ['Alat Tulis Kantor & Printing', '6-60301', 'Beban', 'EXP_STATIONERY'],
        ['Bea Materai', '6-60302', 'Beban', 'EXP_STAMP'],
        ['Keamanan dan Kebersihan', '6-60303', 'Beban', 'EXP_SECURITY'],
        ['Supplies dan Material', '6-60304', 'Beban', 'EXP_SUPPLIES'],
        ['Pemborong', '6-60305', 'Beban', 'EXP_CONTRACTOR'],
        ['Biaya Sewa - Bangunan', '6-60400', 'Beban', 'EXP_RENT_BUILDING'],
        ['Biaya Sewa - Kendaraan', '6-60401', 'Beban', 'EXP_RENT_VEHICLE'],
        ['Biaya Sewa - Operasional', '6-60402', 'Beban', 'EXP_RENT_OPS'],
        ['Biaya Sewa - Lain - lain', '6-60403', 'Beban', 'EXP_RENT_OTHER'],
        ['Biaya Transfer', '6-60404', 'Beban', 'EXP_TRANSFER_FEE'],
        ['Biaya Admin', '6-60405', 'Beban', 'EXP_ADMIN_FEE'],
        ['Penyusutan - Bangunan', '6-60500', 'Beban', 'DEP_BUILDING'],
        ['Penyusutan - Perbaikan Bangunan', '6-60501', 'Beban', 'DEP_BUILDING_IMP'],
        ['Penyusutan - Kendaraan', '6-60502', 'Beban', 'DEP_VEHICLE'],
        ['Penyusutan - Mesin & Peralatan', '6-60503', 'Beban', 'DEP_MACHINE'],
        ['Penyusutan - Peralatan Kantor', '6-60504', 'Beban', 'DEP_OFFICE'],
        ['Penyusutan - Aset Sewa Guna Usaha', '6-60599', 'Beban', 'DEP_LEASED'],

        // ══ 7 - PENDAPATAN LAINNYA ══
        ['Pendapatan Bunga - Bank', '7-70000', 'Pendapatan Lainnya', 'OTHER_INC_BANK_INTEREST'],
        ['Pendapatan Bunga - Deposito', '7-70001', 'Pendapatan Lainnya', 'OTHER_INC_DEPOSIT_INTEREST'],
        ['Pendapatan Komisi - Barang Konsinyasi', '7-70002', 'Pendapatan Lainnya', 'OTHER_INC_CONSIGNMENT'],
        ['Pembulatan', '7-70003', 'Pendapatan Lainnya', 'ROUNDING'],
        ['Pendapatan Lain - lain', '7-70099', 'Pendapatan Lainnya', 'OTHER_INCOME'],
        ['Pendapatan lainnya (Service Charge)', '7-70100', 'Pendapatan Lainnya', 'OTHER_INC_SERVICE_CHARGE'],
        ['Biaya Tambahan Pelanggan', '7-70101', 'Pendapatan Lainnya', 'CUSTOMER_SURCHARGE'],

        // ══ 8 - BEBAN LAINNYA ══
        ['Beban Bunga', '8-80000', 'Beban Lainnya', 'OTHER_EXP_INTEREST'],
        ['Provisi', '8-80001', 'Beban Lainnya', 'OTHER_EXP_PROVISION'],
        ['(Laba)/Rugi Pelepasan Aset Tetap', '8-80002', 'Beban Lainnya', 'GAIN_LOSS_ASSET_DISPOSAL'],
        ['Penyesuaian Persediaan', '8-80100', 'Beban Lainnya', 'INVENTORY_ADJUSTMENT'],
        ['Beban Lain - lain', '8-80999', 'Beban Lainnya', 'OTHER_EXPENSE'],
        ['Revaluasi Bank', '8-81001', 'Beban Lainnya', 'BANK_REVALUATION'],
        ['Laba/Rugi Selisih Kurs - Belum Direalisasikan', '8-81002', 'Beban Lainnya', 'UNREALIZED_FX'],
        ['Laba/Rugi Selisih Kurs - Belum Direalisasikan (2)', '8-81002-1', 'Beban Lainnya', 'UNREALIZED_FX_2'],
        ['Laba/Rugi Selisih Kurs - Realisasikan', '8-81003', 'Beban Lainnya', 'REALIZED_FX'],

        // ══ 9 - BEBAN PAJAK ══
        ['Beban Pajak Bank', '9-90000', 'Beban Lainnya', 'TAX_EXP_BANK'],
        ['Beban Pajak - Tangguhan', '9-90001', 'Beban Lainnya', 'TAX_EXP_DEFERRED'],
    ];

    // ─── CATEGORY GROUP MAPPING ──────────────────────────────
    const CATEGORY_GROUPS = {
        'Kas & Bank': '1 - Aset',
        'Akun Piutang': '1 - Aset',
        'Persediaan': '1 - Aset',
        'Aktiva Lancar Lainnya': '1 - Aset',
        'Aktiva Tetap': '1 - Aset',
        'Depresiasi & Amortisasi': '1 - Aset',
        'Aktiva Lainnya': '1 - Aset',
        'Akun Hutang': '2 - Kewajiban',
        'Kewajiban Lancar Lainnya': '2 - Kewajiban',
        'Kewajiban Jangka Panjang': '2 - Kewajiban',
        'Ekuitas': '3 - Ekuitas',
        'Pendapatan': '4 - Pendapatan',
        'Harga Pokok Penjualan': '5 - HPP',
        'Beban': '6 - Beban',
        'Pendapatan Lainnya': '7 - Pendapatan Lainnya',
        'Beban Lainnya': '8 - Beban Lainnya',
    };

    // ─── AUTO SEED ───────────────────────────────────────────
    function seedAccounts() {
        if (localStorage.getItem(SEED_FLAG) === 'true') return;

        const existing = getAccounts();
        const existingCodes = new Set(existing.map(a => a.code));

        const now = new Date().toISOString();
        SYSTEM_ACCOUNTS.forEach(([name, code, category, systemCode]) => {
            if (existingCodes.has(code)) return; // skip duplicates
            existing.push({
                id: generateId(),
                name: name,
                code: code,
                category: category,
                group: CATEGORY_GROUPS[category] || '',
                parent_id: null,
                system_code: systemCode,
                is_system: true,
                is_editable: false,
                is_deletable: false,
                is_active: true,
                balance: 0,
                created_at: now,
                updated_at: now,
            });
        });

        localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
        localStorage.setItem(SEED_FLAG, 'true');
    }

    // ─── CRUD ────────────────────────────────────────────────

    function getAccounts() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        } catch (e) { return []; }
    }

    function saveAccounts(accounts) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
    }

    function getAccountById(id) {
        return getAccounts().find(a => a.id === id) || null;
    }

    function getAccountByCode(code) {
        return getAccounts().find(a => a.code === code) || null;
    }

    function getAccountBySystemCode(systemCode) {
        return getAccounts().find(a => a.system_code === systemCode) || null;
    }

    function getAccountsByCategory(category) {
        return getAccounts().filter(a => a.category === category && a.is_active);
    }

    function getAccountsByGroup(group) {
        return getAccounts().filter(a => a.group === group && a.is_active);
    }

    function getActiveAccounts() {
        return getAccounts().filter(a => a.is_active);
    }

    /** Get accounts suitable for revenue (4-xxxxx) */
    function getRevenueAccounts() {
        return getAccounts().filter(a => a.code.startsWith('4-') && a.is_active);
    }

    /** Get accounts suitable for COGS/Expense (5-xxxxx, 6-xxxxx) */
    function getCOGSAccounts() {
        return getAccounts().filter(a => (a.code.startsWith('5-') || a.code.startsWith('6-')) && a.is_active);
    }

    /** Get accounts suitable for inventory (1-102xx - Persediaan) */
    function getInventoryAccounts() {
        return getAccounts().filter(a => a.category === 'Persediaan' && a.is_active);
    }

    /** Add a new custom account */
    function addAccount(data) {
        const accounts = getAccounts();
        // Check unique code
        if (accounts.some(a => a.code === data.code)) {
            return { success: false, error: 'Kode akun sudah digunakan' };
        }
        const now = new Date().toISOString();
        const account = {
            id: generateId(),
            name: data.name,
            code: data.code,
            category: data.category || '',
            group: CATEGORY_GROUPS[data.category] || '',
            parent_id: data.parent_id || null,
            system_code: data.system_code || null,
            is_system: false,
            is_editable: true,
            is_deletable: true,
            is_active: true,
            balance: 0,
            created_at: now,
            updated_at: now,
        };
        accounts.push(account);
        saveAccounts(accounts);
        return { success: true, account };
    }

    /** Update a custom account (system accounts can't be edited) */
    function updateAccount(id, data) {
        const accounts = getAccounts();
        const idx = accounts.findIndex(a => a.id === id);
        if (idx === -1) return { success: false, error: 'Akun tidak ditemukan' };
        if (accounts[idx].is_system && !accounts[idx].is_editable) {
            return { success: false, error: 'Akun sistem tidak bisa diedit' };
        }
        // Check code uniqueness (exclude self)
        if (data.code && accounts.some(a => a.code === data.code && a.id !== id)) {
            return { success: false, error: 'Kode akun sudah digunakan' };
        }
        Object.assign(accounts[idx], data, {
            updated_at: new Date().toISOString(),
            group: CATEGORY_GROUPS[data.category || accounts[idx].category] || accounts[idx].group,
        });
        saveAccounts(accounts);
        return { success: true, account: accounts[idx] };
    }

    /** Delete a custom account (system accounts can't be deleted) */
    function deleteAccount(id) {
        const accounts = getAccounts();
        const idx = accounts.findIndex(a => a.id === id);
        if (idx === -1) return { success: false, error: 'Akun tidak ditemukan' };
        if (!accounts[idx].is_deletable) {
            return { success: false, error: 'Akun ini tidak bisa dihapus' };
        }
        accounts.splice(idx, 1);
        saveAccounts(accounts);
        return { success: true };
    }

    /** Get all unique categories */
    function getCategories() {
        const accounts = getAccounts();
        const cats = new Set(accounts.map(a => a.category));
        return Array.from(cats).sort();
    }

    /** Get all unique groups */
    function getGroups() {
        return Object.values(CATEGORY_GROUPS).filter((v, i, a) => a.indexOf(v) === i);
    }

    // ─── HELPERS ─────────────────────────────────────────────

    function generateId() {
        return 'coa_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6);
    }

    // ─── INIT & EXPOSE ──────────────────────────────────────

    seedAccounts();

    window.VittaCOA = {
        getAccounts,
        getActiveAccounts,
        getAccountById,
        getAccountByCode,
        getAccountBySystemCode,
        getAccountsByCategory,
        getAccountsByGroup,
        getRevenueAccounts,
        getCOGSAccounts,
        getInventoryAccounts,
        addAccount,
        updateAccount,
        deleteAccount,
        getCategories,
        getGroups,
        CATEGORY_GROUPS,
    };

})();
