import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, Select } from 'antd';
import { message } from '../../../lib/antdApp';
import { Mail, Lock, User, Coins } from 'lucide-react';
import { motion } from 'framer-motion';
import { registerSchema } from '../schemas';
import { signUpWithEmail } from '../../../lib/auth';
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
    const validation = registerSchema.safeParse(values);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message;
      message.error(firstError || 'Vui lòng kiểm tra lại thông tin đăng ký!');
      return;
    }

    setLoading(true);
    try {
      const data = await signUpWithEmail(values.email, values.password, values.name);
      if (data.user) {
        message.success('🎉 Đăng ký tài khoản thành công!');
        onSuccess({
          id: data.user.id,
          email: data.user.email || '',
          name: values.name || 'Người dùng',
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.id}`,
        });
        form.resetFields();
      }
    } catch (err: any) {
      console.error('Register error:', err);
      message.error(err.message || 'Đăng ký tài khoản thất bại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in-quick">
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1E293B', marginBottom: 6 }}>Tạo tài khoản mới</h2>
        <p style={{ fontSize: 14, color: '#64748B', margin: 0 }}>
          Bắt đầu hành trình làm chủ tài chính cá nhân ngay hôm nay.
        </p>
      </div>

      <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false} initialValues={{ currency: 'VND' }}>
        <Form.Item
          name="name"
          label={<span style={{ fontWeight: 600, fontSize: 13, color: '#475569' }}>Họ và tên</span>}
          rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
          style={{ marginBottom: 12 }}
        >
          <Input
            prefix={<User size={18} color="#94A3B8" style={{ marginRight: 6 }} />}
            placeholder="Ví dụ: Trần Phong"
            size="large"
            autoFocus
            style={{ borderRadius: 4, height: 44, fontSize: 14 }}
          />
        </Form.Item>

        <Form.Item
          name="email"
          label={<span style={{ fontWeight: 600, fontSize: 13, color: '#475569' }}>Địa chỉ Email</span>}
          rules={[
            { required: true, message: 'Vui lòng nhập Email' },
            { type: 'email', message: 'Email không đúng định dạng' },
          ]}
          style={{ marginBottom: 12 }}
        >
          <Input
            prefix={<Mail size={18} color="#94A3B8" style={{ marginRight: 6 }} />}
            placeholder="example@gmail.com"
            size="large"
            style={{ borderRadius: 4, height: 44, fontSize: 14 }}
          />
        </Form.Item>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <Form.Item
            name="password"
            label={<span style={{ fontWeight: 600, fontSize: 13, color: '#475569' }}>Mật khẩu</span>}
            rules={[{ required: true, message: 'Tối thiểu 6 ký tự', min: 6 }]}
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
            label={<span style={{ fontWeight: 600, fontSize: 13, color: '#475569' }}>Xác nhận mật khẩu</span>}
            rules={[{ required: true, message: 'Vui lòng nhập lại mật khẩu' }]}
            style={{ marginBottom: 12 }}
          >
            <Input.Password
              prefix={<Lock size={18} color="#94A3B8" style={{ marginRight: 6 }} />}
              placeholder="Nhập lại mật khẩu"
              size="large"
              style={{ borderRadius: 4, height: 44, fontSize: 14 }}
            />
          </Form.Item>
        </div>

        <Form.Item
          name="currency"
          label={<span style={{ fontWeight: 600, fontSize: 13, color: '#475569' }}>Đơn vị tiền tệ mặc định</span>}
          rules={[{ required: true, message: 'Chọn loại tiền tệ' }]}
          style={{ marginBottom: 12 }}
        >
          <Select
            size="large"
            style={{ borderRadius: 4, height: 44 }}
            prefix={<Coins size={18} color="#94A3B8" />}
            options={[
              { value: 'VND', label: '🇻🇳 VNĐ - Việt Nam Đồng' },
              { value: 'USD', label: '🇺🇸 USD - Đô la Mỹ ($)' },
              { value: 'EUR', label: '🇪🇺 EUR - Euro (€)' },
            ]}
          />
        </Form.Item>

        <Form.Item name="agreeTerms" valuePropName="checked" style={{ marginBottom: 16 }}>
          <Checkbox style={{ fontSize: 13, color: '#64748B' }}>
            Tôi đồng ý với <a href="#terms" style={{ color: '#1677FF', fontWeight: 600 }}>Điều khoản sử dụng</a> & <a href="#privacy" style={{ color: '#1677FF', fontWeight: 600 }}>Chính sách bảo mật</a>
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
              Tạo Tài Khoản
            </Button>
          </motion.div>
        </Form.Item>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#64748B' }}>
          Đã có tài khoản?{' '}
          <Button
            type="link"
            onClick={onSwitchLogin}
            style={{ padding: 0, fontWeight: 700, color: '#1677FF', fontSize: 14 }}
          >
            Đăng nhập ngay
          </Button>
        </div>
      </Form>
    </div>
  );
};
