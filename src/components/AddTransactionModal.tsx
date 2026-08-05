import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Select, DatePicker, TimePicker, Segmented, Upload, Button, message, Space, Tag } from 'antd';
import { UploadOutlined, TagOutlined, UserOutlined, EnvironmentOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Category, Transaction, Wallet } from '../types';

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
  const [tags, setTags] = useState<string[]>([]);
  const [inputTag, setInputTag] = useState('');

  useEffect(() => {
    if (open) {
      if (initialData) {
        setTxType(initialData.type);
        setReceiptUrl(initialData.receiptUrl);
        setTags(initialData.tags || []);
        form.setFieldsValue({
          type: initialData.type,
          amount: initialData.amount,
          category: initialData.category,
          walletId: initialData.walletId,
          toWalletId: initialData.toWalletId,
          date: dayjs(initialData.date),
          time: initialData.time ? dayjs(initialData.time, 'HH:mm') : dayjs(),
          note: initialData.note,
          location: initialData.location,
          counterparty: initialData.counterparty,
          recurring: initialData.recurring || 'none',
        });
      } else {
        setTxType('chi');
        setReceiptUrl(undefined);
        setTags([]);
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

  const handleFinish = (values: any) => {
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
      tags: tags,
      location: values.location,
      counterparty: values.counterparty,
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

  const addTag = () => {
    if (inputTag.trim() && !tags.includes(inputTag.trim())) {
      setTags([...tags, inputTag.trim()]);
      setInputTag('');
    }
  };

  const removeTag = (removedTag: string) => {
    setTags(tags.filter((t) => t !== removedTag));
  };

  const filteredCategories = categories.filter((c) => c.type === (txType === 'chuyen' ? 'chi' : txType));

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={<span style={{ fontSize: 18, fontWeight: 700 }}>{initialData ? 'Sửa Giao Dịch' : 'Thêm Giao Dịch Mới'}</span>}
      footer={null}
      width={Math.min(560, typeof window !== 'undefined' ? window.innerWidth : 560)}
      destroyOnClose
    >
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
            style={{ width: '100%', borderRadius: 14 }}
            placeholder="0 ₫"
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value) => value?.replace(/\$\s?|(,*)/g, '') as any}
            size="large"
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
              <Select placeholder="Chọn danh mục">
                {filteredCategories.map((cat) => (
                  <Select.Option key={cat.id} value={cat.id}>
                    <span style={{ color: cat.color, marginRight: 6 }}>●</span>
                    {cat.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          ) : (
            <Form.Item
              name="toWalletId"
              label="Ví nhận tiền"
              rules={[{ required: true, message: 'Chọn ví nhận' }]}
            >
              <Select placeholder="Chọn ví nhận">
                {wallets.map((w) => (
                  <Select.Option key={w.id} value={w.id}>
                    {w.name} ({w.bankName || w.type})
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Form.Item
            name="walletId"
            label={txType === 'chuyen' ? 'Ví nguồn' : 'Ví / Nguồn tiền'}
            rules={[{ required: true, message: 'Chọn ví tiền' }]}
          >
            <Select placeholder="Chọn ví">
              {wallets.map((w) => (
                <Select.Option key={w.id} value={w.id}>
                  {w.name}
                </Select.Option>
              ))}
            </Select>
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

        {/* Location & Counterparty */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
          <Form.Item name="location" label="Địa điểm">
            <Input prefix={<EnvironmentOutlined color="#94a3b8" />} placeholder="Nhà hàng, TTTM..." />
          </Form.Item>
          <Form.Item name="counterparty" label="Người liên quan">
            <Input prefix={<UserOutlined color="#94a3b8" />} placeholder="Tên bạn bè, chủ nhà..." />
          </Form.Item>
        </div>

        {/* Tags */}
        <Form.Item label="Thẻ (Tags)">
          <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            {tags.map((tag) => (
              <Tag key={tag} closable onClose={() => removeTag(tag)} color="purple">
                {tag}
              </Tag>
            ))}
          </div>
          <Space.Compact style={{ width: '100%' }}>
            <Input
              prefix={<TagOutlined color="#94a3b8" />}
              placeholder="Thêm thẻ (Ví dụ: Work, Bạn bè...)"
              value={inputTag}
              onChange={(e) => setInputTag(e.target.value)}
              onPressEnter={(e) => {
                e.preventDefault();
                addTag();
              }}
            />
            <Button onClick={addTag}>Thêm</Button>
          </Space.Compact>
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
            <Button type="primary" htmlType="submit" size="large" style={{ borderRadius: 12, minWidth: 120 }}>
              Lưu Giao Dịch
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};
