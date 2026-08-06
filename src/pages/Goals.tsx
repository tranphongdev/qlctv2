import React, { useState } from 'react';
import { Progress, Button, Tag, Modal, Form, Input, InputNumber, DatePicker, Popconfirm } from 'antd';
import { message } from '../lib/antdApp';
import { Plus, Sparkles, CheckCircle2, Trash2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { AppState, Goal } from '../types';
import { formatMoney } from '../utils/format';
import { addGoal, depositToGoal, deleteGoal } from '../store/appStore';
import { t } from '../i18n';

interface GoalsProps {
  state: AppState;
}

export const Goals: React.FC<GoalsProps> = ({ state }) => {
  const { goals } = state;
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [depositGoal, setDepositGoal] = useState<Goal | null>(null);
  const [form] = Form.useForm();
  const [depositForm] = Form.useForm();

  const handleCreateGoal = (values: any) => {
    addGoal({
      name: values.name,
      target: values.target,
      deadline: values.deadline ? values.deadline.format('YYYY-MM-DD') : null,
      imageUrl: values.imageUrl || 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=500&q=80',
      color: '#4F46E5',
    });
    message.success(t('goals.created'));
    setIsAddOpen(false);
    form.resetFields();
  };

  const handleDeposit = (values: any) => {
    if (!depositGoal) return;
    const depositAmount = values.amount;
    const newTotal = depositGoal.saved + depositAmount;

    depositToGoal(depositGoal.id, depositAmount);

    if (newTotal >= depositGoal.target) {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
      });
      message.success(t('goals.completed_celebration', { name: depositGoal.name.toUpperCase() }));
    } else {
      message.success(
        t('goals.deposited', { amount: formatMoney(depositAmount), name: depositGoal.name }),
      );
    }

    setDepositGoal(null);
    depositForm.resetFields();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{t('goals.title')}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t('goals.subtitle')}</div>
        </div>

        <Button type="primary" icon={<Plus size={16} />} size="middle" style={{ borderRadius: 12 }} onClick={() => setIsAddOpen(true)}>
          {t('goals.add_new')}
        </Button>
      </div>

      {/* Goals Grid */}
      {/* Trần 380px cho cột: một mục tiêu duy nhất vẫn giữ dáng thẻ thay vì giãn hết
          chiều ngang biến ảnh bìa thành banner. */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 380px))', gap: 16, justifyContent: 'start' }}>
        {goals.map((g) => {
          const pct = Math.min(100, Math.round((g.saved / g.target) * 100));
          const isDone = g.saved >= g.target;

          return (
            <div key={g.id} className="glass-card" style={{ overflow: 'hidden', padding: 0 }}>
              {/* Cover Image */}
              <div
                style={{
                  height: 140,
                  backgroundImage: `linear-gradient(to bottom, rgba(15,23,42,0.45) 0%, rgba(15,23,42,0) 55%), url(${g.imageUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  position: 'relative',
                }}
              >
                <div style={{ position: 'absolute', top: 12, right: 12 }}>
                  {isDone ? (
                    <Tag color="green" icon={<CheckCircle2 size={12} />}>
                      {t('goals.done_tag')}
                    </Tag>
                  ) : (
                    <Tag color="purple">{pct}%</Tag>
                  )}
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: 20 }}>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{g.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
                  {t('goals.deadline_label', { value: g.deadline || t('goals.no_deadline') })}
                </div>

                {/* Tag trên ảnh bìa đã hiện % rồi, tắt showInfo để khỏi lặp số. */}
                <Progress percent={pct} showInfo={false} strokeColor={{ '0%': '#4F46E5', '100%': '#7C3AED' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, margin: '14px 0 16px' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{t('goals.saved_label')}</span>
                    <div style={{ fontWeight: 700, color: '#4F46E5' }}>{formatMoney(g.saved)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{t('goals.target_label')}</span>
                    <div style={{ fontWeight: 700, color: 'var(--text-heading)' }}>{formatMoney(g.target)}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <Button
                    type={isDone ? 'default' : 'primary'}
                    onClick={() => setDepositGoal(g)}
                    icon={<Sparkles size={16} />}
                    style={{ borderRadius: 12, flex: 1 }}
                  >
                    {isDone ? t('goals.deposit_more') : t('goals.deposit')}
                  </Button>
                  <Popconfirm
                    title={t('goals.delete_title')}
                    description={t('goals.delete_desc', { name: g.name })}
                    onConfirm={() => {
                      deleteGoal(g.id);
                      message.success(t('goals.deleted', { name: g.name }));
                    }}
                    okText={t('common.delete')}
                    cancelText={t('common.cancel')}
                    okButtonProps={{ danger: true }}
                  >
                    <Button
                      danger
                      aria-label={t('goals.delete_aria', { name: g.name })}
                      icon={<Trash2 size={16} />}
                      style={{ borderRadius: 12 }}
                    />
                  </Popconfirm>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Goal Modal */}
      <Modal open={isAddOpen} onCancel={() => setIsAddOpen(false)} title={t('goals.modal_add_title')} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleCreateGoal} style={{ marginTop: 16 }}>
          <Form.Item name="name" label={t('goals.field_name')} rules={[{ required: true, message: t('goals.field_name_required') }]}>
            <Input placeholder={t('goals.field_name_placeholder')} />
          </Form.Item>

          <Form.Item name="target" label={t('goals.field_target')} rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(v) => v?.replace(/\./g, '') as any} placeholder={t('common.amount_placeholder')} min={100000} />
          </Form.Item>

          <Form.Item name="deadline" label={t('goals.field_deadline')}>
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item name="imageUrl" label={t('goals.field_image')}>
            <Input placeholder="https://..." />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Button onClick={() => setIsAddOpen(false)} style={{ marginRight: 8 }}>{t('common.cancel')}</Button>
            <Button type="primary" htmlType="submit">{t('goals.submit_create')}</Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Deposit Modal */}
      <Modal open={!!depositGoal} onCancel={() => setDepositGoal(null)} title={t('goals.deposit_modal_title', { name: depositGoal?.name ?? '' })} footer={null}>
        <Form form={depositForm} layout="vertical" onFinish={handleDeposit} style={{ marginTop: 16 }}>
          <Form.Item name="amount" label={t('goals.deposit_amount_label')} rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(v) => v?.replace(/\./g, '') as any} placeholder={t('common.amount_placeholder')} min={10000} autoFocus />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Button onClick={() => setDepositGoal(null)} style={{ marginRight: 8 }}>{t('common.cancel')}</Button>
            <Button type="primary" htmlType="submit">{t('goals.deposit_submit')}</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
