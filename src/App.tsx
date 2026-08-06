import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ConfigProvider, Layout, Button, App as AntdApp } from 'antd';
import { LoadingScreen } from './components/LoadingScreen';
import { getAppTheme } from './theme';
import { isSupabaseConfigured } from './lib/supabase';
import { message, AntdStaticBridge } from './lib/antdApp';
import { antdLocale, setActiveLang } from './i18n';
import { setActiveCurrency } from './utils/currency';
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

  // Supabase khôi phục phiên từ localStorage theo cơ chế bất đồng bộ: ngay sau khi
  // tải lại trang, currentUser vẫn là null dù người dùng đã đăng nhập. Phải đợi
  // sự kiện đầu tiên rồi mới quyết định cho vào dashboard hay đẩy ra trang đăng
  // nhập, nếu không người đã đăng nhập sẽ bị đá ra ngoài mỗi lần F5.
  const [checkingSession, setCheckingSession] = useState(isSupabaseConfigured);

  useEffect(() => {
    // Không cấu hình Supabase thì không có phiên nào để khôi phục; giữ nguyên chế
    // độ demo khách thay vì khoá toàn bộ ứng dụng sau trang đăng nhập.
    if (!isSupabaseConfigured) return;

    const unsubscribe = onAuthChange((user) => {
      setCurrentUser(user);
      setCheckingSession(false);
      if (user) {
        // startRemoteSync tự lo thứ tự: nạp dữ liệu đã lưu xong mới áp hồ sơ từ
        // nhà cung cấp đăng nhập, tránh ghi đè cài đặt cũ bằng giá trị mặc định.
        startRemoteSync(user.id, {
          userName: user.name,
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

  const isAuthRoute = location.pathname === TAB_PATHS.auth;
  // Chỉ chặn khi có Supabase; thiếu cấu hình thì ứng dụng chạy ở chế độ demo khách.
  const requireAuth = isSupabaseConfigured && !currentUser;

  if (checkingSession) {
    return <LoadingScreen message="Đang khôi phục phiên đăng nhập..." />;
  }

  // Trong lúc kéo dữ liệu lần đầu, kho cục bộ đã bị dọn về rỗng nên dashboard sẽ
  // hiện ra như thể mất sạch số liệu. Che bằng màn chờ cho tới khi có dữ liệu thật.
  if (loadingRemote) {
    return <LoadingScreen message="Đang tải dữ liệu của bạn..." />;
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
        // Chưa đăng nhập: mọi đường dẫn khác đều bị đẩy về trang đăng nhập thay vì
        // render dashboard rỗng.
        isAuthRoute ? (
          // Trang đăng nhập được thiết kế cố định theo tông sáng (thẻ form nền
          // trắng, chữ #1E293B). Nếu để nó thừa hưởng darkAlgorithm thì ô nhập
          // liệu của antd sẽ đen sì trên nền trắng, nên ép riêng thuật toán sáng.
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
