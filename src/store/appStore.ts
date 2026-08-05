import { useState, useEffect } from 'react';
import type { AppState, Category, Transaction, Wallet, Budget, Goal, Debt, NotificationItem } from '../types';
import { DEFAULT_USER_SETTINGS } from '../types';
import { todayStr } from '../utils/format';
import {
  fetchRemoteState,
  syncTransactionToSupabase,
  deleteTransactionFromSupabase,
  syncWalletToSupabase,
  syncGoalToSupabase,
  syncDebtToSupabase,
} from '../lib/supabaseSync';

const STORAGE_KEY = 'quan_ly_chi_tieu_pro_v1';

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat_an_uong', name: 'Ăn uống', type: 'chi', icon: 'Utensils', color: '#EF4444', order: 1 },
  { id: 'cat_cafe', name: 'Cafe & Trà sữa', type: 'chi', icon: 'Coffee', color: '#F59E0B', order: 2 },
  { id: 'cat_mua_sam', name: 'Mua sắm', type: 'chi', icon: 'ShoppingBag', color: '#EC4899', order: 3 },
  { id: 'cat_tien_nha', name: 'Tiền nhà', type: 'chi', icon: 'Home', color: '#6366F1', order: 4 },
  { id: 'cat_dien', name: 'Điện nước', type: 'chi', icon: 'Zap', color: '#3B82F6', order: 5 },
  { id: 'cat_internet', name: 'Internet & 4G', type: 'chi', icon: 'Wifi', color: '#06B6D4', order: 6 },
  { id: 'cat_du_lich', name: 'Du lịch', type: 'chi', icon: 'Plane', color: '#10B981', order: 7 },
  { id: 'cat_giai_tri', name: 'Giải trí', type: 'chi', icon: 'Gamepad2', color: '#8B5CF6', order: 8 },
  { id: 'cat_hoc_tap', name: 'Học tập', type: 'chi', icon: 'GraduationCap', color: '#14B8A6', order: 9 },
  { id: 'cat_y_te', name: 'Y tế & Sức khỏe', type: 'chi', icon: 'HeartPulse', color: '#F43F5E', order: 10 },
  { id: 'cat_luong', name: 'Lương hàng tháng', type: 'thu', icon: 'WalletCards', color: '#22C55E', order: 11 },
  { id: 'cat_freelance', name: 'Freelance', type: 'thu', icon: 'Laptop', color: '#10B981', order: 12 },
  { id: 'cat_dau_tu', name: 'Đầu tư & Lãi', type: 'thu', icon: 'TrendingUp', color: '#3B82F6', order: 13 },
  { id: 'cat_thu_khac', name: 'Thu nhập khác', type: 'thu', icon: 'Coins', color: '#8B5CF6', order: 14 },
];

export const INITIAL_WALLETS: Wallet[] = [
  { id: 'w_cash', name: 'Tiền mặt', type: 'cash', balance: 5200000, color: '#10B981', icon: 'Banknote', isDefault: true },
  { id: 'w_mb', name: 'MB Bank', type: 'bank', bankName: 'MB Bank', accountNumber: '9999888866', balance: 42000000, color: '#2563EB', icon: 'Building2' },
  { id: 'w_vcb', name: 'Vietcombank', type: 'bank', bankName: 'Vietcombank', accountNumber: '0071001234567', balance: 25000000, color: '#059669', icon: 'CreditCard' },
  { id: 'w_momo', name: 'Ví MoMo', type: 'e_wallet', bankName: 'MoMo', accountNumber: '0987654321', balance: 3500000, color: '#D946EF', icon: 'Smartphone' },
  { id: 'w_crypto', name: 'Ví Crypto (USDT)', type: 'crypto', balance: 9500000, color: '#F59E0B', icon: 'Bitcoin' },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx_1',
    type: 'thu',
    amount: 25000000,
    category: 'cat_luong',
    walletId: 'w_mb',
    date: '2026-08-01',
    time: '09:00',
    note: 'Nhận lương tháng 8/2026',
    tags: ['Lương', 'Công ty'],
    status: 'completed',
  },
  {
    id: 'tx_2',
    type: 'chi',
    amount: 5500000,
    category: 'cat_tien_nha',
    walletId: 'w_mb',
    date: '2026-08-02',
    time: '14:30',
    note: 'Chuyển tiền nhà tháng 8',
    tags: ['Cố định'],
    counterparty: 'Chủ nhà',
    status: 'completed',
  },
  {
    id: 'tx_3',
    type: 'chi',
    amount: 450000,
    category: 'cat_an_uong',
    walletId: 'w_momo',
    date: '2026-08-03',
    time: '19:15',
    note: 'Ăn tối lẩu Haidilao với bạn bè',
    tags: ['Ăn ngoài', 'Bạn bè'],
    location: 'Vincom Center',
    status: 'completed',
  },
  {
    id: 'tx_4',
    type: 'chi',
    amount: 65000,
    category: 'cat_cafe',
    walletId: 'w_momo',
    date: '2026-08-04',
    time: '08:30',
    note: 'Highlands Coffee làm việc',
    tags: ['Work'],
    status: 'completed',
  },
  {
    id: 'tx_5',
    type: 'thu',
    amount: 6000000,
    category: 'cat_freelance',
    walletId: 'w_vcb',
    date: '2026-08-04',
    time: '16:00',
    note: 'Thanh toán dự án Thiết kế UI/UX',
    tags: ['Freelance'],
    status: 'completed',
  },
  {
    id: 'tx_6',
    type: 'chi',
    amount: 1200000,
    category: 'cat_mua_sam',
    walletId: 'w_vcb',
    date: '2026-08-05',
    time: '11:00',
    note: 'Mua quần áo Uniqlo',
    tags: ['Mua sắm'],
    status: 'completed',
  },
];

