Budi Ariadi - Indonesia 11 Mei 2026

Saya ingin membuat aplikasi bernama Vitta untuk sistem Sistem Akuntansi  berbasis SaaS (Software as a Service), tolong jelaskan APP flow serta core future aplikasi dengan memperhatikan ketentuan sebagai berikut : 

SPESIFIKASI UMUM:
- Frontend: HTML + Tailwind (boleh tetap sederhana)
- tampilan optimal di gunakan di mobile phone
- Backend: Supabase (Auth + Database + Security)
- Fokus pada arsitektur SaaS: secure, scalable, multi-user

WAJIB IKUTI ATURAN INI:

1. AUTHENTICATION (WAJIB SERVER-BASED)
- Gunakan Supabase Auth
- Login menggunakan:
  supabase.auth.signInWithPassword()
- DILARANG membuat login manual di frontend
- Jangan pernah validasi password di browser

2. SESSION MANAGEMENT
- Gunakan session resmi dari Supabase
- Gunakan:
  supabase.auth.getUser()
- DILARANG menyimpan user login manual di localStorage tanpa validasi

3. MULTI-TENANT SYSTEM
- Setiap user harus memiliki:
  user_id
  company_id
- Data harus terpisah antar perusahaan

4. DATABASE DESIGN
Minimal tabel:
- users
- companies
- memberships
- activities / data utama

Semua data harus punya:
- user_id
- company_id

5. SECURITY (WAJIB)
- Aktifkan Row Level Security (RLS)
- Buat policy:
  user hanya bisa akses data miliknya sendiri
- Jangan expose service_role key

6. API & LOGIC
- Semua logic sensitif (auth, validasi, token, dll) tidak boleh di frontend
- Gunakan Supabase query atau API

7. TOKEN / BILLING SYSTEM
- Siapkan struktur token:
  - setiap aktivitas mengurangi token
  - simpan log penggunaan token
- Buat sistem topup token

8. PROTEKSI HALAMAN
- Setiap halaman harus cek:
  apakah user sudah login
- Jika tidak → redirect ke login

9. STRUKTUR FILE
- auth.js → login, logout, getUser
- db.js → query database
- jangan campur auth dengan UI

10. Dasbor dan Model Tampilan

https://apexcharts.com/javascript-chart-demos/dashboards/dark/


11. Desain Menu

Ubah sidebar menjadi collapsible (expand/collapse) dengan tombol toggle di header.
Saat collapse jadi mini sidebar (icon only).
Di mobile gunakan off-canvas (slide dari kiri + overlay, klik luar untuk tutup).
Gunakan Tailwind, animasi smooth, dan jangan ubah logic utama.
Pisahkan sidebar ke sidebar.html dan logic ke sidebar.js agar bisa dipakai di semua halaman.



OUTPUT YG DI HARAPKAN :
dengan memperhatikan kebutuhan dasar sebagai berikut :

Beranda : halaman utama yang menampilkan informasi grafis seputar penjualan, kas, piutang, pembelian dan hutang dalam periode bulan berjalan
Penjualan : 

Buatkan sistem manajemen Invoice Penjualan terintegrasi dengan sistem akuntansi otomatis (double entry) dengan spesifikasi berikut:

====================================
A. HALAMAN LIST INVOICE
====================================
1. Tampilkan daftar invoice dengan fitur:
- Filter berdasarkan periode tanggal
- Status pembayaran:
  - Lunas
  - Belum Dibayar
  - Dibayar Sebagian
  - Jatuh Tempo
  - Retur
  - Void

2. Data yang ditampilkan:
- No Invoice
- Nama Pelanggan
- Tanggal
- Jatuh Tempo
- Total
- Sisa Tagihan
- Status

====================================
B. PEMBUATAN INVOICE
====================================
Form input harus mencakup:

1. Data Utama:
- Pelanggan (ambil dari database pelanggan)
- No Invoice (auto generate, format INV/YYYY/MM/XXXX)
- Tanggal Transaksi
- Tanggal Jatuh Tempo
- Termin (COD, 7 Hari, 15 Hari, 30 Hari, Custom)
- Referensi
- Tag (bisa di setting)

2. Item Produk (multi baris):
Setiap item berisi:
- Produk (dari database)
- Deskripsi tambahan
- Kuantitas
- Satuan
- Diskon (Rp atau %)
- Harga
- Pajak (PPN / PPh)
- Jumlah (auto = qty × harga - diskon + pajak)

3. Perhitungan:
- Subtotal (auto)
- Diskon Invoice (Rp atau %)
- Biaya Pengiriman
- Biaya Transaksi
- Total (auto)
- Potongan
- Uang Muka (DP)
- Sisa Tagihan (auto)

4. Informasi Tambahan:
- Pesan (internal)
- Note (external, tampil di invoice)

5. Validasi:
- Tidak boleh simpan jika:
  - Tidak ada pelanggan
  - Tidak ada item
  - Total = 0

====================================
C. PROSES AKUNTANSI (WAJIB AUTO)
====================================
Saat invoice dibuat:

Jika BELUM dibayar:
- Debit → Piutang Usaha
- Kredit → Pendapatan

Jika ada pajak:
- Kredit → Utang Pajak

Jika ada DP:
- Debit → Kas/Bank
- Kredit → Uang Muka Pelanggan

====================================
D. PROSES PEMBAYARAN INVOICE
====================================
1. Pilih invoice → tampilkan detail

2. Form pembayaran:
- Total Dibayar (default dari sisa tagihan, bisa diubah)
- Nomor Pembayaran (auto generate PAY/YYYY/MM/XXXX)
- Tanggal Transaksi
- Dibayar ke (akun Kas/Bank dari database)
- Referensi
- Tag
- Attachment (JPG/PNG bukti bayar)
- Pemotongan (Rp atau %)
- Total (auto)

3. Support:
- Pembayaran sebagian (partial payment)
- Multiple pembayaran per invoice

====================================
E. JURNAL PEMBAYARAN (AUTO)
====================================
Saat pembayaran:

Jika pembayaran normal:
- Debit → Kas/Bank
- Kredit → Piutang Usaha

Jika ada potongan:
- Debit → Kas/Bank
- Debit → Beban Potongan
- Kredit → Piutang Usaha

