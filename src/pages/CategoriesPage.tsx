import React, { useMemo, useState } from 'react';
import { Button, Modal, Form, Input, Select, Empty, Alert, Tooltip } from 'antd';
import { message } from '~/lib/antdApp';
import { Plus } from 'lucide-react';
import { TX_TYPE, type AppState, type Category, type CategoryType } from '~/types';
import { DynamicIcon } from '~/components/DynamicIcon';
import { IconPicker } from '~/components/IconPicker';

import { addCategory, updateCategory } from '~/store/appStore';
import { t } from '~/i18n';

interface CategoriesPageProps {
  state: AppState;
}

interface CategoryFormValues {
  name: string;
  type: CategoryType;
  color?: string;
  icon?: string;
}

/** Icon mặc định khi tạo mới, tuỳ theo loại danh mục. */
const FALLBACK_ICON: Record<CategoryType, string> = {
  [TX_TYPE.EXPENSE]: 'ShoppingBag',
  [TX_TYPE.INCOME]: 'Coins',
};

export const CategoriesPage: React.FC<CategoriesPageProps> = ({ state }) => {
  const { categories, transactions } = state;
  const [isAddOpen, setIsAddOpen] = useState(false);
  /** Danh mục đang sửa. null nghĩa là modal đang ở chế độ thêm mới. */
  const [editing, setEditing] = useState<Category | null>(null);
  const [form] = Form.useForm<CategoryFormValues>();

  // Theo dõi màu đang chọn trong form để ô xem trước và bộ chọn icon đổi theo
  // ngay lúc kéo bảng màu, thay vì chỉ đúng sau khi bấm lưu.
  const color = Form.useWatch('color', form) || '#2563EB';
  const icon = Form.useWatch('icon', form);
  const type = Form.useWatch('type', form);

  /** Số giao dịch đang tham chiếu từng danh mục. */
  const usageById = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const tx of transactions) counts[tx.category] = (counts[tx.category] ?? 0) + 1;
    return counts;
  }, [transactions]);

  const open = isAddOpen || editing !== null;
  const usage = editing ? (usageById[editing.id] ?? 0) : 0;
  /**
   * Đổi loại của một danh mục đang được dùng sẽ làm hỏng dữ liệu: giao dịch giữ
   * `type` riêng của nó, nên một khoản chi gắn danh mục vừa bị đổi thành "thu"
   * sẽ biến mất khỏi mọi bộ lọc và báo cáo mà không báo lỗi gì. Khoá lại và nói
   * rõ lý do, thay vì để người dùng tự phát hiện sau vài ngày.
   */
  const typeLocked = editing !== null && usage > 0;

  const openAdd = () => {
    setEditing(null);
    form.setFieldsValue({ name: '', type: TX_TYPE.EXPENSE, color: '#2563EB', icon: 'ShoppingBag' });
    setIsAddOpen(true);
  };

  const openEdit = (category: Category) => {
    setIsAddOpen(false);
    setEditing(category);
    form.setFieldsValue({
      name: category.name,
      type: category.type,
      color: category.color,
      icon: category.icon,
    });
  };

  const close = () => {
    setIsAddOpen(false);
    setEditing(null);
    form.resetFields();
  };

  const handleSubmit = (values: CategoryFormValues) => {
    const nextIcon = values.icon || FALLBACK_ICON[values.type] || 'CircleDollarSign';

    if (editing) {
      updateCategory({
        ...editing,
        name: values.name.trim(),
        // Trường bị khoá không gửi giá trị, nên rơi về loại cũ.
        type: typeLocked ? editing.type : values.type,
        color: values.color || editing.color,
        icon: nextIcon,
      });
      message.success(t('cats.updated'));
    } else {
      addCategory({
        name: values.name.trim(),
        type: values.type,
        color: values.color || '#2563EB',
        icon: nextIcon,
        order: categories.length + 1,
      });
      message.success(t('cats.added'));
    }

    close();
  };

  const expCategories = categories.filter((c) => c.type === TX_TYPE.EXPENSE);
  const incCategories = categories.filter((c) => c.type === TX_TYPE.INCOME);

  const renderCard = (c: Category) => (
    <button
      key={c.id}
      type="button"
      onClick={() => openEdit(c)}
      title={t('cats.edit_hint')}
      style={{
        font: 'inherit',
        textAlign: 'left',
        padding: '12px 14px',
        borderRadius: 14,
        background: 'var(--surface-subtle)',
        border: '1px solid var(--surface-border)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        cursor: 'pointer',
        transition: 'border-color 0.18s ease, background-color 0.18s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = c.color;
        e.currentTarget.style.background = 'var(--surface-elevated)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--surface-border)';
        e.currentTarget.style.background = 'var(--surface-subtle)';
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

      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {c.name}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
          {t('cats.usage', { count: usageById[c.id] ?? 0 })}
        </div>
      </div>
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{t('cats.title')}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t('cats.subtitle')}</div>
        </div>

        <Button type="primary" icon={<Plus size={16} />} size="middle" onClick={openAdd}>
          {t('cats.add_new')}
        </Button>
      </div>

      {/* Expense Categories Grid */}
      <div className="glass-card" style={{ padding: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#EF4444' }}>
          {t('cats.expense_section', { count: expCategories.length })}
        </div>
        {expCategories.length === 0 && (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('cats.empty_expense')} />
        )}
        <div className="card-grid" style={{ '--card-min': '150px', '--card-max': '1fr' } as React.CSSProperties}>
          {expCategories.map(renderCard)}
        </div>
      </div>

      {/* Income Categories Grid */}
      <div className="glass-card" style={{ padding: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#22C55E' }}>
          {t('cats.income_section', { count: incCategories.length })}
        </div>
        {incCategories.length === 0 && (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('cats.empty_income')} />
        )}
        <div className="card-grid" style={{ '--card-min': '150px', '--card-max': '1fr' } as React.CSSProperties}>
          {incCategories.map(renderCard)}
        </div>
      </div>

      {/* Một modal cho cả thêm và sửa: hai form gần như trùng khít, tách ra chỉ
          tạo hai chỗ phải nhớ sửa mỗi lần thêm một trường. */}
      <Modal
        open={open}
        onCancel={close}
        title={editing ? t('cats.edit_title') : t('cats.modal_title')}
        footer={null}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 16 }}>
          <Form.Item name="name" label={t('cats.field_name')} rules={[{ required: true, whitespace: true }]}>
            <Input placeholder={t('cats.field_name_placeholder')} />
          </Form.Item>

          <Form.Item
            name="type"
            label={t('cats.field_type')}
            rules={typeLocked ? [] : [{ required: true }]}
            extra={typeLocked ? t('cats.type_locked', { count: usage }) : undefined}
          >
            <Select
              disabled={typeLocked}
              placeholder={t('cats.field_type_placeholder')}
              options={[
                { value: TX_TYPE.EXPENSE, label: t('cats.opt_expense') },
                { value: TX_TYPE.INCOME, label: t('cats.opt_income') },
              ]}
            />
          </Form.Item>

          <Form.Item label={t('cats.field_color')} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Form.Item name="color" noStyle>
                <Input type="color" style={{ width: 64, height: 40, padding: 4 }} />
              </Form.Item>

              {/* Xem trước đúng thứ sẽ hiện trên lưới danh mục. */}
              <Tooltip title={t('cats.preview')}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: `${color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <DynamicIcon
                    name={icon || FALLBACK_ICON[(type as CategoryType) ?? TX_TYPE.EXPENSE]}
                    color={color}
                    size={20}
                  />
                </div>
              </Tooltip>
            </div>
          </Form.Item>

          <Form.Item name="icon" label={t('cats.field_icon')}>
            <IconPicker color={color} />
          </Form.Item>

          {editing && usage > 0 && (
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
              title={t('cats.edit_safe', { count: usage })}
            />
          )}

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Button onClick={close} style={{ marginRight: 8 }}>{t('common.cancel')}</Button>
            <Button type="primary" htmlType="submit">
              {editing ? t('common.save') : t('cats.submit')}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
