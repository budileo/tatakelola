// js/supabase-auth.js
// VITTA ERP - Supabase SaaS Authentication Helper

/**
 * Mendaftarkan user baru (Sign Up) dan membuat departemen default serta profil terkait.
 * @param {string} email - Email user
 * @param {string} password - Password minimal 6 karakter
 * @param {string} fullName - Nama lengkap user
 * @param {string} deptName - Nama departemen default (misal: "Tata Kelola")
 * @returns {Promise<{user: object, profile: object, department: object, error: Error|null}>}
 */
async function signUpUser(email, password, fullName, deptName) {
    try {
        if (!window.supabaseClient) {
            throw new Error("Supabase client belum diinisialisasi.");
        }

        // 1. Pendaftaran Supabase Auth
        const { data: authData, error: authError } = await window.supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: fullName
                }
            }
        });

        if (authError) throw authError;
        if (!authData || !authData.user) {
            throw new Error("Gagal membuat user baru.");
        }

        const user = authData.user;
        let department = null;
        let profile = null;

        // Catatan: Jika email confirmation aktif, user belum login secara penuh
        // Namun, kita tetap coba buat departemen menggunakan session jika ada, atau bypass di script setup.
        // Untuk memastikan RLS lolos, kita bisa menyisipkan data departemen secara langsung jika sesi tersedia.
        try {
            // 2. Buat Departemen Baru
            const { data: deptData, error: deptError } = await window.supabaseClient
                .from('akt_departments')
                .insert([{
                    name: deptName,
                    email: email,
                    user_id: user.id
                }])
                .select()
                .single();

            if (deptError) {
                console.warn("Gagal membuat departemen secara otomatis (bisa jadi karena verifikasi email aktif):", deptError.message);
            } else {
                department = deptData;

                // 3. Update Profil Pengguna dengan department_id baru
                const { data: profileData, error: profileError } = await window.supabaseClient
                    .from('akt_user_profiles')
                    .update({ department_id: department.id })
                    .eq('id', user.id)
                    .select()
                    .single();

                if (profileError) {
                    console.warn("Gagal memperbarui profil pengguna dengan departemen:", profileError.message);
                } else {
                    profile = profileData;
                }
            }
        } catch (innerErr) {
            console.error("Gagal melakukan inisialisasi relasi departemen & profil:", innerErr);
        }

        return { user, profile, department, error: null };
    } catch (error) {
        console.error("❌ Sign Up Error:", error.message);
        return { user: null, profile: null, department: null, error };
    }
}

/**
 * Masuk ke aplikasi (Sign In) menggunakan email dan password.
 * @param {string} email - Email user
 * @param {string} password - Password
 * @returns {Promise<{session: object, user: object, error: Error|null}>}
 */
async function signInUser(email, password) {
    try {
        if (!window.supabaseClient) {
            throw new Error("Supabase client belum diinisialisasi.");
        }

        const { data, error } = await window.supabaseClient.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        // Ambil profil lengkap setelah berhasil login
        const user = data.user;
        const session = data.session;

        // Simpan data user format lokal untuk kompatibilitas dengan Vitta ERP
        const { data: profile } = await window.supabaseClient
            .from('akt_user_profiles')
            .select('*, akt_departments(*)')
            .eq('id', user.id)
            .single();

        const vittaUser = {
            id: user.id,
            email: user.email,
            full_name: profile ? profile.full_name : 'User Pemilik',
            role: profile ? profile.role : 'OWNER',
            status: profile ? profile.status : 'ACTIVE',
            department_id: profile && profile.akt_departments ? profile.akt_departments.id : null,
            department_name: profile && profile.akt_departments ? profile.akt_departments.name : 'Tata Kelola'
        };

        localStorage.setItem('vitta_user', JSON.stringify(vittaUser));
        if (profile && profile.akt_departments) {
            localStorage.setItem('vitta_active_dept', JSON.stringify(profile.akt_departments));
        }

        return { session, user, error: null };
    } catch (error) {
        console.error("❌ Sign In Error:", error.message);
        return { session: null, user: null, error };
    }
}

/**
 * Keluar dari aplikasi (Sign Out)
 * @returns {Promise<{error: Error|null}>}
 */
async function signOutUser() {
    try {
        if (!window.supabaseClient) {
            throw new Error("Supabase client belum diinisialisasi.");
        }

        const { error } = await window.supabaseClient.auth.signOut();
        if (error) throw error;

        // Hapus data session lokal Vitta
        localStorage.removeItem('vitta_user');
        localStorage.removeItem('vitta_active_dept');

        return { error: null };
    } catch (error) {
        console.error("❌ Sign Out Error:", error.message);
        return { error };
    }
}

/**
 * Mendapatkan informasi user aktif saat ini dari Supabase Auth Session
 * @returns {Promise<{user: object|null, profile: object|null, error: Error|null}>}
 */
async function getCurrentUser() {
    try {
        if (!window.supabaseClient) {
            throw new Error("Supabase client belum diinisialisasi.");
        }

        const { data: { session }, error: sessionError } = await window.supabaseClient.auth.getSession();
        if (sessionError) throw sessionError;
        if (!session) return { user: null, profile: null, error: null };

        const user = session.user;

        // Ambil profil lengkap dari tabel akt_user_profiles
        const { data: profile, error: profileError } = await window.supabaseClient
            .from('akt_user_profiles')
            .select('*, akt_departments(*)')
            .eq('id', user.id)
            .single();

        if (profileError && profileError.code !== 'PGRST116') { // PGRST116: no rows returned
            throw profileError;
        }

        return { user, profile, error: null };
    } catch (error) {
        console.error("❌ Get Current User Error:", error.message);
        return { user: null, profile: null, error };
    }
}

// Pantau perubahan status autentikasi untuk otomatisasi sinkronisasi
if (window.supabaseClient) {
    window.supabaseClient.auth.onAuthStateChange(async (event, session) => {
        console.log(`🔐 Supabase Auth Event: ${event}`);
        if (session && session.user) {
            // Sesi aktif, pastikan local storage tersinkronisasi
            try {
                const { data: profile } = await window.supabaseClient
                    .from('akt_user_profiles')
                    .select('*, akt_departments(*)')
                    .eq('id', session.user.id)
                    .single();

                if (profile) {
                    const vittaUser = {
                        id: session.user.id,
                        email: session.user.email,
                        full_name: profile.full_name || 'User Pemilik',
                        role: profile.role || 'OWNER',
                        status: profile.status || 'ACTIVE',
                        department_id: profile.akt_departments ? profile.akt_departments.id : null,
                        department_name: profile.akt_departments ? profile.akt_departments.name : 'Tata Kelola'
                    };
                    localStorage.setItem('vitta_user', JSON.stringify(vittaUser));
                    if (profile.akt_departments) {
                        localStorage.setItem('vitta_active_dept', JSON.stringify(profile.akt_departments));
                    }
                }
            } catch (err) {
                console.warn("Gagal menyinkronkan profil sesi di latar belakang:", err.message);
            }
        } else if (event === 'SIGNED_OUT') {
            localStorage.removeItem('vitta_user');
            localStorage.removeItem('vitta_active_dept');
        }
    });
}
