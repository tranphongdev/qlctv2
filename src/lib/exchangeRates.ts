import { setLiveRates, setRatesLoading, getRateStatus } from '../utils/currency';

/**
 * Tỷ giá VND/USD và VND/EUR lấy từ thị trường, thay cho bảng số cứng trong mã.
 *
 * Dùng tỷ giá liên ngân hàng (mid-market) — mức mà thế giới tham chiếu — chứ không
 * phải giá mua/bán niêm yết của một ngân hàng cụ thể, vì hai loại đó chênh nhau vài
 * trăm đồng và mỗi ngân hàng một khác.
 *
 * Cả hai nhà cung cấp đều miễn phí, không cần khoá API và bật sẵn CORS nên gọi thẳng
 * từ trình duyệt được. Đổi lại, họ công bố mỗi ngày một lần: đó là mức "hiện tại"
 * chính xác nhất có thể lấy mà không phải trả tiền cho luồng tỷ giá theo giây.
 */

const CACHE_KEY = 'quan_ly_chi_tieu_pro_fx';

/** Quá hạn này thì hỏi lại nhà cung cấp. Họ cập nhật mỗi ngày nên 6 tiếng là dày. */
const MAX_AGE_MS = 6 * 60 * 60 * 1000;

/** Mạng chập chờn không được phép treo lượt tải; bỏ dở rồi rơi sang nguồn dự bị. */
const FETCH_TIMEOUT_MS = 8_000;

interface Quote {
  /** Số VND đổi được 1 USD. */
  usd: number;
  /** Số VND đổi được 1 EUR. */
  eur: number;
  /** Mốc nhà cung cấp công bố, không phải lúc ta tải về. */
  updatedAt: number;
}

interface CachedQuote extends Quote {
  /** Lúc ghi vào máy, dùng để tính hạn dùng lại. */
  fetchedAt: number;
}

function isUsable(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

async function fetchJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal, cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * open.er-api.com — bản miễn phí của ExchangeRate-API, có sẵn VND.
 * Trả về tỷ giá quy theo USD, kèm mốc công bố dạng Unix giây.
 */
async function fromErApi(): Promise<Quote> {
  const data = (await fetchJson('https://open.er-api.com/v6/latest/USD')) as {
    rates?: Record<string, number>;
    time_last_update_unix?: number;
  };
  const vndPerUsd = data?.rates?.VND;
  const eurPerUsd = data?.rates?.EUR;
  if (!isUsable(vndPerUsd) || !isUsable(eurPerUsd)) throw new Error('er-api: thiếu VND hoặc EUR');
  return {
    usd: vndPerUsd,
    // API quy mọi thứ theo USD, nên VND/EUR = (VND/USD) ÷ (EUR/USD).
    eur: vndPerUsd / eurPerUsd,
    updatedAt: isUsable(data.time_last_update_unix) ? data.time_last_update_unix * 1000 : Date.now(),
  };
}

/**
 * Nguồn dự bị: currency-api phát qua CDN jsDelivr. Khác nhà cung cấp, khác hạ tầng
 * — nếu er-api chết hoặc bị chặn thì đường này thường vẫn thông.
 */
async function fromCurrencyApi(): Promise<Quote> {
  const data = (await fetchJson(
    'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json',
  )) as { date?: string; usd?: Record<string, number> };
  const vndPerUsd = data?.usd?.vnd;
  const eurPerUsd = data?.usd?.eur;
  if (!isUsable(vndPerUsd) || !isUsable(eurPerUsd)) throw new Error('currency-api: thiếu vnd hoặc eur');
  const published = data.date ? Date.parse(data.date) : Number.NaN;
  return {
    usd: vndPerUsd,
    eur: vndPerUsd / eurPerUsd,
    updatedAt: Number.isNaN(published) ? Date.now() : published,
  };
}

function readCache(): CachedQuote | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CachedQuote>;
    if (!isUsable(parsed.usd) || !isUsable(parsed.eur) || !isUsable(parsed.fetchedAt)) return null;
    return {
      usd: parsed.usd,
      eur: parsed.eur,
      updatedAt: isUsable(parsed.updatedAt) ? parsed.updatedAt : parsed.fetchedAt,
      fetchedAt: parsed.fetchedAt,
    };
  } catch {
    // Máy chặn localStorage hoặc bản ghi hỏng: coi như chưa có gì.
    return null;
  }
}

function writeCache(quote: Quote) {
  try {
    const payload: CachedQuote = { ...quote, fetchedAt: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Hết dung lượng hoặc chế độ riêng tư: bỏ qua, tỷ giá trong phiên vẫn chạy.
  }
}

/**
 * Nạp tỷ giá đã lưu lần trước vào bộ nhớ, ĐỒNG BỘ. Gọi trước lượt render đầu để số
 * tiền không nháy từ tỷ giá dự phòng sang tỷ giá thật ngay trước mắt người dùng.
 */
export function hydrateRatesFromCache(): void {
  const cached = readCache();
  if (!cached) return;
  setLiveRates({ USD: cached.usd, EUR: cached.eur }, { source: 'cache', updatedAt: cached.updatedAt });
}

/** Chặn hai lượt tải chồng nhau (mở app + chuyển tab về cùng lúc). */
let inFlight: Promise<boolean> | null = null;

function isStale(): boolean {
  const cached = readCache();
  if (!cached) return true;
  return Date.now() - cached.fetchedAt > MAX_AGE_MS;
}

/**
 * Tải tỷ giá mới. Thử er-api trước, hỏng thì sang currency-api; cả hai hỏng thì giữ
 * nguyên bảng đang dùng — hiện số cũ vẫn tử tế hơn là hiện số sai hoặc báo lỗi.
 *
 * @returns true nếu lấy được bộ tỷ giá mới.
 */
export function refreshExchangeRates(): Promise<boolean> {
  if (inFlight) return inFlight;

  setRatesLoading(true);
  inFlight = (async () => {
    for (const provider of [fromErApi, fromCurrencyApi]) {
      try {
        const quote = await provider();
        if (setLiveRates({ USD: quote.usd, EUR: quote.eur }, { source: 'live', updatedAt: quote.updatedAt })) {
          writeCache(quote);
          return true;
        }
      } catch {
        // Thử nốt nguồn còn lại rồi mới chịu thua.
      }
    }
    return false;
  })();

  return inFlight.finally(() => {
    inFlight = null;
    setRatesLoading(false);
  });
}

/**
 * Điểm gọi thường ngày: chỉ ra mạng khi bảng đang dùng đã cũ hoặc vẫn là số dự phòng.
 * Gọi bao nhiêu lần cũng được, mỗi lượt mở app thực tế chỉ tốn tối đa một request.
 */
export function ensureExchangeRates(): void {
  if (getRateStatus().loading) return;
  if (getRateStatus().source !== 'fallback' && !isStale()) return;
  void refreshExchangeRates();
}
