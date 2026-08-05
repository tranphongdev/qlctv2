import { supabase, isSupabaseConfigured } from './supabase';
import type { AppState, Transaction, Wallet, Goal, Debt, Budget, Category, NotificationItem } from '../types';
import { DEFAULT_CATEGORIES } from '../store/appStore';

export async function fetchRemoteState(): Promise<Partial<AppState> | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  try {
    const [txRes, walletRes, goalRes, debtRes, catRes, budgetRes, notifRes] = await Promise.all([
      supabase.from('transactions').select('*').order('date', { ascending: false }),
      supabase.from('wallets').select('*'),
      supabase.from('goals').select('*'),
      supabase.from('debts').select('*'),
      supabase.from('categories').select('*').order('order_index', { ascending: true }),
      supabase.from('budgets').select('*'),
      supabase.from('notifications').select('*').order('date', { ascending: false }),
    ]);

    const result: Partial<AppState> = {
      transactions: txRes.data
        ? txRes.data.map((t) => ({
            id: t.id,
            type: t.type,
            amount: Number(t.amount),
            category: t.category,
            walletId: t.wallet_id,
            toWalletId: t.to_wallet_id,
            date: t.date,
            time: t.time,
            note: t.note,
            receiptUrl: t.receipt_url,
            tags: t.tags,
            location: t.location,
            counterparty: t.counterparty,
            recurring: t.recurring,
            status: t.status,
          }))
        : [],
      wallets: walletRes.data
        ? walletRes.data.map((w) => ({
            id: w.id,
            name: w.name,
            type: w.type,
            bankName: w.bank_name,
            accountNumber: w.account_number,
            balance: Number(w.balance),
            color: w.color,
            icon: w.icon,
            isDefault: w.is_default,
          }))
        : [],
      goals: goalRes.data
        ? goalRes.data.map((g) => ({
            id: g.id,
            name: g.name,
            target: Number(g.target),
            saved: Number(g.saved),
            deadline: g.deadline,
            imageUrl: g.image_url,
            color: g.color,
          }))
        : [],
      debts: debtRes.data
        ? debtRes.data.map((d) => ({
            id: d.id,
            name: d.name,
            direction: d.direction,
            amount: Number(d.amount),
            paid: Number(d.paid),
            due: d.due,
            note: d.note,
            phone: d.phone,
            created: d.created_at ? d.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
            status: d.status as 'active' | 'settled',
          }))
        : [],
      categories:
        catRes.data && catRes.data.length > 0
          ? catRes.data.map((c) => ({
              id: c.id,
              name: c.name,
              type: c.type,
              icon: c.icon,
              color: c.color,
              order: c.order_index ?? 0,
            }))
          : DEFAULT_CATEGORIES,
      budgets: budgetRes.data
        ? budgetRes.data.map((b) => ({
            id: b.id,
            category: b.category,
            amount: Number(b.amount),
            period: b.period,
            monthKey: b.month_key,
          }))
        : [],
      notifications: notifRes.data
        ? notifRes.data.map((n) => ({
            id: n.id,
            title: n.title,
            message: n.message,
            date: n.date,
            read: n.read,
            type: n.type,
          }))
        : [],
    };

    // If categories table in DB is empty, seed default categories
    if (catRes.data && catRes.data.length === 0) {
      seedDefaultCategories();
    }

    return result;
  } catch (error) {
    console.error('Lỗi kết nối Supabase:', error);
    return null;
  }
}

export async function seedDefaultCategories() {
  if (!isSupabaseConfigured || !supabase) return;
  for (const cat of DEFAULT_CATEGORIES) {
    await syncCategoryToSupabase(cat);
  }
}

export async function syncTransactionToSupabase(tx: Transaction) {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from('transactions').upsert({
    id: tx.id,
    type: tx.type,
    amount: tx.amount,
    category: tx.category,
    wallet_id: tx.walletId,
    to_wallet_id: tx.toWalletId,
    date: tx.date,
    time: tx.time,
    note: tx.note,
    receipt_url: tx.receiptUrl,
    tags: tx.tags,
    location: tx.location,
    counterparty: tx.counterparty,
    status: tx.status,
  });
}

export async function deleteTransactionFromSupabase(id: string) {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from('transactions').delete().eq('id', id);
}

export async function syncWalletToSupabase(wallet: Wallet) {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from('wallets').upsert({
    id: wallet.id,
    name: wallet.name,
    type: wallet.type,
    bank_name: wallet.bankName,
    account_number: wallet.accountNumber,
    balance: wallet.balance,
    color: wallet.color,
    icon: wallet.icon,
  });
}

export async function deleteWalletFromSupabase(id: string) {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from('wallets').delete().eq('id', id);
}

export async function syncGoalToSupabase(goal: Goal) {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from('goals').upsert({
    id: goal.id,
    name: goal.name,
    target: goal.target,
    saved: goal.saved,
    deadline: goal.deadline,
    image_url: goal.imageUrl,
    color: goal.color,
  });
}

export async function deleteGoalFromSupabase(id: string) {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from('goals').delete().eq('id', id);
}

export async function syncDebtToSupabase(debt: Debt) {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from('debts').upsert({
    id: debt.id,
    name: debt.name,
    direction: debt.direction,
    amount: debt.amount,
    paid: debt.paid,
    due: debt.due,
    note: debt.note,
    status: debt.status,
  });
}

export async function deleteDebtFromSupabase(id: string) {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from('debts').delete().eq('id', id);
}

export async function syncBudgetToSupabase(budget: Budget) {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from('budgets').upsert({
    id: budget.id,
    category: budget.category,
    amount: budget.amount,
    period: budget.period,
    month_key: budget.monthKey,
  });
}

export async function deleteBudgetFromSupabase(id: string) {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from('budgets').delete().eq('id', id);
}

export async function syncCategoryToSupabase(category: Category) {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from('categories').upsert({
    id: category.id,
    name: category.name,
    type: category.type,
    icon: category.icon,
    color: category.color,
    order_index: category.order ?? 0,
  });
}

export async function deleteCategoryFromSupabase(id: string) {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from('categories').delete().eq('id', id);
}

export async function syncNotificationToSupabase(notif: NotificationItem) {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from('notifications').upsert({
    id: notif.id,
    title: notif.title,
    message: notif.message,
    date: notif.date,
    read: notif.read,
    type: notif.type,
  });
}

