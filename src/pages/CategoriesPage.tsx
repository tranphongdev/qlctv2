import React, { useMemo, useState } from 'react';
import { Button, Modal, Form, Input, Select, Empty, Alert, Tooltip, Popconfirm } from 'antd';
import { message } from '~/lib/antdApp';
import { Plus, Trash2 } from 'lucide-react';
import { TX_TYPE, type AppState, type Category, type CategoryType } from '~/types';
import { DynamicIcon } from '~/components/DynamicIcon';
import { IconPicker } from '~/components/IconPicker';

import { addCategory, updateCategory, deleteCategory } from '~/store/appStore';
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
  const { categories, transactions, budgets } = state;
  const [isAddOpen, setIsAddOpen] = useState(false);
  /** Danh mục đang sửa. null nghĩa là modal đang ở chế độ thêm mới. */
  const [editing, setEditing] = useState<Category | null>(null);
  /** Danh mục nhận lại số giao dịch khi xoá. Nằm ngoài form vì không phải là dữ liệu của danh mục. */
  const [replacementId, setReplacementId] = useState<string | undefined>(undefined);
  /**
   * Khu vực xoá đóng lại mặc định. Người dùng mở modal này chủ yếu để sửa; bày sẵn
   * cả phần xoá thì modal dài thêm một màn hình và lặp lại ba lần cùng một câu về
   * số giao dịch đang dùng. Đóng lại cũng khiến việc xoá cần một cú bấm có chủ ý.
   */
  const [deleteOpen, setDeleteOpen] = useState(false);
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

  /** Số ngân sách sẽ bị xoá kèm nếu danh mục đang sửa bị xoá. */
  const budgetUsage = editing ? budgets.filter((b) => b.category === editing.id).length : 0;
  /**
   * Chỉ nhận danh mục cùng loại: chuyển một khoản chi sang danh mục thu sẽ tạo ra
   * đúng thứ dữ liệu hỏng mà `typeLocked` ở trên đang ngăn.
   */
  const replacementOptions = useMemo(() => {
    if (!editing) return [];
    return categories
      .filter((c) => c.id !== editing.id && c.type === editing.type)
      .map((c) => ({ value: c.id, label: c.name }));
  }, [categories, editing]);

  const needsReplacement = usage > 0;
  const canDelete = editing !== null && (!needsReplacement || Boolean(replacementId));

  const openAdd = () => {
    setEditing(null);
    setReplacementId(undefined);
    setDeleteOpen(false);
    form.setFieldsValue({ name: '', type: TX_TYPE.EXPENSE, color: '#2563EB', icon: 'ShoppingBag' });
    setIsAddOpen(true);
  };

  const openEdit = (category: Category) => {
    setIsAddOpen(false);
    setEditing(category);
    setReplacementId(undefined);
    setDeleteOpen(false);
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
    setReplacementId(undefined);
    setDeleteOpen(false);
    form.resetFields();
  };

  const handleDelete = () => {
    if (!editing || !canDelete) return;

    const target = replacementOptions.find((o) => o.value === replacementId);
    deleteCategory(editing.id, needsReplacement ? replacementId : undefined);
    message.success(
      target
        ? t('cats.deleted_moved', { name: editing.name, count: usage, target: target.label })
        : t('cats.deleted', { name: editing.name }),
    );
    close();
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
        /* Bắt buộc phải có, cùng lý do với `font`. Thẻ <button> mang sẵn
           `color: buttontext` của trình duyệt — một màu gần đen KHÔNG đổi theo
           giao diện — nên tên danh mục ở dòng dưới, vốn không tự đặt màu, sẽ
           thừa hưởng màu đó và thành chữ đen trên nền tối. Dòng "n giao dịch"
           đọc được là vì nó có đặt màu riêng. */
        color: 'var(--text-body)',
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

          {editing && usage > 0 && !deleteOpen && (
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

        {/* Khu vực xoá nằm ngoài <Form>: nút xoá mà đứng trong form thì một lần
            Enter nhầm chỗ cũng có thể chạm tới, và nó cũng không gửi giá trị nào
            cho onFinish. */}
        {editing && !deleteOpen && (
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--surface-border)' }}>
            <Button
              type="text"
              danger
              size="small"
              icon={<Trash2 size={14} />}
              onClick={() => setDeleteOpen(true)}
              style={{ paddingLeft: 0 }}
            >
              {t('cats.delete_section')}
            </Button>
          </div>
        )}

        {editing && deleteOpen && (
          <div
            style={{
              marginTop: 20,
              paddingTop: 16,
              borderTop: '1px solid var(--surface-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>
              {t('cats.delete_section')}
            </div>

            {!needsReplacement && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('cats.delete_free')}</div>
            )}

            {needsReplacement &&
              (replacementOptions.length > 0 ? (
                <>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {t('cats.delete_move_hint', { count: usage })}
                  </div>
                  <Select
                    value={replacementId}
                    onChange={setReplacementId}
                    placeholder={t('cats.delete_move_placeholder')}
                    options={replacementOptions}
                    aria-label={t('cats.delete_move_label')}
                  />
                </>
              ) : (
                <Alert type="warning" showIcon title={t('cats.delete_no_target', { count: usage })} />
              ))}

            {budgetUsage > 0 && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {t('cats.delete_budgets_hint', { count: budgetUsage })}
              </div>
            )}

            <Popconfirm
              title={t('cats.delete_title', { name: editing.name })}
              description={t('cats.delete_desc')}
              onConfirm={handleDelete}
              okText={t('common.delete')}
              cancelText={t('common.cancel')}
              okButtonProps={{ danger: true }}
              disabled={!canDelete}
            >
              <Button
                danger
                icon={<Trash2 size={15} />}
                disabled={!canDelete}
                style={{ alignSelf: 'flex-start' }}
              >
                {t('cats.delete_btn')}
              </Button>
            </Popconfirm>
          </div>
        )}
      </Modal>
    </div>
  );
};
