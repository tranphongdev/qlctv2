import React from 'react';
import { Layout, Button, Drawer } from 'antd';
import { HintTooltip } from './HintTooltip';
import { BrandMark } from './BrandMark';
import { t } from '~/i18n';
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  PieChart,
  Target,
  HandCoins,
  BarChart3,
  Calendar,
  Sparkles,
  User,
  Tags,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

const { Sider } = Layout;

export interface MenuItemDef {
  key: string;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
}

interface SidebarProps {
  activeTab: string;
  onSelectTab: (key: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

/**
 * Hàm chứ không phải hằng module-level: nhãn phải được dịch lại mỗi lượt render,
 * nếu tính sẵn một lần lúc import thì đổi ngôn ngữ sẽ không cập nhật menu.
 */
export const getMenuItems = (): MenuItemDef[] => [
  { key: 'dashboard', label: t('nav.dashboard'), icon: <LayoutDashboard size={20} /> },
  { key: 'transactions', label: t('nav.transactions'), icon: <Receipt size={20} /> },
  { key: 'wallets', label: t('nav.wallets'), icon: <Wallet size={20} /> },
  { key: 'categories', label: t('nav.categories'), icon: <Tags size={20} /> },
  { key: 'budgets', label: t('nav.budgets'), icon: <PieChart size={20} /> },
  { key: 'goals', label: t('nav.goals'), icon: <Target size={20} /> },
  { key: 'debts', label: t('nav.debts'), icon: <HandCoins size={20} /> },
  { key: 'analytics', label: t('nav.analytics'), icon: <BarChart3 size={20} /> },
  { key: 'calendar', label: t('nav.calendar'), icon: <Calendar size={20} /> },
  { key: 'ai_insights', label: t('nav.ai_insights'), icon: <Sparkles size={20} />, badge: 'HOT' },
  { key: 'profile', label: t('nav.profile'), icon: <User size={20} /> },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
}) => {
  return (
    <>
    <Sider
      collapsible
      collapsed={collapsed}
      trigger={null}
      width={240}
      collapsedWidth={80}
      className={`glass-card glass-static desktop-only app-sidebar${collapsed ? ' is-collapsed' : ''}`}
      style={{
        margin: 0,
        borderRadius: 0,
        overflow: 'hidden',
        height: '100vh',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        // Chỉ giữ cạnh phải: sidebar chạy sát ba mép màn hình nên viền trên,
        // dưới và trái sẽ thành ba nét thừa dính vào cạnh cửa sổ.
        borderTop: 'none',
        borderBottom: 'none',
        borderLeft: 'none',
        borderRight: '1px solid var(--glass-border)',
        boxShadow: 'none',
      }}
    >
      <div className="sidebar-brand">
        <BrandMark
          size={36}
          title="Financial"
          style={{ boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)', borderRadius: 9, flexShrink: 0 }}
        />
        <div className="sidebar-brand__text">
          <div className="sidebar-brand__name">Financial</div>
          <div className="sidebar-brand__tagline">{t('sidebar.tagline')}</div>
        </div>
      </div>

      {/* Navigation List */}
      <div className="sidebar-nav">
        {getMenuItems().map((item) => {
          const isActive = activeTab === item.key;
          return (
            <HintTooltip key={item.key} title={collapsed ? item.label : ''} placement="right">
              <div
                className={`sidebar-nav__item${isActive ? ' is-active' : ''}`}
                onClick={() => onSelectTab(item.key)}
              >
                <span className="sidebar-nav__icon">{item.icon}</span>
                <span className="sidebar-nav__label">{item.label}</span>
                {item.badge && <span className="sidebar-nav__badge">{item.badge}</span>}
              </div>
            </HintTooltip>
          );
        })}
      </div>

    </Sider>
      <button
        type="button"
        className="sidebar-toggle"
        onClick={onToggleCollapse}
        aria-label={collapsed ? t('sidebar.expand') : t('sidebar.collapse')}
        aria-expanded={!collapsed}
        style={{ left: collapsed ? 80 : 240 }}
      >
        {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
      </button>
    </>
  );
};

interface MobileSidebarDrawerProps {
  open: boolean;
  onClose: () => void;
  activeTab: string;
  onSelectTab: (key: string) => void;
}

export const MobileSidebarDrawer: React.FC<MobileSidebarDrawerProps> = ({
  open,
  onClose,
  activeTab,
  onSelectTab,
}) => {
  return (
    <Drawer
      placement="left"
      size={280}
      onClose={onClose}
      open={open}
      closeIcon={null}
      /* paddingTop né thanh trạng thái khi mở từ app đã cài (PWA standalone). */
      styles={{ body: { padding: '16px 12px', paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))' } }}
    >
      {/* Drawer Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16, marginBottom: 12, borderBottom: '1px solid rgba(148, 163, 184, 0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BrandMark size={36} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, background: 'linear-gradient(135deg, #2563EB, #7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Financial
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>{t('sidebar.tagline')}</div>
          </div>
        </div>

        <Button type="text" shape="circle" icon={<X size={20} />} onClick={onClose} />
      </div>

      {/* Drawer Menu Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {getMenuItems().map((item) => {
          const isActive = activeTab === item.key;
          return (
            <div
              key={item.key}
              onClick={() => {
                onSelectTab(item.key);
                onClose();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: 14,
                cursor: 'pointer',
                background: isActive
                  ? 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)'
                  : 'transparent',
                color: isActive ? '#ffffff' : 'var(--text-muted)',
                fontWeight: isActive ? 600 : 500,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span>{item.icon}</span>
                <span style={{ fontSize: 15 }}>{item.label}</span>
              </div>

              {item.badge && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: 99,
                    background: isActive ? '#ffffff' : '#EF4444',
                    color: isActive ? '#2563EB' : '#ffffff',
                  }}
                >
                  {item.badge}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </Drawer>
  );
};
