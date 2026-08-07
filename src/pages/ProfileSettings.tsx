import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { Form, Input, Button, Select, Avatar, Upload, Modal, Popconfirm, Spin } from 'antd';
import { message } from '~/lib/antdApp';
import { User, Shield, ShieldOff, Database, Download, Upload as UploadIcon, CheckCircle2, AlertCircle, Camera, Trash2, KeyRound, AtSign, Check, Pencil } from 'lucide-react';
import { PageHead } from '~/components/PageHead';
import { SettingsCard, SettingsRow, StatusPill } from '~/components/SettingsCard';
import type { UserSettings } from '~/types';
import { exportBackupJSON, importBackupJSON, updateSettings } from '~/store/appStore';
import { isSupabaseConfigured } from '~/lib/supabase';
import { getActiveTotpFactorId, startTotpEnrollment, verifyTotpEnrollment, disableTotp } from '~/lib/mfa';
import type { TotpEnrollment } from '~/lib/mfa';
import { updateContactEmail } from '~/lib/auth';
import { contactEmailSchema } from '~/features/auth/schemas';
import type { AuthUser } from '~/lib/auth';
import { AvatarCropModal } from '~/components/AvatarCropModal';
import { getRate, subscribeRates, getRatesVersion } from '~/utils/currency';
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

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ settings, currentUser }) => {
  const [form] = Form.useForm();
  const [mfaForm] = Form.useForm();

  const [pendingAvatar, setPendingAvatar] = useState<string | null>(null);

  const [totpFactorId, setTotpFactorId] = useState<string | null>(null);
  const [mfaLoading, setMfaLoading] = useState(true);
  const [enrollment, setEnrollment] = useState<TotpEnrollment | null>(null);
  const [verifying, setVerifying] = useState(false);

  const canUseMfa = isSupabaseConfigured && !!currentUser;

  useSyncExternalStore(subscribeRates, getRatesVersion, getRatesVersion);
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

  /**
   * Dòng thứ hai của thẻ Bảo mật đổi vai theo trạng thái: chưa bật thì là lối
   * bật, đã bật thì là lối tắt. Gói vào một biến vì mỗi nhánh cần một vỏ bọc
   * khác nhau (Popconfirm cho nhánh tắt) — nhét cả vào JSX chính thì ba tầng
   * ternary lồng nhau che mất cấu trúc của thẻ.
   */
  let mfaAction: React.ReactNode = null;
  if (!isSupabaseConfigured) {
    mfaAction = <p className="settings-note">{t('mfa.need_supabase')}</p>;
  } else if (!currentUser) {
    mfaAction = <p className="settings-note">{t('mfa.need_login')}</p>;
  } else if (mfaLoading) {
    mfaAction = (
      <p className="settings-note">
        <Spin size="small" />
      </p>
    );
  } else if (totpFactorId) {
    mfaAction = (
      <Popconfirm
        title={t('mfa.disable_confirm')}
        description={t('mfa.disable_confirm_desc')}
        onConfirm={handleDisableMfa}
        okText={t('common.delete')}
        cancelText={t('common.cancel')}
        okButtonProps={{ danger: true }}
      >
        <div className="settings-row-wrap">
          <SettingsRow title={t('mfa.disable')} icon={<ShieldOff size={18} />} danger onClick={() => {}} />
        </div>
      </Popconfirm>
    );
  } else {
    mfaAction = (
      <SettingsRow title={t('mfa.enable')} icon={<KeyRound size={18} />} onClick={handleStartEnrollment} />
    );
  }

  return (
    <div className="settings-page">
      <PageHead title={t('settings.title')} subtitle={t('settings.subtitle')} />

      <div className="settings-grid">
        <SettingsCard icon={<User size={20} />} title={t('settings.user_section')}>
          {/* ---- Danh tính + ảnh đại diện ---- */}
          <div className="settings-identity">
            <div className="settings-identity__avatar">
              <Avatar src={settings.avatarUrl || undefined} size={96}>
                {settings.fullName?.charAt(0)?.toUpperCase()}
              </Avatar>
              <Upload beforeUpload={handleAvatarSelect} showUploadList={false} accept={AVATAR_MIME.join(',')}>
                <button type="button" className="settings-identity__edit" aria-label={t('avatar.change')}>
                  <Pencil size={14} />
                </button>
              </Upload>
            </div>

            <div className="settings-identity__info">
              <div className="settings-identity__name">{settings.fullName}</div>
              {/* Username là danh tính đăng nhập nên hiện luôn dưới tên; email có
                  thể chưa có nên chỉ là dòng phụ, không để trống trơ ra. */}
              <div className="settings-identity__meta">@{settings.username}</div>
              <div className="settings-identity__meta">
                {settings.userEmail || <em>{t('settings.email_none')}</em>}
              </div>

              <div className="settings-identity__actions">
                <Upload beforeUpload={handleAvatarSelect} showUploadList={false} accept={AVATAR_MIME.join(',')}>
                  <Button icon={<Camera size={15} />}>{t('avatar.change')}</Button>
                </Upload>
                {settings.avatarUrl && (
                  <Button
                    danger
                    icon={<Trash2 size={15} />}
                    onClick={() => {
                      updateSettings({ avatarUrl: '' });
                      message.success(t('avatar.removed'));
                    }}
                  >
                    {t('avatar.remove')}
                  </Button>
                )}
              </div>

              <div className="settings-identity__hint">{t('avatar.hint')}</div>
            </div>
          </div>

          <hr className="settings-rule" />
          <Form form={form} layout="vertical" initialValues={settings} onFinish={handleSaveProfile}>
            <Form.Item name="fullName" label={t('settings.display_name')} rules={[{ required: true }]}>
              <Input placeholder={t('settings.name_placeholder')} />
            </Form.Item>

            <Form.Item label={t('settings.username')}>
              <Input value={settings.username} disabled prefix={<AtSign size={15} />} />
            </Form.Item>

            <Form.Item name="userEmail" label={t('settings.email_optional')}>
              <Input placeholder={t('settings.email_placeholder')} allowClear />
            </Form.Item>

            <div className="settings-field-pair">
              <Form.Item
                name="currency"
                label={t('settings.currency')}
              >
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

            <Form.Item className="settings-submit">
              <Button type="primary" htmlType="submit" icon={<Check size={16} />}>
                {t('common.save')}
              </Button>
            </Form.Item>
          </Form>
        </SettingsCard>

        <div className="settings-side">
          <SettingsCard
            icon={<Database size={20} />}
            title={t('settings.data_section')}
            tone="green"
            badge={
              isSupabaseConfigured ? (
                <StatusPill tone="green" icon={<CheckCircle2 size={13} />}>
                  {t('settings.connected')}
                </StatusPill>
              ) : (
                <StatusPill tone="amber" icon={<AlertCircle size={13} />}>
                  LocalStorage
                </StatusPill>
              )
            }
          >
            <SettingsRow
              title={t('settings.supabase_section')}
              desc={isSupabaseConfigured ? t('settings.supabase_row_desc') : t('settings.local_row_desc')}
            />
          </SettingsCard>

          <SettingsCard icon={<UploadIcon size={20} />} title={t('settings.backup_section')} tone="violet">
            <div className="settings-block">
              <div className="settings-block__title">{t('settings.backup_subtitle')}</div>
              <p className="settings-block__desc">{t('settings.backup_desc')}</p>

              <Button
                icon={<Download size={16} />}
                type="primary"
                onClick={handleExportBackup}
                block
                className="settings-cta"
              >
                {t('settings.backup_button')}
              </Button>

              {/* `block` của antd không xuyên qua vỏ Upload — vỏ đó là một <span>
                  co theo nội dung, nên nút bên trong vẫn hẹp. Class dưới đây kéo
                  chính cái vỏ ra đủ bề ngang. */}
              <Upload beforeUpload={handleImportBackup} showUploadList={false} className="settings-upload-block">
                <Button icon={<UploadIcon size={16} />} block>
                  {t('settings.restore_button')}
                </Button>
              </Upload>
            </div>
          </SettingsCard>

          <SettingsCard icon={<Shield size={20} />} title={t('settings.security_section')}>
            <SettingsRow
              title={t('mfa.section')}
              desc={t('mfa.description')}
              badge={
                totpFactorId ? (
                  <StatusPill tone="green" icon={<CheckCircle2 size={13} />}>
                    {t('mfa.status_on')}
                  </StatusPill>
                ) : (
                  <StatusPill tone="muted">{t('mfa.status_off')}</StatusPill>
                )
              }
            />
            {mfaAction}
          </SettingsCard>
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
