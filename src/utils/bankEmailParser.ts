import dayjs from 'dayjs';

export interface ParsedBankTransaction {
  amount: number;
  type: 'chi' | 'thu' | 'chuyen';
  bankName: string;
  suggestedWalletId: string;
  suggestedCategory: string;
  date: string;
  time: string;
  note: string;
  accountNumber?: string;
  /** Người hưởng (khi chi) hoặc người chuyển (khi thu), nếu email có ghi. */
  counterparty?: string;
  rawText: string;
}

/** Lowercase + bỏ dấu tiếng Việt để so khớp nhãn dù email có dấu hay không. */
export function normalizeVn(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .trim();
}

interface ParsedLine {
  /** Dòng gốc đã trim. */
  raw: string;
  /** Toàn bộ dòng đã bỏ dấu. */
  flat: string;
  /** Phần trước dấu ":" hoặc TAB đầu tiên, đã bỏ dấu ('' nếu dòng không có nhãn). */
  label: string;
  /** Phần gốc sau dấu phân cách ('' nếu dòng không có nhãn). */
  value: string;
}

const LABEL_SPLIT = /^([^\t:]{1,45})(?:\t+|:)[ \t]*(.*)$/;

function toLines(text: string): ParsedLine[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((raw) => {
      const m = raw.match(LABEL_SPLIT);
      return {
        raw,
        flat: normalizeVn(raw),
        label: m ? normalizeVn(m[1]) : '',
        value: m ? m[2].trim() : '',
      };
    });
}

/**
 * Lấy giá trị của một trường có nhãn. Hỗ trợ 3 kiểu trình bày của email/SMS ngân hàng:
 * "Nhãn: giá trị", "Nhãn<TAB>giá trị" và kiểu biên lai song ngữ, trong đó nhãn tiếng Việt
 * nằm riêng một dòng ngay trên dòng "English Label<TAB>giá trị".
 */
function getField(lines: ParsedLine[], labelRe: RegExp, skipRe?: RegExp): string | undefined {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (skipRe?.test(line.flat)) continue;
    const isLabel = line.label ? labelRe.test(line.label) : labelRe.test(line.flat);
    if (!isLabel) continue;
    if (line.value) return line.value;

    // Nhãn đứng một mình: giá trị nằm ở dòng kế tiếp (bỏ qua tối đa 1 dòng nhãn song ngữ).
    for (let j = i + 1; j < lines.length && j <= i + 2; j++) {
      const next = lines[j];
      if (skipRe?.test(next.flat)) break;
      if (next.value) return next.value;
      if (!labelRe.test(next.flat)) return next.raw;
    }
  }
  return undefined;
}

/** "80,000 VND" | "-450.000" | "1,234.56" -> 80000 | 450000 | 1234 */
function parseAmount(input: string): number {
  const token = input.match(/\d[\d.,]*/);
  if (!token) return 0;
  const digitsOnly = token[0]
    .replace(/[.,]\d{1,2}$/, '') // bỏ phần thập phân nếu có
    .replace(/[.,]/g, '');
  const value = parseInt(digitsOnly, 10);
  return isNaN(value) ? 0 : value;
}

/** Số dư/phí/VAT không phải số tiền giao dịch. */
const NOT_AMOUNT_LINE = /so du|balance|phi giao dich|so tien phi|charge amount|\bfee\b|\bvat\b|net income|han muc|available/;

const AMOUNT_WITH_CURRENCY = /([+-])?\s*(\d{1,3}(?:[.,]\d{3})+|\d{4,12})(?:[.,]\d{1,2})?\s*(?:vnd|d)\b/;

interface AmountHit {
  amount: number;
  sign?: '+' | '-';
}

