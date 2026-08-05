import React, { useState } from 'react';
import { Avatar, Badge, Button, Input, Space, Tooltip } from 'antd';
import { Search, Bell, Sun, Moon, Sparkles, Command, Menu as MenuIcon, Mail } from 'lucide-react';
import type { UserSettings, NotificationItem } from '../types';
import { getTimeAwareGreeting } from '../utils/format';
import { NotificationDrawer } from './NotificationDrawer';

interface HeaderProps {
  settings: UserSettings;
  onToggleTheme: () => void;
  onOpenCommandPalette: () => void;
  notifications: NotificationItem[];
  onMarkRead: () => void;
  onOpenMobileMenu?: () => void;
  onOpenBankSync?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  onToggleTheme,
  onOpenCommandPalette,
  notifications,
  onMarkRead,
  onOpenMobileMenu,
  onOpenBankSync,
}) => {
  const [notifOpen, setNotifOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const { greeting, icon } = getTimeAwareGreeting(settings.userName);

  return (
    <header className="glass-card" style={{ padding: '10px 14px', margin: '0 0 12px 0', borderRadius: 20, width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
        {/* Left: Mobile Hamburger & Avatar Greeting */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          {onOpenMobileMenu && (
            <Button
              type="text"
              shape="circle"
              icon={<MenuIcon size={20} color="#4F46E5" />}
              onClick={onOpenMobileMenu}
              className="mobile-only"
              style={{ width: 36, height: 36, flexShrink: 0 }}
            />
          )}

          <Avatar src={settings.avatarUrl} size={36} style={{ border: '2px solid #4F46E5', cursor: 'pointer', flexShrink: 0 }} />

          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#64748b', fontWeight: 500 }}>
              <span>{icon}</span>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 90 }}>{greeting}</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 90 }}>{settings.userName}</span>
              <span className="desktop-only" style={{ fontSize: 11, padding: '1px 6px', borderRadius: 99, background: 'rgba(79, 70, 229, 0.1)', color: '#4F46E5', fontWeight: 600 }}>PRO</span>
            </div>
          </div>
        </div>

        {/* Center: Search & Command Palette Trigger (Desktop) */}
        <div className="desktop-only" style={{ flex: 1, maxWidth: 420 }}>
          <Input
            prefix={<Search size={16} color="#94a3b8" />}
            suffix={
              <div
                onClick={onOpenCommandPalette}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 11,
                  padding: '2px 6px',
                  borderRadius: 6,
                  background: 'rgba(148, 163, 184, 0.15)',
                  color: '#64748b',
                  cursor: 'pointer',
                }}
              >
                <Command size={12} /> K
              </div>
            }
            placeholder="Tìm kiếm giao dịch, danh mục, ví tiền..."
            onClick={onOpenCommandPalette}
            style={{
              borderRadius: 14,
              padding: '8px 16px',
              cursor: 'pointer',
            }}
            readOnly
          />
        </div>

        {/* Right: Actions */}
        <Space size={4} style={{ flexShrink: 0 }}>
          {/* Bank Email Sync Button */}
          <Tooltip title="Đồng bộ Email Ngân hàng (Gmail / iOS)">
            <Button
              type="text"
              shape="circle"
              icon={<Mail size={18} color="#7C3AED" />}
              onClick={onOpenBankSync}
              style={{ width: 34, height: 34 }}
            />
          </Tooltip>

          {/* Mobile Search Button */}
          <Button
            type="text"
            shape="circle"
            icon={<Search size={18} color="#64748b" />}
            onClick={onOpenCommandPalette}
            className="mobile-only"
            style={{ width: 34, height: 34 }}
          />

          <Tooltip title="Chuyển giao diện Sáng / Tối">
            <Button
              type="text"
              shape="circle"
              icon={settings.theme === 'dark' ? <Sun size={18} color="#F59E0B" /> : <Moon size={18} color="#4F46E5" />}
              onClick={onToggleTheme}
              style={{ width: 34, height: 34 }}
            />
          </Tooltip>

          <Tooltip title="Thông báo hệ thống">
            <Badge count={unreadCount} overflowCount={99} offset={[-4, 4]}>
              <Button
                type="text"
                shape="circle"
                icon={<Bell size={18} color={unreadCount > 0 ? '#4F46E5' : '#64748b'} />}
                onClick={() => setNotifOpen(true)}
                style={{ width: 34, height: 34 }}
              />
            </Badge>
          </Tooltip>

          <div className="desktop-only" style={{ alignItems: 'center', gap: 6, padding: '4px 12px', background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.1), rgba(124, 58, 237, 0.1))', borderRadius: 99, border: '1px solid rgba(79, 70, 229, 0.2)' }}>
            <Sparkles size={14} color="#7C3AED" />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#7C3AED' }}>AI Active</span>
          </div>
        </Space>
      </div>

      <NotificationDrawer
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        notifications={notifications}
        onMarkRead={onMarkRead}
      />
    </header>
  );
};
