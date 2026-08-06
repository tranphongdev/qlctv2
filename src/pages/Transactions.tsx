import React, { useEffect, useState } from 'react';
import { Table, Button, Input, Select, Space, Tag, Modal, Popconfirm } from 'antd';
import { message } from '~/lib/antdApp';
import {
  Plus,
  Search,
  FileSpreadsheet,
  FileText,
  Printer,
  Trash2,
  Edit,
  Eye,
} from 'lucide-react';
import { TX_TYPE, type AppState, type Category, type Transaction, type Wallet } from '~/types';
import { formatMoney, removeAccents } from '~/utils/format';
import { compareTxNewestFirst } from '~/utils/transactionOrder';
import { resolveCategory } from '~/utils/categories';
import { DynamicIcon } from '~/components/DynamicIcon';
import { exportTransactionsToExcel, exportTransactionsToCSV, printFinancialReport } from '~/utils/export';
import { t } from '~/i18n';

interface TransactionsProps {
  state: AppState;
  onOpenAddModal: (initialData?: Transaction) => void;
  onDeleteTx: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
  onRestoreTx?: (tx: Transaction) => void;
}

export const Transactions: React.FC<TransactionsProps> = ({
  state,
  onOpenAddModal,
  onDeleteTx,
  onBulkDelete,
  onRestoreTx: _onRestoreTx,
}) => {
  const { transactions, categories, wallets } = state;
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [catFilter, setCatFilter] = useState<string>('all');
  const [walletFilter, setWalletFilter] = useState<string>('all');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  /**
   * Về trang đầu khi tập dữ liệu đổi.
   *
   * Bảng luôn xếp mới nhất lên trước, nên giao dịch vừa thêm rơi vào trang 1.
   * Nếu người dùng đang đứng ở trang 3 mà antd giữ nguyên trang, họ bấm lưu xong
   * không thấy gì thay đổi và tưởng danh sách chưa cập nhật. Đổi bộ lọc cũng
   * vậy: số trang cũ thường không còn tồn tại trong kết quả mới.
   */
  useEffect(() => {
    setPage(1);
  }, [transactions.length, typeFilter, catFilter, walletFilter, searchText]);

  const categoriesMap = categories.reduce((acc, c) => ({ ...acc, [c.id]: c }), {} as Record<string, Category>);
  const walletsMap = wallets.reduce((acc, w) => ({ ...acc, [w.id]: w }), {} as Record<string, Wallet>);

  // Filtered dataset
  const filteredData = transactions.filter((tx) => {
    if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
    if (catFilter !== 'all' && tx.category !== catFilter) return false;
    if (walletFilter !== 'all' && tx.walletId !== walletFilter) return false;

    if (searchText) {
      const q = removeAccents(searchText);
      const note = removeAccents(tx.note || '');
      const catName = removeAccents(resolveCategory(tx.category, categoriesMap).name);
      const walletName = removeAccents(walletsMap[tx.walletId]?.name || '');
      const amountStr = tx.amount.toString();
      return note.includes(q) || catName.includes(q) || walletName.includes(q) || amountStr.includes(q);
    }
    return true;
  });

  const handleExportExcel = () => {
    exportTransactionsToExcel(filteredData, walletsMap, categoriesMap);
    message.success(t('tx.export_excel_done'));
  };

  const handleExportCSV = () => {
    exportTransactionsToCSV(filteredData, walletsMap, categoriesMap);
    message.success(t('tx.export_csv_done'));
  };

  const handlePrintPDF = () => {
    const inc = filteredData.filter((tx) => tx.type === TX_TYPE.INCOME).reduce((a, b) => a + b.amount, 0);
    const exp = filteredData.filter((tx) => tx.type === TX_TYPE.EXPENSE).reduce((a, b) => a + b.amount, 0);
    printFinancialReport(t('tx.report_title'), { income: inc, expense: exp, balance: inc - exp }, filteredData);
  };

  const handleBulkDeleteAction = () => {
    if (selectedRowKeys.length === 0) return;
    onBulkDelete(selectedRowKeys as string[]);
    setSelectedRowKeys([]);
    message.success(t('tx.bulk_deleted', { count: selectedRowKeys.length }));
  };

  const columns = [
    {
      title: t('tx.col_datetime'),
      dataIndex: 'date',
      key: 'date',
      // Đảo dấu vì compareTxNewestFirst xếp giảm dần, còn sorter của antd nhận
      // hàm so sánh tăng dần. Bảng vốn đã hiện mới nhất trước, đây là để người
      // dùng bấm đảo chiều mà vẫn tính cả giờ chứ không chỉ ngày.
      sorter: (a: Transaction, b: Transaction) => -compareTxNewestFirst(a, b),
      render: (date: string, record: Transaction) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{date}</div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>{record.time || '12:00'}</div>
        </div>
      ),
    },
    {
      title: t('tx.col_category'),
      dataIndex: 'category',
      key: 'category',
      render: (catId: string) => {
        const cat = resolveCategory(catId, categoriesMap);
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: `${cat.color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <DynamicIcon name={cat.icon} color={cat.color} size={16} />
            </div>
            <span style={{ fontWeight: 600, fontSize: 13 }}>{cat.name}</span>
          </div>
        );
      },
    },
    {
      title: t('tx.col_note_tags'),
      dataIndex: 'note',
      key: 'note',
      render: (note: string, record: Transaction) => (
        <div>
          <div style={{ fontWeight: 500, fontSize: 13, color: 'var(--text-heading)' }}>{note || t('common.no_note')}</div>
          {record.tags && record.tags.length > 0 && (
            <div style={{ marginTop: 4, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {record.tags.map((tag) => (
                <Tag key={tag} color="geekblue" style={{ fontSize: 10, padding: '0 6px' }}>
                  #{tag}
                </Tag>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      title: t('tx.col_wallet'),
      dataIndex: 'walletId',
      key: 'walletId',
      render: (wId: string) => {
        const wallet = walletsMap[wId];
        return <Tag color={wallet?.color || 'blue'}>{wallet?.name || wId}</Tag>;
      },
    },
    {
      title: t('tx.col_amount'),
      dataIndex: 'amount',
      key: 'amount',
      sorter: (a: Transaction, b: Transaction) => a.amount - b.amount,
      render: (val: number, record: Transaction) => {
        const isThu = record.type === TX_TYPE.INCOME;
        return (
          <span style={{ fontSize: 15, fontWeight: 700, color: isThu ? '#16A34A' : '#DC2626' }}>
            {isThu ? '+' : '-'}{formatMoney(val)}
          </span>
        );
      },
    },
    {
      title: t('tx.col_receipt'),
      dataIndex: 'receiptUrl',
      key: 'receiptUrl',
      render: (url?: string) =>
        url ? (
          <Button
            size="small"
            type="text"
            icon={<Eye size={16} color="#4F46E5" />}
            onClick={() => setPreviewImage(url)}
          >
            {t('tx.view_image')}
          </Button>
        ) : (
          <span style={{ fontSize: 12, color: '#cbd5e1' }}>{t('tx.none')}</span>
        ),
    },
    {
      title: t('common.actions'),
      key: 'action',
      render: (_: any, record: Transaction) => (
        <Space size="small">
          <Button
            type="text"
            icon={<Edit size={16} color="#3B82F6" />}
            onClick={() => onOpenAddModal(record)}
          />
          <Popconfirm
            title={t('tx.delete_title')}
            description={t('tx.delete_desc')}
            onConfirm={() => onDeleteTx(record.id)}
            okText={t('common.delete')}
            cancelText={t('common.cancel')}
          >
            <Button type="text" icon={<Trash2 size={16} color="#EF4444" />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header Bar */}
      <div className="glass-card" style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>{t('tx.title')}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('tx.subtitle', { count: filteredData.length })}</div>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', width: '100%', justifyContent: 'flex-start' }} className="mobile-only">
          <Button icon={<Plus size={14} />} type="primary" onClick={() => onOpenAddModal()} style={{ flex: 1 }}>
            {t('tx.add')}
          </Button>
          <Button icon={<FileSpreadsheet size={14} color="#16A34A" />} onClick={handleExportExcel} />
          <Button icon={<FileText size={14} color="#2563EB" />} onClick={handleExportCSV} />
          <Button icon={<Printer size={14} color="#7C3AED" />} onClick={handlePrintPDF} />
        </div>

        <Space wrap className="desktop-only">
          {selectedRowKeys.length > 0 && (
            <Popconfirm title={t('tx.bulk_delete_confirm', { count: selectedRowKeys.length })} onConfirm={handleBulkDeleteAction}>
              <Button danger icon={<Trash2 size={16} />}>
                {t('tx.bulk_delete_button', { count: selectedRowKeys.length })}
              </Button>
            </Popconfirm>
          )}

          <Button icon={<FileSpreadsheet size={16} color="#16A34A" />} onClick={handleExportExcel}>
            {t('tx.export_excel')}
          </Button>
          <Button icon={<FileText size={16} color="#2563EB" />} onClick={handleExportCSV}>
            {t('tx.export_csv')}
          </Button>
          <Button icon={<Printer size={16} color="#7C3AED" />} onClick={handlePrintPDF}>
            {t('tx.print_report')}
          </Button>
          <Button type="primary" icon={<Plus size={16} />} onClick={() => onOpenAddModal()}>
            {t('tx.add')}
          </Button>
        </Space>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="glass-card" style={{ padding: '12px 16px', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <Input
          prefix={<Search size={16} />}
          placeholder={t('tx.search_placeholder')}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 220, flexShrink: 0 }}
          allowClear
        />

        <Select
          value={typeFilter}
          onChange={setTypeFilter}
          style={{ width: 140, flexShrink: 0 }}
          options={[
            { value: 'all', label: t('tx.filter_all_types') },
            { value: TX_TYPE.INCOME, label: t('tx.type_income') },
            { value: TX_TYPE.EXPENSE, label: t('tx.type_expense') },
            { value: TX_TYPE.TRANSFER, label: t('tx.type_transfer') },
          ]}
        />

        <Select
          value={catFilter}
          onChange={setCatFilter}
          style={{ width: 170, flexShrink: 0 }}
          options={[
            { value: 'all', label: t('tx.filter_all_categories') },
            ...categories.map((c) => ({ value: c.id, label: c.name })),
          ]}
        />

        <Select
          value={walletFilter}
          onChange={setWalletFilter}
          style={{ width: 150, flexShrink: 0 }}
          options={[
            { value: 'all', label: t('tx.filter_all_wallets') },
            ...wallets.map((w) => ({ value: w.id, label: w.name })),
          ]}
        />
      </div>

      {/* Desktop Table List */}
      <div className="desktop-only glass-card" style={{ padding: 12 }}>
        <Table
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          pagination={{
            current: page,
            pageSize,
            showSizeChanger: true,
            onChange: (nextPage, nextSize) => {
              setPage(nextPage);
              setPageSize(nextSize);
            },
          }}
          style={{ width: '100%' }}
        />
      </div>

      {/* Mobile Card List */}
      <div className="mobile-only" style={{ flexDirection: 'column', gap: 12 }}>
        {filteredData.length === 0 ? (
          <div className="glass-card" style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>
            {t('tx.empty')}
          </div>
        ) : (
          filteredData.map((tx) => {
            const cat = resolveCategory(tx.category, categoriesMap);
            const wallet = walletsMap[tx.walletId];
            const isThu = tx.type === TX_TYPE.INCOME;
            return (
              <div key={tx.id} className="glass-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 12,
                        background: cat?.color ? `${cat.color}15` : '#4F46E515',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <DynamicIcon name={cat?.icon || 'CircleDollarSign'} color={cat?.color || '#4F46E5'} size={20} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{tx.note || cat?.name || t('tx.fallback_name')}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>
                        {tx.date} • {cat?.name}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: isThu ? '#16A34A' : '#DC2626' }}>
                      {isThu ? '+' : '-'}{formatMoney(tx.amount)}
                    </div>
                    <Tag color={wallet?.color || 'blue'} style={{ margin: 0, fontSize: 10 }}>{wallet?.name || tx.walletId}</Tag>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(148, 163, 184, 0.15)', paddingTop: 8, marginTop: 2 }}>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {tx.tags?.map((tag) => (
                      <Tag key={tag} color="geekblue" style={{ fontSize: 10 }}>#{tag}</Tag>
                    ))}
                  </div>

                  <Space size="small">
                    {tx.receiptUrl && (
                      <Button size="small" type="text" icon={<Eye size={16} color="#4F46E5" />} onClick={() => setPreviewImage(tx.receiptUrl || null)} />
                    )}
                    <Button size="small" type="text" icon={<Edit size={16} color="#3B82F6" />} onClick={() => onOpenAddModal(tx)} />
                    <Popconfirm title={t('tx.delete_title')} onConfirm={() => onDeleteTx(tx.id)}>
                      <Button size="small" type="text" icon={<Trash2 size={16} color="#EF4444" />} />
                    </Popconfirm>
                  </Space>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Image Preview Modal */}
      <Modal open={!!previewImage} footer={null} onCancel={() => setPreviewImage(null)} width={600}>
        {previewImage && <img src={previewImage} alt="Receipt Full" style={{ width: '100%', borderRadius: 14 }} />}
      </Modal>
    </div>
  );
};
