import React, { useState } from 'react';
import { Progress, Button, Tag, Modal, Form, Input, InputNumber, DatePicker, message, Popconfirm } from 'antd';
import { Plus, Sparkles, CheckCircle2, Trash2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { AppState, Goal } from '../types';
import { formatMoney } from '../utils/format';
import { addGoal, depositToGoal, deleteGoal } from '../store/appStore';

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
    message.success('Đã tạo mục tiêu tiết kiệm mới!');
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
      message.success(`🎉 BẠN ĐÃ HOÀN THÀNH MỤC TIÊU ${depositGoal.name.toUpperCase()}! XIN CHÚC MỪNG!`);
    } else {
      message.success(`Đã nộp thêm ${formatMoney(depositAmount)} vào mục tiêu ${depositGoal.name}!`);
    }

    setDepositGoal(null);
    depositForm.resetFields();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>Mục tiêu Tiết kiệm</div>
          <div style={{ fontSize: 13, color: '#64748b' }}>Theo dõi tiến độ tiết kiệm mua sắm, du lịch & dự phòng tài chính</div>
        </div>

        <Button type="primary" icon={<Plus size={16} />} size="middle" style={{ borderRadius: 12 }} onClick={() => setIsAddOpen(true)}>
          Tạo Mục Tiêu Mới
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
                      Hoàn thành 🎉
                    </Tag>
                  ) : (
                    <Tag color="purple">{pct}%</Tag>
                  )}
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: 20 }}>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{g.name}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>
                  Hạn chót: {g.deadline || 'Không giới hạn'}
                </div>

                {/* Tag trên ảnh bìa đã hiện % rồi, tắt showInfo để khỏi lặp số. */}
                <Progress percent={pct} showInfo={false} strokeColor={{ '0%': '#4F46E5', '100%': '#7C3AED' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, margin: '14px 0 16px' }}>
                  <div>
                    <span style={{ color: '#64748b', fontSize: 11 }}>Đã nộp:</span>
                    <div style={{ fontWeight: 700, color: '#4F46E5' }}>{formatMoney(g.saved)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ color: '#64748b', fontSize: 11 }}>Mục tiêu:</span>
                    <div style={{ fontWeight: 700, color: '#1e293b' }}>{formatMoney(g.target)}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <Button
                    type={isDone ? 'default' : 'primary'}
                    onClick={() => setDepositGoal(g)}
                    icon={<Sparkles size={16} />}
                    style={{ borderRadius: 12, flex: 1 }}
                  >
                    {isDone ? 'Nộp Thêm Tiết Kiệm' : 'Nộp Tiền Tiết Kiệm'}
                  </Button>
                  <Popconfirm
                    title="Xóa mục tiêu này?"
                    description={`Toàn bộ tiến độ của "${g.name}" sẽ bị xóa khỏi hệ thống.`}
                    onConfirm={() => {
                      deleteGoal(g.id);
                      message.success(`Đã xóa mục tiêu ${g.name}!`);
                    }}
                    okText="Xóa"
                    cancelText="Hủy"
                    okButtonProps={{ danger: true }}
                  >
                    <Button
                      danger
                      aria-label={`Xóa mục tiêu ${g.name}`}
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
      <Modal open={isAddOpen} onCancel={() => setIsAddOpen(false)} title="Tạo Mục tiêu Tiết kiệm Mới" footer={null}>
        <Form form={form} layout="vertical" onFinish={handleCreateGoal} style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Tên mục tiêu" rules={[{ required: true, message: 'Nhập tên mục tiêu' }]}>
            <Input placeholder="Mua MacBook Pro M3, Du lịch Nhật Bản..." />
          </Form.Item>

          <Form.Item name="target" label="Số tiền mục tiêu (VNĐ)" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(v) => v?.replace(/\./g, '') as any} placeholder="0 VNĐ" min={100000} />
          </Form.Item>

          <Form.Item name="deadline" label="Hạn chót hoàn thành">
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item name="imageUrl" label="Link ảnh đại diện (Cover URL)">
            <Input placeholder="https://..." />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Button onClick={() => setIsAddOpen(false)} style={{ marginRight: 8 }}>Hủy</Button>
            <Button type="primary" htmlType="submit">Tạo Mục Tiêu</Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Deposit Modal */}
      <Modal open={!!depositGoal} onCancel={() => setDepositGoal(null)} title={`Nộp tiền tiết kiệm: ${depositGoal?.name}`} footer={null}>
        <Form form={depositForm} layout="vertical" onFinish={handleDeposit} style={{ marginTop: 16 }}>
          <Form.Item name="amount" label="Số tiền nộp (VNĐ)" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(v) => v?.replace(/\./g, '') as any} placeholder="0 VNĐ" min={10000} autoFocus />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Button onClick={() => setDepositGoal(null)} style={{ marginRight: 8 }}>Hủy</Button>
            <Button type="primary" htmlType="submit">Xác Nhận Nộp</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
