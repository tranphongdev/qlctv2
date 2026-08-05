import React from 'react';
import { Form, Input, Button, Switch, Select, Avatar, Upload, message, Divider, Tag, Alert } from 'antd';
import { User, Shield, Database, Download, Upload as UploadIcon, Server, CheckCircle2, AlertCircle } from 'lucide-react';
import type { UserSettings } from '../types';
import { exportBackupJSON, importBackupJSON, updateSettings } from '../store/appStore';
import { isSupabaseConfigured } from '../lib/supabase';

interface ProfileSettingsProps {
  settings: UserSettings;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ settings }) => {
  const [form] = Form.useForm();

  const handleSaveProfile = (values: any) => {
    updateSettings({
      userName: values.userName,
      userEmail: values.userEmail,
      currency: values.currency,
      language: values.language,
      autoBackup: values.autoBackup,
    });
    message.success('Đã cập nhật thông tin cá nhân!');
  };

  const handleExportBackup = () => {
    const jsonStr = exportBackupJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Quan_Ly_Chi_Tieu_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    message.success('Đã tải xuống file sao lưu JSON!');
  };

  const handleImportBackup = (file: any) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const ok = importBackupJSON(content);
      if (ok) {
        message.success('Đã khôi phục dữ liệu từ file sao lưu thành công!');
      } else {
        message.error('File sao lưu không hợp lệ!');
      }
    };
    reader.readAsText(file);
    return false;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div className="glass-card" style={{ padding: '20px 24px' }}>
        <div style={{ fontSize: 20, fontWeight: 800 }}>Hồ Sơ Cá Nhân & Cài Đặt Hệ Thống</div>
        <div style={{ fontSize: 13, color: '#64748b' }}>Quản lý thông tin tài khoản, bảo mật, kết nối Supabase Database & sao lưu dữ liệu</div>
      </div>

      {/* Main Settings Form */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        {/* Left: General Settings */}
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <User size={20} color="#4F46E5" />
            <span>Thông tin người dùng</span>
          </div>

          <Form form={form} layout="vertical" initialValues={settings} onFinish={handleSaveProfile}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
              <Avatar src={settings.avatarUrl} size={64} style={{ border: '3px solid #4F46E5', flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{settings.userName}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{settings.userEmail}</div>
              </div>
            </div>

            <Form.Item name="userName" label="Tên hiển thị" rules={[{ required: true }]}>
              <Input placeholder="Nhập tên người dùng" />
            </Form.Item>

            <Form.Item name="userEmail" label="Địa chỉ Email" rules={[{ required: true, type: 'email' }]}>
              <Input placeholder="user@gmail.com" />
            </Form.Item>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
              <Form.Item name="currency" label="Đơn vị tiền tệ chính">
                <Select
                  options={[
                    { value: 'VND', label: 'VNĐ (Việt Nam Đồng)' },
                    { value: 'USD', label: 'USD (Đô la Mỹ)' },
                    { value: 'EUR', label: 'EUR (Euro)' },
                  ]}
                />
              </Form.Item>

              <Form.Item name="language" label="Ngôn ngữ hiển thị">
                <Select
                  options={[
                    { value: 'vi', label: 'Tiếng Việt (Vietnamese)' },
                    { value: 'en', label: 'English' },
                  ]}
                />
              </Form.Item>
            </div>

            <Divider />

            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Shield size={20} color="#10B981" />
              <span>Bảo mật & Tính năng</span>
            </div>

            <Form.Item label="Xác thực 2 lớp (2FA)" valuePropName="checked">
              <Switch defaultChecked />
            </Form.Item>

            <Form.Item name="autoBackup" label="Tự động sao lưu dữ liệu vào LocalStorage" valuePropName="checked">
              <Switch defaultChecked />
            </Form.Item>

            <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
              <Button type="primary" htmlType="submit" size="large" style={{ borderRadius: 12 }}>
                Lưu Thay Đổi
              </Button>
            </Form.Item>
          </Form>
        </div>

        {/* Right: Supabase Database & Backup */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Supabase Connection Card */}
          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Server size={20} color="#10B981" />
                <span>Cấu hình Supabase Database</span>
              </div>
              {isSupabaseConfigured ? (
                <Tag color="green" icon={<CheckCircle2 size={12} />}>Đã kết nối</Tag>
              ) : (
                <Tag color="orange" icon={<AlertCircle size={12} />}>LocalStorage</Tag>
              )}
            </div>

            {isSupabaseConfigured ? (
              <Alert
                message="Đã kết nối Supabase Cloud thành công"
                description="Tất cả giao dịch, ví tiền, hạn mức ngân sách và mục tiêu tiết kiệm được đồng bộ thời gian thực vào bảng dữ liệu Cloud của bạn."
                type="success"
                showIcon
              />
            ) : (
              <Alert
                message="Đang sử dụng bộ nhớ LocalStorage"
                description={
                  <div>
                    Để đồng bộ Supabase Cloud, mở file <code>.env</code> và dán <code>VITE_SUPABASE_URL</code> & <code>VITE_SUPABASE_ANON_KEY</code> của dự án Supabase. Chạy file SQL <code>supabase_schema.sql</code> để tạo bảng tự động.
                  </div>
                }
                type="warning"
                showIcon
              />
            )}
          </div>

          {/* Backup JSON Card */}
          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Database size={20} color="#7C3AED" />
              <span>Sao lưu & Khôi phục JSON</span>
            </div>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20, lineHeight: '1.5' }}>
              Tải xuống file sao lưu JSON an toàn của toàn bộ giao dịch, ví tiền, ngân sách & tiết kiệm.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Button icon={<Download size={16} />} size="large" type="primary" onClick={handleExportBackup} block style={{ borderRadius: 12 }}>
                Tải File Backup (.JSON)
              </Button>

              <Upload beforeUpload={handleImportBackup} showUploadList={false}>
                <Button icon={<UploadIcon size={16} />} size="large" block style={{ borderRadius: 12 }}>
                  Khôi phục từ File JSON
                </Button>
              </Upload>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
