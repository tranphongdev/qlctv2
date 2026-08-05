import React, { useState } from 'react';
import { FloatButton, Tooltip } from 'antd';
import { Plus, Receipt, Wallet, PieChart, Target } from 'lucide-react';

interface QuickActionFabProps {
  onOpenAddTransaction: () => void;
  onOpenAddWallet: () => void;
  onOpenAddBudget: () => void;
  onOpenAddGoal: () => void;
}

export const QuickActionFab: React.FC<QuickActionFabProps> = ({
  onOpenAddTransaction,
  onOpenAddWallet,
  onOpenAddBudget,
  onOpenAddGoal,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <FloatButton.Group
      trigger="click"
      type="primary"
      className="desktop-only fab-position"
      icon={<Plus size={22} />}
      open={open}
      onOpenChange={setOpen}
    >
      <Tooltip title="Thêm giao dịch mới" placement="left">
        <FloatButton
          icon={<Receipt size={18} color="#22C55E" />}
          onClick={onOpenAddTransaction}
        />
      </Tooltip>
      <Tooltip title="Thêm ví tiền mới" placement="left">
        <FloatButton
          icon={<Wallet size={18} color="#2563EB" />}
          onClick={onOpenAddWallet}
        />
      </Tooltip>
      <Tooltip title="Tạo ngân sách chi tiêu" placement="left">
        <FloatButton
          icon={<PieChart size={18} color="#F59E0B" />}
          onClick={onOpenAddBudget}
        />
      </Tooltip>
      <Tooltip title="Tạo mục tiêu tiết kiệm" placement="left">
        <FloatButton
          icon={<Target size={18} color="#EC4899" />}
          onClick={onOpenAddGoal}
        />
      </Tooltip>
    </FloatButton.Group>
  );
};
