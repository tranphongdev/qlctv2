import React from 'react';
import { DynamicIcon } from './DynamicIcon';

/**
 * Bộ chọn biểu tượng cho danh mục.
 *
 * Cố tình là một danh sách chọn lọc chứ không phải toàn bộ lucide-react: thư
 * viện có hàng nghìn icon, đưa hết ra thì người dùng phải cuộn mãi để tìm cái
 * hợp với "Ăn uống". Danh sách dưới đây phủ các nhóm chi tiêu và thu nhập
 * thường gặp, mở đầu bằng đúng bộ icon mà danh mục mặc định đang dùng.
 *
 * Thêm icon mới: chỉ cần bổ sung tên đúng như lucide-react đặt (PascalCase).
 * DynamicIcon tự rơi về CircleDollarSign nếu tên sai, nên gõ nhầm không làm vỡ
 * giao diện — chỉ là ô đó hiện sai hình.
 */
const CATEGORY_ICONS: string[] = [
  // Chi tiêu thiết yếu
  'Utensils', 'Coffee', 'ShoppingBag', 'ShoppingCart', 'Home', 'Zap', 'Wifi',
  'Droplets', 'Flame', 'Phone',
  // Đi lại
  'Car', 'Bike', 'Bus', 'Plane', 'Fuel', 'ParkingCircle',
  // Đời sống
  'Gamepad2', 'Film', 'Music', 'Dumbbell', 'Shirt', 'Scissors', 'PawPrint',
  'Gift', 'Baby', 'Sparkles',
  // Sức khoẻ & học hành
  'HeartPulse', 'Pill', 'Stethoscope', 'GraduationCap', 'BookOpen',
  // Thu nhập & tài chính
  'WalletCards', 'Coins', 'Banknote', 'PiggyBank', 'TrendingUp', 'Landmark',
  'Laptop', 'Briefcase', 'Receipt', 'CreditCard', 'HandCoins', 'BadgePercent',
];

interface IconPickerProps {
  /** antd Form truyền vào qua Form.Item — component này là controlled. */
  value?: string;
  onChange?: (icon: string) => void;
  /** Màu đang chọn của danh mục, để xem trước icon đúng với màu thật. */
  color?: string;
}

export const IconPicker: React.FC<IconPickerProps> = ({ value, onChange, color = '#2563EB' }) => (
  <div
    role="radiogroup"
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(44px, 1fr))',
      gap: 8,
      maxHeight: 208,
      overflowY: 'auto',
      padding: 10,
      borderRadius: 14,
      background: 'var(--surface-subtle)',
      border: '1px solid var(--surface-border)',
      // Cuộn tới cuối danh sách không được kéo theo cả modal phía sau.
      overscrollBehavior: 'contain',
    }}
  >
    {CATEGORY_ICONS.map((name) => {
      const selected = value === name;
      return (
        <button
          key={name}
          type="button"
          role="radio"
          aria-checked={selected}
          aria-label={name}
          onClick={() => onChange?.(name)}
          style={{
            height: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 12,
            cursor: 'pointer',
            background: selected ? `${color}22` : 'var(--surface-elevated)',
            border: `1.5px solid ${selected ? color : 'transparent'}`,
            transition: 'background-color 0.15s ease, border-color 0.15s ease',
          }}
        >
          <DynamicIcon name={name} size={19} color={selected ? color : 'var(--text-secondary)'} />
        </button>
      );
    })}
  </div>
);
