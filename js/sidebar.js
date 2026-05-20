document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('sidebar-container');
    if (container) {
        // Embed the sidebar HTML directly to avoid CORS issues on file:// protocol
        const sidebarHTML = `
        <div id="sidebarOverlay" class="fixed inset-0 bg-black/50 z-40 hidden lg:hidden transition-opacity backdrop-blur-sm cursor-pointer" onclick="toggleSidebar()"></div>
        <div class="fixed inset-y-0 left-0 z-50 w-64 bg-dark-800 border-r border-dark-700 h-screen flex flex-col transform -translate-x-full lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out" id="mainSidebar">
            <div class="p-4 flex items-center justify-between border-b border-dark-700">
                <a href="../index.html" class="flex items-center space-x-2 text-white font-bold text-xl hover:text-blue-400 transition-colors">
                    <svg class="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                    <span class="sidebar-text">Vitta ERP</span>
                </a>
                <button onclick="toggleSidebar()" class="text-gray-400 hover:text-white lg:hidden">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            <div class="flex-1 overflow-y-auto py-4">
                <nav class="space-y-1 px-2" id="sidebarMenu">
                    <!-- Dynamic menu items will be injected here by sidebar.js -->
                </nav>
            </div>
            <div class="p-4 border-t border-dark-700">
                <div class="flex items-center">
                    <div class="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 font-bold" id="sidebarUserInitial">
                        U
                    </div>
                    <div class="ml-3 sidebar-text text-sm">
                        <p class="text-white font-medium" id="sidebarUserName">User</p>
                        <p class="text-blue-400 text-xs font-semibold" id="sidebarUserRole">-</p>
                        <p class="text-gray-400 text-xs" id="sidebarUserDept">-</p>
                    </div>
                </div>
            </div>
        </div>
        `;
        
        container.innerHTML = sidebarHTML;
        
        // Initialize dynamic menu based on current path
        initializeMenu();

        // Populate user info di sidebar dari sesi login
        if (window.VITTA_USER) {
            const user = window.VITTA_USER;
            const dept = window.getVittaDept ? window.getVittaDept() : null;
            const initial = (user.username || 'U').charAt(0).toUpperCase();
            
            const elInitial = document.getElementById('sidebarUserInitial');
            const elName = document.getElementById('sidebarUserName');
            const elRole = document.getElementById('sidebarUserRole');
            const elDept = document.getElementById('sidebarUserDept');

            if (elInitial) elInitial.textContent = initial;
            if (elName) elName.textContent = user.username || 'User';
            if (elRole) elRole.textContent = user.role || '-';
            if (elDept) elDept.textContent = dept ? dept.name : 'Departemen Tidak Ditemukan';
        }
    }
});

function initializeMenu() {
    const path = window.location.pathname;
    const menuContainer = document.getElementById('sidebarMenu');
    let menuItems = [];

    // Define menu items for each pillar
    if (path.includes('/akuntansi/')) {
        menuItems = [
            { name: 'Dasbor', url: 'dasbor.html', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
            { name: 'Penjualan', url: 'penjualan.html', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
            { name: 'Pembelian', url: 'pembelian.html', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' },
            { name: 'Biaya', url: 'biaya.html', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
            { name: 'Kas & Bank', url: 'kasbank.html', icon: 'M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z' },
            { name: 'Bagan Akun (COA)', url: 'coa.html', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
            { name: 'Aset Tetap', url: 'aset-tetap.html', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
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

    let html = '';
    menuItems.forEach(item => {
        const isActive = path.endsWith(item.url) || (path.endsWith('/') && item.url === 'dasbor.html');
        const activeClass = isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-dark-700 hover:text-white';
        
        html += `
            <a href="${item.url}" class="group flex items-center px-2 py-2 text-sm font-medium rounded-md ${activeClass} transition-colors">
                <svg class="mr-3 flex-shrink-0 h-6 w-6 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${item.icon}"></path>
                </svg>
                <span class="sidebar-text truncate">${item.name}</span>
            </a>
        `;
    });
    
    menuContainer.innerHTML = html;
}

// Global function to toggle sidebar on mobile
window.toggleSidebar = function() {
    const sidebar = document.getElementById('mainSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (sidebar && overlay) {
        if (sidebar.classList.contains('-translate-x-full')) {
            // Open
            sidebar.classList.remove('-translate-x-full');
            overlay.classList.remove('hidden');
        } else {
            // Close
            sidebar.classList.add('-translate-x-full');
            overlay.classList.add('hidden');
        }
    }
};
