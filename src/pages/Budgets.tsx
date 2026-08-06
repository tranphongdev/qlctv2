import React, { useState } from 'react';
import { Progress, Button, Tag, Modal, Form, Select, InputNumber } from 'antd';
import { message } from '../lib/antdApp';
import { Plus, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';
import dayjs from 'dayjs';
import type { AppState, Category } from '../types';
import { formatMoney } from '../utils/format';
import { addBudget } from '../store/appStore';
import { t } from '../i18n';

/** "2026-08" -> "08/2026". Trả về chuỗi gốc nếu khoá tháng không đúng định dạng. */
function formatMonthKey(monthKey: string): string {
  const [year, month] = (monthKey || '').split('-');
  return year && month ? `${month}/${year}` : monthKey;
}

interface BudgetsProps {
  state: AppState;
}

export const Budgets: React.FC<BudgetsProps> = ({ state }) => {
  const { budgets, transactions, categories } = state;
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form] = Form.useForm();

  const categoriesMap = categories.reduce((acc, c) => ({ ...acc, [c.id]: c }), {} as Record<string, Category>);

  // Compute spent amount for current month per category
  const currentMonthTxs = transactions.filter((t) => t.date.startsWith('2026-08') && t.type === 'chi');
  const spentMap: Record<string, number> = {};
  currentMonthTxs.forEach((t) => {
    spentMap[t.category] = (spentMap[t.category] || 0) + t.amount;
  });

  const handleCreateBudget = (values: any) => {
    addBudget({
      category: values.category,
      amount: values.amount,
      period: 'month',
      monthKey: '2026-08',
    });
    message.success(t('budgets.created'));
    setIsAddOpen(false);
    form.resetFields();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{t('budgets.title')}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t('budgets.subtitle', { month: dayjs().format('MM/YYYY') })}</div>
        </div>

        <Button type="primary" icon={<Plus size={16} />} size="middle" style={{ borderRadius: 12 }} onClick={() => setIsAddOpen(true)}>
          {t('budgets.add_new')}
        </Button>
      </div>

      {/* Budgets Grid */}
      {/* Trần 380px: một ngân sách vẫn giữ dáng thẻ thay vì kéo dài hết chiều ngang.
          Trần bị bỏ dưới 600px để thẻ trải hết bề ngang (xem .card-grid). */}
      <div className="card-grid">
        {budgets.map((b) => {
          const cat = categoriesMap[b.category];
          const spent = spentMap[b.category] || 0;
          const pct = Math.round((spent / b.amount) * 100);
          const isOver = spent > b.amount;

          let alertTag = <Tag color="green" icon={<CheckCircle size={12} />}>{t('budgets.safe')}</Tag>;
          if (pct >= 120) {
            alertTag = <Tag color="red" icon={<ShieldAlert size={12} />}>{t('budgets.over', { pct: pct - 100 })}</Tag>;
          } else if (pct >= 100) {
            alertTag = <Tag color="volcano" icon={<AlertTriangle size={12} />}>{t('budgets.at_limit')}</Tag>;
          } else if (pct >= 80) {
            alertTag = <Tag color="orange" icon={<AlertTriangle size={12} />}>{t('budgets.warning_80')}</Tag>;
          } else if (pct >= 50) {
            alertTag = <Tag color="blue">{t('budgets.used', { pct })}</Tag>;
          }

          return (
            <div key={b.id} className="glass-card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: cat?.color || '#4F46E5' }}>{cat?.name || b.category}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{t('budgets.month_label', { value: formatMonthKey(b.monthKey) })}</div>
                </div>
                {alertTag}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16 }}>
                <Progress
                  type="circle"
                  percent={pct}
                  size={80}
                  strokeColor={pct >= 100 ? '#EF4444' : pct >= 80 ? '#F59E0B' : '#4F46E5'}
                />
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('budgets.spent')}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: isOver ? '#EF4444' : 'var(--text-heading)' }}>
                    {formatMoney(spent)}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    {t('budgets.limit', { amount: formatMoney(b.amount) })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Budget Modal */}
      <Modal open={isAddOpen} onCancel={() => setIsAddOpen(false)} title={t('budgets.modal_title')} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleCreateBudget} style={{ marginTop: 16 }}>
          <Form.Item name="category" label={t('budgets.field_category')} rules={[{ required: true, message: t('budgets.field_category_required') }]}>
            <Select
              placeholder={t('budgets.field_category_required')}
              options={categories
                .filter((c) => c.type === 'chi')
                .map((c) => ({ value: c.id, label: c.name }))}
            />
          </Form.Item>

          <Form.Item name="amount" label={t('budgets.field_amount')} rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(v) => v?.replace(/\./g, '') as any} placeholder={t('common.amount_placeholder')} min={100000} />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Button onClick={() => setIsAddOpen(false)} style={{ marginRight: 8 }}>{t('common.cancel')}</Button>
            <Button type="primary" htmlType="submit">{t('budgets.submit')}</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
