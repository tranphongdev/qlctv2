import dayjs from 'dayjs';
import { supabase } from './supabase';
import { TX_TYPE, DEBT_DIRECTION, DEBT_STATUS } from '~/types';
import type { AppState, Category, Transaction, TxType } from '~/types';
import { fromVnd, getActiveCurrency } from '~/utils/currency';
import type { CurrencyCode } from '~/utils/currency';
import { resolveCategory } from '~/utils/categories';
import { getActiveLang } from '~/i18n';

/**
 * Lớp client của trợ lý AI. Mọi request đều đi qua Edge Function `ai-insights`
 * (xem supabase/functions/ai-insights/index.ts) — ở đây không có, và không được
 * phép có, API key của Gemini.
 *
 * Nguyên tắc dữ liệu: chỉ gửi đi BẢN TÓM TẮT đã tổng hợp, không bao giờ gửi giao
 * dịch thô. Ghi chú, người liên quan, địa điểm, ảnh hoá đơn và số tài khoản ví đều
 * không rời khỏi máy người dùng — chúng không giúp mô hình trả lời tốt hơn nhưng
 * lại là phần nhạy cảm nhất trong sổ chi tiêu.
 */

export interface InsightCard {
  id: 'spending' | 'saving' | 'forecast';
  title: string;
  body: string;
}

export interface ChatTurn {
  sender: 'user' | 'ai';
  text: string;
}

export type AIErrorCode =
  | 'not_configured'
  | 'unauthorized'
  | 'rate_limited'
  | 'blocked'
  | 'upstream_error'
  | 'bad_request'
  | 'network';

/**
 * Kết quả dạng phân nhánh thay vì ném exception: mọi lỗi ở đây đều là lỗi dự đoán
 * được (chưa cấu hình, hết hạn mức, mất mạng) và giao diện phải hiện được từng loại
 * bằng một câu khác nhau, nên bắt buộc gọi phải xử lý.
 */
export type AIResult<T> =
  | { ok: true; data: T }
  /** `detail` là thông điệp gốc từ Gemini, để giao diện hiện ra thay vì bắt người
   *  dùng đi lục log Dashboard. Không phải lúc nào cũng có. */
  | { ok: false; code: AIErrorCode; detail?: string };

/** Bật/tắt cả tính năng theo việc dự án đã nối Supabase hay chưa. */
export const isAIAvailable = supabase !== null;

/* -------------------------------------------------------------------------- */
/* Tóm tắt tài chính gửi cho mô hình                                           */
/* -------------------------------------------------------------------------- */

const TOP_EXPENSE_CATEGORIES = 8;
const TOP_INCOME_CATEGORIES = 5;
const MAX_LIST_ITEMS = 12;

export interface FinancialContext {
  currency: CurrencyCode;
  today: string;
  month: string;
  dayOfMonth: number;
  daysInMonth: number;
  totalBalance: number;
  wallets: Array<{ name: string; type: string; balance: number }>;
  thisMonth: { income: number; expense: number; net: number };
  previousMonth: { income: number; expense: number };
  expenseByCategory: Array<{ category: string; amount: number; previousMonth: number }>;
  incomeByCategory: Array<{ category: string; amount: number }>;
  budgets: Array<{ category: string; limit: number; spent: number }>;
  goals: Array<{ name: string; target: number; saved: number; deadline: string | null }>;
  debts: Array<{ name: string; direction: string; amount: number; paid: number; due: string | null }>;
}

/**
 * Số tiền được quy đổi sang đơn vị người dùng đang hiển thị TRƯỚC khi gửi đi. Gửi
 * số VND thô rồi bảo mô hình tự đổi là mời nó làm toán tỷ giá — việc mà app đã có
 * bảng tỷ giá thật để làm chính xác.
 */
function moneyIn(currency: CurrencyCode) {
  return (amountVnd: number): number => {
    const value = fromVnd(amountVnd, currency);
    return currency === 'VND' ? Math.round(value) : Math.round(value * 100) / 100;
  };
}

function sumOf(txs: Transaction[], type: TxType): number {
  return txs.filter((tx) => tx.type === type).reduce((acc, tx) => acc + tx.amount, 0);
}

