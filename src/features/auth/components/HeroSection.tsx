import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, PieChart, Wallet, ArrowUpRight, Lock, Sparkles } from 'lucide-react';
import { BrandMark } from '~/components/BrandMark';
import { formatMoney } from '~/utils/format';
import { t } from '~/i18n';

/** Ba lời hứa ngắn ở chân hero; icon lấy từ lucide như phần còn lại của app. */
const TRUST_POINTS = [
  { icon: Lock, key: 'hero.point_secure' },
  { icon: PieChart, key: 'hero.point_insight' },
  { icon: Sparkles, key: 'hero.point_automation' },
] as const;

export const HeroSection: React.FC = () => {
  return (
    <div className="auth-hero">
      {/* Thương hiệu + khẩu hiệu */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      >
        <div className="auth-hero__brand" style={{ marginBottom: 28 }}>
          {/* Mark tự mang ô kính riêng nên không bọc thêm khung nào nữa — lồng
              hai lớp nền vào nhau chỉ làm đục cả hai. */}
          <BrandMark size={44} title="Financial" />
          <div>
            <div className="auth-hero__name">Financial</div>
            <div className="auth-hero__subtitle">{t('hero.brand_subtitle')}</div>
          </div>
        </div>

        <h1 className="auth-hero__tagline">
          {t('hero.tagline_1')}
          <br />
          {t('hero.tagline_2')}
        </h1>
        <p className="auth-hero__lead">{t('hero.description')}</p>
      </motion.div>

      {/* Minh hoạ: ba lát cắt thật của app — số dư, phân bổ ngân sách, giao dịch vừa vào */}
      <motion.div
        className="auth-hero__cards"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
        aria-hidden="true"
      >
        <div className="auth-hero__card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="auth-hero__subtitle" style={{ textTransform: 'uppercase' }}>
                {t('hero.balance_label')}
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4, letterSpacing: '-0.5px' }}>
                {formatMoney(35450000)}
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 10px',
                borderRadius: 99,
                background: 'rgba(255, 255, 255, 0.18)',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              <TrendingUp size={14} /> +12.4%
            </div>
          </div>
        </div>

        <div className="auth-hero__card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Wallet size={16} />
            <span style={{ fontSize: 13, fontWeight: 700 }}>{t('hero.budget_label')}</span>
            <span className="auth-hero__point-desc" style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600 }}>
              68%
            </span>
          </div>
          {/* Thanh tiến độ tĩnh: ảnh minh hoạ, không phải dữ liệu thật nên không
              dùng component Progress của antd. */}
          <div style={{ height: 6, borderRadius: 99, background: 'rgba(255, 255, 255, 0.22)', overflow: 'hidden' }}>
            <div style={{ width: '68%', height: '100%', borderRadius: 99, background: '#ffffff' }} />
          </div>
        </div>

        <div className="auth-hero__card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div
              style={{
                width: 34,
                height: 34,
                flexShrink: 0,
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255, 255, 255, 0.18)',
              }}
            >
              <ArrowUpRight size={18} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {t('hero.demo_tx_title')}
              </div>
              <div className="auth-hero__point-desc" style={{ fontSize: 11 }}>
                Vietcombank • {t('hero.just_now')}
              </div>
            </div>
          </div>
          <div style={{ fontSize: 13, fontWeight: 800, whiteSpace: 'nowrap' }}>+{formatMoney(15000000)}</div>
        </div>
      </motion.div>

      {/* Ba lời hứa */}
      <motion.div
        className="auth-hero__points"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        {TRUST_POINTS.map(({ icon: Icon, key }) => (
          <div key={key} className="auth-hero__point">
            <span className="auth-hero__point-icon">
              <Icon size={14} />
            </span>
            <span>{t(key)}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
};