function findAmount(lines: ParsedLine[]): AmountHit {
  // 1. Số tiền kèm đơn vị tiền tệ (bỏ qua các dòng số dư / phí / VAT).
  for (const line of lines) {
    if (NOT_AMOUNT_LINE.test(line.flat)) continue;
    const m = line.flat.match(AMOUNT_WITH_CURRENCY);
    if (m) {
      const amount = parseAmount(m[2]);
      if (amount >= 1000) return { amount, sign: m[1] as '+' | '-' | undefined };
    }
  }

  // 2. Trường "Số tiền / Amount" không kèm đơn vị.
  const labelled = getField(lines, /^(so tien|amount|so tien giao dich|transaction amount)\b/, NOT_AMOUNT_LINE);
  if (labelled) {
    const amount = parseAmount(labelled);
    if (amount >= 1000) return { amount, sign: /^\s*[+-]/.test(labelled) ? (labelled.trim()[0] as '+' | '-') : undefined };
  }

  // 3. Cuối cùng: số có phân tách hàng nghìn ở bất kỳ đâu (vd 1,500,000).
  for (const line of lines) {
    if (NOT_AMOUNT_LINE.test(line.flat)) continue;
    const m = line.flat.match(/([+-])?\s*(\d{1,3}(?:[.,]\d{3})+)/);
    if (m) {
      const amount = parseAmount(m[2]);
      if (amount >= 1000) return { amount, sign: m[1] as '+' | '-' | undefined };
    }
  }

  return { amount: 0 };
}

const BANK_RULES: Array<{ re: RegExp; name: string; wallet: string }> = [
  { re: /\bvietcombank\b|\bvcb\b|ngoai thuong/, name: 'Vietcombank', wallet: 'w_vcb' },
  { re: /\btechcombank\b|\btcb\b|ky thuong/, name: 'Techcombank', wallet: 'w_tcb' },
  { re: /\bmb ?bank\b|\bmbb?\b|quan doi/, name: 'MB Bank', wallet: 'w_mb' },
  { re: /\bvietinbank\b|\bctg\b|cong thuong/, name: 'VietinBank', wallet: 'w_vietin' },
  { re: /\bbidv\b|dau tu va phat trien/, name: 'BIDV', wallet: 'w_bidv' },
  { re: /\bagribank\b|nong nghiep va phat trien/, name: 'Agribank', wallet: 'w_agri' },
  { re: /\bacb\b|a chau/, name: 'ACB', wallet: 'w_acb' },
  { re: /\bvpbank\b|viet nam thinh vuong/, name: 'VPBank', wallet: 'w_vpb' },
  { re: /\bsacombank\b|sai gon thuong tin/, name: 'Sacombank', wallet: 'w_stb' },
  { re: /\btpbank\b|tien phong bank/, name: 'TPBank', wallet: 'w_tpb' },
  { re: /\bmomo\b/, name: 'MoMo', wallet: 'w_momo' },
  { re: /\bzalopay\b/, name: 'ZaloPay', wallet: 'w_zalopay' },
];

/** Dòng nói về ngân hàng của người hưởng — không phải ngân hàng của mình. */
const BENEFICIARY_BANK_LINE = /ngan hang huong|ngan hang thu huong|beneficiary bank|ngan hang nhan/;

/** Biên lai chuyển tiền của Vietcombank không lặp lại tên ngân hàng trong phần thân. */
const VCB_RECEIPT = /bien lai chuyen tien|payment receipt/;

function detectBank(lines: ParsedLine[], flatAll: string): { bankName: string; suggestedWalletId: string } {
  // Bỏ qua dòng "Tên ngân hàng hưởng" (và dòng giá trị đi kèm) để không nhận nhầm ngân hàng đối tác.
  const ownLines: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (BENEFICIARY_BANK_LINE.test(lines[i].flat)) {
      if (!lines[i].value && lines[i + 1] && !lines[i + 1].value) i++; // nhãn song ngữ
      continue;
    }
    ownLines.push(lines[i].flat);
  }
  const ownText = ownLines.join('\n');

  for (const rule of BANK_RULES) {
    if (rule.re.test(ownText)) {
      return { bankName: rule.name, suggestedWalletId: rule.wallet };
    }
  }
  if (VCB_RECEIPT.test(flatAll) && /order number|so lenh giao dich/.test(flatAll)) {
    return { bankName: 'Vietcombank', suggestedWalletId: 'w_vcb' };
  }
  return { bankName: 'Ngân hàng', suggestedWalletId: 'w_vcb' };
}

const INCOME_HINTS = /ghi co|nhan tien|tien vao|credit amount|\bcredit\b|thanh toan luong|nhan luong|\bsalary\b/;
const OUTGOING_HINTS = /bien lai chuyen tien|payment receipt|debit account|tai khoan nguon|ghi no|thanh toan|chuyen tien/;

