import { z } from 'zod';
import { t } from '~/i18n';

/**
 * Các schema được dựng qua hàm chứ không phải hằng số module: thông báo lỗi lấy từ
 * t(), mà t() đọc ngôn ngữ đang hoạt động tại thời điểm gọi. Nếu để dạng hằng số,
 * chuỗi lỗi sẽ bị đóng băng theo ngôn ngữ lúc import và không bao giờ đổi khi người
 * dùng chuyển ngôn ngữ trong Cài đặt.
 */

/**
 * Username là phần trước @ của email nội bộ <username>@internal.local, nên chỉ
 * cho phép các ký tự an toàn trong địa chỉ email. Cấm dấu chấm ở đầu/cuối và
 * loại bỏ dấu tiếng Việt vì cả hai đều sinh ra địa chỉ mà Supabase Auth từ chối.
 */
const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9_.-]*[a-z0-9])?$/i;

const usernameField = () =>
  z
    .string()
    .trim()
    .min(3, { message: t('validation.username_min') })
    .max(30, { message: t('validation.username_max') })
    .regex(USERNAME_PATTERN, { message: t('validation.username_format') });

export const loginSchema = () =>
  z.object({
    username: usernameField(),
    password: z.string().min(1, { message: t('validation.password_required') }),
    remember: z.boolean().optional(),
  });

export type LoginFormData = z.infer<ReturnType<typeof loginSchema>>;

export const registerSchema = () =>
  z
    .object({
      username: usernameField(),
      password: z.string().min(6, { message: t('validation.password_min') }),
      confirmPassword: z.string().min(1, { message: t('validation.confirm_required') }),
      agreeTerms: z.boolean().refine((val) => val === true, {
        message: t('validation.terms_required'),
      }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('validation.password_mismatch'),
      path: ['confirmPassword'],
    });

export type RegisterFormData = z.infer<ReturnType<typeof registerSchema>>;

/**
 * Email trong trang Hồ sơ là tuỳ chọn: chuỗi rỗng hợp lệ và có nghĩa là "chưa
 * khai". Chỉ khi người dùng nhập gì đó thì mới bắt đúng định dạng.
 */
export const contactEmailSchema = () =>
  z
    .string()
    .trim()
    .refine((v) => v === '' || z.string().email().safeParse(v).success, {
      message: t('validation.email_format'),
    });

export const forgotPasswordSchema = () =>
  z.object({
    email: z
      .string()
      .min(1, { message: t('validation.forgot_email_required') })
      .email({ message: t('validation.email_format') }),
  });

export type ForgotPasswordFormData = z.infer<ReturnType<typeof forgotPasswordSchema>>;
