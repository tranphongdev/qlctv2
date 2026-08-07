import type { Category } from '~/types';
import { t } from '~/i18n';

/**
 * Danh mục hệ thống dành cho các bút toán chuyển tiền.
 *
 * Chúng KHÔNG nằm trong bảng categories của người dùng: không sửa, không xoá và
 * không hiện ở màn Danh mục, vì chúng là hệ quả của một thao tác chuyển tiền chứ
 * không phải một khoản thu/chi người dùng tự phân loại. Đổi lại, mọi chỗ tra tên
 * danh mục phải đi qua resolveCategory() bên dưới — tra thẳng vào categoriesMap sẽ
 * trượt và giao diện hiện ra đúng chuỗi id thô.
 */
export const TRANSFER_CATEGORY_ID = 'cat_chuyen_khoan';
export const SAVINGS_CATEGORY_ID = 'cat_tiet_kiem';

/** Phần của Category mà giao diện cần để vẽ một dòng giao dịch. */
export type CategoryFace = Pick<Category, 'name' | 'icon' | 'color'>;

/**
 * Hàm chứ không phải hằng số: tên lấy từ t(), mà t() đọc ngôn ngữ tại thời điểm
 * gọi. Để dạng hằng số thì tên bị đóng băng theo ngôn ngữ lúc import.
 */
const VIRTUAL_CATEGORIES: Record<string, () => CategoryFace> = {
  [TRANSFER_CATEGORY_ID]: () => ({ name: t('category.transfer'), icon: 'ArrowRightLeft', color: '#6366F1' }),
  [SAVINGS_CATEGORY_ID]: () => ({ name: t('category.savings'), icon: 'PiggyBank', color: '#7C3AED' }),
};

/**
 * Danh mục của người dùng > danh mục hệ thống > id thô.
 *
 * Nhánh cuối giữ nguyên id thay vì hiện "Không rõ": bút toán mồ côi (danh mục đã bị
 * xoá) cần lộ ra id để còn lần được về nguồn gốc.
 */
export function resolveCategory(catId: string, categoriesMap: Record<string, Category>): CategoryFace {
  const own = categoriesMap[catId];
  if (own) return own;

  const virtual = VIRTUAL_CATEGORIES[catId];
  return virtual ? virtual() : { name: catId, icon: 'CircleDollarSign', color: '#2563EB' };
}
