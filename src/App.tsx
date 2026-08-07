import { useState, useEffect, useSyncExternalStore } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ConfigProvider, Layout, Button, App as AntdApp } from 'antd';
import { LoadingScreen } from './components/LoadingScreen';
import { getAppTheme } from './theme';
import { isSupabaseConfigured } from './lib/supabase';
import { message, AntdStaticBridge } from './lib/antdApp';
import { antdLocale, setActiveLang, t } from './i18n';
import { setActiveCurrency, subscribeRates, getRatesVersion } from './utils/currency';
import { ensureExchangeRates } from './lib/exchangeRates';
import { useAppState, deleteTransaction, bulkDeleteTransactions, restoreTransaction, addTransaction, updateTransaction, startRemoteSync, stopRemoteSync, useRemoteLoading, markAllNotificationsRead, markNotificationRead } from './store/appStore';
import { useNotificationRules } from './hooks/useNotificationRules';
import { NOTIFICATION_TAB } from './lib/notificationEngine';
import { Header } from './components/Header';
import { Sidebar, MobileSidebarDrawer } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { CommandPalette } from './components/CommandPalette';
import { AddTransactionModal } from './components/AddTransactionModal';
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
import { NotFound } from './pages/NotFound';
import { TAB_PATHS, pathOfTab, tabOfPath } from './routes';
import type { Transaction } from './types';

const THEME_KEY = 'quan_ly_chi_tieu_pro_theme';

export default function App() {
  const state = useAppState();
  const loadingRemote = useRemoteLoading();
  const location = useLocation();
  const navigate = useNavigate();

  const activeTab = tabOfPath(location.pathname) ?? '';
  const setActiveTab = (tab: string) => navigate(pathOfTab(tab));

  setActiveCurrency(state.settings.currency);
  setActiveLang(state.settings.language);

  useSyncExternalStore(subscribeRates, getRatesVersion, getRatesVersion);

  useEffect(() => {
    ensureExchangeRates();
    const onVisible = () => {
      if (document.visibilityState === 'visible') ensureExchangeRates();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const [checkingSession, setCheckingSession] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const unsubscribe = onAuthChange((user) => {
      setCurrentUser(user);
      setCheckingSession(false);
      if (user) {
        startRemoteSync(user.id, {
          username: user.username,
          fullName: user.name,
          userEmail: user.email,
          avatarUrl: user.avatarUrl,
        });
      } else {
        stopRemoteSync();
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
            {t('app.tx_deleted')}{' '}
            <Button
              type="link"
              size="small"
              onClick={() => {
                restoreTransaction(deleted);
                message.info(t('app.undo_done'));
              }}
            >
              {t('app.undo')}
            </Button>
          </span>
        ),
        duration: 5,
      });
    }
  };

  const isAuthRoute = location.pathname === TAB_PATHS.auth;
  // Chỉ chặn khi có Supabase; thiếu cấu hình thì ứng dụng chạy ở chế độ demo khách.
  const requireAuth = isSupabaseConfigured && !currentUser;

  // Phải nằm TRÊN mọi lệnh return sớm bên dưới, nếu không số lượng hook giữa các
  // lần render sẽ lệch nhau và React ném lỗi.
  useNotificationRules(state, !checkingSession && !loadingRemote && !requireAuth);

  if (checkingSession) {
    return <LoadingScreen message={t('auth.restoring_session')} />;
  }

  if (loadingRemote) {
    return <LoadingScreen message={t('auth.loading_data')} />;
  }

  return (
    <ConfigProvider
      locale={antdLocale(state.settings.language)}
      theme={getAppTheme(isDark)}
    >
      <AntdApp>
      <AntdStaticBridge />
      {requireAuth ? (
        isAuthRoute ? (
          <ConfigProvider theme={getAppTheme(false)}>
            <AuthPage
              onSuccess={(user) => {
                setCurrentUser(user);
                setActiveTab('dashboard');
              }}
            />
          </ConfigProvider>
        ) : (
          <Navigate to={TAB_PATHS.auth} replace />
        )
      ) : isAuthRoute ? (
        <Navigate to={TAB_PATHS.dashboard} replace />
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
                isDark={isDark}
                onToggleTheme={handleToggleTheme}
                onOpenCommandPalette={() => setCmdOpen(true)}
                notifications={state.notifications}
                onMarkRead={() => {
                  markAllNotificationsRead();
                  message.success(t('app.all_notifications_read'));
                }}
                onOpenNotification={(notif) => {
                  markNotificationRead(notif.id);
                  setActiveTab(NOTIFICATION_TAB[notif.type]);
                }}
                onOpenMobileMenu={() => setMobileDrawerOpen(true)}
                onOpenAuthModal={() => setActiveTab('auth')}
                onLogout={async () => {
                  await signOutUser();
                  setCurrentUser(null);
                  setActiveTab('auth');
                  message.info(t('auth.logged_out'));
                }}
                onSelectTab={setActiveTab}
              />

              <main
                key={location.pathname}
                className="app-main page-enter"
                /* paddingTop do .app-main quyết định (nó phải cộng thêm vùng an
                   toàn của PWA nên không đặt được ở đây). */
                style={{ paddingLeft: 24, paddingRight: 24, paddingBottom: 20, minHeight: '80vh', width: '100%', maxWidth: '100vw' }}
              >
                <Routes>
                  <Route
                    path={TAB_PATHS.dashboard}
                    element={
                      <Dashboard
                        state={state}
                        onOpenAddModal={handleOpenAddModal}
                        onDeleteTx={handleDeleteTx}
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
                      />
                    }
                  />
                  <Route
                    path={TAB_PATHS.wallets}
                    element={<Wallets state={state} />}
                  />
                  <Route path={TAB_PATHS.categories} element={<CategoriesPage state={state} />} />
                  <Route path={TAB_PATHS.budgets} element={<Budgets state={state} />} />
                  <Route path={TAB_PATHS.goals} element={<Goals state={state} />} />
                  <Route path={TAB_PATHS.debts} element={<Debts state={state} />} />
                  <Route path={TAB_PATHS.analytics} element={<Analytics state={state} />} />
                  <Route
                    path={TAB_PATHS.calendar}
                    element={
                      <CalendarView
                        state={state}
                        onOpenAddModal={handleOpenAddModal}
                        onDeleteTx={handleDeleteTx}
                      />
                    }
                  />
                  <Route path={TAB_PATHS.ai_insights} element={<AIInsights state={state} />} />
                  <Route path={TAB_PATHS.profile} element={<ProfileSettings settings={state.settings} currentUser={currentUser} />} />
                  <Route path="*" element={<NotFound />} />
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
        </Layout>
      )}
      </AntdApp>
    </ConfigProvider>
  );
}