export const INITIAL_BUDGETS: Budget[] = [
  { id: 'b_1', category: 'cat_an_uong', amount: 4500000, period: 'month', monthKey: '2026-08' },
  { id: 'b_2', category: 'cat_cafe', amount: 1500000, period: 'month', monthKey: '2026-08' },
  { id: 'b_3', category: 'cat_mua_sam', amount: 3000000, period: 'month', monthKey: '2026-08' },
];

export const INITIAL_GOALS: Goal[] = [
  {
    id: 'g_1',
    name: 'MacBook Pro M3 Max',
    target: 55000000,
    saved: 38000000,
    deadline: '2026-10-30',
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&q=80',
    color: '#6366F1',
  },
  {
    id: 'g_2',
    name: 'Du lịch Nhật Bản 🇯🇵',
    target: 35000000,
    saved: 24000000,
    deadline: '2026-12-15',
    imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=500&q=80',
    color: '#EC4899',
  },
  {
    id: 'g_3',
    name: 'Quỹ Dự Phòng Khẩn Cấp',
    target: 100000000,
    saved: 85000000,
    deadline: '2026-12-31',
    imageUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=500&q=80',
    color: '#10B981',
  },
];

export const INITIAL_DEBTS: Debt[] = [
  {
    id: 'd_1',
    name: 'Anh Nam (Đồng nghiệp)',
    direction: 'toi_no',
    amount: 3000000,
    paid: 1000000,
    due: '2026-08-20',
    note: 'Mượn mua điện thoại',
    created: '2026-07-15',
    status: 'active',
  },
  {
    id: 'd_2',
    name: 'Vay ngân hàng (Trả góp laptop)',
    direction: 'no_toi',
    amount: 15000000,
    paid: 10000000,
    due: '2026-08-15',
    note: 'Kỳ trả góp tháng 8',
    created: '2026-03-01',
    status: 'active',
  },
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n_1',
    title: '🎉 Nhận lương tháng 8',
    message: 'Bạn vừa ghi nhận +25.000.000 VNĐ vào ví MB Bank',
    date: '2026-08-01 09:00',
    read: false,
    type: 'income',
  },
  {
    id: 'n_2',
    title: '⚠️ Cảnh báo Ngân sách',
    message: 'Danh mục Cafe đã sử dụng 45% ngân sách tháng',
    date: '2026-08-04 18:30',
    read: false,
    type: 'budget',
  },
  {
    id: 'n_3',
    title: '⏰ Khoản nợ sắp đến hạn',
    message: 'Kỳ trả góp Laptop 5.000.000 VNĐ đến hạn vào 15/08/2026',
    date: '2026-08-05 08:00',
    read: false,
    type: 'debt',
  },
];

export const DEFAULT_APP_STATE: AppState = {
  transactions: INITIAL_TRANSACTIONS,
  wallets: INITIAL_WALLETS,
  categories: INITIAL_CATEGORIES,
  budgets: INITIAL_BUDGETS,
  goals: INITIAL_GOALS,
  debts: INITIAL_DEBTS,
  notifications: INITIAL_NOTIFICATIONS,
  settings: DEFAULT_USER_SETTINGS,
  plans: {},
};

function loadStoredState(): AppState {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      return {
        ...DEFAULT_APP_STATE,
        ...parsed,
        wallets: parsed.wallets?.length ? parsed.wallets : INITIAL_WALLETS,
        categories: parsed.categories?.length ? parsed.categories : INITIAL_CATEGORIES,
      };
    }
  } catch (e) {
    console.error('Failed to load local state', e);
  }
  return DEFAULT_APP_STATE;
}

