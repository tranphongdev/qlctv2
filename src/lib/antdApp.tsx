import React from 'react';
import { App as AntdApp, message as staticMessage } from 'antd';
import type { MessageInstance } from 'antd/es/message/interface';

/**
 * `message` tĩnh của antd nằm ngoài cây React nên không đọc được ConfigProvider —
 * mất theme tối, mất locale, và antd cảnh báo "Static function can not consume
 * context like dynamic theme".
 *
 * Cách chính thức là dùng `App.useApp()` trong từng component, nhưng app có 59 chỗ
 * gọi message ở khắp nơi, kể cả trong callback ngoài phạm vi hook. Thay vào đó
 * <AntdStaticBridge /> lấy instance có context một lần rồi các hàm bên dưới ủy quyền
 * sang nó, nên mọi chỗ gọi giữ nguyên cú pháp `message.success(...)`.
 */
let api: MessageInstance = staticMessage;

/** Đặt bên trong <AntdApp> để lấy instance message gắn với context hiện tại. */
export const AntdStaticBridge: React.FC = () => {
  api = AntdApp.useApp().message;
  return null;
};

export const message = {
  success: (...args: Parameters<MessageInstance['success']>) => api.success(...args),
  error: (...args: Parameters<MessageInstance['error']>) => api.error(...args),
  info: (...args: Parameters<MessageInstance['info']>) => api.info(...args),
  warning: (...args: Parameters<MessageInstance['warning']>) => api.warning(...args),
  loading: (...args: Parameters<MessageInstance['loading']>) => api.loading(...args),
  open: (...args: Parameters<MessageInstance['open']>) => api.open(...args),
  destroy: (...args: Parameters<MessageInstance['destroy']>) => api.destroy(...args),
};
