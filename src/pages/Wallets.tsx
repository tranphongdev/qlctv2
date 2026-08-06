import React, { useState } from 'react';
import { Button, Modal, Form, Input, InputNumber, Select, Space, Popconfirm, Empty } from 'antd';
import { message } from '~/lib/antdApp';
import { Plus, ArrowRightLeft, Building2, Smartphone, Banknote, Bitcoin, Trash2, Pencil } from 'lucide-react';
import { TX_TYPE, WALLET_TYPE, type AppState, type Wallet } from '~/types';
import { formatMoney } from '~/utils/format';
import { TRANSFER_CATEGORY_ID } from '~/utils/categories';
import { addWallet, updateWallet, deleteWallet, addTransaction } from '~/store/appStore';
import { t } from '~/i18n';

/**
 * Nhãn loại ví phải tra tại thời điểm render chứ không dựng sẵn thành hằng số
 * module — hằng số sẽ đóng băng theo ngôn ngữ lúc import và không đổi khi người
 * dùng chuyển ngôn ngữ.
 */
const WALLET_TYPE_KEYS = {
  [WALLET_TYPE.BANK]: 'wallets.type_bank',
  [WALLET_TYPE.CASH]: 'wallets.type_cash',
  [WALLET_TYPE.E_WALLET]: 'wallets.type_e_wallet',
  [WALLET_TYPE.CRYPTO]: 'wallets.type_crypto',
  [WALLET_TYPE.USD]: 'wallets.type_usd',
} as const;

const walletTypeLabel = (type: Wallet['type']): string => t(WALLET_TYPE_KEYS[type]);

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
}

