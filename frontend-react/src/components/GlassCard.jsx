import React from 'react';
import { motion } from 'framer-motion';

export default function GlassCard({ children, className = '', glowColor = 'rgba(0, 255, 136, 0.05)', hoverGlow = true }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      whileHover={hoverGlow ? {
        boxShadow: `0 8px 30px ${glowColor}, inset 0 0 12px rgba(255, 255, 255, 0.05)`,
        borderColor: 'rgba(0, 255, 136, 0.25)',
        y: -2
      } : {}}
      className={`relative overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(15,22,40,0.65)] p-6 backdrop-blur-xl shadow-2xl transition-all duration-300 ${className}`}
    >
      {/* Decorative inner gradient grid */}
      <div className="absolute -right-20 -top-20 -z-10 h-40 w-40 rounded-full bg-[rgba(0,255,136,0.03)] blur-3xl" />
      {children}
    </motion.div>
  );
}
