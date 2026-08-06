import React from 'react';
import { Progress, Segmented } from 'antd';
import dayjs from 'dayjs';
import { Bar } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import { tooltipStyle, chartTheme } from '~/utils/chartSetup';
import { useIsDarkTheme } from '~/hooks/useIsDarkTheme';
import type { AppState } from '~/types';
import { formatMoney, formatCompactNumber } from '~/utils/format';
import { t } from '~/i18n';

/** Quy điểm sức khỏe tài chính (0-100) thành xếp hạng chữ. */
function rankOf(score: number): string {
  if (score >= 90) return t('ana.rank_excellent');
  if (score >= 80) return t('ana.rank_very_good');
  if (score >= 70) return t('ana.rank_good');
  if (score >= 60) return t('ana.rank_fair');
  if (score >= 50) return t('ana.rank_average');
  return t('ana.rank_poor');
}

interface AnalyticsProps {
  state: AppState;
}

export const Analytics: React.FC<AnalyticsProps> = ({ state }) => {
  const chart = chartTheme(useIsDarkTheme());
  const { transactions } = state;

  const monthlyInc = transactions.filter((t) => t.type === 'thu').reduce((acc, t) => acc + t.amount, 0);
  const monthlyExp = transactions.filter((t) => t.type === 'chi').reduce((acc, t) => acc + t.amount, 0);
  const savingsRate = monthlyInc > 0 ? Math.round(((monthlyInc - monthlyExp) / monthlyInc) * 100) : 0;

  const healthScore = monthlyInc === 0 && monthlyExp === 0 ? 100 : Math.max(0, Math.min(100, Math.round(savingsRate * 0.6 + 40)));

  const healthRank = rankOf(healthScore);
  const healthAdvice =
    monthlyInc === 0
      ? t('ana.no_income_advice')
      : savingsRate < 0
        ? t('ana.overspend_advice', { pct: Math.abs(savingsRate) })
        : t('ana.savings_rate_advice', {
            rate: savingsRate,
            suffix: savingsRate >= 20 ? t('ana.savings_good') : t('ana.savings_low'),
          });

  // Calculate monthly comparison dynamically from transactions.
  // Khoá YYYY-MM để không gộp nhầm cùng tháng khác năm.
  const monthMap: Record<string, { thu: number; chi: number }> = {};
  transactions.forEach((t) => {
    if (!t.date) return;
    const key = t.date.slice(0, 7);
    if (!monthMap[key]) monthMap[key] = { thu: 0, chi: 0 };
    if (t.type === 'thu') monthMap[key].thu += t.amount;
    if (t.type === 'chi') monthMap[key].chi += t.amount;
  });

  // Luôn vẽ đủ 6 tháng gần nhất. Nếu chỉ vẽ những tháng có giao dịch, chart 1-2 cột
  // sẽ bị Chart.js dàn mỗi cột ra giữa một ô rộng bằng nửa biểu đồ, lệch khỏi nhãn tháng.
  const monthlyComparison = Array.from({ length: 6 }, (_, i) => {
    const key = dayjs().subtract(5 - i, 'month').format('YYYY-MM');
    return {
      month: 'T' + parseInt(key.slice(5, 7), 10),
      thu: monthMap[key]?.thu ?? 0,
      chi: monthMap[key]?.chi ?? 0,
    };
  });

  const monthsWithData = Object.keys(monthMap).length;
  const avgMonthlyInc = monthsWithData > 0 ? monthlyInc / monthsWithData : monthlyInc;
  const avgDailyExp = monthlyExp > 0 ? Math.round(monthlyExp / 30) : 0;

  const comparisonData: ChartData<'bar'> = {
    labels: monthlyComparison.map((m) => m.month),
    datasets: [
      {
        label: t('dash.income_label'),
        data: monthlyComparison.map((m) => m.thu),
        backgroundColor: '#22C55E',
        borderRadius: 8,
        borderSkipped: false,
        categoryPercentage: 0.6,
        barPercentage: 1,
        maxBarThickness: 56,
      },
      {
        label: t('dash.expense_label'),
        data: monthlyComparison.map((m) => m.chi),
        backgroundColor: '#EF4444',
        borderRadius: 8,
        borderSkipped: false,
        categoryPercentage: 0.6,
        barPercentage: 1,
        maxBarThickness: 56,
      },
    ],
  };

  const comparisonOptions: ChartOptions<'bar'> = {
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
        ticks: { font: { size: 12 }, color: chart.tick },
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{t('ana.title')}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t('ana.subtitle')}</div>
        </div>

        {/* value giữ nguyên mã khoá, chỉ label đổi theo ngôn ngữ — nếu dùng chuỗi
            hiển thị làm value thì đổi ngôn ngữ sẽ làm mất lựa chọn đang chọn. */}
        <Segmented
          defaultValue="month"
          options={[
            { value: 'month', label: t('ana.period_month') },
            { value: 'quarter', label: t('ana.period_quarter') },
            { value: 'year', label: t('ana.period_year') },
          ]}
        />
      </div>

      {/* Financial Health Score Banner */}
      <div className="gradient-card-primary" style={{ padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <Progress type="dashboard" percent={healthScore} size={90} strokeColor="#ffffff" railColor="rgba(255,255,255,0.2)" format={(p) => <span style={{ color: '#fff', fontSize: 20, fontWeight: 800 }}>{p}</span>} />
          <div>
            <div style={{ fontSize: 11, opacity: 0.8, textTransform: 'uppercase', fontWeight: 600 }}>{t('ana.health_score')}</div>
            <div style={{ fontSize: 20, fontWeight: 800, margin: '2px 0' }}>{t('ana.rank_label', { rank: healthRank })}</div>
            <div style={{ fontSize: 12, opacity: 0.9 }}>{healthAdvice}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(255,255,255,0.15)', padding: '10px 14px', borderRadius: 12 }}>
            <div style={{ fontSize: 10, opacity: 0.8 }}>{t('ana.avg_income')}</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{formatMoney(avgMonthlyInc)}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.15)', padding: '10px 14px', borderRadius: 12 }}>
            <div style={{ fontSize: 10, opacity: 0.8 }}>{t('ana.avg_expense')}</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{formatMoney(avgDailyExp)}</div>
          </div>
        </div>
      </div>

      {/* Bar Chart: Income vs Expense Monthly Comparison */}
      <div className="glass-card" style={{ padding: 24 }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>{t('ana.compare_title')}</div>
        <div style={{ width: '100%', height: 320 }}>
          <Bar data={comparisonData} options={comparisonOptions} />
        </div>
      </div>
    </div>
  );
};
