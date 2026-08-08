import { supabase, isSupabaseConfigured } from './supabase';
import { t } from '~/i18n';

/**
 * Xác thực 2 lớp dạng TOTP, chạy trên Supabase Auth MFA. Mã bí mật do Supabase sinh
 * và lưu phía server — app chỉ hiển thị QR trong lúc đăng ký thiết bị.
 */

export interface TotpEnrollment {
  factorId: string;
  /** Ảnh QR dạng data URI (SVG) để người dùng quét. */
  qrCode: string;
  /** Khóa bí mật dạng chữ, dùng khi không quét được QR. */
  secret: string;
}

function requireClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error(t('mfa.not_configured'));
  }
  return supabase;
}

/** Trả về id của factor TOTP đã kích hoạt, hoặc null nếu tài khoản chưa bật 2FA. */
export async function getActiveTotpFactorId(): Promise<string | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) throw error;

  const verified = data.totp.find((factor) => factor.status === 'verified');
  return verified?.id ?? null;
}

/**
 * Tạo factor TOTP mới ở trạng thái chờ xác nhận. Chưa bảo vệ tài khoản cho tới khi
 * verifyTotpEnrollment() thành công.
 */
export async function startTotpEnrollment(): Promise<TotpEnrollment> {
  const client = requireClient();

  // Dọn các factor đăng ký dở từ lần trước, nếu không Supabase sẽ báo trùng tên.
  const { data: existing } = await client.auth.mfa.listFactors();
  for (const factor of existing?.totp ?? []) {
    if (factor.status !== 'verified') {
      await client.auth.mfa.unenroll({ factorId: factor.id });
    }
  }

  const { data, error } = await client.auth.mfa.enroll({ factorType: 'totp' });
  if (error) throw error;

  return {
    factorId: data.id,
    qrCode: data.totp.qr_code,
    secret: data.totp.secret,
  };
}

/**
 * Đối mã 6 số với một factor. Thành công thì phiên đăng nhập được nâng lên AAL2
 * — đây là tác dụng phụ mà disableTotp() dựa vào.
 */
async function verifyCode(factorId: string, code: string): Promise<void> {
  const client = requireClient();

  const { data: challenge, error: challengeError } = await client.auth.mfa.challenge({ factorId });
  if (challengeError) throw challengeError;

  const { error: verifyError } = await client.auth.mfa.verify({
    factorId,
    challengeId: challenge.id,
    code,
  });
  if (verifyError) throw verifyError;
}

/** Xác nhận mã 6 số để kích hoạt factor vừa đăng ký. */
export async function verifyTotpEnrollment(factorId: string, code: string): Promise<void> {
  await verifyCode(factorId, code);
}

/**
 * Gỡ factor TOTP, tài khoản quay lại chỉ dùng mật khẩu.
 *
 * Bắt buộc phải có mã 6 số. Supabase chỉ cho gỡ một factor ĐÃ xác minh khi phiên
 * đang ở mức AAL2 ("AAL2 required to unenroll verified factor"), mà phiên chỉ
 * lên AAL2 sau một lần verify thành công. Gọi thẳng unenroll như bản trước thì
 * người đã bật 2FA không bao giờ tắt được nữa.
 *
 * Đây cũng là hàng rào đúng: nếu chỉ cần đăng nhập là gỡ được 2FA thì kẻ có mật
 * khẩu tự tháo được lớp bảo vệ thứ hai, và lớp đó thành vô nghĩa.
 */
export async function disableTotp(factorId: string, code: string): Promise<void> {
  const client = requireClient();

  await verifyCode(factorId, code);

  const { error } = await client.auth.mfa.unenroll({ factorId });
  if (error) throw error;
}
