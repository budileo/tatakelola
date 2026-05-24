// js/supabase-db.js
// VITTA ERP - Supabase SaaS Database Query Manager

/**
 * Mendapatkan user_id dari sesi aktif saat ini secara aman.
 * @returns {string} - UUID user_id
 */
function getActiveUserId() {
    try {
        const userStr = localStorage.getItem('vitta_user');
        if (userStr) {
            const user = JSON.parse(userStr);
            if (user && user.id) return user.id;
        }
    } catch (e) {
        console.error("Gagal membaca user dari localStorage:", e);
    }
    return null;
}

/**
 * Mendapatkan department_id dari sesi aktif saat ini.
 * @returns {string} - UUID department_id atau null
 */
function getActiveDepartmentId() {
    try {
        const deptStr = localStorage.getItem('vitta_active_dept');
        if (deptStr) {
            const dept = JSON.parse(deptStr);
            if (dept && dept.id) return dept.id;
        }
    } catch (e) {
        console.error("Gagal membaca active department dari localStorage:", e);
    }
    return null;
}

/**
 * Menyisipkan data baru (Insert) ke tabel Supabase.
 * Kolom `user_id` dan `department_id` diisi otomatis jika tidak disediakan.
 * @param {string} tableName - Nama tabel Supabase (diawali akt_)
 * @param {object} recordData - Data record yang ingin diinsert
 * @returns {Promise<{data: object|null, error: Error|null}>}
 */
async function insertRecord(tableName, recordData) {
    try {
        if (!window.supabaseClient) {
            throw new Error("Supabase client belum diinisialisasi.");
        }

        const userId = getActiveUserId();
        const deptId = getActiveDepartmentId();

        // Gabungkan data dengan user_id dan department_id dari session aktif untuk kepatuhan SaaS
        const payload = {
            ...recordData
        };

        if (userId && !payload.user_id) {
            payload.user_id = userId;
        }
        if (deptId && !payload.department_id && tableName !== 'akt_departments') {
            payload.department_id = deptId;
        }

        const { data, error } = await window.supabaseClient
            .from(tableName)
            .insert([payload])
            .select()
            .single();

        if (error) {
            console.error(`❌ Insert Error di tabel ${tableName}:`, error.message);
            return { data: null, error };
        }

        console.log(`✅ Sukses menyisipkan data ke tabel ${tableName}:`, data);
        return { data, error: null };
    } catch (error) {
        console.error(`❌ Exception di insertRecord (${tableName}):`, error.message);
        return { data: null, error };
    }
}

/**
 * Mengambil data (Read) dari tabel Supabase.
 * Secara otomatis memfilter data berdasarkan kepemilikan user_id yang aktif.
 * @param {string} tableName - Nama tabel Supabase (diawali akt_)
 * @param {object} [filters={}] - Filter tambahan, contoh: { sku: "PROD-001" } atau { type: "GENERAL" }
 * @param {object} [options={}] - Opsi query, contoh: { order: { column: "created_at", ascending: false }, limit: 100 }
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
async function readRecords(tableName, filters = {}, options = {}) {
    try {
        if (!window.supabaseClient) {
            throw new Error("Supabase client belum diinisialisasi.");
        }

        const userId = getActiveUserId();
        if (!userId) {
            throw new Error("Pengguna tidak terautentikasi. Silakan masuk terlebih dahulu.");
        }

        let query = window.supabaseClient.from(tableName).select('*');

        // Filter default berdasarkan user_id (tambahan perlindungan di sisi aplikasi selain RLS)
        query = query.eq('user_id', userId);

        // Terapkan filter tambahan yang dipasok dari argumen
        for (const [key, value] of Object.entries(filters)) {
            if (value !== undefined && value !== null) {
                query = query.eq(key, value);
            }
        }

        // Terapkan opsi pengurutan (order)
        if (options.order) {
            const { column, ascending } = options.order;
            query = query.order(column, { ascending: ascending !== false });
        } else {
            // Default sort: created_at descending
            query = query.order('created_at', { ascending: false });
        }

        // Terapkan opsi limit data
        if (options.limit) {
            query = query.limit(options.limit);
        }

        const { data, error } = await query;

        if (error) {
            console.error(`❌ Read Error di tabel ${tableName}:`, error.message);
            return { data: null, error };
        }

        return { data, error: null };
    } catch (error) {
        console.error(`❌ Exception di readRecords (${tableName}):`, error.message);
        return { data: null, error };
    }
}

/**
 * Memperbarui data (Update) pada tabel Supabase berdasarkan ID record.
 * Hanya mengizinkan pembaruan jika ID record dan user_id cocok (difilter ketat).
 * @param {string} tableName - Nama tabel Supabase (diawali akt_)
 * @param {string} id - UUID primary key record
 * @param {object} recordData - Data record yang baru
 * @returns {Promise<{data: object|null, error: Error|null}>}
 */
async function updateRecord(tableName, id, recordData) {
    try {
        if (!window.supabaseClient) {
            throw new Error("Supabase client belum diinisialisasi.");
        }

        const userId = getActiveUserId();
        if (!userId) {
            throw new Error("Pengguna tidak terautentikasi. Aksi dibatalkan.");
        }

        // Selalu pastikan kolom penanda waktu pembaruan (jika ada) terisi,
        // dan hindari overwrite user_id secara tidak sengaja.
        const payload = { ...recordData };
        delete payload.id;
        delete payload.user_id;
        delete payload.created_at;

        const { data, error } = await window.supabaseClient
            .from(tableName)
            .update(payload)
            .eq('id', id)
            .eq('user_id', userId) // Validasi kepemilikan user
            .select()
            .single();

        if (error) {
            console.error(`❌ Update Error di tabel ${tableName} ID ${id}:`, error.message);
            return { data: null, error };
        }

        console.log(`✅ Sukses memperbarui data tabel ${tableName} ID ${id}`);
        return { data, error: null };
    } catch (error) {
        console.error(`❌ Exception di updateRecord (${tableName}):`, error.message);
        return { data: null, error };
    }
}

/**
 * Menghapus data (Delete) pada tabel Supabase berdasarkan ID record.
 * @param {string} tableName - Nama tabel Supabase (diawali akt_)
 * @param {string} id - UUID primary key record
 * @returns {Promise<{success: boolean, error: Error|null}>}
 */
async function deleteRecord(tableName, id) {
    try {
        if (!window.supabaseClient) {
            throw new Error("Supabase client belum diinisialisasi.");
        }

        const userId = getActiveUserId();
        if (!userId) {
            throw new Error("Pengguna tidak terautentikasi. Aksi dibatalkan.");
        }

        const { error } = await window.supabaseClient
            .from(tableName)
            .delete()
            .eq('id', id)
            .eq('user_id', userId); // Validasi kepemilikan user

        if (error) {
            console.error(`❌ Delete Error di tabel ${tableName} ID ${id}:`, error.message);
            return { success: false, error };
        }

        console.log(`🗑️ Sukses menghapus data dari tabel ${tableName} ID ${id}`);
        return { success: true, error: null };
    } catch (error) {
        console.error(`❌ Exception di deleteRecord (${tableName}):`, error.message);
        return { success: false, error };
    }
}
