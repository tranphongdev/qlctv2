import { supabase, isSupabaseConfigured } from './supabase';
import type { AppState, UserSettings, Transaction, Wallet, Goal, Debt, Budget, Category, NotificationItem } from '../types';
import { DEFAULT_CATEGORIES } from '../store/appStore';

/**
 * Id của người dùng đang đăng nhập, dùng làm khoá phân vùng dữ liệu.
 *
 * Trước đây không lệnh ghi nào gắn user_id nên mọi dòng đều rơi vào giá trị mặc
 * định 'default_user' của schema, và mọi lệnh đọc đều `select('*')` không lọc —
 * tức là mọi tài khoản dùng chung một kho dữ liệu. Từ nay mọi lệnh đọc / ghi đều
 * bắt buộc đi qua giá trị này; chưa đăng nhập thì không đọc ghi gì hết.
 */
let currentUserId: string | null = null;

export function setSyncUserId(userId: string | null) {
  currentUserId = userId;
}

export function getSyncUserId(): string | null {
  return currentUserId;
}

/** true khi đủ điều kiện nói chuyện với Supabase: có cấu hình và đã đăng nhập. */
function canSync(): boolean {
  return Boolean(isSupabaseConfigured && supabase && currentUserId);
}

/**
 * Ghi log lỗi kèm tên thao tác.
 *
 * supabase-js không ném exception mà trả lỗi trong `{ error }`. Toàn bộ hàm sync
 * trước đây vứt luôn kết quả trả về, nên ghi hỏng vẫn im lặng và người dùng vẫn
 * thấy báo "thành công".
 */
function reportError(operation: string, error: unknown) {
  if (error) console.error(`[Supabase] ${operation} thất bại:`, error);
}

/**
 * Hồ sơ tách riêng khỏi `Partial<AppState>` vì bảng profiles chỉ chứa một phần
 * các trường của UserSettings; phần còn lại (accentColor, weekStart...) do cục bộ
 * giữ nên người gọi phải trộn chứ không được thay nguyên khối.
 */
export interface RemoteState extends Partial<AppState> {
  profile?: Partial<UserSettings>;
}

