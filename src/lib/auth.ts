import { supabase, isSupabaseConfigured } from './supabase';
import { t } from '../i18n';
import { TAB_PATHS } from '../routes';
import type { Session } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  username: string;
  /** Email liên hệ do người dùng tự khai trong Hồ sơ. Rỗng nếu chưa khai. */
  email: string;
  name: string;
  avatarUrl: string;
}

/**
 * Miền của email nội bộ. Supabase Auth bắt buộc mỗi tài khoản phải có email, nhưng
 * người dùng chỉ đăng nhập bằng username — nên mỗi username được gán một địa chỉ
 * suy ra theo công thức. `.local` là miền dành riêng cho mạng nội bộ (RFC 6762)
 * nên chắc chắn không đụng địa chỉ thật của ai.
 */
const INTERNAL_EMAIL_DOMAIN = 'internal.local';

/**
 * Chuẩn hoá username về một dạng duy nhất: bỏ khoảng trắng thừa và hạ chữ thường.
 * Phải khớp với `lower(trim(...))` của unique index và hai hàm RPC trong
 * supabase_schema.sql, nếu lệch thì "Phong" và "phong" sẽ thành hai tài khoản.
 */
export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

/** Địa chỉ nội bộ mà Supabase Auth dùng cho một username mới đăng ký. */
export function internalEmailFor(username: string): string {
  return `${normalizeUsername(username)}@${INTERNAL_EMAIL_DOMAIN}`;
}

/** True nếu địa chỉ này là email nội bộ do app sinh ra, không phải email thật. */
export function isInternalEmail(email?: string | null): boolean {
  return !!email && email.toLowerCase().endsWith(`@${INTERNAL_EMAIL_DOMAIN}`);
}

function requireClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error(t('auth.not_configured'));
  }
  return supabase;
}

/**
 * Dựng AuthUser từ phiên Supabase.
 *
 * Email nội bộ bị lọc thành chuỗi rỗng: nó là chi tiết kỹ thuật của tầng xác thực,
 * để lộ ra giao diện thì người dùng sẽ thấy "phong@internal.local" như thể đó là
 * email của họ và tưởng app gửi thư tới đó được.
 */
function toAuthUser(u: {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}): AuthUser {
  const meta = u.user_metadata ?? {};
  const username = (meta.username as string) || (u.email ? u.email.split('@')[0] : '');
  const contactEmail = (meta.contact_email as string) || (isInternalEmail(u.email) ? '' : u.email || '');

  return {
    id: u.id,
    username,
    email: contactEmail,
    name: (meta.full_name as string) || username || t('auth.default_user_name'),
    avatarUrl: (meta.avatar_url as string) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`,
  };
}

/** Email mà Supabase Auth đang thực sự giữ cho phiên hiện tại. */
export function authEmailOfSession(session: Session | null): string {
  return session?.user?.email ?? '';
}

/**
 * Hỏi máy chủ xem username còn trống chưa.
 *
 * Trả về true khi không kiểm tra được (chưa cấu hình, RPC lỗi) — đây là bước báo
 * lỗi sớm cho đẹp, không phải hàng rào bảo vệ. Ràng buộc thật nằm ở unique index
 * trên profiles và ở tính duy nhất của email trong Supabase Auth, nên cho qua ở
 * đây cũng không tạo được tài khoản trùng.
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return true;

  const { data, error } = await supabase.rpc('username_available', {
    p_username: normalizeUsername(username),
  });

  if (error) {
    console.error('[auth] username_available lỗi:', error);
    return true;
  }
  return data !== false;
}

/**
 * Tìm email đăng nhập ứng với username.
 *
 * Người dùng chưa đăng nhập nên RLS chặn đọc thẳng bảng profiles; phải đi qua RPC
 * SECURITY DEFINER. Nếu chưa có hồ sơ (tài khoản vừa tạo, chưa kịp đồng bộ) thì
 * quay về địa chỉ nội bộ suy từ username — đúng cái đã dùng lúc đăng ký.
 */
async function resolveAuthEmail(username: string): Promise<string> {
  const fallback = internalEmailFor(username);
  if (!isSupabaseConfigured || !supabase) return fallback;

  const { data, error } = await supabase.rpc('auth_email_for_username', {
    p_username: normalizeUsername(username),
  });

  if (error) {
    console.error('[auth] auth_email_for_username lỗi:', error);
    return fallback;
  }
  return (data as string | null) || fallback;
}

export async function signUpWithUsername(username: string, pass: string, displayName?: string) {
  const client = requireClient();
  const normalized = normalizeUsername(username);

  if (!(await isUsernameAvailable(normalized))) {
    throw new Error(t('auth.username_taken'));
  }

  const { data, error } = await client.auth.signUp({
    email: internalEmailFor(normalized),
    password: pass,
    options: {
      data: {
        username: normalized,
        full_name: displayName?.trim() || normalized,
      },
    },
  });

  if (error) {
    // Supabase báo trùng email nội bộ, tức là username đã có người dùng. Dịch
    // sang thông điệp người dùng hiểu được thay vì "User already registered".
    if (/already registered|already exists/i.test(error.message)) {
      throw new Error(t('auth.username_taken'));
    }
    // Hạn mức gửi thư chỉ bị đụng tới khi dự án đang bật xác nhận email: mỗi
    // lần đăng ký, Supabase cố gửi thư tới <username>@internal.local — địa chỉ
    // không có thật — và chỉ vài lần là hết hạn mức của SMTP mặc định.
    if ((error as { code?: string }).code === 'over_email_send_rate_limit' || /email rate limit/i.test(error.message)) {
      throw new Error(t('auth.email_confirmation_on'));
    }
    throw error;
  }

  // Tắt xác nhận email thì signUp trả về phiên đăng nhập luôn. Không có phiên
  // nghĩa là dự án vẫn đang chờ người dùng bấm vào thư xác nhận — thứ sẽ không
  // bao giờ tới. Phải báo lỗi ở đây, nếu không app sẽ hiện giao diện "đã đăng
  // nhập" trong khi mọi lệnh đọc/ghi Supabase đều bị RLS chặn.
  if (data.user && !data.session) {
    throw new Error(t('auth.email_confirmation_on'));
  }

  return data;
}

export async function signInWithUsername(username: string, pass: string) {
  const client = requireClient();
  const email = await resolveAuthEmail(username);

  const { data, error } = await client.auth.signInWithPassword({ email, password: pass });

  if (error) {
    if (/invalid login credentials/i.test(error.message)) {
      throw new Error(t('auth.login_failed'));
    }
    throw error;
  }
  return data;
}

/** Nhà cung cấp đăng nhập ngoài mà giao diện có nút bấm sẵn. */
export type OAuthProvider = 'google' | 'github';

/**
 * Bật/tắt khối đăng nhập qua Google & GitHub.
 *
 * Mặc định TẮT vì hai nút này chỉ chạy được sau khi bật đúng provider trong
 * Supabase Dashboard (Authentication → Providers) và khai redirect URL; chưa bật
 * mà vẫn hiện nút thì người dùng bấm vào chỉ nhận lỗi "provider is not enabled".
 */
export const isOAuthEnabled = import.meta.env.VITE_ENABLE_OAUTH === 'true' && isSupabaseConfigured;

/**
 * Chuyển hướng sang trang đăng nhập của nhà cung cấp.
 *
 * Không trả về AuthUser: trình duyệt rời khỏi trang và quay lại qua redirect,
 * phiên mới được onAuthChange bắt lại. Người dùng tạo theo đường này không có
 * username do mình đặt — toAuthUser lấy tạm phần trước @ của email làm username.
 */
export async function signInWithProvider(provider: OAuthProvider) {
  const client = requireClient();

  const { error } = await client.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${window.location.origin}${TAB_PATHS.auth}` },
  });

  if (error) throw error;
}

