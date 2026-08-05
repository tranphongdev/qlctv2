import React, { useState } from 'react';
import { Button, Modal, Form, Input, InputNumber, Select, message, Space, Popconfirm } from 'antd';
import { Plus, ArrowRightLeft, Building2, Smartphone, Banknote, Bitcoin, Mail, Trash2 } from 'lucide-react';
import type { AppState, Wallet } from '../types';
import { formatMoney } from '../utils/format';
import { addWallet, deleteWallet, addTransaction } from '../store/appStore';

interface WalletsProps {
  state: AppState;
  onOpenBankSync?: () => void;
}

export const Wallets: React.FC<WalletsProps> = ({ state, onOpenBankSync }) => {
  const { wallets } = state;
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [form] = Form.useForm();
  const [transferForm] = Form.useForm();

  const handleCreateWallet = (values: any) => {
    addWallet({
      name: values.name,
      type: values.type,
      bankName: values.bankName,
      accountNumber: values.accountNumber,
      balance: values.balance || 0,
      color: values.color || '#4F46E5',
      icon: values.type === 'crypto' ? 'Bitcoin' : values.type === 'e_wallet' ? 'Smartphone' : 'Building2',
    });
    message.success('Đã thêm ví tiền mới!');
    setIsAddOpen(false);
    form.resetFields();
  };

  const handleTransfer = (values: any) => {
    if (values.fromWalletId === values.toWalletId) {
      message.error('Ví nguồn và ví nhận phải khác nhau!');
      return;
    }
    const fromW = wallets.find((w) => w.id === values.fromWalletId);
    if (fromW && fromW.balance < values.amount) {
      message.error('Số dư ví nguồn không đủ!');
      return;
    }

    addTransaction({
      type: 'chuyen',
      amount: values.amount,
      category: 'cat_chuyen_khoan',
      walletId: values.fromWalletId,
      toWalletId: values.toWalletId,
      date: new Date().toISOString().slice(0, 10),
      note: values.note || 'Chuyển khoản giữa các ví',
    });

    message.success('Chuyển tiền thành công!');
    setIsTransferOpen(false);
    transferForm.resetFields();
  };

  const getWalletIcon = (type: Wallet['type']) => {
    switch (type) {
      case 'cash':
        return <Banknote size={24} color="#ffffff" />;
      case 'e_wallet':
        return <Smartphone size={24} color="#ffffff" />;
      case 'crypto':
        return <Bitcoin size={24} color="#ffffff" />;
      default:
        return <Building2 size={24} color="#ffffff" />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>Quản lý Ví & Tài khoản</div>
          <div style={{ fontSize: 13, color: '#64748b' }}>Quản lý {wallets.length} ví tiền mặt, tài khoản ngân hàng và ví điện tử</div>
        </div>

        <Space wrap>
          {onOpenBankSync && (
            <Button icon={<Mail size={16} color="#7C3AED" />} size="middle" onClick={onOpenBankSync}>
              Đồng bộ Email Ngân hàng
            </Button>
          )}
          <Button icon={<ArrowRightLeft size={16} />} size="middle" onClick={() => setIsTransferOpen(true)}>
            Chuyển tiền ví
          </Button>
          <Button type="primary" icon={<Plus size={16} />} onClick={() => setIsAddOpen(true)}>
            Thêm ví mới
          </Button>
        </Space>
      </div>

      {/* Wallet Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        {wallets.map((w) => (
          <div
            key={w.id}
            style={{
              padding: 24,
              borderRadius: 20,
              background: `linear-gradient(135deg, ${w.color} 0%, ${w.color}DD 100%)`,
              color: '#ffffff',
              boxShadow: `0 10px 25px -5px ${w.color}66`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: 180,
              cursor: 'pointer',
              transition: 'transform 0.2s ease',
              position: 'relative',
            }}
            className="wallet-card"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: 12, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {w.bankName || w.type.toUpperCase()}
                </span>
                <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>{w.name}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Popconfirm
                  title="Xóa ví tiền này?"
                  description="Bạn có chắc muốn xóa ví khỏi hệ thống?"
                  onConfirm={() => {
                    deleteWallet(w.id);
                    message.success(`Đã xóa ví ${w.name}!`);
                  }}
                  okText="Xóa"
                  cancelText="Hủy"
                  okButtonProps={{ danger: true }}
                >
                  <Button
                    type="text"
                    size="small"
                    icon={<Trash2 size={16} color="#ffffff" />}
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      borderRadius: 10,
                      width: 32,
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </Popconfirm>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {getWalletIcon(w.type)}
                </div>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 2 }}>
                STK: {w.accountNumber || '•••• •••• ••••'}
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px' }}>
                {formatMoney(w.balance)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Wallet Modal */}
      <Modal open={isAddOpen} onCancel={() => setIsAddOpen(false)} title="Thêm Ví / Tài khoản mới" footer={null}>
        <Form form={form} layout="vertical" onFinish={handleCreateWallet} style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Tên ví / Tài khoản" rules={[{ required: true, message: 'Nhập tên ví' }]}>
            <Input placeholder="Ví dụ: MB Bank, MoMo, Ví Tiền Mặt..." />
          </Form.Item>

          <Form.Item name="type" label="Loại nguồn tiền" rules={[{ required: true }]}>
            <Select
              placeholder="Chọn loại ví"
              options={[
                { value: 'bank', label: 'Tài khoản Ngân hàng (MB, VCB, TCB...)' },
                { value: 'cash', label: 'Tiền mặt' },
                { value: 'e_wallet', label: 'Ví điện tử (MoMo, ZaloPay...)' },
                { value: 'crypto', label: 'Crypto / Crypto Wallet' },
                { value: 'usd', label: 'Ví Ngoại tệ USD' },
              ]}
            />
          </Form.Item>

          <Form.Item name="bankName" label="Tên ngân hàng / Nhà cung cấp">
            <Input placeholder="MB Bank, Vietcombank, Techcombank..." />
          </Form.Item>

          <Form.Item name="accountNumber" label="Số tài khoản / Số điện thoại">
            <Input placeholder="Ví dụ: 0987654321" />
          </Form.Item>

          <Form.Item name="balance" label="Số dư ban đầu (VNĐ)">
            <InputNumber style={{ width: '100%' }} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(v) => v?.replace(/\./g, '') as any} placeholder="0" min={0} />
          </Form.Item>

          <Form.Item name="color" label="Màu đại diện card">
            <Input type="color" defaultValue="#4F46E5" style={{ width: 80, height: 40, padding: 0 }} />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Button onClick={() => setIsAddOpen(false)} style={{ marginRight: 8 }}>Hủy</Button>
            <Button type="primary" htmlType="submit">Tạo Ví</Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Transfer Between Wallets Modal */}
      <Modal open={isTransferOpen} onCancel={() => setIsTransferOpen(false)} title="🔄 Chuyển tiền giữa các Ví" footer={null}>
        <Form form={transferForm} layout="vertical" onFinish={handleTransfer} style={{ marginTop: 16 }}>
          <Form.Item name="fromWalletId" label="Ví nguồn (Trừ tiền)" rules={[{ required: true }]}>
            <Select
              placeholder="Chọn ví gửi"
              options={wallets.map((w) => ({
                value: w.id,
                label: `${w.name} (${formatMoney(w.balance)})`,
              }))}
            />
          </Form.Item>

          <Form.Item name="toWalletId" label="Ví nhận (Cộng tiền)" rules={[{ required: true }]}>
            <Select
              placeholder="Chọn ví nhận"
              options={wallets.map((w) => ({
                value: w.id,
                label: `${w.name} (${formatMoney(w.balance)})`,
              }))}
            />
          </Form.Item>

          <Form.Item name="amount" label="Số tiền chuyển (VNĐ)" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(v) => v?.replace(/\./g, '') as any} placeholder="0 VNĐ" min={1000} />
          </Form.Item>

          <Form.Item name="note" label="Ghi chú chuyển khoản">
            <Input placeholder="Rút tiền ATM, nạp tiền ví MoMo..." />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Button onClick={() => setIsTransferOpen(false)} style={{ marginRight: 8 }}>Hủy</Button>
            <Button type="primary" htmlType="submit">Xác Nhận Chuyển</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