====================================
F. STATUS OTOMATIS
====================================
- Lunas → jika sisa = 0
- Sebagian → jika pembayaran < total
- Belum Dibayar → jika belum ada pembayaran
- Jatuh Tempo → jika lewat tanggal jatuh tempo
- Void → jika dibatalkan

====================================
G. LOG & AUDIT
====================================
Setiap invoice & pembayaran wajib menyimpan:
- Dibuat oleh
- Waktu dibuat
- Perubahan data
- Riwayat:
  - dibuat
  - diubah
  - dihapus
  - dicetak
  - dilihat

====================================
H. UX RULE
====================================
- User tidak boleh input jurnal manual
- Semua perhitungan otomatis
- Sistem harus minim human error
- Semua data terhubung ke COA

====================================
GOAL:
Membuat sistem invoice + pembayaran yang:
- Akurat secara akuntansi
- Mendukung bisnis real (DP, termin, cicilan)
- Mudah digunakan user non-akuntan




Pembelian

Buatkan sistem manajemen Pembelian (Purchase) terintegrasi dengan akuntansi otomatis (double entry) dengan spesifikasi berikut:

====================================
A. HALAMAN LIST PEMBELIAN
====================================
1. Tampilkan daftar transaksi pembelian dengan fitur:
- Filter berdasarkan periode tanggal
- Status:
  - Lunas
  - Belum Dibayar
  - Dibayar Sebagian
  - Jatuh Tempo
  - Retur
  - Void

2. Data yang ditampilkan:
- No Pembelian
- Nama Supplier
- Tanggal
- Jatuh Tempo
- Total
- Sisa Hutang
- Status

====================================
B. PEMBUATAN PEMBELIAN
====================================
Form input harus mencakup:

1. Data Utama:
- Supplier (ambil dari database supplier)
- No Pembelian (auto generate: PUR/YYYY/MM/XXXX)
- Tanggal Transaksi
- Tanggal Jatuh Tempo
- Termin (COD, 7 Hari, 15 Hari, 30 Hari, Custom)
- Referensi
- Tag (bisa di setting)

2. Item Pembelian (multi baris):
Setiap item berisi:
- Produk (dari database)
- Deskripsi tambahan
- Kuantitas
- Satuan
- Diskon (Rp atau %)
- Harga
- Pajak (PPN / PPh)
- Jumlah (auto = qty × harga - diskon + pajak)

3. Perhitungan:
- Subtotal (auto)
- Diskon Pembelian (Rp atau %)
- Biaya Pengiriman
- Biaya Tambahan
- Total (auto)
- Potongan
- Uang Muka (DP ke supplier)
- Sisa Hutang (auto)

4. Informasi Tambahan:
- Pesan (internal)
- Note (external)

5. Validasi:
- Tidak boleh simpan jika:
  - Tidak ada supplier
  - Tidak ada item
  - Total = 0

====================================
C. PROSES AKUNTANSI (WAJIB AUTO)
====================================
Saat pembelian dibuat:

Jika BELUM dibayar:
- Debit → Persediaan / Biaya
- Kredit → Hutang Usaha

Jika langsung dibayar:
- Debit → Persediaan / Biaya
- Kredit → Kas/Bank

Jika ada pajak:
- Debit → Pajak Masukan

Jika ada DP:
- Debit → Uang Muka Pembelian
- Kredit → Kas/Bank

====================================
D. PROSES PEMBAYARAN HUTANG
====================================
1. Pilih transaksi pembelian → tampilkan detail

2. Form pembayaran:
- Total Dibayar (default dari sisa hutang, bisa diubah)
- Nomor Pembayaran (auto generate PAY/YYYY/MM/XXXX)
- Tanggal Transaksi
- Dibayar dari (akun Kas/Bank)
- Referensi
- Tag
- Attachment (upload bukti bayar JPG/PNG)
- Pemotongan (Rp atau %)
- Total (auto)

3. Support:
- Pembayaran sebagian (partial)
- Multiple pembayaran per transaksi

====================================
E. JURNAL PEMBAYARAN (AUTO)
====================================
Saat pembayaran hutang:

Jika pembayaran normal:
- Debit → Hutang Usaha
- Kredit → Kas/Bank

Jika ada potongan:
- Debit → Hutang Usaha
- Kredit → Kas/Bank
- Kredit → Pendapatan Lain (diskon pembelian)

====================================
F. STATUS OTOMATIS
====================================
- Lunas → jika sisa hutang = 0
- Sebagian → jika belum lunas
- Belum Dibayar → jika belum ada pembayaran
- Jatuh Tempo → jika melewati tanggal jatuh tempo
- Void → jika dibatalkan

====================================
G. LOG & AUDIT
====================================
Wajib menyimpan:
- Dibuat oleh
- Waktu dibuat
- Perubahan data
- Aktivitas:
  - dibuat
  - diubah
  - dihapus
  - dicetak
  - dilihat

====================================
H. UX RULE
====================================
- User tidak boleh input jurnal manual
- Semua perhitungan otomatis
- Semua akun wajib terhubung ke COA
- Minim human error

====================================
GOAL:
Membuat sistem pembelian yang:
- Mengelola hutang usaha dengan akurat
- Mendukung DP, termin, cicilan
- Terintegrasi penuh ke laporan keuangan

WAJIB:
- Update otomatis:
  - Persediaan (jika barang)
  - HPP (jika sistem inventory aktif)
  - Laporan keuangan real-time

- Semua transaksi harus punya audit trail lengkap
- Tidak boleh ada transaksi tanpa dampak jurnal





Biaya

Buatkan sistem akuntansi otomatis berbasis form pembayaran (expense) dengan aturan berikut:

1. SETIAP TRANSAKSI WAJIB AUTO JURNAL (DOUBLE ENTRY)
- User tidak boleh input jurnal manual
- Sistem wajib generate jurnal secara otomatis saat transaksi disimpan

2. STRUKTUR JURNAL PEMBAYARAN
Jika transaksi adalah pembayaran biaya, maka:
- Debit → Akun Biaya (sesuai pilihan di field "Akun Biaya")
- Kredit → Akun Kas/Bank (sesuai field "Dibayar Dari")

Jika "Bayar Nanti" aktif:
- Debit → Akun Biaya
- Kredit → Hutang Usaha

Jika hutang dibayar:
- Debit → Hutang Usaha
- Kredit → Kas/Bank