export const Wallets: React.FC<WalletsProps> = ({ state }) => {
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
    type === WALLET_TYPE.CRYPTO ? 'Bitcoin' : type === WALLET_TYPE.E_WALLET ? 'Smartphone' : 'Building2';

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
      message.success(t('wallets.updated', { name: fields.name }));
    } else {
      addWallet(fields);
      message.success(t('wallets.added'));
    }

    closeWalletModal();
  };

  const handleTransfer = (values: any) => {
    if (values.fromWalletId === values.toWalletId) {
      message.error(t('wallets.transfer_same_error'));
      return;
    }
    const fromW = wallets.find((w) => w.id === values.fromWalletId);
    if (fromW && fromW.balance < values.amount) {
      message.error(t('wallets.insufficient'));
      return;
    }

    addTransaction({
      type: TX_TYPE.TRANSFER,
      amount: values.amount,
      category: TRANSFER_CATEGORY_ID,
      walletId: values.fromWalletId,
      toWalletId: values.toWalletId,
      date: new Date().toISOString().slice(0, 10),
      note: values.note || t('wallets.transfer_default_note'),
    });

    message.success(t('wallets.transfer_success'));
    setIsTransferOpen(false);
    transferForm.resetFields();
  };

  const getWalletIcon = (type: Wallet['type']) => {
    switch (type) {
      case WALLET_TYPE.CASH:
        return <Banknote size={24} color="#ffffff" />;
      case WALLET_TYPE.E_WALLET:
        return <Smartphone size={24} color="#ffffff" />;
      case WALLET_TYPE.CRYPTO:
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
          <div style={{ fontSize: 20, fontWeight: 800 }}>{t('wallets.title')}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t('wallets.subtitle', { count: wallets.length })}</div>
        </div>

        <Space wrap>
          <Button icon={<ArrowRightLeft size={16} />} size="middle" onClick={() => setIsTransferOpen(true)}>
            {t('wallets.transfer')}
          </Button>
          <Button type="primary" icon={<Plus size={16} />} onClick={openCreateModal}>
            {t('wallets.add_new')}
          </Button>
        </Space>
      </div>

      {/* Wallet Cards Grid */}
      {/* auto-fill + trần 360px: cột không giãn theo số thẻ nên vài thẻ vẫn xếp sát
          nhau, phần dư dồn về cuối hàng thay vì thành khoảng hở giữa các thẻ.
          Trần này bị bỏ dưới 600px (xem .card-grid trong index.css). */}
      {/* Ngoài .card-grid: nằm trong lưới thì Empty bị bó vào bề rộng một cột. */}
      {wallets.length === 0 && (
        <div className="glass-card" style={{ padding: '40px 20px' }}>
          <Empty description={t('wallets.empty')} />
        </div>
      )}

      <div className="card-grid" style={{ '--card-min': '260px', '--card-max': '360px' } as React.CSSProperties}>
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
                  {w.bankName || walletTypeLabel(w.type)}
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {w.name}
                </div>
              </div>

              <div className="bank-card__actions">
                <Button
                  type="text"
                  size="small"
                  aria-label={t('wallets.edit_aria', { name: w.name })}
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
                  title={t('wallets.delete_title')}
                  description={t('wallets.delete_desc')}
                  onConfirm={() => {
                    deleteWallet(w.id);
                    message.success(t('wallets.deleted', { name: w.name }));
                  }}
                  okText={t('common.delete')}
                  cancelText={t('common.cancel')}
                  okButtonProps={{ danger: true }}
                >
                  <Button
                    type="text"
                    size="small"
                    aria-label={t('wallets.delete_aria', { name: w.name })}
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
                <div style={{ fontSize: 10, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1px' }}>{t('wallets.balance_label')}</div>
                <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-0.3px' }}>{formatMoney(w.balance)}</div>
              </div>
              <div style={{ fontSize: 10, opacity: 0.85, textTransform: 'uppercase', letterSpacing: '1px', whiteSpace: 'nowrap' }}>
                {walletTypeLabel(w.type)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal dùng chung cho thêm mới và sửa ví */}
      <Modal
        open={isAddOpen}
        onCancel={closeWalletModal}
        title={editingWallet ? t('wallets.modal_edit_title', { name: editingWallet.name }) : t('wallets.modal_add_title')}
        footer={null}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleSubmitWallet} style={{ marginTop: 16 }}>
          <Form.Item name="name" label={t('wallets.field_name')} rules={[{ required: true, message: t('wallets.field_name_required') }]}>
            <Input placeholder={t('wallets.field_name_placeholder')} />
          </Form.Item>

          <Form.Item name="type" label={t('wallets.field_type')} rules={[{ required: true }]}>
            <Select
              placeholder={t('wallets.field_type_placeholder')}
              options={[
                { value: WALLET_TYPE.BANK, label: t('wallets.opt_bank') },
                { value: WALLET_TYPE.CASH, label: t('wallets.opt_cash') },
                { value: WALLET_TYPE.E_WALLET, label: t('wallets.opt_e_wallet') },
                { value: WALLET_TYPE.CRYPTO, label: t('wallets.opt_crypto') },
                { value: WALLET_TYPE.USD, label: t('wallets.opt_usd') },
              ]}
            />
          </Form.Item>

          <Form.Item name="bankName" label={t('wallets.field_bank_name')}>
            <Input placeholder="MB Bank, Vietcombank, Techcombank..." />
          </Form.Item>

          <Form.Item name="accountNumber" label={t('wallets.field_account')}>
            <Input placeholder={t('wallets.field_account_placeholder')} />
          </Form.Item>

          <Form.Item
            name="balance"
            label={editingWallet ? t('wallets.field_balance_edit') : t('wallets.field_balance_new')}
            extra={editingWallet ? t('wallets.field_balance_hint') : undefined}
          >
            <InputNumber style={{ width: '100%' }} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(v) => v?.replace(/\./g, '') as any} placeholder="0" min={0} />
          </Form.Item>

          <Form.Item name="color" label={t('wallets.field_color')}>
            <Input type="color" style={{ width: 80, height: 40, padding: 0 }} />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Button onClick={closeWalletModal} style={{ marginRight: 8 }}>{t('common.cancel')}</Button>
            <Button type="primary" htmlType="submit">{editingWallet ? t('common.save_changes') : t('wallets.submit_create')}</Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Transfer Between Wallets Modal */}
      <Modal open={isTransferOpen} onCancel={() => setIsTransferOpen(false)} title={t('wallets.transfer_title')} footer={null}>
        <Form form={transferForm} layout="vertical" onFinish={handleTransfer} style={{ marginTop: 16 }}>
          <Form.Item name="fromWalletId" label={t('wallets.from_label')} rules={[{ required: true }]}>
            <Select
              placeholder={t('wallets.from_placeholder')}
              options={wallets.map((w) => ({
                value: w.id,
                label: `${w.name} (${formatMoney(w.balance)})`,
              }))}
            />
          </Form.Item>

          <Form.Item name="toWalletId" label={t('wallets.to_label')} rules={[{ required: true }]}>
            <Select
              placeholder={t('wallets.to_placeholder')}
              options={wallets.map((w) => ({
                value: w.id,
                label: `${w.name} (${formatMoney(w.balance)})`,
              }))}
            />
          </Form.Item>

          <Form.Item name="amount" label={t('wallets.transfer_amount')} rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(v) => v?.replace(/\./g, '') as any} placeholder={t('common.amount_placeholder')} min={1000} />
          </Form.Item>

          <Form.Item name="note" label={t('wallets.transfer_note')}>
            <Input placeholder={t('wallets.transfer_note_placeholder')} />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Button onClick={() => setIsTransferOpen(false)} style={{ marginRight: 8 }}>{t('common.cancel')}</Button>
            <Button type="primary" htmlType="submit">{t('wallets.transfer_submit')}</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
