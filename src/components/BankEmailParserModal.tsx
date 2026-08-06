import React, { useState } from 'react';
import { Modal, Input, Button, Tag, Space, Select } from 'antd';
import { message } from '../lib/antdApp';
import { Mail, Sparkles, CheckCircle, Copy } from 'lucide-react';
import { parseBankEmailOrText, normalizeVn, SAMPLE_BANK_EMAILS } from '../utils/bankEmailParser';
import type { ParsedBankTransaction } from '../utils/bankEmailParser';
import type { Category, Wallet, Transaction } from '../types';
import { formatMoney } from '../utils/format';
import { t } from '../i18n';

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

    // Ví người dùng tự tạo nên ưu tiên khớp theo tên ngân hàng, id gợi ý chỉ là dự phòng.
    const flatBank = normalizeVn(result.bankName);
    const matchedW =
      (flatBank !== 'ngan hang' &&
        wallets.find((w) => normalizeVn(`${w.bankName || ''} ${w.name}`).includes(flatBank))) ||
      wallets.find((w) => w.id === result.suggestedWalletId) ||
      wallets[0];
    setSelectedWalletId(matchedW?.id || wallets[0]?.id || '');

    const matchedC = categories.find((c) => c.id === result.suggestedCategory) || categories[0];
    setSelectedCategoryId(matchedC?.id || categories[0]?.id || '');
  };

  const handleSampleClick = (sampleText: string) => {
    handleParse(sampleText);
  };

  const handleConfirm = () => {
    if (!parsedResult || parsedResult.amount <= 0) {
      message.error(t('parser.amount_error'));
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
      tags: [parsedResult.bankName, t('parser.tag')],
    };

    onConfirmAddTx(txData);
    message.success(t('parser.tx_recorded', { amount: formatMoney(parsedResult.amount), bank: parsedResult.bankName }));
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
            <div style={{ fontSize: 18, fontWeight: 700 }}>{t('parser.title')}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>
              {t('parser.subtitle')}
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
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
            {t('parser.samples_hint')}
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
          placeholder={t('parser.placeholder')}
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
                <span style={{ fontWeight: 700, fontSize: 15 }}>{t('parser.result_title')}</span>
              </div>
              <Tag color={parsedResult.type === 'thu' ? 'green' : 'red'} style={{ fontSize: 12, padding: '2px 10px' }}>
                {parsedResult.type === 'thu' ? t('parser.type_income') : t('parser.type_expense')}
              </Tag>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('parser.amount_label')}</div>
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
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('parser.bank_label')}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-heading)' }}>{parsedResult.bankName}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{t('parser.wallet_label')}</div>
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
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{t('parser.category_hint')}</div>
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

            <div style={{ fontSize: 13, color: 'var(--text-secondary)', background: 'rgba(148, 163, 184, 0.12)', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(148, 163, 184, 0.25)' }}>
              <div><b>{t('parser.note_label')}</b> {parsedResult.note}</div>
              {parsedResult.counterparty && (
                <div style={{ marginTop: 2 }}>
                  <b>{parsedResult.type === 'thu' ? t('parser.sender') : t('parser.recipient')}</b> {parsedResult.counterparty}
                </div>
              )}
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                {t('parser.time_label')} {parsedResult.date} {parsedResult.time} {parsedResult.accountNumber ? `| ${t('parser.account_label')} ${parsedResult.accountNumber}` : ''}
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
              {t('parser.submit')}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};
