import { useState, useEffect } from 'react';
import type { AppState, Category, Transaction, Wallet, Budget, Goal, Debt, NotificationItem, UserSettings } from '~/types';
import { DEBT_STATUS, DEFAULT_USER_SETTINGS, TX_TYPE } from '~/types';
import { todayStr } from '~/utils/format';
import { SAVINGS_CATEGORY_ID } from '~/utils/categories';
import { sortTxNewestFirst } from '~/utils/transactionOrder';
import {
  fetchRemoteState,
  syncTransactionToSupabase,
  deleteTransactionFromSupabase,
  syncWalletToSupabase,
  deleteWalletFromSupabase,
  syncGoalToSupabase,
  deleteGoalFromSupabase,
  syncDebtToSupabase,
  deleteDebtFromSupabase,
  syncBudgetToSupabase,
  deleteBudgetFromSupabase,
  syncCategoryToSupabase,
  deleteCategoryFromSupabase,
  reassignCategoryInSupabase,
  deleteBudgetsOfCategoryFromSupabase,
  syncProfileToSupabase,
  syncNotificationToSupabase,
  deleteNotificationFromSupabase,
  markNotificationsReadInSupabase,
  setSyncUserId,
  getSyncUserId,
} from '~/lib/supabaseSync';
import { evaluateNotifications } from '~/lib/notificationEngine';
import { t } from '~/i18n';
import type { TranslationKey } from '~/i18n';

const STORAGE_KEY = 'quan_ly_chi_tieu_pro_v2';
/** Tài khoản sở hữu dữ liệu đang nằm trong localStorage của máy này. */
const OWNER_KEY = 'quan_ly_chi_tieu_pro_owner';

/**
 * Danh mục mặc định gieo cho tài khoản mới.
 *
 * Đây là *dữ liệu người dùng*, không phải chuỗi giao diện: sau khi gieo, bản ghi
 * được lưu xuống localStorage/Supabase và người dùng đổi tên được. Vì thế tên chỉ
 * dịch đúng một lần tại thời điểm gieo — người dùng mới nhận danh mục theo ngôn
 * ngữ đang chọn, còn tên đã lưu (kể cả tên họ tự sửa) không bao giờ bị ghi đè.
 *
 * Phải là hàm chứ không phải hằng số: hằng số sẽ chốt ngôn ngữ ngay lúc import,
 * trước cả khi App kịp đọc cài đặt ngôn ngữ của người dùng.
 */
const DEFAULT_CATEGORY_SEEDS: Array<Omit<Category, 'name'>> = [
  { id: 'cat_an_uong', type: TX_TYPE.EXPENSE, icon: 'Utensils', color: '#EF4444', order: 1 },
  { id: 'cat_cafe', type: TX_TYPE.EXPENSE, icon: 'Coffee', color: '#F59E0B', order: 2 },
  { id: 'cat_mua_sam', type: TX_TYPE.EXPENSE, icon: 'ShoppingBag', color: '#EC4899', order: 3 },
  { id: 'cat_tien_nha', type: TX_TYPE.EXPENSE, icon: 'Home', color: '#6366F1', order: 4 },
  { id: 'cat_dien', type: TX_TYPE.EXPENSE, icon: 'Zap', color: '#3B82F6', order: 5 },
  { id: 'cat_internet', type: TX_TYPE.EXPENSE, icon: 'Wifi', color: '#06B6D4', order: 6 },
  { id: 'cat_du_lich', type: TX_TYPE.EXPENSE, icon: 'Plane', color: '#10B981', order: 7 },
  { id: 'cat_giai_tri', type: TX_TYPE.EXPENSE, icon: 'Gamepad2', color: '#8B5CF6', order: 8 },
  { id: 'cat_hoc_tap', type: TX_TYPE.EXPENSE, icon: 'GraduationCap', color: '#14B8A6', order: 9 },
  { id: 'cat_y_te', type: TX_TYPE.EXPENSE, icon: 'HeartPulse', color: '#F43F5E', order: 10 },
  { id: 'cat_luong', type: TX_TYPE.INCOME, icon: 'WalletCards', color: '#22C55E', order: 11 },
  { id: 'cat_freelance', type: TX_TYPE.INCOME, icon: 'Laptop', color: '#10B981', order: 12 },
  { id: 'cat_dau_tu', type: TX_TYPE.INCOME, icon: 'TrendingUp', color: '#3B82F6', order: 13 },
  { id: 'cat_thu_khac', type: TX_TYPE.INCOME, icon: 'Coins', color: '#8B5CF6', order: 14 },
];

