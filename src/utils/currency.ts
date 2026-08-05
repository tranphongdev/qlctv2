import type { UserSettings } from '../types';

export type CurrencyCode = UserSettings['currency'];

/**
 * Mọi số tiền trong app đều được LƯU bằng VND. Bảng dưới là tỷ giá quy đổi dùng khi
 * người dùng đổi đơn vị hiển thị sang USD/EUR.
 *
 * Đây là tỷ giá TĨNH, cập nhật thủ công — app không gọi API tỷ giá nào. Số hiển thị
 * ở đơn vị ngoài VND chỉ mang tính quy đổi tham khảo.
 */
export const VND_PER_UNIT: Record<CurrencyCode, number> = {
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

/**
 * Đơn vị đang hiển thị. Giữ ở module scope thay vì context để 57 chỗ gọi formatMoney
 * hiện tại không phải nhận thêm prop. App.tsx đồng bộ giá trị này từ settings ngay
 * trong thân render, trước khi các trang con render.
 */
let activeCurrency: CurrencyCode = 'VND';

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
  return amountVnd / VND_PER_UNIT[currency];
}

/** Quy đổi ngược từ đơn vị hiển thị về VND để lưu trữ. */
export function toVnd(amount: number, currency: CurrencyCode = activeCurrency): number {
  return amount * VND_PER_UNIT[currency];
}
