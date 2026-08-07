import React, { useMemo, useState } from 'react';
import { Button, Empty, Progress, Select, Skeleton, Tooltip } from 'antd';
import { motion, useReducedMotion } from 'framer-motion';
import { Doughnut, Line } from 'react-chartjs-2';
import type { Chart, ChartData, ChartOptions, Plugin } from 'chart.js';
import dayjs from 'dayjs';
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock3,
  CreditCard,
  Info,
  PieChart,
  Plus,
  Receipt,
  Scale,
  Tag as TagIcon,
  TrendingUp,
} from 'lucide-react';
import { TX_TYPE, type AppState, type Category, type Transaction } from '~/types';
import { formatMoney, formatTinyNumber } from '~/utils/format';
import { resolveCategory } from '~/utils/categories';
import { tooltipStyle, chartTheme } from '~/utils/chartSetup';
import { useIsDarkTheme } from '~/hooks/useIsDarkTheme';
import { DynamicIcon } from './DynamicIcon';
import { CounterAnimation } from './CounterAnimation';
import { getActiveLang, t } from '~/i18n';

interface TodaySpendingProps {
  state: AppState;
  /** Đang kéo dữ liệu lần đầu — dựng khung xương thay vì hiện số 0. */
  loading?: boolean;
  onOpenAddModal: () => void;
  onViewAll: () => void;
  onViewReport: () => void;
  onSelectTx: (tx: Transaction) => void;
}

/**
 * Ba buổi trong ngày.
 *
 * `from`/`to` phủ kín 0h–24h chứ không bắt đầu từ 8h như bản thiết kế phác: giao
 * dịch ghi lúc 6h sáng vẫn là giao dịch, cắt mất nó thì tổng của ba nhóm không
 * còn khớp với tổng chi hiển thị ở thẻ lớn phía trên.
 */
const PARTS = [
  { id: 'morning', from: 0, to: 12, labelKey: 'today.part_morning' },
  { id: 'afternoon', from: 12, to: 18, labelKey: 'today.part_afternoon' },
  { id: 'evening', from: 18, to: 24, labelKey: 'today.part_evening' },
] as const;

/** Giao dịch không ghi giờ được coi là giữa trưa — đúng mặc định mà danh sách giao dịch đang dùng. */
const FALLBACK_TIME = '12:00';

/** Số giao dịch hiện sẵn trước khi phải bấm mở rộng. */
const TIMELINE_PREVIEW = 6;

/** Số ngày của dải cột nhỏ trong thẻ tổng. Bảy ngày = đúng một tuần lịch. */
const TREND_DAYS = 7;

/**
 * "08:40:00" -> "08:40".
 *
 * Cột `time` bên Postgres là kiểu TIME nên trả về kèm giây, trong khi form nhập
 * chỉ ghi giờ:phút. Không cắt thì dòng thời gian hiện "08:40:00" — thừa một cấp
 * chính xác mà không ai cần và làm lệch nhịp đọc của cả cột.
 */
function shortTime(tx: Transaction): string {
  return (tx.time || FALLBACK_TIME).slice(0, 5);
}

/** "thứ sáu, 7 tháng 8" -> "Thứ sáu, 7 tháng 8". dayjs trả về chữ thường ở locale vi. */
function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function hourOf(tx: Transaction): number {
  const hour = parseInt(shortTime(tx).slice(0, 2), 10);
  return Number.isFinite(hour) ? Math.min(23, Math.max(0, hour)) : 12;
}

/** Số thập phân theo ngôn ngữ đang chọn: tiếng Việt viết "12,5" chứ không phải "12.5". */
function localeNumber(value: number): string {
  return value.toLocaleString(getActiveLang() === 'vi' ? 'vi-VN' : 'en-US');
}

/**
 * Dải cột tí hon cho ô thống kê.
 *
 * Dựng bằng div chứ không phải Chart.js: mỗi ô chỉ có 3–7 giá trị và không cần
 * trục, nhãn hay tooltip — gọi thêm một canvas cho mỗi ô là trả giá khởi tạo
 * biểu đồ để đổi lấy đúng mấy hình chữ nhật.
 */
const MiniBars: React.FC<{ values: number[]; color: string; activeIndex?: number }> = ({
  values,
  color,
  activeIndex,
}) => {
  const max = Math.max(...values, 1);
  return (
    <span className="today-mini" aria-hidden="true">
      {values.map((value, index) => (
        <span
          key={index}
          className={`today-mini__bar${index === activeIndex ? ' is-active' : ''}`}
          style={{
            // Sàn 12%: cột bằng 0 mà cao 0px thì biến mất, dải còn lại đọc thành
            // "tuần này chỉ có 4 ngày" thay vì "ba ngày đó không chi gì".
            height: `${Math.max(12, (value / max) * 100)}%`,
            background: color,
            opacity: index === activeIndex ? 1 : value > 0 ? 0.42 : 0.16,
          }}
        />
      ))}
    </span>
  );
};

