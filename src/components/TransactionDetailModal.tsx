import React from 'react';
import { Modal, Button, Tag, Popconfirm, Image } from 'antd';
import { Pencil, Trash2, ImageOff } from 'lucide-react';
import { TX_TYPE, type Category, type Transaction, type Wallet } from '~/types';
import { formatMoney } from '~/utils/format';
import { resolveCategory } from '~/utils/categories';
import { DynamicIcon } from './DynamicIcon';
import { t } from '~/i18n';

interface TransactionDetailModalProps {
  /** null nghĩa là đang đóng. Nhận cả bản ghi thay vì id để modal không phải tự tra. */
  tx: Transaction | null;
  categoriesMap: Record<string, Category>;
  walletsMap: Record<string, Wallet>;
  onClose: () => void;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
}

/** Một dòng nhãn — giá trị. Bỏ qua hẳn khi không có giá trị. */
const Row: React.FC<{ label: string; children?: React.ReactNode }> = ({ label, children }) => {
  if (children === null || children === undefined || children === '') return null;
  return (
    <div
      style={{
        display: 'flex',
        gap: 16,
        alignItems: 'flex-start',
        padding: '10px 0',
        borderTop: '1px solid var(--surface-border)',
      }}
    >
      <div style={{ fontSize: 12, color: 'var(--text-muted)', width: 110, flexShrink: 0 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 500, minWidth: 0, flex: 1, wordBreak: 'break-word' }}>{children}</div>
    </div>
  );
};

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  tx,
  categoriesMap,
  walletsMap,
  onClose,
  onEdit,
  onDelete,
}) => {
  return (
    <Modal open={!!tx} onCancel={onClose} title={t('txd.title')} footer={null} destroyOnHidden>
      {/* Thân tách ra thành component riêng thay vì `if (!tx) return null` ở đầu:
          Modal phải luôn được dựng thì antd mới chạy được hoạt ảnh đóng — trả về
          null ngay khi tx thành null sẽ làm modal biến mất phựt một cái. */}
      {tx && <Body tx={tx} {...{ categoriesMap, walletsMap, onClose, onEdit, onDelete }} />}
    </Modal>
  );
};

