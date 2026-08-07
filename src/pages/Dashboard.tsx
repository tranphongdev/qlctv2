import React, { useState } from 'react';
import { Button, Empty, Progress } from 'antd';
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  CalendarRange,
  Calendar as CalendarIcon,
} from 'lucide-react';
import dayjs from 'dayjs';
import { Bar } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import { tooltipStyle, chartTheme } from '~/utils/chartSetup';
import { useIsDarkTheme } from '~/hooks/useIsDarkTheme';
import { TX_TYPE, type AppState, type Category, type Transaction, type Wallet as WalletModel } from '~/types';
import { CounterAnimation } from '~/components/CounterAnimation';
import { TransactionDetailModal } from '~/components/TransactionDetailModal';
import { TodaySpending } from '~/components/TodaySpending';
import { BalanceStrip } from '~/components/BalanceStrip';
import { SectionHead } from '~/components/SectionHead';
import { useRemoteLoading } from '~/store/appStore';
import { formatMoney, formatCompactNumber } from '~/utils/format';
import { DynamicIcon } from '~/components/DynamicIcon';
import { t } from '~/i18n';

/** Số tháng hiển thị trên chart xu hướng. Ít cột -> cột dày và dễ đọc hơn. */
const TREND_MONTHS = 6;

/** Số danh mục hiện trong bảng xếp hạng trước khi gộp phần còn lại thành một dòng. */
const CATEGORY_RANK_LIMIT = 6;

/** Số mục tiêu hiện trên trang Tổng quan. Ba cái vừa đủ một hàng trên máy tính. */
const GOALS_PREVIEW = 3;

