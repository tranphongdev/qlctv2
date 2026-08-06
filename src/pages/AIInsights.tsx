import React, { useState } from 'react';
import { Button, Input, Tag, Space, Spin } from 'antd';
import { Sparkles, Send, BrainCircuit, TrendingUp, Lightbulb, Bot } from 'lucide-react';
import type { AppState } from '../types';

interface AIInsightsProps {
  state: AppState;
}

export const AIInsights: React.FC<AIInsightsProps> = ({ state: _state }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    {
      sender: 'ai',
      text: 'Xin chào Tran Phong! Tôi là AI Financial Advisor của bạn. Tháng này chi tiêu danh mục Cafe tăng 35% so với tháng trước. Bạn có muốn xem gợi ý cắt giảm hợp lý không?',
    },
  ]);

  const handleSend = () => {
    if (!query.trim()) return;
    const userText = query;
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setQuery('');
    setLoading(true);

    setTimeout(() => {
      let reply = 'Dựa trên dữ liệu tài chính của bạn, tổng số dư khả dụng ở các ví là 85.200.000 VNĐ. Tỷ lệ tiết kiệm tháng này đạt mức 62.9% rất ấn tượng!';
      if (userText.toLowerCase().includes('cafe') || userText.toLowerCase().includes('ăn')) {
        reply = 'Trong tháng 8/2026, bạn đã chi 450.000 VNĐ cho Ăn uống và 65.000 VNĐ cho Cafe. Bạn vẫn nằm trong ngân sách cho phép!';
      } else if (userText.toLowerCase().includes('tiết kiệm')) {
        reply = 'Gợi ý: Nếu bạn trích 10% thu nhập hàng tháng ngay khi nhận lương vào Mục tiêu "MacBook Pro M3", bạn sẽ hoàn thành mục tiêu sớm hơn 2 tháng!';
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
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Phân tích thông minh & tư vấn tối ưu chi tiêu</div>
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
            <span style={{ fontWeight: 700, fontSize: 15 }}>Danh mục tăng mạnh nhất</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            Chi tiêu cho <b>Tiền nhà</b> và <b>Ăn uống ngoài</b> chiếm 65% tổng chi tiêu tháng này (5.950.000 VNĐ).
          </div>
        </div>

        {/* Card 2 */}
        <div className="glass-card" style={{ padding: 22, borderLeft: '4px solid #F59E0B' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <Lightbulb size={20} color="#F59E0B" />
            <span style={{ fontWeight: 700, fontSize: 15 }}>Gợi ý tiết kiệm 15%</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            Chuyển bớt 2.000.000 VNĐ dư thừa từ ví MoMo sang gửi tiết kiệm ngắn hạn để nhận lãi suất 5.2%/năm.
          </div>
        </div>

        {/* Card 3 */}
        <div className="glass-card" style={{ padding: 22, borderLeft: '4px solid #22C55E' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <Sparkles size={20} color="#22C55E" />
            <span style={{ fontWeight: 700, fontSize: 15 }}>Dự đoán cuối tháng</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            Dựa trên tốc độ chi tiêu 380k/ngày, dự kiến bạn sẽ dư ra <b>18.500.000 VNĐ</b> vào cuối tháng 8/2026.
          </div>
        </div>
      </div>

      {/* Interactive AI Chatbot Section */}
      <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', height: 440 }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bot size={20} color="#7C3AED" />
          <span>Hỏi đáp Trợ lý Tài chính AI</span>
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
            placeholder="Hỏi AI bất kỳ điều gì về tài chính của bạn..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onPressEnter={handleSend}
            size="large"
          />
          <Button type="primary" icon={<Send size={18} />} onClick={handleSend}>
            Gửi
          </Button>
        </Space.Compact>
      </div>
    </div>
  );
};