3. MULTI BARIS (DETAIL ITEM)
- Setiap baris harus punya:
  - Akun Biaya (COA)
  - Deskripsi
  - Pajak (opsional)
  - Nominal
- Sistem harus:
  - Menjumlahkan semua baris → Subtotal
  - Menghitung pajak (jika ada)
  - Menghasilkan Total akhir

4. PAJAK
Jika pajak dipilih:
- Tambahkan jurnal:
  - Debit → Pajak Masukan (jika PPN)
  - Kredit → Kas/Bank atau Hutang
- Jika "Harga termasuk pajak", sistem harus otomatis split nilai DPP & Pajak

5. FIELD WAJIB TERHUBUNG COA
Mapping:
- Dibayar Dari → Akun Kas/Bank
- Akun Biaya → Expense Account
- Bayar Nanti → Hutang Usaha
- Pemotongan → Contra Expense atau akun lain

6. NOMOR TRANSAKSI
- Auto generate unik (EXP/YYYY/MM/XXXX)
- Tidak boleh duplikat

7. VALIDASI
- Tidak boleh simpan jika:
  - Tidak ada akun
  - Total = 0
  - Tidak ada baris transaksi

8. OUTPUT JURNAL (WAJIB TERSEDIA)
Contoh:
Tanggal: 29/03/2026

Debit:
- Biaya Operasional      500.000

Kredit:
- Kas                    500.000

9. LOG & AUDIT
- Simpan:
  - Siapa input
  - Waktu input
  - Perubahan data
- Tidak boleh edit jurnal langsung, hanya via edit transaksi

10. UX WAJIB SIMPLE
- User hanya isi form
- Semua perhitungan & jurnal terjadi di backend



Produk

Buatkan sistem Master Produk terintegrasi dengan sistem akuntansi dan inventory dengan spesifikasi berikut:

====================================
A. FORM TAMBAH / EDIT PRODUK
====================================

1. Informasi Utama:
- Nama Produk (wajib)
- Kategori (dropdown dari database kategori)
- Kode/SKU (auto generate, format SKU/XXXXX, unik)
- Satuan (pcs, kg, liter, dll)
- Deskripsi

2. Gambar Produk:
- Upload gambar (opsional)
- Bisa tampilkan/preview gambar

====================================
B. PENGATURAN AKUNTANSI (WAJIB TERHUBUNG COA)
====================================

User bisa mengatur akun berikut:

- Akun Penjualan (Revenue Account)
- Akun Pembelian / HPP (COGS / Expense)
- Akun Persediaan (Inventory Asset)

RULE:
- Semua akun wajib terhubung ke COA
- Tidak boleh kosong jika fitur aktif

====================================
C. MODE PRODUK (FLEKSIBEL)
====================================

Gunakan toggle:

1. "Saya membeli item ini"
Jika aktif:
- Input Harga Beli default
- Digunakan untuk transaksi pembelian

2. "Saya menjual item ini"
Jika aktif:
- Input Harga Jual default
- Support harga grosir (multiple tier harga)

3. "Saya melacak inventory item ini"
Jika aktif:
- Aktifkan sistem stok
- Wajib isi akun persediaan

====================================
D. HARGA
====================================

- Harga Beli (default)
- Harga Jual (default)
- Harga Grosir (optional multi level)

RULE:
- Harga tidak boleh negatif
- Bisa kosong jika mode tidak aktif

====================================
E. INVENTORY (JIKA DIAKTIFKAN)
====================================

1. Stok:
- Stok awal (saat input pertama)
- Stok minimal

2. Pergerakan stok:
- Otomatis update saat:
  - Pembelian → stok bertambah
  - Penjualan → stok berkurang
  - Retur → penyesuaian

3. Metode:
- FIFO (default) atau Average

====================================
F. PAJAK
====================================

- Default pajak penjualan (PPN / PPh)
- Default pajak pembelian

====================================
G. VALIDASI
====================================

Tidak boleh simpan jika:
- Nama kosong
- SKU duplikat
- Mode aktif tapi akun tidak diisi

====================================
H. AUTO INTEGRASI AKUNTANSI
====================================

Saat transaksi:

1. Penjualan:
- Debit → Piutang / Kas
- Kredit → Pendapatan
- Jika inventory aktif:
  - Debit → HPP
  - Kredit → Persediaan

2. Pembelian:
- Debit → Persediaan / Biaya
- Kredit → Hutang / Kas

====================================
I. LOG & AUDIT
====================================

Simpan:
- Dibuat oleh
- Diubah oleh
- Waktu
- Riwayat perubahan data

====================================
J. UX RULE
====================================

- Form harus sederhana
- Gunakan toggle (on/off) seperti gambar
- Field muncul hanya jika relevan
- Semua perhitungan otomatis

====================================
GOAL:
Membuat sistem produk yang:
- Menjadi pusat semua transaksi (jualan, beli, stok)
- Terhubung langsung ke akuntansi
- Mudah digunakan user non-akuntan

WAJIB:
- Produk harus reusable di semua modul:
  - Invoice
  - Pembelian
  - Stok
  - Laporan

- Perubahan harga tidak mengubah histori transaksi lama
- Semua pergerakan stok harus tercatat (stock ledger)




Kontak

Buatkan sistem Master Kontak (Customer & Supplier) terintegrasi dengan sistem akuntansi dan transaksi (Invoice & Pembelian) dengan spesifikasi berikut:

====================================
A. FORM TAMBAH / EDIT KONTAK
====================================

1. Informasi Utama:
- Tipe Kontak (Customer / Supplier / Keduanya)
- Grup (bisa dibuat & diatur user)
- Sapaan (Tn/Ny/PT/CV/dll)
- Nama (wajib)
- Perusahaan
- Nomor (ID internal / kode kontak)

2. Informasi Kontak:
- Telepon
- Email
- Alamat (opsional jika expand)
- Kota, Provinsi, Kode Pos

3. Foto:
- Upload foto/logo (opsional)

====================================
B. INFORMASI TAMBAHAN (EXPANDABLE)
====================================

Jika user klik "Tampilkan selengkapnya":

- NPWP
- NIK / Identitas
- Catatan internal
- Default Termin (7 hari, 15 hari, 30 hari, custom)
- Default Pajak
- Default Mata Uang

====================================
C. INTEGRASI AKUNTANSI (WAJIB)
====================================

Setiap kontak harus terhubung ke akun:

Jika Customer:
- Akun Piutang Usaha (Accounts Receivable)

