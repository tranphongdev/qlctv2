import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  User,
  Plus,
} from 'lucide-react';
import { t } from '../i18n';

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
        background: 'var(--surface-elevated)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: 28,
        padding: '8px 12px',
        border: '1px solid var(--surface-border)',
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
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  boxShadow: '0 4px 14px rgba(79, 70, 229, 0.4)',
                }}
              >
                <Plus size={20} />
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
              color: isActive ? '#4F46E5' : 'var(--text-muted)',
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