export function defaultCategories(): Category[] {
  return DEFAULT_CATEGORY_SEEDS.map((seed) => ({
    ...seed,
    name: t(`seed.${seed.id}` as TranslationKey),
  }));
}
export const INITIAL_WALLETS: Wallet[] = [];
export const INITIAL_TRANSACTIONS: Transaction[] = [];
export const INITIAL_BUDGETS: Budget[] = [];
export const INITIAL_GOALS: Goal[] = [];
export const INITIAL_DEBTS: Debt[] = [];
export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];

export const DEFAULT_APP_STATE: AppState = {
  transactions: [],
  wallets: [],
  categories: defaultCategories(),
  budgets: [],
  goals: [],
  debts: [],
  notifications: [],
  settings: DEFAULT_USER_SETTINGS,
  plans: {},
};

/**
 * Nâng cấp hồ sơ đã lưu từ các bản trước.
 *
 * Bản cũ dùng `userName` cho tên hiển thị và chưa có khái niệm `username`. Đọc
 * thẳng dữ liệu đó bằng cấu trúc mới sẽ cho tên hiển thị rỗng và người dùng thấy
 * hồ sơ trống trơn sau khi cập nhật. Trải DEFAULT ra trước rồi mới đè bằng giá
 * trị đã lưu, nên trường mới thêm sau này luôn có giá trị mặc định.
 */
function migrateSettings(stored: Record<string, unknown> | undefined): UserSettings {
  const s = stored ?? {};
  return {
    ...DEFAULT_USER_SETTINGS,
    ...(s as Partial<UserSettings>),
    fullName: (s.fullName as string) || (s.userName as string) || DEFAULT_USER_SETTINGS.fullName,
    // Chưa có username thì suy từ email cũ, khớp với cách vá hồ sơ ở mục 8 của
    // supabase_schema.sql để hai bên không lệch nhau.
    username:
      (s.username as string) ||
      ((s.userEmail as string) || '').split('@')[0] ||
      DEFAULT_USER_SETTINGS.username,
  };
}

/**
 * Bỏ ảnh hoá đơn khỏi dữ liệu cũ.
 *
 * Tính năng đính ảnh hoá đơn đã gỡ, nhưng hàm đọc bên dưới chỉ JSON.parse rồi
 * trải ra — trường nào không còn ai đọc vẫn sống sót nguyên vẹn qua từng lượt
 * đọc rồi ghi lại. Mỗi ảnh là một chuỗi base64 vài trăm KB, mà toàn bộ trạng
 * thái app nằm trong MỘT khoá localStorage hạn mức khoảng 5MB: để nguyên thì
 * chỗ đó bị chiếm vĩnh viễn, đúng cái lý do tính năng bị gỡ. Cắt lúc đọc, lần
 * ghi kế tiếp là lúc chỗ trống được trả lại.
 *
 * Bỏ được hàm này sau khi mọi máy đã mở app ít nhất một lần kể từ bản gỡ.
 */
function dropLegacyReceipts(list: unknown): Transaction[] {
  if (!Array.isArray(list)) return [];
  return list.map((tx) => {
    if (!tx || typeof tx !== 'object' || !('receiptUrl' in tx)) return tx as Transaction;
    const copy: Record<string, unknown> = { ...tx };
    delete copy.receiptUrl;
    return copy as unknown as Transaction;
  });
}

function loadStoredState(): AppState {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      return {
        ...DEFAULT_APP_STATE,
        ...parsed,
        wallets: parsed.wallets ?? [],
        categories: parsed.categories?.length ? parsed.categories : defaultCategories(),
        settings: migrateSettings(parsed.settings),
        transactions: dropLegacyReceipts(parsed.transactions),
      };
    }
  } catch (e) {
    console.error('Failed to load local state', e);
  }
  return DEFAULT_APP_STATE;
}

