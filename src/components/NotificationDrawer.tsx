import React from 'react';
import { Drawer, Button, List, Empty } from 'antd';
import { CheckCheck, AlertTriangle, Wallet, Target, Sparkles, Bell } from 'lucide-react';
import type { NotificationItem } from '../types';

interface NotificationDrawerProps {
  open: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkRead: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  open,
  onClose,
  notifications,
  onMarkRead,
}) => {
  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'budget':
        return <AlertTriangle size={18} color="#EF4444" />;
      case 'income':
        return <Wallet size={18} color="#22C55E" />;
      case 'goal':
        return <Target size={18} color="#7C3AED" />;
      default:
        return <Sparkles size={18} color="#4F46E5" />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bell size={18} color="#4F46E5" />
          <span style={{ fontWeight: 700, fontSize: 16 }}>Thông báo</span>
        </div>
      }
      placement="right"
      size={Math.min(380, typeof window !== 'undefined' ? window.innerWidth : 380)}
      onClose={onClose}
      open={open}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
          {unreadCount > 0 ? `${unreadCount} thông báo mới` : 'Tất cả thông báo'}
        </span>
        {notifications.length > 0 && (
          <Button
            type="text"
            size="small"
            icon={<CheckCheck size={14} color="#4F46E5" />}
            onClick={onMarkRead}
            style={{ color: '#4F46E5', fontWeight: 600, fontSize: 12 }}
          >
            Đánh dấu đã đọc
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Empty description="Không có thông báo nào" style={{ marginTop: 60 }} />
      ) : (
        <List
          dataSource={notifications}
          renderItem={(item) => (
            <List.Item
              style={{
                padding: '14px 16px',
                borderRadius: 16,
                marginBottom: 10,
                background: item.read ? 'rgba(241, 245, 249, 0.5)' : 'rgba(79, 70, 229, 0.08)',
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
                  background: 'rgba(255, 255, 255, 0.9)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                }}
              >
                {getIcon(item.type)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2, color: '#1e293b' }}>{item.title}</div>
                <div style={{ fontSize: 12, color: '#475569', lineHeight: '1.4' }}>{item.message}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>{item.date}</div>
              </div>
            </List.Item>
          )}
        />
      )}
    </Drawer>
  );
};
