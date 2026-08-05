import React from 'react';
import { Progress, Segmented } from 'antd';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Legend } from 'recharts';
import type { AppState } from '../types';
import { formatMoney } from '../utils/format';

interface AnalyticsProps {
  state: AppState;
}

export const Analytics: React.FC<AnalyticsProps> = ({ state }) => {
  const { transactions } = state;

  const monthlyInc = transactions.filter((t) => t.type === 'thu').reduce((acc, t) => acc + t.amount, 0);
  const monthlyExp = transactions.filter((t) => t.type === 'chi').reduce((acc, t) => acc + t.amount, 0);
  const savingsRate = monthlyInc > 0 ? Math.round(((monthlyInc - monthlyExp) / monthlyInc) * 100) : 0;

  const healthScore = monthlyInc === 0 && monthlyExp === 0 ? 100 : Math.max(0, Math.min(100, Math.round(savingsRate * 0.6 + 40)));

  // Calculate monthly comparison dynamically from transactions
  const monthMap: Record<string, { thu: number; chi: number }> = {};
  transactions.forEach((t) => {
    if (!t.date) return;
    const m = 'T' + parseInt(t.date.slice(5, 7), 10);
    if (!monthMap[m]) monthMap[m] = { thu: 0, chi: 0 };
    if (t.type === 'thu') monthMap[m].thu += t.amount;
    if (t.type === 'chi') monthMap[m].chi += t.amount;
  });

  const monthlyComparison = Object.entries(monthMap).map(([month, val]) => ({
    month,
    thu: val.thu,
    chi: val.chi,
  }));

  const avgMonthlyInc = monthlyComparison.length > 0 ? monthlyInc / monthlyComparison.length : monthlyInc;
  const avgDailyExp = monthlyExp > 0 ? Math.round(monthlyExp / 30) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>Phân tích & Thống kê Tài chính</div>
          <div style={{ fontSize: 13, color: '#64748b' }}>Báo cáo chuyên sâu về cash flow, tỷ lệ tiết kiệm và sức khỏe tài chính</div>
        </div>

        <Segmented options={['Tháng này', 'Quý này', 'Năm nay']} defaultValue="Tháng này" />
      </div>

      {/* Financial Health Score Banner */}
      <div className="gradient-card-primary" style={{ padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <Progress type="dashboard" percent={healthScore} width={90} strokeColor="#ffffff" trailColor="rgba(255,255,255,0.2)" format={(p) => <span style={{ color: '#fff', fontSize: 20, fontWeight: 800 }}>{p}</span>} />
          <div>
            <div style={{ fontSize: 11, opacity: 0.8, textTransform: 'uppercase', fontWeight: 600 }}>Điểm Sức Khỏe Tài Chính</div>
            <div style={{ fontSize: 20, fontWeight: 800, margin: '2px 0' }}>Xếp hạng: RẤT TỐT (A+)</div>
            <div style={{ fontSize: 12, opacity: 0.9 }}>Tỷ lệ tiết kiệm {savingsRate}% thuộc top 10% tối ưu!</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(255,255,255,0.15)', padding: '10px 14px', borderRadius: 12 }}>
            <div style={{ fontSize: 10, opacity: 0.8 }}>Thu nhập TB/tháng</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{formatMoney(avgMonthlyInc)}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.15)', padding: '10px 14px', borderRadius: 12 }}>
            <div style={{ fontSize: 10, opacity: 0.8 }}>Chi tiêu TB/ngày</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{formatMoney(avgDailyExp)}</div>
          </div>
        </div>
      </div>

      {/* Bar Chart: Income vs Expense Monthly Comparison */}
      <div className="glass-card" style={{ padding: 24 }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>So sánh Thu nhập vs Chi tiêu qua các tháng</div>
        <div style={{ width: '100%', height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyComparison}>
              <XAxis dataKey="month" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <RechartsTooltip formatter={(v: any) => [formatMoney(Number(v)), '']} />
              <Legend />
              <Bar dataKey="thu" name="Thu nhập" fill="#22C55E" radius={[8, 8, 0, 0]} />
              <Bar dataKey="chi" name="Chi tiêu" fill="#EF4444" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
