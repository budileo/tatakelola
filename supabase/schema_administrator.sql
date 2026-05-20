-- Skema Database untuk Modul Administrator & RBAC Vitta
-- Jalankan skrip ini di SQL Editor Supabase

-- 1. Buat Tabel Roles
CREATE TABLE IF NOT EXISTS public.roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

-- Insert Default Roles
INSERT INTO public.roles (name, description) VALUES
('OWNER', 'Pemilik Perusahaan, hak akses penuh'),
('MANAGER', 'Manajer Departemen, bisa mengelola staf dan menu departemen'),
('SUPERVISOR', 'Supervisor, hak operasional tingkat lanjut'),
('STAF', 'Staf, hak akses standar operasional')
ON CONFLICT (name) DO NOTHING;

-- 2. Buat Tabel Companies (jika belum ada)
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert Default Company untuk testing
INSERT INTO public.companies (id, name) VALUES ('00000000-0000-0000-0000-000000000001', 'Perusahaan Utama Vitta')
ON CONFLICT (id) DO NOTHING;

-- 3. Buat Tabel Departments
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    address TEXT,
    email VARCHAR(255),
    phone VARCHAR(50),
    whatsapp VARCHAR(50),
    logo_url TEXT,
    owner_name VARCHAR(100),
    owner_phone VARCHAR(50),
    invite_token VARCHAR(100) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert Default Department
INSERT INTO public.departments (id, company_id, name, owner_name, invite_token) 
VALUES ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'Manajemen Pusat', 'Budi Leo', 'INV-PUSAT-001')
ON CONFLICT (id) DO NOTHING;

-- 4. Buat Tabel User Profiles (ekstensi dari auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id),
    department_id UUID REFERENCES public.departments(id),
    role_id INTEGER REFERENCES public.roles(id),
    full_name VARCHAR(255),
    email VARCHAR(255),
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Buat Tabel Menus (Dibuat oleh Owner)
CREATE TABLE IF NOT EXISTS public.menus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    path VARCHAR(255) NOT NULL,
    icon VARCHAR(100),
    is_owner_only BOOLEAN DEFAULT false, -- Jika true, hanya OWNER yang bisa akses (misal: Departemen, Token, COA)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert Default Menus
INSERT INTO public.menus (name, path, icon, is_owner_only) VALUES
('Dashboard', '/index.html', 'home', false),
('Penjualan', '/penjualan/index.html', 'shopping-cart', false),
('Pembelian', '/pembelian/index.html', 'truck', false),
('Biaya', '/biaya/index.html', 'dollar-sign', false),
('Administrator', '/administrator/index.html', 'settings', true), -- Modul Admin hanya untuk Owner/Manager
('Manajemen Departemen', '/administrator/departments.html', 'briefcase', true),
('Token', '/administrator/token.html', 'key', true),
('COA', '/akuntansi/coa.html', 'book', true)
ON CONFLICT DO NOTHING;

-- 6. Buat Tabel Department Menus (Toggle oleh Manager)
CREATE TABLE IF NOT EXISTS public.department_menus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    menu_id UUID NOT NULL REFERENCES public.menus(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(department_id, menu_id)
);

-- 7. Buat Tabel Invitations
CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id),
    department_id UUID REFERENCES public.departments(id), -- opsional, bisa dipilih nanti
    token VARCHAR(255) NOT NULL UNIQUE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- 8. Row Level Security (RLS)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Kebijakan (Policies) RLS Dasar:
-- A. User bisa melihat profilnya sendiri
CREATE POLICY "View own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

-- B. Manager & Owner bisa melihat profil user di perusahaannya
CREATE POLICY "Manager/Owner view company profiles" ON public.user_profiles
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM public.user_profiles WHERE id = auth.uid() AND role_id IN (1, 2) -- 1=OWNER, 2=MANAGER
        )
    );

-- C. Manager/Owner bisa mengupdate profil user (Approve pending)
CREATE POLICY "Manager/Owner update company profiles" ON public.user_profiles
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM public.user_profiles WHERE id = auth.uid() AND role_id IN (1, 2)
        )
    );

-- D. Departemen bisa dilihat oleh semua user di perusahaan yang sama
CREATE POLICY "View company departments" ON public.departments
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM public.user_profiles WHERE id = auth.uid()
        )
    );

-- Trigger untuk insert otomatis ke user_profiles saat user baru register di auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, status, role_id)
  VALUES (new.id, new.email, 'PENDING', 4); -- Default jadi STAF (4) dan PENDING
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Hapus trigger jika sudah ada lalu buat ulang
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Catatan: Untuk pembuatan user budileo (OWNER), akan dilakukan via frontend/script JS karena butuh proses hashing password dari API Auth Supabase.
