import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Select, DatePicker, TimePicker, Segmented, Upload, Button, Space, Alert } from 'antd';
import { message } from '~/lib/antdApp';
import { UploadOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { TX_TYPE, WALLET_TYPE, type Category, type Transaction, type TxType, type Wallet } from '~/types';
import { addWallet } from '~/store/appStore';
import { TRANSFER_CATEGORY_ID } from '~/utils/categories';
import { t } from '~/i18n';

interface AddTransactionModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (tx: Omit<Transaction, 'id'>) => void;
  wallets: Wallet[];
  categories: Category[];
  initialData?: Transaction | null;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  open,
  onClose,
  onSave,
  wallets,
  categories,
  initialData,
}) => {
  const [form] = Form.useForm();
  const [txType, setTxType] = useState<TxType>(TX_TYPE.EXPENSE);
  const [receiptUrl, setReceiptUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (open) {
      if (initialData) {
        setTxType(initialData.type);
        setReceiptUrl(initialData.receiptUrl);
        form.setFieldsValue({
          type: initialData.type,
          amount: initialData.amount,
          category: initialData.category,
          walletId: initialData.walletId,
          toWalletId: initialData.toWalletId,
          date: dayjs(initialData.date),
          time: initialData.time ? dayjs(initialData.time, 'HH:mm') : dayjs(),
          note: initialData.note,
          recurring: initialData.recurring || 'none',
        });
      } else {
        setTxType(TX_TYPE.EXPENSE);
        setReceiptUrl(undefined);
        form.resetFields();
        form.setFieldsValue({
          type: TX_TYPE.EXPENSE,
          walletId: wallets[0]?.id || '',
          date: dayjs(),
          time: dayjs(),
          recurring: 'none',
        });
      }
    }
  }, [open, initialData, form, wallets]);

  const handleCreateDefaultWallet = () => {
    addWallet({
      name: t('atm.default_wallet_name'),
      type: WALLET_TYPE.CASH,
      balance: 0,
      color: '#10B981',
      icon: 'Banknote',
      isDefault: true,
    });
    message.success(t('atm.default_wallet_created'));
  };

  const handleFinish = (values: any) => {
    if (wallets.length === 0) {
      message.error(t('atm.need_wallet_error'));
      return;
    }

    const data: Omit<Transaction, 'id'> = {
      type: txType,
      amount: values.amount,
      category: txType === TX_TYPE.TRANSFER ? TRANSFER_CATEGORY_ID : values.category,
      walletId: values.walletId,
      toWalletId: txType === TX_TYPE.TRANSFER ? values.toWalletId : undefined,
      date: values.date.format('YYYY-MM-DD'),
      time: values.time ? values.time.format('HH:mm') : undefined,
      note: values.note,
      receiptUrl: receiptUrl,
      tags: initialData?.tags,
      location: initialData?.location,
      counterparty: initialData?.counterparty,
      recurring: values.recurring,
      status: 'completed',
    };

    onSave(data);
    message.success(initialData ? t('atm.updated') : t('atm.added'));
    onClose();
  };

  const handleUpload = (info: any) => {
    const file = info.file;
    const reader = new FileReader();
    reader.onload = (e) => {
      setReceiptUrl(e.target?.result as string);
      message.success(t('atm.receipt_uploaded'));
    };
    if (file.originFileObj) {
      reader.readAsDataURL(file.originFileObj);
    }
  };

  const filteredCategories = categories.filter(
    (c) => c.type === (txType === TX_TYPE.TRANSFER ? TX_TYPE.EXPENSE : txType),
  );

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={<span style={{ fontSize: 18, fontWeight: 700 }}>{initialData ? t('atm.title_edit') : t('atm.title_add')}</span>}
      footer={null}
      // width={Math.min(560, typeof window !== 'undefined' ? window.innerWidth : 560)}
      // style={{ top: 20 }}
      // styles={{
      //   body: {
      //     maxHeight: 'calc(80vh - 40px)',
      //     overflowY: 'auto',
      //     paddingRight: 8,
      //   },
      // }}
      destroyOnHidden
    >
      {wallets.length === 0 && (
        <Alert
          type="warning"
          showIcon
          title={t('atm.no_wallet_title')}
          description={t('atm.no_wallet_desc')}
          action={
            <Button size="small" type="primary" icon={<PlusOutlined />} onClick={handleCreateDefaultWallet}>
              {t('atm.create_default_wallet')}
            </Button>
          }
          style={{ marginBottom: 16, borderRadius: 12 }}
        />
      )}
      <Form form={form} layout="vertical" onFinish={handleFinish} style={{ marginTop: 16 }}>
        {/* Type Selector */}
        <Form.Item label={t('atm.type_label')}>
          <Segmented
            options={[
              { label: t('atm.type_expense'), value: TX_TYPE.EXPENSE },
              { label: t('atm.type_income'), value: TX_TYPE.INCOME },
              { label: t('atm.type_transfer'), value: TX_TYPE.TRANSFER },
            ]}
            value={txType}
            onChange={(val) => setTxType(val as TxType)}
            block
            style={{ padding: 4 }}
          />
        </Form.Item>

        {/* Amount */}
        <Form.Item
          name="amount"
          label={t('atm.amount_label')}
          rules={[{ required: true, message: t('atm.amount_required') }]}
        >
          <InputNumber
            style={{ width: '100%'}}
            placeholder={t('common.amount_placeholder')}
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value) => value?.replace(/\$\s?|(,*)/g, '') as any}
            autoFocus
          />
        </Form.Item>

        {/* Category & Wallet */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
          {txType !== TX_TYPE.TRANSFER ? (
            <Form.Item
              name="category"
              label={t('atm.category_label')}
              rules={[{ required: true, message: t('atm.category_required') }]}
            >
              <Select
                placeholder={t('atm.category_required')}
                options={filteredCategories.map((cat) => ({
                  value: cat.id,
                  label: (
                    <span>
                      <span style={{ color: cat.color, marginRight: 6 }}>●</span>
                      {cat.name}
                    </span>
                  ),
                }))}
              />
            </Form.Item>
          ) : (
            <Form.Item
              name="toWalletId"
              label={t('atm.to_wallet_label')}
              rules={[{ required: true, message: t('atm.to_wallet_required') }]}
            >
              <Select
                placeholder={t('atm.to_wallet_required')}
                options={wallets.map((w) => ({
                  value: w.id,
                  label: `${w.name} (${w.bankName || w.type})`,
                }))}
              />
            </Form.Item>
          )}

          <Form.Item
            name="walletId"
            label={txType === TX_TYPE.TRANSFER ? t('atm.from_wallet_label') : t('atm.wallet_label')}
            rules={[{ required: true, message: t('atm.wallet_required') }]}
          >
            <Select
              placeholder={t('atm.wallet_placeholder')}
              options={wallets.map((w) => ({
                value: w.id,
                label: w.name,
              }))}
            />
          </Form.Item>
        </div>

        {/* Date & Time */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
          <Form.Item name="date" label={t('atm.date_label')} rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item name="time" label={t('atm.time_label')}>
            <TimePicker style={{ width: '100%' }} format="HH:mm" />
          </Form.Item>
        </div>

        {/* Note */}
        <Form.Item name="note" label={t('common.note')}>
          <Input.TextArea rows={2} placeholder={t('atm.note_placeholder')} />
        </Form.Item>

        {/* Image Receipt Upload */}
        <Form.Item label={t('atm.receipt_label')}>
          <Upload
            beforeUpload={() => false}
            onChange={handleUpload}
            maxCount={1}
            showUploadList={false}
          >
            <Button icon={<UploadOutlined />}>{t('atm.receipt_upload')}</Button>
          </Upload>
          {receiptUrl && (
            <div style={{ marginTop: 10 }}>
              <img
                src={receiptUrl}
                alt="Receipt"
                style={{ maxHeight: 120, borderRadius: 12, border: '1px solid #cbd5e1' }}
              />
            </div>
          )}
        </Form.Item>

        {/* Submit */}
        <Form.Item style={{ marginBottom: 0, marginTop: 16, textAlign: 'right' }}>
          <Space>
            <Button onClick={onClose}>{t('common.cancel')}</Button>
            <Button type="primary" htmlType="submit">
              {t('atm.submit')}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};
