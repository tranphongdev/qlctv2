import React, { useState } from 'react';
import { Button, Modal, Form, Input, Select } from 'antd';
import { message } from '../lib/antdApp';
import { Plus } from 'lucide-react';
import type { AppState } from '../types';
import { DynamicIcon } from '../components/DynamicIcon';

import { addCategory } from '../store/appStore';
import { t } from '../i18n';

interface CategoriesPageProps {
  state: AppState;
}

export const CategoriesPage: React.FC<CategoriesPageProps> = ({ state }) => {
  const { categories } = state;
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form] = Form.useForm();

  const handleCreateCategory = (values: any) => {
    addCategory({
      name: values.name,
      type: values.type,
      color: values.color || '#4F46E5',
      icon: values.type === 'chi' ? 'ShoppingBag' : 'Coins',
      order: categories.length + 1,
    });
    message.success(t('cats.added'));
    setIsAddOpen(false);
    form.resetFields();
  };

  const expCategories = categories.filter((c) => c.type === 'chi');
  const incCategories = categories.filter((c) => c.type === 'thu');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{t('cats.title')}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t('cats.subtitle')}</div>
        </div>

        <Button type="primary" icon={<Plus size={16} />} size="middle" style={{ borderRadius: 12 }} onClick={() => setIsAddOpen(true)}>
          {t('cats.add_new')}
        </Button>
      </div>

      {/* Expense Categories Grid */}
      <div className="glass-card" style={{ padding: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#EF4444' }}>
          {t('cats.expense_section', { count: expCategories.length })}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
          {expCategories.map((c) => (
            <div
              key={c.id}
              style={{
                padding: '12px 14px',
                borderRadius: 14,
                background: 'var(--surface-subtle)',
                border: '1px solid var(--surface-border)',
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
                <div style={{ fontSize: 10, color: '#94a3b8' }}>{t('cats.expense_label')}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Income Categories Grid */}
      <div className="glass-card" style={{ padding: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#22C55E' }}>
          {t('cats.income_section', { count: incCategories.length })}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
          {incCategories.map((c) => (
            <div
              key={c.id}
              style={{
                padding: '14px 16px',
                borderRadius: 14,
                background: 'var(--surface-subtle)',
                border: '1px solid var(--surface-border)',
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
                <div style={{ fontSize: 11, color: '#94a3b8' }}>{t('cats.active')}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Add Category */}
      <Modal open={isAddOpen} onCancel={() => setIsAddOpen(false)} title={t('cats.modal_title')} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleCreateCategory} style={{ marginTop: 16 }}>
          <Form.Item name="name" label={t('cats.field_name')} rules={[{ required: true }]}>
            <Input placeholder={t('cats.field_name_placeholder')} />
          </Form.Item>

          <Form.Item name="type" label={t('cats.field_type')} rules={[{ required: true }]}>
            <Select
              placeholder={t('cats.field_type_placeholder')}
              options={[
                { value: 'chi', label: t('cats.opt_expense') },
                { value: 'thu', label: t('cats.opt_income') },
              ]}
            />
          </Form.Item>

          <Form.Item name="color" label={t('cats.field_color')}>
            <Input type="color" defaultValue="#4F46E5" style={{ width: 80, height: 40 }} />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Button onClick={() => setIsAddOpen(false)} style={{ marginRight: 8 }}>{t('common.cancel')}</Button>
            <Button type="primary" htmlType="submit">{t('cats.submit')}</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
