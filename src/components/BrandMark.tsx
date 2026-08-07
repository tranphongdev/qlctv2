import React, { useId } from 'react';

/**
 * Nhận diện thương hiệu Financial — nguồn duy nhất cho mọi chỗ hiển thị logo.
 *
 * Hình: chữ S dựng bằng hình học, nét đều, nghiêng ngược 14°, trong ô bo góc
 * gradient xanh navy → xanh dương. Chữ S đến từ "Savings"; ba chi tiết dưới đây
 * là thứ tách nó khỏi một chữ S lấy từ font, và cũng là chỗ đặt nghĩa "dòng
 * tiền đi lên" mà không cần vẽ thêm mũi tên, biểu đồ hay đồng xu nào:
 *
 * 1. Đối xứng quay 180° tuyệt đối quanh tâm (48,48) — mọi điểm trên nửa dưới là
 *    ảnh của một điểm nửa trên qua tâm. Đây là thứ cho mark cảm giác được dựng
 *    chứ không được viết ra.
 * 2. Giữa hai bầu là một ĐOẠN THẲNG chứ không phải chỗ uốn liên tục như chữ S
 *    của font. Đoạn này nghiêng xuống 12° trong hệ toạ độ gốc; cả mark xoay
 *    ngược 14° nên nó thành đi LÊN 2° — dòng chảy đi lên, đủ nhẹ để không ai
 *    gọi tên được nhưng đủ để mắt đọc ra hướng.
 * 3. Hai bầu là cung phần tư ellipse chính xác (rx 17, ry 14.5, tâm (48,35.5)
 *    và (48,60.5)), điểm cực trên nằm đúng đỉnh và điểm cực trái nằm đúng cạnh
 *    trái — không có chỗ nào "gần đúng". Hai đầu nét cắt tại cùng một góc 42°
 *    trên bầu, nên chúng đối nhau qua tâm chứ không phải mỗi đầu một kiểu.
 *
 * Bản trước khắc một dải sáng chéo vào nền để làm tín hiệu tăng trưởng, vì chữ
 * S khi đó không tự mang hướng nào. Giờ hướng nằm trong chính nét chữ nên dải
 * đó bỏ đi được, và nền quay về đúng một gradient sạch.
 *
 * Ba biến thể theo đúng vai trò, đừng dùng lẫn:
 * - `primary`  : có ô nền bo góc. App icon, favicon, sidebar, màn hình chờ.
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

/**
 * Trục của chữ S trong khung 96×96 — xem phần dựng hình ở đầu file.
 *
 * Đọc theo thứ tự vẽ: đầu nét trên (59.37,24.72) → đỉnh (48,21) → cực trái
 * (31,35.5) → vào đoạn thẳng ở (39.2,46.13) → ra đoạn thẳng ở (56.8,49.87) →
 * cực phải (65,60.5) → đáy (48,75) → đầu nét dưới (36.63,71.28).
 *
 * Mọi cặp toạ độ đối ứng cộng lại đúng bằng 96: đó là bài kiểm tra để biết
 * đối xứng quay còn nguyên sau khi sửa. Chỉnh một điểm thì phải chỉnh cả điểm
 * đối của nó, nếu không mark sẽ lệch theo kiểu rất khó thấy mà rất khó ưa.
 */
const S_PATH =
  'M59.37 24.72 C56.25 22.32 52.2 21 48 21 ' +
  'C38.61 21 31 27.49 31 35.5 ' +
  'C31 42.1 32.75 44.76 39.2 46.13 ' +
  'L56.8 49.87 ' +
  'C63.25 51.24 65 53.9 65 60.5 ' +
  'C65 68.51 57.39 75 48 75 ' +
  'C43.8 75 39.75 73.68 36.63 71.28';

/**
 * Mảnh hơn bản cũ (13.5), trên bầu chữ rộng hơn. Hai thay đổi đó cộng lại làm
 * bụng chữ mở hẳn ra — đây là thứ quyết định chữ S còn đọc được hay bết thành
 * một cục ở 16px, và cũng là thứ tách "premium" khỏi "mập".
 *
 * 12 là sàn: 12/96 × 16px = đúng 2px ở favicon. Mảnh hơn nữa thì ở 16px nét
 * rơi xuống dưới một pixel rưỡi và chữ bắt đầu nhoè.
 */
const STROKE = 12;

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

  // Xoay ngược 14° quanh chính tâm đối xứng của chữ, nên mark vẫn nằm giữa ô
  // sau khi xoay. Con số này không tuỳ tiện: đoạn thẳng ở giữa chữ nghiêng
  // xuống 12°, xoay 14° là mức tối thiểu để nó đổi dấu thành đi lên.
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
            {/* Navy đậm ở góc trên-trái đi xuống xanh dương tươi ở góc dưới-phải.
                Hai lý do cho chiều đó: phần nét dày nhất của chữ S nằm ở nửa
                trên nên nó tựa lên vùng tối nhất — trắng trên #0A2A6E là 12:1,
                thừa sức đọc ở 16px; và vùng sáng dồn về đáy làm ô icon trông
                như đang được nâng lên, cùng hướng với đoạn thẳng giữa chữ. */}
            <linearGradient id={id('bg')} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#0A2A6E" />
              <stop offset="0.55" stopColor="#1B54D6" />
              <stop offset="1" stopColor="#3B82F6" />
            </linearGradient>
            {/* Một quầng sáng duy nhất, rất nhạt, ở góc trên-trái. Nó chỉ để mặt
                phẳng gradient không bị chết ở cỡ lớn; bản trước có tới ba lớp
                phủ (cyan, dải chéo, sheen 42%) và ở 512px chúng đánh nhau. */}
            <radialGradient id={id('sheen')} cx="0.22" cy="0.06" r="0.85">
              <stop offset="0" stopColor="#ffffff" stopOpacity="0.14" />
              <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
            {/* Viền tóc: sáng ở trên, tắt dần, hơi sáng lại ở đáy. Không phải đổ
                bóng — nó nằm trong khung icon nên không nở ra ngoài, và ở 16px
                nó chỉ còn là một chút sắc nét ở mép. */}
            <linearGradient id={id('edge')} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
              <stop offset="0.45" stopColor="#ffffff" stopOpacity="0.06" />
              <stop offset="1" stopColor="#ffffff" stopOpacity="0.18" />
            </linearGradient>
            {/* Trắng ngả xanh rất nhẹ ở cuối nét: chỉ thấy được từ cỡ 128px trở
                lên, ở đó nó giữ cho chữ S không phẳng như dán decal. */}
            <linearGradient id={id('mark')} x1="0.1" y1="0" x2="0.6" y2="1">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="1" stopColor="#E8F0FF" />
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
          // Cùng hai đầu màu với ô nền của bản primary, chỉ đảo chiều: navy nằm
          // dưới để chữ S đứng trên nền sáng vẫn có chân.
          <linearGradient id={id('ink')} x1="0.1" y1="0" x2="0.6" y2="1">
            <stop offset="0" stopColor="#2E7BF6" />
            <stop offset="1" stopColor="#0E3AA0" />
          </linearGradient>
        )}
      </defs>

      {variant === 'primary' ? (
        <>
          <rect width="96" height="96" rx={radius} fill={`url(#${id('bg')})`} />
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
              strokeWidth="1.25"
            />
          )}
        </>
      ) : (
        mark
      )}
    </svg>
  );
};
