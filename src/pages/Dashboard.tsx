import React from 'react';
import { Button, Progress, Space } from 'antd';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Calendar as CalendarIcon,
} from 'lucide-react';
import dayjs from 'dayjs';
import { Bar, Doughnut } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import { tooltipStyle, chartTheme } from '../utils/chartSetup';
import { useIsDarkTheme } from '../hooks/useIsDarkTheme';
import type { AppState } from '../types';
import { CounterAnimation } from '../components/CounterAnimation';
import { formatMoney, formatCompactNumber, formatDate } from '../utils/format';
import { DynamicIcon } from '../components/DynamicIcon';

/** Số tháng hiển thị trên chart xu hướng. Ít cột -> cột dày và dễ đọc hơn. */
const TREND_MONTHS = 6;

/** "2026-08-05" -> "Thứ tư". Trả về chuỗi rỗng nếu giao dịch không có ngày. */
function weekdayOf(date?: string): string {
  if (!date) return '';
  const label = dayjs(date).format('dddd');
  return label.charAt(0).toUpperCase() + label.slice(1);
}

interface DashboardProps {
  state: AppState;
  onOpenAddModal: () => void;
  onSelectTab: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ state, onOpenAddModal, onSelectTab }) => {
  const { transactions, wallets, categories, goals } = state;
  const chart = chartTheme(useIsDarkTheme());

  const totalBalance = wallets.reduce((acc, w) => acc + w.balance, 0);

  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const currentMonthTxs = transactions.filter((t) => t.date && t.date.startsWith(currentMonthStr));
  const activeTxs = currentMonthTxs.length > 0 ? currentMonthTxs : transactions;

  const monthlyIncome = activeTxs
    .filter((t) => t.type === 'thu')
    .reduce((acc, t) => acc + t.amount, 0);
  const monthlyExpense = activeTxs
    .filter((t) => t.type === 'chi')
    .reduce((acc, t) => acc + t.amount, 0);
  const monthlySavings = Math.max(0, monthlyIncome - monthlyExpense);
  const savingsRate = monthlyIncome > 0 ? Math.round((monthlySavings / monthlyIncome) * 100) : 0;

  // Số dư đầu tháng = số dư hiện tại trừ đi dòng tiền ròng phát sinh trong tháng,
  // tức là số dư chốt của tháng trước. Chỉ so sánh khi thực sự có giao dịch trong
  // tháng và số dư gốc dương, còn lại để null và không hiển thị con số nào.
  const netCashFlow = monthlyIncome - monthlyExpense;
  const openingBalance = totalBalance - netCashFlow;
  const balanceChangePct =
    currentMonthTxs.length > 0 && openingBalance > 0 ? (netCashFlow / openingBalance) * 100 : null;

  const incomeSourceCount = new Set(
    activeTxs.filter((t) => t.type === 'thu').map((t) => t.category),
  ).size;
  const expenseCategoryCount = new Set(
    activeTxs.filter((t) => t.type === 'chi').map((t) => t.category),
  ).size;

  // Gom theo tháng, khoá YYYY-MM để không gộp nhầm cùng tháng khác năm.
  const monthMap: Record<string, { thu: number; chi: number }> = {};
  transactions.forEach((t) => {
    if (!t.date) return;
    const key = t.date.slice(0, 7);
    if (!monthMap[key]) monthMap[key] = { thu: 0, chi: 0 };
    if (t.type === 'thu') monthMap[key].thu += t.amount;
    if (t.type === 'chi') monthMap[key].chi += t.amount;
  });

  // Trục hoành là TREND_MONTHS tháng liên tục kết thúc ở tháng hiện tại, kể cả tháng
  // không có giao dịch. Nếu chỉ vẽ tháng có dữ liệu, chart 1-2 cột sẽ bị Chart.js dàn
  // mỗi cột ra giữa một ô rộng bằng nửa biểu đồ và cột trôi lệch khỏi nhãn tháng.
  const monthlyTrend = Array.from({ length: TREND_MONTHS }, (_, i) => {
    const key = dayjs().subtract(TREND_MONTHS - 1 - i, 'month').format('YYYY-MM');
    return {
      month: 'T' + parseInt(key.slice(5, 7), 10),
      thu: monthMap[key]?.thu ?? 0,
      chi: monthMap[key]?.chi ?? 0,
    };
  });

  const categoriesMap = categories.reduce((acc, c) => ({ ...acc, [c.id]: c }), {} as Record<string, any>);
  const categoryExpenses: Record<string, number> = {};
  currentMonthTxs.forEach((t) => {
    if (t.type === 'chi') {
      categoryExpenses[t.category] = (categoryExpenses[t.category] || 0) + t.amount;
    }
  });

  const pieData = Object.entries(categoryExpenses).map(([catId, amount]) => ({
    name: categoriesMap[catId]?.name || catId,
    value: amount,
    color: categoriesMap[catId]?.color || '#4F46E5',
  }));

  const trendData: ChartData<'bar'> = {
    labels: monthlyTrend.map((m) => m.month),
    datasets: [
      // grouped: false -> hai dataset không xếp cạnh nhau mà cùng lấy vạch tháng làm
      // tâm, nên cột luôn căn giữa nhãn kể cả khi series kia bằng 0. Đổi lại phải
      // tách bằng bề rộng: cột Thu nhập rộng nằm dưới, cột Chi tiêu hẹp vẽ đè lên.
      {
        label: 'Thu nhập',
        data: monthlyTrend.map((m) => m.thu),
        backgroundColor: '#22C55E',
        borderRadius: 6,
        borderSkipped: false,
        grouped: false,
        categoryPercentage: 0.55,
        barPercentage: 1,
        maxBarThickness: 44,
      },
      {
        label: 'Chi tiêu',
        data: monthlyTrend.map((m) => m.chi),
        backgroundColor: '#EF4444',
        borderRadius: 6,
        borderSkipped: false,
        grouped: false,
        categoryPercentage: 0.55,
        barPercentage: 0.5,
        maxBarThickness: 22,
      },
    ],
  };

  const trendOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    // intersect: true -> tooltip chỉ hiện khi con trỏ nằm đúng trên thân cột.
    interaction: { mode: 'index', intersect: true },
    plugins: {
      legend: { position: 'bottom', ...chart.legend },
      tooltip: {
        ...tooltipStyle,
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${formatMoney(Number(ctx.parsed.y))}`,
        },
      },
    },
    scales: {
      x: {
        border: { display: false },
        grid: { display: false },
        ticks: {
          font: { size: 12 },
          color: chart.tick,
          autoSkip: true,
          maxRotation: 0,
          maxTicksLimit: 10,
        },
      },
      y: {
        border: { display: false },
        grid: { color: chart.grid },
        ticks: {
          font: { size: 12 },
          color: chart.tick,
          callback: (value) => formatCompactNumber(Number(value)),
        },
      },
    },
  };

  const hasPieData = pieData.length > 0;
  const donutData: ChartData<'doughnut'> = {
    labels: hasPieData ? pieData.map((d) => d.name) : ['Không có chi tiêu'],
    datasets: [
      {
        data: hasPieData ? pieData.map((d) => d.value) : [1],
        backgroundColor: hasPieData ? pieData.map((d) => d.color) : [chart.emptyArc],
        borderColor: chart.arcBorder,
        borderWidth: 3,
        hoverOffset: 6,
      },
    ],
  };

  const donutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: { display: false },
      tooltip: {
        ...tooltipStyle,
        enabled: hasPieData,
        callbacks: {
          label: (ctx) => ` ${ctx.label}: ${formatMoney(Number(ctx.parsed))}`,
        },
      },
    },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* 4 Big Overview Stat Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 20,
        }}
      >
        {/* Card 1: Total Balance */}
        <div className="gradient-card-primary" style={{ padding: 24, cursor: 'pointer' }} onClick={() => onSelectTab('wallets')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.9 }}>
            <span style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Tổng số dư tài sản
            </span>
            <Wallet size={22} />
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, margin: '14px 0 6px', letterSpacing: '-0.5px' }}>
            <CounterAnimation value={totalBalance} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, opacity: 0.95 }}>
            {balanceChangePct === null ? (
              <span>Chưa đủ dữ liệu để so sánh</span>
            ) : (
              <>
                <span style={{ padding: '2px 8px', borderRadius: 99, background: 'rgba(255,255,255,0.2)', fontWeight: 700 }}>
                  {balanceChangePct >= 0 ? '+' : ''}{balanceChangePct.toFixed(1)}%
                </span>
                <span>{balanceChangePct >= 0 ? 'Tăng' : 'Giảm'} so với tháng trước</span>
              </>
            )}
          </div>
        </div>

        {/* Card 2: Monthly Income */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Thu nhập tháng này
            </span>
            {/* Màu đặt trên thẻ bọc; lucide mặc định stroke="currentColor" nên icon
                tự ăn theo. Truyền var() vào prop color sẽ hỏng vì nó rơi vào thuộc
                tính stroke của SVG, nơi biến CSS không được phân giải. */}
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--tint-income)', color: 'var(--color-income)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, margin: '14px 0 6px', color: 'var(--color-income)', letterSpacing: '-0.5px' }}>
            +<CounterAnimation value={monthlyIncome} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
            <ArrowUpRight size={16} style={{ color: 'var(--color-income)' }} />
            <span>{incomeSourceCount > 0 ? `${incomeSourceCount} nguồn thu nhập` : 'Chưa có khoản thu nào'}</span>
          </div>
        </div>

        {/* Card 3: Monthly Expense */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Chi tiêu tháng này
            </span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--tint-expense)', color: 'var(--color-expense)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingDown size={20} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, margin: '14px 0 6px', color: 'var(--color-expense)', letterSpacing: '-0.5px' }}>
            -<CounterAnimation value={monthlyExpense} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
            <ArrowDownRight size={16} style={{ color: 'var(--color-expense)' }} />
            <span>{expenseCategoryCount > 0 ? `${expenseCategoryCount} danh mục chi tiêu` : 'Chưa có khoản chi nào'}</span>
          </div>
        </div>

        {/* Card 4: Savings */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Tiết kiệm ròng
            </span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--tint-savings)', color: 'var(--color-savings)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PiggyBank size={20} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, margin: '14px 0 6px', color: 'var(--color-savings)', letterSpacing: '-0.5px' }}>
            +<CounterAnimation value={monthlySavings} />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
              <span>Tỷ lệ tiết kiệm</span>
              <span style={{ fontWeight: 700, color: 'var(--color-savings)' }}>{savingsRate}%</span>
            </div>
            <Progress percent={savingsRate} strokeColor={{ '0%': '#4F46E5', '100%': '#7C3AED' }} showInfo={false} />
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        {/* Daily Spending & Income Trend Area Chart */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>Xu hướng Chi tiêu & Thu nhập</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Phân tích {TREND_MONTHS} tháng gần nhất</div>
            </div>
            <Button size="small" icon={<CalendarIcon size={14} />} onClick={() => onSelectTab('calendar')}>
              Xem chi tiết
            </Button>
          </div>

          <div style={{ width: '100%', height: 280 }}>
            <Bar data={trendData} options={trendOptions} />
          </div>
        </div>

        {/* Category Expense Donut Chart */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Chi tiêu theo danh mục</div>
            <Button type="link" size="small" onClick={() => onSelectTab('categories')}>
              Xem tất cả
            </Button>
          </div>

          <div style={{ width: '100%', height: 220 }}>
            <Doughnut data={donutData} options={donutOptions} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            {pieData.slice(0, 3).map((item) => (
              <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 99, background: item.color }} />
                  <span style={{ fontWeight: 500 }}>{item.name}</span>
                </div>
                <span style={{ fontWeight: 700 }}>{formatMoney(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Transactions & Savings Goals */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        {/* Recent Transactions List */}
        <div className="glass-card" style={{ padding: 24 }}>
          {/* flexWrap + nowrap ở tiêu đề: màn hẹp thì cả cụm nút xuống dòng dưới,
              thay vì bóp tiêu đề vỡ thành hai dòng cạnh nút. */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 16, fontWeight: 700, whiteSpace: 'nowrap' }}>Giao dịch gần đây</div>
            <Space>
              <Button icon={<Plus size={14} />} type="primary" onClick={onOpenAddModal}>
                Thêm mới
              </Button>
            </Space>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {transactions.slice(0, 5).map((tx) => {
              const cat = categoriesMap[tx.category];
              const isThu = tx.type === 'thu';
              return (
                <div
                  key={tx.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: 14,
                    background: 'var(--surface-subtle)',
                    border: '1px solid var(--surface-border)',
                  }}
                >
                  {/* minWidth: 0 để hai dòng chữ được phép co lại và cắt bằng ellipsis,
                      nếu không chúng sẽ đẩy cột số tiền ra khỏi thẻ trên màn hẹp. */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 12,
                        flexShrink: 0,
                        background: cat?.color ? `${cat.color}15` : '#4F46E515',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <DynamicIcon name={cat?.icon || 'CircleDollarSign'} color={cat?.color || '#4F46E5'} size={22} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {tx.note || cat?.name || 'Giao dịch'}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {formatDate(tx.date)} • {cat?.name}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap', color: isThu ? 'var(--color-income)' : 'var(--color-expense)' }}>
                      {isThu ? '+' : '-'}{formatMoney(tx.amount)}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{weekdayOf(tx.date)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Savings Goals Widget */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 8 }}>
            <div style={{ fontSize: 16, fontWeight: 700, whiteSpace: 'nowrap' }}>Mục tiêu tiết kiệm</div>
            <Button type="link" size="small" onClick={() => onSelectTab('goals')}>
              Xem thêm
            </Button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {goals.slice(0, 2).map((goal) => {
              const pct = Math.round((goal.saved / goal.target) * 100);
              return (
                <div key={goal.id} style={{ padding: 14, borderRadius: 14, background: 'var(--surface-subtle)', border: '1px solid var(--surface-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{goal.name}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-savings)' }}>{pct}%</span>
                  </div>
                  {/* Phần trăm đã hiện ở tiêu đề, tắt showInfo để khỏi lặp số. */}
                  <Progress percent={pct} showInfo={false} strokeColor={{ '0%': '#4F46E5', '100%': '#7C3AED' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4, fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                    <span>Đã tiết kiệm: {formatMoney(goal.saved)}</span>
                    <span>Mục tiêu: {formatMoney(goal.target)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
