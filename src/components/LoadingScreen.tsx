import React from 'react';
import { t } from '~/i18n';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = t('common.loading') }) => (
  <div className="app-screen" role="status" aria-live="polite">
    <div className="app-spinner" aria-hidden="true" />
    <p className="app-screen__message">{message}</p>
  </div>
);
