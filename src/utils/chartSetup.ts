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
  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
ChartJS.defaults.color = '#64748b';

/** Tooltip style dùng chung cho mọi biểu đồ. */
export const tooltipStyle = {
  backgroundColor: 'rgba(15, 23, 42, 0.92)',
  padding: 12,
  cornerRadius: 10,
  titleFont: { size: 13, weight: 600 as const },
  bodyFont: { size: 13 },
  displayColors: true,
  boxPadding: 4,
};

/** Legend style dùng chung: chấm tròn, chữ nhỏ. */
export const legendStyle = {
  labels: {
    usePointStyle: true,
    pointStyle: 'circle' as const,
    boxWidth: 8,
    boxHeight: 8,
    padding: 16,
    font: { size: 12, weight: 500 as const },
  },
};
