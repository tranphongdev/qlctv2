import React from 'react';
import { Drawer, Button, Empty } from 'antd';
import { CheckCheck, AlertTriangle, HandCoins, Target, Sparkles, Bell, Wallet } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { t } from '~/i18n';
import type { TranslationKey } from '~/i18n';
import type { NotificationItem, NotificationSeverity } from '~/types';

// dayjs không kèm sẵn fromNow(); locale vi/en đã được nạp trong utils/format.
dayjs.extend(relativeTime);

interface NotificationDrawerProps {
  open: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkRead: () => void;
  /** Bấm vào một thông báo: đánh dấu đã đọc rồi mở trang liên quan. */
  onOpenNotification: (notif: NotificationItem) => void;
}

const ICONS: Record<NotificationItem['type'], React.ElementType> = {
  budget: AlertTriangle,
  debt: HandCoins,
  goal: Target,
  income: Wallet,
  system: Sparkles,
};

/**
 * Màu theo mức độ khẩn chứ không theo loại.
 *
 * Bản trước tô màu theo `type`, nên mọi thông báo ngân sách đều đỏ như nhau — kể
 * cả cái chỉ báo "đã dùng 50%". Khi mọi thứ đều là báo động thì không cái nào là
 * báo động cả.
 */
const SEVERITY_COLORS: Record<NotificationSeverity, string> = {
  info: '#2563EB',
  warning: '#F59E0B',
  critical: '#EF4444',
};

type GroupKey = 'today' | 'week' | 'older';

const GROUP_LABELS: Record<GroupKey, TranslationKey> = {
  today: 'notif.group.today',
  week: 'notif.group.week',
  older: 'notif.group.older',
};

function groupOf(date: string): GroupKey {
  const d = dayjs(date);
  if (d.isSame(dayjs(), 'day')) return 'today';
  // 7 ngày trở lại tính là "tuần này" — mốc trôi theo ngày, không phải tuần lịch:
  // thông báo hôm qua không nên rơi xuống "Cũ hơn" chỉ vì hôm nay là thứ Hai.
  return dayjs().diff(d, 'day') < 7 ? 'week' : 'older';
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  open,
  onClose,
  notifications,
  onMarkRead,
  onOpenNotification,
}) => {
  const unreadCount = notifications.filter((n) => !n.read).length;

  const groups = (['today', 'week', 'older'] as GroupKey[])
    .map((key) => ({ key, items: notifications.filter((n) => groupOf(n.date) === key) }))
    .filter((g) => g.items.length > 0);

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bell size={18} color="#2563EB" />
          <span style={{ fontWeight: 700, fontSize: 16 }}>{t('notif.title')}</span>
        </div>
      }
      placement="right"
      size={Math.min(380, typeof window !== 'undefined' ? window.innerWidth : 380)}
      onClose={onClose}
      open={open}
      /* Né thanh trạng thái khi mở từ app đã cài (PWA standalone). */
      styles={{ header: { paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))' } }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
          {unreadCount > 0 ? t('notif.new_count', { count: unreadCount }) : t('notif.all')}
        </span>
        {unreadCount > 0 && (
          <Button
            type="text"
            size="small"
            icon={<CheckCheck size={14} color="#2563EB" />}
            onClick={onMarkRead}
            style={{ color: '#2563EB', fontWeight: 600, fontSize: 12 }}
          >
            {t('notif.mark_read')}
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Empty description={t('notif.empty')} style={{ marginTop: 60 }} />
      ) : (
        groups.map((group) => (
          <section key={group.key} style={{ marginBottom: 20 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 0.6,
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                marginBottom: 8,
              }}
            >
              {t(GROUP_LABELS[group.key])}
            </div>

            {group.items.map((item) => {
              const Icon = ICONS[item.type] ?? Sparkles;
              const color = SEVERITY_COLORS[item.severity ?? 'info'];

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onOpenNotification(item);
                    onClose();
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    cursor: 'pointer',
                    padding: '14px 16px',
                    borderRadius: 16,
                    marginBottom: 10,
                    background: item.read ? 'var(--surface-subtle)' : 'rgba(37, 99, 235, 0.08)',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 12,
                      background: 'var(--surface-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    }}
                  >
                    <Icon size={18} color={color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2, color: 'var(--text-heading)' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                      {item.message}
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>{dayjs(item.date).fromNow()}</div>
                  </div>
                  {!item.read && (
                    <span
                      aria-hidden
                      style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0, marginTop: 6 }}
                    />
                  )}
                </button>
              );
            })}
          </section>
        ))
      )}
    </Drawer>
  );
};