let globalState: AppState = loadStoredState();
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((l) => l());
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(globalState));
  } catch (e) {
    console.error('Failed to persist app state', e);
  }
}

// Initial Sync from Supabase if configured
fetchRemoteState().then((remoteData) => {
  if (remoteData) {
    globalState = {
      ...globalState,
      ...remoteData,
    };
    notifyListeners();
  }
});

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
export function addTransaction(tx: Omit<Transaction, 'id'>) {
  const newTx: Transaction = {
    ...tx,
    id: 'tx_' + Date.now(),
  };

  const updatedWallets = globalState.wallets.map((w) => {
    if (tx.type === 'thu' && w.id === tx.walletId) {
      return { ...w, balance: w.balance + tx.amount };
    }
    if (tx.type === 'chi' && w.id === tx.walletId) {
      return { ...w, balance: Math.max(0, w.balance - tx.amount) };
    }
    if (tx.type === 'chuyen') {
      if (w.id === tx.walletId) return { ...w, balance: Math.max(0, w.balance - tx.amount) };
      if (w.id === tx.toWalletId) return { ...w, balance: w.balance + tx.amount };
    }
    return w;
  });

  globalState = {
    ...globalState,
    transactions: [newTx, ...globalState.transactions],
    wallets: updatedWallets,
  };
  notifyListeners();

  // Sync to Supabase
  syncTransactionToSupabase(newTx);
  updatedWallets.forEach((w) => syncWalletToSupabase(w));

  return newTx;
}

export function updateTransaction(tx: Transaction) {
  globalState = {
    ...globalState,
    transactions: globalState.transactions.map((t) => (t.id === tx.id ? tx : t)),
  };
  notifyListeners();
  syncTransactionToSupabase(tx);
}

export function deleteTransaction(id: string) {
  const target = globalState.transactions.find((t) => t.id === id);
  if (!target) return;

  const updatedWallets = globalState.wallets.map((w) => {
    if (target.type === 'thu' && w.id === target.walletId) {
      return { ...w, balance: Math.max(0, w.balance - target.amount) };
    }
    if (target.type === 'chi' && w.id === target.walletId) {
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
    transactions: [tx, ...globalState.transactions],
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

export function addGoal(goal: Omit<Goal, 'id' | 'saved'>) {
  const newG: Goal = { ...goal, id: 'g_' + Date.now(), saved: 0 };
  globalState = { ...globalState, goals: [...globalState.goals, newG] };
  notifyListeners();
  syncGoalToSupabase(newG);
}

export function depositToGoal(goalId: string, amount: number) {
  const updatedGoals = globalState.goals.map((g) => (g.id === goalId ? { ...g, saved: g.saved + amount } : g));
  globalState = {
    ...globalState,
    goals: updatedGoals,
  };
  notifyListeners();

  const targetG = updatedGoals.find((g) => g.id === goalId);
  if (targetG) syncGoalToSupabase(targetG);
}

export function addBudget(budget: Omit<Budget, 'id'>) {
  const newB: Budget = { ...budget, id: 'b_' + Date.now() };
  globalState = { ...globalState, budgets: [...globalState.budgets, newB] };
  notifyListeners();
}

export function addDebt(debt: Omit<Debt, 'id' | 'paid' | 'created' | 'status'>) {
  const newD: Debt = {
    ...debt,
    id: 'd_' + Date.now(),
    paid: 0,
    created: todayStr(),
    status: 'active',
  };
  globalState = { ...globalState, debts: [...globalState.debts, newD] };
  notifyListeners();
  syncDebtToSupabase(newD);
}

export function payDebt(debtId: string, amount: number) {
  const updatedDebts: Debt[] = globalState.debts.map((d) => {
    if (d.id === debtId) {
      const newPaid = d.paid + amount;
      return {
        ...d,
        paid: newPaid,
        status: (newPaid >= d.amount ? 'settled' : 'active') as 'active' | 'settled',
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
}

export function markAllNotificationsRead() {
  globalState = {
    ...globalState,
    notifications: globalState.notifications.map((n) => ({ ...n, read: true })),
  };
  notifyListeners();
}

export function exportBackupJSON(): string {
  return JSON.stringify(globalState, null, 2);
}

export function importBackupJSON(jsonStr: string): boolean {
  try {
    const data = JSON.parse(jsonStr);
    if (data && Array.isArray(data.transactions)) {
      globalState = { ...DEFAULT_APP_STATE, ...data };
      notifyListeners();
      return true;
    }
  } catch (e) {
    console.error('Invalid import data', e);
  }
  return false;
}
