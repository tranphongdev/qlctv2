import type { Transaction } from '../types';

/**
 * Thứ tự hiển thị giao dịch: mới nhất lên đầu.
 *
 * So sánh chuỗi trực tiếp chứ không qua dayjs: `date` luôn là 'YYYY-MM-DD' và
 * `time` luôn là 'HH:mm', hai định dạng này so sánh từ điển ra đúng thứ tự thời
 * gian, lại không phải dựng hàng nghìn đối tượng Date mỗi lần sắp xếp.
 *
 * Giao dịch thiếu giờ bị đẩy xuống cuối ngày của nó: chuỗi rỗng nhỏ hơn mọi giờ
 * hợp lệ. Đó cũng là chỗ hợp lý nhất cho một bản ghi không biết xảy ra lúc nào.
 */
export function compareTxNewestFirst(a: Transaction, b: Transaction): number {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1;

  const aTime = a.time ?? '';
  const bTime = b.time ?? '';
  if (aTime !== bTime) return aTime < bTime ? 1 : -1;

  return 0;
}

/**
 * Bản sao đã sắp xếp.
 *
 * Trả mảng mới chứ không sắp tại chỗ: state trong store là bất biến, sắp tại chỗ
 * sẽ sửa luôn mảng mà React đang giữ và component không nhận ra là có thay đổi.
 */
export function sortTxNewestFirst(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort(compareTxNewestFirst);
}
