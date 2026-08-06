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

-- ====================================================================
-- ROW LEVEL SECURITY: MỖI TÀI KHOẢN CHỈ THẤY DỮ LIỆU CỦA CHÍNH MÌNH
-- ====================================================================
-- Bản trước dùng policy USING (true) / WITH CHECK (true) cho mọi bảng, nghĩa là
-- bất kỳ ai cầm anon key đều đọc và sửa được toàn bộ dữ liệu của mọi người. Bảng
-- profiles thậm chí chưa từng bật RLS. Đoạn dưới thay toàn bộ bằng ràng buộc theo
-- auth.uid(). Chạy lại được nhiều lần mà không lỗi.

-- 1. Bỏ giá trị mặc định 'default_user'. Để nguyên thì một lệnh ghi quên gắn
--    user_id sẽ lặng lẽ rơi vào kho dùng chung thay vì báo lỗi.
ALTER TABLE public.wallets       ALTER COLUMN user_id DROP DEFAULT;
ALTER TABLE public.categories    ALTER COLUMN user_id DROP DEFAULT;
ALTER TABLE public.transactions  ALTER COLUMN user_id DROP DEFAULT;
ALTER TABLE public.budgets       ALTER COLUMN user_id DROP DEFAULT;
ALTER TABLE public.goals         ALTER COLUMN user_id DROP DEFAULT;
ALTER TABLE public.debts         ALTER COLUMN user_id DROP DEFAULT;
ALTER TABLE public.notifications ALTER COLUMN user_id DROP DEFAULT;

-- 2. Bật RLS cho tất cả, kể cả profiles (trước đây bị bỏ sót nên bảng hồ sơ
--    hoàn toàn không được bảo vệ).
ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 3. Xoá sạch policy mở toang của bản cũ.
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('profiles','wallets','categories','transactions',
                        'budgets','goals','debts','notifications')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- 4. Mỗi bảng một policy ALL duy nhất: đọc, thêm, sửa, xoá đều buộc user_id phải
--    khớp tài khoản đang đăng nhập. USING chặn đọc/sửa/xoá dòng của người khác,
--    WITH CHECK chặn ghi dòng mang user_id của người khác. Thiếu WITH CHECK thì
--    vẫn có thể chèn dữ liệu vào tài khoản người ta.
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['profiles','wallets','categories','transactions',
                             'budgets','goals','debts','notifications']
  LOOP
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated
         USING (user_id = auth.uid()::text)
         WITH CHECK (user_id = auth.uid()::text)',
      tbl || '_owner_only', tbl);
  END LOOP;
END $$;

-- 5. Chỉ mục cho cột lọc nóng nhất.
CREATE INDEX IF NOT EXISTS idx_wallets_user       ON public.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user    ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user  ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user       ON public.budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user         ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS idx_debts_user         ON public.debts(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);

-- ====================================================================
-- LƯU Ý DI TRÚ DỮ LIỆU CŨ
-- ====================================================================
-- Dữ liệu tạo trước khi siết RLS đều mang user_id = 'default_user' và từ nay sẽ
-- không tài khoản nào nhìn thấy. Nếu muốn gán chỗ dữ liệu đó cho một tài khoản,
-- lấy uuid trong Supabase Dashboard > Authentication > Users rồi chạy:
--
--   UPDATE public.transactions  SET user_id = '<uuid>' WHERE user_id = 'default_user';
--   UPDATE public.wallets       SET user_id = '<uuid>' WHERE user_id = 'default_user';
--   UPDATE public.categories    SET user_id = '<uuid>' WHERE user_id = 'default_user';
--   UPDATE public.budgets       SET user_id = '<uuid>' WHERE user_id = 'default_user';
--   UPDATE public.goals         SET user_id = '<uuid>' WHERE user_id = 'default_user';
--   UPDATE public.debts         SET user_id = '<uuid>' WHERE user_id = 'default_user';
--   UPDATE public.notifications SET user_id = '<uuid>' WHERE user_id = 'default_user';
--
-- Các lệnh trên phải chạy trong SQL Editor của Dashboard (quyền service_role,
-- không bị RLS chặn).
