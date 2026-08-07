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
    <Sider
      collapsible
      collapsed={collapsed}
      trigger={null}
      width={240}
      collapsedWidth={80}
      className="glass-card glass-static desktop-only"
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
      {/* Brand Header */}
      <div
        style={{
          height: 64,
          padding: collapsed ? '0 12px' : '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          borderBottom: '1px solid var(--surface-border)',
          flexShrink: 0,
        }}
      >
        {!collapsed ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BrandMark size={36} style={{ boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)', borderRadius: 9, flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.3px', background: 'linear-gradient(135deg, #2563EB, #7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Financial
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>{t('sidebar.tagline')}</div>
            </div>
          </div>
        ) : (
          <BrandMark size={36} title="Financial" />
        )}
      </div>

      {/* Navigation List */}
      <div style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
        {getMenuItems().map((item) => {
          const isActive = activeTab === item.key;
          return (
            <div key={item.key} style={{ marginBottom: 4 }}>
              <HintTooltip title={collapsed ? item.label : ''} placement="right">
                <div
                  onClick={() => onSelectTab(item.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'space-between',
                    padding: collapsed ? '12px 0' : '10px 16px',
                    borderRadius: 16,
                    cursor: 'pointer',
                    // Item đang chọn là một viên kính nổi hẳn lên khỏi mặt sidebar,
                    // với dải nhấn và bóng riêng. Item thường để trong suốt hoàn
                    // toàn — tô nền cho cả 11 mục sẽ biến sidebar thành một cột sọc.
                    background: isActive ? 'var(--accent-gradient)' : 'transparent',
                    color: isActive ? '#ffffff' : 'var(--text-secondary)',
                    fontWeight: isActive ? 600 : 500,
                    border: isActive ? '1px solid rgba(255, 255, 255, 0.28)' : '1px solid transparent',
                    boxShadow: isActive
                      ? '0 8px 20px -6px rgba(37, 99, 235, 0.45), var(--glass-sheen)'
                      : 'none',
                    transition:
                      'background-color 0.22s var(--ease-out), color 0.22s var(--ease-out), box-shadow 0.22s var(--ease-out)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'var(--surface-subtle)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ display: 'flex', alignItems: 'center' }}>{item.icon}</span>
                    {!collapsed && <span style={{ fontSize: 14 }}>{item.label}</span>}
                  </div>

                  {!collapsed && item.badge && (
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
              </HintTooltip>
            </div>
          );
        })}
      </div>

      {/* Collapse Toggle Footer */}
      <div
        style={{
          padding: 12,
          borderTop: '1px solid var(--surface-border)',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Button
          type="text"
          shape="circle"
          onClick={onToggleCollapse}
          icon={collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          style={{ width: 36, height: 36, color: 'var(--text-muted)' }}
        />
      </div>
    </Sider>
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
