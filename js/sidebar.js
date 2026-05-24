document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('sidebar-container');
    if (!container) return;

    // Inject CSS for sidebar mini mode
    const styleEl = document.createElement('style');
    styleEl.textContent = `
        #mainSidebar {
            transition: width 0.3s ease-in-out, transform 0.3s ease-in-out;
        }
        #mainSidebar.sidebar-mini {
            width: 5rem;
        }
        #mainSidebar.sidebar-mini .sidebar-text {
            display: none;
        }
        #mainSidebar.sidebar-mini .sidebar-header {
            justify-content: center;
            padding: 1rem 0.5rem;
        }
        #mainSidebar.sidebar-mini .user-info-text {
            display: none;
        }
        #mainSidebar.sidebar-mini .user-section {
            justify-content: center;
        }
        #mainSidebar.sidebar-mini .user-initial-box {
            margin-right: 0;
        }
        #mainSidebar.sidebar-mini .menu-link {
            justify-content: center;
            padding-left: 0;
            padding-right: 0;
        }
        #mainSidebar.sidebar-mini .menu-icon {
            margin-right: 0;
        }
        #mainSidebar.sidebar-mini .toggle-section {
            display: none;
        }
        #mainSidebar.sidebar-mini #btnCollapseSidebar svg {
            transform: rotate(180deg);
        }
    `;
    document.head.appendChild(styleEl);

    // Build sidebar HTML
    const sidebarHTML = `
        <div id="sidebarOverlay" class="fixed inset-0 bg-black/50 z-40 hidden lg:hidden transition-opacity backdrop-blur-sm cursor-pointer" onclick="toggleSidebar()"></div>
        <div class="fixed inset-y-0 left-0 z-50 w-64 bg-dark-800 border-r border-dark-700 h-screen flex flex-col transform -translate-x-full lg:relative lg:translate-x-0" id="mainSidebar">
            
            <!-- Header -->
            <div class="p-4 flex items-center justify-between border-b border-dark-700 sidebar-header relative">
                <a href="../index.html" class="flex items-center space-x-2 text-white font-bold text-xl hover:text-blue-400 transition-colors">
                    <svg class="w-8 h-8 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                    <span class="sidebar-text">Tata Kelola One</span>
                </a>
                <button onclick="toggleSidebar()" class="text-gray-400 hover:text-white lg:hidden">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>

            <!-- Collapse Button (Desktop only) -->
            <button onclick="toggleDesktopSidebar()" id="btnCollapseSidebar" title="Kecilkan / Besarkan Menu" class="hidden lg:flex absolute -right-3 top-7 bg-dark-700 border border-dark-600 rounded-full p-1 text-gray-400 hover:text-white hover:bg-dark-600 z-[60] transition-all duration-300 cursor-pointer">
                <svg class="w-4 h-4 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                </svg>
            </button>

            <!-- Menu Items -->
            <div class="flex-1 overflow-y-auto py-4">
                <nav class="space-y-1 px-2" id="sidebarMenu">
                </nav>
            </div>

            <!-- Toggle "Kembali ke Index" -->
            <div class="px-4 py-3 border-t border-dark-700 toggle-section">
                <div class="flex items-center justify-between w-full">
                    <span class="text-gray-400 text-xs sidebar-text">Tampilkan "Kembali"</span>
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="toggleBackToIndex" class="sr-only peer" checked>
                        <div class="w-9 h-5 bg-dark-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
                    </label>
                </div>
            </div>

            <!-- User Info -->
            <div class="p-4 border-t border-dark-700">
                <div class="flex items-center user-section">
                    <div class="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 font-bold user-initial-box flex-shrink-0 mr-3" id="sidebarUserInitial">
                        U
                    </div>
                    <div class="user-info-text text-sm text-left min-w-0">
                        <p class="text-white font-medium truncate" id="sidebarUserName">User</p>
                        <p class="text-blue-400 text-xs font-semibold truncate" id="sidebarUserRole">-</p>
                        <p class="text-gray-400 text-xs truncate" id="sidebarUserDept">-</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    container.innerHTML = sidebarHTML;

    // Initialize dynamic menu based on current path
    initializeMenu();

    // Apply saved sidebar mini state
    const savedMini = localStorage.getItem('vitta_sidebar_mini') === 'true';
    if (savedMini) {
        const sidebar = document.getElementById('mainSidebar');
        if (sidebar) sidebar.classList.add('sidebar-mini');
    }

    // Populate user info from session
    function populateSidebarUser() {
        if (window.VITTA_USER) {
            const user = window.VITTA_USER;
            const dept = window.getVittaDept ? window.getVittaDept() : null;
            
            const displayName = user.full_name || user.username || user.email || 'User Pemilik';
            const initial = displayName.charAt(0).toUpperCase();

            const elInitial = document.getElementById('sidebarUserInitial');
            const elName = document.getElementById('sidebarUserName');
            const elRole = document.getElementById('sidebarUserRole');
            const elDept = document.getElementById('sidebarUserDept');

            if (elInitial) elInitial.textContent = initial;
            if (elName) elName.textContent = displayName;
            if (elRole) elRole.textContent = user.role || '-';
            if (elDept) elDept.textContent = dept ? dept.name : 'Tata Kelola';
        }
    }

    populateSidebarUser();
    window.addEventListener('vitta-saas-ready', populateSidebarUser);

    // Handle Back to Index Toggle
    const toggleBtn = document.getElementById('toggleBackToIndex');
    if (toggleBtn) {
        const isMenuVisible = localStorage.getItem('showBackToIndex') !== 'false';
        toggleBtn.checked = isMenuVisible;
        updateBackToIndexVisibility(isMenuVisible);

        toggleBtn.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            localStorage.setItem('showBackToIndex', isChecked ? 'true' : 'false');
            updateBackToIndexVisibility(isChecked);
        });
    }
});

// ========== Helper Functions ==========

function updateBackToIndexVisibility(isVisible) {
    const items = document.querySelectorAll('.back-to-index-menu');
    items.forEach(item => {
        if (isVisible) {
            item.classList.remove('hidden');
            item.classList.add('flex');
        } else {
            item.classList.add('hidden');
            item.classList.remove('flex');
        }
    });
}

function initializeMenu() {
    const path = window.location.pathname;
    const menuContainer = document.getElementById('sidebarMenu');
    if (!menuContainer) return;

    let menuItems = [];

    // Define menu items for each module
    if (path.includes('/akuntansi/')) {
        menuItems = [
            { name: 'Dasbor', url: 'dasbor.html', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
            { name: 'Penjualan', url: 'penjualan.html', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
            { name: 'Pembelian', url: 'pembelian.html', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' },
            { name: 'Biaya', url: 'biaya.html', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
            { name: 'Kas & Bank', url: 'kasbank.html', icon: 'M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z' },
            { name: 'Master Kontak', url: 'kontak.html', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857' },
            { name: 'Bagan Akun (COA)', url: 'coa.html', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
            { name: 'Aset Tetap', url: 'aset-tetap.html', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
            { name: 'Master Produk', url: 'produk.html', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
            { name: 'Inventori Stok', url: 'inventori.html', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
            { name: 'Laporan', url: 'laporan.html', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' }
        ];
    } else if (path.includes('/crm/')) {
        menuItems = [
            { name: 'Dasbor', url: 'dasbor.html', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z' },
            { name: 'Leads', url: 'leads.html', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857' },
            { name: 'Database Pelanggan', url: 'database_pelanggan.html', icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4' },
            { name: 'Layanan & Tiket', url: 'layanan.html', icon: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z' }
        ];
    } else if (path.includes('/hrd/')) {
        menuItems = [
            { name: 'Dasbor', url: 'dasbor.html', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z' },
            { name: 'Data Karyawan', url: 'karyawan.html', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857' },
            { name: 'Rekrutmen', url: 'rekrutmen.html', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
            { name: 'SOP', url: 'sop.html', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
            { name: 'KPI', url: 'kpi.html', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
            { name: 'Nine-Box Matrix', url: 'nine_box.html', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z' }
        ];
    } else if (path.includes('/operasional/')) {
        menuItems = [
            { name: 'Dasbor', url: 'dasbor.html', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z' },
            { name: 'Bisnis Proses', url: 'bisnis_proses.html', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
            { name: 'Monitoring Proyek', url: 'proyek.html', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
            { name: 'Master Produk', url: 'produk.html', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
            { name: 'Inventori Stok', url: 'inventori.html', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' }
        ];
    }

    // Prepend "Kembali ke Index" menu item
    menuItems.unshift({
        name: 'Kembali ke Index',
        url: '../index.html',
        icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
        isBackToIndex: true
    });

    // Render menu items
    let html = '';
    menuItems.forEach(item => {
        const isActive = path.endsWith(item.url) || (path.endsWith('/') && item.url === 'dasbor.html');
        const activeClass = isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-dark-700 hover:text-white';
        const iconColor = isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-300';
        const extraClasses = item.isBackToIndex ? 'back-to-index-menu border-b border-dark-700 mb-2 pb-2' : '';

        html += `
            <a href="${item.url}" class="group flex items-center px-2 py-2 text-sm font-medium rounded-md ${activeClass} transition-colors ${extraClasses} menu-link" title="${item.name}">
                <svg class="flex-shrink-0 h-6 w-6 mr-3 menu-icon ${iconColor}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${item.icon}"></path>
                </svg>
                <span class="sidebar-text truncate">${item.name}</span>
            </a>
        `;
    });

    menuContainer.innerHTML = html;

    // Apply initial Back to Index visibility
    const isMenuVisible = localStorage.getItem('showBackToIndex') !== 'false';
    updateBackToIndexVisibility(isMenuVisible);
}

// ========== Global Functions ==========

// Toggle sidebar on mobile
window.toggleSidebar = function() {
    const sidebar = document.getElementById('mainSidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (sidebar && overlay) {
        if (sidebar.classList.contains('-translate-x-full')) {
            sidebar.classList.remove('-translate-x-full');
            overlay.classList.remove('hidden');
        } else {
            sidebar.classList.add('-translate-x-full');
            overlay.classList.add('hidden');
        }
    }
};

// Toggle sidebar mini/full on desktop
window.toggleDesktopSidebar = function() {
    const sidebar = document.getElementById('mainSidebar');
    if (sidebar) {
        sidebar.classList.toggle('sidebar-mini');
        const isMini = sidebar.classList.contains('sidebar-mini');
        localStorage.setItem('vitta_sidebar_mini', isMini ? 'true' : 'false');
    }
};
