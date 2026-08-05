import React, { useState } from 'react';
import { Modal, Form, Input, Button, Alert } from 'antd';
import { message } from '../../../lib/antdApp';
import { Mail, KeyRound, CheckCircle2 } from 'lucide-react';
import { forgotPasswordSchema } from '../schemas';

interface ForgotPasswordModalProps {
  open: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ open, onClose }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const handleResetPassword = async (values: { email: string }) => {
    // Validate with Zod
    const validation = forgotPasswordSchema.safeParse(values);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message;
      message.error(firstError || 'Vui lòng kiểm tra lại Email!');
      return;
    }

    setLoading(true);
    try {
      // Simulate API call / Supabase reset
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setSentEmail(values.email);
      setSentSuccess(true);
      message.success('Đã gửi link khôi phục mật khẩu!');
    } catch (err: any) {
      message.error('Gửi yêu cầu thất bại. Vui lòng thử lại sau!');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setSentSuccess(false);
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={handleCloseModal}
      footer={null}
      width={420}
      centered
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <KeyRound size={20} color="#1677FF" />
          <span style={{ fontWeight: 700, fontSize: 16 }}>Khôi phục Mật khẩu</span>
        </div>
      }
    >
      {sentSuccess ? (
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: 16,
              background: 'rgba(82, 196, 26, 0.1)',
              color: '#52C41A',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <CheckCircle2 size={32} />
          </div>

          <Alert
            type="success"
            showIcon={false}
            message={<div style={{ fontWeight: 700, fontSize: 15 }}>Đã gửi hướng dẫn khôi phục!</div>}
            description={
              <div style={{ fontSize: 13, marginTop: 4 }}>
                Chúng tôi đã gửi link đặt lại mật khẩu đến <b>{sentEmail}</b>. Vui lòng kiểm tra hộp thư đến hoặc Hòm thư Spam của bạn.
              </div>
            }
            style={{ borderRadius: 12, marginBottom: 20, textAlign: 'left' }}
          />

          <Button type="primary" onClick={handleCloseModal} block style={{ borderRadius: 12, fontWeight: 700 }}>
            Hoàn tất
          </Button>
        </div>
      ) : (
        <Form form={form} layout="vertical" onFinish={handleResetPassword} style={{ marginTop: 16 }}>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16, lineHeight: 1.5 }}>
            Nhập địa chỉ Email bạn đã đăng ký tài khoản. Chúng tôi sẽ gửi hướng dẫn khôi phục mật khẩu chi tiết.
          </div>

          <Form.Item
            name="email"
            label="Địa chỉ Email"
            rules={[
              { required: true, message: 'Vui lòng nhập Email' },
              { type: 'email', message: 'Email không đúng định dạng' },
            ]}
          >
            <Input prefix={<Mail size={16} color="#94a3b8" />} placeholder="example@gmail.com" size="large" style={{ borderRadius: 12 }} />
          </Form.Item>

          <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              style={{
                borderRadius: 12,
                height: 48,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #1677FF 0%, #0958D9 100%)',
                border: 'none',
              }}
            >
              Gửi Yêu Cầu Khôi Phục
            </Button>
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
};
