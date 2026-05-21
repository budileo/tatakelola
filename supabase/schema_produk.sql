-- ============================================================
-- Skema Database untuk Modul Master Produk
-- Vitta ERP — Tata Kelola One
-- ============================================================

-- 1. Tabel Kategori Produk
CREATE TABLE IF NOT EXISTS public.product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Default Kategori
INSERT INTO public.product_categories (name, description) VALUES
('Barang Dagang', 'Produk yang diperjualbelikan'),
('Jasa', 'Layanan/jasa yang dijual'),
('Bahan Baku', 'Material untuk produksi'),
('Barang Jadi', 'Hasil produksi siap jual'),
('ATK', 'Alat Tulis Kantor'),
('Perlengkapan', 'Perlengkapan operasional'),
('Elektronik', 'Perangkat elektronik'),
('Makanan & Minuman', 'Produk F&B')
ON CONFLICT DO NOTHING;

-- 2. Tabel Accounts (COA) — jika belum dibuat
-- Lihat schema terpisah di coa-engine.js (auto-seeded via JS)

-- 3. Tabel Produk Utama
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
    
    -- Informasi Utama
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(50) UNIQUE NOT NULL,              -- Format: SKU/XXXXX
    category_id UUID REFERENCES public.product_categories(id),
    unit VARCHAR(50) DEFAULT 'pcs',               -- pcs, kg, liter, box, dll
    description TEXT,
    image_url TEXT,                                 -- URL atau base64
    
    -- Mode Produk (Toggle)
    is_purchased BOOLEAN DEFAULT false,            -- Saya membeli item ini
    is_sold BOOLEAN DEFAULT false,                 -- Saya menjual item ini
    is_tracked BOOLEAN DEFAULT false,              -- Saya melacak inventory
    
    -- Harga
    buy_price NUMERIC(15,2) DEFAULT 0,
    sell_price NUMERIC(15,2) DEFAULT 0,
    
    -- Akun COA (Foreign key ke accounts)
    revenue_account_code VARCHAR(20),              -- Akun Penjualan
    cogs_account_code VARCHAR(20),                 -- Akun HPP/Pembelian
    inventory_account_code VARCHAR(20),            -- Akun Persediaan
    
    -- Inventory
    initial_stock NUMERIC(15,2) DEFAULT 0,
    current_stock NUMERIC(15,2) DEFAULT 0,
    min_stock NUMERIC(15,2) DEFAULT 0,
    stock_method VARCHAR(10) DEFAULT 'FIFO',       -- FIFO atau AVERAGE
    
    -- Pajak
    default_sell_tax VARCHAR(50) DEFAULT 'PPN 11%',
    default_buy_tax VARCHAR(50) DEFAULT 'PPN 11%',
    
    -- Status & Audit
    is_active BOOLEAN DEFAULT true,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabel Harga Grosir (Multi-level)
CREATE TABLE IF NOT EXISTS public.product_wholesale_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    min_qty NUMERIC(15,2) NOT NULL,                -- Minimum qty untuk harga ini
    price NUMERIC(15,2) NOT NULL,                  -- Harga per unit
    label VARCHAR(100),                            -- Label opsional, misal: "Grosir", "Reseller"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Stock Ledger (Catatan pergerakan stok)
CREATE TABLE IF NOT EXISTS public.stock_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    department_id UUID REFERENCES public.departments(id),
    
    type VARCHAR(20) NOT NULL,                     -- PURCHASE, SALE, RETURN, ADJUSTMENT, INITIAL
    reference_no VARCHAR(100),                     -- No invoice/PO terkait
    qty NUMERIC(15,2) NOT NULL,                    -- Positif = masuk, Negatif = keluar
    unit_cost NUMERIC(15,2) DEFAULT 0,
    stock_before NUMERIC(15,2) DEFAULT 0,
    stock_after NUMERIC(15,2) DEFAULT 0,
    notes TEXT,
    
    created_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Audit Log Produk
CREATE TABLE IF NOT EXISTS public.product_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    action VARCHAR(20) NOT NULL,                   -- CREATE, UPDATE, DELETE
    field_changed VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    changed_by VARCHAR(100),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products(name);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_stock_ledger_product ON public.stock_ledger(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_ledger_type ON public.stock_ledger(type);
CREATE INDEX IF NOT EXISTS idx_audit_log_product ON public.product_audit_log(product_id);

-- RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_wholesale_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_audit_log ENABLE ROW LEVEL SECURITY;