function groupByCategory(txs: Transaction[], type: TxType): Record<string, number> {
  const acc: Record<string, number> = {};
  for (const tx of txs) {
    if (tx.type !== type) continue;
    acc[tx.category] = (acc[tx.category] ?? 0) + tx.amount;
  }
  return acc;
}

export function buildFinancialContext(state: AppState): FinancialContext {
  const currency = getActiveCurrency();
  const money = moneyIn(currency);

  const today = dayjs();
  const monthKey = today.format('YYYY-MM');
  const prevMonthKey = today.subtract(1, 'month').format('YYYY-MM');

  const categoriesMap = state.categories.reduce<Record<string, Category>>((acc, category) => {
    acc[category.id] = category;
    return acc;
  }, {});
  // Đi qua resolveCategory để danh mục hệ thống (chuyển khoản, tiết kiệm) ra tên
  // người đọc được thay vì id thô như `cat_chuyen_khoan`.
  const nameOf = (categoryId: string) => resolveCategory(categoryId, categoriesMap).name;

  const thisMonthTxs = state.transactions.filter((tx) => tx.date?.startsWith(monthKey));
  const prevMonthTxs = state.transactions.filter((tx) => tx.date?.startsWith(prevMonthKey));

  const income = sumOf(thisMonthTxs, TX_TYPE.INCOME);
  const expense = sumOf(thisMonthTxs, TX_TYPE.EXPENSE);

  const expenseNow = groupByCategory(thisMonthTxs, TX_TYPE.EXPENSE);
  const expenseBefore = groupByCategory(prevMonthTxs, TX_TYPE.EXPENSE);
  const incomeNow = groupByCategory(thisMonthTxs, TX_TYPE.INCOME);

  const topBy = (totals: Record<string, number>, limit: number) =>
    Object.entries(totals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit);

  return {
    currency,
    today: today.format('YYYY-MM-DD'),
    month: monthKey,
    dayOfMonth: today.date(),
    daysInMonth: today.daysInMonth(),

    totalBalance: money(state.wallets.reduce((acc, wallet) => acc + wallet.balance, 0)),
    wallets: state.wallets.slice(0, MAX_LIST_ITEMS).map((wallet) => ({
      name: wallet.name,
      type: wallet.type,
      balance: money(wallet.balance),
    })),

    thisMonth: { income: money(income), expense: money(expense), net: money(income - expense) },
    previousMonth: {
      income: money(sumOf(prevMonthTxs, TX_TYPE.INCOME)),
      expense: money(sumOf(prevMonthTxs, TX_TYPE.EXPENSE)),
    },

    expenseByCategory: topBy(expenseNow, TOP_EXPENSE_CATEGORIES).map(([id, amount]) => ({
      category: nameOf(id),
      amount: money(amount),
      previousMonth: money(expenseBefore[id] ?? 0),
    })),
    incomeByCategory: topBy(incomeNow, TOP_INCOME_CATEGORIES).map(([id, amount]) => ({
      category: nameOf(id),
      amount: money(amount),
    })),

    budgets: state.budgets
      .filter((budget) => budget.monthKey === monthKey)
      .slice(0, MAX_LIST_ITEMS)
      .map((budget) => ({
        category: nameOf(budget.category),
        limit: money(budget.amount),
        spent: money(expenseNow[budget.category] ?? 0),
      })),

    goals: state.goals.slice(0, MAX_LIST_ITEMS).map((goal) => ({
      name: goal.name,
      target: money(goal.target),
      saved: money(goal.saved),
      deadline: goal.deadline,
    })),

    // `toi_no`/`no_toi` là id lưu trữ, đọc lên rất dễ hiểu ngược nghĩa. Dịch sang
    // nhãn tường minh trước khi đưa cho mô hình.
    debts: state.debts
      .filter((debt) => debt.status === DEBT_STATUS.ACTIVE)
      .slice(0, MAX_LIST_ITEMS)
      .map((debt) => ({
        name: debt.name,
        direction: debt.direction === DEBT_DIRECTION.LENDING ? 'they_owe_me' : 'i_owe',
        amount: money(debt.amount),
        paid: money(debt.paid),
        due: debt.due,
      })),
  };
}

