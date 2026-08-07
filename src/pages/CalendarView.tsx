import React, { useState } from 'react';
import { Calendar, Drawer, List } from 'antd';
import type { Dayjs } from 'dayjs';
import { TX_TYPE, type AppState, type Category, type Transaction, type Wallet } from '~/types';
import { formatMoney, formatTinyNumber } from '~/utils/format';
import { resolveCategory } from '~/utils/categories';
import { DynamicIcon } from '~/components/DynamicIcon';
import { TransactionDetailModal } from '~/components/TransactionDetailModal';
import { t } from '~/i18n';

interface CalendarViewProps {
  state: AppState;
  onOpenAddModal: (initialData?: Transaction) => void;
  onDeleteTx: (id: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ state, onOpenAddModal, onDeleteTx }) => {
  const { transactions, categories, wallets } = state;
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [detailTx, setDetailTx] = useState<Transaction | null>(null);
  const categoriesMap = categories.reduce((acc, c) => ({ ...acc, [c.id]: c }), {} as Record<string, Category>);
  const walletsMap = wallets.reduce((acc, w) => ({ ...acc, [w.id]: w }), {} as Record<string, Wallet>);

  /** Tổng thu / chi của một ngày. */
  const totalsOf = (dateStr: string) => {
    const dayTxs = transactions.filter((t) => t.date === dateStr);
    return {
      count: dayTxs.length,
      income: dayTxs.filter((t) => t.type === TX_TYPE.INCOME).reduce((a, b) => a + b.amount, 0),
      expense: dayTxs.filter((t) => t.type === TX_TYPE.EXPENSE).reduce((a, b) => a + b.amount, 0),
    };
  };

  const dateCellRender = (value: Dayjs) => {
    const { count, income, expense } = totalsOf(value.format('YYYY-MM-DD'));
    if (count === 0) return null;

    return (
      /* Số rút gọn ("500k", "15.0 triệu") chứ không phải số đầy đủ: một ô lịch
         trên điện thoại chỉ rộng chừng 48px, còn "+15.000.000 ₫" cần gấp ba lần
         thế — phần đuôi bị cắt và người dùng đọc ra "+15.0" rồi không hiểu là bao
         nhiêu. Con số chính xác nằm ở ngăn kéo bên dưới, chỗ có đủ chỗ để đọc. */
      <div style={{ fontSize: 10, lineHeight: 1.35, overflow: 'hidden' }}>
        {income > 0 && (
          <div style={{ color: 'var(--color-income)', fontWeight: 700, whiteSpace: 'nowrap' }}>
            +{formatTinyNumber(income)}
          </div>
        )}
        {expense > 0 && (
          <div style={{ color: 'var(--color-expense)', fontWeight: 700, whiteSpace: 'nowrap' }}>
            -{formatTinyNumber(expense)}
          </div>
        )}
      </div>
    );
  };

  const selectedTxs = selectedDate ? transactions.filter((t) => t.date === selectedDate) : [];
  const dayTotals = selectedDate ? totalsOf(selectedDate) : null;

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
        {/* Tổng của ngày, đặt trên danh sách. Trước đây ngăn kéo chỉ liệt kê từng
            bút toán, muốn biết hôm đó thu chi bao nhiêu thì phải tự cộng nhẩm. */}
        {dayTotals && dayTotals.count > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8,
              marginBottom: 16,
              padding: 14,
              borderRadius: 14,
              background: 'var(--surface-subtle)',
              border: '1px solid var(--surface-border)',
            }}
          >
            {([
              [t('cal.total_income'), dayTotals.income, 'var(--color-income)', '+'],
              [t('cal.total_expense'), dayTotals.expense, 'var(--color-expense)', '-'],
              [
                t('cal.total_net'),
                dayTotals.income - dayTotals.expense,
                dayTotals.income >= dayTotals.expense ? 'var(--color-income)' : 'var(--color-expense)',
                dayTotals.income >= dayTotals.expense ? '+' : '-',
              ],
            ] as const).map(([label, value, color, sign]) => (
              <div key={label} style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
                {/* Số chênh lệch đã mang dấu sẵn, nên lấy trị tuyệt đối để không ra "--95.000". */}
                <div style={{ fontSize: 13, fontWeight: 700, color, wordBreak: 'break-word' }}>
                  {value === 0 ? formatMoney(0) : `${sign}${formatMoney(Math.abs(value))}`}
                </div>
              </div>
            ))}
          </div>
        )}

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
                  <div
                    role="button"
                    tabIndex={0}
                    title={t('txd.open_hint')}
                    onClick={() => setDetailTx(tx)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setDetailTx(tx);
                      }
                    }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', cursor: 'pointer' }}
                  >
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

      {/* Đặt ngoài Drawer: modal nằm trong Drawer sẽ bị lớp phủ của Drawer chặn
          thao tác, và đóng Drawer sẽ tháo luôn modal đang mở. */}
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
