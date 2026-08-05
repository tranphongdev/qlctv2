import React from 'react';
import { Progress } from 'antd';
import { Check, X } from 'lucide-react';
import type { PasswordStrengthResult } from '../types';

interface PasswordStrengthMeterProps {
  password?: string;
}

export function evaluatePasswordStrength(password: string = ''): PasswordStrengthResult {
  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const criteriaMet = [hasLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;

  if (password.length === 0) {
    return {
      score: 0,
      label: 'Yếu',
      color: '#FF4D4F',
      hasLength: false,
      hasUpper: false,
      hasLower: false,
      hasNumber: false,
      hasSpecial: false,
    };
  }

  if (criteriaMet <= 2) {
    return { score: 25, label: 'Yếu', color: '#FF4D4F', hasLength, hasUpper, hasLower, hasNumber, hasSpecial };
  } else if (criteriaMet === 3) {
    return { score: 50, label: 'Trung bình', color: '#FAAD14', hasLength, hasUpper, hasLower, hasNumber, hasSpecial };
  } else if (criteriaMet === 4) {
    return { score: 75, label: 'Mạnh', color: '#1677FF', hasLength, hasUpper, hasLower, hasNumber, hasSpecial };
  } else {
    return { score: 100, label: 'Rất mạnh', color: '#52C41A', hasLength, hasUpper, hasLower, hasNumber, hasSpecial };
  }
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password = '' }) => {
  if (!password) return null;

  const result = evaluatePasswordStrength(password);

  return (
    <div style={{ marginTop: 8, marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Độ mạnh mật khẩu:</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: result.color }}>{result.label}</span>
      </div>

      <Progress
        percent={result.score}
        strokeColor={result.color}
        showInfo={false}
        size="small"
        style={{ marginBottom: 8 }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: 11 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: result.hasLength ? '#52C41A' : '#94a3b8' }}>
          {result.hasLength ? <Check size={12} /> : <X size={12} />}
          <span>Tối thiểu 8 ký tự</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: result.hasUpper ? '#52C41A' : '#94a3b8' }}>
          {result.hasUpper ? <Check size={12} /> : <X size={12} />}
          <span>Có chữ hoa (A-Z)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: result.hasNumber ? '#52C41A' : '#94a3b8' }}>
          {result.hasNumber ? <Check size={12} /> : <X size={12} />}
          <span>Có chữ số (0-9)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: result.hasSpecial ? '#52C41A' : '#94a3b8' }}>
          {result.hasSpecial ? <Check size={12} /> : <X size={12} />}
          <span>Ký tự đặc biệt (@#$)</span>
        </div>
      </div>
    </div>
  );
};
