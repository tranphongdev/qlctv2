import { theme as antdTheme } from 'antd';
import type { ThemeConfig } from 'antd';

/**
 * Token của Ant Design cho ngôn ngữ Liquid Glass.
 *
 * Phân vai với index.css: ở ĐÂY là những gì antd tự tính toán ra được (màu dẫn
 * xuất, bo góc, thang chữ, bóng đổ của lớp nổi). Còn vật liệu kính — nền bán
 * trong suốt, backdrop-filter, viền sáng — nằm trong index.css, vì token của
 * antd không diễn tả được chúng.
 *
 * Đặt được token nào ở đây thì đừng viết CSS override cho nó: token chảy vào
 * mọi component cùng lúc, còn override chỉ vá đúng chỗ mình nhớ ra.
 */

/** Nền của lớp nổi (Select, DatePicker, Dropdown) khi antd cần một màu đặc. */
const CONTAINER_LIGHT = 'rgba(255, 255, 255, 0.72)';
const CONTAINER_DARK = 'rgba(30, 41, 59, 0.72)';

export function getAppTheme(isDark: boolean): ThemeConfig {
  return {
    algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: '#2563EB',
      colorInfo: '#2563EB',
      colorSuccess: '#22C55E',
      colorWarning: '#F59E0B',
      colorError: '#EF4444',

      /* Bo góc gốc cho điều khiển. Vật chứa (thẻ, modal) bo 24-28px, khai báo
         riêng bên dưới — để chung một giá trị thì hoặc nút thành viên thuốc,
         hoặc thẻ mất hết độ mềm. */
      borderRadius: 14,
      borderRadiusLG: 20,
      borderRadiusSM: 10,

      /* SF Pro là font hệ thống trên máy Apple; -apple-system trỏ đúng vào nó.
         Máy khác rơi về Inter. */
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Manrope', sans-serif",
      fontSize: 14,

      /* Dòng thưa hơn mặc định: chữ trên nền kính cần khoảng thở để tách khỏi
         hoạ tiết phía sau. */
      lineHeight: 1.6,

      /* Bóng nhiều lớp, đồng bộ với --glass-shadow trong index.css. */
      boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px -8px rgba(15, 23, 42, 0.10)',
      boxShadowSecondary:
        '0 1px 2px rgba(15, 23, 42, 0.05), 0 12px 32px -8px rgba(15, 23, 42, 0.14), 0 32px 64px -24px rgba(15, 23, 42, 0.18)',

      colorBgElevated: isDark ? CONTAINER_DARK : CONTAINER_LIGHT,
      /* Đường kẻ phải rất nhạt: viền đặc cắt ngang bề mặt kính trông như vết xước. */
      colorBorder: isDark ? 'rgba(148, 163, 184, 0.18)' : 'rgba(148, 163, 184, 0.22)',
      colorBorderSecondary: isDark ? 'rgba(148, 163, 184, 0.12)' : 'rgba(148, 163, 184, 0.14)',

      controlHeight: 40,
      /* Không dùng wave ripple mặc định của antd: nó vẽ một vòng viền đặc lan
         ra, chỏi hẳn với vật liệu kính. Phản hồi khi nhấn do `scale(0.97)`
         trong index.css đảm nhiệm. */
      motionDurationMid: '0.2s',
      motionEaseInOut: 'cubic-bezier(0.22, 1, 0.36, 1)',
      wireframe: false,
    },

    components: {
      /* Layout trong suốt để nền nhiều lớp của body lộ ra sau lớp kính. */
      Layout: {
        bodyBg: 'transparent',
        headerBg: 'transparent',
        siderBg: 'transparent',
        footerBg: 'transparent',
      },
      Card: { borderRadiusLG: 24 },
      Modal: { borderRadiusLG: 28 },
      Drawer: { borderRadiusLG: 24 },
      Button: { borderRadius: 14, fontWeight: 600, primaryShadow: 'none' },
      Table: {
        headerBg: 'transparent',
        rowHoverBg: 'transparent',
        borderColor: 'transparent',
      },
      Tooltip: { borderRadius: 12 },
      Segmented: { borderRadius: 16 },
      Tabs: { horizontalItemPadding: '12px 4px' },
    },
  };
}
