import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, Select } from 'antd';
import { message } from '~/lib/antdApp';
import { AtSign, Lock, Coins } from 'lucide-react';
import { registerSchema } from '~/features/auth/schemas';
import { signUpWithUsername, normalizeUsername } from '~/lib/auth';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import { SocialAuthButtons } from './SocialAuthButtons';
import { FieldLabel } from './FieldLabel';
import { t } from '~/i18n';
import type { AuthUser } from '~/lib/auth';

interface RegisterFormProps {
  onSuccess: (user: AuthUser) => void;
  onSwitchLogin: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onSwitchLogin }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  // Thanh đo độ mạnh phải vẽ lại theo từng ký tự, nên giá trị mật khẩu được
  // theo dõi riêng thay vì chỉ nằm trong store nội bộ của Form.
  const password = Form.useWatch('password', form) ?? '';

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
      // Không truyền tên hiển thị: form đăng ký chỉ hỏi username và mật khẩu,
      // tên hiển thị mặc định bằng username và sửa được trong trang Hồ sơ.
      const data = await signUpWithUsername(username, values.password);
      if (data.user) {
        message.success(t('auth.register_success'));
        onSuccess({
          id: data.user.id,
          username,
          // Tài khoản mới chưa có email thật; người dùng thêm sau trong trang Hồ sơ.
          email: '',
          name: username,
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
    <div>
      <div style={{ marginBottom: 22 }}>
        <h2 className="auth-card__title">{t('auth.register_title')}</h2>
        <p className="auth-card__subtitle">{t('auth.register_subtitle')}</p>
      </div>

      <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false} initialValues={{ currency: 'VND' }}>
        <Form.Item
          name="username"
          label={<FieldLabel>{t('auth.username_label')}</FieldLabel>}
          rules={[{ required: true, message: t('validation.username_required') }]}
          extra={<span style={{ fontSize: 11 }}>{t('auth.username_hint')}</span>}
          style={{ marginBottom: 14 }}
        >
          <Input
            prefix={<AtSign size={18} color="#94A3B8" style={{ marginRight: 6 }} />}
            placeholder={t('auth.username_placeholder')}
            size="large"
            autoFocus
            autoComplete="username"
            style={{ height: 46, fontSize: 14 }}
          />
        </Form.Item>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
          <Form.Item
            name="password"
            label={<FieldLabel>{t('auth.password_label')}</FieldLabel>}
            rules={[{ required: true, message: t('validation.password_min_short'), min: 6 }]}
            style={{ marginBottom: 8 }}
          >
            <Input.Password
              prefix={<Lock size={18} color="#94A3B8" style={{ marginRight: 6 }} />}
              placeholder="••••••••"
              size="large"
              autoComplete="new-password"
              style={{ height: 46, fontSize: 14 }}
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label={<FieldLabel>{t('auth.confirm_password_label')}</FieldLabel>}
            // dependencies + validator: quy tắc này đọc giá trị của ô khác nên
            // phải được chạy lại mỗi khi ô mật khẩu đổi.
            dependencies={['password']}
            rules={[
              { required: true, message: t('validation.confirm_required') },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) return Promise.resolve();
                  return Promise.reject(new Error(t('validation.password_mismatch')));
                },
              }),
            ]}
            style={{ marginBottom: 8 }}
          >
            <Input.Password
              prefix={<Lock size={18} color="#94A3B8" style={{ marginRight: 6 }} />}
              placeholder={t('auth.confirm_password_placeholder')}
              size="large"
              autoComplete="new-password"
              style={{ height: 46, fontSize: 14 }}
            />
          </Form.Item>
        </div>

        <PasswordStrengthMeter password={password} />

        <Form.Item
          name="currency"
          label={<FieldLabel>{t('auth.currency_label')}</FieldLabel>}
          rules={[{ required: true, message: t('validation.currency_required_short') }]}
          style={{ marginBottom: 14 }}
        >
          <Select
            size="large"
            style={{ height: 46 }}
            prefix={<Coins size={18} color="#94A3B8" />}
            options={[
              { value: 'VND', label: t('auth.currency_vnd') },
              { value: 'USD', label: t('auth.currency_usd') },
              { value: 'EUR', label: t('auth.currency_eur') },
            ]}
          />
        </Form.Item>

        <Form.Item
          name="agreeTerms"
          valuePropName="checked"
          // Zod đã chặn ở handleSubmit, nhưng báo lỗi ngay tại ô tick vẫn rõ hơn
          // một dòng toast chung chung ở góc màn hình.
          rules={[
            {
              validator: (_, value) =>
                value ? Promise.resolve() : Promise.reject(new Error(t('validation.terms_required'))),
            },
          ]}
          style={{ marginBottom: 18 }}
        >
          <Checkbox style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {t('auth.agree_prefix')}{' '}
            <a href="#terms" style={{ color: 'var(--primary-color)', fontWeight: 600 }}>{t('auth.terms_link')}</a>
            {' & '}
            <a href="#privacy" style={{ color: 'var(--primary-color)', fontWeight: 600 }}>{t('auth.privacy_link')}</a>
          </Checkbox>
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
          <Button type="primary" htmlType="submit" loading={loading} block size="large" className="auth-submit">
            {t('auth.register_button')}
          </Button>
        </Form.Item>
      </Form>

      <SocialAuthButtons />

      <div className="auth-footnote">
        {t('auth.have_account')}{' '}
        <Button type="link" onClick={onSwitchLogin} style={{ padding: 0, fontWeight: 700, fontSize: 14 }}>
          {t('auth.login_now')}
        </Button>
      </div>
    </div>
  );
};