interface DashboardProps {
  state: AppState;
  /* Nhận tham số để mở sẵn ở chế độ sửa. Chú ý: mọi chỗ dùng làm handler onClick
     phải bọc lại thành `() => onOpenAddModal()`, không truyền thẳng — React sẽ
     nhét MouseEvent vào chỗ initialData và form mở ra với dữ liệu rác. */
  onOpenAddModal: (initialData?: Transaction) => void;
  onDeleteTx: (id: string) => void;
  onSelectTab: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ state, onOpenAddModal, onDeleteTx, onSelectTab }) => {
  const { transactions, wallets, categories, goals } = state;
  const chart = chartTheme(useIsDarkTheme());
  const remoteLoading = useRemoteLoading();
  const [detailTx, setDetailTx] = useState<Transaction | null>(null);

  const totalBalance = wallets.reduce((acc, w) => acc + w.balance, 0);

  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const currentMonthTxs = transactions.filter((t) => t.date && t.date.startsWith(currentMonthStr));
  const activeTxs = currentMonthTxs.length > 0 ? currentMonthTxs : transactions;

  const monthlyIncome = activeTxs
    .filter((t) => t.type === TX_TYPE.INCOME)
    .reduce((acc, t) => acc + t.amount, 0);
  const monthlyExpense = activeTxs
    .filter((t) => t.type === TX_TYPE.EXPENSE)
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
    activeTxs.filter((t) => t.type === TX_TYPE.INCOME).map((t) => t.category),
  ).size;
  const expenseCategoryCount = new Set(
    activeTxs.filter((t) => t.type === TX_TYPE.EXPENSE).map((t) => t.category),
  ).size;

  // Gom theo tháng, khoá YYYY-MM để không gộp nhầm cùng tháng khác năm.
  const monthMap: Record<string, { thu: number; chi: number }> = {};
  transactions.forEach((t) => {
    if (!t.date) return;
    const key = t.date.slice(0, 7);
    if (!monthMap[key]) monthMap[key] = { thu: 0, chi: 0 };
    if (t.type === TX_TYPE.INCOME) monthMap[key].thu += t.amount;
    if (t.type === TX_TYPE.EXPENSE) monthMap[key].chi += t.amount;
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

  const categoriesMap = categories.reduce((acc, c) => ({ ...acc, [c.id]: c }), {} as Record<string, Category>);
  const walletsMap = wallets.reduce((acc, w) => ({ ...acc, [w.id]: w }), {} as Record<string, WalletModel>);
  const categoryExpenses: Record<string, number> = {};
  currentMonthTxs.forEach((t) => {
    if (t.type === TX_TYPE.EXPENSE) {
      categoryExpenses[t.category] = (categoryExpenses[t.category] || 0) + t.amount;
    }
  });

  /* Xếp hạng danh mục thay cho biểu đồ tròn của tháng. Hai lý do: donut tháng
     trùng hình hệt donut "Phân bổ chi tiêu" trong mục hôm nay nên mắt đọc thành
     một thứ lặp lại, và một vòng tròn 8+ múi thì bản thân nó cũng không so được
     múi nào hơn múi nào. Thanh ngang xếp hạng giải quyết cả hai. */
  const rankedCategories = Object.entries(categoryExpenses)
    .map(([catId, amount]) => ({
      id: catId,
      name: categoriesMap[catId]?.name || catId,
      value: amount,
      color: categoriesMap[catId]?.color || '#2563EB',
      icon: categoriesMap[catId]?.icon || 'CircleDollarSign',
    }))
    .sort((a, b) => b.value - a.value);

  /* Mẫu số lấy từ chính danh sách này, không mượn `monthlyExpense`: khi tháng
     hiện tại chưa có giao dịch, `activeTxs` rơi về TOÀN BỘ lịch sử trong khi
     `categoryExpenses` vẫn chỉ tính tháng này — hai gốc khác nhau thì phần trăm
     cộng lại không ra 100%. */
  const rankedTotal = rankedCategories.reduce((sum, item) => sum + item.value, 0);
  const rankedTop = rankedCategories.slice(0, CATEGORY_RANK_LIMIT);
  const rankedRest = rankedCategories.slice(CATEGORY_RANK_LIMIT);
  const rankedRestAmount = rankedRest.reduce((sum, item) => sum + item.value, 0);

  const trendData: ChartData<'bar'> = {
    labels: monthlyTrend.map((m) => m.month),
    datasets: [
      /* grouped: false -> hai dataset không xếp cạnh nhau mà cùng lấy vạch tháng
         làm tâm, nên cột luôn căn giữa nhãn kể cả khi series kia bằng 0. Đổi lại
         phải tách bằng bề rộng: cột Thu nhập rộng nằm dưới, cột Chi tiêu hẹp vẽ
         đè lên.

         `order` là thứ bắt buộc phải có, không phải tuỳ chọn. Chart.js duyệt
         danh sách dataset NGƯỢC khi vẽ (`for i = metasets.length - 1; i >= 0`),
         nên dataset đứng đầu mảng lại là dataset được vẽ SAU CÙNG, tức nằm trên.
         Cứ để mặc định thì cột Thu nhập rộng 44px phủ kín cột Chi tiêu 22px và
         tháng nào thu >= chi là cột đỏ biến mất hoàn toàn. Sắp xếp theo `order`
         tăng dần rồi vẽ ngược lại => order lớn hơn được vẽ trước, nằm dưới. */
      {
        label: t('dash.income_label'),
        data: monthlyTrend.map((m) => m.thu),
        backgroundColor: '#22C55E',
        borderRadius: 6,
        borderSkipped: false,
        grouped: false,
        order: 1,
        categoryPercentage: 0.55,
        barPercentage: 1,
        maxBarThickness: 44,
      },
      {
        label: t('dash.expense_label'),
        data: monthlyTrend.map((m) => m.chi),
        backgroundColor: '#EF4444',
        borderRadius: 6,
        borderSkipped: false,
        grouped: false,
        order: 0,
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

  return (
    <div className="dash-page">
      {/* ---- Tầng 0: số dư ----
          "Còn bao nhiêu tiền" phải là thứ đọc được đầu tiên. Trước đây nó là thẻ
          1/4 nằm dưới cả mục hôm nay, tức là cách vài màn cuộn trên điện thoại. */}
      <BalanceStrip
        total={totalBalance}
        changePct={balanceChangePct}
        onOpenWallets={() => onSelectTab('wallets')}
        onAdd={() => onOpenAddModal()}
      />

      {/* ---- Tầng 1: hôm nay ---- */}
      <TodaySpending
        state={state}
        loading={remoteLoading}
        onOpenAddModal={() => onOpenAddModal()}
        onViewAll={() => onSelectTab('transactions')}
        onViewReport={() => onSelectTab('analytics')}
        onSelectTx={setDetailTx}
      />

      {/* ---- Tầng 2: tháng này ----
          Dùng chung SectionHead với mục hôm nay là chủ ý, không phải tiện tay:
          hai đầu mục cùng cấu trúc thì mắt đọc trang thành HAI CHƯƠNG ngang hàng.
          Khi khối này chỉ là mấy cái thẻ trôi nổi sau một mục có tiêu đề lớn, nó
          đọc thành phần thừa của mục trên chứ không thành một chương riêng. */}
      <section className="month-section">
        <SectionHead
          icon={<CalendarRange size={19} />}
          title={t('dash.month_title')}
          subtitle={dayjs().format(t('dash.month_format'))}
          actionLabel={t('dash.month_action')}
          onAction={() => onSelectTab('analytics')}
        />

        {/* .stagger cho các thẻ vào lệch nhau một nhịp rất ngắn, đủ để mắt đọc
            chúng như một chuỗi thay vì một khối bật ra. */}
        <div className="month-cards stagger">
          {/* Thu nhập tháng */}
          <div className="glass-card month-card">
            <div className="month-card__head">
              <span className="month-card__label">{t('dash.income_this_month')}</span>
              {/* Màu đặt trên thẻ bọc; lucide mặc định stroke="currentColor" nên icon
                  tự ăn theo. Truyền var() vào prop color sẽ hỏng vì nó rơi vào thuộc
                  tính stroke của SVG, nơi biến CSS không được phân giải. */}
              <span
                className="month-card__icon"
                style={{ background: 'var(--tint-income)', color: 'var(--color-income)' }}
              >
                <TrendingUp size={18} />
              </span>
            </div>

            <div className="month-card__value" style={{ color: 'var(--color-income)' }}>
              +<CounterAnimation value={monthlyIncome} />
            </div>

            <div className="month-card__foot">
              <ArrowUpRight size={15} style={{ color: 'var(--color-income)', flexShrink: 0 }} />
              <span>
                {incomeSourceCount > 0
                  ? t('dash.income_sources', { count: incomeSourceCount })
                  : t('dash.no_income_yet')}
              </span>
            </div>
          </div>

          {/* Chi tiêu tháng */}
          <div className="glass-card month-card">
            <div className="month-card__head">
              <span className="month-card__label">{t('dash.expense_this_month')}</span>
              <span
                className="month-card__icon"
                style={{ background: 'var(--tint-expense)', color: 'var(--color-expense)' }}
              >
                <TrendingDown size={18} />
              </span>
            </div>

            <div className="month-card__value" style={{ color: 'var(--color-expense)' }}>
              -<CounterAnimation value={monthlyExpense} />
            </div>

            <div className="month-card__foot">
              <ArrowDownRight size={15} style={{ color: 'var(--color-expense)', flexShrink: 0 }} />
              <span>
                {expenseCategoryCount > 0
                  ? t('dash.expense_categories', { count: expenseCategoryCount })
                  : t('dash.no_expense_yet')}
              </span>
            </div>
          </div>

          {/* Tiết kiệm ròng */}
          <div className="glass-card month-card">
            <div className="month-card__head">
              <span className="month-card__label">{t('dash.net_savings')}</span>
              <span
                className="month-card__icon"
                style={{ background: 'var(--tint-savings)', color: 'var(--color-savings)' }}
              >
                <PiggyBank size={18} />
              </span>
            </div>

            <div className="month-card__value" style={{ color: 'var(--color-savings)' }}>
              +<CounterAnimation value={monthlySavings} />
            </div>

            <div className="month-card__meter">
              <div className="month-card__meter-row">
                <span>{t('dash.savings_rate')}</span>
                <span style={{ fontWeight: 700, color: 'var(--color-savings)' }}>{savingsRate}%</span>
              </div>
              <Progress
                percent={savingsRate}
                strokeColor={{ '0%': '#2563EB', '100%': '#7C3AED' }}
                railColor="var(--surface-border)"
                size={['100%', 6]}
                showInfo={false}
              />
            </div>
          </div>
        </div>

        <div className="month-charts">
          {/* Xu hướng thu chi theo tháng */}
          <div className="glass-card month-panel">
            <div className="month-panel__head">
              <div style={{ minWidth: 0 }}>
                <div className="month-panel__title">{t('dash.trend_title')}</div>
                <div className="month-panel__sub">{t('dash.trend_subtitle', { months: TREND_MONTHS })}</div>
              </div>
              <Button size="small" icon={<CalendarIcon size={14} />} onClick={() => onSelectTab('calendar')}>
                {t('dash.view_detail')}
              </Button>
            </div>

            {/* 250 chứ không phải 280: thẻ này quyết định chiều cao cả hàng, hạ
                xuống một nhịp thì phần trống ở đáy bảng xếp hạng bên cạnh cũng
                ngắn lại theo. */}
            <div style={{ width: '100%', height: 250 }}>
              <Bar data={trendData} options={trendOptions} />
            </div>
          </div>

          {/* Xếp hạng danh mục — thay cho biểu đồ tròn cũ */}
          <div className="glass-card month-panel">
            <div className="month-panel__head">
              <div className="month-panel__title">{t('dash.by_category')}</div>
              <Button type="link" size="small" onClick={() => onSelectTab('categories')}>
                {t('dash.view_all')}
              </Button>
            </div>

            {rankedTop.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={t('dash.no_expense_yet')}
                style={{ margin: '32px 0' }}
              />
            ) : (
              <>
                <div className="cat-rank">
                  {rankedTop.map((item) => {
                    const pct = rankedTotal > 0 ? (item.value / rankedTotal) * 100 : 0;
                    return (
                      <div key={item.id} className="cat-rank__row">
                        <span className="cat-rank__icon" style={{ background: `${item.color}22` }}>
                          <DynamicIcon name={item.icon} size={13} color={item.color} />
                        </span>

                        <span className="cat-rank__body">
                          <span className="cat-rank__top">
                            <span className="cat-rank__name">{item.name}</span>
                            <span className="cat-rank__amount">{formatMoney(item.value)}</span>
                          </span>

                          <span className="cat-rank__meter">
                            <span
                              className="cat-rank__meter-fill"
                              style={{ width: `${Math.max(2, pct)}%`, background: item.color }}
                            />
                          </span>
                        </span>

                        <span className="cat-rank__pct">{Math.round(pct)}%</span>
                      </div>
                    );
                  })}
                </div>

                {/* Phần đuôi gộp lại thay vì cắt im lặng: cắt mà không nói thì tổng
                    các dòng hiện ra không bao giờ khớp với "Chi tiêu tháng này". */}
                {rankedRest.length > 0 && (
                  <div className="cat-rank__more">
                    <span>{t('dash.cat_others', { count: rankedRest.length })}</span>
                    <strong>{formatMoney(rankedRestAmount)}</strong>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* ---- Tầng 3: mục tiêu tiết kiệm ----
          Cố tình KHÔNG dùng SectionHead: nâng nó lên ngang hàng hai chương trên
          sẽ làm trang có ba tiêu đề cùng cỡ và bậc lại phẳng ra như cũ. Tiêu đề
          bên trong thẻ giữ nó đúng ở tầng dưới. */}
      <div className="glass-card month-panel">
        <div className="month-panel__head">
          <div className="month-panel__title">{t('dash.goals_title')}</div>
          <Button type="link" size="small" onClick={() => onSelectTab('goals')}>
            {t('dash.view_more')}
          </Button>
        </div>

        {goals.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={t('dash.empty_goals')}
            style={{ margin: '24px 0' }}
          />
        ) : (
          <div className="goals-grid">
            {goals.slice(0, GOALS_PREVIEW).map((goal) => {
              const pct = Math.round((goal.saved / goal.target) * 100);
              return (
                <div key={goal.id} className="goal-item">
                  <div className="goal-item__head">
                    <span className="goal-item__name">{goal.name}</span>
                    <span className="goal-item__pct">{pct}%</span>
                  </div>

                  {/* Phần trăm đã hiện ở tiêu đề, tắt showInfo để khỏi lặp số. */}
                  <Progress
                    percent={pct}
                    showInfo={false}
                    railColor="var(--surface-border)"
                    size={['100%', 6]}
                    strokeColor={{ '0%': '#2563EB', '100%': '#7C3AED' }}
                  />

                  <div className="goal-item__foot">
                    <span>{t('dash.goal_saved', { amount: formatMoney(goal.saved) })}</span>
                    <span>{t('dash.goal_target', { amount: formatMoney(goal.target) })}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <TransactionDetailModal
        tx={detailTx}
        categoriesMap={categoriesMap}
        walletsMap={walletsMap}
        onClose={() => setDetailTx(null)}
        onEdit={onOpenAddModal}
        onDelete={onDeleteTx}
      />
    </div>
  );
};