/**
 * Lưu email liên hệ do người dùng khai trong trang Hồ sơ.
 *
 * Địa chỉ được ghi vào user_metadata.contact_email NGAY — đây là nguồn hiển thị
 * nên phải thấy hiệu lực tức thì. Việc đổi email đăng nhập của Supabase Auth chỉ
 * là nỗ lực thêm: Supabase gửi thư xác nhận và địa chỉ cũ (@internal.local) thì
 * không ai nhận được, nên rất có thể xác nhận không bao giờ hoàn tất.
 *
 * Trả về `authEmailChanged` để người gọi biết có nên cập nhật cột auth_email
 * trong bảng profiles hay không. Chừng nào Auth chưa thực sự đổi email thì
 * auth_email phải giữ nguyên địa chỉ nội bộ, nếu không lần đăng nhập tới sẽ tra
 * ra một địa chỉ mà Auth không công nhận và người dùng bị khoá ngoài tài khoản.
 */
export async function updateContactEmail(email: string): Promise<{ authEmailChanged: boolean }> {
  const client = requireClient();
  const trimmed = email.trim();

  const { error: metaError } = await client.auth.updateUser({
    data: { contact_email: trimmed },
  });
  if (metaError) throw metaError;

  if (!trimmed) return { authEmailChanged: false };

  const { data, error } = await client.auth.updateUser({ email: trimmed });
  if (error) {
    // Không ném lỗi: email liên hệ đã lưu xong ở trên và app vẫn chạy bình thường
    // khi Auth giữ nguyên địa chỉ nội bộ.
    console.error('[auth] Không đổi được email đăng nhập:', error);
    return { authEmailChanged: false };
  }

  return { authEmailChanged: data.user?.email?.toLowerCase() === trimmed.toLowerCase() };
}

export async function signOutUser() {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) console.error('Lỗi đăng xuất:', error);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user ? toAuthUser(data.user) : null;
}

export function onAuthChange(callback: (user: AuthUser | null, session: Session | null) => void) {
  if (!isSupabaseConfigured || !supabase) return () => {};

  const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ? toAuthUser(session.user) : null, session);
  });

  return () => {
    subscription.subscription.unsubscribe();
  };
}