let globalState: AppState = loadStoredState();
const listeners = new Set<() => void>();

/** Đang kéo dữ liệu lần đầu cho tài khoản vừa đăng nhập. */
let loadingRemote = false;

/**
 * Cho biết có đang tải dữ liệu ban đầu hay không.
 *
 * Tách khỏi AppState thay vì thêm một trường vào đó, vì AppState là hình dạng dữ
 * liệu được truyền xuống mọi trang — nhét cờ tiến trình vào sẽ khiến mọi nơi phải
 * quan tâm tới một thứ chỉ App cần biết.
 */
export function useRemoteLoading(): boolean {
  const [loading, setLoading] = useState(loadingRemote);

  useEffect(() => {
    const listener = () => setLoading(loadingRemote);
    listener();
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return loading;
}

function notifyListeners() {
  listeners.forEach((l) => l());
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(globalState));
  } catch (e) {
    console.error('Failed to persist app state', e);
  }
}

/**
 * Bắt đầu phiên đồng bộ cho một tài khoản.
 *
 * Trước đây `fetchRemoteState()` được gọi ngay lúc import module, tức là trước khi
 * Supabase kịp khôi phục phiên — không có user_id nên không thể lọc theo người
 * dùng. Giờ App gọi hàm này sau khi biết chắc ai đang đăng nhập.
 */
export async function startRemoteSync(
  userId: string,
  authProfile: { username: string; fullName: string; userEmail: string; avatarUrl: string },
) {
  // onAuthChange còn bắn cả khi làm mới token (khoảng mỗi giờ). Đã đồng bộ cho
  // đúng tài khoản này rồi thì không kéo lại toàn bộ bảng lần nữa.
  if (getSyncUserId() === userId) return;

  setSyncUserId(userId);

  // Cùng một trình duyệt có thể đã lưu dữ liệu của tài khoản khác. Dọn trước khi
  // nạp để người mới đăng nhập không thấy thoáng qua số liệu của người trước.
  if (localStorage.getItem(OWNER_KEY) !== userId) {
    globalState = { ...DEFAULT_APP_STATE };
    localStorage.setItem(OWNER_KEY, userId);
    notifyListeners();
  }

  loadingRemote = true;
  notifyListeners();

  try {
    const remoteData = await fetchRemoteState();
    if (remoteData) {
      const { profile, ...tables } = remoteData;
      globalState = {
        ...globalState,
        ...tables,
        // Trộn chứ không thay: bảng profiles chỉ giữ một phần UserSettings.
        settings: { ...globalState.settings, ...profile },
      };
    }
  } finally {
    // finally chứ không đặt sau await: fetchRemoteState có thể ném ra ngoài, và
    // cờ kẹt ở true sẽ treo người dùng vĩnh viễn ở màn hình chờ.
    loadingRemote = false;
    notifyListeners();
  }

  // Chỉ áp hồ sơ từ nhà cung cấp đăng nhập SAU khi đã nạp xong hồ sơ đã lưu.
  // Làm ngược lại thì trên máy mới, cài đặt mặc định sẽ được đẩy lên đè mất
  // ảnh đại diện và đơn vị tiền người dùng từng chọn.
  syncAuthProfile(authProfile);
}

/** Kết thúc phiên: ngắt đường ghi để không có gì rò sang tài khoản kế tiếp. */
export function stopRemoteSync() {
  setSyncUserId(null);
}

