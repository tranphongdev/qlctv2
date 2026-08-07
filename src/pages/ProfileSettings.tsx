import React, { useEffect, useState, useSyncExternalStore } from 'react';
import dayjs from 'dayjs';
import { Form, Input, Button, Select, Avatar, Upload, Divider, Tag, Alert, Modal, Popconfirm, Space, Spin } from 'antd';
import { message } from '~/lib/antdApp';
import { User, Shield, Database, Download, Upload as UploadIcon, Server, CheckCircle2, AlertCircle, Camera, Trash2, KeyRound, AtSign, RefreshCw } from 'lucide-react';
import type { UserSettings } from '~/types';
import { exportBackupJSON, importBackupJSON, updateSettings } from '~/store/appStore';
import { isSupabaseConfigured } from '~/lib/supabase';
import { getActiveTotpFactorId, startTotpEnrollment, verifyTotpEnrollment, disableTotp } from '~/lib/mfa';
import type { TotpEnrollment } from '~/lib/mfa';
import { updateContactEmail } from '~/lib/auth';
import { contactEmailSchema } from '~/features/auth/schemas';
import type { AuthUser } from '~/lib/auth';
import { AvatarCropModal } from '~/components/AvatarCropModal';
import { getRate, getRateStatus, subscribeRates, getRatesVersion } from '~/utils/currency';
import type { RateStatus } from '~/utils/currency';
import { refreshExchangeRates } from '~/lib/exchangeRates';
import { t } from '~/i18n';

const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const AVATAR_MIME = ['image/jpeg', 'image/png', 'image/webp'];

interface ProfileSettingsProps {
  settings: UserSettings;
  currentUser: AuthUser | null;
}

/** Tỷ giá thật có phần lẻ (26.331,47). Người dùng chỉ cần phần nghìn để đối chiếu. */
function formatRate(vndPerUnit: number): string {
  return Math.round(vndPerUnit).toLocaleString('vi-VN');
}

