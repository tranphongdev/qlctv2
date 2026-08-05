import { useState, useEffect } from 'react';
import type { AppState, Category, Transaction, Wallet, Budget, Goal, Debt, NotificationItem } from '../types';
import { DEFAULT_USER_SETTINGS } from '../types';
import { todayStr } from '../utils/format';
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
} from '../lib/supabaseSync';

const STORAGE_KEY = 'quan_ly_chi_tieu_pro_v2';

export const DEFAULT_CATEGORIES: Category[] = [
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

export const INITIAL_CATEGORIES: Category[] = DEFAULT_CATEGORIES;
export const INITIAL_WALLETS: Wallet[] = [];
export const INITIAL_TRANSACTIONS: Transaction[] = [];
export const INITIAL_BUDGETS: Budget[] = [];
export const INITIAL_GOALS: Goal[] = [];
export const INITIAL_DEBTS: Debt[] = [];
export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];

export const DEFAULT_APP_STATE: AppState = {
  transactions: [],
  wallets: [],
  categories: DEFAULT_CATEGORIES,
  budgets: [],
  goals: [],
  debts: [],
  notifications: [],
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
        wallets: parsed.wallets ?? [],
        categories: parsed.categories?.length ? parsed.categories : DEFAULT_CATEGORIES,
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
    status: 'active',
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

export function deleteCategory(id: string) {
  globalState = { ...globalState, categories: globalState.categories.filter((c) => c.id !== id) };
  notifyListeners();
  deleteCategoryFromSupabase(id);
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
