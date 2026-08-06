import React, { useState } from 'react';
import { Button, Modal, Form, Input, InputNumber, Select, Space, Popconfirm } from 'antd';
import { message } from '../lib/antdApp';
import { Plus, ArrowRightLeft, Building2, Smartphone, Banknote, Bitcoin, Mail, Trash2, Pencil } from 'lucide-react';
import type { AppState, Wallet } from '../types';
import { formatMoney } from '../utils/format';
import { addWallet, updateWallet, deleteWallet, addTransaction } from '../store/appStore';

const WALLET_TYPE_LABEL: Record<Wallet['type'], string> = {
  bank: 'Ngân hàng',
  cash: 'Tiền mặt',
  e_wallet: 'Ví điện tử',
  crypto: 'Crypto',
  usd: 'Ngoại tệ USD',
};

/** Che số tài khoản theo kiểu thẻ ngân hàng, chỉ để lộ 4 số cuối. */
function maskAccountNumber(accountNumber?: string): string {
  const digits = (accountNumber || '').replace(/\D/g, '');
  if (digits.length < 4) return '•••• •••• •••• ••••';
  return `•••• •••• •••• ${digits.slice(-4)}`;
}

/** Biểu tượng thanh toán không tiếp xúc (4 vòng sóng) trên mặt thẻ. */
const ContactlessIcon: React.FC = () => (
  <svg width="20" height="22" viewBox="0 0 20 22" fill="none" aria-hidden="true">
    {[3, 7, 11, 15].map((x, i) => (
      <path
        key={x}
        d={`M${x} ${7 - i * 1.6}a${4 + i * 3} ${4 + i * 3} 0 0 1 0 ${8 + i * 3.2}`}
        stroke="#ffffff"
        strokeOpacity={0.85}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    ))}
  </svg>
);

interface WalletsProps {
  state: AppState;
  onOpenBankSync?: () => void;
}

export const Wallets: React.FC<WalletsProps> = ({ state, onOpenBankSync }) => {
  const { wallets } = state;
  const [isAddOpen, setIsAddOpen] = useState(false);
  /** Ví đang sửa; null nghĩa là modal đang ở chế độ thêm mới. */
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [form] = Form.useForm();
  const [transferForm] = Form.useForm();

  const openCreateModal = () => {
    setEditingWallet(null);
    form.resetFields();
    form.setFieldsValue({ color: '#4F46E5' });
    setIsAddOpen(true);
  };

  const openEditModal = (wallet: Wallet) => {
    setEditingWallet(wallet);
    form.setFieldsValue({
      name: wallet.name,
      type: wallet.type,
      bankName: wallet.bankName,
      accountNumber: wallet.accountNumber,
      balance: wallet.balance,
      color: wallet.color,
    });
    setIsAddOpen(true);
  };

  const closeWalletModal = () => {
    setIsAddOpen(false);
    setEditingWallet(null);
    form.resetFields();
  };

  const iconOfType = (type: Wallet['type']) =>
    type === 'crypto' ? 'Bitcoin' : type === 'e_wallet' ? 'Smartphone' : 'Building2';

  const handleSubmitWallet = (values: any) => {
    const fields = {
      name: values.name,
      type: values.type,
      bankName: values.bankName,
      accountNumber: values.accountNumber,
      balance: values.balance || 0,
      color: values.color || '#4F46E5',
      icon: iconOfType(values.type),
    };

    if (editingWallet) {
      // Giữ lại id và isDefault: form không có hai trường này, trải bản ghi cũ ra
      // trước thì chúng mới không bị mất khi lưu.
      updateWallet({ ...editingWallet, ...fields });
      message.success(`Đã cập nhật ví ${fields.name}!`);
    } else {
      addWallet(fields);
      message.success('Đã thêm ví tiền mới!');
    }

    closeWalletModal();
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
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Quản lý {wallets.length} ví tiền mặt, tài khoản ngân hàng và ví điện tử</div>
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
          <Button type="primary" icon={<Plus size={16} />} onClick={openCreateModal}>
            Thêm ví mới
          </Button>
        </Space>
      </div>

      {/* Wallet Cards Grid */}
      {/* auto-fill + trần 360px: cột không giãn theo số thẻ nên vài thẻ vẫn xếp sát
          nhau, phần dư dồn về cuối hàng thay vì thành khoảng hở giữa các thẻ. */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 360px))', gap: 16, justifyContent: 'start' }}>
        {wallets.map((w) => (
          <div
            key={w.id}
            className="bank-card"
            style={{ '--card-color': w.color, '--card-shadow': `${w.color}80` } as React.CSSProperties}
          >
            {/* Hàng trên: tên ngân hàng + tên ví, nút xóa hiện khi hover */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.85, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {w.bankName || WALLET_TYPE_LABEL[w.type]}
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {w.name}
                </div>
              </div>

              <div className="bank-card__actions">
                <Button
                  type="text"
                  size="small"
                  aria-label={`Sửa ví ${w.name}`}
                  onClick={() => openEditModal(w)}
                  icon={<Pencil size={16} color="#ffffff" />}
                  style={{
                    background: 'rgba(255,255,255,0.22)',
                    width: 30,
                    height: 30,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                />
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
                    aria-label={`Xóa ví ${w.name}`}
                    icon={<Trash2 size={16} color="#ffffff" />}
                    style={{
                      background: 'rgba(255,255,255,0.22)',
                      width: 30,
                      height: 30,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  />
                </Popconfirm>
              </div>
            </div>

            {/* Chip + biểu tượng thanh toán không tiếp xúc + icon loại ví */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="bank-card__chip" />
              <ContactlessIcon />
              <span style={{ marginLeft: 'auto', opacity: 0.9 }}>{getWalletIcon(w.type)}</span>
            </div>

            <div className="bank-card__number">{maskAccountNumber(w.accountNumber)}</div>

            {/* Hàng dưới: số dư bên trái, loại ví bên phải như dòng hiệu lực trên thẻ */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 8 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 10, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1px' }}>Số dư</div>
                <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-0.3px' }}>{formatMoney(w.balance)}</div>
              </div>
              <div style={{ fontSize: 10, opacity: 0.85, textTransform: 'uppercase', letterSpacing: '1px', whiteSpace: 'nowrap' }}>
                {WALLET_TYPE_LABEL[w.type]}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal dùng chung cho thêm mới và sửa ví */}
      <Modal
        open={isAddOpen}
        onCancel={closeWalletModal}
        title={editingWallet ? `Sửa ví ${editingWallet.name}` : 'Thêm Ví / Tài khoản mới'}
        footer={null}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleSubmitWallet} style={{ marginTop: 16 }}>
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

          <Form.Item
            name="balance"
            label={editingWallet ? 'Số dư hiện tại (VNĐ)' : 'Số dư ban đầu (VNĐ)'}
            extra={editingWallet ? 'Sửa trực tiếp ở đây là điều chỉnh số dư, không sinh giao dịch.' : undefined}
          >
            <InputNumber style={{ width: '100%' }} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(v) => v?.replace(/\./g, '') as any} placeholder="0" min={0} />
          </Form.Item>

          <Form.Item name="color" label="Màu đại diện card">
            <Input type="color" style={{ width: 80, height: 40, padding: 0 }} />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Button onClick={closeWalletModal} style={{ marginRight: 8 }}>Hủy</Button>
            <Button type="primary" htmlType="submit">{editingWallet ? 'Lưu thay đổi' : 'Tạo Ví'}</Button>
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
