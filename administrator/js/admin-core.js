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

window.loadDashboardStats = async () => {
    const mockUsers = JSON.parse(localStorage.getItem('vitta_mock_users')) || [];
    const pendingCount = mockUsers.filter(u => u.status === 'PENDING').length;
    const totalCount = mockUsers.length + 1; // plus budileo (owner)

    const elTotal = document.getElementById('total-users');
    const elPending = document.getElementById('pending-users');
    if (elTotal) elTotal.innerText = totalCount;
    if (elPending) elPending.innerText = pendingCount;
};

window.logout = () => {
    localStorage.removeItem('vitta_user');
    window.location.href = '../login.html';
};
