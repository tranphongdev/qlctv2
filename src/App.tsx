import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ConfigProvider, Layout, theme as antdTheme, Button, App as AntdApp } from 'antd';
import { message, AntdStaticBridge } from './lib/antdApp';
import { antdLocale, setActiveLang } from './i18n';
import { setActiveCurrency } from './utils/currency';
import { useAppState, deleteTransaction, bulkDeleteTransactions, restoreTransaction, addTransaction, updateTransaction, syncAuthProfile } from './store/appStore';
import { Header } from './components/Header';
import { Sidebar, MobileSidebarDrawer } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { CommandPalette } from './components/CommandPalette';
import { AddTransactionModal } from './components/AddTransactionModal';
import { BankEmailSyncModal } from './components/BankEmailSyncModal';
import { AuthPage } from './pages/AuthPage';
import { onAuthChange, signOutUser } from './lib/auth';
import type { AuthUser } from './lib/auth';
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
import { TAB_PATHS, pathOfTab, tabOfPath } from './routes';
import type { Transaction } from './types';

const THEME_KEY = 'quan_ly_chi_tieu_pro_theme';

export default function App() {
  const state = useAppState();
  const location = useLocation();
  const navigate = useNavigate();

  // URL là nguồn sự thật của điều hướng. Vẫn giữ API activeTab/onSelectTab để
  // Sidebar, BottomNav, CommandPalette và Header không phải sửa gì.
  const activeTab = tabOfPath(location.pathname);
  const setActiveTab = (tab: string) => navigate(pathOfTab(tab));

  // Đồng bộ ngay trong thân render (không dùng useEffect) để các trang con render
  // trong cùng lượt này đã đọc được đơn vị tiền / ngôn ngữ mới. Nếu đặt trong effect,
  // lượt render đầu sau khi đổi cài đặt sẽ hiển thị bằng giá trị cũ.
  setActiveCurrency(state.settings.currency);
  setActiveLang(state.settings.language);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [bankEmailModalOpen, setBankEmailModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setCurrentUser(user);
      if (user) {
        syncAuthProfile({
          userName: user.name,
          userEmail: user.email,
          avatarUrl: user.avatarUrl,
        });
      }
    });
    return () => unsubscribe();
  }, []);

  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem(THEME_KEY);
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
      localStorage.setItem(THEME_KEY, 'dark');
    } else {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
      localStorage.setItem(THEME_KEY, 'light');
    }
  }, [isDark]);

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

  const handleToggleTheme = () => setIsDark((prev) => !prev);

  const handleOpenAddModal = (tx?: Transaction) => {
    setEditingTx(tx || null);
    setAddModalOpen(true);
  };

  const handleDeleteTx = (id: string) => {
    const deleted = state.transactions.find((t) => t.id === id);
    deleteTransaction(id);
    if (deleted) {
      message.open({
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
      locale={antdLocale(state.settings.language)}
      theme={{
        algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#4F46E5',
          colorSuccess: '#22C55E',
          colorWarning: '#F59E0B',
          colorError: '#EF4444',
          borderRadius: 4,
          fontFamily: "'Inter', 'Manrope', -apple-system, sans-serif",
        },
      }}
    >
      {/* AntdApp cấp context cho message/notification/modal; AntdStaticBridge lấy
          instance đó ra cho các chỗ gọi message.* ngoài phạm vi hook. */}
      <AntdApp>
      <AntdStaticBridge />
      {location.pathname === TAB_PATHS.auth ? (
        <AuthPage
          onSuccess={(user) => {
            setCurrentUser(user);
            setActiveTab('dashboard');
          }}
        />
      ) : (
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
                currentUser={currentUser}
                sidebarCollapsed={sidebarCollapsed}
                onToggleTheme={handleToggleTheme}
                onOpenCommandPalette={() => setCmdOpen(true)}
                notifications={state.notifications}
                onMarkRead={() => message.success('Đã đọc tất cả thông báo')}
                onOpenMobileMenu={() => setMobileDrawerOpen(true)}
                onOpenBankSync={() => setBankEmailModalOpen(true)}
                onOpenAuthModal={() => setActiveTab('auth')}
                onLogout={async () => {
                  await signOutUser();
                  setCurrentUser(null);
                  setActiveTab('auth');
                  message.info('Đã đăng xuất tài khoản!');
                }}
                onSelectTab={setActiveTab}
              />

              <main className="app-main" style={{ paddingTop: 84, paddingLeft: 24, paddingRight: 24, paddingBottom: 20, minHeight: '80vh', width: '100%', maxWidth: '100vw' }}>
                <Routes>
                  <Route
                    path={TAB_PATHS.dashboard}
                    element={
                      <Dashboard
                        state={state}
                        onOpenAddModal={() => handleOpenAddModal()}
                        onSelectTab={setActiveTab}
                      />
                    }
                  />
                  <Route
                    path={TAB_PATHS.transactions}
                    element={
                      <Transactions
                        state={state}
                        onOpenAddModal={handleOpenAddModal}
                        onDeleteTx={handleDeleteTx}
                        onBulkDelete={bulkDeleteTransactions}
                        onOpenBankSync={() => setBankEmailModalOpen(true)}
                      />
                    }
                  />
                  <Route
                    path={TAB_PATHS.wallets}
                    element={<Wallets state={state} onOpenBankSync={() => setBankEmailModalOpen(true)} />}
                  />
                  <Route path={TAB_PATHS.categories} element={<CategoriesPage state={state} />} />
                  <Route path={TAB_PATHS.budgets} element={<Budgets state={state} />} />
                  <Route path={TAB_PATHS.goals} element={<Goals state={state} />} />
                  <Route path={TAB_PATHS.debts} element={<Debts state={state} />} />
                  <Route path={TAB_PATHS.analytics} element={<Analytics state={state} />} />
                  <Route path={TAB_PATHS.calendar} element={<CalendarView state={state} />} />
                  <Route path={TAB_PATHS.ai_insights} element={<AIInsights state={state} />} />
                  <Route path={TAB_PATHS.profile} element={<ProfileSettings settings={state.settings} currentUser={currentUser} />} />
                  <Route path="*" element={<Navigate to={TAB_PATHS.dashboard} replace />} />
                </Routes>
              </main>
            </Layout>
          </div>

          {/* Mobile Navigation */}
          <BottomNav
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            onOpenAddModal={() => handleOpenAddModal()}
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
                // Giữ nguyên id để ghi đè bản ghi cũ thay vì thêm bản ghi mới.
                updateTransaction({ ...txData, id: editingTx.id });
              } else {
                addTransaction(txData);
              }
              setEditingTx(null);
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
      )}
      </AntdApp>
    </ConfigProvider>
  );
}
