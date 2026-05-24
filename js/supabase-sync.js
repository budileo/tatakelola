// js/supabase-sync.js
// VITTA ERP - Supabase Transparent SaaS Sync Engine

(function() {
    'use strict';

    // Kunci ERP yang perlu disinkronkan
    const SYNC_KEYS = {
        'vitta_coa_accounts': { table: 'akt_coa_accounts', mapToDb: mapCoaToDb, mapToLocal: mapCoaToLocal },
        'vitta_journals': { table: 'akt_journals', mapToDb: mapJournalToDb, mapToLocal: mapJournalToLocal },
        'vitta_products': { table: 'akt_products', mapToDb: mapProductToDb, mapToLocal: mapProductToLocal },
        'vitta_stock_ledger': { table: 'akt_stock_ledger', mapToDb: mapStockToDb, mapToLocal: mapStockToLocal },
        'vitta_contacts': { table: 'akt_contacts', mapToDb: mapContactToDb, mapToLocal: mapContactToLocal },
        'vitta_mock_departments': { table: 'akt_departments', mapToDb: mapDeptToDb, mapToLocal: mapDeptToLocal }
    };

    // --- DETERMINISTIC UUID BRIDGE ---
    window.stringToUUID = function(str) {
        if (!str) return '00000000-0000-0000-0000-000000000000';
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(str)) return str;

        // Buat hash deterministik 32-karakter dari string input
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }

        let hex = "";
        for (let j = 0; j < 4; j++) {
            let val = Math.abs(hash ^ (j * 0x12345678));
            hex += val.toString(16).padStart(8, '0');
        }
        hex = hex.substring(0, 32);

        return `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20, 32)}`;
    };

    // --- MAPPING FUNCTIONS (LOCAL -> DB) ---
    function mapCoaToDb(c) {
        return {
            name: c.name || '',
            code: c.code || '',
            category: c.category || '',
            group: c.group || '',
            is_system: !!c.is_system,
            is_active: c.is_active !== false,
            balance: parseFloat(c.balance) || 0.00
        };
    }

    function mapJournalToDb(j) {
        return {
            date: j.date || new Date().toISOString().split('T')[0],
            memo: j.memo || '',
            ref_id: j.refId || j.ref_id || '',
            type: j.type || 'GENERAL',
            status: j.status || 'posted',
            lines: j.lines || []
        };
    }

    function mapProductToDb(p) {
        return {
            name: p.name || '',
            sku: p.sku || '',
            category_name: p.category_name || 'Barang Dagang',
            unit: p.unit || 'pcs',
            description: p.description || '',
            image_url: p.image || p.image_url || '',
            is_purchased: !!p.is_purchased,
            is_sold: !!p.is_sold,
            is_tracked: !!p.is_tracked,
            buy_price: parseFloat(p.buy_price) || 0.00,
            sell_price: parseFloat(p.sell_price) || 0.00,
            initial_stock: parseFloat(p.initial_stock) || 0.00,
            current_stock: parseFloat(p.current_stock) || 0.00,
            min_stock: parseFloat(p.min_stock) || 0.00
        };
    }

    function mapStockToDb(l) {
        return {
            product_id: window.stringToUUID(l.productId || l.product_id),
            type: l.type || 'INITIAL',
            reference_no: l.referenceNo || l.reference_no || '',
            qty: parseFloat(l.qty) || 0,
            unit_cost: parseFloat(l.unitCost || l.unit_cost) || 0,
            stock_before: parseFloat(l.stockBefore || l.stock_before) || 0,
            stock_after: parseFloat(l.stockAfter || l.stock_after) || 0,
            notes: l.notes || ''
        };
    }

    function mapContactToDb(c) {
        return {
            name: c.name || '',
            company: c.company || '',
            number: c.number || '',
            phone: c.phone || '',
            email: c.email || '',
            address: c.address || '',
            npwp: c.npwp || '',
            nik: c.nik || '',
            notes: c.notes || '',
            type: c.type || 'Customer',
            status: c.status || 'ACTIVE',
            ar_balance: parseFloat(c.arBalance || c.ar_balance) || 0.00,
            ap_balance: parseFloat(c.apBalance || c.ap_balance) || 0.00
        };
    }

    function mapDeptToDb(d) {
        return {
            name: d.name || '',
            address: d.address || '',
            email: d.email || '',
            phone: d.phone || '',
            whatsapp: d.whatsapp || '',
            logo_url: d.logo || d.logo_url || '',
            invite_token: d.invite_token || d.inviteToken || ''
        };
    }

    // --- MAPPING FUNCTIONS (DB -> LOCAL) ---
    function mapCoaToLocal(c) {
        return {
            id: c.id,
            name: c.name,
            code: c.code,
            category: c.category,
            group: c.group,
            is_system: c.is_system,
            is_active: c.is_active,
            balance: parseFloat(c.balance) || 0.00
        };
    }

    function mapJournalToLocal(j) {
        return {
            id: j.id,
            date: j.date,
            memo: j.memo,
            refId: j.ref_id,
            type: j.type,
            status: j.status,
            lines: j.lines
        };
    }

    function mapProductToLocal(p) {
        return {
            id: p.id,
            name: p.name,
            sku: p.sku,
            category_name: p.category_name,
            unit: p.unit,
            description: p.description,
            image: p.image_url,
            is_purchased: p.is_purchased,
            is_sold: p.is_sold,
            is_tracked: p.is_tracked,
            buy_price: parseFloat(p.buy_price) || 0.00,
            sell_price: parseFloat(p.sell_price) || 0.00,
            initial_stock: parseFloat(p.initial_stock) || 0.00,
            current_stock: parseFloat(p.current_stock) || 0.00,
            min_stock: parseFloat(p.min_stock) || 0.00
        };
    }

    function mapStockToLocal(l) {
        return {
            id: l.id,
            productId: l.product_id,
            type: l.type,
            referenceNo: l.reference_no,
            qty: parseFloat(l.qty) || 0,
            unitCost: parseFloat(l.unit_cost) || 0,
            stockBefore: parseFloat(l.stock_before) || 0,
            stockAfter: parseFloat(l.stock_after) || 0,
            notes: l.notes
        };
    }

    function mapContactToLocal(c) {
        return {
            id: c.id,
            name: c.name,
            company: c.company,
            number: c.number,
            phone: c.phone,
            email: c.email,
            address: c.address,
            npwp: c.npwp,
            nik: c.nik,
            notes: c.notes,
            type: c.type,
            status: c.status,
            arBalance: parseFloat(c.ar_balance) || 0.00,
            apBalance: parseFloat(c.ap_balance) || 0.00
        };
    }

    function mapDeptToLocal(d) {
        return {
            id: d.id,
            name: d.name,
            address: d.address,
            email: d.email,
            phone: d.phone,
            whatsapp: d.whatsapp,
            logo: d.logo_url,
            invite_token: d.invite_token
        };
    }

    // --- CORE PULL LOGIC (CLOUD TO CACHE) ---
    window.pullCloudData = async function() {
        if (!window.supabaseClient) return;
        const userStr = localStorage.getItem('vitta_user');
        if (!userStr) return;
        const user = JSON.parse(userStr);
        if (!user || !user.id) return;

        console.log("☁️ Mengunduh data terbaru dari Supabase...");

        try {
            // 1. Ambil Departemen
            const { data: depts, error: deptErr } = await window.supabaseClient
                .from('akt_departments')
                .select('*')
                .eq('user_id', user.id);
            if (deptErr) throw deptErr;

            if (depts) {
                const localDepts = depts.map(d => mapDeptToLocal(d));
                localStorage.setItem('vitta_mock_departments', JSON.stringify(localDepts));
            }

            // 2. Ambil seluruh data tabel utama
            const tables = ['akt_coa_accounts', 'akt_journals', 'akt_products', 'akt_stock_ledger', 'akt_contacts'];
            const promises = tables.map(tbl => 
                window.supabaseClient.from(tbl).select('*').eq('user_id', user.id)
            );

            const results = await Promise.all(promises);

            // Bersihkan data cache lama untuk mencegah residu departemen lain
            const activeDeptStr = localStorage.getItem('vitta_active_dept');
            const activeDept = activeDeptStr ? JSON.parse(activeDeptStr) : null;
            const activeDeptId = activeDept ? activeDept.id : null;

            // Inisialisasi struktur data kosong untuk setiap departemen
            const keysToSync = ['vitta_coa_accounts', 'vitta_journals', 'vitta_products', 'vitta_stock_ledger', 'vitta_contacts'];
            
            // Map dan kelompokkan data berdasarkan department_id
            results.forEach((res, idx) => {
                if (res.error) {
                    console.warn(`Gagal mengunduh tabel ${tables[idx]}:`, res.error.message);
                    return;
                }

                const dbRows = res.data || [];
                const tableConfig = Object.values(SYNC_KEYS).find(v => v.table === tables[idx]);
                const baseKey = Object.keys(SYNC_KEYS).find(k => SYNC_KEYS[k].table === tables[idx]);

                // Kelompokkan data per department
                const grouped = {};
                dbRows.forEach(row => {
                    const deptId = row.department_id || 'global';
                    if (!grouped[deptId]) grouped[deptId] = [];
                    grouped[deptId].push(tableConfig.mapToLocal(row));
                });

                // Tulis ke localStorage untuk setiap departemen yang ada datanya
                // Dan pastikan minimal departemen aktif saat ini terinisialisasi
                if (activeDeptId) {
                    const activeScopedKey = activeDeptId + '_' + baseKey;
                    const activeList = grouped[activeDeptId] || [];
                    localStorage.setItem(activeScopedKey, JSON.stringify(activeList));
                }

                for (const [deptId, list] of Object.entries(grouped)) {
                    if (deptId !== 'global') {
                        const scopedKey = deptId + '_' + baseKey;
                        localStorage.setItem(scopedKey, JSON.stringify(list));
                    }
                }
            });

            console.log("✅ Unduh data dari Supabase selesai!");
        } catch (err) {
            console.error("❌ Gagal mengunduh data dari Cloud:", err.message);
        }
    };

    // --- CORE PUSH LOGIC (CACHE TO CLOUD) ---
    async function pushLocalData(key, value) {
        if (!window.supabaseClient) return;
        const userStr = localStorage.getItem('vitta_user');
        if (!userStr) return;
        const user = JSON.parse(userStr);
        if (!user || !user.id) return;

        // Deteksi apakah key adalah scoped key
        let baseKey = null;
        let departmentId = null;

        // Cari departemen aktif saat ini
        const activeDeptStr = localStorage.getItem('vitta_active_dept');
        const activeDept = activeDeptStr ? JSON.parse(activeDeptStr) : null;
        const activeDeptId = activeDept ? activeDept.id : null;

        if (SYNC_KEYS[key]) {
            baseKey = key;
            departmentId = activeDeptId;
        } else {
            // Coba periksa scoped key format: {deptId}_{baseKey}
            for (const k of Object.keys(SYNC_KEYS)) {
                if (key.endsWith('_' + k)) {
                    baseKey = k;
                    departmentId = key.substring(0, key.length - k.length - 1);
                    break;
                }
            }
        }

        if (!baseKey || !SYNC_KEYS[baseKey]) return;

        const config = SYNC_KEYS[baseKey];
        const tableName = config.table;

        try {
            const localArray = JSON.parse(value) || [];
            if (!Array.isArray(localArray)) return;

            console.log(`📤 Mensinkronisasikan ${localArray.length} baris data ke tabel Cloud '${tableName}'...`);

            // 1. Map data lokal ke format Database
            const dbItems = localArray.map(item => {
                const uuid = window.stringToUUID(item.id);
                const mapped = config.mapToDb(item);
                mapped.id = uuid;
                mapped.user_id = user.id;
                if (tableName !== 'akt_departments') {
                    mapped.department_id = departmentId;
                }
                return mapped;
            });

            // 2. Lakukan Upsert asinkronus ke Supabase
            if (dbItems.length > 0) {
                const { error: upsertErr } = await window.supabaseClient
                    .from(tableName)
                    .upsert(dbItems);

                if (upsertErr) throw upsertErr;
            }

            // 3. Differential Delete: Hapus data yang tidak ada di local storage lagi
            const activeIds = dbItems.map(item => item.id);
            let deleteQuery = window.supabaseClient
                .from(tableName)
                .delete()
                .eq('user_id', user.id);

            if (tableName !== 'akt_departments' && departmentId) {
                deleteQuery = deleteQuery.eq('department_id', departmentId);
            }

            if (activeIds.length > 0) {
                deleteQuery = deleteQuery.not('id', 'in', `(${activeIds.join(',')})`);
            }

            const { error: deleteErr } = await deleteQuery;
            if (deleteErr) throw deleteErr;

            console.log(`✅ Sinkronisasi tabel '${tableName}' sukses!`);
        } catch (err) {
            console.error(`❌ Gagal mensinkronisasikan data ke tabel ${tableName}:`, err.message);
        }
    }

    // --- HIJACK LOCALSTORAGE GLOBAL ---
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
        originalSetItem.apply(this, arguments);

        // Jika kunci cocok dengan target sync, jalankan sinkronisasi asinkronus
        let isSyncKey = false;
        if (SYNC_KEYS[key]) {
            isSyncKey = true;
        } else {
            for (const k of Object.keys(SYNC_KEYS)) {
                if (key.endsWith('_' + k)) {
                    isSyncKey = true;
                    break;
                }
            }
        }

        if (isSyncKey) {
            // Jalankan sinkronisasi di latar belakang tanpa memblokir thread UI
            setTimeout(() => {
                pushLocalData(key, value);
            }, 100);
        }
    };

    const originalRemoveItem = localStorage.removeItem;
    localStorage.removeItem = function(key) {
        originalRemoveItem.apply(this, arguments);

        // Jika user melakukan logout, data dibersihkan secara alami.
        // Tidak perlu memicu penghapusan database kecuali diinginkan secara eksplisit.
    };

})();
