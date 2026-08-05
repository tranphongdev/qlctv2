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
  rawText: string;
}

export function parseBankEmailOrText(rawInput: string): ParsedBankTransaction {
  const text = rawInput.trim();

  // Detect Bank Name
  let bankName = 'Ngân hàng';
  let suggestedWalletId = 'w_vcb';

  if (/vietcombank|vcb/i.test(text)) {
    bankName = 'Vietcombank';
    suggestedWalletId = 'w_vcb';
  } else if (/mbbank|mb bank|mbb/i.test(text)) {
    bankName = 'MB Bank';
    suggestedWalletId = 'w_mb';
  } else if (/techcombank|tcb/i.test(text)) {
    bankName = 'Techcombank';
    suggestedWalletId = 'w_vcb';
  } else if (/momo/i.test(text)) {
    bankName = 'MoMo';
    suggestedWalletId = 'w_momo';
  } else if (/vpbank/i.test(text)) {
    bankName = 'VPBank';
    suggestedWalletId = 'w_vcb';
  } else if (/acb/i.test(text)) {
    bankName = 'ACB';
    suggestedWalletId = 'w_vcb';
  } else if (/bidv/i.test(text)) {
    bankName = 'BIDV';
    suggestedWalletId = 'w_vcb';
  }

  // Detect Transaction Type & Amount
  // Patterns like: -150,000 VND, -150.000, +25,000,000 VND, PS: -500.000VND, SD TK... -250,000VND
  let type: 'chi' | 'thu' | 'chuyen' = 'chi';
  let amount = 0;

  // Check sign: if '+' or 'cộng' or 'nhận' -> thu. If '-' or 'trừ' or 'thanh toán' -> chi
  const isIncome = /(\+|\bcong\b|\bnhan\b|\bthu\b|\bco\b)/i.test(text) && !/-\s*\d+/i.test(text);
  if (isIncome) {
    type = 'thu';
  }

  // Regex to match amount numbers (e.g. 250.000, 1,500,000, 500000)
  const amountMatches = text.match(/([+-]?\s*[\d\.\,]{4,15})\s*(VND|VNĐ|đ|d)?/i);
  if (amountMatches) {
    const cleanStr = amountMatches[1].replace(/[+-\s]/g, '').replace(/[\.\,]/g, '');
    const parsedNum = parseInt(cleanStr, 10);
    if (!isNaN(parsedNum) && parsedNum > 1000) {
      amount = parsedNum;
    }
  }

  // Fallback amount regex: match any 5-9 digit number
  if (amount === 0) {
    const rawNum = text.match(/\b\d{5,9}\b/);
    if (rawNum) {
      amount = parseInt(rawNum[0], 10);
    }
  }

  // Account number detection
  const accMatch = text.match(/(TK|STK|So TK|Tai khoang?|Account)\s*:?\s*([\d\*xX]{4,14})/i);
  const accountNumber = accMatch ? accMatch[2] : undefined;

  // Date & Time Detection
  let date = dayjs().format('YYYY-MM-DD');
  let time = dayjs().format('HH:mm');

  const dateTimeMatch = text.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s*(\d{1,2}:\d{2}(:\d{2})?)?/);
  if (dateTimeMatch) {
    const rawDateStr = dateTimeMatch[1];
    const parts = rawDateStr.split(/[\/\-]/);
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
      date = `${year}-${month}-${day}`;
    }
    if (dateTimeMatch[2]) {
      time = dateTimeMatch[2].substring(0, 5);
    }
  }

  // Note & Counterparty extraction
  let note = `Giao dịch ${bankName}`;
  const contentMatch = text.match(/(ND|Noi dung|NDCK|Noi dung chuyen|Ref|Ly do)\s*:?\s*([^\n\r\.]+)/i);
  if (contentMatch) {
    note = contentMatch[2].trim();
  } else {
    // If no explicit keyword, extract first line or short snippet
    const lines = text.split(/[\r\n]+/);
    if (lines.length > 0 && lines[0].length < 60) {
      note = lines[0].trim();
    }
  }

  // Suggest Category based on keywords
  let suggestedCategory = type === 'thu' ? 'cat_luong' : 'cat_an_uong';
  const lowerNote = (note + ' ' + text).toLowerCase();

  if (type === 'thu') {
    if (lowerNote.includes('luong') || lowerNote.includes('salary')) {
      suggestedCategory = 'cat_luong';
    } else if (lowerNote.includes('freelance') || lowerNote.includes('du an')) {
      suggestedCategory = 'cat_freelance';
    } else if (lowerNote.includes('lai') || lowerNote.includes('dau tu') || lowerNote.includes('cophieu')) {
      suggestedCategory = 'cat_dau_tu';
    } else {
      suggestedCategory = 'cat_thu_khac';
    }
  } else {
    if (lowerNote.includes('cafe') || lowerNote.includes('higlands') || lowerNote.includes('starbucks') || lowerNote.includes('phuc long') || lowerNote.includes('tra sua')) {
      suggestedCategory = 'cat_cafe';
    } else if (lowerNote.includes('shopee') || lowerNote.includes('lazada') || lowerNote.includes('tiki') || lowerNote.includes('mua sam') || lowerNote.includes('uniqlo')) {
      suggestedCategory = 'cat_mua_sam';
    } else if (lowerNote.includes('nha') || lowerNote.includes('phong') || lowerNote.includes('rent')) {
      suggestedCategory = 'cat_tien_nha';
    } else if (lowerNote.includes('dien') || lowerNote.includes('nuoc') || lowerNote.includes('evn')) {
      suggestedCategory = 'cat_dien';
    } else if (lowerNote.includes('internet') || lowerNote.includes('viettel') || lowerNote.includes('vnpt') || lowerNote.includes('fpt') || lowerNote.includes('4g')) {
      suggestedCategory = 'cat_internet';
    } else if (lowerNote.includes('bay') || lowerNote.includes('khach san') || lowerNote.includes('du lich') || lowerNote.includes('vietjet') || lowerNote.includes('vna')) {
      suggestedCategory = 'cat_du_lich';
    } else if (lowerNote.includes('ve phim') || lowerNote.includes('cgv') || lowerNote.includes('game') || lowerNote.includes('steam') || lowerNote.includes('netflix')) {
      suggestedCategory = 'cat_giai_tri';
    } else if (lowerNote.includes('thuoc') || lowerNote.includes('vien phi') || lowerNote.includes('nhakhoa') || lowerNote.includes('pharmacity')) {
      suggestedCategory = 'cat_y_te';
    }
  }

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
