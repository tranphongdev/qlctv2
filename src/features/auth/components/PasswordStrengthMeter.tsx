import React from 'react';
import { Progress } from 'antd';
import { Check, X } from 'lucide-react';
import { t } from '~/i18n';
import type { PasswordStrengthResult } from '~/features/auth/types';

interface PasswordStrengthMeterProps {
  password?: string;
}

/**
 * Màu theo mức độ mạnh.
 *
 * Viết hex chứ không var(--...) vì giá trị này còn được truyền vào `strokeColor`
 * của antd và trả ra ngoài qua PasswordStrengthResult. Bốn giá trị là đúng bộ
 * --danger / --warning / --primary / --success khai báo ở :root trong index.css.
 */
const STRENGTH_COLORS = {
  weak: '#EF4444',
  medium: '#F59E0B',
  strong: '#4F46E5',
  very_strong: '#22C55E',
} as const;

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
      level: 'weak',
      color: STRENGTH_COLORS.weak,
      hasLength: false,
      hasUpper: false,
      hasLower: false,
      hasNumber: false,
      hasSpecial: false,
    };
  }

  if (criteriaMet <= 2) {
    return { score: 25, level: 'weak', color: STRENGTH_COLORS.weak, hasLength, hasUpper, hasLower, hasNumber, hasSpecial };
  } else if (criteriaMet === 3) {
    return { score: 50, level: 'medium', color: STRENGTH_COLORS.medium, hasLength, hasUpper, hasLower, hasNumber, hasSpecial };
  } else if (criteriaMet === 4) {
    return { score: 75, level: 'strong', color: STRENGTH_COLORS.strong, hasLength, hasUpper, hasLower, hasNumber, hasSpecial };
  } else {
    return { score: 100, level: 'very_strong', color: STRENGTH_COLORS.very_strong, hasLength, hasUpper, hasLower, hasNumber, hasSpecial };
  }
}

const STRENGTH_LABEL_KEYS = {
  weak: 'password.weak',
  medium: 'password.medium',
  strong: 'password.strong',
  very_strong: 'password.very_strong',
} as const;

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password = '' }) => {
  if (!password) return null;

  const result = evaluatePasswordStrength(password);

  return (
    <div style={{ marginTop: 2, marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{t('password.strength_label')}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: result.color }}>{t(STRENGTH_LABEL_KEYS[result.level])}</span>
      </div>

      <Progress
        percent={result.score}
        strokeColor={result.color}
        showInfo={false}
        size="small"
        style={{ marginBottom: 8 }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: 11 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: result.hasLength ? STRENGTH_COLORS.very_strong : 'var(--text-muted)' }}>
          {result.hasLength ? <Check size={12} /> : <X size={12} />}
          <span>{t('password.rule_length')}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: result.hasUpper ? STRENGTH_COLORS.very_strong : 'var(--text-muted)' }}>
          {result.hasUpper ? <Check size={12} /> : <X size={12} />}
          <span>{t('password.rule_upper')}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: result.hasNumber ? STRENGTH_COLORS.very_strong : 'var(--text-muted)' }}>
          {result.hasNumber ? <Check size={12} /> : <X size={12} />}
          <span>{t('password.rule_number')}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: result.hasSpecial ? STRENGTH_COLORS.very_strong : 'var(--text-muted)' }}>
          {result.hasSpecial ? <Check size={12} /> : <X size={12} />}
          <span>{t('password.rule_special')}</span>
        </div>
      </div>
    </div>
  );
};
