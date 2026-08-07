import React from 'react';
import { Button } from 'antd';
import { ChevronRight } from 'lucide-react';

interface SectionHeadProps {
  /** Icon đặt trong ô kính bên trái. Truyền thẳng phần tử để mỗi mục tự chọn cỡ. */
  icon: React.ReactNode;
  title: string;
  /** Dòng phụ dưới tiêu đề — thường là mốc thời gian của mục. */
  subtitle?: string;
  /** Bỏ trống `actionLabel` hoặc `onAction` thì không vẽ nút bên phải. */
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * Đầu mục dùng chung cho các chương lớn của trang Tổng quan.
 *
 * Lý do nó là component chứ không phải mỗi mục tự dựng: bậc thị giác của trang
 * nằm ở chỗ hai chương "Hôm nay" và "Tháng này" có đầu mục GIỐNG HỆT nhau. Khi
 * chúng chỉ giống nhau nhờ hai đoạn JSX được chép tay, lần sửa sau sẽ làm lệch
 * một bên và trang lập tức đọc thành một mục chính cộng phần thừa.
 */
export const SectionHead: React.FC<SectionHeadProps> = ({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
}) => (
  <div className="section-head">
    <span className="section-head__badge" aria-hidden="true">
      {icon}
    </span>

    <div className="section-head__text">
      <div className="section-head__title">{title}</div>
      {subtitle && <div className="section-head__sub">{subtitle}</div>}
    </div>

    {actionLabel && onAction && (
      /* Nhãn chữ biến mất ở màn hẹp (xem .section-head__action-text), nên tên đầy
         đủ phải nằm ở aria-label — không thì nút còn trơ một mũi tên vô danh. */
      <Button className="section-head__action" aria-label={actionLabel} onClick={onAction}>
        <span className="section-head__action-text">{actionLabel}</span>
        <ChevronRight size={15} />
      </Button>
    )}
  </div>
);
