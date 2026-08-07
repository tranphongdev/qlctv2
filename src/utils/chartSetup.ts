import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js';

ChartJS.register(ArcElement, BarElement, CategoryScale, Legend, LinearScale, Tooltip);

ChartJS.defaults.font.family =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Segoe UI', Roboto, sans-serif";
ChartJS.defaults.color = '#556377';

/**
 * Tooltip dùng chung cho mọi biểu đồ.
 *
 * Chart.js vẽ lên canvas nên `backdrop-filter` và `var(--...)` đều vô nghĩa ở
 * đây — không có DOM để trình duyệt áp CSS. Cảm giác kính phải giả lập bằng
 * chính màu nền: một lớp nền tối bán trong suốt đủ dày để chữ trắng vẫn đạt
 * tương phản, cộng bo góc và khoảng đệm rộng như các lớp nổi khác.
 */
export const tooltipStyle = {
  backgroundColor: 'rgba(15, 23, 42, 0.86)',
  padding: 14,
  cornerRadius: 16,
  titleFont: { size: 13, weight: 600 as const },
  titleColor: '#F8FAFC',
  bodyFont: { size: 13 },
  bodyColor: '#E2E8F0',
  borderColor: 'rgba(255, 255, 255, 0.16)',
  borderWidth: 1,
  displayColors: true,
  usePointStyle: true,
  boxPadding: 6,
};

export function chartTheme(isDark: boolean) {
  const tick = isDark ? '#9FB0C7' : '#556377';
  return {
    tick,
    /** Legend dùng chung, đã gắn sẵn màu chữ hợp giao diện. */
    legend: { ...legendStyle, labels: { ...legendStyle.labels, color: tick } },
    /* Lưới rất mờ: trên nền kính, lưới đậm đọc thành một tấm ô ca-rô đè lên
       dữ liệu. Nó chỉ cần đủ để mắt lần được độ cao, không hơn. */
    grid: isDark ? 'rgba(148, 163, 184, 0.12)' : 'rgba(148, 163, 184, 0.16)',
    /** Khe hở giữa các múi biểu đồ tròn: phải trùng màu nền thẻ mới thành khe. */
    arcBorder: isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
    /** Vòng tròn xám lúc chưa có dữ liệu. */
    emptyArc: isDark ? 'rgba(148, 163, 184, 0.22)' : 'rgba(148, 163, 184, 0.25)',
  };
}

/** Legend style dùng chung: chấm tròn, chữ nhỏ. */
export const legendStyle = {
  labels: {
    usePointStyle: true,
    pointStyle: 'circle' as const,
    boxWidth: 8,
    boxHeight: 8,
    padding: 18,
    font: { size: 12, weight: 500 as const },
  },
};