Jika Supplier:
- Akun Hutang Usaha (Accounts Payable)

RULE:
- Akun otomatis assign dari default sistem
- Bisa diubah jika diperlukan
- Tidak boleh kosong

====================================
D. HUBUNGAN KE TRANSAKSI
====================================

Kontak harus terhubung ke:

1. Penjualan:
- Invoice
- Pembayaran

2. Pembelian:
- Purchase
- Pembayaran Hutang

====================================
E. AUTO FLOW AKUNTANSI
====================================

Saat transaksi:

1. Invoice ke Customer:
- Debit → Piutang (per kontak)
- Kredit → Pendapatan

2. Pembayaran dari Customer:
- Debit → Kas/Bank
- Kredit → Piutang

3. Pembelian dari Supplier:
- Debit → Persediaan/Biaya
- Kredit → Hutang (per kontak)

4. Pembayaran ke Supplier:
- Debit → Hutang
- Kredit → Kas/Bank

====================================
F. STATUS & MONITORING
====================================

Untuk setiap kontak tampilkan:

- Total Piutang
- Total Hutang
- Total Transaksi
- Status:
  - Aktif
  - Nonaktif

====================================
G. VALIDASI
====================================

Tidak boleh simpan jika:
- Nama kosong
- Tipe kontak tidak dipilih

Email & telepon:
- Validasi format

====================================
H. DUPLIKASI & KEAMANAN
====================================

- Cegah duplikasi berdasarkan:
  - Nama + Telepon / Email
- Berikan warning jika mirip

====================================
I. LOG & AUDIT
====================================

Simpan:
- Dibuat oleh
- Diubah oleh
- Waktu
- Riwayat aktivitas:
  - dibuat
  - diubah
  - dihapus
  - dilihat

====================================
J. UX RULE
====================================

- Form sederhana seperti gambar
- Field tambahan disembunyikan (expandable)
- Cepat input (minim klik)
- Bisa digunakan oleh user non-akuntan

====================================
GOAL:
Membuat sistem kontak yang:
- Menjadi pusat relasi bisnis
- Terhubung langsung ke Piutang & Hutang
- Memudahkan tracking transaksi per pelanggan & supplier

WAJIB:
- Setiap kontak punya ledger sendiri (buku besar per kontak)
- Bisa lihat histori transaksi lengkap:
  - Invoice
  - Pembayaran
  - Pembelian
  - Hutang
- Semua saldo harus real-time update




Inventori

Buatkan sistem Inventori & Gudang untuk SaaS akuntansi dengan fitur lengkap seperti berikut:

====================================
A. HALAMAN UTAMA INVENTORI
====================================

1. Header:
- Nama Gudang (contoh: Unassigned)
- Kode Gudang (UA)

2. Upload gambar gudang:
- Upload image (max 10MB)
- Simpan sebagai identitas gudang

3. Summary Box (dashboard mini):
- Total Stok (qty seluruh produk)
- Total Nilai Produk (nilai inventory)
- Rata-rata HPP

====================================
B. TABEL DATA INVENTORI
====================================

Kolom:
- Nama Produk
- Kode Produk
- Qty (jumlah stok)
- Satuan
- Nilai (total nilai produk)

Fitur:
- Sorting
- Search
- Filter

C. STRUKTUR DATA

Tabel: warehouses
- id
- nama_gudang
- kode_gudang
- image
- created_at

Tabel: inventory
- id
- product_id
- warehouse_id
- qty
- hpp
- total_nilai

Tabel: stock_movements
- id
- product_id
- warehouse_id
- tipe (in, out, transfer, adjustment)
- qty
- hpp
- reference_id
- created_at

D. LOGIKA HPP (WAJIB)

Gunakan metode:
- Moving Average
Rumus:
- HPP baru = (nilai lama + pembelian baru) / total qty baru

E. AKTIVITAS UTAMA
1. Penambahan Stok:
- Dari pembelian
- Dari penyesuaian
2. Pengurangan Stok:
- Dari penjualan
- Dari kerusakan
3. Transfer Gudang:
- Dari gudang A ke gudang B
4. Penyesuaian Stok:
- Koreksi selisih


F. AUTO JURNAL (INTEGRASI AKUNTANSI)
1. Pembelian:
- Debit: Persediaan
- Kredit: Kas / Hutang
2. Penjualan:
- Debit: HPP
- Kredit: Persediaan
3. Penyesuaian:
- Debit/Kredit: Selisih Persediaan

G. FITUR TAMBAHAN 
1. Tombol:
- Transfer Gudang
- Penyesuaian Stok
- Export
- Print

2. Search:
- Cari produk

3. Filter:
- Berdasarkan kategori / gudang

H. VALIDASI
- Tidak boleh stok minus (opsional bisa diaktifkan)
- Qty harus numerik
- Gudang wajib ada

I. TOKENISASI
- Tambah stok → 1 token
- Transfer gudang → 2 token
- Penyesuaian stok → 1 token

Rule:
- Token hanya dipotong jika berhasil


J. LOG HISTORY
Simpan:
- Perubahan stok
- Transfer
- Penyesuaian

K. GOAL SISTEM
Membuat sistem inventory yang:
- Real-time
- Terintegrasi akuntansi
- Mudah dipahami




Kas Bank

Buatkan sistem Kas & Bank (Cash Management) terintegrasi dengan COA dan semua transaksi akuntansi dengan spesifikasi berikut:

A. HALAMAN LIST KAS & BANK
1. Tampilkan daftar akun Kas & Bank:
- Nama Akun
- Kode Akun
- Saldo Saat Ini
- Grafik pergerakan saldo

2. Fitur:
- Tambah Kas/Bank
- Lihat detail transaksi
- Filter periode
- Print laporan

B. TAMBAH / EDIT KAS & BANK
Form:
- Nama Akun (wajib)
- Kode Akun (auto/manual, unik)
- Kategori (default: Kas & Bank)
- Sub Akun dari (optional, parent COA)

RULE:
- Saat dibuat → otomatis masuk ke tabel COA
- is_system = false (user account)
- Harus masuk kategori "Kas & Bank"

C. SALDO & PERGERAKAN
1. Saldo tidak diinput manual
2. Saldo dihitung dari jurnal:

Saldo = Total Debit - Total Kredit

3. Real-time update dari:
- Invoice (pembayaran)
- Pembelian (pembayaran)
- Transaksi manual kas

