import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, Empty, Input, Skeleton, Space, Spin, Tag, Tooltip } from 'antd';
import { Sparkles, Send, BrainCircuit, TrendingUp, Lightbulb, Bot, RefreshCw, ShieldCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { AppState } from '~/types';
import { t } from '~/i18n';
import type { TranslationKey } from '~/i18n';
import {
  askAdvisor,
  cachedInsights,
  fetchInsightCards,
  hasEnoughData,
  insightsKey,
  isAIAvailable,
} from '~/lib/ai';
import type { AIErrorCode, ChatTurn, InsightCard } from '~/lib/ai';

interface AIInsightsProps {
  state: AppState;
}

/** Biểu tượng và màu gắn cứng theo vai trò của thẻ; chỉ chữ là do AI viết. */
const CARD_SLOTS: Array<{ id: InsightCard['id']; Icon: LucideIcon; color: string; labelKey: TranslationKey }> = [
  { id: 'spending', Icon: TrendingUp, color: '#EF4444', labelKey: 'ai.card_spending' },
  { id: 'saving', Icon: Lightbulb, color: '#F59E0B', labelKey: 'ai.card_saving' },
  { id: 'forecast', Icon: Sparkles, color: '#22C55E', labelKey: 'ai.card_forecast' },
];

/**
 * Thông điệp gốc từ Gemini. Cố tình để nguyên tiếng Anh và kiểu chữ đơn cách: đây
 * là chuỗi để tra cứu và dán vào ô tìm kiếm, không phải câu nói với người dùng.
 */
const DetailText: React.FC<{ detail: string }> = ({ detail }) => (
  <code style={{ fontSize: 11, wordBreak: 'break-word', color: 'var(--text-muted)' }}>{detail}</code>
);

const ERROR_KEYS: Record<AIErrorCode, TranslationKey> = {
  not_configured: 'ai.err_not_configured',
  unauthorized: 'ai.err_unauthorized',
  rate_limited: 'ai.err_rate_limited',
  blocked: 'ai.err_blocked',
  upstream_error: 'ai.err_upstream',
  bad_request: 'ai.err_upstream',
  network: 'ai.err_network',
};

export const AIInsights: React.FC<AIInsightsProps> = ({ state }) => {
  const dataReady = hasEnoughData(state);

  /**
   * Vân tay của toàn bộ số liệu sẽ gửi đi. So sánh bằng chuỗi nên state đổi danh
   * tính mà nội dung không đổi (đồng bộ tỷ giá, đánh dấu đã đọc thông báo...) sẽ
   * không bị coi là số liệu mới.
   */
  const fingerprint = useMemo(() => insightsKey(state), [state]);

  /** Mã lỗi để dịch ra câu tiếng người, kèm thông điệp gốc để còn lần ra nguyên nhân. */
  type Failure = { code: AIErrorCode; detail?: string };

  const [cards, setCards] = useState<InsightCard[] | null>(null);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [cardsError, setCardsError] = useState<Failure | null>(null);
  /* Thẻ đang hiện được sinh từ số liệu cũ hơn số liệu hiện tại.
     Bỏ trống chỗ đọc vì thông báo "số liệu đã cũ" đã được gỡ khỏi giao diện; state
     và hai lần setStale bên dưới giữ nguyên để bật lại chỉ cần lấy lại biến này. */
  const [, setStale] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  const [query, setQuery] = useState('');
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState<Failure | null>(null);
  // Khởi tạo lười: lời chào chỉ dựng một lần lúc gắn component. Đây là tin nhắn
  // trong lịch sử hội thoại, không phải nhãn giao diện — dịch lại nó mỗi lần
  // render sẽ viết lại quá khứ của cuộc trò chuyện.
  const [messages, setMessages] = useState<ChatTurn[]>(() => [
    {
      sender: 'ai',
      text: t('ai.greeting', {
        name: state.settings.fullName || t('auth.default_user_name'),
      }),
    },
  ]);

  const aliveRef = useRef(true);
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  /* ---------------------------------------------------------------------- */
  /* Ba thẻ tóm tắt                                                          */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    if (!isAIAvailable) {
      setCardsError({ code: 'not_configured' });
      return;
    }
    if (!dataReady) return;

    const hit = cachedInsights(fingerprint);

    if (hit && reloadToken === 0) {
      // Có kết quả cũ thì hiện luôn, KỂ CẢ khi số liệu đã đổi. Tự động gọi lại
      // mỗi lần người dùng thêm một giao dịch sẽ ngốn hết hạn mức free tier
      // trong vài thao tác; thẻ cũ kèm nhãn "đã cũ" hữu ích hơn hẳn một lỗi
      // hết hạn mức. Bấm "Phân tích lại" mới thực sự gọi.
      setCards(hit.cards);
      setStale(hit.stale);
      setCardsError(null);
      return;
    }

    // Một lượt gọi chỉ được phép ghi kết quả nếu nó vẫn là lượt mới nhất: đổi số
    // liệu giữa chừng mà phản hồi cũ về sau sẽ đè lên phản hồi mới.
    let current = true;
    setCardsLoading(true);
    setCardsError(null);

    fetchInsightCards(state).then((result) => {
      if (!current || !aliveRef.current) return;
      setCardsLoading(false);

      if (result.ok) {
        setCards(result.data);
        setStale(false);
      } else {
        setCardsError({ code: result.code, detail: result.detail });
      }
    });

    return () => {
      current = false;
    };
    // `state` bị cố tình bỏ khỏi danh sách: fingerprint đã đại diện cho phần nội
    // dung của nó, thêm vào chỉ khiến effect chạy lại vì đổi danh tính đối tượng.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fingerprint, dataReady, reloadToken]);

  /* ---------------------------------------------------------------------- */
  /* Hội thoại                                                               */
  /* ---------------------------------------------------------------------- */

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const box = scrollRef.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [messages, sending]);

  const handleSend = async () => {
    const question = query.trim();
    if (!question || sending) return;

    // Lời chào là văn bản tĩnh của app, không phải lượt nói của mô hình — gửi kèm
    // chỉ tổ dạy nó bắt chước một câu chào bịa số liệu.
    const history = messages.slice(1);

    setMessages((prev) => [...prev, { sender: 'user', text: question }]);
    setQuery('');
    setSending(true);
    setChatError(null);

    const result = await askAdvisor(state, question, history);
    if (!aliveRef.current) return;

    setSending(false);
    if (result.ok) {
      setMessages((prev) => [...prev, { sender: 'ai', text: result.data }]);
    } else {
      setChatError({ code: result.code, detail: result.detail });
    }
  };

  /* ---------------------------------------------------------------------- */
  /* Giao diện                                                               */
  /* ---------------------------------------------------------------------- */

  const renderCardBody = (slotIndex: number) => {
    const slot = CARD_SLOTS[slotIndex];
    const card = cards?.find((item) => item.id === slot.id);

    if (cardsLoading || (!card && !cardsError)) {
      return <Skeleton active paragraph={{ rows: 2 }} title={false} />;
    }
    if (!card) {
      return <span style={{ color: 'var(--text-muted)' }}>—</span>;
    }
    return card.body;
  };

  const insightsSection = () => {
    if (!dataReady) {
      return (
        <div className="glass-card" style={{ padding: 32 }}>
          <Empty description={<><div style={{ fontWeight: 600 }}>{t('ai.empty_title')}</div><div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t('ai.empty_body')}</div></>} />
        </div>
      );
    }

    return (
      <>
        {cardsError && (
          <Alert
            type={cardsError.code === 'not_configured' ? 'info' : 'warning'}
            showIcon
            title={t(ERROR_KEYS[cardsError.code])}
            description={cardsError.detail ? <DetailText detail={cardsError.detail} /> : undefined}
            action={
              isAIAvailable ? (
                <Button size="small" onClick={() => setReloadToken((n) => n + 1)}>
                  {t('ai.retry')}
                </Button>
              ) : null
            }
          />
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {CARD_SLOTS.map((slot, index) => {
            const card = cards?.find((item) => item.id === slot.id);
            return (
              <div key={slot.id} className="glass-card" style={{ padding: 22, borderLeft: `4px solid ${slot.color}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <slot.Icon size={20} color={slot.color} />
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{card?.title || t(slot.labelKey)}</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  {renderCardBody(index)}
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #7C3AED, #2563EB)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <BrainCircuit size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>AI Financial Insights &amp; Advisor</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('ai.subtitle')}</div>
          </div>
        </div>

        <Space size={8}>
          <Tooltip title={t('ai.privacy_note')}>
            <Tag icon={<ShieldCheck size={12} style={{ marginRight: 4, verticalAlign: -2 }} />} color="purple" style={{ padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>
              Gemini
            </Tag>
          </Tooltip>
          <Button
            size="small"
            icon={<RefreshCw size={14} />}
            loading={cardsLoading}
            disabled={!isAIAvailable || !dataReady}
            onClick={() => setReloadToken((n) => n + 1)}
          >
            {t('ai.refresh')}
          </Button>
        </Space>
      </div>

      {insightsSection()}

      {/* Hội thoại */}
      <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', height: 440 }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bot size={20} color="#7C3AED" />
          <span>{t('ai.chat_title')}</span>
        </div>

        <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {messages.map((message, idx) => (
            <div
              key={idx}
              style={{
                alignSelf: message.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
                padding: '12px 16px',
                borderRadius: 16,
                // Bong bóng của AI đi theo biến bề mặt của app: đặt màu sáng cứng ở
                // đây thì ở chế độ tối nó thành mảng trắng chói giữa nền xanh đậm.
                background: message.sender === 'user' ? 'linear-gradient(135deg, #2563EB, #7C3AED)' : 'var(--surface-subtle)',
                color: message.sender === 'user' ? '#ffffff' : 'var(--text-body)',
                border: message.sender === 'user' ? 'none' : '1px solid var(--surface-border)',
                fontSize: 14,
                lineHeight: 1.55,
                whiteSpace: 'pre-wrap',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              }}
            >
              {message.text}
            </div>
          ))}
          {sending && <Spin size="small" style={{ alignSelf: 'flex-start' }} />}
          {chatError && (
            <Alert
              type="warning"
              showIcon
              style={{ alignSelf: 'stretch' }}
              title={t(ERROR_KEYS[chatError.code])}
              description={chatError.detail ? <DetailText detail={chatError.detail} /> : undefined}
            />
          )}
        </div>

        <Space.Compact style={{ width: '100%' }}>
          <Input
            placeholder={t('ai.input_placeholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onPressEnter={handleSend}
            disabled={sending || !isAIAvailable}
            maxLength={500}
          />
          <Button
            type="primary"
            icon={<Send size={18} />}
            onClick={handleSend}
            loading={sending}
            disabled={!isAIAvailable || !query.trim()}
            style={{ marginLeft: 8 }}
          >
            {t('ai.send')}
          </Button>
        </Space.Compact>

        <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
          {t('ai.disclaimer')}
        </div>
      </div>
    </div>
  );
};
