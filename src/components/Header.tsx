import React, { useState } from 'react';
import { Avatar, Badge, Button, Input, Space, Tooltip, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { Search, Bell, Sun, Moon, Sparkles, Command, Menu as MenuIcon, Mail, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import type { UserSettings, NotificationItem } from '../types';
import type { AuthUser } from '../lib/auth';
import { getTimeAwareGreeting } from '../utils/format';
import { NotificationDrawer } from './NotificationDrawer';

interface HeaderProps {
  settings: UserSettings;
  currentUser: AuthUser | null;
  sidebarCollapsed?: boolean;
  onToggleTheme: () => void;
  onOpenCommandPalette: () => void;
  notifications: NotificationItem[];
  onMarkRead: () => void;
  onOpenMobileMenu?: () => void;
  onOpenBankSync?: () => void;
  onOpenAuthModal: () => void;
  onLogout: () => void;
  onSelectTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  currentUser,
  sidebarCollapsed = false,
  onToggleTheme,
  onOpenCommandPalette,
  notifications,
  onMarkRead,
  onOpenMobileMenu,
  onOpenBankSync,
  onOpenAuthModal,
  onLogout,
  onSelectTab,
}) => {
  const [notifOpen, setNotifOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const userName = currentUser ? currentUser.name : 'Khách';
  const { greeting, icon } = currentUser
    ? getTimeAwareGreeting(currentUser.name)
    : { greeting: 'Chào bạn!', icon: '👋' };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'user-info',
      disabled: true,
      label: (
        <div style={{ padding: '4px 0', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ fontWeight: 700, color: '#1e293b' }}>{userName}</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>{currentUser?.email || 'Chế độ Demo Khách'}</div>
        </div>
      ),
    },
    {
      key: 'profile',
      icon: <UserIcon size={16} />,
      label: 'Hồ sơ & Cài đặt',
      onClick: () => onSelectTab('profile'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogOut size={16} color="#EF4444" />,
      label: <span style={{ color: '#EF4444', fontWeight: 600 }}>Đăng xuất</span>,
      onClick: onLogout,
    },
  ];

  return (
    <header
      className="glass-card header-fixed-bar"
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        left: sidebarCollapsed ? 80 : 240,
        height: 64,
        padding: '0 24px',
        margin: 0,
        borderRadius: 0,
        zIndex: 1000,
        borderBottom: '1px solid rgba(148, 163, 184, 0.15)',
        display: 'flex',
        alignItems: 'center',
        transition: 'left 0.2s ease',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, width: '100%' }}>
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

          {currentUser ? (
            <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomLeft">
              <Avatar
                src={currentUser.avatarUrl || settings.avatarUrl}
                size={36}
                style={{ border: '2px solid #4F46E5', cursor: 'pointer', flexShrink: 0 }}
              />
            </Dropdown>
          ) : (
            <Avatar src={settings.avatarUrl} size={36} style={{ border: '2px solid #94a3b8', cursor: 'pointer', flexShrink: 0 }} onClick={onOpenAuthModal} />
          )}

          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#64748b', fontWeight: 500 }}>
              <span>{icon}</span>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 90 }}>{greeting}</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 90 }}>{userName}</span>
              {currentUser && (
                <span className="desktop-only" style={{ fontSize: 11, padding: '1px 6px', borderRadius: 99, background: 'rgba(79, 70, 229, 0.1)', color: '#4F46E5', fontWeight: 600 }}>PRO</span>
              )}
            </div>
          </div>
        </div>

        {/* Center: Search & Command Palette Trigger (Desktop) */}
        <div className="desktop-only" style={{ width: 220 }}>
          <Input
            prefix={<Search size={14} color="#94a3b8" />}
            suffix={
              <div
                onClick={onOpenCommandPalette}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  fontSize: 10,
                  padding: '2px 4px',
                  borderRadius: 4,
                  background: 'rgba(148, 163, 184, 0.15)',
                  color: '#64748b',
                  cursor: 'pointer',
                }}
              >
                <Command size={10} /> K
              </div>
            }
            placeholder="Tìm kiếm..."
            onClick={onOpenCommandPalette}
            style={{
              borderRadius: 8,
              padding: '4px 10px',
              cursor: 'pointer',
            }}
            readOnly
          />
        </div>

        {/* Right: Actions */}
        <Space size={4} style={{ flexShrink: 0 }}>
          {!currentUser && (
            <Button
              type="primary"
              icon={<LogIn size={15} />}
              size="middle"
              onClick={onOpenAuthModal}
              style={{
                borderRadius: 12,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                border: 'none',
              }}
            >
              Đăng nhập / Đăng ký
            </Button>
          )}

          {/* Bank Email Sync Button */}
          <Tooltip title="Đồng bộ Email Ngân hàng">
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

