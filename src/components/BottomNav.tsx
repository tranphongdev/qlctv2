import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  User,
  Plus,
} from 'lucide-react';
import { t } from '~/i18n';

interface BottomNavProps {
  activeTab: string;
  onSelectTab: (key: string) => void;
  onOpenAddModal?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab, onOpenAddModal }) => {
  const navItems = [
    { key: 'dashboard', label: t('nav.dashboard'), icon: <LayoutDashboard size={20} /> },
    { key: 'transactions', label: t('nav.transactions'), icon: <Receipt size={20} /> },
    { key: 'add', label: t('nav.add'), isAction: true },
    { key: 'wallets', label: t('nav.wallets_short'), icon: <Wallet size={20} /> },
    { key: 'profile', label: t('nav.profile'), icon: <User size={20} /> },
  ];

  return (
    <nav
      className="mobile-only mobile-bottom-nav"
      style={{
        position: 'fixed',
        bottom: 12,
        left: 12,
        right: 12,
        minHeight: 56,
        zIndex: 999,
        background: 'var(--glass-bg-strong)',
        backdropFilter: 'blur(var(--glass-blur-strong)) saturate(180%)',
        WebkitBackdropFilter: 'blur(var(--glass-blur-strong)) saturate(180%)',
        borderRadius: 28,
        padding: '8px 12px',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--glass-shadow-hover), var(--glass-sheen)',
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
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              {/* FAB nổi lên khỏi mặt thanh nav: đường kính lớn hơn hàng icon và
                  được đẩy lên bằng translateY, nên nó luôn là điểm chạm rõ nhất. */}
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: 'var(--accent-gradient)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  transform: 'translateY(-10px)',
                  border: '1px solid rgba(255, 255, 255, 0.35)',
                  boxShadow: '0 10px 24px -6px rgba(37, 99, 235, 0.6), var(--glass-sheen)',
                  transition: 'transform 0.2s var(--ease-spring)',
                }}
                onTouchStart={(e) => {
                  e.currentTarget.style.transform = 'translateY(-10px) scale(0.92)';
                }}
                onTouchEnd={(e) => {
                  e.currentTarget.style.transform = 'translateY(-10px)';
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
              justifyContent: 'center',
              padding: '2px 8px',
              borderRadius: 12,
              cursor: 'pointer',
              color: isActive ? '#2563EB' : 'var(--text-muted)',
              fontWeight: isActive ? 700 : 500,
              transition: 'all 0.2s ease',
              minWidth: 56,
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.icon}</span>
            <span style={{ fontSize: 10, lineHeight: 1, whiteSpace: 'nowrap', marginTop: 3 }}>{item.label}</span>
          </div>
        );
      })}
    </nav>
  );
};
