import React, { useState } from 'react';
import { Modal, Form, Input, Button, Alert } from 'antd';
import { message } from '~/lib/antdApp';
import { Mail, KeyRound, CheckCircle2 } from 'lucide-react';
import { forgotPasswordSchema } from '~/features/auth/schemas';
import { t } from '~/i18n';

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
    const validation = forgotPasswordSchema().safeParse(values);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message;
      message.error(firstError || t('forgot.invalid_email'));
      return;
    }

    setLoading(true);
    try {
      // Simulate API call / Supabase reset
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setSentEmail(values.email);
      setSentSuccess(true);
      message.success(t('forgot.success'));
    } catch (err: any) {
      message.error(t('forgot.failed'));
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
      // KHÔNG dùng prop `centered`: nó thêm pseudo-element ::before cao 100% vào
      // .ant-modal-wrap, mà wrap đang là flex column (xem index.css) nên pseudo
      // đó thành một flex item nuốt trọn chiều cao và đẩy modal xuống đáy màn
      // hình. Quy tắc chung ở index.css đã canh giữa mọi modal rồi.
      //
      // Trang xác thực chạy ở bảng màu sáng; class dưới ghim modal theo cùng bộ
      // token (xem .auth-modal-wrap trong index.css).
      wrapClassName="auth-modal-wrap"
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Hex chứ không var(--primary-color): lucide đổ giá trị này vào thuộc
              tính stroke của SVG, mà var() chỉ hoạt động trong thuộc tính CSS. */}
          <KeyRound size={20} color="#4F46E5" />
          <span style={{ fontWeight: 700, fontSize: 16 }}>{t('forgot.title')}</span>
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
              background: 'var(--tint-income)',
              color: 'var(--success-color)',
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
            message={<div style={{ fontWeight: 700, fontSize: 15 }}>{t('forgot.sent_title')}</div>}
            description={
              <div style={{ fontSize: 13, marginTop: 4 }}>
                {t('forgot.sent_desc_prefix')} <b>{sentEmail}</b>. {t('forgot.sent_desc_suffix')}
              </div>
            }
            style={{ marginBottom: 20, textAlign: 'left' }}
          />

          <Button type="primary" onClick={handleCloseModal} block style={{ fontWeight: 700 }}>
            {t('forgot.done')}
          </Button>
        </div>
      ) : (
        <Form form={form} layout="vertical" onFinish={handleResetPassword} style={{ marginTop: 16 }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.5 }}>
            {t('forgot.description')}
          </div>

          <Form.Item
            name="email"
            label={t('auth.email_label')}
            rules={[
              { required: true, message: t('validation.email_short') },
              { type: 'email', message: t('validation.email_format') },
            ]}
          >
            <Input prefix={<Mail size={16} color="#94A3B8" style={{ marginRight: 6 }} />} placeholder="example@gmail.com" size="large" style={{ height: 46 }} />
          </Form.Item>

          <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" loading={loading} block size="large" className="auth-submit">
              {t('forgot.submit')}
            </Button>
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
};
