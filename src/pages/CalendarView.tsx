import React, { useState } from 'react';
import { Calendar, Drawer, List } from 'antd';
import type { Dayjs } from 'dayjs';
import { TX_TYPE, type AppState, type Category } from '~/types';
import { formatMoney } from '~/utils/format';
import { resolveCategory } from '~/utils/categories';
import { DynamicIcon } from '~/components/DynamicIcon';
import { t } from '~/i18n';

interface CalendarViewProps {
  state: AppState;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ state }) => {
  const { transactions, categories } = state;
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const categoriesMap = categories.reduce((acc, c) => ({ ...acc, [c.id]: c }), {} as Record<string, Category>);

  const dateCellRender = (value: Dayjs) => {
    const dateStr = value.format('YYYY-MM-DD');
    const dayTxs = transactions.filter((t) => t.date === dateStr);
    if (dayTxs.length === 0) return null;

    const inc = dayTxs.filter((t) => t.type === TX_TYPE.INCOME).reduce((a, b) => a + b.amount, 0);
    const exp = dayTxs.filter((t) => t.type === TX_TYPE.EXPENSE).reduce((a, b) => a + b.amount, 0);

    return (
      <div style={{ fontSize: 10 }}>
        {inc > 0 && <div style={{ color: '#16A34A', fontWeight: 700 }}>+{formatMoney(inc)}</div>}
        {exp > 0 && <div style={{ color: '#DC2626', fontWeight: 700 }}>-{formatMoney(exp)}</div>}
      </div>
    );
  };

  const selectedTxs = selectedDate ? transactions.filter((t) => t.date === selectedDate) : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="glass-card" style={{ padding: '20px 24px' }}>
        <div style={{ fontSize: 20, fontWeight: 800 }}>{t('cal.title')}</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t('cal.subtitle')}</div>
      </div>

      <div className="glass-card" style={{ padding: 20 }}>
        <Calendar
          cellRender={dateCellRender}
          onSelect={(val) => setSelectedDate(val.format('YYYY-MM-DD'))}
        />
      </div>

      {/* Day Breakdown Drawer */}
      <Drawer
        title={t('cal.modal_title', { date: selectedDate ?? '' })}
        placement="right"
        size={Math.min(400, typeof window !== 'undefined' ? window.innerWidth : 400)}
        onClose={() => setSelectedDate(null)}
        open={!!selectedDate}
      >
        {selectedTxs.length === 0 ? (
          <div style={{ color: '#94a3b8', textAlign: 'center', marginTop: 40 }}>{t('cal.empty')}</div>
        ) : (
          <List
            dataSource={selectedTxs}
            renderItem={(tx) => {
              const cat = resolveCategory(tx.category, categoriesMap);
              const isThu = tx.type === TX_TYPE.INCOME;
              return (
                <List.Item style={{ padding: '12px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: cat?.color ? `${cat.color}20` : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <DynamicIcon name={cat?.icon || 'CircleDollarSign'} color={cat?.color || '#2563EB'} size={18} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{tx.note || cat?.name}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{tx.time || '12:00'}</div>
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: isThu ? '#16A34A' : '#DC2626' }}>
                      {isThu ? '+' : '-'}{formatMoney(tx.amount)}
                    </div>
                  </div>
                </List.Item>
              );
            }}
          />
        )}
      </Drawer>
    </div>
  );
};
