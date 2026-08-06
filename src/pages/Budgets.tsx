import React, { useState } from 'react';
import { Progress, Button, Tag, Modal, Form, Select, InputNumber } from 'antd';
import { message } from '../lib/antdApp';
import { Plus, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';
import dayjs from 'dayjs';
import type { AppState, Category } from '../types';
import { formatMoney } from '../utils/format';
import { addBudget } from '../store/appStore';

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
    message.success('Đã thiết lập ngân sách mới!');
    setIsAddOpen(false);
    form.resetFields();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>Quản lý Ngân sách Chi tiêu</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Hạn mức chi tiêu tháng {dayjs().format('MM/YYYY')} với cảnh báo tự động 50%, 80%, 100% & 120%</div>
        </div>

        <Button type="primary" icon={<Plus size={16} />} size="middle" style={{ borderRadius: 12 }} onClick={() => setIsAddOpen(true)}>
          Tạo Ngân Sách Mới
        </Button>
      </div>

      {/* Budgets Grid */}
      {/* Trần 380px: một ngân sách vẫn giữ dáng thẻ thay vì kéo dài hết chiều ngang. */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 380px))', gap: 16, justifyContent: 'start' }}>
        {budgets.map((b) => {
          const cat = categoriesMap[b.category];
          const spent = spentMap[b.category] || 0;
          const pct = Math.round((spent / b.amount) * 100);
          const isOver = spent > b.amount;

          let alertTag = <Tag color="green" icon={<CheckCircle size={12} />}>An toàn (&lt;50%)</Tag>;
          if (pct >= 120) {
            alertTag = <Tag color="red" icon={<ShieldAlert size={12} />}>Vượt {pct - 100}% (120%+)</Tag>;
          } else if (pct >= 100) {
            alertTag = <Tag color="volcano" icon={<AlertTriangle size={12} />}>Đạt 100% Hạn mức</Tag>;
          } else if (pct >= 80) {
            alertTag = <Tag color="orange" icon={<AlertTriangle size={12} />}>Cảnh báo 80%</Tag>;
          } else if (pct >= 50) {
            alertTag = <Tag color="blue">Đã dùng {pct}%</Tag>;
          }

          return (
            <div key={b.id} className="glass-card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: cat?.color || '#4F46E5' }}>{cat?.name || b.category}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Tháng {formatMonthKey(b.monthKey)}</div>
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
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Đã chi tiêu</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: isOver ? '#EF4444' : 'var(--text-heading)' }}>
                    {formatMoney(spent)}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    Hạn mức: {formatMoney(b.amount)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Budget Modal */}
      <Modal open={isAddOpen} onCancel={() => setIsAddOpen(false)} title="Tạo Ngân sách Chi tiêu Mới" footer={null}>
        <Form form={form} layout="vertical" onFinish={handleCreateBudget} style={{ marginTop: 16 }}>
          <Form.Item name="category" label="Danh mục chi tiêu" rules={[{ required: true, message: 'Chọn danh mục' }]}>
            <Select
              placeholder="Chọn danh mục"
              options={categories
                .filter((c) => c.type === 'chi')
                .map((c) => ({ value: c.id, label: c.name }))}
            />
          </Form.Item>

          <Form.Item name="amount" label="Hạn mức chi tiêu (VNĐ)" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(v) => v?.replace(/\./g, '') as any} placeholder="0 VNĐ" min={100000} />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Button onClick={() => setIsAddOpen(false)} style={{ marginRight: 8 }}>Hủy</Button>
            <Button type="primary" htmlType="submit">Thiết Lập Ngân Sách</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
