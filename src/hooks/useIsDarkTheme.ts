import { useEffect, useState } from 'react';

/**
 * Theo dõi giao diện hiện tại qua class trên <body> (App gắn 'dark-theme' /
 * 'light-theme' ở đó).
 *
 * Dùng cho những chỗ không đọc được biến CSS — điển hình là Chart.js, vì nó vẽ
 * lên canvas nên `var(--...)` không bao giờ được phân giải.
 */
export function useIsDarkTheme(): boolean {
  const [isDark, setIsDark] = useState(
    () => typeof document !== 'undefined' && document.body.classList.contains('dark-theme'),
  );

  useEffect(() => {
    const sync = () => setIsDark(document.body.classList.contains('dark-theme'));
    sync();

    const observer = new MutationObserver(sync);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}
