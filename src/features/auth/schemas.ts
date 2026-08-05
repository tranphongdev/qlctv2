import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Vui lòng nhập địa chỉ Email' })
    .email({ message: 'Email không hợp lệ (Ví dụ: user@example.com)' }),
  password: z
    .string()
    .min(1, { message: 'Vui lòng nhập mật khẩu' }),
  remember: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, { message: 'Họ và tên phải chứa ít nhất 2 ký tự' }),
    email: z
      .string()
      .min(1, { message: 'Vui lòng nhập địa chỉ Email' })
      .email({ message: 'Email không hợp lệ (Ví dụ: user@example.com)' }),
    password: z
      .string()
      .min(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' }),
    confirmPassword: z
      .string()
      .min(1, { message: 'Vui lòng nhập lại mật khẩu' }),
    currency: z.enum(['VND', 'USD', 'EUR'], {
      message: 'Vui lòng chọn loại tiền tệ mặc định',
    }),
    agreeTerms: z.boolean().refine((val) => val === true, {
      message: 'Bạn phải đồng ý với Điều khoản sử dụng & Chính sách bảo mật',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu nhập lại không trùng khớp',
    path: ['confirmPassword'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Vui lòng nhập địa chỉ Email nhận link khôi phục' })
    .email({ message: 'Email không đúng định dạng' }),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
