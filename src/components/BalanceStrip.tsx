import React from 'react';
import { useReducedMotion } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight, Plus, Wallet } from 'lucide-react';
import { CounterAnimation } from './CounterAnimation';
import { formatMoney } from '~/utils/format';
import { t } from '~/i18n';

interface BalanceStripProps {
  total: number;
  /** null khi chưa đủ dữ liệu để so với tháng trước. */
  changePct: number | null;
  onOpenWallets: () => void;
  onAdd: () => void;
}

/**
 * Trần hiển thị của phần trăm biến động.
 *
 * Số dư đầu tháng là mẫu số, mà nó được suy ra bằng `số dư hiện tại - dòng tiền
 * ròng`. Người mới dùng app nạp gần như toàn bộ số dư trong tháng đầu tiên thì
 * mẫu số còn lại vài chục nghìn, và tỉ lệ nhảy lên "+23071,5%" — đúng về mặt
 * số học, vô nghĩa về mặt thông tin, và đủ dài để đẩy vỡ dải số dư.
 */
const PCT_DISPLAY_CAP = 999;

/**
 * Hai họ sóng của hoạ tiết nền, vẽ trong hệ toạ độ 320×100 của SVG.
 *
 * Hai đường lệch pha nhau nên chỗ chúng cắt nhau tạo ra những khoảng hở hình
 * thoi — thứ làm hoạ tiết trông như dải lụa chồng lớp chứ không như mấy đường
 * kẻ song song. Chúng chạy quá mép (-20 → 340) để hai đầu bị cắt cụt thay vì
 * lộ ra điểm bắt đầu và kết thúc.
 */
const WAVE_A = 'M -20 58 C 22 26 58 24 96 48 C 134 72 168 86 206 68 C 242 51 272 20 340 26';
const WAVE_B = 'M -20 30 C 26 66 68 76 108 48 C 148 20 188 8 228 32 C 262 52 292 76 340 68';

/** [dịch theo trục y, độ đậm] của từng bản sao. */
const WAVE_A_LINES: Array<[number, number]> = [
  [-21, 0.1],
  [-11, 0.18],
  [0, 0.3],
  [11, 0.22],
  [22, 0.14],
  [33, 0.08],
];

const WAVE_B_LINES: Array<[number, number]> = [
  [-9, 0.1],
  [0, 0.16],
  [10, 0.09],
];

/**
 * Dải số dư — tầng trên cùng của trang Tổng quan.
 *
 * "Tôi còn bao nhiêu tiền" là câu hỏi nhận diện của một app tài chính, nhưng
 * trước đây nó là một trong bốn thẻ tháng nằm DƯỚI cả mục "Chi tiêu hôm nay":
 * trên điện thoại phải cuộn gần hết mục đó mới thấy. Đưa lên đầu trang và ép
 * xuống một dòng để nó vẫn là thứ đọc trước tiên mà không tranh chỗ với mục
 * hôm nay ngay bên dưới.
 *
 * Đây cũng là chỗ đặt nút "Thêm giao dịch" cho máy tính, vì FAB trong thanh
 * điều hướng dưới đáy là `mobile-only` — bỏ khối "Giao dịch gần đây" mà không
 * chuyển nút đi thì desktop mất luôn lối thêm giao dịch từ trang này.
 */
