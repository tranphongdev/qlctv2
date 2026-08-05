import React from 'react';
import { Button, Progress, Space } from 'antd';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';
import type { AppState } from '../types';
import { CounterAnimation } from '../components/CounterAnimation';
import { formatMoney, formatCompactNumber } from '../utils/format';
import { DynamicIcon } from '../components/DynamicIcon';

interface DashboardProps {
  state: AppState;
  onOpenAddModal: () => void;
  onSelectTab: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ state, onOpenAddModal, onSelectTab }) => {
  const { transactions, wallets, categories, goals } = state;

  const totalBalance = wallets.reduce((acc, w) => acc + w.balance, 0);

  const currentMonthTxs = transactions.filter((t) => t.date.startsWith('2026-08'));
  const monthlyIncome = currentMonthTxs
    .filter((t) => t.type === 'thu')
    .reduce((acc, t) => acc + t.amount, 0);
  const monthlyExpense = currentMonthTxs
    .filter((t) => t.type === 'chi')
    .reduce((acc, t) => acc + t.amount, 0);
  const monthlySavings = Math.max(0, monthlyIncome - monthlyExpense);
  const savingsRate = monthlyIncome > 0 ? Math.round((monthlySavings / monthlyIncome) * 100) : 0;

  const dailyData = [
    { day: '01/08', thu: 25000000, chi: 1200000 },
    { day: '02/08', thu: 0, chi: 5500000 },
    { day: '03/08', thu: 0, chi: 450000 },
    { day: '04/08', thu: 6000000, chi: 65000 },
    { day: '05/08', thu: 0, chi: 1200000 },
    { day: '06/08', thu: 0, chi: 850000 },
    { day: '07/08', thu: 2000000, chi: 300000 },
  ];

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
            <span style={{ padding: '2px 8px', borderRadius: 99, background: 'rgba(255,255,255,0.2)', fontWeight: 700 }}>
              +12.4%
            </span>
            <span>Tăng so với tháng trước</span>
          </div>
        </div>

        {/* Card 2: Monthly Income */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Thu nhập tháng này
            </span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={20} color="#22C55E" />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, margin: '14px 0 6px', color: '#16A34A', letterSpacing: '-0.5px' }}>
            +<CounterAnimation value={monthlyIncome} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b' }}>
            <ArrowUpRight size={16} color="#16A34A" />
            <span>2 nguồn thu nhập</span>
          </div>
        </div>

        {/* Card 3: Monthly Expense */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Chi tiêu tháng này
            </span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingDown size={20} color="#EF4444" />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, margin: '14px 0 6px', color: '#DC2626', letterSpacing: '-0.5px' }}>
            -<CounterAnimation value={monthlyExpense} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b' }}>
            <ArrowDownRight size={16} color="#DC2626" />
            <span>4 danh mục chính</span>
          </div>
        </div>

        {/* Card 4: Savings */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Tiết kiệm ròng
            </span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(124, 58, 237, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PiggyBank size={20} color="#7C3AED" />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, margin: '14px 0 6px', color: '#7C3AED', letterSpacing: '-0.5px' }}>
            +<CounterAnimation value={monthlySavings} />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginBottom: 4 }}>
              <span>Tỷ lệ tiết kiệm</span>
              <span style={{ fontWeight: 700, color: '#7C3AED' }}>{savingsRate}%</span>
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
              <div style={{ fontSize: 12, color: '#64748b' }}>Phân tích các ngày trong tháng 08/2026</div>
            </div>
            <Button size="small" icon={<CalendarIcon size={14} />} onClick={() => onSelectTab('calendar')}>
              Xem chi tiết
            </Button>
          </div>

          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="colorChi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorThu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => formatCompactNumber(v)} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <RechartsTooltip formatter={(val: any) => [formatMoney(Number(val)), '']} />
                <Legend />
                <Area type="monotone" dataKey="thu" name="Thu nhập" stroke="#22C55E" fillOpacity={1} fill="url(#colorThu)" strokeWidth={3} />
                <Area type="monotone" dataKey="chi" name="Chi tiêu" stroke="#EF4444" fillOpacity={1} fill="url(#colorChi)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
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
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData.length > 0 ? pieData : [{ name: 'Không có chi tiêu', value: 1, color: '#e2e8f0' }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(val: any) => [formatMoney(Number(val)), '']} />
              </PieChart>
            </ResponsiveContainer>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Giao dịch gần đây</div>
            <Space>
              <Button icon={<Plus size={14} />} type="primary" onClick={onOpenAddModal}>
                Thêm mới
              </Button>
              <Button type="text" icon={<ChevronRight size={16} />} onClick={() => onSelectTab('transactions')}>
                Tất cả
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
                    background: 'rgba(248, 250, 252, 0.6)',
                    border: '1px solid rgba(226, 232, 240, 0.6)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 12,
                        background: cat?.color ? `${cat.color}15` : '#4F46E515',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <DynamicIcon name={cat?.icon || 'CircleDollarSign'} color={cat?.color || '#4F46E5'} size={22} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{tx.note || cat?.name || 'Giao dịch'}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>
                        {tx.date} • {cat?.name}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: isThu ? '#16A34A' : '#DC2626' }}>
                      {isThu ? '+' : '-'}{formatMoney(tx.amount)}
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>Chủ nhật</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Savings Goals Widget */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Mục tiêu tiết kiệm</div>
            <Button type="link" size="small" onClick={() => onSelectTab('goals')}>
              Xem thêm
            </Button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {goals.slice(0, 2).map((goal) => {
              const pct = Math.round((goal.saved / goal.target) * 100);
              return (
                <div key={goal.id} style={{ padding: 14, borderRadius: 14, background: 'rgba(248, 250, 252, 0.6)', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{goal.name}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#7C3AED' }}>{pct}%</span>
                  </div>
                  <Progress percent={pct} strokeColor={{ '0%': '#4F46E5', '100%': '#7C3AED' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b', marginTop: 6 }}>
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