/**
 * Vòng tròn tỉ lệ. conic-gradient + mask thay cho canvas — cùng lý do MiniBars.
 */
const MiniRing: React.FC<{ pct: number; color: string }> = ({ pct, color }) => (
  <span
    className="today-ring"
    aria-hidden="true"
    style={
      {
        '--ring-pct': `${Math.min(100, Math.max(0, pct))}%`,
        '--ring-color': color,
      } as React.CSSProperties
    }
  />
);

/**
 * Vạch dọc nét đứt chạy theo con trỏ.
 *
 * Chart.js không có sẵn; vẽ tay trong afterDatasetsDraw để nó nằm trên vùng tô
 * nhưng dưới điểm tròn. Nhờ vạch này mắt dóng được đỉnh biểu đồ xuống đúng mốc
 * giờ, thứ mà chỉ riêng tooltip không làm được.
 */
const crosshairPlugin: Plugin<'line'> = {
  id: 'todayCrosshair',
  afterDatasetsDraw(chartInstance: Chart<'line'>) {
    const active = chartInstance.getActiveElements();
    if (!active.length) return;

    const { ctx, chartArea } = chartInstance;
    const x = active[0].element.x;
    ctx.save();
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.moveTo(x, chartArea.top);
    ctx.lineTo(x, chartArea.bottom);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(124, 58, 237, 0.5)';
    ctx.stroke();
    ctx.restore();
  },
};

