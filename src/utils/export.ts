import * as XLSX from 'xlsx';
import type { Transaction, Wallet, Category } from '../types';
import { formatMoney } from './format';

export function exportTransactionsToExcel(
  transactions: Transaction[],
  walletsMap: Record<string, Wallet>,
  categoriesMap: Record<string, Category>
) {
  const data = transactions.map((t, index) => ({
    'STT': index + 1,
    'Ngày': t.date,
    'Giờ': t.time || '',
    'Loại': t.type === 'thu' ? 'Thu nhập' : t.type === 'chi' ? 'Chi tiêu' : 'Chuyển khoản',
    'Danh mục': categoriesMap[t.category]?.name || t.category,
    'Số tiền (VNĐ)': t.amount,
    'Ví tiền': walletsMap[t.walletId]?.name || t.walletId,
    'Ghi chú': t.note || '',
    'Người liên quan': t.counterparty || '',
    'Địa điểm': t.location || '',
    'Thẻ (Tags)': (t.tags || []).join(', ')
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'GiaoDich');
  XLSX.writeFile(workbook, `Bao_Cao_Chi_Tieu_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportTransactionsToCSV(
  transactions: Transaction[],
  walletsMap: Record<string, Wallet>,
  categoriesMap: Record<string, Category>
) {
  const headers = ['STT', 'Ngay', 'Loai', 'Danh Muc', 'So Tien', 'Vi Tien', 'Ghi Chu'];
  const rows = transactions.map((t, i) => [
    i + 1,
    t.date,
    t.type,
    `"${categoriesMap[t.category]?.name || t.category}"`,
    t.amount,
    `"${walletsMap[t.walletId]?.name || t.walletId}"`,
    `"${(t.note || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Giao_Dich_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function printFinancialReport(title: string, summary: { income: number; expense: number; balance: number }, transactions: Transaction[]) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 24px; color: #1e293b; }
        h1 { font-size: 24px; color: #4f46e5; margin-bottom: 8px; }
        .summary-box { display: flex; gap: 20px; margin: 20px 0; background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; }
        .stat { flex: 1; text-align: center; }
        .stat-label { font-size: 12px; color: #64748b; text-transform: uppercase; }
        .stat-val { font-size: 18px; font-weight: bold; margin-top: 4px; }
        .income { color: #16a34a; }
        .expense { color: #dc2626; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
        th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
        th { background: #f1f5f9; font-weight: 600; }
        .amount-thu { color: #16a34a; font-weight: 600; }
        .amount-chi { color: #dc2626; font-weight: 600; }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <p style="color: #64748b; font-size: 13px;">Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}</p>
      
      <div class="summary-box">
        <div class="stat">
          <div class="stat-label">Tổng Thu</div>
          <div class="stat-val income">${formatMoney(summary.income)}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Tổng Chi</div>
          <div class="stat-val expense">${formatMoney(summary.expense)}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Số Dư Ròng</div>
          <div class="stat-val">${formatMoney(summary.balance)}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Ngày</th>
            <th>Loại</th>
            <th>Danh mục</th>
            <th>Ghi chú</th>
            <th>Số tiền</th>
          </tr>
        </thead>
        <tbody>
          ${transactions.map(t => `
            <tr>
              <td>${t.date}</td>
              <td>${t.type === 'thu' ? 'Thu nhập' : 'Chi tiêu'}</td>
              <td>${t.category}</td>
              <td>${t.note || ''}</td>
              <td class="amount-${t.type}">${t.type === 'thu' ? '+' : '-'}${formatMoney(t.amount)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
