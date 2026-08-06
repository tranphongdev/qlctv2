import React, { useState } from 'react';
import { Table, Button, Input, Select, Space, Tag, Modal, Popconfirm } from 'antd';
import { message } from '../lib/antdApp';
import {
  Plus,
  Search,
  FileSpreadsheet,
  FileText,
  Printer,
  Trash2,
  Edit,
  Eye,
  Mail,
} from 'lucide-react';
import dayjs from 'dayjs';
import type { AppState, Category, Transaction, Wallet } from '../types';
import { formatMoney, removeAccents } from '../utils/format';
import { DynamicIcon } from '../components/DynamicIcon';
import { exportTransactionsToExcel, exportTransactionsToCSV, printFinancialReport } from '../utils/export';

interface TransactionsProps {
  state: AppState;
  onOpenAddModal: (initialData?: Transaction) => void;
  onDeleteTx: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
  onRestoreTx?: (tx: Transaction) => void;
  onOpenBankSync?: () => void;
}

export const Transactions: React.FC<TransactionsProps> = ({
  state,
  onOpenAddModal,
  onDeleteTx,
  onBulkDelete,
  onRestoreTx: _onRestoreTx,
  onOpenBankSync,
}) => {
  const { transactions, categories, wallets } = state;
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [catFilter, setCatFilter] = useState<string>('all');
  const [walletFilter, setWalletFilter] = useState<string>('all');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const categoriesMap = categories.reduce((acc, c) => ({ ...acc, [c.id]: c }), {} as Record<string, Category>);
  const walletsMap = wallets.reduce((acc, w) => ({ ...acc, [w.id]: w }), {} as Record<string, Wallet>);

  // Filtered dataset
  const filteredData = transactions.filter((t) => {
    if (typeFilter !== 'all' && t.type !== typeFilter) return false;
    if (catFilter !== 'all' && t.category !== catFilter) return false;
    if (walletFilter !== 'all' && t.walletId !== walletFilter) return false;

    if (searchText) {
      const q = removeAccents(searchText);
      const note = removeAccents(t.note || '');
      const catName = removeAccents(categoriesMap[t.category]?.name || '');
      const walletName = removeAccents(walletsMap[t.walletId]?.name || '');
      const amountStr = t.amount.toString();
      return note.includes(q) || catName.includes(q) || walletName.includes(q) || amountStr.includes(q);
    }
    return true;
  });

  const handleExportExcel = () => {
    exportTransactionsToExcel(filteredData, walletsMap, categoriesMap);
    message.success('Đã xuất file Excel!');
  };

  const handleExportCSV = () => {
    exportTransactionsToCSV(filteredData, walletsMap, categoriesMap);
    message.success('Đã xuất file CSV!');
  };

  const handlePrintPDF = () => {
    const inc = filteredData.filter((t) => t.type === 'thu').reduce((a, b) => a + b.amount, 0);
    const exp = filteredData.filter((t) => t.type === 'chi').reduce((a, b) => a + b.amount, 0);
    printFinancialReport('BÁO CÁO GIAO DỊCH TÀI CHÍNH', { income: inc, expense: exp, balance: inc - exp }, filteredData);
  };

  const handleBulkDeleteAction = () => {
    if (selectedRowKeys.length === 0) return;
    onBulkDelete(selectedRowKeys as string[]);
    setSelectedRowKeys([]);
    message.success(`Đã xóa ${selectedRowKeys.length} giao dịch!`);
  };

  const columns = [
    {
      title: 'Ngày & Giờ',
      dataIndex: 'date',
      key: 'date',
      sorter: (a: Transaction, b: Transaction) => dayjs(a.date).unix() - dayjs(b.date).unix(),
      render: (date: string, record: Transaction) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{date}</div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>{record.time || '12:00'}</div>
        </div>
      ),
    },
    {
      title: 'Danh mục',
      dataIndex: 'category',
      key: 'category',
      render: (catId: string) => {
        const cat = categoriesMap[catId];
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: cat?.color ? `${cat.color}15` : '#e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <DynamicIcon name={cat?.icon || 'CircleDollarSign'} color={cat?.color || '#4F46E5'} size={16} />
            </div>
            <span style={{ fontWeight: 600, fontSize: 13 }}>{cat?.name || catId}</span>
          </div>
        );
      },
    },
    {
      title: 'Ghi chú & Thẻ',
      dataIndex: 'note',
      key: 'note',
      render: (note: string, record: Transaction) => (
        <div>
          <div style={{ fontWeight: 500, fontSize: 13, color: 'var(--text-heading)' }}>{note || 'Không có ghi chú'}</div>
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
      title: 'Ví / Nguồn tiền',
      dataIndex: 'walletId',
      key: 'walletId',
      render: (wId: string) => {
        const wallet = walletsMap[wId];
        return <Tag color={wallet?.color || 'blue'}>{wallet?.name || wId}</Tag>;
      },
    },
    {
      title: 'Số tiền (VNĐ)',
      dataIndex: 'amount',
      key: 'amount',
      sorter: (a: Transaction, b: Transaction) => a.amount - b.amount,
      render: (val: number, record: Transaction) => {
        const isThu = record.type === 'thu';
        return (
          <span style={{ fontSize: 15, fontWeight: 700, color: isThu ? '#16A34A' : '#DC2626' }}>
            {isThu ? '+' : '-'}{formatMoney(val)}
          </span>
        );
      },
    },
    {
      title: 'Hóa đơn',
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
            Xem ảnh
          </Button>
        ) : (
          <span style={{ fontSize: 12, color: '#cbd5e1' }}>Không có</span>
        ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: Transaction) => (
        <Space size="small">
          <Button
            type="text"
            icon={<Edit size={16} color="#3B82F6" />}
            onClick={() => onOpenAddModal(record)}
          />
          <Popconfirm
            title="Xóa giao dịch này?"
            description="Bạn có chắc chắn muốn xóa không?"
            onConfirm={() => onDeleteTx(record.id)}
            okText="Xóa"
            cancelText="Hủy"
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
          <div style={{ fontSize: 18, fontWeight: 800 }}>Quản lý Giao dịch</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Tổng số {filteredData.length} giao dịch được ghi nhận</div>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', width: '100%', justifyContent: 'flex-start' }} className="mobile-only">
          <Button icon={<Plus size={14} />} type="primary" onClick={() => onOpenAddModal()} style={{ flex: 1 }}>
            Thêm Giao Dịch
          </Button>
          {onOpenBankSync && (
            <Button icon={<Mail size={14} color="#7C3AED" />} onClick={onOpenBankSync} />
          )}
          <Button icon={<FileSpreadsheet size={14} color="#16A34A" />} onClick={handleExportExcel} />
          <Button icon={<FileText size={14} color="#2563EB" />} onClick={handleExportCSV} />
          <Button icon={<Printer size={14} color="#7C3AED" />} onClick={handlePrintPDF} />
        </div>

        <Space wrap className="desktop-only">
          {selectedRowKeys.length > 0 && (
            <Popconfirm title={`Xóa ${selectedRowKeys.length} giao dịch đã chọn?`} onConfirm={handleBulkDeleteAction}>
              <Button danger icon={<Trash2 size={16} />}>
                Xóa {selectedRowKeys.length} mục
              </Button>
            </Popconfirm>
          )}

          {onOpenBankSync && (
            <Button icon={<Mail size={16} color="#7C3AED" />} onClick={onOpenBankSync}>
              Đồng bộ Email Ngân hàng
            </Button>
          )}
          <Button icon={<FileSpreadsheet size={16} color="#16A34A" />} onClick={handleExportExcel}>
            Xuất Excel
          </Button>
          <Button icon={<FileText size={16} color="#2563EB" />} onClick={handleExportCSV}>
            Xuất CSV
          </Button>
          <Button icon={<Printer size={16} color="#7C3AED" />} onClick={handlePrintPDF}>
            In Báo cáo
          </Button>
          <Button type="primary" icon={<Plus size={16} />} onClick={() => onOpenAddModal()}>
            Thêm Giao Dịch
          </Button>
        </Space>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="glass-card" style={{ padding: '12px 16px', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <Input
          prefix={<Search size={16} />}
          placeholder="Tìm theo ghi chú, danh mục, số tiền..."
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
            { value: 'all', label: 'Tất cả loại' },
            { value: 'thu', label: '🟢 Thu' },
            { value: 'chi', label: '🔴 Chi' },
            { value: 'chuyen', label: '🔄 Chuyển' },
          ]}
        />

        <Select
          value={catFilter}
          onChange={setCatFilter}
          style={{ width: 170, flexShrink: 0 }}
          options={[
            { value: 'all', label: 'Tất cả danh mục' },
            ...categories.map((c) => ({ value: c.id, label: c.name })),
          ]}
        />

        <Select
          value={walletFilter}
          onChange={setWalletFilter}
          style={{ width: 150, flexShrink: 0 }}
          options={[
            { value: 'all', label: 'Tất cả ví' },
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
          pagination={{ pageSize: 8, showSizeChanger: true }}
          style={{ width: '100%' }}
        />
      </div>

      {/* Mobile Card List */}
      <div className="mobile-only" style={{ flexDirection: 'column', gap: 12 }}>
        {filteredData.length === 0 ? (
          <div className="glass-card" style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>
            Không tìm thấy giao dịch nào
          </div>
        ) : (
          filteredData.map((tx) => {
            const cat = categoriesMap[tx.category];
            const wallet = walletsMap[tx.walletId];
            const isThu = tx.type === 'thu';
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
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{tx.note || cat?.name || 'Giao dịch'}</div>
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
                    <Popconfirm title="Xóa giao dịch này?" onConfirm={() => onDeleteTx(tx.id)}>
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
