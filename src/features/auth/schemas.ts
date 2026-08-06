import { z } from 'zod';
import { t } from '../../i18n';

/**
 * Các schema được dựng qua hàm chứ không phải hằng số module: thông báo lỗi lấy từ
 * t(), mà t() đọc ngôn ngữ đang hoạt động tại thời điểm gọi. Nếu để dạng hằng số,
 * chuỗi lỗi sẽ bị đóng băng theo ngôn ngữ lúc import và không bao giờ đổi khi người
 * dùng chuyển ngôn ngữ trong Cài đặt.
 */

export const loginSchema = () =>
  z.object({
    email: z
      .string()
      .min(1, { message: t('validation.email_required') })
      .email({ message: t('validation.email_invalid') }),
    password: z
      .string()
      .min(1, { message: t('validation.password_required') }),
    remember: z.boolean().optional(),
  });

export type LoginFormData = z.infer<ReturnType<typeof loginSchema>>;

export const registerSchema = () =>
  z
    .object({
      name: z
        .string()
        .min(2, { message: t('validation.name_min') }),
      email: z
        .string()
        .min(1, { message: t('validation.email_required') })
        .email({ message: t('validation.email_invalid') }),
      password: z
        .string()
        .min(6, { message: t('validation.password_min') }),
      confirmPassword: z
        .string()
        .min(1, { message: t('validation.confirm_required') }),
      currency: z.enum(['VND', 'USD', 'EUR'], {
        message: t('validation.currency_required'),
      }),
      agreeTerms: z.boolean().refine((val) => val === true, {
        message: t('validation.terms_required'),
      }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('validation.password_mismatch'),
      path: ['confirmPassword'],
    });

export type RegisterFormData = z.infer<ReturnType<typeof registerSchema>>;

export const forgotPasswordSchema = () =>
  z.object({
    email: z
      .string()
      .min(1, { message: t('validation.forgot_email_required') })
      .email({ message: t('validation.email_format') }),
  });

export type ForgotPasswordFormData = z.infer<ReturnType<typeof forgotPasswordSchema>>;
