import { supabase, isSupabaseConfigured } from './supabase';
import type { AppState, UserSettings, Transaction, Wallet, Goal, Debt, Budget, Category, NotificationItem } from '~/types';
import { defaultCategories } from '~/store/appStore';
import { sortTxNewestFirst } from '~/utils/transactionOrder';

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
      // Sắp theo cả ngày lẫn giờ: chỉ sắp theo ngày thì các giao dịch cùng ngày
      // trả về theo thứ tự tuỳ ý của Postgres. nullsFirst: false để bản ghi chưa
      // có giờ nằm cuối ngày của nó thay vì chen lên đầu (DESC mặc định là
      // NULLS FIRST).
      supabase
        .from('transactions')
        .select('*')
        .eq('user_id', uid)
        .order('date', { ascending: false })
        .order('time', { ascending: false, nullsFirst: false }),
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
      // Sắp lại lần nữa ở phía client dù truy vấn đã ORDER BY: thứ tự này là quy
      // ước hiển thị của app, không nên phụ thuộc vào việc câu truy vấn ở trên có
      // bị sửa hay không.
      transactions: txRes.data
        ? sortTxNewestFirst(txRes.data.map((t) => ({
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
          })))
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
          : defaultCategories(),
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
    username: (row.username as string) ?? '',
    fullName: row.user_name as string,
    // Cột này giờ nullable (tài khoản chưa khai email thật), nhưng UserSettings
    // dùng chuỗi rỗng để biểu thị "chưa có" nên phải quy đổi, không để lọt null.
    userEmail: (row.user_email as string) ?? '',
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

  // auth_email phải lấy từ chính phiên đang chạy chứ không suy ra từ username:
  // đây là địa chỉ Supabase Auth thực sự đang giữ, và là thứ hàm RPC
  // auth_email_for_username sẽ trả về cho lần đăng nhập sau. Ghi sai một lần là
  // người dùng mất luôn đường vào tài khoản. getSession() đọc từ bộ nhớ cục bộ
  // nên không tốn thêm một vòng mạng.
  const { data: sessionData } = await supabase.auth.getSession();
  const authEmail = sessionData.session?.user?.email ?? null;

  const { error } = await supabase.from('profiles').upsert(
    {
      user_id: currentUserId,
      username: settings.username || null,
      auth_email: authEmail,
      user_name: settings.fullName,
      // Chuỗi rỗng nghĩa là chưa khai email; lưu NULL để phân biệt rõ với một
      // địa chỉ thật và để unique index / truy vấn phía DB xử lý đúng.
      user_email: settings.userEmail || null,
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

/**
 * Ghi bộ danh mục mặc định cho tài khoản hiện tại.
 *
 * Một lệnh cho cả 14 dòng thay vì 14 vòng lặp tuần tự: đây là việc chạy ngay ở
 * lần đăng nhập đầu, mỗi vòng là một chuyến đi mạng nên người dùng mới phải ngồi
 * chờ trắng màn hình lâu hơn hẳn. Gộp lại cũng khiến kết quả rõ ràng — hoặc vào
 * hết, hoặc hỏng hết kèm một dòng lỗi, chứ không còn cảnh vào được một nửa.
 */
export async function seedDefaultCategories() {
  if (!canSync() || !supabase) return;

  const rows = defaultCategories().map((cat) => ({
    id: cat.id,
    user_id: currentUserId,
    name: cat.name,
    type: cat.type,
    icon: cat.icon,
    color: cat.color,
    order_index: cat.order ?? 0,
  }));

  const { error } = await supabase.from('categories').upsert(rows);
  reportError('gieo danh mục mặc định', error);
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
    // fetchRemoteState vẫn đọc cột này nhưng lệnh ghi trước đây bỏ sót, nên cờ ví
    // mặc định không bao giờ được lưu lại.
    is_default: wallet.isDefault ?? false,
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
