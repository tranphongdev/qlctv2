import React from 'react';
import { Drawer, Button, List, Empty } from 'antd';
import { Bell, CheckCheck, AlertTriangle, Wallet, Target, Sparkles } from 'lucide-react';
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

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bell size={20} color="#4F46E5" />
            <span style={{ fontWeight: 700 }}>Thông báo tài chính</span>
          </div>
          <Button type="link" size="small" icon={<CheckCheck size={14} />} onClick={onMarkRead}>
            Đánh dấu đã đọc
          </Button>
        </div>
      }
      placement="right"
      width={Math.min(380, typeof window !== 'undefined' ? window.innerWidth : 380)}
      onClose={onClose}
      open={open}
    >
      {notifications.length === 0 ? (
        <Empty description="Không có thông báo nào" style={{ marginTop: 60 }} />
      ) : (
        <List
          dataSource={notifications}
          renderItem={(item) => (
            <List.Item
              style={{
                padding: '14px 16px',
                borderRadius: 14,
                marginBottom: 10,
                background: item.read ? 'transparent' : 'rgba(79, 70, 229, 0.05)',
                border: item.read ? '1px solid #f1f5f9' : '1px solid rgba(79, 70, 229, 0.2)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                }}
              >
                {getIcon(item.type)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: '#64748b', lineHeight: '1.4' }}>{item.message}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>{item.date}</div>
              </div>
            </List.Item>
          )}
        />
      )}
    </Drawer>
  );
};
