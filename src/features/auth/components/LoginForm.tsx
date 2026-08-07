import React, { useState } from 'react';
import { Form, Input, Button, Checkbox } from 'antd';
import { message } from '~/lib/antdApp';
import { AtSign, Lock } from 'lucide-react';
import { loginSchema } from '~/features/auth/schemas';
import { signInWithUsername, normalizeUsername } from '~/lib/auth';
import { SocialAuthButtons } from './SocialAuthButtons';
import { FieldLabel } from './FieldLabel';
import { t } from '~/i18n';
import type { AuthUser } from '~/lib/auth';

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
    <div>
      <div style={{ marginBottom: 26 }}>
        <h2 className="auth-card__title">{t('auth.login_title')}</h2>
        <p className="auth-card__subtitle">{t('auth.login_subtitle')}</p>
      </div>

      <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
        <Form.Item
          name="username"
          label={<FieldLabel>{t('auth.username_label')}</FieldLabel>}
          rules={[{ required: true, message: t('validation.username_required') }]}
        >
          <Input
            prefix={<AtSign size={18} color="#94A3B8" style={{ marginRight: 6 }} />}
            placeholder={t('auth.username_placeholder')}
            size="large"
            autoFocus
            autoComplete="username"
            style={{ height: 48, fontSize: 14 }}
          />
        </Form.Item>

        <Form.Item
          name="password"
          label={<FieldLabel>{t('auth.password_label')}</FieldLabel>}
          rules={[{ required: true, message: t('validation.password_required') }]}
          style={{ marginBottom: 12 }}
        >
          <Input.Password
            prefix={<Lock size={18} color="#94A3B8" style={{ marginRight: 6 }} />}
            placeholder="••••••••"
            size="large"
            autoComplete="current-password"
            style={{ height: 48, fontSize: 14 }}
          />
        </Form.Item>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 22 }}>
          <Form.Item name="remember" valuePropName="checked" noStyle initialValue={true}>
            <Checkbox style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t('auth.remember_me')}</Checkbox>
          </Form.Item>

          <Button
            type="link"
            size="small"
            onClick={onForgotPassword}
            style={{ padding: 0, fontWeight: 600, fontSize: 13 }}
          >
            {t('auth.forgot_password')}
          </Button>
        </div>

        <Form.Item style={{ marginBottom: 0 }}>
          <Button type="primary" htmlType="submit" loading={loading} block size="large" className="auth-submit">
            {t('auth.login_button')}
          </Button>
        </Form.Item>
      </Form>

      <SocialAuthButtons />

      <div className="auth-footnote">
        {t('auth.no_account')}{' '}
        <Button type="link" onClick={onSwitchRegister} style={{ padding: 0, fontWeight: 700, fontSize: 14 }}>
          {t('auth.register_now')}
        </Button>
      </div>
    </div>
  );
};
