// js/supabase-config.js
// VITTA ERP - Supabase SaaS Client Configuration

const SUPABASE_URL = "https://brvmasktbglzxmazyryb.supabase.co";
const SUPABASE_KEY = "sb_publishable_y3-X5JPMFihnbiLjOeaSZQ_gUm5RrhL";

if (typeof supabase === 'undefined') {
    console.error("⚠️ Supabase SDK CDN tidak terdeteksi! Pastikan Anda menyertakan script CDN Supabase-JS di HTML Anda:");
    console.error('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>');
} else {
    // Inisialisasi klien global
    window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: {
            persistSession: true,       // Simpan sesi login secara otomatis di localStorage
            autoRefreshToken: true,     // Perbarui token secara otomatis di latar belakang
            detectSessionInUrl: true    // Deteksi sesi login dari link email konfirmasi
        }
    });
    console.log("🚀 Klien Supabase berhasil diinisialisasi secara global sebagai: window.supabaseClient");
}
