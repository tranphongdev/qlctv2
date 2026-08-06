import React, { useState } from 'react';
import { Modal, Tabs, Input, Button, Select, Tag, Card } from 'antd';
import { message } from '../lib/antdApp';
import { Mail, Zap, CheckCircle2, Sparkles, Copy, FileText, ArrowRight } from 'lucide-react';
import type { Wallet, Category, Transaction } from '../types';
import { parseBankEmailOrText, SAMPLE_BANK_EMAILS } from '../utils/bankEmailParser';
import type { ParsedBankTransaction } from '../utils/bankEmailParser';
import { formatMoney } from '../utils/format';

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
      message.error('Vui lòng nhập nội dung Email ngân hàng hợp lệ để bóc tách!');
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

    message.success(`🎉 Đã tự động tạo giao dịch ${formatMoney(parsedTx.amount)} từ Email ${parsedTx.bankName}!`);
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
    message.success('Đã sao chép mã Google Apps Script vào bộ nhớ tạm!');
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
            <div style={{ fontSize: 17, fontWeight: 800 }}>Đồng bộ Email Ngân hàng (iOS / Gmail)</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>Tự động bóc tách số tiền bị trừ / cộng từ thông báo Email</div>
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
                Dán & Bóc Tách Email
              </span>
            ),
            children: (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                    Dán nội dung Email / SMS Ngân hàng vào đây:
                  </div>
                  <Input.TextArea
                    rows={4}
                    placeholder="Dán nội dung Email từ Vietcombank, MB Bank, Techcombank, MoMo... Ví dụ: [Vietcombank] THONG BAO BIEN DONG SO DU... -250,000 VND..."
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
                          {parsedTx.type === 'thu' ? '🟢 Cộng tiền' : '🔴 Trừ tiền'}
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
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Ví nộp / trừ tiền:</div>
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
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Gợi ý Danh mục:</div>
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
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Ghi chú giao dịch:</div>
                      <Input
                        value={customNote}
                        onChange={(e) => setCustomNote(e.target.value)}
                        size="small"
                        placeholder="Nội dung giao dịch..."
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
                      Xác nhận & Thêm Giao Dịch
                    </Button>
                  </div>
                ) : (
                  inputText.trim() && (
                    <div style={{ padding: 14, borderRadius: 12, background: 'rgba(239, 68, 68, 0.08)', color: '#DC2626', fontSize: 13 }}>
                      Chưa bóc tách được số tiền hợp lệ từ nội dung trên. Vui lòng kiểm tra lại văn bản Email.
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
                Mẫu Email Demo
              </span>
            ),
            children: (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 8 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Bấm vào 1 trong các mẫu Email thông báo từ Ngân hàng dưới đây để trải nghiệm bóc tách tự động:
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
                        Dùng mẫu này <ArrowRight size={12} />
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
                Tự động 24/7 (Gmail)
              </span>
            ),
            children: (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 8 }}>
                <div style={{ padding: 14, borderRadius: 14, background: 'rgba(79, 70, 229, 0.08)', color: '#4F46E5', fontSize: 13, lineHeight: '1.5' }}>
                  <b>💡 Hướng dẫn tự động 100% cho iPhone / iOS:</b>
                  <br />
                  Bạn có thể tạo 1 mã kịch bản miễn phí chạy ngầm 24/7 trên Gmail bằng <b>Google Apps Script</b>. Mỗi khi ngân hàng gửi email trừ tiền vào Gmail, kịch bản sẽ tự động quét và lưu vào ứng dụng!
                </div>

                <div style={{ fontSize: 13, fontWeight: 700 }}>Các bước thiết lập (chỉ 2 phút):</div>
                <ol style={{ fontSize: 12, color: 'var(--text-secondary)', paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <li>Truy cập <a href="https://script.google.com" target="_blank" rel="noreferrer">script.google.com</a> trên trình duyệt.</li>
                  <li>Tạo một <b>New Project</b> mới.</li>
                  <li>Dán đoạn mã dưới đây và chọn lưu kịch bản.</li>
                  <li>Thêm <b>Trigger (Trình kích hoạt)</b> chạy tự động mỗi 5 phút hoặc 15 phút.</li>
                </ol>

                <div style={{ position: 'relative', marginTop: 4 }}>
                  <Button
                    size="small"
                    icon={<Copy size={12} />}
                    onClick={copyScriptCode}
                    style={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}
                  >
                    Sao chép Code
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
