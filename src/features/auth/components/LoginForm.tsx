import React, { useState } from 'react';
import { Form, Input, Button, Checkbox } from 'antd';
import { message } from '../../../lib/antdApp';
import { AtSign, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { loginSchema } from '../schemas';
import { signInWithUsername, normalizeUsername } from '../../../lib/auth';
import { t } from '../../../i18n';
import type { AuthUser } from '../../../lib/auth';

interface LoginFormProps {
  onSuccess: (user: AuthUser) => void;
  onSwitchRegister: () => void;
  onForgotPassword: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onSwitchRegister, onForgotPassword }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: any) => {
    // Zod client validation
    const validation = loginSchema().safeParse(values);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message;
      message.error(firstError || t('auth.login_invalid_form'));
      return;
    }

    setLoading(true);
    try {
      const data = await signInWithUsername(values.username, values.password);
      if (data.user) {
        const meta = data.user.user_metadata ?? {};
        const username = (meta.username as string) || normalizeUsername(values.username);
        message.success(t('auth.login_success', { name: (meta.full_name as string) || username }));
        onSuccess({
          id: data.user.id,
          username,
          // Email nội bộ không phải email của người dùng: để rỗng cho tới khi họ
          // tự khai địa chỉ thật trong trang Hồ sơ.
          email: (meta.contact_email as string) || '',
          name: (meta.full_name as string) || username,
          avatarUrl: (meta.avatar_url as string) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.id}`,
        });
        form.resetFields();
      }
    } catch (err: any) {
      console.error('Login error:', err);
      message.error(err.message || t('auth.login_failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in-quick">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1E293B', marginBottom: 6 }}>{t('auth.login_title')}</h2>
        <p style={{ fontSize: 14, color: '#64748B', margin: 0 }}>
          {t('auth.login_subtitle')}
        </p>
      </div>

      <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
        <Form.Item
          name="username"
          label={<span style={{ fontWeight: 600, fontSize: 13, color: '#475569' }}>{t('auth.username_label')}</span>}
          rules={[{ required: true, message: t('validation.username_required') }]}
        >
          <Input
            prefix={<AtSign size={18} color="#94A3B8" style={{ marginRight: 6 }} />}
            placeholder={t('auth.username_placeholder')}
            size="large"
            autoFocus
            autoComplete="username"
            style={{ borderRadius: 4, height: 48, fontSize: 14 }}
          />
        </Form.Item>

        <Form.Item
          name="password"
          label={<span style={{ fontWeight: 600, fontSize: 13, color: '#475569' }}>{t('auth.password_label')}</span>}
          rules={[{ required: true, message: t('validation.password_required') }]}
        >
          <Input.Password
            prefix={<Lock size={18} color="#94A3B8" style={{ marginRight: 6 }} />}
            placeholder="••••••••"
            size="large"
            style={{ borderRadius: 4, height: 48, fontSize: 14 }}
          />
        </Form.Item>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <Form.Item name="remember" valuePropName="checked" noStyle initialValue={true}>
            <Checkbox style={{ fontSize: 13, color: '#64748B' }}>{t('auth.remember_me')}</Checkbox>
          </Form.Item>

          <Button
            type="link"
            size="small"
            onClick={onForgotPassword}
            style={{ padding: 0, fontWeight: 600, color: '#1677FF', fontSize: 13 }}
          >
            {t('auth.forgot_password')}
          </Button>
        </div>

        <Form.Item style={{ marginBottom: 16 }}>
          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              style={{
                height: 48,
                borderRadius: 4,
                fontSize: 15,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #1677FF 0%, #0958D9 100%)',
                boxShadow: '0 8px 20px rgba(22, 119, 255, 0.35)',
                border: 'none',
              }}
            >
              {t('auth.login_button')}
            </Button>
          </motion.div>
        </Form.Item>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: '#64748B' }}>
          {t('auth.no_account')}{' '}
          <Button
            type="link"
            onClick={onSwitchRegister}
            style={{ padding: 0, fontWeight: 700, color: '#1677FF', fontSize: 14 }}
          >
            {t('auth.register_now')}
          </Button>
        </div>
      </Form>
    </div>
  );
};