export const BalanceStrip: React.FC<BalanceStripProps> = ({
  total,
  changePct,
  onOpenWallets,
  onAdd,
}) => {
  const reduceMotion = useReducedMotion();

  return (
    <div className="balance-strip">
      {/* Hoạ tiết nền. Vẽ bằng SVG chứ không bằng gradient CSS: gradient chỉ tạo
          được vệt sáng loang, còn thứ cần ở đây là những đường cong có hình
          dạng riêng. `preserveAspectRatio="none"` cho hoạ tiết kéo giãn theo bề
          ngang của dải, và `vectorEffect="non-scaling-stroke"` giữ nét không
          dày mỏng theo mức kéo giãn đó. CSS bịt bớt nửa trái để sóng không chạy
          qua dưới chữ. */}
      <svg
        className="balance-strip__waves"
        viewBox="0 0 320 100"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id="bs-wave-band" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="45%" stopColor="#ffffff" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.02" />
          </linearGradient>
          <radialGradient id="bs-wave-glow">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Quầng sáng mềm nằm dưới chỗ các đường cắt nhau — nó là thứ giữ cho
            hoạ tiết có một tâm điểm thay vì dàn đều cả mảng. */}
        <ellipse cx="152" cy="72" rx="76" ry="44" fill="url(#bs-wave-glow)" />

        {/* Mảng sáng đổ xuống dưới đường sóng chính, tạo cảm giác khối. */}
        <path d={`${WAVE_A} L 340 120 L -20 120 Z`} fill="url(#bs-wave-band)" />

        {/* vectorEffect đặt trên từng path chứ không trên <g>: nó là thuộc tính
            không kế thừa, để ở nhóm cha thì các path con không nhận. */}
        <g fill="none" stroke="#ffffff" strokeWidth="1.1" strokeLinecap="round">
          {WAVE_A_LINES.map(([dy, opacity]) => (
            <path
              key={`a${dy}`}
              d={WAVE_A}
              transform={`translate(0 ${dy})`}
              opacity={opacity}
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {WAVE_B_LINES.map(([dy, opacity]) => (
            <path
              key={`b${dy}`}
              d={WAVE_B}
              transform={`translate(0 ${dy})`}
              opacity={opacity}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>
      </svg>

      <button type="button" className="balance-strip__main" onClick={onOpenWallets}>
        <span className="balance-strip__icon" aria-hidden="true">
          <Wallet size={20} />
        </span>

        <span className="balance-strip__text">
          <span className="balance-strip__label">{t('dash.total_balance')}</span>
          {/* title: dải cắt đuôi con số bằng dấu ba chấm thay vì ngắt dòng giữa
              chừng, nên bản đầy đủ phải còn đường để đọc lại. */}
          <span className="balance-strip__value" title={formatMoney(total)}>
            {/* CounterAnimation không tự biết về prefers-reduced-motion. */}
            {reduceMotion ? formatMoney(total) : <CounterAnimation value={total} />}
          </span>

          {/* Chip nằm trong cột chữ, DƯỚI con số, chứ không cùng hàng với nó: nó
              chú thích cho con số nên phải đọc liền sau con số, và đứng cạnh thì
              trên điện thoại hai bên chia đôi chiều ngang làm vỡ cả nhãn lẫn số. */}
          {changePct === null ? (
            <span className="balance-strip__chip">{t('dash.not_enough_data')}</span>
          ) : (
            // title giữ lại con số chính xác cho ai thực sự muốn biết, còn dải chỉ
            // hiện bản đã chặn trần.
            <span className="balance-strip__chip" title={`${changePct >= 0 ? '+' : ''}${changePct.toFixed(1)}%`}>
              {changePct >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              <strong>
                {Math.abs(changePct) > PCT_DISPLAY_CAP
                  ? `> ${PCT_DISPLAY_CAP}%`
                  : `${changePct >= 0 ? '+' : ''}${changePct.toFixed(1)}%`}
              </strong>
              <span className="balance-strip__chip-tail">{t('dash.vs_last_month')}</span>
            </span>
          )}
        </span>
      </button>

      {/* Nút thường chứ không phải antd Button: nút chính của antd mang sẵn nền
          xanh của hệ màu, đặt lên dải gradient xanh–tím thì gần như tàng hình,
          và ghi đè lại toàn bộ nền/chữ/hover của nó tốn nhiều CSS hơn là tự
          dựng. Cùng lối với .today-more và .today-tile trong mục hôm nay.

          desktop-only: trên điện thoại đã có FAB ở thanh điều hướng, thêm nút
          nữa ở đây là hai lối vào cho cùng một việc trên cùng một màn hình. */}
      <button type="button" className="balance-strip__add desktop-only" onClick={onAdd}>
        <Plus size={16} />
        {t('dash.add_new')}
      </button>
    </div>
  );
};