export const TodaySpending: React.FC<TodaySpendingProps> = ({
  state,
  loading = false,
  onOpenAddModal,
  onViewAll,
  onViewReport,
  onSelectTx,
}) => {
  const { transactions, categories, budgets } = state;
  const isDark = useIsDarkTheme();
  const chart = chartTheme(isDark);
  const reduceMotion = useReducedMotion();
  const [expanded, setExpanded] = useState(false);
  /* Buổi nào đang bị thu gọn. Chỉ là trạng thái hiển thị của dòng thời gian —
     tổng của buổi vẫn nằm trên thanh tiêu đề khi thu gọn, nên gập lại không làm
     mất con số nào. */
  const [foldedParts, setFoldedParts] = useState<Record<string, boolean>>({});
  /* Bộ chọn của riêng biểu đồ. Chỉ đổi chuỗi số đưa vào biểu đồ, không đụng tới
     bất kỳ con số nào khác trong mục — thẻ tổng, ô thống kê và dòng thời gian
     luôn là của HÔM NAY, đúng như tên mục. */
  const [range, setRange] = useState<'today' | 'yesterday'>('today');

  const categoriesMap = useMemo(
    () => categories.reduce((acc, c) => ({ ...acc, [c.id]: c }), {} as Record<string, Category>),
    [categories],
  );

  const data = useMemo(() => {
    const todayKey = dayjs().format('YYYY-MM-DD');
    const yesterdayKey = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
    const monthKey = dayjs().format('YYYY-MM');

    const todayTxs = transactions
      .filter((tx) => tx.date === todayKey)
      .slice()
      .sort((a, b) => shortTime(a).localeCompare(shortTime(b)));

    // Chuyển khoản bị loại khỏi mọi phép cộng "đã chi": tiền chỉ đổi chỗ giữa hai
    // ví của chính người dùng, cộng vào sẽ thổi phồng con số chi tiêu.
    const expenseTxs = todayTxs.filter((tx) => tx.type === TX_TYPE.EXPENSE);
    const incomeTxs = todayTxs.filter((tx) => tx.type === TX_TYPE.INCOME);
    const totalExpense = expenseTxs.reduce((sum, tx) => sum + tx.amount, 0);
    const totalIncome = incomeTxs.reduce((sum, tx) => sum + tx.amount, 0);

    const yesterdayExpense = transactions
      .filter((tx) => tx.date === yesterdayKey && tx.type === TX_TYPE.EXPENSE)
      .reduce((sum, tx) => sum + tx.amount, 0);
    /* Không có mẫu số thì không có phần trăm. Hôm qua chi 0đ mà hôm nay chi bất kỳ
       số nào cũng ra "tăng vô hạn" — hiển thị nó là nói dối bằng toán học. */
    const deltaPct = yesterdayExpense > 0
      ? Math.round(((totalExpense - yesterdayExpense) / yesterdayExpense) * 1000) / 10
      : null;

    /* Ngân sách ngày là số SUY RA, app không có khái niệm hạn mức theo ngày: lấy
       tổng hạn mức tháng này chia đều cho số ngày của tháng. Chưa đặt ngân sách
       nào thì trả null và phần thanh tiến độ biến mất, thay vì vẽ một cái thước
       không có vạch. */
    const monthBudget = budgets
      .filter((b) => b.monthKey === monthKey)
      .reduce((sum, b) => sum + b.amount, 0);
    const dailyBudget = monthBudget > 0 ? monthBudget / dayjs().daysInMonth() : null;
    const budgetUsedPct = dailyBudget ? Math.round((totalExpense / dailyBudget) * 100) : null;

    const perCategory: Record<string, number> = {};
    for (const tx of expenseTxs) perCategory[tx.category] = (perCategory[tx.category] ?? 0) + tx.amount;
    const breakdown = Object.entries(perCategory)
      .map(([catId, amount]) => ({
        id: catId,
        ...resolveCategory(catId, categoriesMap),
        amount,
        pct: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    const hourlyOf = (dateKey: string) => {
      const buckets = Array.from({ length: 24 }, () => 0);
      for (const tx of transactions) {
        if (tx.date === dateKey && tx.type === TX_TYPE.EXPENSE) buckets[hourOf(tx)] += tx.amount;
      }
      return buckets;
    };
    const hourly = hourlyOf(todayKey);
    const hourlyYesterday = hourlyOf(yesterdayKey);

    /* Dải bảy ngày trong thẻ tổng. Một con số đứng một mình không nói được hôm nay
       là ngày tiêu nhiều hay ít — cần cái nền tuần để so. Duyệt một lượt vào map
       thay vì filter bảy lần trên toàn bộ giao dịch. */
    const trendKeys = Array.from({ length: TREND_DAYS }, (_, i) =>
      dayjs().subtract(TREND_DAYS - 1 - i, 'day'),
    );
    const perDay: Record<string, number> = {};
    for (const tx of transactions) {
      if (tx.type === TX_TYPE.EXPENSE) perDay[tx.date] = (perDay[tx.date] ?? 0) + tx.amount;
    }
    const trend = trendKeys.map((day) => {
      const key = day.format('YYYY-MM-DD');
      return {
        key,
        label: capitalise(day.format('dd')),
        amount: perDay[key] ?? 0,
        isToday: key === todayKey,
      };
    });
    const trendAvg = trend.reduce((sum, day) => sum + day.amount, 0) / TREND_DAYS;

    const largestTx = expenseTxs.reduce<Transaction | null>(
      (max, tx) => (max === null || tx.amount > max.amount ? tx : max),
      null,
    );

    const parts = PARTS.map((part) => {
      const items = todayTxs.filter((tx) => {
        const hour = hourOf(tx);
        return hour >= part.from && hour < part.to;
      });
      return {
        ...part,
        items,
        spent: items.filter((tx) => tx.type === TX_TYPE.EXPENSE).reduce((sum, tx) => sum + tx.amount, 0),
      };
    });

    return {
      todayKey,
      todayTxs,
      expenseCount: expenseTxs.length,
      incomeCount: incomeTxs.length,
      totalExpense,
      totalIncome,
      deltaPct,
      dailyBudget,
      budgetUsedPct,
      avgPerTx: expenseTxs.length > 0 ? totalExpense / expenseTxs.length : 0,
      largestTx,
      breakdown,
      hourly,
      hourlyYesterday,
      yesterdayExpense,
      trend,
      trendAvg,
      // Tổng theo buổi giữ cả buổi rỗng — ô thống kê cần đủ ba cột để so, còn
      // dòng thời gian tự lọc bỏ buổi không có giao dịch khi dựng.
      partTotals: parts.map((part) => part.spent),
      parts: parts.filter((part) => part.items.length > 0),
    };
  }, [transactions, budgets, categoriesMap]);

  /* ------------------------------ Biểu đồ giờ ------------------------------ */

  const series = range === 'yesterday' ? data.hourlyYesterday : data.hourly;
  /* Giờ chi nhiều nhất. Chart.js không có khái niệm "điểm nổi bật", nên phải tự
     tìm chỉ số rồi trả bán kính khác cho riêng nó trong pointRadius. */
  const peakHour = series.reduce((best, value, index) => (value > series[best] ? index : best), 0);
  const hasPeak = series[peakHour] > 0;

  const lineData: ChartData<'line'> = {
    labels: Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, '0')}h`),
    datasets: [
      {
        data: series,
        borderColor: '#7C3AED',
        borderWidth: 2.5,
        // Hàm chứ không phải chuỗi màu: gradient cần context canvas, mà context chỉ
        // tồn tại sau khi Chart.js dựng xong vùng vẽ.
        backgroundColor: (ctx) => {
          const { chartArea, ctx: canvas } = ctx.chart;
          if (!chartArea) return 'rgba(124, 58, 237, 0.18)';
          const gradient = canvas.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(124, 58, 237, 0.34)');
          gradient.addColorStop(0.55, 'rgba(99, 102, 241, 0.14)');
          gradient.addColorStop(1, 'rgba(37, 99, 235, 0.01)');
          return gradient;
        },
        fill: true,
        tension: 0.45,
        // Chỉ hiện đúng một chấm: giờ chi nhiều nhất. Hiện hết 24 chấm thì đường
        // biểu đồ thành chuỗi hạt và mất luôn cảm giác mượt.
        pointRadius: (ctx) => (hasPeak && ctx.dataIndex === peakHour ? 5 : 0),
        pointBackgroundColor: '#ffffff',
        pointBorderColor: '#7C3AED',
        pointBorderWidth: 3,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#ffffff',
        pointHoverBorderColor: '#7C3AED',
        pointHoverBorderWidth: 3,
      },
    ],
  };

  const lineOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    // Vùng vẽ đã tự chừa chỗ cho nhãn trục; thêm 6px trên để chấm đỉnh không bị
    // cắt mất một nửa khi giờ cao nhất chạm trần biểu đồ.
    layout: { padding: { top: 6 } },
    plugins: {
      legend: { display: false },
      tooltip: {
        ...tooltipStyle,
        displayColors: false,
        callbacks: {
          title: (items) => t('today.chart_tooltip_title', { hour: items[0]?.label ?? '' }),
          // parsed.y có thể là null với điểm khuyết; giờ nào không chi thì là 0đ.
          label: (item) => formatMoney(item.parsed.y ?? 0),
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          color: chart.tick,
          font: { size: 10 },
          maxRotation: 0,
          autoSkip: false,
          // Chỉ nhãn mỗi 4 tiếng: 24 nhãn trên màn điện thoại đè lên nhau thành vệt xám.
          callback: (_value, index) => (index % 4 === 0 ? `${String(index).padStart(2, '0')}h` : ''),
        },
      },
      y: {
        grid: { color: chart.grid },
        border: { display: false },
        ticks: {
          color: chart.tick,
          font: { size: 10 },
          maxTicksLimit: 4,
          callback: (value) => formatTinyNumber(Number(value)),
        },
      },
    },
  };

  /* ----------------------------- Biểu đồ tròn ----------------------------- */

  const donutData: ChartData<'doughnut'> = {
    labels: data.breakdown.map((item) => item.name),
    datasets: [
      {
        data: data.breakdown.map((item) => item.amount),
        backgroundColor: data.breakdown.map((item) => item.color),
        borderColor: chart.arcBorder,
        borderWidth: 3,
        hoverOffset: 6,
      },
    ],
  };

  const donutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '74%',
    plugins: {
      legend: { display: false },
      tooltip: {
        ...tooltipStyle,
        callbacks: { label: (ctx) => ` ${ctx.label}: ${formatMoney(Number(ctx.parsed))}` },
      },
    },
  };

  /* -------------------------------- Giao diện ------------------------------ */

  const fade = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 } }
    : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 } };

  const header = (
    <div className="today-head">
      <span className="today-head__badge" aria-hidden="true">
        <CalendarDays size={19} />
      </span>

      <div className="today-head__text">
        <div className="today-head__title">{t('today.title')}</div>
        <div className="today-head__date">
          {capitalise(dayjs(data.todayKey).format(t('today.date_format')))}
        </div>
      </div>

      {/* Nhãn chữ biến mất ở màn hẹp (xem .today-viewall__text), nên tên đầy đủ
          phải nằm ở aria-label — không thì nút còn trơ một mũi tên vô danh. */}
      <Button className="today-viewall" aria-label={t('today.view_all')} onClick={onViewAll}>
        <span className="today-viewall__text">{t('today.view_all')}</span>
        <ChevronRight size={15} />
      </Button>
    </div>
  );

  if (loading) {
    return (
      <section className="today-section">
        {header}
        <div className="today-hero">
          <Skeleton active title={{ width: '55%' }} paragraph={{ rows: 3 }} />
        </div>
        <div className="today-panel today-panel--chart">
          <Skeleton active title={false} paragraph={{ rows: 4 }} />
        </div>
        <div className="today-tiles">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="today-tile">
              <Skeleton active title={false} paragraph={{ rows: 2, width: ['70%', '45%'] }} />
            </div>
          ))}
        </div>
        <div className="today-panel today-panel--timeline">
          <Skeleton active title={false} paragraph={{ rows: 4 }} />
        </div>
      </section>
    );
  }

  if (data.todayTxs.length === 0) {
    return (
      <section className="today-section">
        {header}
        {/* Không vẽ biểu đồ rỗng: một đường thẳng bằng 0 trông như lỗi tải dữ liệu. */}
        <div className="today-hero today-hero--empty">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-heading)' }}>
                  {t('today.empty_title')}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                  {t('today.empty_body')}
                </div>
              </>
            }
          />
          <Button type="primary" icon={<Plus size={16} />} onClick={onOpenAddModal}>
            {t('today.empty_action')}
          </Button>
        </div>
      </section>
    );
  }

  const budgetStatus =
    data.budgetUsedPct === null ? null
      : data.budgetUsedPct > 100 ? 'over'
      : data.budgetUsedPct >= 80 ? 'warn'
      : data.budgetUsedPct >= 50 ? 'mid'
      : 'good';

  const BUDGET_COLOR: Record<string, string> = {
    good: 'var(--color-income)',
    mid: 'var(--primary-color)',
    warn: 'var(--warning-color)',
    over: 'var(--color-expense)',
  };

  const budgetLeft = data.dailyBudget !== null ? data.dailyBudget - data.totalExpense : 0;
  const trendMax = Math.max(...data.trend.map((day) => day.amount), 1);

  const topCategory = data.breakdown[0];
  const largestShare = data.totalExpense > 0 && data.largestTx
    ? (data.largestTx.amount / data.totalExpense) * 100
    : 0;

  /* Bốn ô thống kê. `viz` là hình phụ bên phải con số — cột nhỏ hoặc vòng tròn,
     luôn biểu diễn một TỈ LỆ, để bốn ô đọc như một bộ chứ không phải bốn thứ rời. */
  const tiles = [
    {
      key: 'count',
      icon: <Receipt size={16} />,
      tint: 'rgba(37, 99, 235, 0.14)',
      color: 'var(--primary-color)',
      label: t('today.stat_count'),
      value: String(data.todayTxs.length),
      sub: [
        t('today.count_expense', { count: data.expenseCount }),
        data.incomeCount > 0 ? t('today.count_income', { count: data.incomeCount }) : '',
      ]
        .filter(Boolean)
        .join(' · '),
      viz: <MiniBars values={data.partTotals} color="var(--primary-color)" />,
      onClick: onViewAll,
    },
    {
      key: 'avg',
      icon: <Scale size={16} />,
      tint: 'rgba(124, 58, 237, 0.14)',
      color: 'var(--secondary-color)',
      label: t('today.stat_avg'),
      value: formatTinyNumber(data.avgPerTx),
      sub: t('today.stat_avg_sub', { count: data.expenseCount }),
      viz: (
        <MiniBars
          values={data.trend.map((day) => day.amount)}
          color="var(--secondary-color)"
          activeIndex={TREND_DAYS - 1}
        />
      ),
    },
    {
      key: 'max',
      icon: <TrendingUp size={16} />,
      tint: 'rgba(34, 197, 94, 0.14)',
      color: 'var(--color-income)',
      label: t('today.stat_max'),
      value: formatTinyNumber(data.largestTx?.amount ?? 0),
      // Tên khoản chi lớn nhất trả lời luôn câu hỏi tiếp theo ("tiêu vào cái gì"),
      // đỡ một lần bấm vào dòng thời gian để tra.
      sub: data.largestTx
        ? data.largestTx.note || resolveCategory(data.largestTx.category, categoriesMap).name
        : t('today.stat_share', { pct: 0 }),
      viz: <MiniRing pct={largestShare} color="var(--color-income)" />,
    },
    {
      key: 'top',
      icon: topCategory
        ? <DynamicIcon name={topCategory.icon} size={16} color={topCategory.color} />
        : <TagIcon size={16} />,
      tint: topCategory ? `${topCategory.color}22` : 'var(--surface-subtle)',
      color: topCategory?.color ?? 'var(--text-muted)',
      label: t('today.stat_top'),
      value: topCategory?.name ?? '—',
      valueIsText: true,
      sub: topCategory
        ? `${formatTinyNumber(topCategory.amount)} · ${t('today.stat_share', {
            pct: localeNumber(Math.round(topCategory.pct)),
          })}`
        : '—',
      viz: topCategory ? <MiniRing pct={topCategory.pct} color={topCategory.color} /> : null,
      onClick: topCategory ? onViewReport : undefined,
    },
  ];

  /* Danh sách phẳng để cắt bớt: nếu cắt theo từng buổi thì ngày nào cũng hiện đủ
     ba tiêu đề buổi kèm một hai dòng, không tiết kiệm được chỗ nào. */
  const visibleIds = new Set(
    expanded ? data.todayTxs.map((tx) => tx.id) : data.todayTxs.slice(0, TIMELINE_PREVIEW).map((tx) => tx.id),
  );
  const hiddenCount = data.todayTxs.length - visibleIds.size;

  return (
    <motion.section
      className="today-section"
      initial={fade.initial}
      animate={fade.animate}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
    >
      {header}

      {/* ---- Thẻ lớn: tổng chi + so với hôm qua + dải tuần + ngân sách ---- */}
      <div className="today-hero">
        <div className="today-hero__top">
          <div className="today-hero__main">
            <div className="today-hero__label">
              {t('today.total_label')}
              <Tooltip title={t('today.total_hint')}>
                <Info size={13} className="today-hero__info" />
              </Tooltip>
            </div>

            {/* CounterAnimation không tự biết về prefers-reduced-motion, nên chỗ
                gọi phải tự tránh: tắt hiệu ứng thì in thẳng con số. */}
            <div className="today-hero__amount">
              {reduceMotion
                ? `-${formatMoney(data.totalExpense)}`
                : <CounterAnimation value={data.totalExpense} prefix="-" duration={620} />}
            </div>

            <div className="today-chips">
              {data.deltaPct === null ? (
                <span className="today-chip today-chip--muted">{t('today.no_yesterday')}</span>
              ) : (
                <Tooltip title={t('today.yesterday_was', { amount: formatMoney(data.yesterdayExpense) })}>
                  <span className={`today-chip ${data.deltaPct > 0 ? 'today-chip--up' : 'today-chip--down'}`}>
                    {data.deltaPct > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    <strong>{localeNumber(Math.abs(data.deltaPct))}%</strong>
                    <span className="today-chip__tail">{t('today.vs_yesterday')}</span>
                  </span>
                </Tooltip>
              )}

              {data.totalIncome > 0 && (
                <span className="today-chip today-chip--income">
                  <ArrowDownRight size={14} />
                  <strong>+{formatTinyNumber(data.totalIncome)}</strong>
                  <span className="today-chip__tail">{t('today.also_income')}</span>
                </span>
              )}
            </div>
          </div>

          {/* Huy hiệu trang trí — aria-hidden vì nó không mang thông tin nào mà
              dòng chữ bên cạnh chưa nói. */}
          <span className="today-hero__badge" aria-hidden="true">
            <CreditCard size={24} />
          </span>
        </div>

        {/* Dải bảy ngày: cho con số lớn phía trên một cái nền để so. */}
        <div className="today-trend">
          <div className="today-trend__head">
            <span className="today-trend__title">{t('today.trend_title')}</span>
            <span className="today-trend__avg">
              {t('today.trend_avg', { amount: formatTinyNumber(data.trendAvg) })}
            </span>
          </div>

          <div className="today-trend__bars">
            {data.trend.map((day) => (
              <Tooltip
                key={day.key}
                title={`${capitalise(dayjs(day.key).format('dddd, DD/MM'))} · ${formatMoney(day.amount)}`}
              >
                <div className={`today-trend__col${day.isToday ? ' is-today' : ''}`}>
                  <div className="today-trend__track">
                    <div
                      className="today-trend__fill"
                      style={{ height: `${Math.max(6, (day.amount / trendMax) * 100)}%` }}
                    />
                  </div>
                  <span className="today-trend__label">{day.label}</span>
                </div>
              </Tooltip>
            ))}
          </div>
        </div>

        {data.dailyBudget !== null && budgetStatus && (
          <div className="today-budget">
            <div className="today-budget__row">
              <Tooltip title={t('today.budget_hint')}>
                <span className="today-budget__label">{t('today.budget_label')}</span>
              </Tooltip>
              <span className="today-budget__value">
                {formatTinyNumber(data.totalExpense)} <span>/ {formatTinyNumber(data.dailyBudget)}</span>
              </span>
            </div>

            <Progress
              percent={Math.min(100, data.budgetUsedPct ?? 0)}
              showInfo={false}
              strokeColor={BUDGET_COLOR[budgetStatus]}
              railColor="var(--surface-border)"
              size={['100%', 6]}
              className="today-budget__bar"
            />

            <div className="today-budget__row">
              <span style={{ fontSize: 12, color: BUDGET_COLOR[budgetStatus], fontWeight: 700 }}>
                {budgetLeft >= 0
                  ? t('today.budget_left', { amount: formatMoney(budgetLeft) })
                  : t('today.budget_over_by', { amount: formatMoney(-budgetLeft) })}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {t('today.budget_used', { pct: data.budgetUsedPct ?? 0 })}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ---- Biểu đồ theo giờ ---- */}
      {data.totalExpense > 0 && (
        <div className="today-panel today-panel--chart">
          <div className="today-panel__head">
            <span className="today-panel__title">
              <span className="today-panel__icon today-panel__icon--chart" aria-hidden="true">
                <Clock3 size={15} />
              </span>
              {t('today.chart_title')}
              <Tooltip title={t('today.chart_hint')}>
                <Info size={14} className="today-panel__info" />
              </Tooltip>
            </span>

            <Select
              value={range}
              onChange={setRange}
              size="small"
              variant="borderless"
              className="today-range"
              popupMatchSelectWidth={false}
              suffixIcon={<ChevronDown size={14} />}
              options={[
                { value: 'today', label: t('today.range_today') },
                { value: 'yesterday', label: t('today.range_yesterday') },
              ]}
            />
          </div>

          <div className="today-chart">
            <Line data={lineData} options={lineOptions} plugins={[crosshairPlugin]} />
          </div>

          {hasPeak && (
            <div className="today-peak">
              <span className="today-peak__dot" aria-hidden="true" />
              <span className="today-peak__text">
                {t('today.chart_peak')} · {String(peakHour).padStart(2, '0')}:00
              </span>
              <strong>{formatMoney(series[peakHour])}</strong>
            </div>
          )}
        </div>
      )}

      {/* ---- Bốn ô thống kê nhanh ---- */}
      <div className="today-tiles">
        {tiles.map((tile) => {
          const Tag = tile.onClick ? 'button' : 'div';
          return (
            <Tag
              key={tile.key}
              type={tile.onClick ? 'button' : undefined}
              className={`today-tile${tile.onClick ? ' today-tile--action' : ''}`}
              onClick={tile.onClick}
            >
              <span className="today-tile__head">
                <span className="today-tile__icon" style={{ background: tile.tint, color: tile.color }}>
                  {tile.icon}
                </span>
                <span className="today-tile__label">{tile.label}</span>
                {tile.onClick && <ChevronRight size={14} className="today-tile__go" />}
              </span>

              <span className={`today-tile__value${tile.valueIsText ? ' today-tile__value--text' : ''}`}>
                {tile.value}
              </span>

              <span className="today-tile__foot">
                <span className="today-tile__sub">{tile.sub}</span>
                {tile.viz}
              </span>
            </Tag>
          );
        })}
      </div>

      {/* ---- Dòng thời gian ---- */}
      <div className="today-panel today-panel--timeline">
        <div className="today-panel__head">
          <span className="today-panel__title">
            <span className="today-panel__icon today-panel__icon--time" aria-hidden="true">
              <Receipt size={15} />
            </span>
            {t('today.timeline_title')}
          </span>
          <span className="today-panel__meta">
            {t('today.part_count', { count: data.todayTxs.length })}
          </span>
        </div>

        <div className="today-parts">
          {data.parts.map((part) => {
            const shown = part.items.filter((tx) => visibleIds.has(tx.id));
            if (shown.length === 0) return null;
            const folded = foldedParts[part.id] === true;

            return (
              <div key={part.id} className="today-part">
                <button
                  type="button"
                  className="today-part__head"
                  aria-expanded={!folded}
                  onClick={() => setFoldedParts((prev) => ({ ...prev, [part.id]: !folded }))}
                >
                  <span className="today-part__dot" aria-hidden="true" />
                  <span className="today-part__name">{t(part.labelKey)}</span>
                  <span className="today-part__count">{shown.length}</span>
                  <span className="today-part__sum">
                    {part.spent > 0 ? `-${formatMoney(part.spent)}` : formatMoney(0)}
                  </span>
                  <ChevronUp size={15} className={`today-part__chevron${folded ? ' is-folded' : ''}`} />
                </button>

                {!folded && (
                  <div className="today-rail">
                    {shown.map((tx, index) => {
                      const cat = resolveCategory(tx.category, categoriesMap);
                      const isIncome = tx.type === TX_TYPE.INCOME;
                      const isTransfer = tx.type === TX_TYPE.TRANSFER;
                      return (
                        <motion.div
                          key={tx.id}
                          className="today-row"
                          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.26,
                            // Trần 6 nhịp: ngày nhiều giao dịch mà xếp tầng đủ thì mục cuối
                            // đợi vài giây mới hiện, đọc thành lỗi tải chứ không thành hiệu ứng.
                            delay: Math.min(index, 6) * 0.04,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                        >
                          <span className="today-row__time">{shortTime(tx)}</span>
                          <span className="today-row__dot" aria-hidden="true" />

                          <button type="button" className="today-item" onClick={() => onSelectTx(tx)}>
                            <span className="today-item__icon" style={{ background: `${cat.color}20` }}>
                              <DynamicIcon name={cat.icon} size={18} color={cat.color} />
                            </span>

                            <span className="today-item__body">
                              <span className="today-item__name">{tx.note || cat.name}</span>
                              <span className="today-item__meta">
                                <span className="today-item__tag" style={{ background: `${cat.color}1A`, color: cat.color }}>
                                  {cat.name}
                                </span>
                              </span>
                            </span>

                            <span
                              className="today-item__amount"
                              style={{
                                color: isTransfer
                                  ? 'var(--text-secondary)'
                                  : isIncome
                                    ? 'var(--color-income)'
                                    : 'var(--color-expense)',
                              }}
                            >
                              {isTransfer ? '' : isIncome ? '+' : '-'}
                              {formatMoney(tx.amount)}
                            </span>

                            <ChevronRight size={15} className="today-item__go" />
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {(hiddenCount > 0 || expanded) && (
          <button type="button" className="today-more" onClick={() => setExpanded((prev) => !prev)}>
            {expanded ? (
              <>{t('today.collapse')} <ChevronUp size={15} /></>
            ) : (
              <>{t('today.expand_all', { count: hiddenCount })} <ChevronDown size={15} /></>
            )}
          </button>
        )}
      </div>

      {/* ---- Phân bổ theo danh mục ---- */}
      {data.breakdown.length > 0 && (
        <div className="today-panel today-panel--breakdown">
          <div className="today-panel__head">
            <span className="today-panel__title">
              <span className="today-panel__icon today-panel__icon--pie" aria-hidden="true">
                <PieChart size={15} />
              </span>
              {t('today.breakdown_title')}
            </span>
            <span className="today-panel__meta">
              {t('today.part_count', { count: data.breakdown.length })}
            </span>
          </div>

          {/* Vòng tròn và chú giải nằm cạnh nhau khi khung đủ rộng, tự xuống dòng
              khi hẹp — flex-wrap thay cho một cặp media query bám vào bề rộng màn
              hình, vì khung này lúc rộng 8 cột lúc 4 cột. */}
          <div className="today-breakdown">
            <div className="today-donut">
              <Doughnut data={donutData} options={donutOptions} />
              {/* Chữ giữa vòng tròn nằm ngoài canvas: Chart.js không có API cho nhãn
                  trung tâm, mà vẽ tay lên canvas thì không ăn theo token màu của app. */}
              <div className="today-donut__center">
                <div className="today-donut__total">{formatTinyNumber(data.totalExpense)}</div>
                <div className="today-donut__caption">{t('today.breakdown_total')}</div>
              </div>
            </div>

            <div className="today-legend">
              {data.breakdown.map((item) => (
                <div key={item.id} className="today-legend__row">
                  <span className="today-legend__icon" style={{ background: `${item.color}22` }}>
                    <DynamicIcon name={item.icon} size={13} color={item.color} />
                  </span>

                  <span className="today-legend__body">
                    <span className="today-legend__top">
                      <span className="today-legend__name">{item.name}</span>
                      <span className="today-legend__amount">{formatMoney(item.amount)}</span>
                    </span>

                    {/* Thanh tỉ lệ đọc nhanh hơn con số phần trăm khi so nhiều dòng
                        với nhau; con số vẫn giữ ở cuối cho ai cần chính xác. */}
                    <span className="today-legend__meter">
                      <span
                        className="today-legend__meter-fill"
                        style={{ width: `${Math.max(2, item.pct)}%`, background: item.color }}
                      />
                    </span>
                  </span>

                  <span className="today-legend__pct">
                    {localeNumber(Math.round(item.pct * 10) / 10)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button type="button" className="today-more" onClick={onViewReport}>
            <BarChart3 size={15} /> {t('today.breakdown_report')} <ChevronRight size={15} />
          </button>
        </div>
      )}
    </motion.section>
  );
};
