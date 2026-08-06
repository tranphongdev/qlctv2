import React from 'react';
import { t } from '../i18n';

interface ErrorScreenProps {
  title?: string;
  description?: string;
  /** Lỗi gốc, hiện trong khối chi tiết gấp lại để còn báo bug được. */
  error?: Error | null;
  /** Thử render lại mà không tải lại trang. Bỏ trống thì ẩn nút này. */
  onRetry?: () => void;
}

/**
 * Màn hình báo lỗi toàn trang.
 *
 * Dựng bằng HTML thuần và biến CSS, không đụng tới antd hay store: màn này được
 * hiển thị đúng vào lúc cây React vừa đổ, nên mọi phụ thuộc thêm đều là thêm một
 * đường để chính nó cũng đổ theo. Ngoại lệ duy nhất là i18n — module thuần đọc
 * hai file JSON, không giữ trạng thái ứng dụng; nếu nó hỏng thì app đã không
 * dựng được từ đầu chứ không đợi tới lúc có lỗi render.
 */
export const ErrorScreen: React.FC<ErrorScreenProps> = ({
  title = t('error.title'),
  description = t('error.description'),
  error,
  onRetry,
}) => (
  <div className="app-screen" role="alert">
    <div className="app-screen__icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </svg>
    </div>

    <h1 className="app-screen__title">{title}</h1>
    <p className="app-screen__message">{description}</p>

    <div className="app-screen__actions">
      {onRetry && (
        <button type="button" className="app-screen__button" onClick={onRetry}>
          {t('error.retry')}
        </button>
      )}
      <button
        type="button"
        className="app-screen__button app-screen__button--primary"
        onClick={() => window.location.reload()}
      >
        {t('error.reload')}
      </button>
    </div>

    {error && (
      <details className="app-screen__details">
        <summary>{t('error.details')}</summary>
        <pre>{error.stack || `${error.name}: ${error.message}`}</pre>
      </details>
    )}
  </div>
);
