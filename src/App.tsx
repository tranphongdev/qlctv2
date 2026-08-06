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
import { useAppState, deleteTransaction, bulkDeleteTransactions, restoreTransaction, addTransaction, updateTransaction, startRemoteSync, stopRemoteSync, useRemoteLoading } from './store/appStore';
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
  const loadingRemote = useRemoteLoading();
  const location = useLocation();
  const navigate = useNavigate();

  const activeTab = tabOfPath(location.pathname);
  const setActiveTab = (tab: string) => navigate(pathOfTab(tab));

  setActiveCurrency(state.settings.currency);
  setActiveLang(state.settings.language);

  // Tỷ giá về sau lượt render đầu (đọc từ máy rồi tải mới từ mạng). Bảng tỷ giá nằm
  // ngoài React nên phải đăng ký nghe: thiếu dòng này, số tiền quy đổi sẽ đứng im ở
  // tỷ giá cũ cho tới lần render kế tiếp vì lý do khác.
  useSyncExternalStore(subscribeRates, getRatesVersion, getRatesVersion);

  useEffect(() => {
    ensureExchangeRates();
    // Máy để yên qua đêm rồi mở lại: tỷ giá đã sang ngày mới. Kiểm lúc tab sáng lên
    // thay vì hẹn giờ chạy nền — PWA bị treo timer khi ở nền.
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
  const [bankEmailModalOpen, setBankEmailModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // Supabase khôi phục phiên từ localStorage theo cơ chế bất đồng bộ: ngay sau khi
  // tải lại trang, currentUser vẫn là null dù người dùng đã đăng nhập. Phải đợi
  // sự kiện đầu tiên rồi mới quyết định cho vào dashboard hay đẩy ra trang đăng
  // nhập, nếu không người đã đăng nhập sẽ bị đá ra ngoài mỗi lần F5.
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
      {/* AntdApp cấp context cho message/notification/modal; AntdStaticBridge lấy
          instance đó ra cho các chỗ gọi message.* ngoài phạm vi hook. */}
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
        // Đã đăng nhập thì không còn lý do ở lại trang đăng nhập.
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
                onMarkRead={() => message.success(t('app.all_notifications_read'))}
                onOpenMobileMenu={() => setMobileDrawerOpen(true)}
                onOpenBankSync={() => setBankEmailModalOpen(true)}
                onOpenAuthModal={() => setActiveTab('auth')}
                onLogout={async () => {
                  await signOutUser();
                  setCurrentUser(null);
                  setActiveTab('auth');
                  message.info(t('auth.logged_out'));
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
