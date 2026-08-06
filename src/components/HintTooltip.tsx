import React from 'react';
import { Tooltip } from 'antd';
import type { TooltipProps } from 'antd';
import { useCanHover } from '~/hooks/useCanHover';

/**
 * Tooltip chỉ gắn khi thiết bị có hover thật.
 *
 * Trên màn hình cảm ứng, cú chạm đầu tiên vào phần tử có trạng thái hover bị
 * trình duyệt dùng để giả lập mouseenter (hiện tooltip) và nuốt luôn sự kiện
 * click, nên người dùng phải chạm lần thứ hai mới kích hoạt được nút. Thiết bị
 * không hover được thì tooltip cũng chẳng bao giờ xem được, nên bỏ hẳn lớp bọc
 * là cách xử lý đúng thay vì đổi trigger.
 */
export const HintTooltip: React.FC<TooltipProps> = ({ children, ...tooltipProps }) => {
  const canHover = useCanHover();

  if (!canHover) return <>{children}</>;

  return <Tooltip {...tooltipProps}>{children}</Tooltip>;
};
