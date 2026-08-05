import { useState, useEffect } from 'react';
import { ConfigProvider, Layout, theme as antdTheme, message, Button } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { useAppState, deleteTransaction, bulkDeleteTransactions, restoreTransaction, addTransaction } from './store/appStore';
import { Header } from './components/Header';
import { Sidebar, MobileSidebarDrawer } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { CommandPalette } from './components/CommandPalette';
import { QuickActionFab } from './components/QuickActionFab';
import { AddTransactionModal } from './components/AddTransactionModal';
import { BankEmailSyncModal } from './components/BankEmailSyncModal';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { Wallets } from './pages/Wallets';
import { CategoriesPage } from './pages/CategoriesPage';
import { Budgets } from './pages/Budgets';
import { Goals } from './pages/Goals';
import { Debts } from './pages/Debts';
import { Analytics } from './pages/Analytics';
import { CalendarView } from './pages/CalendarView';
import { AIInsights } from './pages/AIInsights';
import { ProfileSettings } from './pages/ProfileSettings';
import type { Transaction } from './types';

const THEME_KEY = 'quan_ly_chi_tieu_pro_theme';

export default function App() {
  const state = useAppState();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [bankEmailModalOpen, setBankEmailModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved) return saved as 'light' | 'dark';
    } catch {
      /* ignore */
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const isDark = themeMode === 'dark';

  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, themeMode);
    } catch {
      /* ignore */
    }
    if (isDark) {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    }
  }, [themeMode]);

  // Keyboard shortcut listener for Ctrl + K / Cmd + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggleTheme = () => {
    setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleOpenAddModal = (initialTx?: Transaction) => {
    setEditingTx(initialTx || null);
    setAddModalOpen(true);
  };

  const handleDeleteTx = (id: string) => {
    const deleted = deleteTransaction(id);
    if (deleted) {
      message.success({
        content: (
          <span>
            Đã xóa giao dịch.{' '}
            <Button
              type="link"
              size="small"
              onClick={() => {
                restoreTransaction(deleted);
                message.info('Đã hoàn tác xóa giao dịch!');
              }}
            >
              Hoàn tác (Undo)
            </Button>
          </span>
        ),
        duration: 5,
      });
    }
  };

  return (
    <ConfigProvider
      locale={viVN}
      theme={{
        algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#4F46E5',
          colorSuccess: '#22C55E',
          colorWarning: '#F59E0B',
          colorError: '#EF4444',
          borderRadius: 16,
          fontFamily: "'Inter', 'Manrope', -apple-system, sans-serif",
        },
      }}
    >
      <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
        <div style={{ display: 'flex', width: '100%', minHeight: '100vh' }}>
          {/* Desktop Sidebar */}
          <Sidebar
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />

          {/* Mobile Sidebar Drawer */}
          <MobileSidebarDrawer
            open={mobileDrawerOpen}
            onClose={() => setMobileDrawerOpen(false)}
            activeTab={activeTab}
            onSelectTab={setActiveTab}
          />

          {/* Main Content Area */}
          <Layout style={{ flex: 1, minWidth: 0, paddingBottom: 100, overflowX: 'hidden' }}>
            <Header
              settings={state.settings}
              onToggleTheme={handleToggleTheme}
              onOpenCommandPalette={() => setCmdOpen(true)}
              notifications={state.notifications}
              onMarkRead={() => message.success('Đã đọc tất cả thông báo')}
              onOpenMobileMenu={() => setMobileDrawerOpen(true)}
              onOpenBankSync={() => setBankEmailModalOpen(true)}
            />

            <main style={{ padding: '12px 12px 0', minHeight: '80vh', width: '100%', maxWidth: '100vw', overflowX: 'hidden' }}>
              {activeTab === 'dashboard' && (
                <Dashboard
                  state={state}
                  onOpenAddModal={() => handleOpenAddModal()}
                  onSelectTab={setActiveTab}
                />
              )}
              {activeTab === 'transactions' && (
                <Transactions
                  state={state}
                  onOpenAddModal={handleOpenAddModal}
                  onDeleteTx={handleDeleteTx}
                  onBulkDelete={bulkDeleteTransactions}
                  onOpenBankSync={() => setBankEmailModalOpen(true)}
                />
              )}
              {activeTab === 'wallets' && (
                <Wallets 
                  state={state} 
                  onOpenBankSync={() => setBankEmailModalOpen(true)}
                />
              )}
              {activeTab === 'categories' && <CategoriesPage state={state} />}
              {activeTab === 'budgets' && <Budgets state={state} />}
              {activeTab === 'goals' && <Goals state={state} />}
              {activeTab === 'debts' && <Debts state={state} />}
              {activeTab === 'analytics' && <Analytics state={state} />}
              {activeTab === 'calendar' && <CalendarView state={state} />}
              {activeTab === 'ai_insights' && <AIInsights state={state} />}
              {activeTab === 'profile' && <ProfileSettings settings={state.settings} />}
            </main>
          </Layout>
        </div>

        {/* Mobile Navigation */}
        <BottomNav
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onOpenAddModal={() => handleOpenAddModal()}
        />

        {/* Quick Floating Action Button */}
        <QuickActionFab
          onOpenAddTransaction={() => handleOpenAddModal()}
          onOpenAddWallet={() => setActiveTab('wallets')}
          onOpenAddBudget={() => setActiveTab('budgets')}
          onOpenAddGoal={() => setActiveTab('goals')}
        />

        {/* Command Palette Modal */}
        <CommandPalette
          open={cmdOpen}
          onClose={() => setCmdOpen(false)}
          onSelectTab={setActiveTab}
          onOpenAddModal={() => handleOpenAddModal()}
        />

        {/* Add / Edit Transaction Modal */}
        <AddTransactionModal
          open={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          onSave={(txData) => {
            if (editingTx) {
              // Edit
              addTransaction(txData);
            } else {
              // New
              addTransaction(txData);
            }
          }}
          wallets={state.wallets}
          categories={state.categories}
          initialData={editingTx}
        />

        {/* Bank Email Sync Modal */}
        <BankEmailSyncModal
          open={bankEmailModalOpen}
          onClose={() => setBankEmailModalOpen(false)}
          onSaveTransaction={(txData) => addTransaction(txData)}
          wallets={state.wallets}
          categories={state.categories}
        />
      </Layout>
    </ConfigProvider>
  );
}
