-- ============================================================
-- VITTA ERP - Skema Database Akuntansi SaaS Supabase (AKT_)
-- Jalankan skrip ini di SQL Editor Supabase Anda
-- ============================================================

-- 1. Tabel Departemen
CREATE TABLE IF NOT EXISTS public.akt_departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID NOT NULL, -- references auth.users(id)
    name VARCHAR(100) NOT NULL,
    address TEXT,
    email VARCHAR(255),
    phone VARCHAR(50),
    whatsapp VARCHAR(50),
    logo_url TEXT,
    invite_token VARCHAR(100) UNIQUE
);

-- 2. Tabel Profil Pengguna (Ekstensi dari auth.users)
CREATE TABLE IF NOT EXISTS public.akt_user_profiles (
    id UUID PRIMARY KEY, -- references auth.users(id)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID NOT NULL,
    department_id UUID REFERENCES public.akt_departments(id) ON DELETE SET NULL,
    full_name VARCHAR(255),
    email VARCHAR(255),
    role VARCHAR(50) DEFAULT 'OWNER',
    status VARCHAR(20) DEFAULT 'ACTIVE'
);

-- 3. Tabel Bagan Akun (Chart of Accounts / COA)
CREATE TABLE IF NOT EXISTS public.akt_coa_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID NOT NULL,
    department_id UUID REFERENCES public.akt_departments(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    category VARCHAR(100) NOT NULL,
    "group" VARCHAR(100) NOT NULL,
    is_system BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    balance NUMERIC(20,2) DEFAULT 0.00,
    CONSTRAINT unique_user_coa_code UNIQUE (user_id, code)
);

-- 4. Tabel Buku Jurnal Akuntansi (Double-Entry Journals)
CREATE TABLE IF NOT EXISTS public.akt_journals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID NOT NULL,
    department_id UUID REFERENCES public.akt_departments(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    memo TEXT,
    ref_id VARCHAR(100),
    type VARCHAR(50) DEFAULT 'GENERAL',
    status VARCHAR(20) DEFAULT 'posted',
    lines JSONB NOT NULL -- Menyimpan debit, credit, account, accountName
);

-- 5. Tabel Master Produk
CREATE TABLE IF NOT EXISTS public.akt_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID NOT NULL,
    department_id UUID REFERENCES public.akt_departments(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) NOT NULL,
    category_name VARCHAR(100) DEFAULT 'Barang Dagang',
    unit VARCHAR(50) DEFAULT 'pcs',
    description TEXT,
    image_url TEXT,
    is_purchased BOOLEAN DEFAULT false,
    is_sold BOOLEAN DEFAULT false,
    is_tracked BOOLEAN DEFAULT false,
    buy_price NUMERIC(15,2) DEFAULT 0.00,
    sell_price NUMERIC(15,2) DEFAULT 0.00,
    initial_stock NUMERIC(15,2) DEFAULT 0.00,
    current_stock NUMERIC(15,2) DEFAULT 0.00,
    min_stock NUMERIC(15,2) DEFAULT 0.00,
    CONSTRAINT unique_user_product_sku UNIQUE (user_id, sku)
);

-- 6. Tabel Mutasi Stok Gudang (Stock Ledger)
CREATE TABLE IF NOT EXISTS public.akt_stock_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID NOT NULL,
    department_id UUID REFERENCES public.akt_departments(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.akt_products(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- PURCHASE, SALE, RETURN_SELL, RETURN_BUY, INITIAL, ADJUSTMENT
    reference_no VARCHAR(100),
    qty NUMERIC(15,2) NOT NULL,
    unit_cost NUMERIC(15,2) DEFAULT 0.00,
    stock_before NUMERIC(15,2) DEFAULT 0.00,
    stock_after NUMERIC(15,2) DEFAULT 0.00,
    notes TEXT
);

-- ============================================================
-- KONFIGURASI ROW LEVEL SECURITY (RLS) KETAT
-- ============================================================

-- Aktifkan RLS pada seluruh tabel
ALTER TABLE public.akt_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.akt_user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.akt_coa_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.akt_journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.akt_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.akt_stock_ledger ENABLE ROW LEVEL SECURITY;

-- Buat Kebijakan RLS (user_id = auth.uid()) untuk masing-masing tabel

-- A. Departemen
CREATE POLICY "Allow CRUD own departments" ON public.akt_departments
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- B. User Profiles
CREATE POLICY "Allow CRUD own profiles" ON public.akt_user_profiles
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- C. Bagan Akun (COA)
CREATE POLICY "Allow CRUD own coa" ON public.akt_coa_accounts
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- D. Buku Jurnal
CREATE POLICY "Allow CRUD own journals" ON public.akt_journals
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- E. Master Produk
CREATE POLICY "Allow CRUD own products" ON public.akt_products
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- F. Mutasi Stok
CREATE POLICY "Allow CRUD own stock ledger" ON public.akt_stock_ledger
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- G. Master Kontak (Customer & Supplier)
CREATE TABLE IF NOT EXISTS public.akt_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID NOT NULL,
    department_id UUID REFERENCES public.akt_departments(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    number VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    npwp VARCHAR(50),
    nik VARCHAR(50),
    notes TEXT,
    type VARCHAR(50) DEFAULT 'Customer', -- Customer, Supplier, Keduanya
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE
    ar_balance NUMERIC(20,2) DEFAULT 0.00,
    ap_balance NUMERIC(20,2) DEFAULT 0.00
);

ALTER TABLE public.akt_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow CRUD own contacts" ON public.akt_contacts
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- DATABASE INDEXES UNTUK OPTIMALISASI KINERJA (SCALABLE)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_akt_coa_code ON public.akt_coa_accounts(code);
CREATE INDEX IF NOT EXISTS idx_akt_journals_ref ON public.akt_journals(ref_id);
CREATE INDEX IF NOT EXISTS idx_akt_journals_date ON public.akt_journals(date);
CREATE INDEX IF NOT EXISTS idx_akt_products_sku ON public.akt_products(sku);
CREATE INDEX IF NOT EXISTS idx_akt_stock_product ON public.akt_stock_ledger(product_id);
CREATE INDEX IF NOT EXISTS idx_akt_contacts_name ON public.akt_contacts(name);

-- ============================================================
-- TRIGGER AUTOMATIC USER PROFILE CREATION
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_akt_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.akt_user_profiles (id, user_id, email, full_name, role, status)
  VALUES (
    new.id, 
    new.id, 
    new.email, 
    coalesce(new.raw_user_meta_data->>'full_name', 'User Pemilik'),
    'OWNER',
    'ACTIVE'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Pasang trigger ke auth.users
DROP TRIGGER IF EXISTS on_auth_user_created_akt ON auth.users;
CREATE TRIGGER on_auth_user_created_akt
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_akt_user();

