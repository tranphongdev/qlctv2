import React, { useState } from 'react';
import { Form, Input, Button, Checkbox } from 'antd';
import { message } from '../../../lib/antdApp';
import { Mail, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { loginSchema } from '../schemas';
import { signInWithEmail } from '../../../lib/auth';
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
    const validation = loginSchema.safeParse(values);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message;
      message.error(firstError || 'Vui lòng điền đầy đủ thông tin hợp lệ!');
      return;
    }

    setLoading(true);
    try {
      const data = await signInWithEmail(values.email, values.password);
      if (data.user) {
        message.success(`👋 Chào mừng quay trở lại, ${data.user.user_metadata?.full_name || data.user.email}!`);
        onSuccess({
          id: data.user.id,
          email: data.user.email || '',
          name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Người dùng',
          avatarUrl: data.user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.id}`,
        });
        form.resetFields();
      }
    } catch (err: any) {
      console.error('Login error:', err);
      message.error(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại Email và Mật khẩu!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in-quick">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1E293B', marginBottom: 6 }}>Chào mừng trở lại</h2>
        <p style={{ fontSize: 14, color: '#64748B', margin: 0 }}>
          Đăng nhập để tiếp tục quản lý tài chính của bạn.
        </p>
      </div>

      <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
        <Form.Item
          name="email"
          label={<span style={{ fontWeight: 600, fontSize: 13, color: '#475569' }}>Địa chỉ Email</span>}
          rules={[
            { required: true, message: 'Vui lòng nhập Email' },
            { type: 'email', message: 'Email không đúng định dạng' },
          ]}
        >
          <Input
            prefix={<Mail size={18} color="#94A3B8" style={{ marginRight: 6 }} />}
            placeholder="example@gmail.com"
            size="large"
            autoFocus
            style={{ borderRadius: 4, height: 48, fontSize: 14 }}
          />
        </Form.Item>

        <Form.Item
          name="password"
          label={<span style={{ fontWeight: 600, fontSize: 13, color: '#475569' }}>Mật khẩu</span>}
          rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
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
            <Checkbox style={{ fontSize: 13, color: '#64748B' }}>Ghi nhớ đăng nhập</Checkbox>
          </Form.Item>

          <Button
            type="link"
            size="small"
            onClick={onForgotPassword}
            style={{ padding: 0, fontWeight: 600, color: '#1677FF', fontSize: 13 }}
          >
            Quên mật khẩu?
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
              Đăng Nhập
            </Button>
          </motion.div>
        </Form.Item>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: '#64748B' }}>
          Chưa có tài khoản?{' '}
          <Button
            type="link"
            onClick={onSwitchRegister}
            style={{ padding: 0, fontWeight: 700, color: '#1677FF', fontSize: 14 }}
          >
            Đăng ký ngay
          </Button>
        </div>
      </Form>
    </div>
  );
};
