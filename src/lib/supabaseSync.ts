import { supabase, isSupabaseConfigured } from './supabase';
import type { AppState, Transaction, Wallet, Goal, Debt } from '../types';

export async function fetchRemoteState(): Promise<Partial<AppState> | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  try {
    const [txRes, walletRes, goalRes, debtRes] = await Promise.all([
      supabase.from('transactions').select('*').order('date', { ascending: false }),
      supabase.from('wallets').select('*'),
      supabase.from('goals').select('*'),
      supabase.from('debts').select('*'),
    ]);

    const result: Partial<AppState> = {};

    if (txRes.data && txRes.data.length > 0) {
      result.transactions = txRes.data.map((t) => ({
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
      }));
    }

    if (walletRes.data && walletRes.data.length > 0) {
      result.wallets = walletRes.data.map((w) => ({
        id: w.id,
        name: w.name,
        type: w.type,
        bankName: w.bank_name,
        accountNumber: w.account_number,
        balance: Number(w.balance),
        color: w.color,
        icon: w.icon,
        isDefault: w.is_default,
      }));
    }

    if (goalRes.data && goalRes.data.length > 0) {
      result.goals = goalRes.data.map((g) => ({
        id: g.id,
        name: g.name,
        target: Number(g.target),
        saved: Number(g.saved),
        deadline: g.deadline,
        imageUrl: g.image_url,
        color: g.color,
      }));
    }

    if (debtRes.data && debtRes.data.length > 0) {
      result.debts = debtRes.data.map((d) => ({
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
      }));
    }

    return result;
  } catch (error) {
    console.error('Lỗi kết nối Supabase:', error);
    return null;
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
