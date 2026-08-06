import React, { useState } from 'react';
import { Button } from 'antd';
import { message } from '~/lib/antdApp';
import { signInWithProvider, isOAuthEnabled } from '~/lib/auth';
import { t } from '~/i18n';
import type { OAuthProvider } from '~/lib/auth';

/**
 * Logo hai nhà cung cấp vẽ thẳng bằng SVG.
 *
 * lucide-react không có logo thương hiệu, mà nạp thêm một thư viện icon chỉ vì
 * hai hình này thì không đáng. Màu giữ đúng bộ nhận diện của Google / GitHub —
 * đây là logo của bên thứ ba, không phải màu của app nên không lấy từ token.
 */
const GoogleMark: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path fill="#4285F4" d="M23.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.87c2.27-2.09 3.56-5.17 3.56-8.87z" />
    <path fill="#34A853" d="M12 24c3.24 0 5.96-1.08 7.94-2.91l-3.87-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.28v3.09A12 12 0 0 0 12 24z" />
    <path fill="#FBBC05" d="M5.27 14.28a7.2 7.2 0 0 1 0-4.56V6.63H1.28a12 12 0 0 0 0 10.74l3.99-3.09z" />
    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.28 6.63l3.99 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
  </svg>
);

const GithubMark: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#181717" aria-hidden="true" focusable="false">
    <path d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.2 1.77 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.04 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.23 2.75.12 3.04.74.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.4-5.25 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5z" />
  </svg>
);

const PROVIDERS: Array<{ id: OAuthProvider; label: string; mark: React.FC }> = [
  { id: 'google', label: 'Google', mark: GoogleMark },
  { id: 'github', label: 'GitHub', mark: GithubMark },
];

/**
 * Khối "hoặc tiếp tục với ...".
 *
 * Không render gì khi chưa bật OAuth: nút dẫn tới lỗi cấu hình còn tệ hơn là
 * không có nút, và một đường phân cách trống thì chỉ tổ rối mắt.
 */
export const SocialAuthButtons: React.FC = () => {
  const [pending, setPending] = useState<OAuthProvider | null>(null);

  if (!isOAuthEnabled) return null;

  const handleClick = async (provider: OAuthProvider) => {
    setPending(provider);
    try {
      // Thành công thì trình duyệt rời trang ngay, nên không cần tắt trạng thái
      // chờ ở nhánh này — chỉ nhánh lỗi mới quay lại giao diện cũ.
      await signInWithProvider(provider);
    } catch (err: any) {
      console.error('OAuth error:', err);
      message.error(err?.message || t('auth.social_failed'));
      setPending(null);
    }
  };

  return (
    <>
      <div className="auth-divider">{t('auth.social_divider')}</div>

      <div className="auth-social">
        {PROVIDERS.map(({ id, label, mark: Mark }) => (
          <Button
            key={id}
            size="large"
            block
            icon={<Mark />}
            loading={pending === id}
            disabled={pending !== null && pending !== id}
            onClick={() => handleClick(id)}
          >
            {t('auth.social_continue', { provider: label })}
          </Button>
        ))}
      </div>
    </>
  );
};
