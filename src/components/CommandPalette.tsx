import React, { useState, useEffect } from 'react';
import { Modal, Input, List, Tag } from 'antd';
import {
  Search,
  LayoutDashboard,
  Receipt,
  Wallet,
  PieChart,
  Target,
  HandCoins,
  BarChart3,
  Calendar,
  Sparkles,
  User,
  PlusCircle,
  ArrowRight,
} from 'lucide-react';
import { removeAccents } from '../utils/format';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onSelectTab: (tab: string) => void;
  onOpenAddModal: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  open,
  onClose,
  onSelectTab,
  onOpenAddModal,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (open) setQuery('');
  }, [open]);

  const commands = [
    {
      id: 'cmd_add',
      title: 'Thêm giao dịch mới',
      subtitle: 'Tạo giao dịch thu nhập, chi tiêu hoặc chuyển khoản ví',
      icon: <PlusCircle size={18} color="#22C55E" />,
      action: () => {
        onClose();
        onOpenAddModal();
      },
      category: 'Thao tác nhanh',
    },
    {
      id: 'nav_dashboard',
      title: 'Mở Trang Tổng quan (Dashboard)',
      subtitle: 'Xem 4 thẻ chỉ số, biểu đồ thu chi và biến động tài sản',
      icon: <LayoutDashboard size={18} color="#4F46E5" />,
      action: () => {
        onClose();
        onSelectTab('dashboard');
      },
      category: 'Điều hướng',
    },
    {
      id: 'nav_transactions',
      title: 'Mở Quản lý Giao dịch',
      subtitle: 'Xem danh sách, lọc, sắp xếp và xuất dữ liệu Excel',
      icon: <Receipt size={18} color="#7C3AED" />,
      action: () => {
        onClose();
        onSelectTab('transactions');
      },
      category: 'Điều hướng',
    },
    {
      id: 'nav_wallets',
      title: 'Mở Quản lý Ví & Nguồn tiền',
      subtitle: 'Ví tiền mặt, MB Bank, Vietcombank, MoMo, Crypto',
      icon: <Wallet size={18} color="#2563EB" />,
      action: () => {
        onClose();
        onSelectTab('wallets');
      },
      category: 'Điều hướng',
    },
    {
      id: 'nav_budgets',
      title: 'Mở Quản lý Ngân sách',
      subtitle: 'Xem và thiết lập hạn mức chi tiêu theo danh mục',
      icon: <PieChart size={18} color="#F59E0B" />,
      action: () => {
        onClose();
        onSelectTab('budgets');
      },
      category: 'Điều hướng',
    },
    {
      id: 'nav_goals',
      title: 'Mở Mục tiêu Tiết kiệm',
      subtitle: 'Theo dõi tiến độ tiết kiệm mua sắm và dự phòng',
      icon: <Target size={18} color="#EC4899" />,
      action: () => {
        onClose();
        onSelectTab('goals');
      },
      category: 'Điều hướng',
    },
    {
      id: 'nav_debts',
      title: 'Mở Sổ Nợ & Cho vay',
      subtitle: 'Theo dõi các khoản vay, cho vay và ngày hẹn trả',
      icon: <HandCoins size={18} color="#10B981" />,
      action: () => {
        onClose();
        onSelectTab('debts');
      },
      category: 'Điều hướng',
    },
    {
      id: 'nav_analytics',
      title: 'Mở Thống kê & Phân tích Tài chính',
      subtitle: 'Báo cáo chi tiết, điểm sức khỏe tài chính và cash flow',
      icon: <BarChart3 size={18} color="#3B82F6" />,
      action: () => {
        onClose();
        onSelectTab('analytics');
      },
      category: 'Điều hướng',
    },
    {
      id: 'nav_calendar',
      title: 'Mở Xem theo Lịch',
      subtitle: 'Xem giao dịch thu chi phân bổ theo ngày trong tháng',
      icon: <Calendar size={18} color="#8B5CF6" />,
      action: () => {
        onClose();
        onSelectTab('calendar');
      },
      category: 'Điều hướng',
    },
    {
      id: 'nav_ai',
      title: 'Mở AI Financial Insights',
      subtitle: 'Phân tích thông minh, phát hiện bất thường và hỏi đáp AI',
      icon: <Sparkles size={18} color="#7C3AED" />,
      action: () => {
        onClose();
        onSelectTab('ai_insights');
      },
      category: 'AI Tool',
    },
    {
      id: 'nav_profile',
      title: 'Mở Cài đặt & Sao lưu',
      subtitle: 'Tùy chỉnh giao diện, sao lưu & khôi phục dữ liệu JSON',
      icon: <User size={18} />,
      action: () => {
        onClose();
        onSelectTab('profile');
      },
      category: 'Cài đặt',
    },
  ];

  const filtered = commands.filter((cmd) => {
    if (!query) return true;
    const cleanQ = removeAccents(query);
    return (
      removeAccents(cmd.title).includes(cleanQ) ||
      removeAccents(cmd.subtitle).includes(cleanQ) ||
      removeAccents(cmd.category).includes(cleanQ)
    );
  });

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      closable={false}
      width={600}
      style={{ top: 80 }}
      styles={{ body: { padding: 0 } }}
    >
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(148, 163, 184, 0.15)' }}>
        <Input
          prefix={<Search size={20} color="#4F46E5" style={{ marginRight: 8 }} />}
          placeholder="Nhập từ khóa tìm kiếm hoặc chọn lệnh thao tác nhanh..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          variant="borderless"
          style={{ fontSize: 16 }}
          autoFocus
        />
      </div>

      <div style={{ maxHeight: 420, overflowY: 'auto', padding: '12px 16px' }}>
        <List
          dataSource={filtered}
          renderItem={(item) => (
            <List.Item
              onClick={item.action}
              style={{
                padding: '12px 16px',
                borderRadius: 12,
                cursor: 'pointer',
                marginBottom: 6,
                border: 'none',
                transition: 'background 0.2s ease',
              }}
              className="cmd-item"
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: 'var(--surface-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-heading)' }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.subtitle}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Tag color="blue">{item.category}</Tag>
                  <ArrowRight size={16} />
                </div>
              </div>
            </List.Item>
          )}
        />
      </div>

      <div
        style={{
          padding: '10px 20px',
          borderTop: '1px solid rgba(148, 163, 184, 0.15)',
          background: 'var(--surface-subtle)',
          fontSize: 12,
          color: '#94a3b8',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>
          Nhấn <kbd style={{ background: 'rgba(148, 163, 184, 0.25)', padding: '2px 6px', borderRadius: 4, color: 'var(--text-body)' }}>ESC</kbd> để thoát
        </span>
        <span>Command Palette</span>
      </div>
    </Modal>
  );
};