const Body: React.FC<Omit<TransactionDetailModalProps, 'tx'> & { tx: Transaction }> = ({
  tx,
  categoriesMap,
  walletsMap,
  onClose,
  onEdit,
  onDelete,
}) => {
  const cat = resolveCategory(tx.category, categoriesMap);
  const wallet = walletsMap[tx.walletId];
  const toWallet = tx.toWalletId ? walletsMap[tx.toWalletId] : undefined;

  const isIncome = tx.type === TX_TYPE.INCOME;
  const isTransfer = tx.type === TX_TYPE.TRANSFER;
  /* Chuyển khoản không phải thu cũng không phải chi: tiền chỉ đổi chỗ giữa hai ví
     của cùng một người. Gắn dấu trừ đỏ vào nó (như danh sách đang làm) khiến người
     dùng tưởng vừa mất tiền. */
  const sign = isTransfer ? '' : isIncome ? '+' : '-';
  const amountColor = isTransfer ? 'var(--text-heading)' : isIncome ? 'var(--color-income)' : 'var(--color-expense)';

  /* Dùng nhãn riêng chứ không mượn `tx.type_*`: bộ đó có sẵn emoji chấm màu để
     phân biệt trong ô lọc, nhét vào thẻ Tag đã có màu thì thành thừa hai lần. */
  const typeLabel = isTransfer ? t('txd.type_transfer') : isIncome ? t('txd.type_income') : t('txd.type_expense');

  return (
    <>
      {/* Cụm đầu: cái người dùng muốn thấy trước tiên — bao nhiêu tiền, vào đâu. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '16px 0 4px' }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            flexShrink: 0,
            background: `${cat.color}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <DynamicIcon name={cat.icon} color={cat.color} size={26} />
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{cat.name}</div>
          <Tag
            color={isTransfer ? 'geekblue' : isIncome ? 'green' : 'red'}
            style={{ marginTop: 4, marginInlineEnd: 0 }}
          >
            {typeLabel}
          </Tag>
        </div>

        <div style={{ fontSize: 22, fontWeight: 800, color: amountColor, textAlign: 'right' }}>
          {sign}{formatMoney(tx.amount)}
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <Row label={t('txd.datetime')}>
          {tx.date}{tx.time ? ` · ${tx.time}` : ''}
        </Row>

        {isTransfer && toWallet ? (
          <Row label={t('txd.transfer_route')}>
            {(wallet?.name || tx.walletId)} → {toWallet.name}
          </Row>
        ) : (
          <Row label={t('tx.col_wallet')}>{wallet?.name || tx.walletId}</Row>
        )}

        <Row label={t('common.note')}>
          {tx.note || <span style={{ color: 'var(--text-muted)' }}>{t('common.no_note')}</span>}
        </Row>

        {tx.tags && tx.tags.length > 0 && (
          <Row label={t('txd.tags')}>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {tx.tags.map((tag) => (
                <Tag key={tag} color="geekblue" style={{ marginInlineEnd: 0 }}>#{tag}</Tag>
              ))}
            </div>
          </Row>
        )}

        {/* Địa điểm và người liên quan hiện chưa có ô nhập ở đâu cả, nên gần như
            luôn rỗng. Vẫn dựng sẵn ở đây vì dữ liệu cũ hoặc bản ghi đồng bộ từ
            nơi khác có thể mang theo, và Row tự ẩn khi không có giá trị. */}
        <Row label={t('txd.location')}>{tx.location}</Row>
        <Row label={t('txd.counterparty')}>{tx.counterparty}</Row>

        {tx.status === 'pending' && <Row label={t('common.status')}>{t('txd.status_pending')}</Row>}

        {/* Hóa đơn không dùng bố cục nhãn-bên-trái như các dòng trên: ảnh cần cả
            bề ngang. Nhét vào cột giá trị thì trên điện thoại nó chỉ còn hơn nửa
            màn hình mà vẫn cao như cũ, chữ trên hóa đơn nhỏ tới mức không đọc nổi. */}
        <div style={{ paddingTop: 10, borderTop: '1px solid var(--surface-border)' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>{t('tx.col_receipt')}</div>
          {tx.receiptUrl ? (
            /* Ảnh thu nhỏ chứ không phải ảnh đầy đủ: hóa đơn chụp bằng điện thoại
               rất cao, để nguyên thì cụm nút Sửa/Xóa bị đẩy khỏi màn hình và người
               dùng phải cuộn mới thấy. Bấm vào ảnh mở trình xem toàn màn hình của
               antd (phóng to, xoay) — chỗ để đọc kỹ hóa đơn là ở đó. */
            <Image
              src={tx.receiptUrl}
              alt={t('tx.col_receipt')}
              width="100%"
              height={160}
              rootClassName="tx-receipt-thumb"
              style={{
                objectFit: 'cover',
                objectPosition: 'center top',
                borderRadius: 12,
                border: '1px solid var(--surface-border)',
                background: 'var(--surface-subtle)',
                cursor: 'zoom-in',
              }}
            />
          ) : (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)' }}>
              <ImageOff size={14} /> {t('txd.no_receipt')}
            </span>
          )}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8,
          marginTop: 20,
          paddingTop: 16,
          borderTop: '1px solid var(--surface-border)',
        }}
      >
        <Popconfirm
          title={t('tx.delete_title')}
          description={t('tx.delete_desc')}
          onConfirm={() => {
            onDelete(tx.id);
            onClose();
          }}
          okText={t('common.delete')}
          cancelText={t('common.cancel')}
          okButtonProps={{ danger: true }}
        >
          <Button danger icon={<Trash2 size={15} />}>{t('common.delete')}</Button>
        </Popconfirm>

        <div style={{ display: 'flex', gap: 8 }}>
          <Button onClick={onClose}>{t('txd.close')}</Button>
          <Button
            type="primary"
            icon={<Pencil size={15} />}
            onClick={() => {
              onClose();
              onEdit(tx);
            }}
          >
            {t('txd.edit')}
          </Button>
        </div>
      </div>
    </>
  );
};
