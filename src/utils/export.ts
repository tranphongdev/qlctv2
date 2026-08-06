import * as XLSX from 'xlsx';
import type { Transaction, Wallet, Category } from '../types';
import { formatMoney } from './format';
import { t } from '../i18n';

export function exportTransactionsToExcel(
  transactions: Transaction[],
  walletsMap: Record<string, Wallet>,
  categoriesMap: Record<string, Category>
) {
  const data = transactions.map((tx, index) => ({
    'STT': index + 1,
    [t('export.col_date')]: tx.date,
    [t('export.col_time')]: tx.time || '',
    [t('export.col_type')]: tx.type === 'thu' ? t('export.type_income') : tx.type === 'chi' ? t('export.type_expense') : t('export.type_transfer'),
    [t('export.col_category')]: categoriesMap[tx.category]?.name || tx.category,
    [t('export.col_amount')]: tx.amount,
    [t('export.col_wallet')]: walletsMap[tx.walletId]?.name || tx.walletId,
    [t('export.col_note')]: tx.note || '',
    [t('export.col_counterparty')]: tx.counterparty || '',
    [t('export.col_location')]: tx.location || '',
    [t('export.col_tags')]: (tx.tags || []).join(', ')
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
  const rows = transactions.map((tx, i) => [
    i + 1,
    tx.date,
    tx.type,
    `"${categoriesMap[tx.category]?.name || tx.category}"`,
    tx.amount,
    `"${walletsMap[tx.walletId]?.name || tx.walletId}"`,
    `"${(tx.note || '').replace(/"/g, '""')}"`
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
      <p style="color: #64748b; font-size: 13px;">${t('export.exported_on', { date: new Date().toLocaleDateString() })}</p>
      
      <div class="summary-box">
        <div class="stat">
          <div class="stat-label">${t('export.total_income')}</div>
          <div class="stat-val income">${formatMoney(summary.income)}</div>
        </div>
        <div class="stat">
          <div class="stat-label">${t('export.total_expense')}</div>
          <div class="stat-val expense">${formatMoney(summary.expense)}</div>
        </div>
        <div class="stat">
          <div class="stat-label">${t('export.net_balance')}</div>
          <div class="stat-val">${formatMoney(summary.balance)}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>${t('export.col_date')}</th>
            <th>${t('export.col_type')}</th>
            <th>${t('export.col_category')}</th>
            <th>${t('export.col_note')}</th>
            <th>${t('export.th_amount')}</th>
          </tr>
        </thead>
        <tbody>
          ${transactions.map(tx => `
            <tr>
              <td>${tx.date}</td>
              <td>${tx.type === 'thu' ? t('export.type_income') : t('export.type_expense')}</td>
              <td>${tx.category}</td>
              <td>${tx.note || ''}</td>
              <td class="amount-${tx.type}">${tx.type === 'thu' ? '+' : '-'}${formatMoney(tx.amount)}</td>
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
