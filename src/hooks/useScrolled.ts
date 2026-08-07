import { useEffect, useState } from 'react';

/**
 * Trang đã cuộn qua `threshold` pixel chưa.
 *
 * Dùng cho header: lúc ở đỉnh trang nó gần như trong suốt và hoà vào nền, khi
 * nội dung bắt đầu trôi qua bên dưới thì đặc lại và nổi bóng — đúng cách thanh
 * điều hướng của iOS phản ứng.
 *
 * Chỉ setState khi giá trị boolean thật sự đổi, nên toàn bộ chuỗi cuộn chỉ gây
 * ra đúng hai lần render thay vì một lần mỗi khung hình.
 */
export function useScrolled(threshold = 8): boolean {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const read = () => window.scrollY > threshold;
    setScrolled(read());

    let frame = 0;
    const onScroll = () => {
      // Sự kiện scroll bắn dày hơn nhịp vẽ của màn hình. Gộp về đúng một lần
      // đọc mỗi khung hình; đọc scrollY giữa chừng còn ép trình duyệt tính lại
      // layout ngay lúc nó đang bận cuộn.
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        setScrolled((prev) => (prev === read() ? prev : read()));
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [threshold]);

  return scrolled;
}
