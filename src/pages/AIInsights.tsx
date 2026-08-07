import React, { useState } from 'react';
import { Button, Input, Tag, Space, Spin } from 'antd';
import { Sparkles, Send, BrainCircuit, TrendingUp, Lightbulb, Bot } from 'lucide-react';
import type { AppState } from '~/types';
import { t } from '~/i18n';

interface AIInsightsProps {
  state: AppState;
}

export const AIInsights: React.FC<AIInsightsProps> = ({ state }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  // Khởi tạo lười: lời chào chỉ dựng một lần lúc gắn component. Đây là tin nhắn
  // trong lịch sử hội thoại, không phải nhãn giao diện — dịch lại nó mỗi lần
  // render sẽ viết lại quá khứ của cuộc trò chuyện.
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>(() => [
    {
      sender: 'ai',
      text: t('ai.greeting', {
        name: state.settings.fullName || t('auth.default_user_name'),
      }),
    },
  ]);

  const handleSend = () => {
    if (!query.trim()) return;
    const userText = query;
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setQuery('');
    setLoading(true);

    setTimeout(() => {
      // Từ khoá nhận diện cũng nằm trong từ điển: người dùng giao diện tiếng Anh sẽ
      // gõ "food"/"savings" chứ không phải "ăn"/"tiết kiệm".
      const asked = userText.toLowerCase();
      let reply = t('ai.reply_default');
      if (asked.includes(t('ai.keyword_cafe')) || asked.includes(t('ai.keyword_food'))) {
        reply = t('ai.reply_food');
      } else if (asked.includes(t('ai.keyword_savings'))) {
        reply = t('ai.reply_savings');
      }
      setMessages((prev) => [...prev, { sender: 'ai', text: reply }]);
      setLoading(false);
    }, 800);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #7C3AED, #4F46E5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <BrainCircuit size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>AI Financial Insights & Advisor</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('ai.subtitle')}</div>
          </div>
        </div>
        <Tag color="purple" style={{ padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>Gemini Financial v3.6</Tag>
      </div>

      {/* AI Smart Insight Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        {/* Card 1 */}
        <div className="glass-card" style={{ padding: 22, borderLeft: '4px solid #EF4444' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <TrendingUp size={20} color="#EF4444" />
            <span style={{ fontWeight: 700, fontSize: 15 }}>{t('ai.top_category_title')}</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            {t('ai.top_category_prefix')} <b>{t('ai.top_category_item_1')}</b> {t('ai.top_category_conjunction')} <b>{t('ai.top_category_item_2')}</b> {t('ai.top_category_suffix')}
          </div>
        </div>

        {/* Card 2 */}
        <div className="glass-card" style={{ padding: 22, borderLeft: '4px solid #F59E0B' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <Lightbulb size={20} color="#F59E0B" />
            <span style={{ fontWeight: 700, fontSize: 15 }}>{t('ai.savings_tip_title')}</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            {t('ai.savings_tip_body')}
          </div>
        </div>

        {/* Card 3 */}
        <div className="glass-card" style={{ padding: 22, borderLeft: '4px solid #22C55E' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <Sparkles size={20} color="#22C55E" />
            <span style={{ fontWeight: 700, fontSize: 15 }}>{t('ai.forecast_title')}</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            {t('ai.forecast_prefix')} <b>{t('ai.forecast_amount')}</b> {t('ai.forecast_suffix')}
          </div>
        </div>
      </div>

      {/* Interactive AI Chatbot Section */}
      <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', height: 440 }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bot size={20} color="#7C3AED" />
          <span>{t('ai.chat_title')}</span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {messages.map((m, idx) => (
            <div
              key={idx}
              style={{
                alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
                padding: '12px 16px',
                borderRadius: 16,
                background: m.sender === 'user' ? 'linear-gradient(135deg, #4F46E5, #7C3AED)' : 'rgba(241, 245, 249, 0.9)',
                color: m.sender === 'user' ? '#ffffff' : '#1e293b',
                fontSize: 14,
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              }}
            >
              {m.text}
            </div>
          ))}
          {loading && <Spin size="small" style={{ alignSelf: 'flex-start' }} />}
        </div>

        <Space.Compact style={{ width: '100%' }}>
          <Input
            placeholder={t('ai.input_placeholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onPressEnter={handleSend}
          />
          <Button type="primary" icon={<Send size={18} />} onClick={handleSend}>
            {t('ai.send')}
          </Button>
        </Space.Compact>
      </div>
    </div>
  );
};
