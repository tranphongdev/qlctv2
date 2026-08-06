export type TxType = 'thu' | 'chi' | 'chuyen';

export interface Transaction {
  id: string;
  type: TxType;
  amount: number;
  category: string;
  walletId: string;
  toWalletId?: string; // Used when type === 'chuyen'
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  note?: string;
  receiptUrl?: string; // Image URL / Base64
  tags?: string[];
  location?: string;
  counterparty?: string; // Người liên quan
  recurring?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  status?: 'completed' | 'pending';
}

export type WalletType = 'cash' | 'bank' | 'e_wallet' | 'crypto' | 'usd';

export interface Wallet {
  id: string;
  name: string;
  type: WalletType;
  bankName?: string; // e.g. MB Bank, Vietcombank, Techcombank, MoMo, BIDV, ZaloPay
  balance: number;
  color: string;
  icon: string;
  accountNumber?: string;
  isDefault?: boolean;
}

export interface Category {
  id: string;
  name: string;
  type: 'thu' | 'chi';
  icon: string; // Lucide icon name
  color: string;
  isArchived?: boolean;
  order: number;
}

export interface Budget {
  id: string;
  category: string;
  amount: number;
  period: 'month' | 'quarter' | 'year';
  monthKey: string; // YYYY-MM
  alert50?: boolean;
  alert80?: boolean;
  alert100?: boolean;
  alert120?: boolean;
}

export interface Goal {
  id: string;
  name: string;
  target: number;
  saved: number;
  deadline: string | null; // YYYY-MM-DD
  imageUrl?: string;
  color?: string;
  category?: string;
}

export type DebtDirection = 'toi_no' | 'no_toi'; // toi_no: Cho vay (Lending), no_toi: Đi vay (Borrowing)

export interface Debt {
  id: string;
  name: string;
  direction: DebtDirection;
  amount: number;
  paid: number;
  due: string | null;
  note?: string;
  phone?: string;
  created: string;
  status: 'active' | 'settled';
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'budget' | 'debt' | 'goal' | 'income' | 'system';
}

export interface UserSettings {
  /** Tên đăng nhập: duy nhất, không đổi, dùng để xác thực. */
  username: string;
  /** Tên hiển thị, người dùng sửa thoải mái và có thể trùng nhau. */
  fullName: string;
  /** Email liên hệ, tuỳ chọn. Chuỗi rỗng nghĩa là người dùng chưa khai báo. */
  userEmail: string;
  avatarUrl: string;
  theme: 'light' | 'dark';
  accentColor: string;
  currency: 'VND' | 'USD' | 'EUR';
  language: 'vi' | 'en';
  timezone: string;
  weekStart: 'monday' | 'sunday';
  autoSync: boolean;
}

export interface MonthPlan {
  incomes: Record<string, number>;
  expenses: Record<string, number>;
  note?: string;
}

export interface AppState {
  transactions: Transaction[];
  wallets: Wallet[];
  categories: Category[];
  budgets: Budget[];
  goals: Goal[];
  debts: Debt[];
  notifications: NotificationItem[];
  settings: UserSettings;
  plans: Record<string, MonthPlan>;
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  username: 'userdemo',
  fullName: 'User Demo',
  userEmail: '',
  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=UserDemo',
  theme: 'light',
  accentColor: '#4F46E5',
  currency: 'VND',
  language: 'vi',
  timezone: 'Asia/Ho_Chi_Minh',
  weekStart: 'monday',
  autoSync: true,
};
