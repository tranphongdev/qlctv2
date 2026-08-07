import React, { useState, useEffect } from 'react';
import { Modal, Input, List, Tag } from 'antd';
import { t } from '~/i18n';
import {
  Search,
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
  PlusCircle,
  ArrowRight,
} from 'lucide-react';
import { removeAccents } from '~/utils/format';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onSelectTab: (tab: string) => void;
  onOpenAddModal: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  open,
  onClose,
  onSelectTab,
  onOpenAddModal,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (open) setQuery('');
  }, [open]);

  const commands = [
    {
      id: 'cmd_add',
      title: t('cmd.add_tx_title'),
      subtitle: t('cmd.add_tx_subtitle'),
      icon: <PlusCircle size={18} color="#22C55E" />,
      action: () => {
        onClose();
        onOpenAddModal();
      },
      category: t('cmd.cat_quick_actions'),
    },
    {
      id: 'nav_dashboard',
      title: t('cmd.dashboard_title'),
      subtitle: t('cmd.dashboard_subtitle'),
      icon: <LayoutDashboard size={18} color="#2563EB" />,
      action: () => {
        onClose();
        onSelectTab('dashboard');
      },
      category: t('cmd.cat_navigation'),
    },
    {
      id: 'nav_transactions',
      title: t('cmd.transactions_title'),
      subtitle: t('cmd.transactions_subtitle'),
      icon: <Receipt size={18} color="#7C3AED" />,
      action: () => {
        onClose();
        onSelectTab('transactions');
      },
      category: t('cmd.cat_navigation'),
    },
    {
      id: 'nav_wallets',
      title: t('cmd.wallets_title'),
      subtitle: t('cmd.wallets_subtitle'),
      icon: <Wallet size={18} color="#2563EB" />,
      action: () => {
        onClose();
        onSelectTab('wallets');
      },
      category: t('cmd.cat_navigation'),
    },
    {
      id: 'nav_budgets',
      title: t('cmd.budgets_title'),
      subtitle: t('cmd.budgets_subtitle'),
      icon: <PieChart size={18} color="#F59E0B" />,
      action: () => {
        onClose();
        onSelectTab('budgets');
      },
      category: t('cmd.cat_navigation'),
    },
    {
      id: 'nav_goals',
      title: t('cmd.goals_title'),
      subtitle: t('cmd.goals_subtitle'),
      icon: <Target size={18} color="#EC4899" />,
      action: () => {
        onClose();
        onSelectTab('goals');
      },
      category: t('cmd.cat_navigation'),
    },
    {
      id: 'nav_debts',
      title: t('cmd.debts_title'),
      subtitle: t('cmd.debts_subtitle'),
      icon: <HandCoins size={18} color="#10B981" />,
      action: () => {
        onClose();
        onSelectTab('debts');
      },
      category: t('cmd.cat_navigation'),
    },
    {
      id: 'nav_analytics',
      title: t('cmd.analytics_title'),
      subtitle: t('cmd.analytics_subtitle'),
      icon: <BarChart3 size={18} color="#3B82F6" />,
      action: () => {
        onClose();
        onSelectTab('analytics');
      },
      category: t('cmd.cat_navigation'),
    },
    {
      id: 'nav_calendar',
      title: t('cmd.calendar_title'),
      subtitle: t('cmd.calendar_subtitle'),
      icon: <Calendar size={18} color="#8B5CF6" />,
      action: () => {
        onClose();
        onSelectTab('calendar');
      },
      category: t('cmd.cat_navigation'),
    },
    {
      id: 'nav_ai',
      title: t('cmd.ai_title'),
      subtitle: t('cmd.ai_subtitle'),
      icon: <Sparkles size={18} color="#7C3AED" />,
      action: () => {
        onClose();
        onSelectTab('ai_insights');
      },
      category: 'AI Tool',
    },
    {
      id: 'nav_profile',
      title: t('cmd.settings_title'),
      subtitle: t('cmd.settings_subtitle'),
      icon: <User size={18} />,
      action: () => {
        onClose();
        onSelectTab('profile');
      },
      category: t('cmd.cat_settings'),
    },
  ];

  const filtered = commands.filter((cmd) => {
    if (!query) return true;
    const cleanQ = removeAccents(query);
    return (
      removeAccents(cmd.title).includes(cleanQ) ||
      removeAccents(cmd.subtitle).includes(cleanQ) ||
      removeAccents(cmd.category).includes(cleanQ)
    );
  });

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      closable={false}
      width={600}
      style={{ top: 80 }}
      styles={{ body: { padding: 0 } }}
    >
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(148, 163, 184, 0.15)' }}>
        <Input
          prefix={<Search size={20} color="#2563EB" style={{ marginRight: 8 }} />}
          placeholder={t('cmd.search_placeholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          variant="borderless"
          style={{ fontSize: 16 }}
          autoFocus
        />
      </div>

      <div style={{ maxHeight: 420, overflowY: 'auto', padding: '12px 16px' }}>
        <List
          dataSource={filtered}
          renderItem={(item) => (
            <List.Item
              onClick={item.action}
              style={{
                padding: '12px 16px',
                borderRadius: 12,
                cursor: 'pointer',
                marginBottom: 6,
                border: 'none',
                transition: 'background 0.2s ease',
              }}
              className="cmd-item"
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: 'var(--surface-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-heading)' }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.subtitle}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Tag color="blue">{item.category}</Tag>
                  <ArrowRight size={16} />
                </div>
              </div>
            </List.Item>
          )}
        />
      </div>

      <div
        style={{
          padding: '10px 20px',
          borderTop: '1px solid rgba(148, 163, 184, 0.15)',
          background: 'var(--surface-subtle)',
          fontSize: 12,
          color: '#94a3b8',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>
          {t('cmd.esc_hint_prefix')} <kbd style={{ background: 'rgba(148, 163, 184, 0.25)', padding: '2px 6px', borderRadius: 4, color: 'var(--text-body)' }}>ESC</kbd> {t('cmd.esc_hint_suffix')}
        </span>
        <span>Command Palette</span>
      </div>
    </Modal>
  );
};
