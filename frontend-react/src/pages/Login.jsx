import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('analyst'); // default 'analyst' for registration
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Please fill in all fields');
      return;
    }

    setLoading(true);
    let res;
    if (isRegister) {
      res = await register(username, password, role);
    } else {
      res = await login(username, password);
    }
    setLoading(false);

    if (res.success) {
      setSuccessMsg(isRegister ? 'Registered successfully! Loading...' : 'Logged in successfully!');
    } else {
      setErrorMsg(res.message || 'An error occurred. Please try again.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#040612] text-slate-100 overflow-hidden relative p-4">
      {/* Dynamic Background Glowing Blobs */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-[#00ff88] rounded-full blur-[140px] opacity-10 animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#3b82f6] rounded-full blur-[140px] opacity-10 animate-pulse pointer-events-none" />

      {/* Main Container */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md bg-[#0a0f26]/60 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl relative z-10 overflow-hidden"
        style={{
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
          background: 'linear-gradient(135deg, rgba(10, 15, 38, 0.7) 0%, rgba(6, 9, 24, 0.9) 100%)'
        }}
      >
        {/* Glow Line Indicator */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#00ff88] via-[#3b82f6] to-[#ec4899] opacity-80" />

        {/* Logo/Header */}
        <div className="text-center mb-8">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-[#00ff88]/10 to-[#3b82f6]/10 border border-[#00ff88]/20 rounded-xl mb-3 shadow-[0_0_15px_rgba(0,255,136,0.15)]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#00ff88]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </motion.div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-[#f8fafc] via-[#f1f5f9] to-[#cbd5e1] bg-clip-text text-transparent">
            NETSHIELD <span className="text-[#00ff88] drop-shadow-[0_0_10px_rgba(0,255,136,0.3)]">AI</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-semibold">
            Next-Gen Threat Analytics Platform
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex border-b border-white/5 mb-6 p-1 bg-black/20 rounded-lg">
          <button 
            type="button"
            className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all duration-200 ${!isRegister ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            onClick={() => { setIsRegister(false); setErrorMsg(''); setSuccessMsg(''); }}
          >
            Sign In
          </button>
          <button 
            type="button"
            className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all duration-200 ${isRegister ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            onClick={() => { setIsRegister(true); setErrorMsg(''); setSuccessMsg(''); }}
          >
            Create Account
          </button>
        </div>

        {/* Alerts & Messages */}
        <AnimatePresence mode="wait">
          {errorMsg && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs px-4 py-3 rounded-lg mb-4 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 text-rose-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-[#00ff88]/10 border border-[#00ff88]/20 text-[#00ff88] text-xs px-4 py-3 rounded-lg mb-4 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 text-[#00ff88]" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Username</label>
            <input 
              type="text" 
              className="w-full bg-slate-900/50 border border-white/5 rounded-lg px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#00ff88]/40 focus:ring-1 focus:ring-[#00ff88]/40 transition duration-200"
              placeholder="e.g. cyber_analyst_01"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Password</label>
            <input 
              type="password" 
              className="w-full bg-slate-900/50 border border-white/5 rounded-lg px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#00ff88]/40 focus:ring-1 focus:ring-[#00ff88]/40 transition duration-200"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          {/* Role selector shown during Registration to easily test both permissions */}
          <AnimatePresence>
            {isRegister && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-2 overflow-hidden"
              >
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Select Access Role</label>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setRole('analyst')}
                    className={`py-3 px-4 rounded-lg border text-xs font-bold transition-all duration-200 flex flex-col items-center gap-1 ${role === 'analyst' ? 'border-[#3b82f6] bg-[#3b82f6]/10 text-[#3b82f6]' : 'border-white/5 bg-slate-900/30 text-slate-400 hover:border-white/10'}`}
                  >
                    <span className="text-sm font-extrabold uppercase tracking-widest">ANALYST</span>
                    <span className="text-[10px] opacity-75 font-normal">Read-Only Telemetry</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`py-3 px-4 rounded-lg border text-xs font-bold transition-all duration-200 flex flex-col items-center gap-1 ${role === 'admin' ? 'border-[#00ff88] bg-[#00ff88]/10 text-[#00ff88]' : 'border-white/5 bg-slate-900/30 text-slate-400 hover:border-white/10'}`}
                  >
                    <span className="text-sm font-extrabold uppercase tracking-widest">ADMIN</span>
                    <span className="text-[10px] opacity-75 font-normal">Full Resolution Rights</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#00ff88] to-[#3b82f6] text-slate-950 font-bold py-3.5 rounded-lg text-sm hover:opacity-90 active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(0,255,136,0.15)] mt-6"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{isRegister ? 'Register & Access System' : 'Authorize Credentials'}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>
        </form>

        {/* Developer Guidelines */}
        <div className="mt-8 border-t border-white/5 pt-4 text-center">
          <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
            💡 Sandbox Testing Credentials
          </p>
          <p className="text-[10px] text-slate-400 mt-1">
            Create any username. Password requirements: 4+ chars.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
