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

-- ============================================================================
-- 8. XÁC THỰC THEO USERNAME (chạy được nhiều lần, an toàn với dữ liệu đang có)
-- ============================================================================
-- Supabase Auth bắt buộc phải có email, nên mỗi tài khoản vẫn giữ một email nội
-- bộ dạng <username>@internal.local. Người dùng chỉ nhìn thấy và chỉ nhập
-- username; email thật là tuỳ chọn, thêm sau trong trang Hồ sơ.
--
-- Vì sao tách auth_email khỏi user_email:
--   user_email = email liên hệ thật, có thể trống, người dùng sửa thoải mái.
--   auth_email = email mà Supabase Auth đang thực sự giữ, dùng để đăng nhập.
-- Nếu gộp làm một thì lúc người dùng đổi email liên hệ, hàm tra cứu sẽ trả về
-- một địa chỉ mà Auth không công nhận và họ mất luôn khả năng đăng nhập.
-- auth_email chỉ được cập nhật SAU KHI Supabase xác nhận đã đổi email thành công.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username   TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS auth_email TEXT;

-- Email thật giờ là tuỳ chọn. Dữ liệu cũ có NOT NULL nên phải gỡ ràng buộc,
-- nếu không tài khoản mới (chưa có email) sẽ không ghi được hồ sơ.
ALTER TABLE public.profiles ALTER COLUMN user_email DROP NOT NULL;

-- Username là duy nhất, không phân biệt hoa thường: "Phong" và "phong" phải là
-- một người. Partial index để các hồ sơ cũ (username NULL) không đụng nhau.
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_key
  ON public.profiles (lower(username))
  WHERE username IS NOT NULL;

-- Tra email đăng nhập từ username. Bắt buộc phải là SECURITY DEFINER: lúc gọi
-- hàm này người dùng CHƯA đăng nhập, mà RLS ở mục 4 chỉ cho 'authenticated' đọc
-- hồ sơ của chính mình — truy vấn thẳng bảng sẽ luôn trả về rỗng.
-- Chỉ trả đúng một cột auth_email, không lộ phần còn lại của hồ sơ.
CREATE OR REPLACE FUNCTION public.auth_email_for_username(p_username TEXT)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth_email
  FROM public.profiles
  WHERE lower(username) = lower(trim(p_username))
  LIMIT 1;
$$;

-- Kiểm tra username còn trống, dùng lúc đăng ký để báo lỗi sớm và dễ hiểu thay
-- vì để Supabase Auth trả về "User already registered" khó hiểu với người dùng.
CREATE OR REPLACE FUNCTION public.username_available(p_username TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE lower(username) = lower(trim(p_username))
  );
$$;

REVOKE ALL ON FUNCTION public.auth_email_for_username(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.username_available(TEXT)      FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.auth_email_for_username(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.username_available(TEXT)      TO anon, authenticated;

-- Vá hồ sơ đã tồn tại từ trước: suy username từ phần trước @ của email hiện có,
-- và ghi nhận email đó chính là email đăng nhập. Chỉ chạm vào dòng chưa có
-- username nên chạy lại nhiều lần không làm hỏng dữ liệu.
UPDATE public.profiles
SET username   = COALESCE(username, split_part(user_email, '@', 1)),
    auth_email = COALESCE(auth_email, user_email)
WHERE username IS NULL
  AND user_email IS NOT NULL
  AND user_email <> '';

-- ============================================================================
-- 9. KHOÁ CHÍNH GHÉP (user_id, id) — chạy được nhiều lần
-- ============================================================================
-- Các bảng dữ liệu ở trên khai `id TEXT PRIMARY KEY`, tức id phải là duy nhất
-- trên TOÀN HỆ THỐNG, trong khi id lại do phía client tự đặt và chỉ có nghĩa
-- trong phạm vi một tài khoản. Hai chuyện đó không thể cùng đúng.
--
-- Chỗ vỡ rõ nhất là bảng categories: 14 danh mục mặc định mang id cố định
-- ('cat_an_uong', 'cat_cafe', ...) GIỐNG HỆT NHAU ở mọi tài khoản. Người đầu
-- tiên đăng ký chiếm hết các id đó. Từ tài khoản thứ hai trở đi, lệnh gieo danh
-- mục đụng khoá chính; ON CONFLICT DO UPDATE lại không qua nổi RLS vì dòng đang
-- thuộc về người khác — nên lệnh ghi hỏng và tài khoản mới thiếu danh mục.
-- Danh mục người dùng tự thêm (id 'cat_' + timestamp) vẫn lưu được, nên kết quả
-- là một danh sách khuyết chứ không phải trống trơn.
--
-- Sửa đúng chỗ: id chỉ cần duy nhất TRONG một tài khoản.
DO $$
DECLARE
  tbl     TEXT;
  pk_name TEXT;
  pk_cols INT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['wallets','categories','transactions',
                             'budgets','goals','debts','notifications']
  LOOP
    SELECT conname, array_length(conkey, 1)
      INTO pk_name, pk_cols
      FROM pg_constraint
     WHERE conrelid = format('public.%I', tbl)::regclass
       AND contype  = 'p';

    -- Chỉ đổi khi khoá chính vẫn còn là một cột; chạy lại lần hai sẽ bỏ qua.
    IF pk_name IS NOT NULL AND pk_cols = 1 THEN
      EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I', tbl, pk_name);
      EXECUTE format('ALTER TABLE public.%I ADD PRIMARY KEY (user_id, id)', tbl);
      RAISE NOTICE 'Đã đổi khoá chính của % sang (user_id, id)', tbl;
    END IF;
  END LOOP;
END $$;

-- PostgREST suy ra cột ON CONFLICT của lệnh upsert từ khoá chính, nên phải nạp
-- lại lược đồ; không thì các lệnh ghi tiếp theo vẫn chạy theo khoá cũ.
NOTIFY pgrst, 'reload schema';
