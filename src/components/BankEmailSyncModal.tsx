import React, { useState } from 'react';
import { Modal, Tabs, Input, Button, Select, Tag, Card } from 'antd';
import { message } from '../lib/antdApp';
import { Mail, Zap, CheckCircle2, Sparkles, Copy, FileText, ArrowRight } from 'lucide-react';
import type { Wallet, Category, Transaction } from '../types';
import { parseBankEmailOrText, SAMPLE_BANK_EMAILS } from '../utils/bankEmailParser';
import type { ParsedBankTransaction } from '../utils/bankEmailParser';
import { formatMoney } from '../utils/format';
import { t } from '../i18n';

interface BankEmailSyncModalProps {
  open: boolean;
  onClose: () => void;
  onSaveTransaction: (tx: Omit<Transaction, 'id'>) => void;
  wallets: Wallet[];
  categories: Category[];
}

export const BankEmailSyncModal: React.FC<BankEmailSyncModalProps> = ({
  open,
  onClose,
  onSaveTransaction,
  wallets,
  categories,
}) => {
  const [inputText, setInputText] = useState('');
  const [parsedTx, setParsedTx] = useState<ParsedBankTransaction | null>(null);

  // Form overrides
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [customNote, setCustomNote] = useState<string>('');

  const handleParseText = (text: string) => {
    setInputText(text);
    if (!text.trim()) {
      setParsedTx(null);
      return;
    }
    const result = parseBankEmailOrText(text);
    setParsedTx(result);

    // Auto select wallet if exists
    const matchedWallet = wallets.find(
      (w) => w.id === result.suggestedWalletId || w.bankName?.toLowerCase().includes(result.bankName.toLowerCase())
    );
    setSelectedWalletId(matchedWallet ? matchedWallet.id : wallets[0]?.id || 'w_cash');
    setSelectedCategoryId(result.suggestedCategory);
    setCustomNote(result.note);
  };

  const handleConfirmSave = () => {
    if (!parsedTx || parsedTx.amount <= 0) {
      message.error(t('bank.parse_error'));
      return;
    }

    onSaveTransaction({
      type: parsedTx.type,
      amount: parsedTx.amount,
      category: selectedCategoryId || parsedTx.suggestedCategory,
      walletId: selectedWalletId || wallets[0]?.id || 'w_cash',
      date: parsedTx.date,
      time: parsedTx.time,
      note: customNote || parsedTx.note,
      tags: ['EmailBankSync', parsedTx.bankName],
    });

    message.success(t('bank.tx_created', { amount: formatMoney(parsedTx.amount), bank: parsedTx.bankName }));
    setInputText('');
    setParsedTx(null);
    onClose();
  };

  const googleAppsScriptCode = `function syncBankEmailsToApp() {
  var threads = GmailApp.search('from:(vietcombank OR mbbank OR techcombank OR vpbank OR acb OR bidv OR momo) is:unread', 0, 5);
  for (var i = 0; i < threads.length; i++) {
    var messages = threads[i].getMessages();
    for (var j = 0; j < messages.length; j++) {
      var body = messages[j].getPlainBody();
      Logger.log("Email nhan duoc: " + body);
      // Gửi webhook tới Web App
      messages[j].markRead();
    }
  }
}`;

  const copyScriptCode = () => {
    navigator.clipboard.writeText(googleAppsScriptCode);
    message.success(t('bank.script_copied'));
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Mail size={18} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800 }}>{t('bank.sync_title')}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>{t('bank.sync_subtitle')}</div>
          </div>
        </div>
      }
      footer={null}
      width={Math.min(580, typeof window !== 'undefined' ? window.innerWidth : 580)}
      destroyOnHidden
    >
      <Tabs
        defaultActiveKey="1"
        items={[
          {
            key: '1',
            label: (
              <span>
                <Zap size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                {t('bank.tab_paste')}
              </span>
            ),
            children: (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                    {t('bank.paste_label')}
                  </div>
                  <Input.TextArea
                    rows={4}
                    placeholder={t('bank.paste_placeholder')}
                    value={inputText}
                    onChange={(e) => handleParseText(e.target.value)}
                    style={{ borderRadius: 12 }}
                  />
                </div>

                {/* Parsed Result Preview Card */}
                {parsedTx && parsedTx.amount > 0 ? (
                  <div
                    style={{
                      padding: 16,
                      borderRadius: 16,
                      background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.06), rgba(124, 58, 237, 0.06))',
                      border: '1px solid rgba(79, 70, 229, 0.2)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Tag color="blue" icon={<CheckCircle2 size={12} />}>
                          {parsedTx.bankName}
                        </Tag>
                        <Tag color={parsedTx.type === 'thu' ? 'green' : 'red'}>
                          {parsedTx.type === 'thu' ? t('bank.credit') : t('bank.debit')}
                        </Tag>
                      </div>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>
                        {parsedTx.date} {parsedTx.time}
                      </span>
                    </div>

                    <div style={{ fontSize: 24, fontWeight: 800, color: parsedTx.type === 'thu' ? '#16A34A' : '#DC2626', marginBottom: 12 }}>
                      {parsedTx.type === 'thu' ? '+' : '-'}{formatMoney(parsedTx.amount)}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{t('bank.wallet_label')}</div>
                        <Select
                          value={selectedWalletId}
                          onChange={setSelectedWalletId}
                          style={{ width: '100%' }}
                          size="small"
                          options={wallets.map((w) => ({
                            value: w.id,
                            label: `${w.name} (${w.bankName || w.type})`,
                          }))}
                        />
                      </div>

                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{t('bank.category_hint')}</div>
                        <Select
                          value={selectedCategoryId}
                          onChange={setSelectedCategoryId}
                          style={{ width: '100%' }}
                          size="small"
                          options={categories.map((c) => ({
                            value: c.id,
                            label: (
                              <span>
                                <span style={{ color: c.color }}>● </span>
                                {c.name}
                              </span>
                            ),
                          }))}
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{t('bank.note_label')}</div>
                      <Input
                        value={customNote}
                        onChange={(e) => setCustomNote(e.target.value)}
                        size="small"
                        placeholder={t('bank.note_placeholder')}
                      />
                    </div>

                    <Button
                      type="primary"
                      icon={<CheckCircle2 size={16} />}
                      block
                      size="large"
                      onClick={handleConfirmSave}
                      style={{ borderRadius: 12, height: 44, fontWeight: 700 }}
                    >
                      {t('bank.confirm_add')}
                    </Button>
                  </div>
                ) : (
                  inputText.trim() && (
                    <div style={{ padding: 14, borderRadius: 12, background: 'rgba(239, 68, 68, 0.08)', color: '#DC2626', fontSize: 13 }}>
                      {t('bank.parse_failed')}
                    </div>
                  )
                )}
              </div>
            ),
          },
          {
            key: '2',
            label: (
              <span>
                <FileText size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                {t('bank.tab_samples')}
              </span>
            ),
            children: (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 8 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {t('bank.samples_hint')}
                </div>

                {SAMPLE_BANK_EMAILS.map((sample, idx) => (
                  <Card
                    key={idx}
                    size="small"
                    hoverable
                    onClick={() => handleParseText(sample.rawText)}
                    style={{ borderRadius: 14, cursor: 'pointer', border: '1px solid #e2e8f0' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 13 }}>{sample.title}</span>
                      <Tag color="purple" style={{ margin: 0, fontSize: 10 }}>{sample.bank}</Tag>
                    </div>
                    <pre style={{ fontSize: 11, color: 'var(--text-muted)', background: 'rgba(148, 163, 184, 0.12)', padding: 8, borderRadius: 8, margin: 0, whiteSpace: 'pre-wrap' }}>
                      {sample.rawText}
                    </pre>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                      <span style={{ fontSize: 12, color: '#4F46E5', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                        {t('bank.use_sample')} <ArrowRight size={12} />
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            ),
          },
          {
            key: '3',
            label: (
              <span>
                <Sparkles size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                {t('bank.tab_auto')}
              </span>
            ),
            children: (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 8 }}>
                <div style={{ padding: 14, borderRadius: 14, background: 'rgba(79, 70, 229, 0.08)', color: '#4F46E5', fontSize: 13, lineHeight: '1.5' }}>
                  <b>{t('bank.auto_title')}</b>
                  <br />
                  {t('bank.auto_desc_1')} <b>Google Apps Script</b>{t('bank.auto_desc_2')}
                </div>

                <div style={{ fontSize: 13, fontWeight: 700 }}>{t('bank.steps_title')}</div>
                <ol style={{ fontSize: 12, color: 'var(--text-secondary)', paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <li>{t('bank.step_1_prefix')} <a href="https://script.google.com" target="_blank" rel="noreferrer">script.google.com</a> {t('bank.step_1_suffix')}</li>
                  <li>{t('bank.step_2_prefix')} <b>New Project</b>{t('bank.step_2_suffix')}</li>
                  <li>{t('bank.step_3')}</li>
                  <li>{t('bank.step_4_prefix')} <b>{t('bank.trigger_name')}</b> {t('bank.step_4_suffix')}</li>
                </ol>

                <div style={{ position: 'relative', marginTop: 4 }}>
                  <Button
                    size="small"
                    icon={<Copy size={12} />}
                    onClick={copyScriptCode}
                    style={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}
                  >
                    {t('bank.copy_code')}
                  </Button>
                  <pre style={{ background: '#0f172a', color: '#38bdf8', padding: 12, borderRadius: 12, fontSize: 11, overflowX: 'auto', margin: 0 }}>
                    {googleAppsScriptCode}
                  </pre>
                </div>
              </div>
            ),
          },
        ]}
      />
    </Modal>
  );
};
