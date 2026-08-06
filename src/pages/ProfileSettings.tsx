import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Select, Avatar, Upload, Divider, Tag, Alert, Modal, Popconfirm, Space, Spin } from 'antd';
import { message } from '../lib/antdApp';
import { User, Shield, Database, Download, Upload as UploadIcon, Server, CheckCircle2, AlertCircle, Camera, Trash2, KeyRound } from 'lucide-react';
import type { UserSettings } from '../types';
import { exportBackupJSON, importBackupJSON, updateSettings } from '../store/appStore';
import { isSupabaseConfigured } from '../lib/supabase';
import { getActiveTotpFactorId, startTotpEnrollment, verifyTotpEnrollment, disableTotp } from '../lib/mfa';
import type { TotpEnrollment } from '../lib/mfa';
import type { AuthUser } from '../lib/auth';
import { AvatarCropModal } from '../components/AvatarCropModal';
import { VND_PER_UNIT } from '../utils/currency';
import { t } from '../i18n';

const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const AVATAR_MIME = ['image/jpeg', 'image/png', 'image/webp'];

interface ProfileSettingsProps {
  settings: UserSettings;
  currentUser: AuthUser | null;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ settings, currentUser }) => {
  const [form] = Form.useForm();
  const [mfaForm] = Form.useForm();

  /** Ảnh vừa chọn, đang chờ người dùng cắt. Chưa ghi vào settings. */
  const [pendingAvatar, setPendingAvatar] = useState<string | null>(null);

  const [totpFactorId, setTotpFactorId] = useState<string | null>(null);
  const [mfaLoading, setMfaLoading] = useState(true);
  const [enrollment, setEnrollment] = useState<TotpEnrollment | null>(null);
  const [verifying, setVerifying] = useState(false);

  const canUseMfa = isSupabaseConfigured && !!currentUser;

  useEffect(() => {
    if (!canUseMfa) {
      setTotpFactorId(null);
      setMfaLoading(false);
      return;
    }

    let cancelled = false;
    setMfaLoading(true);
    getActiveTotpFactorId()
      .then((id) => {
        if (!cancelled) setTotpFactorId(id);
      })
      .catch(() => {
        if (!cancelled) setTotpFactorId(null);
      })
      .finally(() => {
        if (!cancelled) setMfaLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [canUseMfa]);

  const handleSaveProfile = (values: any) => {
    updateSettings({
      userName: values.userName,
      userEmail: values.userEmail,
      currency: values.currency,
      language: values.language,
    });
    message.success(t('settings.saved'));
  };

  /**
   * Đọc ảnh thành data URI rồi mở modal cắt — chưa lưu ngay. Trả false để antd Upload
   * không tự POST file đi đâu cả.
   */
  const handleAvatarSelect = (file: File) => {
    if (!AVATAR_MIME.includes(file.type)) {
      message.error(t('avatar.invalid_type'));
      return false;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      message.error(t('avatar.too_large'));
      return false;
    }

    const reader = new FileReader();
    reader.onload = (e) => setPendingAvatar(e.target?.result as string);
    reader.onerror = () => message.error(t('avatar.invalid_type'));
    reader.readAsDataURL(file);
    return false;
  };

  const handleAvatarCropped = (dataUrl: string) => {
    updateSettings({ avatarUrl: dataUrl });
    setPendingAvatar(null);
    message.success(t('avatar.updated'));
  };

  const handleStartEnrollment = async () => {
    try {
      const data = await startTotpEnrollment();
      setEnrollment(data);
      mfaForm.resetFields();
    } catch (err: any) {
      message.error(err?.message || t('mfa.invalid_code'));
    }
  };

  const handleVerifyEnrollment = async (values: any) => {
    if (!enrollment) return;
    setVerifying(true);
    try {
      await verifyTotpEnrollment(enrollment.factorId, values.code);
      setTotpFactorId(enrollment.factorId);
      setEnrollment(null);
      message.success(t('mfa.enabled'));
    } catch (err: any) {
      message.error(err?.message || t('mfa.invalid_code'));
    } finally {
      setVerifying(false);
    }
  };

  const handleDisableMfa = async () => {
    if (!totpFactorId) return;
    try {
      await disableTotp(totpFactorId);
      setTotpFactorId(null);
      message.success(t('mfa.disabled'));
    } catch (err: any) {
      message.error(err?.message || t('mfa.invalid_code'));
    }
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
        <div style={{ fontSize: 20, fontWeight: 800 }}>{t('settings.title')}</div>
        <div style={{ fontSize: 13, color: '#64748b' }}>{t('settings.subtitle')}</div>
      </div>

      {/* Main Settings Form */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        {/* Left: General Settings */}
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <User size={20} color="#4F46E5" />
            <span>{t('settings.user_section')}</span>
          </div>

          {/* Ảnh đại diện */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
            <Avatar src={settings.avatarUrl || undefined} size={64} style={{ border: '3px solid #4F46E5', flexShrink: 0 }}>
              {settings.userName?.charAt(0)?.toUpperCase()}
            </Avatar>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{settings.userName}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>{settings.userEmail}</div>
              <Space wrap size={8}>
                <Upload beforeUpload={handleAvatarSelect} showUploadList={false} accept={AVATAR_MIME.join(',')}>
                  <Button size="small" icon={<Camera size={14} />}>
                    {t('avatar.change')}
                  </Button>
                </Upload>
                {settings.avatarUrl && (
                  <Button
                    size="small"
                    danger
                    icon={<Trash2 size={14} />}
                    onClick={() => {
                      updateSettings({ avatarUrl: '' });
                      message.success(t('avatar.removed'));
                    }}
                  >
                    {t('avatar.remove')}
                  </Button>
                )}
              </Space>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>{t('avatar.hint')}</div>
            </div>
          </div>

          <Form form={form} layout="vertical" initialValues={settings} onFinish={handleSaveProfile}>
            <Form.Item name="userName" label={t('settings.display_name')} rules={[{ required: true }]}>
              <Input placeholder="Nhập tên người dùng" />
            </Form.Item>

            <Form.Item name="userEmail" label={t('settings.email')} rules={[{ required: true, type: 'email' }]}>
              <Input placeholder="user@gmail.com" />
            </Form.Item>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
              <Form.Item name="currency" label={t('settings.currency')}>
                <Select
                  options={[
                    { value: 'VND', label: 'VNĐ (Việt Nam Đồng)' },
                    { value: 'USD', label: `USD (1 USD ≈ ${VND_PER_UNIT.USD.toLocaleString('vi-VN')}₫)` },
                    { value: 'EUR', label: `EUR (1 EUR ≈ ${VND_PER_UNIT.EUR.toLocaleString('vi-VN')}₫)` },
                  ]}
                />
              </Form.Item>

              <Form.Item name="language" label={t('settings.language')}>
                <Select
                  options={[
                    { value: 'vi', label: 'Tiếng Việt' },
                    { value: 'en', label: 'English' },
                  ]}
                />
              </Form.Item>
            </div>

            <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
              <Button type="primary" htmlType="submit">
                {t('common.save')}
              </Button>
            </Form.Item>
          </Form>

          <Divider />

          {/* Xác thực 2 lớp */}
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Shield size={20} color="#10B981" />
              <span>{t('mfa.section')}</span>
            </div>
            {totpFactorId ? (
              <Tag color="green" icon={<CheckCircle2 size={12} />}>{t('mfa.status_on')}</Tag>
            ) : (
              <Tag color="default">{t('mfa.status_off')}</Tag>
            )}
          </div>

          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 14, lineHeight: 1.5 }}>
            {t('mfa.description')}
          </div>

          {!isSupabaseConfigured ? (
            <Alert type="warning" showIcon title={t('mfa.need_supabase')} />
          ) : !currentUser ? (
            <Alert type="info" showIcon title={t('mfa.need_login')} />
          ) : mfaLoading ? (
            <Spin size="small" />
          ) : totpFactorId ? (
            <Popconfirm
              title={t('mfa.disable_confirm')}
              description={t('mfa.disable_confirm_desc')}
              onConfirm={handleDisableMfa}
              okText={t('common.delete')}
              cancelText={t('common.cancel')}
              okButtonProps={{ danger: true }}
            >
              <Button danger icon={<Shield size={16} />}>
                {t('mfa.disable')}
              </Button>
            </Popconfirm>
          ) : (
            <Button type="primary" icon={<KeyRound size={16} />} onClick={handleStartEnrollment}>
              {t('mfa.enable')}
            </Button>
          )}
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
                title="Đã kết nối Supabase Cloud thành công"
                description="Tất cả giao dịch, ví tiền, hạn mức ngân sách và mục tiêu tiết kiệm được đồng bộ thời gian thực vào bảng dữ liệu Cloud của bạn."
                type="success"
                showIcon
              />
            ) : (
              <Alert
                title="Đang sử dụng bộ nhớ LocalStorage"
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
              <Button icon={<Download size={16} />} type="primary" onClick={handleExportBackup} block style={{ borderRadius: 12 }}>
                Tải File Backup (.JSON)
              </Button>

              <Upload beforeUpload={handleImportBackup} showUploadList={false}>
                <Button icon={<UploadIcon size={16} />} block style={{ borderRadius: 12 }}>
                  Khôi phục từ File JSON
                </Button>
              </Upload>
            </div>
          </div>
        </div>
      </div>

      {/* Cắt ảnh trước khi lưu làm avatar */}
      <AvatarCropModal
        src={pendingAvatar}
        onCancel={() => setPendingAvatar(null)}
        onCropped={handleAvatarCropped}
      />

      {/* Modal đăng ký thiết bị 2FA */}
      <Modal
        open={!!enrollment}
        onCancel={() => setEnrollment(null)}
        title={t('mfa.modal_title')}
        footer={null}
        destroyOnHidden
      >
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>{t('mfa.step_scan')}</div>

          {enrollment && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <img
                src={enrollment.qrCode}
                alt="QR code 2FA"
                style={{ width: 200, height: 200, background: '#fff', padding: 8, borderRadius: 12 }}
              />
            </div>
          )}

          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{t('mfa.manual_key')}</div>
          <Input.TextArea value={enrollment?.secret} readOnly autoSize style={{ marginBottom: 16, fontFamily: 'monospace' }} />

          <Form form={mfaForm} layout="vertical" onFinish={handleVerifyEnrollment}>
            <Form.Item
              name="code"
              label={t('mfa.enter_code')}
              rules={[{ required: true, pattern: /^\d{6}$/, message: t('mfa.code_required') }]}
            >
              <Input placeholder="000000" maxLength={6} inputMode="numeric" autoFocus />
            </Form.Item>

            <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
              <Button onClick={() => setEnrollment(null)} style={{ marginRight: 8 }}>
                {t('common.cancel')}
              </Button>
              <Button type="primary" htmlType="submit" loading={verifying}>
                {t('mfa.verify')}
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </div>
  );
};
