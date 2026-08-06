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

/**
 * Tab ứng với đường dẫn, hoặc null nếu đường dẫn không thuộc ứng dụng.
 *
 * Trả null chứ không rơi về 'dashboard': đường dẫn lạ nay dẫn tới trang 404, và nếu
 * hàm này nói dối là 'dashboard' thì sidebar sẽ tô sáng mục Tổng quan trong khi màn
 * hình đang báo không tìm thấy trang.
 */
export function tabOfPath(pathname: string): TabKey | null {
  return PATH_TO_TAB[pathname.replace(/\/+$/, '') || '/'] ?? null;
}
