import React from 'react';
import { BrandMark } from './BrandMark';
import { t } from '~/i18n';

interface LoadingScreenProps {
  message?: string;
}

/**
 * Màn hình chờ toàn trang. Đây là thứ đầu tiên người dùng thấy khi mở app, nên
 * logo đóng vai chính còn spinner lùi xuống thành chi tiết phụ: một vòng quay
 * trần trụi khiến app có cảm giác đang treo, còn logo hiện ra rồi có vệt sáng
 * lướt qua thì thành một nhịp mở màn.
 */
export const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = t('common.loading') }) => (
  <div className="app-screen" role="status" aria-live="polite">
    <BrandMark size={76} animated style={{ marginBottom: 4 }} />
    <div className="app-spinner app-spinner--sm" aria-hidden="true" />
    <p className="app-screen__message">{message}</p>
  </div>
);
