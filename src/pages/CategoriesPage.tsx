import React, { useState } from 'react';
import { Button, Modal, Form, Input, Select, message } from 'antd';
import { Plus } from 'lucide-react';
import type { AppState } from '../types';
import { DynamicIcon } from '../components/DynamicIcon';

interface CategoriesPageProps {
  state: AppState;
}

export const CategoriesPage: React.FC<CategoriesPageProps> = ({ state }) => {
  const { categories } = state;
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form] = Form.useForm();

  const handleCreateCategory = () => {
    message.success('Đã thêm danh mục chi tiêu mới!');
    setIsAddOpen(false);
    form.resetFields();
  };

  const expCategories = categories.filter((c) => c.type === 'chi');
  const incCategories = categories.filter((c) => c.type === 'thu');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>Quản lý Danh mục Chi tiêu & Thu nhập</div>
          <div style={{ fontSize: 13, color: '#64748b' }}>Tùy chỉnh màu sắc, biểu tượng và sắp xếp danh mục</div>
        </div>

        <Button type="primary" icon={<Plus size={16} />} size="middle" style={{ borderRadius: 12 }} onClick={() => setIsAddOpen(true)}>
          Thêm danh mục mới
        </Button>
      </div>

      {/* Expense Categories Grid */}
      <div className="glass-card" style={{ padding: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#EF4444' }}>
          🔴 Danh mục Chi tiêu ({expCategories.length})
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
          {expCategories.map((c) => (
            <div
              key={c.id}
              style={{
                padding: '12px 14px',
                borderRadius: 14,
                background: 'rgba(248, 250, 252, 0.6)',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: `${c.color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <DynamicIcon name={c.icon} color={c.color} size={18} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>Chi tiêu</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Income Categories Grid */}
      <div className="glass-card" style={{ padding: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#22C55E' }}>
          🟢 Danh mục Thu nhập ({incCategories.length})
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
          {incCategories.map((c) => (
            <div
              key={c.id}
              style={{
                padding: '14px 16px',
                borderRadius: 14,
                background: 'rgba(248, 250, 252, 0.6)',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: `${c.color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <DynamicIcon name={c.icon} color={c.color} size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>Đang hoạt động</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Add Category */}
      <Modal open={isAddOpen} onCancel={() => setIsAddOpen(false)} title="Thêm Danh mục Mới" footer={null}>
        <Form form={form} layout="vertical" onFinish={handleCreateCategory} style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Tên danh mục" rules={[{ required: true }]}>
            <Input placeholder="Ví dụ: Thú cưng, Quà tặng..." />
          </Form.Item>

          <Form.Item name="type" label="Loại" rules={[{ required: true }]}>
            <Select placeholder="Chọn loại danh mục">
              <Select.Option value="chi">🔴 Chi tiêu</Select.Option>
              <Select.Option value="thu">🟢 Thu nhập</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="color" label="Màu sắc đại diện">
            <Input type="color" defaultValue="#4F46E5" style={{ width: 80, height: 40 }} />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Button onClick={() => setIsAddOpen(false)} style={{ marginRight: 8 }}>Hủy</Button>
            <Button type="primary" htmlType="submit">Tạo Danh Mục</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