/** Người dùng chưa ghi gì thì không có gì để phân tích — khỏi tốn một lượt gọi. */
export function hasEnoughData(state: AppState): boolean {
  return state.transactions.length > 0 || state.wallets.length > 0;
}

/* -------------------------------------------------------------------------- */
/* Gọi Edge Function                                                           */
/* -------------------------------------------------------------------------- */

const ERROR_CODES: AIErrorCode[] = [
  'not_configured',
  'unauthorized',
  'rate_limited',
  'blocked',
  'upstream_error',
  'bad_request',
];

function isErrorCode(value: unknown): value is AIErrorCode {
  return typeof value === 'string' && (ERROR_CODES as string[]).includes(value);
}

/**
 * supabase-js gói phản hồi lỗi vào `error.context` (một Response chưa đọc). Mã lỗi
 * thật nằm trong body, còn status chỉ là phương án dự phòng khi body không đọc được.
 */
async function failureOf(error: unknown): Promise<{ code: AIErrorCode; detail?: string }> {
  const response = (error as { context?: Response } | null)?.context;
  if (!response || typeof response.json !== 'function') return { code: 'network' };

  const payload = await response.json().catch(() => null);
  const detail = typeof payload?.detail === 'string' ? payload.detail : undefined;

  if (isErrorCode(payload?.error)) return { code: payload.error, detail };

  if (response.status === 401) return { code: 'unauthorized' };
  if (response.status === 429) return { code: 'rate_limited' };
  if (response.status === 503) return { code: 'not_configured' };
  return { code: 'upstream_error', detail: `HTTP ${response.status}` };
}

async function invoke<T>(body: Record<string, unknown>): Promise<AIResult<T>> {
  if (!supabase) return { ok: false, code: 'not_configured' };

  const { data, error } = await supabase.functions.invoke('ai-insights', { body });
  if (error) return { ok: false, ...(await failureOf(error)) };
  if (!data) return { ok: false, code: 'upstream_error', detail: 'empty body' };

  return { ok: true, data: data as T };
}

function baseBody(state: AppState): Record<string, unknown> {
  return {
    context: buildFinancialContext(state),
    language: getActiveLang(),
    currency: getActiveCurrency(),
  };
}

const CARD_IDS: InsightCard['id'][] = ['spending', 'saving', 'forecast'];

function parseCards(raw: unknown): InsightCard[] {
  if (!Array.isArray(raw)) return [];

  const seen = new Set<string>();
  const cards: InsightCard[] = [];

  for (const item of raw) {
    const id = (item as InsightCard)?.id;
    const title = (item as InsightCard)?.title;
    const body = (item as InsightCard)?.body;
    if (!CARD_IDS.includes(id) || seen.has(id)) continue;
    if (typeof title !== 'string' || typeof body !== 'string') continue;

    seen.add(id);
    cards.push({ id, title, body });
  }

  // Giữ đúng thứ tự thẻ trên giao diện, bất kể mô hình trả về thứ tự nào.
  return CARD_IDS.map((id) => cards.find((card) => card.id === id)).filter(
    (card): card is InsightCard => card !== undefined,
  );
}

export async function fetchInsightCards(state: AppState): Promise<AIResult<InsightCard[]>> {
  const result = await invoke<{ cards?: unknown }>({ ...baseBody(state), mode: 'insights' });
  if (!result.ok) return result;

  const cards = parseCards(result.data.cards);
  if (cards.length === 0) {
    return { ok: false, code: 'upstream_error', detail: 'no usable card in response' };
  }

  return { ok: true, data: cards };
}

export async function askAdvisor(
  state: AppState,
  question: string,
  history: ChatTurn[],
): Promise<AIResult<string>> {
  const result = await invoke<{ reply?: unknown }>({
    ...baseBody(state),
    mode: 'chat',
    question,
    history,
  });
  if (!result.ok) return result;

  const reply = result.data.reply;
  if (typeof reply !== 'string' || !reply.trim()) {
    return { ok: false, code: 'upstream_error', detail: 'empty reply' };
  }

  return { ok: true, data: reply.trim() };
}
