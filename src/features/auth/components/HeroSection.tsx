import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, TrendingUp, CreditCard, ArrowUpRight } from 'lucide-react';
import { formatMoney } from '../../../utils/format';

export const HeroSection: React.FC = () => {
  return (
    <div
      className="auth-hero-section"
      style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 40%, #1677FF 100%)',
        color: '#ffffff',
        padding: '48px 40px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        minHeight: 640,
      }}
    >
      {/* Background Glow Accents */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          left: '-10%',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(22, 119, 255, 0.4) 0%, rgba(0,0,0,0) 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-10%',
          right: '-10%',
          width: '360px',
          height: '360px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124, 58, 237, 0.35) 0%, rgba(0,0,0,0) 70%)',
          filter: 'blur(50px)',
          pointerEvents: 'none',
        }}
      />

      {/* Top Header & Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #1677FF 0%, #7C3AED 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(22, 119, 255, 0.4)',
            }}
          >
            <ShieldCheck size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.4px', background: 'linear-gradient(135deg, #ffffff 0%, #CBD5E1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Financial
            </div>
            <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, letterSpacing: '0.5px' }}>SaaS Expense Management</div>
          </div>
        </div>

        {/* Slogan */}
        <h1 className="auth-hero-slogan" style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.25, letterSpacing: '-0.8px', margin: '0 0 10px 0' }}>
          Kiểm soát tài chính. <br />
          <span style={{ background: 'linear-gradient(135deg, #60A5FA 0%, #A78BFA 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Làm chủ tương lai.
          </span>
        </h1>
        <p style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.5, maxWidth: 380, margin: 0 }}>
          Tự động đồng bộ ngân hàng thời gian thực, bóc tách email giao dịch và báo cáo tài chính trực quan hàng đầu.
        </p>
      </motion.div>

      {/* Floating Cards Graphic Section */}
      <div className="auth-hero-graphics" style={{ position: 'relative', height: 260, margin: '24px 0' }}>
        {/* Floating Card 1: Monthly Stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 40,
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            borderRadius: 16,
            padding: '16px 20px',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.25)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>Số Dư Tháng 8</div>
              <div style={{ fontSize: 22, fontWeight: 800, marginTop: 2 }}>{formatMoney(35450000)}</div>
            </div>
            <div style={{ padding: '4px 10px', borderRadius: 99, background: 'rgba(34, 197, 94, 0.2)', color: '#4ADE80', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
              <TrendingUp size={14} /> +12.4%
            </div>
          </div>
        </motion.div>

        {/* Floating Card 2: Visa Digital Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          style={{
            position: 'absolute',
            top: 75,
            right: 0,
            left: 50,
            background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.85) 0%, rgba(124, 58, 237, 0.85) 100%)',
            backdropFilter: 'blur(16px)',
            borderRadius: 16,
            padding: '16px 20px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 16px 36px rgba(79, 70, 229, 0.35)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CreditCard size={18} color="#ffffff" />
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '1px' }}>MB BANK PRO</span>
            </div>
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.2)', fontWeight: 700 }}>VISA PLATINUM</span>
          </div>
          <div style={{ fontSize: 13, letterSpacing: '2px', fontFamily: 'monospace', opacity: 0.9 }}>•••• •••• •••• 8899</div>
        </motion.div>

        {/* Floating Card 3: Recent Transaction */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 10,
            right: 20,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(16px)',
            borderRadius: 14,
            padding: '12px 16px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 10px 24px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(34, 197, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22C55E' }}>
              <ArrowUpRight size={18} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Tự động bóc tách Email</div>
              <div style={{ fontSize: 11, color: '#94A3B8' }}>Vietcombank • Vừa xong</div>
            </div>
          </div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#22C55E' }}>+15,000,000 ₫</div>
        </motion.div>
      </div>
    </div>
  );
};
