/**
 * Cầu nối giữa key tab (Sidebar, BottomNav, CommandPalette, Header đang dùng) và
 * đường dẫn URL. Giữ nguyên API `activeTab` / `onSelectTab` của các component điều
 * hướng, chỉ đổi nguồn sự thật từ useState sang URL.
 */
export const TAB_PATHS = {
  dashboard: '/',
  transactions: '/transactions',
  wallets: '/wallets',
  categories: '/categories',
  budgets: '/budgets',
  goals: '/goals',
  debts: '/debts',
  analytics: '/analytics',
  calendar: '/calendar',
  ai_insights: '/ai-insights',
  profile: '/profile',
  auth: '/auth',
} as const;

export type TabKey = keyof typeof TAB_PATHS;

const PATH_TO_TAB = Object.fromEntries(
  Object.entries(TAB_PATHS).map(([tab, path]) => [path, tab]),
) as Record<string, TabKey>;

export function pathOfTab(tab: string): string {
  return TAB_PATHS[tab as TabKey] ?? TAB_PATHS.dashboard;
}

/** Đường dẫn lạ được coi như trang Tổng quan, khớp với route fallback trong App. */
export function tabOfPath(pathname: string): TabKey {
  return PATH_TO_TAB[pathname.replace(/\/+$/, '') || '/'] ?? 'dashboard';
}