export function useAppState(): AppState {
  const [state, setState] = useState<AppState>(globalState);

  useEffect(() => {
    const listener = () => setState({ ...globalState });
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return state;
}

// Global Mutators
/**
 * Cộng (sign = 1) hoặc hoàn tác (sign = -1) ảnh hưởng của một giao dịch lên số dư ví.
 * Không kẹp về 0 ở đây — người gọi kẹp một lần sau cùng, vì kẹp giữa chừng sẽ làm
 * bước hoàn tác mất số và không khôi phục lại đúng số dư ban đầu.
 */
function applyTxToWallets(wallets: Wallet[], tx: Pick<Transaction, 'type' | 'amount' | 'walletId' | 'toWalletId'>, sign: 1 | -1): Wallet[] {
  const delta = sign * tx.amount;
  return wallets.map((w) => {
    if (tx.type === TX_TYPE.INCOME && w.id === tx.walletId) {
      return { ...w, balance: w.balance + delta };
    }
    if (tx.type === TX_TYPE.EXPENSE && w.id === tx.walletId) {
      return { ...w, balance: w.balance - delta };
    }
    if (tx.type === TX_TYPE.TRANSFER) {
      if (w.id === tx.walletId) return { ...w, balance: w.balance - delta };
      if (w.id === tx.toWalletId) return { ...w, balance: w.balance + delta };
    }
    return w;
  });
}

const clampBalances = (wallets: Wallet[]): Wallet[] =>
  wallets.map((w) => (w.balance < 0 ? { ...w, balance: 0 } : w));

export function addTransaction(tx: Omit<Transaction, 'id'>) {
  const newTx: Transaction = {
    ...tx,
    id: 'tx_' + Date.now(),
  };

  const updatedWallets = clampBalances(applyTxToWallets(globalState.wallets, newTx, 1));

  globalState = {
    ...globalState,
    // Không chỉ ghép vào đầu: người dùng ghi lùi ngày cho một khoản quên nhập
    // thì nó phải nằm đúng chỗ của nó chứ không nhảy lên trên cùng.
    transactions: sortTxNewestFirst([newTx, ...globalState.transactions]),
    wallets: updatedWallets,
  };
  notifyListeners();

  // Sync to Supabase
  syncTransactionToSupabase(newTx);
  updatedWallets.forEach((w) => syncWalletToSupabase(w));

  return newTx;
}

export function updateTransaction(tx: Transaction) {
  const previous = globalState.transactions.find((t) => t.id === tx.id);

  // Hoàn tác ảnh hưởng của bản ghi cũ rồi mới áp bản ghi mới. Thiếu bước này thì sửa
  // số tiền, đổi loại giao dịch hay đổi ví sẽ khiến số dư lệch vĩnh viễn.
  const updatedWallets = previous
    ? clampBalances(applyTxToWallets(applyTxToWallets(globalState.wallets, previous, -1), tx, 1))
    : globalState.wallets;

  globalState = {
    ...globalState,
    // Sửa lại ngày giờ là đổi luôn vị trí trong danh sách.
    transactions: sortTxNewestFirst(globalState.transactions.map((t) => (t.id === tx.id ? tx : t))),
    wallets: updatedWallets,
  };
  notifyListeners();

  syncTransactionToSupabase(tx);
  if (previous) updatedWallets.forEach((w) => syncWalletToSupabase(w));
}

export function deleteTransaction(id: string) {
  const target = globalState.transactions.find((t) => t.id === id);
  if (!target) return;

  const updatedWallets = globalState.wallets.map((w) => {
    if (target.type === TX_TYPE.INCOME && w.id === target.walletId) {
      return { ...w, balance: Math.max(0, w.balance - target.amount) };
    }
    if (target.type === TX_TYPE.EXPENSE && w.id === target.walletId) {
      return { ...w, balance: w.balance + target.amount };
    }
    return w;
  });

  globalState = {
    ...globalState,
    transactions: globalState.transactions.filter((t) => t.id !== id),
    wallets: updatedWallets,
  };
  notifyListeners();

  deleteTransactionFromSupabase(id);
  return target;
}

export function bulkDeleteTransactions(ids: string[]) {
  globalState = {
    ...globalState,
    transactions: globalState.transactions.filter((t) => !ids.includes(t.id)),
  };
  notifyListeners();
  ids.forEach((id) => deleteTransactionFromSupabase(id));
}

export function restoreTransaction(tx: Transaction) {
  globalState = {
    ...globalState,
    // Hoàn tác một giao dịch cũ phải trả nó về đúng vị trí cũ, không phải lên đầu.
    transactions: sortTxNewestFirst([tx, ...globalState.transactions]),
  };
  notifyListeners();
  syncTransactionToSupabase(tx);
}

export function addWallet(wallet: Omit<Wallet, 'id'>) {
  const newW: Wallet = { ...wallet, id: 'w_' + Date.now() };
  globalState = { ...globalState, wallets: [...globalState.wallets, newW] };
  notifyListeners();
  syncWalletToSupabase(newW);
}

/**
 * Sửa ví đã có. Nhận nguyên bản ghi kèm id thay vì phần cập nhật rời, để chỗ gọi
 * không thể vô tình tạo ví mới khi id không khớp.
 */
export function updateWallet(wallet: Wallet) {
  globalState = {
    ...globalState,
    wallets: globalState.wallets.map((w) => (w.id === wallet.id ? wallet : w)),
  };
  notifyListeners();
  syncWalletToSupabase(wallet);
}

export function deleteWallet(id: string) {
  globalState = { ...globalState, wallets: globalState.wallets.filter((w) => w.id !== id) };
  notifyListeners();
  deleteWalletFromSupabase(id);
}

export function addGoal(goal: Omit<Goal, 'id' | 'saved'>) {
  const newG: Goal = { ...goal, id: 'g_' + Date.now(), saved: 0 };
  globalState = { ...globalState, goals: [...globalState.goals, newG] };
  notifyListeners();
  syncGoalToSupabase(newG);
}

export function deleteGoal(id: string) {
  globalState = { ...globalState, goals: globalState.goals.filter((g) => g.id !== id) };
  notifyListeners();
  deleteGoalFromSupabase(id);
}

/**
 * Nộp tiền vào một mục tiêu tiết kiệm.
 *
 * `source` là ví bị trừ tiền. Tiền tiết kiệm phải rời khỏi một ví có thật, nếu
 * không tổng tài sản trong app tự phình lên: mục tiêu tăng mà không ví nào giảm.
 *
 * Bút toán được ghi dạng TRANSFER và cố tình bỏ trống `toWalletId`: tiền rời ví
 * nhưng không phải khoản chi tiêu, nên các báo cáo thu/chi (vốn chỉ lọc INCOME và
 * EXPENSE) không tính nhầm khoản tiết kiệm thành tiêu xài.
 *
 * Bỏ trống `source` khi người dùng chỉ muốn ghi nhận tiến độ thủ công — tiền đã
 * nằm ngoài hệ thống ví, ví dụ sổ tiết kiệm mở ở ngân hàng chưa khai trong app.
 */
export function depositToGoal(goalId: string, amount: number, source?: { walletId: string; note?: string }) {
  const updatedGoals = globalState.goals.map((g) => (g.id === goalId ? { ...g, saved: g.saved + amount } : g));
  globalState = {
    ...globalState,
    goals: updatedGoals,
  };
  notifyListeners();

  const targetG = updatedGoals.find((g) => g.id === goalId);
  if (targetG) syncGoalToSupabase(targetG);

  // addTransaction lo hết phần còn lại: trừ số dư ví, xếp lại danh sách giao dịch
  // và đẩy cả bút toán lẫn ví lên Supabase.
  if (source) {
    addTransaction({
      type: TX_TYPE.TRANSFER,
      amount,
      category: SAVINGS_CATEGORY_ID,
      walletId: source.walletId,
      date: todayStr(),
      note: source.note,
    });
  }
}

export function addBudget(budget: Omit<Budget, 'id'>) {
  const newB: Budget = { ...budget, id: 'b_' + Date.now() };
  globalState = { ...globalState, budgets: [...globalState.budgets, newB] };
  notifyListeners();
  syncBudgetToSupabase(newB);
}

export function deleteBudget(id: string) {
  globalState = { ...globalState, budgets: globalState.budgets.filter((b) => b.id !== id) };
  notifyListeners();
  deleteBudgetFromSupabase(id);
}

export function addDebt(debt: Omit<Debt, 'id' | 'paid' | 'created' | 'status'>) {
  const newD: Debt = {
    ...debt,
    id: 'd_' + Date.now(),
    paid: 0,
    created: todayStr(),
    status: DEBT_STATUS.ACTIVE,
  };
  globalState = { ...globalState, debts: [...globalState.debts, newD] };
  notifyListeners();
  syncDebtToSupabase(newD);
}

export function deleteDebt(id: string) {
  globalState = { ...globalState, debts: globalState.debts.filter((d) => d.id !== id) };
  notifyListeners();
  deleteDebtFromSupabase(id);
}

export function addCategory(category: Omit<Category, 'id'>) {
  const newCat: Category = {
    ...category,
    id: 'cat_' + Date.now(),
  };
  globalState = { ...globalState, categories: [...globalState.categories, newCat] };
  notifyListeners();
  syncCategoryToSupabase(newCat);
  return newCat;
}

/**
 * Sửa danh mục tại chỗ. `id` được giữ nguyên, và đó là điều bắt buộc: giao dịch,
 * ngân sách và mục tiêu đều tham chiếu danh mục qua id, nên sinh id mới ở đây sẽ
 * biến toàn bộ bút toán cũ thành mồ côi.
 */
export function updateCategory(category: Category) {
  globalState = {
    ...globalState,
    categories: globalState.categories.map((c) => (c.id === category.id ? category : c)),
  };
  notifyListeners();
  syncCategoryToSupabase(category);
}

/**
 * Xoá danh mục, kèm dọn những thứ đang trỏ vào nó.
 *
 * Hai loại tham chiếu được xử lý ngược nhau, và đó là chủ ý:
 *
 * - *Giao dịch* là dữ liệu lịch sử, không được mất. Xoá danh mục mà bỏ mặc chúng
 *   thì mọi báo cáo hiện ra id thô (xem resolveCategory) và tiền rơi vào một
 *   nhóm không tên. Nên khi còn giao dịch, người gọi phải đưa `replacementId`.
 * - *Ngân sách* là hạn mức đặt cho chính danh mục này; danh mục biến mất thì hạn
 *   mức hết nghĩa, nên xoá luôn. Chuyển nó sang danh mục thay thế sẽ tạo hai hạn
 *   mức trùng danh mục trong cùng một tháng — màn Ngân sách vẽ ra hai thẻ giống
 *   hệt nhau và không có cách nào phân biệt.
 */
export function deleteCategory(id: string, replacementId?: string) {
  globalState = {
    ...globalState,
    transactions: replacementId
      ? globalState.transactions.map((tx) => (tx.category === id ? { ...tx, category: replacementId } : tx))
      : globalState.transactions,
    budgets: globalState.budgets.filter((b) => b.category !== id),
    categories: globalState.categories.filter((c) => c.id !== id),
  };
  notifyListeners();

  if (replacementId) reassignCategoryInSupabase(id, replacementId);
  deleteBudgetsOfCategoryFromSupabase(id);
  deleteCategoryFromSupabase(id);
}

export function payDebt(debtId: string, amount: number) {
  const updatedDebts: Debt[] = globalState.debts.map((d) => {
    if (d.id === debtId) {
      const newPaid = d.paid + amount;
      return {
        ...d,
        paid: newPaid,
        status: newPaid >= d.amount ? DEBT_STATUS.SETTLED : DEBT_STATUS.ACTIVE,
      };
    }
    return d;
  });

  globalState = {
    ...globalState,
    debts: updatedDebts,
  };
  notifyListeners();

  const targetD = updatedDebts.find((d) => d.id === debtId);
  if (targetD) syncDebtToSupabase(targetD);
}

export function updateSettings(newSettings: Partial<AppState['settings']>) {
  globalState = {
    ...globalState,
    settings: { ...globalState.settings, ...newSettings },
  };
  notifyListeners();
  syncProfileToSupabase(globalState.settings);
}

/**
 * Đồng bộ hồ sơ từ Supabase Auth sau khi đăng nhập. Tách riêng khỏi updateSettings
 * vì avatar chỉ được lấy từ nhà cung cấp khi người dùng CHƯA tự đặt ảnh — nếu không,
 * mỗi lần refresh token sẽ ghi đè mất ảnh do người dùng tải lên.
 */
export function syncAuthProfile(profile: { username: string; fullName: string; userEmail: string; avatarUrl: string }) {
  const current = globalState.settings;
  updateSettings({
    username: profile.username,
    fullName: profile.fullName,
    // Email thật do người dùng khai trong trang Hồ sơ; Auth chỉ giữ email nội bộ
    // nên không lấy nó ghi đè, nếu không mỗi lần làm mới token sẽ xoá mất địa chỉ
    // người dùng vừa nhập.
    userEmail: profile.userEmail || current.userEmail,
    avatarUrl: current.avatarUrl || profile.avatarUrl,
  });
}

/**
 * Số thông báo giữ lại. Toàn bộ AppState nằm trong MỘT khoá localStorage hạn mức
 * khoảng 5MB (xem dropLegacyReceipts), nên ngăn thông báo phải có trần — bộ luật
 * chạy mỗi lần dữ liệu đổi và không có gì tự dọn cái cũ.
 */
const MAX_NOTIFICATIONS = 100;

/**
 * Thêm các thông báo chưa từng xuất hiện.
 *
 * Lọc theo id chứ không theo nội dung: id do bộ luật sinh ra là tất định, nên một
 * sự kiện đã báo rồi sẽ bị chặn ở đây dù người dùng mở app lại bao nhiêu lần. Bản
 * ghi cũ được giữ nguyên chứ không ghi đè — `date` phải là lúc sự kiện xảy ra lần
 * đầu, và cờ `read` người dùng đã bấm không được bật lại thành chưa đọc.
 */
export function addNotifications(items: NotificationItem[]) {
  const known = new Set(globalState.notifications.map((n) => n.id));
  const fresh = items.filter((n) => !known.has(n.id));
  if (fresh.length === 0) return;

  const merged = [...fresh, ...globalState.notifications]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, MAX_NOTIFICATIONS);

  const kept = new Set(merged.map((n) => n.id));
  const trimmed = globalState.notifications.filter((n) => !kept.has(n.id));

  globalState = { ...globalState, notifications: merged };
  notifyListeners();

  fresh.filter((n) => kept.has(n.id)).forEach((n) => syncNotificationToSupabase(n));
  // Cắt khỏi localStorage mà để lại trên Supabase thì lần đăng nhập sau chúng quay
  // về, và vì id đã tồn tại nên vĩnh viễn không bị dọn nữa.
  trimmed.forEach((n) => deleteNotificationFromSupabase(n.id));
}

/** Chạy bộ luật trên trạng thái hiện tại và nạp những thông báo mới sinh ra. */
export function runNotificationRules() {
  addNotifications(evaluateNotifications(globalState));
}

export function markAllNotificationsRead() {
  if (!globalState.notifications.some((n) => !n.read)) return;
  globalState = {
    ...globalState,
    notifications: globalState.notifications.map((n) => (n.read ? n : { ...n, read: true })),
  };
  notifyListeners();
  markNotificationsReadInSupabase();
}

export function markNotificationRead(id: string) {
  const target = globalState.notifications.find((n) => n.id === id);
  if (!target || target.read) return;

  const updated = { ...target, read: true };
  globalState = {
    ...globalState,
    notifications: globalState.notifications.map((n) => (n.id === id ? updated : n)),
  };
  notifyListeners();
  syncNotificationToSupabase(updated);
}

/*
 * Cố ý KHÔNG có hàm xoá thông báo.
 *
 * Chống trùng ở đây dựa vào việc bản ghi còn nằm trong danh sách: xoá một thông
 * báo là mở đường cho chính nó quay lại ở lần chạy luật kế tiếp, mà lần đó có thể
 * chỉ cách vài giây (người dùng chuyển tab rồi quay lại). Muốn xoá thật thì phải
 * thêm một danh sách id đã loại bỏ và đồng bộ nó giữa các máy — việc riêng, chưa
 * làm. Trong lúc đó "đánh dấu đã đọc" đủ để dọn huy hiệu và làm mờ mục đã xem.
 */

export function exportBackupJSON(): string {
  return JSON.stringify(globalState, null, 2);
}

export function importBackupJSON(jsonStr: string): boolean {
  try {
    const data = JSON.parse(jsonStr);
    if (data && Array.isArray(data.transactions)) {
      // File sao lưu tạo trước bản gỡ vẫn còn ảnh hoá đơn, phải lọc y như lúc
      // đọc từ localStorage — nếu không, khôi phục một bản cũ là nạp lại đúng
      // mấy megabyte vừa dọn đi.
      globalState = { ...DEFAULT_APP_STATE, ...data, transactions: dropLegacyReceipts(data.transactions) };
      notifyListeners();
      return true;
    }
  } catch (e) {
    console.error('Invalid import data', e);
  }
  return false;
}
