import React, { useState } from 'react';
import { Modal, Input, Button, Tag, Space, Select } from 'antd';
import { message } from '../lib/antdApp';
import { Mail, Sparkles, CheckCircle, Copy } from 'lucide-react';
import { parseBankEmailOrText, SAMPLE_BANK_EMAILS } from '../utils/bankEmailParser';
import type { ParsedBankTransaction } from '../utils/bankEmailParser';
import type { Category, Wallet, Transaction } from '../types';
import { formatMoney } from '../utils/format';

interface BankEmailParserModalProps {
  open: boolean;
  onClose: () => void;
  wallets: Wallet[];
  categories: Category[];
  onConfirmAddTx: (tx: Omit<Transaction, 'id'>) => void;
}

export const BankEmailParserModal: React.FC<BankEmailParserModalProps> = ({
  open,
  onClose,
  wallets,
  categories,
  onConfirmAddTx,
}) => {
  const [inputText, setInputText] = useState('');
  const [parsedResult, setParsedResult] = useState<ParsedBankTransaction | null>(null);
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  const handleParse = (text: string) => {
    setInputText(text);
    if (!text.trim()) {
      setParsedResult(null);
      return;
    }
    const result = parseBankEmailOrText(text);
    setParsedResult(result);

    const matchedW = wallets.find((w) => w.id === result.suggestedWalletId) || wallets[0];
    setSelectedWalletId(matchedW?.id || wallets[0]?.id || '');

    const matchedC = categories.find((c) => c.id === result.suggestedCategory) || categories[0];
    setSelectedCategoryId(matchedC?.id || categories[0]?.id || '');
  };

  const handleSampleClick = (sampleText: string) => {
    handleParse(sampleText);
  };

  const handleConfirm = () => {
    if (!parsedResult || parsedResult.amount <= 0) {
      message.error('Vui lòng kiểm tra lại số tiền giao dịch!');
      return;
    }

    const txData: Omit<Transaction, 'id'> = {
      type: parsedResult.type,
      amount: parsedResult.amount,
      category: selectedCategoryId,
      walletId: selectedWalletId,
      date: parsedResult.date,
      time: parsedResult.time,
      note: parsedResult.note,
      status: 'completed',
      tags: [parsedResult.bankName, 'Bóc tách Email'],
    };

    onConfirmAddTx(txData);
    message.success(`Đã tự động ghi nhận giao dịch ${formatMoney(parsedResult.amount)} từ ${parsedResult.bankName}!`);
    onClose();
    setInputText('');
    setParsedResult(null);
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}
          >
            <Mail size={20} />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Tự Động Bóc Tách Email / SMS Ngân Hàng</div>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 400 }}>
              Dán nội dung Email biến động số dư để AI tự động trích xuất số tiền, ngày giờ và danh mục
            </div>
          </div>
        </div>
      }
      footer={null}
      width={640}
      destroyOnHidden
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
        {/* Sample Templates Quick Select */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>
            Thử mẫu Email biến động số dư ngân hàng:
          </div>
          <Space wrap>
            {SAMPLE_BANK_EMAILS.map((sample, i) => (
              <Button
                key={i}
                size="small"
                icon={<Copy size={12} />}
                onClick={() => handleSampleClick(sample.rawText)}
                style={{ borderRadius: 99, fontSize: 12 }}
              >
                {sample.bank}
              </Button>
            ))}
          </Space>
        </div>

        {/* Input Text Area */}
        <Input.TextArea
          rows={5}
          placeholder="Dán toàn bộ nội dung Email hoặc SMS biến động số dư vào đây (Ví dụ: [Vietcombank] GD -450,000 VND lúc 05/08/2026 Shopee...)"
          value={inputText}
          onChange={(e) => handleParse(e.target.value)}
          style={{ borderRadius: 14, fontSize: 13, fontFamily: 'monospace' }}
        />

        {/* Parsed Result Section */}
        {parsedResult && (
          <div
            style={{
              padding: 20,
              borderRadius: 16,
              background: 'rgba(79, 70, 229, 0.04)',
              border: '1px solid rgba(79, 70, 229, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={18} color="#7C3AED" />
                <span style={{ fontWeight: 700, fontSize: 15 }}>Kết quả Bóc tách Tự động</span>
              </div>
              <Tag color={parsedResult.type === 'thu' ? 'green' : 'red'} style={{ fontSize: 12, padding: '2px 10px' }}>
                {parsedResult.type === 'thu' ? '🟢 Thu Nhập' : '🔴 Chi Tiêu'}
              </Tag>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <div style={{ fontSize: 12, color: '#64748b' }}>Số tiền bóc tách:</div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: parsedResult.type === 'thu' ? '#16A34A' : '#DC2626',
                  }}
                >
                  {parsedResult.type === 'thu' ? '+' : '-'}{formatMoney(parsedResult.amount)}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, color: '#64748b' }}>Ngân hàng nhận dạng:</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>{parsedResult.bankName}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Chọn Ví ghi nhận:</div>
                <Select
                  value={selectedWalletId}
                  onChange={setSelectedWalletId}
                  style={{ width: '100%' }}
                  options={wallets.map((w) => ({
                    value: w.id,
                    label: `${w.name} (${w.bankName || w.type})`,
                  }))}
                />
              </div>

              <div>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Gợi ý Danh mục:</div>
                <Select
                  value={selectedCategoryId}
                  onChange={setSelectedCategoryId}
                  style={{ width: '100%' }}
                  options={categories.map((c) => ({
                    value: c.id,
                    label: (
                      <span>
                        <span style={{ color: c.color, marginRight: 6 }}>●</span>
                        {c.name}
                      </span>
                    ),
                  }))}
                />
              </div>
            </div>

            <div style={{ fontSize: 13, color: '#475569', background: '#ffffff', padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <div><b>Ghi chú:</b> {parsedResult.note}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                Thời gian: {parsedResult.date} {parsedResult.time} {parsedResult.accountNumber ? `| TK: ${parsedResult.accountNumber}` : ''}
              </div>
            </div>

            <Button
              type="primary"
              size="large"
              icon={<CheckCircle size={18} />}
              onClick={handleConfirm}
              block
              style={{ borderRadius: 12, height: 44, marginTop: 4 }}
            >
              Ghi Nhận Giao Dịch Này
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};
