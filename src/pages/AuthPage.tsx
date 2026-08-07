import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { AuthUser } from '~/lib/auth';
import { HeroSection } from '~/features/auth/components/HeroSection';
import { LoginForm } from '~/features/auth/components/LoginForm';
import { RegisterForm } from '~/features/auth/components/RegisterForm';
import { ForgotPasswordModal } from '~/features/auth/components/ForgotPasswordModal';
import type { AuthMode } from '~/features/auth/types';

interface AuthPageProps {
  onSuccess: (user: AuthUser) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [forgotModalOpen, setForgotModalOpen] = useState(false);

  return (
    <div className="auth-shell">
      {/* Cột trái: giới thiệu sản phẩm (rút thành dải hẹp ở màn nhỏ) */}
      <HeroSection />

      {/* Cột phải: thẻ xác thực */}
      <div className="auth-pane">
        <motion.div
          className="auth-card"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              {mode === 'login' ? (
                <LoginForm
                  onSuccess={onSuccess}
                  onSwitchRegister={() => setMode('register')}
                  onForgotPassword={() => setForgotModalOpen(true)}
                />
              ) : (
                <RegisterForm onSuccess={onSuccess} onSwitchLogin={() => setMode('login')} />
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      <ForgotPasswordModal open={forgotModalOpen} onClose={() => setForgotModalOpen(false)} />
    </div>
  );
};
