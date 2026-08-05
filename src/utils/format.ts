import dayjs from 'dayjs';
import 'dayjs/locale/vi';

dayjs.locale('vi');

export function formatMoney(amount: number, currency: 'VND' | 'USD' | 'EUR' = 'VND'): string {
  if (currency === 'VND') {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount);
  }
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
}

export function formatCompactNumber(val: number): string {
  if (Math.abs(val) >= 1000000000) {
    return (val / 1000000000).toFixed(1) + ' tỷ';
  }
  if (Math.abs(val) >= 1000000) {
    return (val / 1000000).toFixed(1) + ' triệu';
  }
  if (Math.abs(val) >= 1000) {
    return (val / 1000).toFixed(0) + 'k';
  }
  return val.toString();
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

export function getTimeAwareGreeting(name: string): { greeting: string; icon: string } {
  const hour = dayjs().hour();
  if (hour >= 5 && hour < 12) {
    return { greeting: `Chào buổi sáng, ${name}!`, icon: '🌅' };
  } else if (hour >= 12 && hour < 18) {
    return { greeting: `Chào buổi chiều, ${name}!`, icon: '☀️' };
  } else {
    return { greeting: `Chào buổi tối, ${name}!`, icon: '🌙' };
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
