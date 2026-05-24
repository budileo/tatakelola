// auth.js
// Script otentikasi global — WAJIB ada di setiap halaman
// Melindungi akses tanpa login ke seluruh file sistem

(function() {
    const currentPage = window.location.href;

    // Halaman yang dikecualikan dari proteksi login
    const publicPages = ['login.html', 'register-invite.html'];
    const isPublicPage = publicPages.some(p => currentPage.includes(p));

    if (isPublicPage) return;

    // Cek apakah user sudah login
    const userStr = localStorage.getItem('vitta_user');
    if (!userStr) {
        const path = window.location.pathname || window.location.href;
        const inSubfolder = path.includes('/akuntansi/') || path.includes('/administrator/') ||
                            path.includes('/crm/') || path.includes('/hrd/') ||
                            path.includes('/operasional/') || path.includes('/components/') ||
                            path.includes('\\akuntansi\\') || path.includes('\\administrator\\') ||
                            path.includes('\\crm\\') || path.includes('\\hrd\\') ||
                            path.includes('\\operasional\\') || path.includes('\\components\\');
        window.location.href = inSubfolder ? '../login.html' : 'login.html';
        return;
    }

    // Expose user data secara global
    window.VITTA_USER = JSON.parse(userStr);

    // === FUNGSI DEPARTEMEN ===
    
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
            const user = window.VITTA_USER;
            
            if (user.role === 'OWNER') {
                // OWNER bisa akses semua departemen
                return allDepts;
            } else if (user.role === 'MANAGER') {
                // MANAGER hanya di departemen yang ditugaskan
                // Untuk saat ini: jika user punya department_id, filter ke situ
                // Kalau user punya array department_ids, filter ke semua itu
                if (user.department_ids && Array.isArray(user.department_ids)) {
                    return allDepts.filter(d => user.department_ids.includes(d.id));
                }
                return user.department_id ? allDepts.filter(d => d.id === user.department_id) : allDepts;
            } else {
                // SUPERVISOR / STAF hanya 1 departemen
                return user.department_id ? allDepts.filter(d => d.id === user.department_id) : [];
            }
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
        // Update juga VITTA_USER.department_id untuk kompatibilitas
        const user = window.VITTA_USER;
        user.department_id = dept.id;
        localStorage.setItem('vitta_user', JSON.stringify(user));
        window.VITTA_USER = user;
        migrateGlobalDataToDept(dept.id);
    };

    function migrateGlobalDataToDept(deptId) {
        if (!deptId) return;
        const keysToMigrate = ['vitta_contacts', 'vitta_products', 'vitta_coa'];
        keysToMigrate.forEach(baseKey => {
            const globalData = localStorage.getItem(baseKey);
            const scopedKey = deptId + '_' + baseKey;
            const scopedData = localStorage.getItem(scopedKey);
            
            // Jika data global ada dan data scoped belum ada (kosong)
            if (globalData && (!scopedData || scopedData === '[]' || scopedData === '{}')) {
                try {
                    localStorage.setItem(scopedKey, globalData);
                    console.log(`Migrated ${baseKey} to ${scopedKey}`);
                } catch(e) {}
            }
        });
    }

    // Auto-migrate on script load if active dept exists
    const currentActiveDept = window.getActiveDept();
    if (currentActiveDept && currentActiveDept.id) {
        migrateGlobalDataToDept(currentActiveDept.id);
    }

    // Kompatibilitas: getVittaDept sekarang mengarah ke dept aktif
    window.getVittaDept = function() {
        return window.getActiveDept();
    };

    // Info lengkap departemen aktif (untuk kop surat/laporan)
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
