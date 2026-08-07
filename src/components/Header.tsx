import React, { useState } from 'react';
import { Avatar, Badge, Button, Dropdown } from 'antd';
import { HintTooltip } from './HintTooltip';
import type { MenuProps } from 'antd';
import {
  Search,
  Bell,
  Sun,
  Moon,
  Sparkles,
  Command,
  ChevronDown,
  Menu as MenuIcon,
  LogIn,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import type { UserSettings, NotificationItem } from '~/types';
import type { AuthUser } from '~/lib/auth';
import { getTimeAwareGreeting } from '~/utils/format';
import { t } from '~/i18n';
import { useScrolled } from '~/hooks/useScrolled';
import { NotificationDrawer } from './NotificationDrawer';

interface HeaderProps {
  settings: UserSettings;
  currentUser: AuthUser | null;
  sidebarCollapsed?: boolean;
  /** Trạng thái giao diện thật, do App giữ. Không đọc settings.theme: trường đó
   *  chưa bao giờ được ghi nên icon sẽ đứng im dù người dùng bấm đổi giao diện. */
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenCommandPalette: () => void;
  notifications: NotificationItem[];
  onMarkRead: () => void;
  onOpenMobileMenu?: () => void;
  onOpenAuthModal: () => void;
  onLogout: () => void;
  onSelectTab: (tab: string) => void;
}

/**
 * Thanh trên cùng.
 *
 * Bố cục ba phần: ô tìm kiếm chiếm phần lớn bề ngang bên trái, cụm hành động
 * dồn hết về phải, và cụm người dùng là thứ cuối cùng. Cụm người dùng trước đây
 * nằm bên TRÁI, ngay cạnh nút menu — chỗ đó là chỗ của thương hiệu và điều
 * hướng, còn danh tính người dùng thì mọi app đều đặt ở góc phải, nên đặt sai
 * bên khiến người dùng phải học lại một quy ước họ đã biết.
 *
 * Nền là kính, cùng bộ token với sidebar và thẻ (xem .app-header trong
 * index.css). Bản trước cho header TRONG SUỐT HẲN khi chưa cuộn rồi mới đặc
 * lại lúc cuộn — khi đó ô tìm kiếm và cụm người dùng trôi lơ lửng trên nội
 * dung, phải bọc mỗi cụm trong một viên kính riêng để chúng có chỗ đứng. Kính
 * ở bậc `strong` thì luôn là một mặt phẳng có thật, nên hai viên kính con đó
 * bỏ được, mà vẫn thấy nội dung trôi qua bên dưới.
 */
export const Header: React.FC<HeaderProps> = ({
  settings,
  currentUser,
  sidebarCollapsed = false,
  isDark,
  onToggleTheme,
  onOpenCommandPalette,
  notifications,
  onMarkRead,
  onOpenMobileMenu,
  onOpenAuthModal,
  onLogout,
  onSelectTab,
}) => {
  const [notifOpen, setNotifOpen] = useState(false);
  const scrolled = useScrolled();
  const unreadCount = notifications.filter((n) => !n.read).length;
  // settings là nguồn sự thật vì người dùng sửa được tên và ảnh trong trang Cài đặt;
  // currentUser chỉ là ảnh chụp lúc đăng nhập nên không phản ánh thay đổi sau đó.
  const displayName = currentUser ? settings.fullName || currentUser.name : t('header.guest');
  const avatarUrl = settings.avatarUrl || currentUser?.avatarUrl;
  const { greeting } = currentUser
    ? getTimeAwareGreeting()
    : { greeting: t('header.greeting_default') };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'user-info',
      disabled: true,
      label: (
        <div style={{ padding: '4px 0', borderBottom: '1px solid var(--surface-border)' }}>
          <div style={{ fontWeight: 700, color: 'var(--text-heading)' }}>{displayName}</div>
          {/* Email giờ là tuỳ chọn, nên không dùng nó để phân biệt đã đăng nhập hay
              chưa: người vừa đăng ký chưa khai email sẽ bị gắn nhãn "Chế độ Demo
              Khách" dù đang đăng nhập hẳn hoi. Danh tính luôn có là username. */}
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {currentUser ? currentUser.email || `@${currentUser.username}` : t('header.demo_mode')}
          </div>
        </div>
      ),
    },
    {
      key: 'profile',
      icon: <UserIcon size={16} />,
      label: t('header.profile_settings'),
      onClick: () => onSelectTab('profile'),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogOut size={16} color="#EF4444" />,
      label: <span style={{ color: '#EF4444', fontWeight: 600 }}>{t('header.logout')}</span>,
      onClick: onLogout,
    },
  ];

  return (
    <header
      className={`app-header${scrolled ? ' app-header--scrolled' : ''}`}
      style={{ left: sidebarCollapsed ? 80 : 240 }}
    >
      {onOpenMobileMenu && (
        <button
          type="button"
          className="app-header__icon-btn mobile-only"
          onClick={onOpenMobileMenu}
          aria-label={t('nav.dashboard')}
        >
          <MenuIcon size={20} />
        </button>
      )}

      {/* Nút chứ không phải <input>: ô này không nhận chữ, nó mở bảng lệnh. Bản
          trước dùng antd Input readOnly nên trên máy tính nó vẫn nhận focus như
          một ô nhập và trình đọc màn hình đọc ra "textbox" — sai cả hai. */}
      <button type="button" className="app-header__search desktop-only" onClick={onOpenCommandPalette}>
        <Search size={17} className="app-header__search-icon" />
        <span className="app-header__search-text">{t('header.search_placeholder')}</span>
        <kbd className="app-header__kbd">
          <Command size={11} /> K
        </kbd>
      </button>

      <div className="app-header__actions">
        <button
          type="button"
          className="app-header__icon-btn mobile-only"
          onClick={onOpenCommandPalette}
          aria-label={t('header.search_placeholder')}
        >
          <Search size={18} />
        </button>

        <HintTooltip title={t('header.tip_toggle_theme')}>
          <button type="button" className="app-header__icon-btn" onClick={onToggleTheme} aria-label={t('header.tip_toggle_theme')}>
            {isDark ? <Sun size={18} color="#F59E0B" /> : <Moon size={18} />}
          </button>
        </HintTooltip>

        <HintTooltip title={t('header.tip_notifications')}>
          <Badge count={unreadCount} overflowCount={99} offset={[-4, 5]}>
            <button
              type="button"
              className="app-header__icon-btn"
              onClick={() => setNotifOpen(true)}
              aria-label={t('header.tip_notifications')}
            >
              <Bell size={18} color={unreadCount > 0 ? 'var(--primary-color)' : undefined} />
            </button>
          </Badge>
        </HintTooltip>

        <span className="app-header__ai desktop-only">
          <Sparkles size={14} />
          AI Active
        </span>

        {currentUser ? (
          <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
            <button type="button" className="app-header__user">
              <Avatar src={avatarUrl} size={38} className="app-header__avatar">
                {displayName.charAt(0).toUpperCase()}
              </Avatar>
              <span className="app-header__user-text desktop-only">
                <span className="app-header__greeting">{greeting},</span>
                <span className="app-header__name">{displayName}</span>
              </span>
              <ChevronDown size={16} className="app-header__caret desktop-only" />
            </button>
          </Dropdown>
        ) : (
          <Button
            type="primary"
            icon={<LogIn size={15} />}
            onClick={onOpenAuthModal}
            style={{ borderRadius: 12, fontWeight: 700, background: 'var(--accent-gradient)', border: 'none' }}
          >
            {t('header.login_register')}
          </Button>
        )}
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
