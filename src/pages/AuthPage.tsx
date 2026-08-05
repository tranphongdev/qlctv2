import React, { useState } from 'react';
import { LogIn, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import type { AuthUser } from '../lib/auth';
import { HeroSection } from '../features/auth/components/HeroSection';
import { LoginForm } from '../features/auth/components/LoginForm';
import { RegisterForm } from '../features/auth/components/RegisterForm';
import { ForgotPasswordModal } from '../features/auth/components/ForgotPasswordModal';
import type { AuthMode } from '../features/auth/types';

interface AuthPageProps {
  onSuccess: (user: AuthUser) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [forgotModalOpen, setForgotModalOpen] = useState(false);

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        background: 'var(--glass-bg-light)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflowX: 'hidden',
        padding: 0,
        margin: 0,
      }}
    >
      {/* Main Full-Bleed Edge-to-Edge Auth Layout */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{
          width: '100%',
          minHeight: '100vh',
          borderRadius: 0,
          boxShadow: 'none',
          background: 'var(--glass-bg-light)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        }}
      >
        {/* Left Column: Hero Graphic Section (Desktop / Tablet) */}
        <HeroSection />

        {/* Right Column: Auth Form Card */}
        <div
          className="auth-card-scroll"
          style={{
            padding: '32px 36px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            background: 'var(--glass-bg-light)',
            minHeight: 640,
            height: '100%',
            overflowY: 'auto',
          }}
        >
          {/* Mode Switcher Pills */}
          <div
            style={{
              display: 'flex',
              background: 'rgba(148, 163, 184, 0.12)',
              borderRadius: 4,
              padding: 4,
              marginBottom: 24,
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={() => setMode('login')}
              style={{
                flex: 1,
                border: 'none',
                background: mode === 'login' ? '#ffffff' : 'transparent',
                color: mode === 'login' ? '#1677FF' : '#64748B',
                borderRadius: 4,
                padding: '8px 16px',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                boxShadow: mode === 'login' ? '0 4px 12px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <LogIn size={16} /> Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              style={{
                flex: 1,
                border: 'none',
                background: mode === 'register' ? '#ffffff' : 'transparent',
                color: mode === 'register' ? '#1677FF' : '#64748B',
                borderRadius: 4,
                padding: '8px 16px',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                boxShadow: mode === 'register' ? '0 4px 12px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <UserPlus size={16} /> Đăng ký
            </button>
          </div>

          {/* Form Content - Stable Height Container */}
          <div style={{ flex: 1, minHeight: 480 }}>
            <div style={{ display: mode === 'login' ? 'block' : 'none' }}>
              <LoginForm
                key="login-form"
                onSuccess={onSuccess}
                onSwitchRegister={() => setMode('register')}
                onForgotPassword={() => setForgotModalOpen(true)}
              />
            </div>
            <div style={{ display: mode === 'register' ? 'block' : 'none' }}>
              <RegisterForm
                key="register-form"
                onSuccess={onSuccess}
                onSwitchLogin={() => setMode('login')}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal open={forgotModalOpen} onClose={() => setForgotModalOpen(false)} />
    </div>
  );
};
