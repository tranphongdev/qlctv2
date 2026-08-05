export type AuthMode = 'login' | 'register';

export interface PasswordStrengthResult {
  score: number; // 0 to 100
  label: 'Yếu' | 'Trung bình' | 'Mạnh' | 'Rất mạnh';
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
