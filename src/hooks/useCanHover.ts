import { useEffect, useState } from 'react';

const QUERY = '(hover: hover)';

/**
 * Cho biết thiết bị có con trỏ hover thật hay không. Dùng để tắt các tương tác
 * dựa vào hover trên màn hình cảm ứng. Theo dõi cả thay đổi sau đó vì máy lai
 * (laptop cảm ứng, tablet cắm chuột) có thể đổi loại con trỏ giữa chừng.
 */
export function useCanHover(): boolean {
  const [canHover, setCanHover] = useState(() =>
    typeof window === 'undefined' ? true : window.matchMedia(QUERY).matches,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(QUERY);
    const handleChange = (e: MediaQueryListEvent) => setCanHover(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return canHover;
}
