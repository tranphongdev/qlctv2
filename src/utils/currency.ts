import type { UserSettings } from '../types';

export type CurrencyCode = UserSettings['currency'];

/**
 * Mọi số tiền trong app đều được LƯU bằng VND. Bảng tỷ giá dưới đây chỉ dùng khi quy
 * đổi sang đơn vị hiển thị mà người dùng chọn (USD/EUR).
 *
 * Đây là mức DỰ PHÒNG, chỉ có tác dụng trong khoảnh khắc đầu tiên khi app chưa đọc
 * được tỷ giá đã lưu và cũng chưa gọi được API. Tỷ giá thật do lib/exchangeRates.ts
 * nạp vào qua setLiveRates().
 */
const FALLBACK_RATES: Record<CurrencyCode, number> = {
  VND: 1,
  USD: 26_000,
  EUR: 28_500,
};

/** Locale dùng cho Intl.NumberFormat ứng với từng đơn vị tiền. */
const CURRENCY_LOCALE: Record<CurrencyCode, string> = {
  VND: 'vi-VN',
  USD: 'en-US',
  EUR: 'de-DE',
};

/** Nguồn của bộ tỷ giá đang dùng, để giao diện nói thật với người dùng. */
export type RateSource = 'fallback' | 'cache' | 'live';

export interface RateStatus {
  source: RateSource;
  /** Mốc thời gian nhà cung cấp công bố tỷ giá (ms). null khi đang dùng số dự phòng. */
  updatedAt: number | null;
  /** Đang có một lượt tải tỷ giá chạy dở. */
  loading: boolean;
}

let rates: Record<CurrencyCode, number> = { ...FALLBACK_RATES };
let status: RateStatus = { source: 'fallback', updatedAt: null, loading: false };

/**
 * Đơn vị đang hiển thị. Giữ ở module scope thay vì context để 57 chỗ gọi formatMoney
 * hiện tại không phải nhận thêm prop. App.tsx đồng bộ giá trị này từ settings ngay
 * trong thân render, trước khi các trang con render.
 */
let activeCurrency: CurrencyCode = 'VND';

/**
 * Tỷ giá về sau lượt render đầu, nên phải có đường báo cho React vẽ lại. Dùng số đếm
 * làm ảnh chụp trạng thái: nó ổn định giữa hai lần đọc nếu chưa có gì đổi, đúng yêu
 * cầu của useSyncExternalStore.
 */
let version = 0;
const listeners = new Set<() => void>();

export function subscribeRates(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getRatesVersion(): number {
  return version;
}

function emitRatesChanged() {
  version += 1;
  for (const listener of listeners) listener();
}

function isUsableRate(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

/**
 * Nạp tỷ giá mới. Bộ số hỏng (thiếu, âm, NaN) bị bỏ qua nguyên khối thay vì ghi đè
 * một nửa — một bảng tỷ giá lai giữa hai nguồn còn nguy hiểm hơn bảng cũ.
 *
 * @returns true nếu bảng tỷ giá thực sự được thay.
 */
export function setLiveRates(
  next: { USD: number; EUR: number },
  meta: { source: Exclude<RateSource, 'fallback'>; updatedAt: number },
): boolean {
  if (!isUsableRate(next.USD) || !isUsableRate(next.EUR)) return false;
  rates = { VND: 1, USD: next.USD, EUR: next.EUR };
  status = { ...status, source: meta.source, updatedAt: meta.updatedAt };
  emitRatesChanged();
  return true;
}

export function setRatesLoading(loading: boolean) {
  if (status.loading === loading) return;
  status = { ...status, loading };
  emitRatesChanged();
}

export function getRateStatus(): RateStatus {
  return status;
}

/** Số VND đổi được 1 đơn vị tiền đã cho. */
export function getRate(currency: CurrencyCode = activeCurrency): number {
  return rates[currency];
}

export function setActiveCurrency(currency: CurrencyCode) {
  activeCurrency = currency;
}

export function getActiveCurrency(): CurrencyCode {
  return activeCurrency;
}

export function localeOfCurrency(currency: CurrencyCode = activeCurrency): string {
  return CURRENCY_LOCALE[currency];
}

/** Quy đổi số tiền VND sang đơn vị hiển thị. */
export function fromVnd(amountVnd: number, currency: CurrencyCode = activeCurrency): number {
  return amountVnd / rates[currency];
}

/** Quy đổi ngược từ đơn vị hiển thị về VND để lưu trữ. */
export function toVnd(amount: number, currency: CurrencyCode = activeCurrency): number {
  return amount * rates[currency];
}
