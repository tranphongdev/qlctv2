-- ====================================================================
-- SUPABASE DATABASE SCHEMA FOR QUẢN LÝ CHI TIÊU CÁ NHÂN 
-- Copy toàn bộ đoạn script này dán vào Supabase SQL Editor và nhấn "Run"
-- ====================================================================

-- 1. KÍCH HOẠT EXTENSION UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. BẢNG HỒ SƠ NGUỜI DÙNG (PROFILES)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL UNIQUE,
  user_name TEXT NOT NULL DEFAULT 'Tran Phong',
  user_email TEXT NOT NULL,
  avatar_url TEXT DEFAULT 'https://api.dicebear.com/7.x/avataaars/svg?seed=TranPhong',
  theme TEXT DEFAULT 'light',
  currency TEXT DEFAULT 'VND',
  language TEXT DEFAULT 'vi',
  timezone TEXT DEFAULT 'Asia/Ho_Chi_Minh',
  auto_backup BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. BẢNG VÍ & NGUỒN TIỀN (WALLETS)
CREATE TABLE IF NOT EXISTS public.wallets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default_user',
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'bank',
  bank_name TEXT,
  account_number TEXT,
  balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
  color TEXT DEFAULT '#4F46E5',
  icon TEXT DEFAULT 'Building2',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. BẢNG DANH MỤC CHI TIÊU / THU NHẬP (CATEGORIES)
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default_user',
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'thu' hoặc 'chi'
  icon TEXT DEFAULT 'CircleDollarSign',
  color TEXT DEFAULT '#4F46E5',
  is_archived BOOLEAN DEFAULT false,
  order_index INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. BẢNG GIAO DỊCH (TRANSACTIONS)
CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default_user',
  type TEXT NOT NULL, -- 'thu', 'chi', 'chuyen'
  amount NUMERIC(15, 2) NOT NULL,
  category TEXT NOT NULL,
  wallet_id TEXT NOT NULL,
  to_wallet_id TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time TIME DEFAULT CURRENT_TIME,
  note TEXT,
  receipt_url TEXT,
  tags TEXT[],
  location TEXT,
  counterparty TEXT,
  recurring TEXT DEFAULT 'none',
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. BẢNG NGÂN SÁCH (BUDGETS)
CREATE TABLE IF NOT EXISTS public.budgets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default_user',
  category TEXT NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  period TEXT DEFAULT 'month',
  month_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. BẢNG MỤC TIÊU TIẾT KIỆM (GOALS)
CREATE TABLE IF NOT EXISTS public.goals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default_user',
  name TEXT NOT NULL,
  target NUMERIC(15, 2) NOT NULL,
  saved NUMERIC(15, 2) DEFAULT 0,
  deadline DATE,
  image_url TEXT,
  color TEXT DEFAULT '#4F46E5',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. BẢNG SỔ NỢ & CHO VAY (DEBTS)
CREATE TABLE IF NOT EXISTS public.debts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default_user',
  name TEXT NOT NULL,
  direction TEXT NOT NULL, -- 'toi_no' (Cho vay) hoặc 'no_toi' (Đi vay)
  amount NUMERIC(15, 2) NOT NULL,
  paid NUMERIC(15, 2) DEFAULT 0,
  due DATE,
  note TEXT,
  phone TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. BẢNG THÔNG BÁO HỆ THỐNG (NOTIFICATIONS)
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default_user',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read BOOLEAN DEFAULT false,
  type TEXT DEFAULT 'system'
);

-- BẬT ROW LEVEL SECURITY (RLS) & TẠO POLICIES CHO PHÉP ĐỌC / GHI
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read wallets" ON public.wallets FOR SELECT USING (true);
CREATE POLICY "Allow public insert wallets" ON public.wallets FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update wallets" ON public.wallets FOR UPDATE USING (true);
CREATE POLICY "Allow public delete wallets" ON public.wallets FOR DELETE USING (true);

CREATE POLICY "Allow public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Allow public insert categories" ON public.categories FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read transactions" ON public.transactions FOR SELECT USING (true);
CREATE POLICY "Allow public insert transactions" ON public.transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update transactions" ON public.transactions FOR UPDATE USING (true);
CREATE POLICY "Allow public delete transactions" ON public.transactions FOR DELETE USING (true);

CREATE POLICY "Allow public read budgets" ON public.budgets FOR SELECT USING (true);
CREATE POLICY "Allow public insert budgets" ON public.budgets FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read goals" ON public.goals FOR SELECT USING (true);
CREATE POLICY "Allow public insert goals" ON public.goals FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update goals" ON public.goals FOR UPDATE USING (true);

CREATE POLICY "Allow public read debts" ON public.debts FOR SELECT USING (true);
CREATE POLICY "Allow public insert debts" ON public.debts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update debts" ON public.debts FOR UPDATE USING (true);

CREATE POLICY "Allow public read notifications" ON public.notifications FOR SELECT USING (true);
