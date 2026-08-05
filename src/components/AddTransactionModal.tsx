import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Select, DatePicker, TimePicker, Segmented, Upload, Button, Space, Alert } from 'antd';
import { message } from '../lib/antdApp';
import { UploadOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Category, Transaction, Wallet } from '../types';
import { addWallet } from '../store/appStore';

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
  const [txType, setTxType] = useState<'thu' | 'chi' | 'chuyen'>('chi');
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
        setTxType('chi');
        setReceiptUrl(undefined);
        form.resetFields();
        form.setFieldsValue({
          type: 'chi',
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
      name: 'Tiền mặt',
      type: 'cash',
      balance: 0,
      color: '#10B981',
      icon: 'Banknote',
      isDefault: true,
    });
    message.success('Đã tự động tạo Ví Tiền Mặt mặc định!');
  };

  const handleFinish = (values: any) => {
    if (wallets.length === 0) {
      message.error('Vui lòng tạo ít nhất 1 ví tiền trước khi lưu giao dịch!');
      return;
    }

    const data: Omit<Transaction, 'id'> = {
      type: txType,
      amount: values.amount,
      category: txType === 'chuyen' ? 'cat_chuyen_khoan' : values.category,
      walletId: values.walletId,
      toWalletId: txType === 'chuyen' ? values.toWalletId : undefined,
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
    message.success(initialData ? 'Cập nhật giao dịch thành công!' : 'Đã thêm giao dịch thành công!');
    onClose();
  };

  const handleUpload = (info: any) => {
    const file = info.file;
    const reader = new FileReader();
    reader.onload = (e) => {
      setReceiptUrl(e.target?.result as string);
      message.success('Đã tải ảnh hóa đơn!');
    };
    if (file.originFileObj) {
      reader.readAsDataURL(file.originFileObj);
    }
  };

  const filteredCategories = categories.filter((c) => c.type === (txType === 'chuyen' ? 'chi' : txType));

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={<span style={{ fontSize: 18, fontWeight: 700 }}>{initialData ? 'Sửa Giao Dịch' : 'Thêm Giao Dịch Mới'}</span>}
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
          title="Bạn chưa có ví tiền nào"
          description="Để ghi nhận giao dịch, hãy tạo ít nhất một ví tiền mặt hoặc tài khoản ngân hàng."
          action={
            <Button size="small" type="primary" icon={<PlusOutlined />} onClick={handleCreateDefaultWallet}>
              Tạo Ví Tiền Mặt Mặc Định
            </Button>
          }
          style={{ marginBottom: 16, borderRadius: 12 }}
        />
      )}
      <Form form={form} layout="vertical" onFinish={handleFinish} style={{ marginTop: 16 }}>
        {/* Type Selector */}
        <Form.Item label="Loại giao dịch">
          <Segmented
            options={[
              { label: '🔴 Chi tiêu', value: 'chi' },
              { label: '🟢 Thu nhập', value: 'thu' },
              { label: '🔄 Chuyển khoản', value: 'chuyen' },
            ]}
            value={txType}
            onChange={(val) => setTxType(val as any)}
            block
            style={{ padding: 4 }}
          />
        </Form.Item>

        {/* Amount */}
        <Form.Item
          name="amount"
          label="Số tiền (VND)"
          rules={[{ required: true, message: 'Vui lòng nhập số tiền' }]}
        >
          <InputNumber
            style={{ width: '100%'}}
            placeholder="0 ₫"
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value) => value?.replace(/\$\s?|(,*)/g, '') as any}
            autoFocus
          />
        </Form.Item>

        {/* Category & Wallet */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
          {txType !== 'chuyen' ? (
            <Form.Item
              name="category"
              label="Danh mục"
              rules={[{ required: true, message: 'Chọn danh mục' }]}
            >
              <Select
                placeholder="Chọn danh mục"
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
              label="Ví nhận tiền"
              rules={[{ required: true, message: 'Chọn ví nhận' }]}
            >
              <Select
                placeholder="Chọn ví nhận"
                options={wallets.map((w) => ({
                  value: w.id,
                  label: `${w.name} (${w.bankName || w.type})`,
                }))}
              />
            </Form.Item>
          )}

          <Form.Item
            name="walletId"
            label={txType === 'chuyen' ? 'Ví nguồn' : 'Ví / Nguồn tiền'}
            rules={[{ required: true, message: 'Chọn ví tiền' }]}
          >
            <Select
              placeholder="Chọn ví"
              options={wallets.map((w) => ({
                value: w.id,
                label: w.name,
              }))}
            />
          </Form.Item>
        </div>

        {/* Date & Time */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
          <Form.Item name="date" label="Ngày giao dịch" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item name="time" label="Giờ giao dịch">
            <TimePicker style={{ width: '100%' }} format="HH:mm" />
          </Form.Item>
        </div>

        {/* Note */}
        <Form.Item name="note" label="Ghi chú">
          <Input.TextArea rows={2} placeholder="Nhập ghi chú chi tiết..." />
        </Form.Item>

        {/* Image Receipt Upload */}
        <Form.Item label="Ảnh hóa đơn đính kèm">
          <Upload
            beforeUpload={() => false}
            onChange={handleUpload}
            maxCount={1}
            showUploadList={false}
          >
            <Button icon={<UploadOutlined />}>Tải ảnh hóa đơn lên</Button>
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
            <Button onClick={onClose}>Hủy</Button>
            <Button type="primary" htmlType="submit">
              Lưu Giao Dịch
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};
