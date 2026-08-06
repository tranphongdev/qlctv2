import React from 'react';

/**
 * Nhãn ô nhập của trang xác thực.
 *
 * antd nhận `label` là ReactNode nên mỗi Form.Item phải tự bọc chuỗi vào một
 * thẻ có class; gom vào đây để hai form không trôi khỏi nhau về cỡ chữ và màu.
 */
export const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="auth-label">{children}</span>
);
