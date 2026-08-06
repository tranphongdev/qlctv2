import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, Select } from 'antd';
import { message } from '../../../lib/antdApp';
import { AtSign, Lock, User, Coins } from 'lucide-react';
import { motion } from 'framer-motion';
import { registerSchema } from '../schemas';
import { signUpWithUsername, normalizeUsername } from '../../../lib/auth';
import { t } from '../../../i18n';
import type { AuthUser } from '../../../lib/auth';

interface RegisterFormProps {
  onSuccess: (user: AuthUser) => void;
  onSwitchLogin: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onSwitchLogin }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: any) => {
    // Validate with Zod
    const validation = registerSchema().safeParse(values);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message;
      message.error(firstError || t('auth.register_invalid_form'));
      return;
    }

    setLoading(true);
    try {
      const username = normalizeUsername(values.username);
      const data = await signUpWithUsername(username, values.password, values.name);
      if (data.user) {
        message.success(t('auth.register_success'));
        onSuccess({
          id: data.user.id,
          username,
          // Tài khoản mới chưa có email thật; người dùng thêm sau trong trang Hồ sơ.
          email: '',
          name: values.name?.trim() || username,
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.id}`,
        });
        form.resetFields();
      }
    } catch (err: any) {
      console.error('Register error:', err);
      message.error(err.message || t('auth.register_failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in-quick">
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1E293B', marginBottom: 6 }}>{t('auth.register_title')}</h2>
        <p style={{ fontSize: 14, color: '#64748B', margin: 0 }}>
          {t('auth.register_subtitle')}
        </p>
      </div>

      <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false} initialValues={{ currency: 'VND' }}>
        <Form.Item
          name="username"
          label={<span style={{ fontWeight: 600, fontSize: 13, color: '#475569' }}>{t('auth.username_label')}</span>}
          rules={[{ required: true, message: t('validation.username_required') }]}
          extra={<span style={{ fontSize: 11 }}>{t('auth.username_hint')}</span>}
          style={{ marginBottom: 12 }}
        >
          <Input
            prefix={<AtSign size={18} color="#94A3B8" style={{ marginRight: 6 }} />}
            placeholder={t('auth.username_placeholder')}
            size="large"
            autoFocus
            autoComplete="username"
            style={{ borderRadius: 4, height: 44, fontSize: 14 }}
          />
        </Form.Item>

        {/* Tên hiển thị không bắt buộc — bỏ trống thì lấy chính username. */}
        <Form.Item
          name="name"
          label={<span style={{ fontWeight: 600, fontSize: 13, color: '#475569' }}>{t('auth.name_label_optional')}</span>}
          style={{ marginBottom: 12 }}
        >
          <Input
            prefix={<User size={18} color="#94A3B8" style={{ marginRight: 6 }} />}
            placeholder={t('auth.name_placeholder')}
            size="large"
            style={{ borderRadius: 4, height: 44, fontSize: 14 }}
          />
        </Form.Item>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <Form.Item
            name="password"
            label={<span style={{ fontWeight: 600, fontSize: 13, color: '#475569' }}>{t('auth.password_label')}</span>}
            rules={[{ required: true, message: t('validation.password_min_short'), min: 6 }]}
            style={{ marginBottom: 12 }}
          >
            <Input.Password
              prefix={<Lock size={18} color="#94A3B8" style={{ marginRight: 6 }} />}
              placeholder="••••••••"
              size="large"
              style={{ borderRadius: 4, height: 44, fontSize: 14 }}
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label={<span style={{ fontWeight: 600, fontSize: 13, color: '#475569' }}>{t('auth.confirm_password_label')}</span>}
            rules={[{ required: true, message: t('validation.confirm_required') }]}
            style={{ marginBottom: 12 }}
          >
            <Input.Password
              prefix={<Lock size={18} color="#94A3B8" style={{ marginRight: 6 }} />}
              placeholder={t('auth.confirm_password_placeholder')}
              size="large"
              style={{ borderRadius: 4, height: 44, fontSize: 14 }}
            />
          </Form.Item>
        </div>

        <Form.Item
          name="currency"
          label={<span style={{ fontWeight: 600, fontSize: 13, color: '#475569' }}>{t('auth.currency_label')}</span>}
          rules={[{ required: true, message: t('validation.currency_required_short') }]}
          style={{ marginBottom: 12 }}
        >
          <Select
            size="large"
            style={{ borderRadius: 4, height: 44 }}
            prefix={<Coins size={18} color="#94A3B8" />}
            options={[
              { value: 'VND', label: t('auth.currency_vnd') },
              { value: 'USD', label: t('auth.currency_usd') },
              { value: 'EUR', label: t('auth.currency_eur') },
            ]}
          />
        </Form.Item>

        <Form.Item name="agreeTerms" valuePropName="checked" style={{ marginBottom: 16 }}>
          <Checkbox style={{ fontSize: 13, color: '#64748B' }}>
            {t('auth.agree_prefix')} <a href="#terms" style={{ color: '#1677FF', fontWeight: 600 }}>{t('auth.terms_link')}</a> & <a href="#privacy" style={{ color: '#1677FF', fontWeight: 600 }}>{t('auth.privacy_link')}</a>
          </Checkbox>
        </Form.Item>

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
                background: 'linear-gradient(135deg, #52C41A 0%, #389E0D 100%)',
                boxShadow: '0 8px 20px rgba(82, 196, 26, 0.35)',
                border: 'none',
              }}
            >
              {t('auth.register_button')}
            </Button>
          </motion.div>
        </Form.Item>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#64748B' }}>
          {t('auth.have_account')}{' '}
          <Button
            type="link"
            onClick={onSwitchLogin}
            style={{ padding: 0, fontWeight: 700, color: '#1677FF', fontSize: 14 }}
          >
            {t('auth.login_now')}
          </Button>
        </div>
      </Form>
    </div>
  );
};
