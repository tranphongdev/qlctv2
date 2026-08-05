import React from 'react';
import * as Icons from 'lucide-react';

interface DynamicIconProps {
  name: string;
  size?: number;
  color?: string;
  className?: string;
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({ name, size = 18, color, className = '' }) => {
  // @ts-ignore
  const IconComponent = Icons[name] || Icons.CircleDollarSign;
  return <IconComponent size={size} color={color} className={className} />;
};
