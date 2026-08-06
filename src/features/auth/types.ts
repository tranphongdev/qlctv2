export type AuthMode = 'login' | 'register';

/** Mức độ mạnh của mật khẩu ở dạng mã khóa; nhãn hiển thị do i18n lo. */
export type PasswordStrengthLevel = 'weak' | 'medium' | 'strong' | 'very_strong';

export interface PasswordStrengthResult {
  score: number; // 0 to 100
  level: PasswordStrengthLevel;
  color: string;
  hasLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

export interface AuthSuccessPayload {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
}
