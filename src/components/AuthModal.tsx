import React, { useState } from 'react';
import { Modal, Form, Input, Button, Tabs, message } from 'antd';
import { LogIn, UserPlus, Lock, Mail, User, ShieldCheck } from 'lucide-react';
import { signInWithEmail, signUpWithEmail } from '../lib/auth';
import type { AuthUser } from '../lib/auth';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (user: AuthUser) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ open, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();

  const handleLogin = async (values: any) => {
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
        loginForm.resetFields();
        onClose();
      }
    } catch (err: any) {
      console.error('Login error:', err);
      message.error(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại Email và Mật khẩu!');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values: any) => {
    if (values.password !== values.confirmPassword) {
      message.error('Mật khẩu nhập lại không trùng khớp!');
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
        registerForm.resetFields();
        onClose();
      }
    } catch (err: any) {
      console.error('Register error:', err);
      message.error(err.message || 'Đăng ký tài khoản thất bại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={440}
      centered
      styles={{
        body: {
          borderRadius: 24,
          padding: '12px 8px',
        },
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 18,
            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 10px 20px rgba(79, 70, 229, 0.3)',
            marginBottom: 12,
          }}
        >
          <ShieldCheck size={30} />
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#1e293b' }}>Quản Lý Chi Tiêu Pro</div>
        <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Đăng nhập để đồng bộ dữ liệu tài chính của bạn</div>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={(k) => setActiveTab(k as 'login' | 'register')}
        centered
        items={[
          {
            key: 'login',
            label: (
              <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <LogIn size={16} /> Đăng nhập
              </span>
            ),
            children: (
              <Form form={loginForm} layout="vertical" onFinish={handleLogin} style={{ marginTop: 12 }}>
                <Form.Item
                  name="email"
                  label="Email đăng nhập"
                  rules={[
                    { required: true, message: 'Vui lòng nhập Email' },
                    { type: 'email', message: 'Email không hợp lệ' },
                  ]}
                >
                  <Input prefix={<Mail size={16} color="#94a3b8" />} placeholder="example@gmail.com" size="large" style={{ borderRadius: 12 }} />
                </Form.Item>

                <Form.Item
                  name="password"
                  label="Mật khẩu"
                  rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
                >
                  <Input.Password prefix={<Lock size={16} color="#94a3b8" />} placeholder="••••••••" size="large" style={{ borderRadius: 12 }} />
                </Form.Item>

                <Form.Item style={{ marginTop: 24, marginBottom: 8 }}>
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
                      background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                      border: 'none',
                    }}
                  >
                    Đăng Nhập
                  </Button>
                </Form.Item>
              </Form>
            ),
          },
          {
            key: 'register',
            label: (
              <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <UserPlus size={16} /> Đăng ký
              </span>
            ),
            children: (
              <Form form={registerForm} layout="vertical" onFinish={handleRegister} style={{ marginTop: 12 }}>
                <Form.Item
                  name="name"
                  label="Họ và tên"
                  rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
                >
                  <Input prefix={<User size={16} color="#94a3b8" />} placeholder="Trần Phong" size="large" style={{ borderRadius: 12 }} />
                </Form.Item>

                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    { required: true, message: 'Vui lòng nhập Email' },
                    { type: 'email', message: 'Email không hợp lệ' },
                  ]}
                >
                  <Input prefix={<Mail size={16} color="#94a3b8" />} placeholder="example@gmail.com" size="large" style={{ borderRadius: 12 }} />
                </Form.Item>

                <Form.Item
                  name="password"
                  label="Mật khẩu"
                  rules={[{ required: true, message: 'Tối thiểu 6 ký tự', min: 6 }]}
                >
                  <Input.Password prefix={<Lock size={16} color="#94a3b8" />} placeholder="Tối thiểu 6 ký tự" size="large" style={{ borderRadius: 12 }} />
                </Form.Item>

                <Form.Item
                  name="confirmPassword"
                  label="Xác nhận mật khẩu"
                  rules={[{ required: true, message: 'Vui lòng nhập lại mật khẩu' }]}
                >
                  <Input.Password prefix={<Lock size={16} color="#94a3b8" />} placeholder="Nhập lại mật khẩu" size="large" style={{ borderRadius: 12 }} />
                </Form.Item>

                <Form.Item style={{ marginTop: 24, marginBottom: 8 }}>
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
                      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                      border: 'none',
                    }}
                  >
                    Tạo Tài Khoản
                  </Button>
                </Form.Item>
              </Form>
            ),
          },
        ]}
      />
    </Modal>
  );
};
