import { theme as antdTheme } from 'antd';
import type { ThemeConfig } from 'antd';

export function getAppTheme(isDark: boolean): ThemeConfig {
  return {
    algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: '#4F46E5',
      colorSuccess: '#22C55E',
      colorWarning: '#F59E0B',
      colorError: '#EF4444',
      borderRadius: 4,
      fontFamily: "'Inter', 'Manrope', -apple-system, sans-serif",
    },
  };
}