const CATEGORY_RULES_CHI: Array<[string, RegExp]> = [
  ['cat_cafe', /\b(cafe|coffee|highlands|starbucks|phuc long|katinat|tra sua|milk tea)\b/],
  ['cat_an_uong', /\b(an trua|an sang|an toi|an uong|com trua|com|quan an|nha hang|grabfood|shopeefood|baemin|buffet|lau|pho|bun)\b/],
  ['cat_mua_sam', /\b(shopee|lazada|tiki|mua sam|uniqlo|dien may|thegioididong|winmart|bach hoa)\b/],
  ['cat_tien_nha', /\b(tien nha|thue nha|tien phong|thue phong|tien tro|chung cu|rent)\b/],
  ['cat_dien', /\b(tien dien|tien nuoc|dien nuoc|evn|nuoc sach|hoa don dien)\b/],
  ['cat_internet', /\b(internet|wifi|viettel|vnpt|fpt|mobifone|vinaphone|4g|5g)\b/],
  ['cat_du_lich', /\b(ve may bay|khach san|du lich|vietjet|vietnam airlines|booking|agoda|resort)\b/],
  ['cat_giai_tri', /\b(ve phim|cgv|lotte cinema|game|steam|netflix|spotify)\b/],
  ['cat_hoc_tap', /\b(hoc phi|khoa hoc|tuition|udemy|mua sach)\b/],
  ['cat_y_te', /\b(thuoc|vien phi|nha khoa|pharmacity|long chau|benh vien|kham benh)\b/],
];

const CATEGORY_RULES_THU: Array<[string, RegExp]> = [
  ['cat_luong', /\b(luong|salary|payroll|thuong tet)\b/],
  ['cat_freelance', /\b(freelance|du an|project|outsource)\b/],
  ['cat_dau_tu', /\b(lai|lai suat|dau tu|co phieu|chung khoan|dividend|tiet kiem)\b/],
];

function suggestCategory(type: 'chi' | 'thu' | 'chuyen', hintText: string): string {
  const flat = normalizeVn(hintText);
  const rules = type === 'thu' ? CATEGORY_RULES_THU : CATEGORY_RULES_CHI;
  for (const [id, re] of rules) {
    if (re.test(flat)) return id;
  }
  return type === 'thu' ? 'cat_thu_khac' : 'cat_an_uong';
}

