import React from 'react';
import { Layout, Button, Tooltip, Drawer } from 'antd';
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

export const menuItems: MenuItemDef[] = [
  { key: 'dashboard', label: 'Tổng quan', icon: <LayoutDashboard size={20} /> },
  { key: 'transactions', label: 'Giao dịch', icon: <Receipt size={20} /> },
  { key: 'wallets', label: 'Ví & Tài khoản', icon: <Wallet size={20} /> },
  { key: 'categories', label: 'Danh mục', icon: <Tags size={20} /> },
  { key: 'budgets', label: 'Ngân sách', icon: <PieChart size={20} /> },
  { key: 'goals', label: 'Tiết kiệm', icon: <Target size={20} /> },
  { key: 'debts', label: 'Nợ & Cho vay', icon: <HandCoins size={20} /> },
  { key: 'analytics', label: 'Thống kê', icon: <BarChart3 size={20} /> },
  { key: 'calendar', label: 'Theo lịch', icon: <Calendar size={20} /> },
  { key: 'ai_insights', label: 'AI Financial', icon: <Sparkles size={20} />, badge: 'HOT' },
  { key: 'profile', label: 'Cài đặt', icon: <User size={20} /> },
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
      className="glass-card desktop-only"
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
        borderRight: '1px solid rgba(148, 163, 184, 0.15)',
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
          borderBottom: '1px solid rgba(148, 163, 184, 0.15)',
          flexShrink: 0,
        }}
      >
        {!collapsed ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 800,
                fontSize: 18,
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
              }}
            >
              $
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.3px', background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Financial PRO
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>Quản lý chi tiêu</div>
            </div>
          </div>
        ) : (
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 800,
              fontSize: 18,
            }}
          >
            $
          </div>
        )}
      </div>

      {/* Navigation List */}
      <div style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
        {menuItems.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <div key={item.key} style={{ marginBottom: 4 }}>
              <Tooltip title={collapsed ? item.label : ''} placement="right">
                <div
                  onClick={() => onSelectTab(item.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'space-between',
                    padding: collapsed ? '12px 0' : '10px 16px',
                    borderRadius: 14,
                    cursor: 'pointer',
                    background: isActive
                      ? 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)'
                      : 'transparent',
                    color: isActive ? '#ffffff' : '#64748b',
                    fontWeight: isActive ? 600 : 500,
                    transition: 'all 0.2s ease',
                    boxShadow: isActive ? '0 6px 16px rgba(79, 70, 229, 0.35)' : 'none',
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
                        color: isActive ? '#4F46E5' : '#ffffff',
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              </Tooltip>
            </div>
          );
        })}
      </div>

      {/* Collapse Toggle Footer */}
      <div
        style={{
          padding: 12,
          borderTop: '1px solid rgba(148, 163, 184, 0.15)',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Button
          type="text"
          shape="circle"
          onClick={onToggleCollapse}
          icon={collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          style={{ width: 36, height: 36, color: '#64748b' }}
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
      width={280}
      onClose={onClose}
      open={open}
      closeIcon={null}
      styles={{ body: { padding: '16px 12px' } }}
    >
      {/* Drawer Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16, marginBottom: 12, borderBottom: '1px solid rgba(148, 163, 184, 0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 800,
              fontSize: 18,
            }}
          >
            $
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Financial PRO
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>Quản lý chi tiêu</div>
          </div>
        </div>

        <Button type="text" shape="circle" icon={<X size={20} />} onClick={onClose} />
      </div>

      {/* Drawer Menu Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {menuItems.map((item) => {
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
                  ? 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)'
                  : 'transparent',
                color: isActive ? '#ffffff' : '#64748b',
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
                    color: isActive ? '#4F46E5' : '#ffffff',
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
