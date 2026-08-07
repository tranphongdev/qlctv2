import { useEffect } from 'react';
import { runNotificationRules } from '~/store/appStore';
import type { AppState } from '~/types';

/**
 * Chạy bộ luật sinh thông báo mỗi khi có lý do để kết quả thay đổi.
 *
 * Không cần cron trên máy chủ: mọi luật hiện có đều là hàm của dữ liệu người dùng
 * và của ngày hôm nay, nên chỉ hai thứ đó đổi thì kết quả mới đổi.
 *
 *  - Bốn mảng trong deps là toàn bộ đầu vào của evaluateNotifications. Chúng chỉ
 *    đổi tham chiếu khi một mutator trong appStore thay thế chúng; riêng việc nạp
 *    thông báo mới chỉ động vào `notifications` nên không tự kích hoạt lại vòng
 *    này. Nhờ vậy không có vòng lặp vô tận.
 *  - visibilitychange bắt trường hợp còn lại: app mở suốt đêm, qua ngày mới thì
 *    "còn 3 ngày tới hạn" thành "còn 2 ngày" mà chẳng có dữ liệu nào đổi cả.
 *
 * `enabled` để tắt lúc chưa đăng nhập hoặc đang kéo dữ liệu về — chạy trên một
 * trạng thái mới nạp một nửa sẽ sinh thông báo từ số liệu không đầy đủ.
 */
export function useNotificationRules(state: AppState, enabled: boolean) {
  const { transactions, budgets, goals, debts } = state;

  useEffect(() => {
    if (!enabled) return;
    runNotificationRules();
  }, [enabled, transactions, budgets, goals, debts]);

  useEffect(() => {
    if (!enabled) return;
    const onVisible = () => {
      if (document.visibilityState === 'visible') runNotificationRules();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [enabled]);
}
