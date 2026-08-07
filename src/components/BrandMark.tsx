import React, { useId } from 'react';

/**
 * Nhận diện thương hiệu Financial — nguồn duy nhất cho mọi chỗ hiển thị logo.
 *
 * Hình: chữ S nghiêng 14°, nét dày, đọc được từ 16px. Chữ S đến từ ký hiệu tiền
 * tệ và từ "Savings"; độ nghiêng là tín hiệu tăng trưởng. Đường biểu đồ đi lên
 * được khắc vào NỀN kính ở mức 13% trắng thay vì vẽ thành hình riêng — mọi bản
 * thử đặt nó thành nét riêng đều làm hỏng mark: cắt ngang chữ S thì thành nét
 * gạch bỏ, đặt dưới thì thành cái đuôi thừa. Ở nền, nó hiện ra từ 128px và tự
 * biến mất ở cỡ nhỏ, đúng thứ một app icon cần.
 *
 * Ba biến thể theo đúng vai trò, đừng dùng lẫn:
 * - `primary`  : có ô kính. App icon, favicon, sidebar, màn hình chờ.
 * - `minimal`  : chỉ chữ S màu gradient. Avatar, header, chỗ đã có nền riêng.
 * - `mono`     : một màu. In ấn, watermark, icon hệ thống, chỗ cần đơn sắc.
 */

export type BrandVariant = 'primary' | 'minimal' | 'mono';

interface BrandMarkProps {
  size?: number;
  variant?: BrandVariant;
  /** Chỉ dùng cho `mono`. Mặc định theo màu chữ đang kế thừa. */
  color?: string;
  /** Chạy hiệu ứng mở app: phóng nhẹ 0.9 → 1 kèm vệt sáng lướt qua mặt kính. */
  animated?: boolean;
  /** Bỏ ô nền bo góc, để hệ điều hành tự cắt. Chỉ dùng khi xuất icon maskable. */
  bleed?: boolean;
  title?: string;
  className?: string;
  style?: React.CSSProperties;
}

/** Chữ S: hai bầu đối xứng, dựng bằng đường cong bậc ba trong khung 96×96. */
const S_PATH =
  'M62 34.5 C62 27.5 54.5 24 46 24 C37 24 31.5 28.5 31.5 35 ' +
  'C31.5 41.5 38 44.5 48 48 C58 51.5 64.5 54.5 64.5 61 ' +
  'C64.5 67.5 58 72 49 72 C40.5 72 33.5 68.5 31.5 62.5';

const STROKE = 13.5;

export const BrandMark: React.FC<BrandMarkProps> = ({
  size = 40,
  variant = 'primary',
  color = 'currentColor',
  animated = false,
  bleed = false,
  title,
  className,
  style,
}) => {
  // Nhiều logo cùng trên một trang là chuyện bình thường (sidebar + màn hình chờ).
  // Id gradient phải khác nhau, nếu không cái render sau sẽ dùng nhầm defs của
  // cái render trước và đổi màu theo nó.
  const uid = useId().replace(/:/g, '');
  const id = (name: string) => `${name}-${uid}`;

  const strokeColor =
    variant === 'mono' ? color : variant === 'minimal' ? `url(#${id('ink')})` : `url(#${id('mark')})`;

  const mark = (
    <g transform="rotate(-14 48 48)">
      <path
        d={S_PATH}
        fill="none"
        stroke={strokeColor}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );

  // Icon maskable bị hệ điều hành cắt theo hình bất kỳ, nên nền phải tràn viền
  // và nội dung phải nằm gọn trong 80% ở giữa.
  const radius = bleed ? 0 : 22;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      className={[animated ? 'brand-intro' : '', className].filter(Boolean).join(' ')}
      style={style}
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}

      <defs>
        {variant === 'primary' && (
          <>
            <linearGradient id={id('bg')} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#3B82F6" />
              <stop offset="0.42" stopColor="#2563EB" />
              <stop offset="1" stopColor="#7C3AED" />
            </linearGradient>
            {/* Quầng cyan góc dưới-trái: màu accent, tạo chiều sâu cho khối kính. */}
            <radialGradient id={id('glow')} cx="0.16" cy="0.9" r="0.78">
              <stop offset="0" stopColor="#06B6D4" stopOpacity="0.6" />
              <stop offset="1" stopColor="#06B6D4" stopOpacity="0" />
            </radialGradient>
            <radialGradient id={id('sheen')} cx="0.26" cy="0.04" r="0.8">
              <stop offset="0" stopColor="#ffffff" stopOpacity="0.42" />
              <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
            {/* Dải sáng chéo đi lên — tín hiệu tăng trưởng của icon.
                Bản đầu tôi vẽ nó thành một đường biểu đồ nét mảnh, nhưng chữ S
                chiếm gần hết ô nên đường đó luôn cắt ngang thân chữ và đọc
                thành nét gạch bỏ: nghĩa tệ nhất có thể cho một app tài chính.
                Dải khuếch tán giữ được hướng đi lên mà mắt đọc thành ánh sáng
                phản chiếu trên mặt kính. */}
            <linearGradient id={id('band')} x1="0" y1="1" x2="1" y2="0">
              <stop offset="0.24" stopColor="#ffffff" stopOpacity="0" />
              <stop offset="0.46" stopColor="#ffffff" stopOpacity="0.16" />
              <stop offset="0.68" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
            {/* Cạnh kính: sáng ở trên, tắt dần, hơi sáng lại ở đáy. */}
            <linearGradient id={id('edge')} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffffff" stopOpacity="0.75" />
              <stop offset="0.45" stopColor="#ffffff" stopOpacity="0.06" />
              <stop offset="1" stopColor="#ffffff" stopOpacity="0.22" />
            </linearGradient>
            <linearGradient id={id('mark')} x1="0.1" y1="0" x2="0.6" y2="1">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="1" stopColor="#DCE7FF" />
            </linearGradient>
            <linearGradient id={id('sweep')} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
              <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.55" />
              <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
            <clipPath id={id('clip')}>
              <rect width="96" height="96" rx={radius} />
            </clipPath>
          </>
        )}
        {variant === 'minimal' && (
          <linearGradient id={id('ink')} x1="0.1" y1="0" x2="0.6" y2="1">
            <stop offset="0" stopColor="#2563EB" />
            <stop offset="1" stopColor="#7C3AED" />
          </linearGradient>
        )}
      </defs>

      {variant === 'primary' ? (
        <>
          <rect width="96" height="96" rx={radius} fill={`url(#${id('bg')})`} />
          <rect width="96" height="96" rx={radius} fill={`url(#${id('glow')})`} />
          <rect width="96" height="96" rx={radius} fill={`url(#${id('band')})`} />
          <rect width="96" height="96" rx={radius} fill={`url(#${id('sheen')})`} />
          {mark}
          {animated && (
            <g clipPath={`url(#${id('clip')})`}>
              <rect
                className="brand-sweep"
                x="-70"
                y="-30"
                width="46"
                height="156"
                fill={`url(#${id('sweep')})`}
                transform="rotate(18 48 48)"
              />
            </g>
          )}
          {/* Viền vẽ sau cùng để nó nằm trên mọi lớp, giống cạnh vát của miếng kính. */}
          {!bleed && (
            <rect
              x="0.75"
              y="0.75"
              width="94.5"
              height="94.5"
              rx="21.4"
              fill="none"
              stroke={`url(#${id('edge')})`}
              strokeWidth="1.5"
            />
          )}
        </>
      ) : (
        mark
      )}
    </svg>
  );
};
