// js/admin-core.js

window.checkAdminAuth = async () => {
    // Gunakan VITTA_USER dari auth.js (sudah diproteksi di level global)
    const user = window.VITTA_USER;
    if (!user) {
        // auth.js sudah menangani redirect ke login, tapi double-check
        window.location.href = '../login.html';
        return null;
    }
    
    // Hanya OWNER dan MANAGER yang bisa akses modul admin
    if (user.role !== 'OWNER' && user.role !== 'MANAGER') {
        alert('Akses Ditolak: Modul ini hanya untuk Administrator.');
        window.location.href = '../index.html';
        return null;
    }

    return user;
};

// Check and apply visibility of Kembali ke Index based on localStorage
document.addEventListener('DOMContentLoaded', () => {
    const isMenuVisible = localStorage.getItem('showBackToIndex') !== 'false';
    const items = document.querySelectorAll('.back-to-index-menu-admin');
    items.forEach(item => {
        if (!isMenuVisible) {
            item.style.display = 'none';
        } else {
            item.style.display = '';
        }
    });

    // Sidebar Toggle Feature for Admin
    const style = document.createElement('style');
    style.innerHTML = `
        .admin-sidebar { transition: width 0.3s ease-in-out; }
        .admin-sidebar.sidebar-mini { width: 5rem !important; }
        .admin-sidebar.sidebar-mini .md\\:w-64 { width: 5rem !important; }
        .admin-sidebar.sidebar-mini span { display: none !important; }
        .admin-sidebar.sidebar-mini i { margin-right: 0 !important; font-size: 1.25rem; }
        .admin-sidebar.sidebar-mini a { text-align: center; padding-left: 0; padding-right: 0; justify-content: center; display: flex; }
    `;
    document.head.appendChild(style);

    const sidebar = document.querySelector('.bg-gray-800.shadow-xl');
    if (sidebar) {
        sidebar.classList.add('admin-sidebar');
        
        const btn = document.createElement('button');
        btn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>';
        btn.className = 'hidden md:flex absolute -right-3 top-6 bg-gray-700 border border-gray-600 rounded-full p-1 text-gray-300 hover:text-white hover:bg-gray-600 z-50 transition-transform cursor-pointer';
        
        btn.onclick = () => {
            sidebar.classList.toggle('sidebar-mini');
            const isMini = sidebar.classList.contains('sidebar-mini');
            localStorage.setItem('admin_sidebar_mini', isMini ? 'true' : 'false');
            btn.style.transform = isMini ? 'rotate(180deg)' : 'rotate(0deg)';
        };
        sidebar.appendChild(btn);

        if (localStorage.getItem('admin_sidebar_mini') === 'true') {
            sidebar.classList.add('sidebar-mini');
            btn.style.transform = 'rotate(180deg)';
        }
    }
});

window.loadDashboardStats = async () => {
    if (!window.supabaseClient) return;
    try {
        const { count, error } = await window.supabaseClient
            .from('akt_user_profiles')
            .select('*', { count: 'exact', head: true });
        
        if (!error && count !== null) {
            const elTotal = document.getElementById('total-users');
            if (elTotal) elTotal.innerText = count;
        }

        const { count: pendingCount, error: pendingError } = await window.supabaseClient
            .from('akt_user_profiles')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'PENDING');
            
        if (!pendingError && pendingCount !== null) {
            const elPending = document.getElementById('pending-users');
            if (elPending) elPending.innerText = pendingCount;
        }
    } catch (err) {
        console.error('Error fetching dashboard stats:', err);
    }
};

window.logout = () => {
    localStorage.removeItem('vitta_user');
    window.location.href = '../login.html';
};
