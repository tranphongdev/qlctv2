import React, { useState } from 'react';
import { Table, Button, Tag, Modal, Form, Input, InputNumber, Select, DatePicker, Empty } from 'antd';
import { message } from '~/lib/antdApp';
import { Plus, CheckCircle, Clock } from 'lucide-react';
import { DEBT_DIRECTION, DEBT_STATUS, type AppState, type Debt } from '~/types';
import { formatMoney } from '~/utils/format';
import { addDebt, payDebt } from '~/store/appStore';
import { t } from '~/i18n';

interface DebtsProps {
  state: AppState;
}

export const Debts: React.FC<DebtsProps> = ({ state }) => {
  const { debts } = state;
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [payTarget, setPayTarget] = useState<Debt | null>(null);
  const [form] = Form.useForm();
  const [payForm] = Form.useForm();

  const handleCreateDebt = (values: any) => {
    addDebt({
      name: values.name,
      direction: values.direction,
      amount: values.amount,
      due: values.due ? values.due.format('YYYY-MM-DD') : null,
      note: values.note,
      phone: values.phone,
    });
    message.success(t('debts.added'));
    setIsAddOpen(false);
    form.resetFields();
  };

  const handlePay = (values: any) => {
    if (!payTarget) return;
    payDebt(payTarget.id, values.amount);
    message.success(t('debts.payment_recorded', { amount: formatMoney(values.amount) }));
    setPayTarget(null);
    payForm.resetFields();
  };

  const lendingList = debts.filter((d) => d.direction === DEBT_DIRECTION.LENDING);
  const borrowingList = debts.filter((d) => d.direction === DEBT_DIRECTION.BORROWING);

  const columns = [
    {
      title: t('debts.col_name'),
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Debt) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{record.note || t('common.no_note')}</div>
        </div>
      ),
    },
    {
      title: t('debts.col_total'),
      dataIndex: 'amount',
      key: 'amount',
      render: (val: number) => <span style={{ fontWeight: 700 }}>{formatMoney(val)}</span>,
    },
    {
      title: t('debts.col_paid'),
      dataIndex: 'paid',
      key: 'paid',
      render: (val: number) => <span style={{ color: '#16A34A', fontWeight: 600 }}>{formatMoney(val)}</span>,
    },
    {
      title: t('debts.col_remaining'),
      key: 'remaining',
      render: (_: any, record: Debt) => {
        const rem = Math.max(0, record.amount - record.paid);
        return <span style={{ color: rem > 0 ? '#DC2626' : '#16A34A', fontWeight: 700 }}>{formatMoney(rem)}</span>;
      },
    },
    {
      title: t('debts.col_due'),
      dataIndex: 'due',
      key: 'due',
      render: (due: string | null) => (due ? <Tag color="orange">{due}</Tag> : <span style={{ color: '#94a3b8' }}>{t('debts.not_set')}</span>),
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) =>
        status === DEBT_STATUS.SETTLED ? (
          <Tag color="green" icon={<CheckCircle size={12} />}>{t('debts.settled')}</Tag>
        ) : (
          <Tag color="volcano" icon={<Clock size={12} />}>{t('debts.tracking')}</Tag>
        ),
    },
    {
      title: t('common.actions'),
      key: 'action',
      render: (_: any, record: Debt) => (
        <Button
          size="small"
          type="primary"
          disabled={record.status === DEBT_STATUS.SETTLED}
          onClick={() => setPayTarget(record)}
        >
          {t('debts.update_payment')}
        </Button>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{t('debts.title')}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t('debts.subtitle')}</div>
        </div>

        <Button type="primary" icon={<Plus size={16} />} size="middle" style={{ borderRadius: 12 }} onClick={() => setIsAddOpen(true)}>
          {t('debts.add_new')}
        </Button>
      </div>

      {/* Tables & Mobile Cards Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Cho vay (Lending) */}
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#22C55E' }}>
            {t('debts.lending')}
          </div>
          <div className="desktop-only">
            <Table columns={columns} dataSource={lendingList} rowKey="id" pagination={false} style={{ width: '100%' }} />
          </div>
          {/* Bản desktop dùng Table nên antd tự lo trạng thái rỗng; danh sách thẻ
              ở mobile là JSX thuần nên phải tự xử. */}
          <div className="mobile-only" style={{ flexDirection: 'column', gap: 12 }}>
            {lendingList.length === 0 && (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('debts.empty_lending')} />
            )}
            {lendingList.map((d) => {
              const rem = Math.max(0, d.amount - d.paid);
              return (
                <div key={d.id} style={{ padding: 14, borderRadius: 14, background: 'var(--surface-subtle)', border: '1px solid var(--surface-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>{d.name}</span>
                    <span style={{ color: rem > 0 ? '#DC2626' : '#16A34A', fontWeight: 700 }}>{formatMoney(rem)}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>{d.note || t('common.no_note')}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{t('common.total')}: {formatMoney(d.amount)}</div>
                    <Button size="small" type="primary" disabled={d.status === DEBT_STATUS.SETTLED} onClick={() => setPayTarget(d)}>
                      {t('debts.pay_button')}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Đi vay (Borrowing) */}
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#EF4444' }}>
            {t('debts.borrowing')}
          </div>
          <div className="desktop-only">
            <Table columns={columns} dataSource={borrowingList} rowKey="id" pagination={false} style={{ width: '100%' }} />
          </div>
          <div className="mobile-only" style={{ flexDirection: 'column', gap: 12 }}>
            {borrowingList.length === 0 && (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('debts.empty_borrowing')} />
            )}
            {borrowingList.map((d) => {
              const rem = Math.max(0, d.amount - d.paid);
              return (
                <div key={d.id} style={{ padding: 14, borderRadius: 14, background: 'var(--surface-subtle)', border: '1px solid var(--surface-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>{d.name}</span>
                    <span style={{ color: rem > 0 ? '#DC2626' : '#16A34A', fontWeight: 700 }}>{formatMoney(rem)}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>{d.note || t('common.no_note')}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{t('common.total')}: {formatMoney(d.amount)}</div>
                    <Button size="small" type="primary" disabled={d.status === DEBT_STATUS.SETTLED} onClick={() => setPayTarget(d)}>
                      {t('debts.pay_button')}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add Debt Modal */}
      <Modal open={isAddOpen} onCancel={() => setIsAddOpen(false)} title={t('debts.add_new')} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleCreateDebt} style={{ marginTop: 16 }}>
          <Form.Item name="name" label={t('debts.field_name')} rules={[{ required: true }]}>
            <Input placeholder={t('debts.field_name_placeholder')} />
          </Form.Item>

          <Form.Item name="direction" label={t('debts.field_direction')} rules={[{ required: true }]}>
            <Select
              placeholder={t('debts.field_direction_placeholder')}
              options={[
                { value: DEBT_DIRECTION.LENDING, label: t('debts.opt_lending') },
                { value: DEBT_DIRECTION.BORROWING, label: t('debts.opt_borrowing') },
              ]}
            />
          </Form.Item>

          <Form.Item name="amount" label={t('debts.field_amount')} rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(v) => v?.replace(/\./g, '') as any} placeholder={t('common.amount_placeholder')} min={10000} />
          </Form.Item>

          <Form.Item name="due" label={t('debts.field_due')}>
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item name="note" label={t('common.note')}>
            <Input.TextArea rows={2} placeholder={t('debts.note_placeholder')} />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Button onClick={() => setIsAddOpen(false)} style={{ marginRight: 8 }}>{t('common.cancel')}</Button>
            <Button type="primary" htmlType="submit">{t('debts.submit_create')}</Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Pay Debt Modal */}
      <Modal open={!!payTarget} onCancel={() => setPayTarget(null)} title={t('debts.pay_modal_title', { name: payTarget?.name ?? '' })} footer={null}>
        <Form form={payForm} layout="vertical" onFinish={handlePay} style={{ marginTop: 16 }}>
          <Form.Item name="amount" label={t('debts.pay_amount_label')} rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(v) => v?.replace(/\./g, '') as any} placeholder={t('common.amount_placeholder')} min={10000} autoFocus />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Button onClick={() => setPayTarget(null)} style={{ marginRight: 8 }}>{t('common.cancel')}</Button>
            <Button type="primary" htmlType="submit">{t('debts.pay_submit')}</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