D. TRANSAKSI KAS & BANK
1. Jenis transaksi:
- Uang Masuk
- Uang Keluar
- Transfer antar rekening
2. Form Transaksi:
- Tanggal
- Akun Kas/Bank
- Jenis transaksi
- Nominal
- Kategori akun lawan (COA)
- Deskripsi
- Referensi
- Tag
- Attachment (optional)

E. AUTO JURNAL (WAJIB)
1. Uang Masuk:
- Debit → Kas/Bank
- Kredit → Akun lawan
2. Uang Keluar:
- Debit → Akun lawan
- Kredit → Kas/Bank
3. Transfer:
- Debit → Kas tujuan
- Kredit → Kas asal

RULE:
- User tidak boleh input jurnal manual

F. INTEGRASI DENGAN MODUL LAIN
1. Invoice:
- Pembayaran → masuk ke Kas/Bank
2. Pembelian:
- Pembayaran → keluar dari Kas/Bank
3. Produk:
- Tidak langsung, tapi lewat transaksi

G. REKONSILIASI (OPSIONAL TAPI DISARANKAN)
- Cocokkan saldo sistem dengan rekening bank
- Tandai transaksi:
  - Sudah cocok
  - Belum cocok

H. STATUS & MONITORING
Per akun tampilkan:
- Saldo sekarang
- Total masuk
- Total keluar
- Jumlah transaksi

I. VALIDASI
Tidak boleh:
- Nominal <= 0
- Tidak ada akun lawan
- Akun tidak valid

J. LOG & AUDIT
Simpan:
- Dibuat oleh
- Waktu
- Riwayat:
  - dibuat
  - diubah
  - dihapus
  - dilihat

K. UX RULE
- Sederhana seperti gambar
- Fokus ke saldo & grafik
- Cepat input transaksi

GOAL:
Membuat sistem kas & bank yang:
- Mengontrol arus uang real-time
- Terintegrasi penuh ke akuntansi
- Minim kesalahan user




Akun (COA)

Buatkan sistem Chart of Accounts (COA) dengan konsep FIXED SYSTEM + AUTO SEED DATABASE dengan spesifikasi berikut:

A. STRUKTUR DATABASE
Buat tabel: accounts
Field:
- id (primary key)
- name (string)
- code (string, unique)
- category (string)
- parent_id (nullable)
- is_system (boolean, default true)
- is_editable (boolean, default false)
- is_deletable (boolean, default false)
- is_active (boolean, default true)
- created_at
- updated_at

B. AUTO SEED DATA (WAJIB)
Saat sistem pertama kali dijalankan atau user pertama register:
INSERT data berikut ke tabel accounts:

Kas | 1-10001 | Kas & Bank  
Rekening Mandiri | 1-10003 | Kas & Bank  
Piutang Usaha | 1-10100 | Akun Piutang  
Piutang Belum Ditagih | 1-10101 | Akun Piutang  
Cadangan Kerugian Piutang | 1-10102 | Akun Piutang  
Piutang Customer | 1-10103 | Akun Piutang  
Persediaan Barang | 1-10200 | Persediaan  
Piutang Lainnya | 1-10300 | Aktiva Lancar Lainnya  
Piutang Karyawan | 1-10301 | Aktiva Lancar Lainnya  
Iuran BPJS | 1-10302 | Akun Piutang  
Dana Belum Disetor | 1-10400 | Aktiva Lancar Lainnya  
Aset Lancar Lainnya | 1-10401 | Aktiva Lancar Lainnya  
Biaya Dibayar Di Muka | 1-10402 | Aktiva Lancar Lainnya  
Uang Muka | 1-10403 | Aktiva Lancar Lainnya  
PPN Masukan | 1-10500 | Aktiva Lancar Lainnya  
Pajak Dibayar Di Muka - PPh 22 | 1-10501 | Aktiva Lancar Lainnya  
Pajak Dibayar Di Muka - PPh 23 | 1-10502 | Aktiva Lancar Lainnya  
Pajak Dibayar Di Muka - PPh 25 | 1-10503 | Aktiva Lancar Lainnya  
Aset Tetap - Tanah | 1-10700 | Aktiva Tetap  
Aset Tetap - Bangunan | 1-10701 | Aktiva Tetap  
Aset Tetap - Building Improvements | 1-10702 | Aktiva Tetap  
Aset Tetap - Kendaraan | 1-10703 | Aktiva Tetap  
Aset Tetap - Mesin & Peralatan | 1-10704 | Aktiva Tetap  
Aset Tetap - Perlengkapan Kantor | 1-10705 | Aktiva Tetap  
Aset Tetap - Aset Sewa Guna Usaha | 1-10706 | Aktiva Tetap  
Aset Tak Berwujud | 1-10707 | Aktiva Tetap  
Akumulasi Penyusutan - Bangunan | 1-10751 | Depresiasi & Amortisasi  
Akumulasi Penyusutan - Building Improvements | 1-10752 | Depresiasi & Amortisasi  
Akumulasi penyusutan - Kendaraan | 1-10753 | Depresiasi & Amortisasi  
Akumulasi Penyusutan - Mesin & Peralatan | 1-10754 | Depresiasi & Amortisasi  
Akumulasi Penyusutan - Peralatan Kantor | 1-10755 | Depresiasi & Amortisasi  
Akumulasi Penyusutan - Aset Sewa Guna Usaha | 1-10756 | Depresiasi & Amortisasi  
Akumulasi Amortisasi | 1-10757 | Depresiasi & Amortisasi  
Investasi | 1-10800 | Aktiva Lainnya  
Hutang Usaha | 2-20100 | Akun Hutang  
Hutang Belum Ditagih | 2-20101 | Akun Hutang  
HUTANG BPJS | 2-20102 | Akun Hutang  
Hutang Pelanggan | 2-20103 | Akun Hutang  
PPN KURANG BAYAR | 2-20104 | Akun Hutang  
HUTANG PEMBELIAN ASET | 2-20105 | Akun Hutang  
Uang Titipan Pajak Reklame | 2-20106 | Akun Hutang  
Hutang Lain Lain | 2-20200 | Kewajiban Lancar Lainnya  
Hutang Gaji | 2-20201 | Kewajiban Lancar Lainnya  
Hutang Deviden | 2-20202 | Kewajiban Lancar Lainnya  
Pendapatan Diterima Di Muka | 2-20203 | Kewajiban Lancar Lainnya  
Hutang Konsinyasi | 2-20205 | Kewajiban Lancar Lainnya  
Sarana Kantor Terhutang | 2-20301 | Kewajiban Lancar Lainnya  
Bunga Terhutang | 2-20302 | Kewajiban Lancar Lainnya  
Biaya Terhutang Lainnya | 2-20399 | Kewajiban Lancar Lainnya  
Hutang Bank | 2-20400 | Kewajiban Lancar Lainnya  
PPN Keluaran | 2-20500 | Kewajiban Lancar Lainnya  
Hutang Pajak - PPh 21 | 2-20501 | Kewajiban Lancar Lainnya  
Hutang Pajak - PPh 22 | 2-20502 | Kewajiban Lancar Lainnya  
Hutang Pajak - PPh 23 | 2-20503 | Kewajiban Lancar Lainnya  
Hutang Pajak - PPh 29 | 2-20504 | Kewajiban Lancar Lainnya  
Hutang Pajak Lainnya | 2-20599 | Kewajiban Lancar Lainnya  
Hutang dari Pemegang Saham | 2-20600 | Kewajiban Lancar Lainnya  
Kewajiban Lancar Lainnya | 2-20601 | Kewajiban Lancar Lainnya  
Kewajiban Manfaat Karyawan | 2-20700 | Kewajiban Jangka Panjang  
Modal Saham | 3-30000 | Ekuitas  
Tambahan Modal Disetor | 3-30001 | Ekuitas  
Laba Ditahan | 3-30100 | Ekuitas  
Deviden | 3-30200 | Ekuitas  
Pendapatan Komprehensif Lainnya | 3-30300 | Ekuitas  
Ekuitas Saldo Awal | 3-30999 | Ekuitas  
Pendapatan | 4-40000 | Pendapatan  
Diskon Penjualan | 4-40100 | Pendapatan  
Retur Penjualan | 4-40200 | Pendapatan  
Pendapatan Belum Ditagih | 4-40201 | Pendapatan  
Beban Pokok Pendapatan | 5-50000 | Harga Pokok Penjualan  
Diskon Pembelian | 5-50100 | Harga Pokok Penjualan  
Retur Pembelian | 5-50200 | Harga Pokok Penjualan  
Pengiriman & Pengangkutan | 5-50300 | Harga Pokok Penjualan  
Biaya Impor | 5-50400 | Harga Pokok Penjualan  
Biaya Produksi | 5-50500 | Harga Pokok Penjualan  
Iklan & Promosi | 6-60001 | Beban  
Komisi & Fee | 6-60002 | Beban  
Bensin, Tol dan Parkir - Penjualan | 6-60003 | Beban  
Perjalanan Dinas - Penjualan | 6-60004 | Beban  
Komunikasi - Penjualan | 6-60005 | Beban  
Bunga Pinjaman Bank | 6-60006 | Beban  
Biaya MDR Penjualan | 6-60007 | Beban  
Gaji | 6-60101 | Beban  
Upah | 6-60102 | Beban  
Makanan & Transportasi | 6-60103 | Beban  
Lembur | 6-60104 | Beban  
Pengobatan | 6-60105 | Beban  
THR & Bonus | 6-60106 | Beban  
Jamsostek | 6-60107 | Beban  
Insentif | 6-60108 | Beban  
Pesangon | 6-60109 | Beban  
Manfaat dan Tunjangan Lain | 6-60110 | Beban  
Donasi | 6-60200 | Beban  
Hiburan | 6-60201 | Beban  
Bensin, Tol dan Parkir - Umum | 6-60202 | Beban  
Perbaikan & Pemeliharaan | 6-60203 | Beban  
Perjalanan Dinas - Umum | 6-60204 | Beban  
Makanan | 6-60205 | Beban  
Komunikasi - Umum | 6-60206 | Beban  
Telpon dan Wifi | 6-60207 | Beban  
Asuransi | 6-60208 | Beban  
Legal & Profesional | 6-60209 | Beban  
Beban Manfaat Karyawan | 6-60210 | Beban  
Sarana Kantor | 6-60211 | Beban  
Pelatihan & Pengembangan | 6-60212 | Beban  
Beban Piutang Tak Tertagih | 6-60213 | Beban  
Pajak Reklame, PPh, PBB dan Perizinan | 6-60214 | Beban  
Denda | 6-60215 | Beban  
Pengeluaran Barang Rusak | 6-60216 | Beban  
Listrik | 6-60217 | Beban  
Air | 6-60218 | Beban  
IPL | 6-60219 | Beban  
Langganan Software | 6-60220 | Beban  
Telepon | 6-60221 | Beban  
Jasa Konsultan Pajak | 6-60222 | Beban  
Beban Kantor | 6-60300 | Beban  
Alat Tulis Kantor & Printing | 6-60301 | Beban  
Bea Materai | 6-60302 | Beban  
Keamanan dan Kebersihan | 6-60303 | Beban  
Supplies dan Material | 6-60304 | Beban  
Pemborong | 6-60305 | Beban  
Biaya Sewa - Bangunan | 6-60400 | Beban  
Biaya Sewa - Kendaraan | 6-60401 | Beban  
Biaya Sewa - Operasional | 6-60402 | Beban  
Biaya Sewa - Lain - lain | 6-60403 | Beban  
Biaya Transfer | 6-60404 | Beban  
Biaya Admin | 6-60405 | Beban  
Penyusutan - Bangunan | 6-60500 | Beban  
Penyusutan - Perbaikan Bangunan | 6-60501 | Beban  
Penyusutan - Kendaraan | 6-60502 | Beban  
Penyusutan - Mesin & Peralatan | 6-60503 | Beban  
Penyusutan - Peralatan Kantor | 6-60504 | Beban  
Penyusutan - Aset Sewa Guna Usaha | 6-60599 | Beban  
Pendapatan Bunga - Bank | 7-70000 | Pendapatan Lainnya  
Pendapatan Bunga - Deposito | 7-70001 | Pendapatan Lainnya  
Pendapatan Komisi - Barang Konsinyasi | 7-70002 | Pendapatan Lainnya  
Pembulatan | 7-70003 | Pendapatan Lainnya  
Pendapatan Lain - lain | 7-70099 | Pendapatan Lainnya  
Pendapatan lainnya (Service Charge) | 7-70100 | Pendapatan Lainnya  
Biaya Tambahan Pelanggan | 7-70101 | Pendapatan Lainnya  
Beban Bunga | 8-80000 | Beban Lainnya  
Provisi | 8-80001 | Beban Lainnya  
(Laba)/Rugi Pelepasan Aset Tetap | 8-80002 | Beban Lainnya  
Penyesuaian Persediaan | 8-80100 | Beban Lainnya  
Beban Lain - lain | 8-80999 | Beban Lainnya  
Revaluasi Bank | 8-81001 | Beban Lainnya  
Laba/Rugi Selisih Kurs - Belum Direalisasikan | 8-81002 | Beban Lainnya  
Laba/Rugi Selisih Kurs - Belum Direalisasikan (2) | 8-81002-1 | Beban Lainnya  
Laba/Rugi Selisih Kurs - Realisasikan | 8-81003 | Beban Lainnya  
Beban Pajak Bank | 9-90000 | Beban Lainnya  
Beban Pajak - Tangguhan | 9-90001 | Beban Lainnya  