/** Dòng chú thích dưới ô chọn tiền tệ: tỷ giá lấy lúc nào, và nút hỏi lại ngay. */
const RateNote: React.FC<{ status: RateStatus; onRefresh: () => void }> = ({ status, onRefresh }) => {
  let text = t('settings.fx_fallback');
  if (status.loading) {
    text = t('settings.fx_loading');
  } else if (status.updatedAt) {
    text = t('settings.fx_updated', { time: dayjs(status.updatedAt).format('HH:mm DD/MM') });
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      <span>{text}</span>
      <Button
        type="link"
        size="small"
        style={{ padding: 0, height: 'auto', fontSize: 'inherit' }}
        icon={<RefreshCw size={12} />}
        loading={status.loading}
        onClick={onRefresh}
      >
        {t('settings.fx_refresh')}
      </Button>
    </span>
  );
};

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

  // Bảng tỷ giá sống ngoài React. Đăng ký nghe để nhãn "1 USD ≈ …₫" đổi theo ngay khi
  // tải xong, thay vì đứng im ở con số của lượt render trước.
  useSyncExternalStore(subscribeRates, getRatesVersion, getRatesVersion);
  const rateStatus = getRateStatus();

  const handleRefreshRates = async () => {
    const ok = await refreshExchangeRates();
    if (ok) message.success(t('settings.fx_refresh_ok'));
    else message.warning(t('settings.fx_refresh_fail'));
  };

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

  const handleSaveProfile = async (values: any) => {
    const email = (values.userEmail ?? '').trim();

    const parsed = contactEmailSchema().safeParse(email);
    if (!parsed.success) {
      message.error(parsed.error.issues[0]?.message || t('validation.email_format'));
      return;
    }

    updateSettings({
      fullName: values.fullName,
      userEmail: email,
      currency: values.currency,
      language: values.language,
    });

    // Đẩy email lên Supabase Auth trước khi báo thành công. Chỉ làm khi địa chỉ
    // thực sự đổi, để mỗi lần lưu cài đặt ngôn ngữ không kích hoạt lại luồng xác
    // nhận email của Supabase.
    if (currentUser && email !== settings.userEmail) {
      try {
        const { authEmailChanged } = await updateContactEmail(email);
        message.success(email && !authEmailChanged ? t('settings.email_pending') : t('settings.saved'));
        return;
      } catch (err: any) {
        console.error('[profile] Lưu email thất bại:', err);
        message.error(err?.message || t('settings.saved'));
        return;
      }
    }

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
    message.success(t('settings.backup_downloaded'));
  };

  const handleImportBackup = (file: any) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const ok = importBackupJSON(content);
      if (ok) {
        message.success(t('settings.restore_success'));
      } else {
        message.error(t('settings.restore_invalid'));
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
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t('settings.subtitle')}</div>
      </div>

      {/* Main Settings Form */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        {/* Left: General Settings */}
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <User size={20} color="#2563EB" />
            <span>{t('settings.user_section')}</span>
          </div>

          {/* Ảnh đại diện */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
            <Avatar src={settings.avatarUrl || undefined} size={64} style={{ border: '3px solid #2563EB', flexShrink: 0 }}>
              {settings.fullName?.charAt(0)?.toUpperCase()}
            </Avatar>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{settings.fullName}</div>
              {/* Username là danh tính đăng nhập nên hiện luôn dưới tên; email có
                  thể chưa có nên chỉ là dòng phụ, không để trống trơ ra. */}
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>@{settings.username}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                {settings.userEmail || <em>{t('settings.email_none')}</em>}
              </div>
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
            <Form.Item label={t('settings.username')} extra={t('settings.username_hint')}>
              <Input value={settings.username} disabled prefix={<AtSign size={14} color="#94a3b8" />} />
            </Form.Item>

            <Form.Item name="fullName" label={t('settings.display_name')} rules={[{ required: true }]}>
              <Input placeholder={t('settings.name_placeholder')} />
            </Form.Item>

            <Form.Item name="userEmail" label={t('settings.email_optional')} extra={t('settings.email_hint')}>
              <Input placeholder={t('settings.email_placeholder')} allowClear />
            </Form.Item>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
              <Form.Item name="currency" label={t('settings.currency')} extra={<RateNote status={rateStatus} onRefresh={handleRefreshRates} />}>
                <Select
                  options={[
                    { value: 'VND', label: t('settings.currency_vnd') },
                    { value: 'USD', label: t('settings.currency_usd', { rate: formatRate(getRate('USD')) }) },
                    { value: 'EUR', label: t('settings.currency_eur', { rate: formatRate(getRate('EUR')) }) },
                  ]}
                />
              </Form.Item>

              <Form.Item name="language" label={t('settings.language')}>
                <Select
                  options={[
                    { value: 'vi', label: t('settings.lang_vi') },
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

          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.5 }}>
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
                <span>{t('settings.supabase_section')}</span>
              </div>
              {isSupabaseConfigured ? (
                <Tag color="green" icon={<CheckCircle2 size={12} />}>{t('settings.connected')}</Tag>
              ) : (
                <Tag color="orange" icon={<AlertCircle size={12} />}>LocalStorage</Tag>
              )}
            </div>
          </div>

          {/* Backup JSON Card */}
          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Database size={20} color="#7C3AED" />
              <span>{t('settings.backup_section')}</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, lineHeight: '1.5' }}>
              {t('settings.backup_desc')}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Button icon={<Download size={16} />} type="primary" onClick={handleExportBackup} block style={{ borderRadius: 12 }}>
                {t('settings.backup_button')}
              </Button>

              <Upload beforeUpload={handleImportBackup} showUploadList={false}>
                <Button icon={<UploadIcon size={16} />} block style={{ borderRadius: 12 }}>
                  {t('settings.restore_button')}
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
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>{t('mfa.step_scan')}</div>

          {enrollment && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <img
                src={enrollment.qrCode}
                alt="QR code 2FA"
                style={{ width: 200, height: 200, background: '#fff', padding: 8, borderRadius: 12 }}
              />
            </div>
          )}

          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{t('mfa.manual_key')}</div>
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
