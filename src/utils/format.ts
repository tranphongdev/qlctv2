import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import 'dayjs/locale/en';
import { fromVnd, getActiveCurrency, localeOfCurrency } from './currency';
import { t } from '../i18n';
import type { CurrencyCode } from './currency';

dayjs.locale('vi');

/**
 * `amountVnd` luôn là số tiền lưu trong app (VND). Hàm tự quy đổi sang đơn vị đang
 * được chọn trong Cài đặt; truyền `currency` để ép một đơn vị cụ thể.
 */
export function formatMoney(amountVnd: number, currency: CurrencyCode = getActiveCurrency()): string {
  const value = fromVnd(amountVnd, currency);
  if (currency === 'VND') {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
  }
  return new Intl.NumberFormat(localeOfCurrency(currency), { style: 'currency', currency }).format(value);
}

/** Rút gọn số tiền cho nhãn trục biểu đồ, cũng quy đổi theo đơn vị đang chọn. */
export function formatCompactNumber(amountVnd: number, currency: CurrencyCode = getActiveCurrency()): string {
  const val = fromVnd(amountVnd, currency);
  const abs = Math.abs(val);

  // VND dùng đơn vị đọc quen thuộc của tiếng Việt, các đơn vị khác dùng K/M/B.
  if (currency === 'VND') {
    if (abs >= 1_000_000_000) return (val / 1_000_000_000).toFixed(1) + ' ' + t('format.billion');
    if (abs >= 1_000_000) return (val / 1_000_000).toFixed(1) + ' ' + t('format.million');
    if (abs >= 1_000) return (val / 1_000).toFixed(0) + 'k';
    return Math.round(val).toString();
  }

  if (abs >= 1_000_000_000) return (val / 1_000_000_000).toFixed(1) + 'B';
  if (abs >= 1_000_000) return (val / 1_000_000).toFixed(1) + 'M';
  if (abs >= 1_000) return (val / 1_000).toFixed(1) + 'K';
  return val.toFixed(abs >= 100 ? 0 : 2);
}

export function todayStr(): string {
  return dayjs().format('YYYY-MM-DD');
}

export function monthKeyOf(dateStr: string): string {
  return dateStr.slice(0, 7);
}

export function formatDate(dateStr: string, format = 'DD/MM/YYYY'): string {
  if (!dateStr) return '';
  return dayjs(dateStr).format(format);
}

/**
 * Lời chào theo giờ trong ngày, KHÔNG kèm tên người dùng: Header hiển thị tên ở
 * dòng riêng ngay bên dưới, nhét tên vào đây nữa là lặp hai lần — và vì dòng chào
 * bị chặn bề ngang kèm ellipsis, chuỗi sẽ bị cắt ngay sau dấu phẩy.
 */
export function getTimeAwareGreeting(): { greeting: string; icon: string } {
  const hour = dayjs().hour();
  if (hour >= 5 && hour < 12) {
    return { greeting: t('header.greeting_morning'), icon: '🌅' };
  } else if (hour >= 12 && hour < 18) {
    return { greeting: t('header.greeting_afternoon'), icon: '☀️' };
  } else {
    return { greeting: t('header.greeting_evening'), icon: '🌙' };
  }
}

export function removeAccents(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}