export async function fetchRemoteState(): Promise<RemoteState | null> {
  if (!canSync() || !supabase) return null;
  const uid = currentUserId;

  try {
    const [txRes, walletRes, goalRes, debtRes, catRes, budgetRes, notifRes, profileRes] = await Promise.all([
      supabase.from('transactions').select('*').eq('user_id', uid).order('date', { ascending: false }),
      supabase.from('wallets').select('*').eq('user_id', uid),
      supabase.from('goals').select('*').eq('user_id', uid),
      supabase.from('debts').select('*').eq('user_id', uid),
      supabase.from('categories').select('*').eq('user_id', uid).order('order_index', { ascending: true }),
      supabase.from('budgets').select('*').eq('user_id', uid),
      supabase.from('notifications').select('*').eq('user_id', uid).order('date', { ascending: false }),
      supabase.from('profiles').select('*').eq('user_id', uid).maybeSingle(),
    ]);

    for (const [name, res] of [
      ['đọc transactions', txRes], ['đọc wallets', walletRes], ['đọc goals', goalRes],
      ['đọc debts', debtRes], ['đọc categories', catRes], ['đọc budgets', budgetRes],
      ['đọc notifications', notifRes], ['đọc profiles', profileRes],
    ] as const) {
      reportError(name, res.error);
    }

    const result: RemoteState = {
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

    // Hồ sơ chỉ ghi đè khi DB thực sự có dòng; chưa có thì giữ nguyên cài đặt cục
    // bộ để lần lưu kế tiếp đẩy lên, tránh xoá trắng tên và ảnh người dùng đã đặt.
    if (profileRes.data) {
      result.profile = mapProfileRow(profileRes.data);
    }

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

/** Chỉ lấy các cột hồ sơ có trong bảng; phần còn lại của UserSettings do cục bộ giữ. */
function mapProfileRow(row: Record<string, unknown>): Partial<UserSettings> {
  return {
    userName: row.user_name as string,
    userEmail: row.user_email as string,
    avatarUrl: (row.avatar_url as string) ?? '',
    currency: row.currency as UserSettings['currency'],
    language: row.language as UserSettings['language'],
    timezone: row.timezone as string,
  };
}

/**
 * Đẩy hồ sơ lên bảng profiles. Khoá trùng là user_id (UNIQUE trong schema) chứ
 * không phải id, nên phải chỉ rõ onConflict — mặc định upsert dùng primary key,
 * mà id ở đây là uuid sinh tự động nên lần nào cũng sẽ chèn thêm dòng mới.
 */
export async function syncProfileToSupabase(settings: UserSettings) {
  if (!canSync() || !supabase) return;
  const { error } = await supabase.from('profiles').upsert(
    {
      user_id: currentUserId,
      user_name: settings.userName,
      user_email: settings.userEmail,
      avatar_url: settings.avatarUrl,
      currency: settings.currency,
      language: settings.language,
      timezone: settings.timezone,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
  reportError('ghi profiles', error);
}

export async function seedDefaultCategories() {
  if (!canSync()) return;
  for (const cat of DEFAULT_CATEGORIES) {
    await syncCategoryToSupabase(cat);
  }
}

/**
 * Ghi một dòng, luôn kèm user_id. Gom về một chỗ để không thể quên gắn khoá phân
 * vùng khi thêm bảng mới — đó chính là cách dữ liệu của mọi tài khoản từng bị dồn
 * chung vào một chỗ.
 */
async function upsertRow(table: string, label: string, row: Record<string, unknown>) {
  if (!canSync() || !supabase) return;
  const { error } = await supabase.from(table).upsert({ ...row, user_id: currentUserId });
  reportError(`ghi ${label}`, error);
}

/**
 * Xoá một dòng của chính người dùng hiện tại. Lọc thêm user_id bên cạnh RLS để
 * một id đoán trúng cũng không xoá được dữ liệu của người khác.
 */
async function deleteRow(table: string, label: string, id: string) {
  if (!canSync() || !supabase) return;
  const { error } = await supabase.from(table).delete().eq('id', id).eq('user_id', currentUserId);
  reportError(`xoá ${label}`, error);
}

export async function syncTransactionToSupabase(tx: Transaction) {
  await upsertRow('transactions', 'transactions', {
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
  await deleteRow('transactions', 'transactions', id);
}

export async function syncWalletToSupabase(wallet: Wallet) {
  await upsertRow('wallets', 'wallets', {
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
  await deleteRow('wallets', 'wallets', id);
}

export async function syncGoalToSupabase(goal: Goal) {
  await upsertRow('goals', 'goals', {
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
  await deleteRow('goals', 'goals', id);
}

export async function syncDebtToSupabase(debt: Debt) {
  await upsertRow('debts', 'debts', {
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
  await deleteRow('debts', 'debts', id);
}

export async function syncBudgetToSupabase(budget: Budget) {
  await upsertRow('budgets', 'budgets', {
    id: budget.id,
    category: budget.category,
    amount: budget.amount,
    period: budget.period,
    month_key: budget.monthKey,
  });
}

export async function deleteBudgetFromSupabase(id: string) {
  await deleteRow('budgets', 'budgets', id);
}

export async function syncCategoryToSupabase(category: Category) {
  await upsertRow('categories', 'categories', {
    id: category.id,
    name: category.name,
    type: category.type,
    icon: category.icon,
    color: category.color,
    order_index: category.order ?? 0,
  });
}

export async function deleteCategoryFromSupabase(id: string) {
  await deleteRow('categories', 'categories', id);
}

export async function syncNotificationToSupabase(notif: NotificationItem) {
  await upsertRow('notifications', 'notifications', {
    id: notif.id,
    title: notif.title,
    message: notif.message,
    date: notif.date,
    read: notif.read,
    type: notif.type,
  });
}
