import React, { useEffect, useState } from 'react';
import { formatMoney } from '../utils/format';
import { getActiveCurrency } from '../utils/currency';
import type { CurrencyCode } from '../utils/currency';

interface CounterAnimationProps {
  value: number;
  duration?: number; // in ms
  currency?: CurrencyCode;
  prefix?: string;
  className?: string;
}

export const CounterAnimation: React.FC<CounterAnimationProps> = ({
  value,
  duration = 800,
  currency = getActiveCurrency(),
  prefix = '',
  className = '',
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startValue = displayValue;
    const endValue = value;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out cubic formula
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(startValue + (endValue - startValue) * easedProgress);
      setDisplayValue(current);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [value, duration]);

  return (
    <span className={className}>
      {prefix}
      {formatMoney(displayValue, currency)}
    </span>
  );
};
