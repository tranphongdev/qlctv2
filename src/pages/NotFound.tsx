import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import { Compass, ArrowLeft, LayoutDashboard } from 'lucide-react';
import { TAB_PATHS } from '~/routes';
import { t } from '~/i18n';

/**
 * Trang 404, hiển thị BÊN TRONG khung ứng dụng (còn nguyên sidebar, header, thanh
 * điều hướng dưới). Đá thẳng người dùng về Tổng quan thì gọn hơn, nhưng họ sẽ không
 * biết mình vừa gõ sai đường dẫn hay ứng dụng vừa nuốt mất một trang.
 */
export const NotFound: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // key 'default' nghĩa là đây là mục đầu tiên trong lịch sử của phiên này: người
  // dùng dán thẳng đường dẫn vào thanh địa chỉ. Lúc đó navigate(-1) sẽ ném họ ra
  // khỏi ứng dụng chứ không đưa về đâu cả, nên giấu luôn nút Quay lại.
  const canGoBack = location.key !== 'default';

  return (
    <div
      className="glass-card"
      style={{
        padding: '48px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 14,
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
          boxShadow: '0 12px 28px rgba(37, 99, 235, 0.35)',
        }}
      >
        <Compass size={34} color="#ffffff" />
      </div>

      <div style={{ fontSize: 44, fontWeight: 900, lineHeight: 1, color: 'var(--text-heading)' }}>404</div>
      <div style={{ fontSize: 18, fontWeight: 700 }}>{t('notfound.title')}</div>

      <p style={{ margin: 0, maxWidth: 460, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        {t('notfound.description')}
      </p>

      {/* Hiện lại đúng đường dẫn đã gõ: người dùng tự soi ra chỗ sai chính tả nhanh
          hơn mọi lời giải thích chung chung. */}
      <code
        style={{
          maxWidth: '100%',
          overflowWrap: 'anywhere',
          padding: '6px 12px',
          borderRadius: 8,
          fontSize: 13,
          background: 'var(--tint-expense)',
          color: 'var(--color-expense)',
        }}
      >
        {location.pathname}
      </code>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginTop: 6 }}>
        {canGoBack && (
          <Button icon={<ArrowLeft size={16} />} onClick={() => navigate(-1)}>
            {t('notfound.back')}
          </Button>
        )}
        <Button
          type="primary"
          icon={<LayoutDashboard size={16} />}
          onClick={() => navigate(TAB_PATHS.dashboard, { replace: true })}
        >
          {t('notfound.home')}
        </Button>
      </div>
    </div>
  );
};
