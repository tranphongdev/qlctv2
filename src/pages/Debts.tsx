import React, { useState } from 'react';
import { Table, Button, Tag, Modal, Form, Input, InputNumber, Select, DatePicker, message } from 'antd';
import { Plus, CheckCircle, Clock } from 'lucide-react';
import type { AppState, Debt } from '../types';
import { formatMoney } from '../utils/format';
import { addDebt, payDebt } from '../store/appStore';

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
    message.success('Đã thêm khoản nợ mới!');
    setIsAddOpen(false);
    form.resetFields();
  };

  const handlePay = (values: any) => {
    if (!payTarget) return;
    payDebt(payTarget.id, values.amount);
    message.success(`Đã cập nhật thanh toán ${formatMoney(values.amount)}!`);
    setPayTarget(null);
    payForm.resetFields();
  };

  const lendingList = debts.filter((d) => d.direction === 'toi_no');
  const borrowingList = debts.filter((d) => d.direction === 'no_toi');

  const columns = [
    {
      title: 'Tên đối tác / Khoản nợ',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Debt) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{name}</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>{record.note || 'Không có ghi chú'}</div>
        </div>
      ),
    },
    {
      title: 'Tổng số tiền',
      dataIndex: 'amount',
      key: 'amount',
      render: (val: number) => <span style={{ fontWeight: 700 }}>{formatMoney(val)}</span>,
    },
    {
      title: 'Đã thanh toán',
      dataIndex: 'paid',
      key: 'paid',
      render: (val: number) => <span style={{ color: '#16A34A', fontWeight: 600 }}>{formatMoney(val)}</span>,
    },
    {
      title: 'Còn lại',
      key: 'remaining',
      render: (_: any, record: Debt) => {
        const rem = Math.max(0, record.amount - record.paid);
        return <span style={{ color: rem > 0 ? '#DC2626' : '#16A34A', fontWeight: 700 }}>{formatMoney(rem)}</span>;
      },
    },
    {
      title: 'Hạn trả',
      dataIndex: 'due',
      key: 'due',
      render: (due: string | null) => (due ? <Tag color="orange">{due}</Tag> : <span style={{ color: '#94a3b8' }}>Chưa đặt</span>),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) =>
        status === 'settled' ? (
          <Tag color="green" icon={<CheckCircle size={12} />}>Đã tất toán</Tag>
        ) : (
          <Tag color="volcano" icon={<Clock size={12} />}>Đang theo dõi</Tag>
        ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: Debt) => (
        <Button
          size="small"
          type="primary"
          disabled={record.status === 'settled'}
          onClick={() => setPayTarget(record)}
        >
          Cập nhật trả tiền
        </Button>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>Sổ Nợ & Cho Vay</div>
          <div style={{ fontSize: 13, color: '#64748b' }}>Theo dõi người khác nợ bạn (Cho vay) và các khoản bạn nợ (Đi vay)</div>
        </div>

        <Button type="primary" icon={<Plus size={16} />} size="middle" style={{ borderRadius: 12 }} onClick={() => setIsAddOpen(true)}>
          Thêm Khoản Nợ Mới
        </Button>
      </div>

      {/* Tables & Mobile Cards Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Cho vay (Lending) */}
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#22C55E' }}>
            🟢 CHO VAY (Người khác nợ bạn)
          </div>
          <div className="desktop-only">
            <Table columns={columns} dataSource={lendingList} rowKey="id" pagination={false} style={{ width: '100%' }} />
          </div>
          <div className="mobile-only" style={{ flexDirection: 'column', gap: 12 }}>
            {lendingList.map((d) => {
              const rem = Math.max(0, d.amount - d.paid);
              return (
                <div key={d.id} style={{ padding: 14, borderRadius: 14, background: 'rgba(248, 250, 252, 0.6)', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>{d.name}</span>
                    <span style={{ color: rem > 0 ? '#DC2626' : '#16A34A', fontWeight: 700 }}>{formatMoney(rem)}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>{d.note || 'Không có ghi chú'}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>Tổng: {formatMoney(d.amount)}</div>
                    <Button size="small" type="primary" disabled={d.status === 'settled'} onClick={() => setPayTarget(d)}>
                      Trả tiền
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
            🔴 ĐI VAY (Bạn nợ người khác)
          </div>
          <div className="desktop-only">
            <Table columns={columns} dataSource={borrowingList} rowKey="id" pagination={false} style={{ width: '100%' }} />
          </div>
          <div className="mobile-only" style={{ flexDirection: 'column', gap: 12 }}>
            {borrowingList.map((d) => {
              const rem = Math.max(0, d.amount - d.paid);
              return (
                <div key={d.id} style={{ padding: 14, borderRadius: 14, background: 'rgba(248, 250, 252, 0.6)', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>{d.name}</span>
                    <span style={{ color: rem > 0 ? '#DC2626' : '#16A34A', fontWeight: 700 }}>{formatMoney(rem)}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>{d.note || 'Không có ghi chú'}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>Tổng: {formatMoney(d.amount)}</div>
                    <Button size="small" type="primary" disabled={d.status === 'settled'} onClick={() => setPayTarget(d)}>
                      Trả tiền
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add Debt Modal */}
      <Modal open={isAddOpen} onCancel={() => setIsAddOpen(false)} title="Thêm Khoản Nợ Mới" footer={null}>
        <Form form={form} layout="vertical" onFinish={handleCreateDebt} style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Tên người vay / Tổ chức" rules={[{ required: true }]}>
            <Input placeholder="Anh Nam, Vay Ngân hàng..." />
          </Form.Item>

          <Form.Item name="direction" label="Loại nợ" rules={[{ required: true }]}>
            <Select placeholder="Chọn loại nợ">
              <Select.Option value="toi_no">🟢 Cho vay (Người khác nợ tôi)</Select.Option>
              <Select.Option value="no_toi">🔴 Đi vay (Tôi nợ người khác)</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="amount" label="Số tiền nợ (VNĐ)" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(v) => v?.replace(/\./g, '') as any} placeholder="0 VNĐ" min={10000} />
          </Form.Item>

          <Form.Item name="due" label="Ngày hẹn trả">
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea rows={2} placeholder="Nhập chi tiết khoản nợ..." />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Button onClick={() => setIsAddOpen(false)} style={{ marginRight: 8 }}>Hủy</Button>
            <Button type="primary" htmlType="submit">Tạo Khoản Nợ</Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Pay Debt Modal */}
      <Modal open={!!payTarget} onCancel={() => setPayTarget(null)} title={`Ghi nhận thanh toán: ${payTarget?.name}`} footer={null}>
        <Form form={payForm} layout="vertical" onFinish={handlePay} style={{ marginTop: 16 }}>
          <Form.Item name="amount" label="Số tiền trả (VNĐ)" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%', fontSize: 18 }} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(v) => v?.replace(/\./g, '') as any} placeholder="0 VNĐ" min={10000} autoFocus />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Button onClick={() => setPayTarget(null)} style={{ marginRight: 8 }}>Hủy</Button>
            <Button type="primary" htmlType="submit">Xác Nhận Thanh Toán</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
