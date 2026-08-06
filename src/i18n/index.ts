import dayjs from 'dayjs';
import viVN from 'antd/locale/vi_VN';
import enUS from 'antd/locale/en_US';
import type { Locale } from 'antd/es/locale';
import type { UserSettings } from '../types';
import vi from './vi.json';
import en from './en.json';

export type Lang = UserSettings['language'];

/** Bộ key hợp lệ suy ra từ vi.json — file gốc, luôn đầy đủ nhất. */
export type TranslationKey = keyof typeof vi;

/**
 * Gán kiểu Record<TranslationKey, string> ở đây chính là chốt kiểm tra: en.json
 * thiếu key nào so với vi.json là TypeScript báo lỗi ngay lúc biên dịch.
 */
const DICTS: Record<Lang, Record<TranslationKey, string>> = { vi, en };

const ANTD_LOCALES: Record<Lang, Locale> = { vi: viVN, en: enUS };

/**
 * Ngôn ngữ đang hiển thị, giữ ở module scope giống activeCurrency để component không
 * phải nhận thêm prop. App.tsx đồng bộ từ settings ngay trong thân render.
 */
let activeLang: Lang = 'vi';

export function setActiveLang(lang: Lang) {
  if (lang === activeLang) return;
  activeLang = lang;
  // dayjs dùng locale toàn cục cho mọi format ngày/thứ trong app.
  dayjs.locale(lang === 'vi' ? 'vi' : 'en');
}

export function getActiveLang(): Lang {
  return activeLang;
}

export function antdLocale(lang: Lang = activeLang): Locale {
  return ANTD_LOCALES[lang];
}

/** Giá trị được phép nhúng vào chuỗi dịch qua placeholder {tên}. */
export type TranslationParams = Record<string, string | number>;

/**
 * Dịch một key; thiếu bản dịch thì rơi về tiếng Việt thay vì hiện key trần.
 *
 * Placeholder viết dạng {tên} trong file .json và truyền qua tham số thứ hai:
 * t('auth.login_success', { name: 'An' }) → "👋 Chào mừng quay trở lại, An!".
 * Placeholder không có giá trị tương ứng được giữ nguyên để lỗi lộ ra ngay trên
 * giao diện thay vì âm thầm biến thành chuỗi rỗng.
 */
export function t(key: TranslationKey, params?: TranslationParams): string {
  const template = DICTS[activeLang][key] || vi[key];
  if (!params) return template;

  return template.replace(/\{(\w+)\}/g, (placeholder, name: string) =>
    name in params ? String(params[name]) : placeholder,
  );
}