C. RULE SYSTEM ACCOUNT
Semua data di atas:
- is_system = true
- is_editable = false
- is_deletable = false

D. USER CUSTOM ACCOUNT
User hanya boleh:
- Tambah akun baru
- is_system = false
- is_editable = true

GOAL:
Semua user langsung punya COA lengkap tanpa setup manual

Tambahkan field:
- system_code (unique key internal, contoh: CASH, AR, AP)

Agar sistem bisa mapping otomatis tanpa bergantung ke nama akun




Aset Tetap

Buatkan fitur "Aset Tetap (Fixed Asset)" untuk sistem SaaS akuntansi dengan UI dan logika seperti berikut:

A. HALAMAN TAMBAH ASET TETAP
Form input:

1. Nama Aset (wajib)
2. Nomor Aset (auto generate, format: FA00001)
3. Tanggal Pembelian (wajib)
4. Harga Beli (wajib, numerik)
5. Akun Aset Tetap (dropdown dari COA, wajib)
6. Dikreditkan Dari Akun (dropdown dari COA, wajib)
   Contoh:
   - Kas
   - Bank
   - Hutang

7. Deskripsi (optional)
8. Referensi (optional)
9. Tag (optional, untuk filtering)

B. PENYUSUTAN
Toggle:
- Tanpa Penyusutan (default: OFF)

Jika penyusutan aktif, tampilkan field:

1. Metode Penyusutan:
   - Garis Lurus (default)
   - Saldo Menurun (optional)
2. Umur Manfaat (bulan / tahun)
3. Nilai Residu
4. Tanggal Mulai Penyusutan

C. AUTO JURNAL (WAJIB)
Saat aset disimpan:
Jurnal:
- Debit → Akun Aset Tetap
- Kredit → Akun Pembayaran (Kas/Bank/Hutang)
Contoh:
Debit: Peralatan Kantor
Kredit: Kas

D. PENYUSUTAN OTOMATIS
Jika penyusutan aktif:
1. Sistem harus:
- Hitung beban penyusutan per bulan
- Generate jurnal otomatis setiap periode
2. Jurnal penyusutan:
- Debit → Beban Penyusutan
- Kredit → Akumulasi Penyusutan
3. Gunakan metode:
- Garis lurus:
  (Harga - Residu) / Umur

E. DATA STORAGE
Tabel: fixed_assets
- id
- nama_aset
- kode_aset
- tanggal_pembelian
- harga_beli
- akun_aset_id
- akun_kredit_id
- deskripsi
- referensi
- tag
- created_at

Tabel: depreciation
- id
- asset_id
- metode
- umur
- nilai_residu
- beban_per_bulan
- tanggal_mulai

F. VALIDASI
- Harga beli > 0
- Akun wajib dipilih
- Tidak boleh simpan tanpa akun
- Jika penyusutan aktif:
  - umur wajib diisi
  - metode wajib dipilih

G. UX BEHAVIOR

- Nomor aset otomatis
- Harga format currency
- Toggle penyusutan simple
- Form clean & minimal seperti gambar

H. TOKENISASI (INTEGRASI)

- Tambah aset tetap → 2 token
- Aktifkan penyusutan → +1 token

RULE:
- Token hanya dipotong jika berhasil simpan


I. LOG & HISTORY
Simpan aktivitas:
- dibuat
- diubah
- dihapus
- dilihat

J. GOAL SISTEM
Membuat sistem aset tetap yang:
- Otomatis jurnal
- Mudah digunakan
- Sesuai standar akuntansi
- Terintegrasi dengan laporan keuangan




Pengaturan

Buatkan sistem Role & Permission (Manajemen Peran User) untuk SaaS akuntansi dengan spesifikasi berikut:

A. HALAMAN MANAJEMEN PERAN

1. Tampilkan halaman detail peran:
- Nama Peran (contoh: Administrator)

2. Daftar modul dengan checkbox:
- Dashboard
- Penjualan
- Pembelian
- Biaya
- Produk
- Approval
- Inventori
- Akun
- Jurnal Umum
- Aset Tetap
- Kontak
- Laporan
- Kas & Bank
- Pengaturan
- POS

3. Setiap modul:
- Bisa di expand (dropdown)
- Bisa memiliki sub-permission (optional):
  - Lihat
  - Tambah
  - Edit
  - Hapus


B. FUNGSI UTAMA

1. User dapat:
- Mengaktifkan akses (centang)
- Menonaktifkan akses (uncheck)
2. Jika modul tidak dicentang:
- Menu tidak tampil di sidebar
- API akses ditolak

C. STRUKTUR DATA

Tabel: roles
- id
- nama_peran
- created_at

Tabel: permissions
- id
- module_name
- action (view, create, edit, delete)

Tabel: role_permissions
- id
- role_id
- permission_id

Tabel: users
- id
- nama
- role_id

D. LOGIKA AKSES
1. Saat user login:
- Ambil role user
- Ambil semua permission

2. Middleware:
- Cek apakah user punya permission
- Jika tidak:
  - return 403 (forbidden)


E. UI BEHAVIOR

1. Checkbox:
- Jika parent dicentang → semua child aktif
- Jika parent tidak dicentang → semua child mati
2. Expand/collapse:
- Untuk melihat detail permission
3. Tombol simpan:
- Simpan perubahan role