export function parseBankEmailOrText(rawInput: string): ParsedBankTransaction {
  const text = rawInput.trim();
  const lines = toLines(text);
  const flatAll = normalizeVn(text);

  const { bankName, suggestedWalletId } = detectBank(lines, flatAll);

  // Số tiền + chiều tiền
  const { amount, sign } = findAmount(lines);
  let type: 'chi' | 'thu' | 'chuyen' = 'chi';
  if (sign === '+') {
    type = 'thu';
  } else if (sign === '-') {
    type = 'chi';
  } else if (INCOME_HINTS.test(flatAll) && !OUTGOING_HINTS.test(flatAll)) {
    type = 'thu';
  }

  // Số tài khoản: ưu tiên tài khoản nguồn, sau đó tới nhãn chung, cuối cùng là "TK 9999xxxx" giữa dòng.
  const asAccount = (value?: string) => value?.trim().match(/^[\d*xX]{4,19}\b/)?.[0];
  const accountNumber =
    asAccount(getField(lines, /^(tai khoan nguon|debit account|tai khoan trich no|from account)\b/)) ??
    asAccount(getField(lines, /^(tai khoan|so tai khoan|account|account no|tk|stk|so tk)\b/)) ??
    text.match(/\b(?:TK|STK|So TK|Tai khoan|Account)\s*:?\s*([\d*xX]{4,19})/i)?.[1];

  // Ngày & giờ: biên lai ghi giờ trước ngày ("10:12 Thứ Năm 06/08/2026") nên tách riêng hai mẫu.
  let date = dayjs().format('YYYY-MM-DD');
  let time = dayjs().format('HH:mm');

  const dateTimeField = getField(lines, /^(ngay,? gio giao dich|ngay giao dich|thoi gian giao dich|trans\.? date|transaction date|thoi gian)\b/);
  const dateSource = dateTimeField ?? text;
  const dateMatch = dateSource.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (dateMatch) {
    const [, d, mo, y] = dateMatch;
    date = `${y.length === 2 ? `20${y}` : y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  // Giờ lấy trong cùng đoạn/dòng chứa ngày, nếu không có thì lấy giờ đầu tiên của email.
  const timeScope =
    dateTimeField ?? lines.find((l) => dateMatch && l.raw.includes(dateMatch[0]))?.raw ?? text;
  const timeMatch = timeScope.match(/\b(\d{1,2}):(\d{2})(?::\d{2})?\b/) ?? text.match(/\b(\d{1,2}):(\d{2})(?::\d{2})?\b/);
  if (timeMatch) {
    time = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
  }

  // Đối tác giao dịch
  const counterparty =
    type === 'thu'
      ? getField(lines, /^(ten nguoi chuyen( tien)?|nguoi chuyen( tien)?|remitter'?s? name|remitter)\b/)
      : getField(lines, /^(ten nguoi huong|nguoi huong|beneficiary name|ten nguoi nhan)\b/);

  // Nội dung giao dịch
  const noteField = getField(
    lines,
    /^(noi dung( chuyen tien| giao dich| ck)?|details of payment|description|remark|content|nd|ndck|ly do|mo ta)\b/,
  );
  let note = noteField?.trim() ?? '';
  if (!note) {
    const firstMeaningful = lines.find(
      (l) => !/bien lai|payment receipt|thong bao|^\(/.test(l.flat) && l.raw.length < 60,
    );
    note = firstMeaningful?.raw ?? `Giao dịch ${bankName}`;
  }

  const suggestedCategory = suggestCategory(type, `${note} ${counterparty ?? ''}`);

  return {
    amount,
    type,
    bankName,
    suggestedWalletId,
    suggestedCategory,
    date,
    time,
    note,
    accountNumber,
    counterparty,
    rawText: text,
  };
}

export const SAMPLE_BANK_EMAILS = [
  {
    title: '[Vietcombank] Thông báo biến động số dư tài khoản',
    bank: 'Vietcombank',
    rawText: `[Vietcombank] THONG BAO BIEN DONG SO DU.
Tài khoản: 0071001234567
Số tiền: -450,000 VND lúc 05/08/2026 14:25
Nội dung: Thanh toan don hang Shopee - Giay the thao
Số dư cuối: 24,550,000 VND`,
  },
  {
    title: '[Vietcombank] Biên lai chuyển tiền qua tài khoản',
    bank: 'VCB Biên lai',
    rawText: `Biên lai chuyển tiền qua tài khoản
(Payment Receipt)

Ngày, giờ giao dịch
Trans. Date, Time	10:12 Thứ Năm 06/08/2026
Số lệnh giao dịch
Order Number	15446251519
Tài khoản nguồn
Debit Account	0011000123456
Tên người chuyển tiền
Remitter's name	NGUYEN VAN A
Tài khoản người hưởng
Credit Account	30245827
Tên người hưởng
Beneficiary Name	TRAN VAN B
Tên ngân hàng hưởng
Beneficiary Bank Name	Ngân hàng Á Châu
Số tiền
Amount	80,000 VND
Loại phí
Charge Code	Người chuyển trả
Số tiền phí
Charge Amount	0 VND
VAT	0 VND
Nội dung chuyển tiền
Details of Payment	Nguyen Van A thanh toan tien an trua`,
  },
  {
    title: '[MB Bank] Biến động số dư tài khoản 9999xxxx',
    bank: 'MB Bank',
    rawText: `MB Bank thông báo:
TK 9999888866 | GD: -65,000 VND lúc 05/08/2026 09:15
ND: Chuyen tien Highlands Coffee Ha Noi
SD: 41,935,000 VND`,
  },
  {
    title: '[Techcombank] Thông báo nhận lương hàng tháng',
    bank: 'Techcombank',
    rawText: `Techcombank: Tai khoan 1903xxx
Giao dich: +15,000,000 VND vao ngay 01/08/2026 08:00
Noi dung: CTY CONG NGHE PHAN MEM THANH TOAN LUONG THANG 08/2026`,
  },
];
