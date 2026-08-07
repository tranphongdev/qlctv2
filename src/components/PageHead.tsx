import React from 'react';

interface PageHeadProps {
  title: string;
  subtitle?: string;
  /** Cụm nút bên phải — nút chính của trang, bộ lọc, ô chọn tháng. */
  actions?: React.ReactNode;
}

/**
 * Đầu trang dùng chung: một viên kính chứa tiêu đề, phụ đề và cụm nút bên phải.
 *
 * Khuôn này vốn được chép tay ở từng trang. Trang Hồ sơ là trang duy nhất tự
 * dựng kiểu khác — tiêu đề trần trên nền, không có viên kính — nên khi chuyển
 * qua lại giữa các trang, đúng một trang bị hụt mất một tầng và đọc như chưa
 * làm xong. Rút ra thành component để lần sau không phải nhớ chép cho đúng.
 */
export const PageHead: React.FC<PageHeadProps> = ({ title, subtitle, actions }) => (
  <div className="glass-card page-head">
    <div className="page-head__text">
      <h1 className="page-head__title">{title}</h1>
      {subtitle && <p className="page-head__sub">{subtitle}</p>}
    </div>
    {actions}
  </div>
);