F. FITUR TAMBAHAN
1. Info user:
- Tampilkan:
  "Pengguna dengan peran ini: [nama user]"
2. Link cepat:
- "Klik di sini untuk mengatur pengguna"


G. KEAMANAN (WAJIB)
- Semua pengecekan harus di backend
- Frontend hanya tampilan
- Tidak boleh bypass via API


H. BATAS WAKTU AKSES (OPSIONAL)
Jika fitur aktif:
Tambahkan:
- Tanggal mulai akses
- Tanggal berakhir akses
Jika lewat:
- Akses otomatis ditolak

I. DEFAULT ROLE

Sistem harus punya default:
1. Administrator:
- Semua akses aktif
2. Staff:
- Akses terbatas
3. Viewer:
- Hanya lihat data


J. INTEGRASI TOKEN (OPSIONAL)

- Pengaturan role → FREE (tidak kena token)


K. GOAL SISTEM

Membuat sistem peran yang:
- Aman
- Fleksibel
- Mudah digunakan
- Bisa scaling untuk banyak user




ENGINE AKUNTANSI


a. Setiap transaksi (penjualan, pembelian, pembayaran) WAJIB otomatis membuat jurnal akuntansi (double entry).
User tidak perlu input jurnal manual.

b. Setiap jurnal WAJIB balance:
Total Debit = Total Kredit.
Jika tidak balance, transaksi tidak boleh disimpan.

c. Semua transaksi harus terhubung ke akun (COA).
Contoh:
- Penjualan → Pendapatan & Piutang
- Pembayaran → Kas & Piutang
- Pembelian → Persediaan/Beban & Hutang

d. Setiap jenis transaksi harus memiliki mapping akun otomatis.
User tidak memilih akun secara manual.

e. Flow sistem:
Transaksi → Jurnal → Buku Besar → Laporan

f. Setiap data transaksi harus mengalir ke:
- jurnal
- buku besar
- laporan keuangan (laba rugi & neraca)

g. Setiap transaksi memiliki status:
- draft
- posted
- void

Hanya transaksi "posted" yang masuk laporan.

h. Transaksi yang dibatalkan tidak boleh dihapus.
Harus dibuat jurnal pembalik (reversal).

i. Setiap transaksi memiliki periode (bulan & tahun).

j. User tidak bisa mengubah transaksi pada periode yang sudah dikunci.

k. Semua aktivitas harus tercatat:
- siapa
- kapan
- apa yang diubah




Tokenisasi

Buatkan sistem Tokenisasi untuk SaaS Akuntansi dengan konsep “pay per activity” (bayar berdasarkan aktivitas bisnis, bukan langganan) dengan spesifikasi berikut:

A. KONSEP UTAMA

1. Token adalah mata uang internal sistem
2. Token hanya digunakan saat user melakukan AKTIVITAS (bukan melihat data)
3. Tidak ada biaya untuk:
   - Login
   - Melihat data
   - Navigasi
4. Token digunakan untuk:
   - Transaksi bisnis
   - Aktivitas bernilai (export, AI, automation)

B. STRUKTUR DATA

Tabel: tokens
- id
- user_id / company_id
- balance
- created_at
- updated_at

Tabel: token_transactions
- id
- user_id
- activity_type (invoice_create, payment_input, dll)
- token_used
- reference_id (id transaksi terkait)
- description
- created_at

C. RULE TOKEN AKTIVITAS
1. Penjualan:
- Buat Invoice → 1 token
- Edit  Invoice → 2 token
- Hapus Invoice → 1 token
- Attachment → 1 token


2. Pembelian:
- Buat pembelian → 1 token
- Edit  pembelian → 2 token
- Hapus pembelian → 1 token
- Attachment → 1 token


3. Pembayaran Penjualan dan Pembelian:
- Input pembayaran → 1 token
- Edit  pembelian → 2 token
- Hapus pembelian → 1 token
- Attachment → 1 token


4. Biaya :
- Input Biaya → 1 token
- Edit  Biaya → 2 token
- Hapus Biaya → 1 token


5. Laporan:
- View laporan → 1 token
- Export PDF/Excel → 3 token

6. Fitur Pencarian Data 
- View Pencarian → 1 token

D. PROSES PENGGUNAAN TOKEN
Setiap user melakukan aktivitas:

1. Cek saldo token
2. Jika saldo cukup:
   - Kurangi saldo
   - Simpan ke token_transactions
   - Jalankan proses utama
3. Jika tidak cukup:
   - Tampilkan notifikasi:
     "Token tidak mencukupi, silahkan topup"

E. INTEGRASI DENGAN TRANSAKSI

WAJIB:

- Token hanya dipotong jika transaksi berhasil disimpan
- Jika transaksi gagal → token tidak dipotong
- Gunakan sistem atomic (transaction database)

F. TOPUP TOKEN
Fitur:
- Pilih paket token:
  - 100
  - 250
  - 500
  - 1000

- Setelah pembayaran:
  - Tambahkan saldo token
  - Simpan riwayat topup

Tabel tambahan: token_topup
- id
- user_id
- jumlah_token
- harga
- status (pending, success)
- created_at

G. UI / UX
1. Tampilkan saldo token di header/dashboard
2. Tampilkan estimasi token sebelum aksi:
   Contoh:
   "Aksi ini akan menggunakan 2 token"

3. Tampilkan riwayat penggunaan token
4. Notifikasi saat token hampir habis

H. VALIDASI
- Tidak boleh minus
- Tidak boleh double charge
- Harus konsisten dengan aktivitas

I. KEAMANAN


- Semua proses token harus server-side
- Tidak boleh dihitung di frontend
- Gunakan logging untuk audit





AI asisten 

Buatkan AI Assistant dengan behavior berikut:

1. UI:
- Bubble kecil di kanan bawah
- Muncul dengan animasi halus
- Bisa di close

2. Trigger:
- User idle 60 detik
- Atau ada perubahan signifikan data

3. Logic:
- Ambil data dari halaman aktif
- Jika tidak ada insight penting → jangan tampilkan

4. Output:
- Maksimal 2 kalimat
- Harus berbasis data
- Gunakan tone natural

5. Frequency:
- Max 1 insight per 2 menit
- Jangan tampilkan insight yang sama berulang

6. Goal:
Membuat AI terasa hidup, membantu, dan tidak mengganggu user



