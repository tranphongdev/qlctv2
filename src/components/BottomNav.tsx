import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  User,
  Plus,
} from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  onSelectTab: (key: string) => void;
  onOpenAddModal?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab, onOpenAddModal }) => {
  const navItems = [
    { key: 'dashboard', label: 'Tổng quan', icon: <LayoutDashboard size={20} /> },
    { key: 'transactions', label: 'Giao dịch', icon: <Receipt size={20} /> },
    { key: 'add', label: 'Thêm', isAction: true },
    { key: 'wallets', label: 'Ví tiền', icon: <Wallet size={20} /> },
    { key: 'profile', label: 'Cài đặt', icon: <User size={20} /> },
  ];

  return (
    <nav
      className="mobile-only mobile-bottom-nav"
      style={{
        position: 'fixed',
        bottom: 8,
        left: 8,
        right: 8,
        zIndex: 999,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: 24,
        padding: '4px 6px',
        border: '1px solid rgba(226, 232, 240, 0.8)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
      }}
    >
      {navItems.map((item) => {
        if (item.isAction) {
          return (
            <div
              key="add-action"
              onClick={onOpenAddModal}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: -16,
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 99,
                  background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  boxShadow: '0 6px 16px rgba(79, 70, 229, 0.4)',
                }}
              >
                <Plus size={24} />
              </div>
            </div>
          );
        }

        const isActive = activeTab === item.key;
        return (
          <div
            key={item.key}
            onClick={() => onSelectTab(item.key)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              padding: '6px 8px',
              borderRadius: 12,
              cursor: 'pointer',
              color: isActive ? '#4F46E5' : '#64748b',
              fontWeight: isActive ? 700 : 500,
              transition: 'all 0.2s ease',
              minWidth: 56,
            }}
          >
            <span>{item.icon}</span>
            <span style={{ fontSize: 10, whiteSpace: 'nowrap' }}>{item.label}</span>
          </div>
        );
      })}
    </nav>
  );
};
