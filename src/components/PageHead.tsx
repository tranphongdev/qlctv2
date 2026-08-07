import React from 'react';

interface PageHeadProps {
  title: string;
  subtitle?: string;
  /** Cụm nút bên phải. Chỉ để MỘT nút chính ở đây; việc phụ gom vào menu thả xuống. */
  actions?: React.ReactNode;
  /** Hàng lọc/tìm kiếm, nằm dưới một đường kẻ trong cùng viên kính. */
  toolbar?: React.ReactNode;
}

/**
 * Đầu trang dùng chung: một viên kính chứa tiêu đề, phụ đề, cụm nút, và tuỳ chọn
 * thêm một hàng công cụ bên dưới.
 *
 * Hàng công cụ nằm TRONG viên kính này chứ không phải một thẻ riêng bên dưới.
 * Hai viên kính xếp chồng cho cùng một vùng điều khiển đầu trang chiếm gần 170px
 * trước khi thấy được dòng dữ liệu đầu tiên, và mắt đọc thành hai chương ngang
 * hàng trong khi hàng lọc chỉ là phần phụ của tiêu đề.
 */
export const PageHead: React.FC<PageHeadProps> = ({ title, subtitle, actions, toolbar }) => (
  <div className="glass-card page-head">
    <div className="page-head__main">
      <div className="page-head__text">
        <h1 className="page-head__title">{title}</h1>
        {subtitle && <p className="page-head__sub">{subtitle}</p>}
      </div>
      {actions && <div className="page-head__actions">{actions}</div>}
    </div>

    {toolbar && <div className="page-head__toolbar">{toolbar}</div>}
  </div>
);
