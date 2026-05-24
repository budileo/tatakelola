// auth.js
// Script otentikasi global — WAJIB ada di setiap halaman
// Melindungi akses tanpa login ke seluruh file sistem & mengelola sinkronisasi database

(function() {
    const currentPage = window.location.href;

    // Halaman yang dikecualikan dari proteksi login
    const publicPages = ['login.html', 'register-invite.html', 'supabase-setup.html'];
    const isPublicPage = publicPages.some(p => currentPage.includes(p));

    // Deteksi subfolder untuk penentuan relative path ke folder 'js/'
    const path = window.location.pathname || window.location.href;
    const inSubfolder = path.includes('/akuntansi/') || path.includes('/administrator/') ||
                        path.includes('/crm/') || path.includes('/hrd/') ||
                        path.includes('/operasional/') || path.includes('/components/') ||
                        path.includes('\\akuntansi\\') || path.includes('\\administrator\\') ||
                        path.includes('\\crm\\') || path.includes('\\hrd\\') ||
                        path.includes('\\operasional\\') || path.includes('\\components\\');

    const basePath = inSubfolder ? '../' : '';

    // Injeksi skrip secara SINKRONUS agar dimuat SEBELUM mesin ERP (seperti coa-engine.js) dijalankan
    document.write('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>');
    document.write('<script src="' + basePath + 'js/supabase-config.js"></script>');
    document.write('<script src="' + basePath + 'js/supabase-auth.js"></script>');
    document.write('<script src="' + basePath + 'js/supabase-db.js"></script>');
    document.write('<script src="' + basePath + 'js/supabase-sync.js"></script>');

    // Tunggu sesaat untuk inisialisasi alur SaaS Supabase di akhir pemuatan DOM
    window.addEventListener('DOMContentLoaded', function() {
        console.log("⚙️ Seluruh modul Supabase SaaS berhasil dimuat secara sinkronus.");
        initializeSaasFlow();
    });

    async function initializeSaasFlow() {
        if (isPublicPage) return;

        // Tampilkan overlay loading pemuatan data premium (SaaS sync indicator)
        const overlay = document.createElement('div');
        overlay.id = 'vitta-cloud-sync-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: #0b0f19;
            z-index: 999999;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            color: #ffffff;
            font-family: 'Inter', sans-serif;
            transition: opacity 0.4s ease-in-out;
        `;
        overlay.innerHTML = `
            <div style="
                width: 44px;
                height: 44px;
                border: 3px solid rgba(59, 102, 255, 0.1);
                border-top: 3px solid #3b66ff;
                border-radius: 50%;
                animation: spin 0.8s linear infinite;
                margin-bottom: 20px;
                box-shadow: 0 0 15px rgba(59, 102, 255, 0.2);
            "></div>
            <div style="font-size: 15px; font-weight: 600; letter-spacing: -0.01em;">Menghubungkan ke Cloud...</div>
            <div style="font-size: 11px; color: #6b7280; margin-top: 6px; font-mono">Keamanan SaaS Terproteksi</div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        document.body.appendChild(overlay);

        try {
            if (!window.getCurrentUser) {
                throw new Error("Modul Supabase Auth gagal dimuat.");
            }

            // 1. Cek sesi aktif langsung dari server Supabase
            let { user, profile, error } = await window.getCurrentUser();
            if (error || !user) {
                console.warn("Sesi Supabase tidak valid. Mengalihkan ke login...");
                window.location.href = inSubfolder ? '../login.html' : 'login.html';
                return;
            }

            // 2. SUPREME SELF-HEALING: Jika profil tidak ditemukan pada inisialisasi
            if (!profile) {
                console.log("👤 Profil tidak ditemukan pada inisialisasi. Membuat profil baru...");
                const { data: newProfile } = await window.supabaseClient
                    .from('akt_user_profiles')
                    .insert([{
                        id: user.id,
                        user_id: user.id,
                        email: user.email,
                        full_name: (user.user_metadata && user.user_metadata.full_name) || 'User Pemilik',
                        role: 'OWNER',
                        status: 'ACTIVE'
                    }])
                    .select()
                    .single();
                if (newProfile) {
                    profile = newProfile;
                }
            }

            // 3. SUPREME SELF-HEALING: Pastikan departemen ada di database online
            let activeDept = profile ? profile.akt_departments : null;
            const { data: existingDepts } = await window.supabaseClient
                .from('akt_departments')
                .select('*')
                .eq('user_id', user.id);

            if (existingDepts && existingDepts.length > 0) {
                activeDept = existingDepts[0];
            } else {
                console.log("🏢 Departemen tidak terdeteksi. Membuat departemen 'Tata Kelola'...");
                const { data: newDept } = await window.supabaseClient
                    .from('akt_departments')
                    .insert([{
                        name: 'Tata Kelola',
                        email: user.email,
                        user_id: user.id
                    }])
                    .select()
                    .single();
                if (newDept) {
                    activeDept = newDept;
                }
            }

            // 4. SUPREME SELF-HEALING: Hubungkan profil ke departemen
            if (profile && activeDept && (!profile.department_id || profile.department_id !== activeDept.id)) {
                console.log("🔗 Menautkan profil pengguna ke departemen di inisialisasi...");
                await window.supabaseClient
                    .from('akt_user_profiles')
                    .update({ department_id: activeDept.id })
                    .eq('id', user.id);
                profile.department_id = activeDept.id;
                profile.akt_departments = activeDept;
            }

            // Simpan ke local storage demi kompatibilitas sinkronus
            if (activeDept) {
                localStorage.setItem('vitta_active_dept', JSON.stringify(activeDept));
            }

            // Ekspos data user secara global
            window.VITTA_USER = {
                id: user.id,
                email: user.email,
                full_name: profile ? profile.full_name : 'User Pemilik',
                role: profile ? profile.role : 'OWNER',
                status: profile ? profile.status : 'ACTIVE',
                department_id: activeDept ? activeDept.id : null,
                department_name: activeDept ? activeDept.name : 'Tata Kelola'
            };

            localStorage.setItem('vitta_user', JSON.stringify(window.VITTA_USER));

            // 2. Lakukan sinkronisasi data cloud ke cache lokal secara instan
            if (window.pullCloudData) {
                await window.pullCloudData();
            }

            // 3. Matikan overlay loading dengan efek transisi memudar
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.remove();
                // Trigger event inisialisasi kustom untuk mesin halaman jika ada
                window.dispatchEvent(new Event('vitta-saas-ready'));

                // Pemicu penyegaran otomatis halaman setelah sinkronisasi Cloud berhasil
                const renderFunctions = [
                    'renderTable', 
                    'renderTransactions', 
                    'generateReports', 
                    'loadAccounts', 
                    'loadProducts', 
                    'initPage', 
                    'loadData',
                    'refreshData'
                ];
                renderFunctions.forEach(fnName => {
                    if (typeof window[fnName] === 'function') {
                        console.log(`🔄 Menyegarkan tampilan halaman via ${fnName}()...`);
                        try {
                            window[fnName]();
                        } catch (e) {
                            console.warn(`Gagal menyegarkan ${fnName}:`, e);
                        }
                    }
                });
            }, 400);

        } catch (err) {
            console.error("Gagal menginisialisasi alur SaaS Supabase:", err);
            // Fallback: hapus overlay jika terjadi kesalahan ekstrim agar halaman tetap bisa diakses darurat
            if (overlay) overlay.remove();
        }
    }

    // === UTILITY METODE DEPARTEMEN SINKRONUS (COMPATIBILITY) ===
    
    // Fungsi untuk mendapatkan Key khusus Departemen (Isolasi Data)
    window.getScopedKey = function(baseKey) {
        const activeDept = window.getActiveDept ? window.getActiveDept() : null;
        if (activeDept && activeDept.id) {
            return activeDept.id + '_' + baseKey;
        }
        return baseKey;
    };

    // Ambil semua departemen yang bisa diakses user
    window.getUserDepartments = function() {
        try {
            const allDepts = JSON.parse(localStorage.getItem('vitta_mock_departments')) || [];
            return allDepts; // Seluruh departemen yang diunduh dari Supabase
        } catch(e) { return []; }
    };

    // Ambil departemen yang sedang aktif (dipilih user)
    window.getActiveDept = function() {
        try {
            const stored = localStorage.getItem('vitta_active_dept');
            if (stored) return JSON.parse(stored);
            return null;
        } catch(e) { return null; }
    };

    // Set departemen aktif
    window.setActiveDept = function(dept) {
        localStorage.setItem('vitta_active_dept', JSON.stringify(dept));
        const user = window.VITTA_USER || {};
        user.department_id = dept.id;
        user.department_name = dept.name;
        localStorage.setItem('vitta_user', JSON.stringify(user));
        window.VITTA_USER = user;
        
        // Pemicu unduh ulang data departemen aktif baru
        if (window.pullCloudData) {
            window.pullCloudData().then(() => {
                window.location.reload(); // Reload halaman untuk me-render data departemen baru
            });
        }
    };

    window.getVittaDept = function() {
        return window.getActiveDept();
    };

    window.getDeptInfo = function() {
        const dept = window.getActiveDept();
        if (dept) {
            return {
                name: dept.name || 'Vitta ERP',
                address: dept.address || '',
                email: dept.email || '',
                phone: dept.phone || '',
                whatsapp: dept.whatsapp || '',
                ownerName: dept.owner_name || '',
                ownerPhone: dept.owner_phone || '',
                logo: dept.logo || ''
            };
        }
        return {
            name: 'Vitta ERP',
            address: '-', email: '-', phone: '-', whatsapp: '-',
            ownerName: '-', ownerPhone: '-', logo: ''
        };
    };
})();

