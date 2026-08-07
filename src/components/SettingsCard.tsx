import React from 'react';
import { ChevronRight } from 'lucide-react';

export type SettingsTone = 'blue' | 'green' | 'violet';

interface SettingsCardProps {
  icon: React.ReactNode;
  title: string;
  /** Huy hiệu trạng thái ở góc phải đầu thẻ — ví dụ "Đã kết nối". */
  badge?: React.ReactNode;
  tone?: SettingsTone;
  children: React.ReactNode;
}

/**
 * Thẻ cài đặt: một đầu thẻ có ô icon màu + tiêu đề, một đường kẻ, rồi thân.
 *
 * Là component chứ không phải ba đoạn JSX chép tay vì trang Cài đặt có bốn thẻ
 * đứng cạnh nhau và toàn bộ trật tự của trang nằm ở chỗ chúng có đầu thẻ GIỐNG
 * HỆT nhau. Chép tay thì lần sửa sau sẽ làm lệch một thẻ, và cột phải lập tức
 * đọc thành ba mẩu rời rạc thay vì một danh sách.
 */
export const SettingsCard: React.FC<SettingsCardProps> = ({
  icon,
  title,
  badge,
  tone = 'blue',
  children,
}) => (
  <section className="glass-card settings-card">
    <div className="settings-card__head">
      <span className={`settings-card__icon settings-card__icon--${tone}`} aria-hidden="true">
        {icon}
      </span>
      <h2 className="settings-card__title">{title}</h2>
      {badge}
    </div>
    <div className="settings-card__body">{children}</div>
  </section>
);

interface SettingsRowProps {
  title: string;
  desc?: string;
  /** Huy hiệu đặt trước mũi tên. */
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

/**
 * Một dòng bấm được trong thẻ cài đặt: tiêu đề, mô tả, mũi tên chỉ sang phải.
 *
 * Luôn là <button>. Trước đây mấy dòng kiểu này được dựng bằng <div onClick>,
 * nên không tab tới được và trình đọc màn hình không biết chúng bấm được —
 * mũi tên chevron là thứ duy nhất báo hiệu, mà nó thuần thị giác.
 */
export const SettingsRow: React.FC<SettingsRowProps> = ({
  title,
  desc,
  badge,
  icon,
  danger = false,
  disabled = false,
  onClick,
}) => (
  <button
    type="button"
    className={`settings-row${danger ? ' settings-row--danger' : ''}`}
    onClick={onClick}
    disabled={disabled || !onClick}
  >
    {icon && (
      <span className="settings-row__icon" aria-hidden="true">
        {icon}
      </span>
    )}

    <span className="settings-row__text">
      <span className="settings-row__title">{title}</span>
      {desc && <span className="settings-row__desc">{desc}</span>}
    </span>

    {badge}
    <ChevronRight size={18} className="settings-row__caret" aria-hidden="true" />
  </button>
);

/** Huy hiệu trạng thái nhỏ: chấm/icon + chữ, nền màu nhạt cùng tông. */
export const StatusPill: React.FC<{ tone: 'green' | 'amber' | 'muted'; icon?: React.ReactNode; children: React.ReactNode }> = ({
  tone,
  icon,
  children,
}) => (
  <span className={`status-pill status-pill--${tone}`}>
    {icon}
    {children}
  </span>
);
