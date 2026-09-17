import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, 
  X, 
  Copy, 
  Check, 
  Clock, 
  Database, 
  AlertTriangle,
  Globe,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

let API_BASE_RAW = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000/api/security";
if (API_BASE_RAW.endsWith("/")) {
  API_BASE_RAW = API_BASE_RAW.slice(0, -1);
}
// Derive parent API base to reach /api/threat-intel
const INTEL_API_BASE = API_BASE_RAW.replace("/api/security", "/api/threat-intel");

export default function ThreatIntelModal({ ip, onClose }) {
  const { user } = useAuth();
  const [intel, setIntel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!ip) return;
    
    const fetchIntel = async () => {
      setLoading(true);
      setError(null);
      try {
        const headers = user ? { 'Authorization': `Bearer ${user.token}` } : {};
        const response = await fetch(`${INTEL_API_BASE}/lookup?ip=${ip}`, { headers });
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.detail || "Failed to retrieve reputation data.");
        }
        const data = await response.json();
        setIntel(data);
      } catch (err) {
        console.error("Error looking up IP:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchIntel();
  }, [ip, user]);

  const handleCopy = () => {
    navigator.clipboard.writeText(ip);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getScoreColor = (score) => {
    if (score >= 75) return 'text-rose-500 border-rose-500/30';
    if (score >= 45) return 'text-amber-500 border-amber-500/30';
    if (score >= 15) return 'text-indigo-400 border-indigo-400/30';
    return 'text-[#00ff88] border-[#00ff88]/30';
  };

  const getGaugeStroke = (score) => {
    if (score >= 75) return '#ef4444'; // Red
    if (score >= 45) return '#f59e0b'; // Amber
    if (score >= 15) return '#818cf8'; // Indigo
    return '#00ff88'; // Green
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 10 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(13,20,38,0.95)] p-7 shadow-2xl backdrop-blur-xl"
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-white/[0.04]"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-6 pr-8">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <ShieldAlert size={20} className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-black text-white tracking-wide">Threat Intel Reputation Details</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Dynamic Multi-Source Verification</p>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <span className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-400 font-bold tracking-wider uppercase">Querying TI Reputations...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mb-3">
              <AlertTriangle size={24} />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">Reputation Query Failed</h4>
            <p className="text-xs text-slate-400 max-w-sm px-6">{error}</p>
            <button 
              onClick={onClose} 
              className="mt-5 px-4.5 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded-xl transition-all"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Data State */}
        {!loading && !error && intel && (
          <div className="flex flex-col gap-6">
            
            {/* IP Address and Fused Rating Score Row */}
            <div className="bg-white/[0.01] border border-white/[0.03] rounded-2xl p-5 flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Enriched Target IP</span>
                <div className="flex items-center gap-2.5">
                  <span className="text-lg font-black text-white font-mono tracking-wide">{intel.ip_address}</span>
                  <button 
                    onClick={handleCopy}
                    className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors"
                    title="Copy IP"
                  >
                    {copied ? <Check size={12} className="text-[#00ff88]" /> : <Copy size={12} />}
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`inline-flex text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded border ${
                    intel.source === 'live' 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {intel.source === 'live' ? 'Live API Feed' : 'Simulated Profile'}
                  </span>
                  {intel.cached_at && (
                    <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                      <Clock size={10} /> Cached
                    </span>
                  )}
                </div>
              </div>

              {/* Gauge */}
              <div className="relative w-20 h-20 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path 
                    className="fill-none stroke-[rgba(255,255,255,0.03)] stroke-[3]" 
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                  />
                  <motion.path 
                    initial={{ strokeDasharray: "0, 100" }}
                    animate={{ strokeDasharray: `${intel.reputation_rating}, 100` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="fill-none stroke-[3] stroke-linecap-round" 
                    stroke={getGaugeStroke(intel.reputation_rating)}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-sm font-black text-white">{intel.reputation_rating}%</span>
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Score</span>
                </div>
              </div>
            </div>

            {/* External Reputation Sources Breakdowns */}
            <div className="flex flex-col gap-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">External Reputation Feeds</h4>
              
              {/* AbuseIPDB */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-300">AbuseIPDB Confidence Level</span>
                  <span className="font-mono text-slate-400">{intel.abuse_score}%</span>
                </div>
                <div className="w-full h-2 bg-slate-900 border border-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${intel.abuse_score}%` }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 shadow-[0_0_6px_rgba(99,102,241,0.3)]"
                  />
                </div>
              </div>

              {/* VirusTotal */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-300">VirusTotal Detection Ratio</span>
                  <span className="font-mono text-slate-400">{intel.vt_score}%</span>
                </div>
                <div className="w-full h-2 bg-slate-900 border border-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${intel.vt_score}%` }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 shadow-[0_0_6px_rgba(59,130,246,0.3)]"
                  />
                </div>
              </div>

              {/* AlienVault OTX */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-300">AlienVault OTX Threat Pulses</span>
                  <span className="font-mono text-slate-400">{intel.otx_score}%</span>
                </div>
                <div className="w-full h-2 bg-slate-900 border border-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${intel.otx_score}%` }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="h-full rounded-full bg-gradient-to-r from-[#00ff88] to-emerald-500 shadow-[0_0_6px_rgba(0,255,136,0.3)]"
                  />
                </div>
              </div>
            </div>

            {/* Calculations logic explanation alerts info */}
            <div className="p-3.5 bg-slate-900/40 border border-slate-850 rounded-xl text-[10px] text-slate-400 flex items-start gap-3">
              <Database size={14} className="text-indigo-400 mt-0.5 flex-shrink-0" />
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-slate-300 uppercase tracking-wider">Fusion Equation: 0.4 * Abuse + 0.4 * VT + 0.2 * OTX</span>
                <span>Combined adaptive intelligence weights automatically refresh this target's global threat reputation inside local tables on a 24h rolling basis.</span>
              </div>
            </div>

            {/* Modal actions */}
            <div className="flex gap-3.5 mt-2 justify-end">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-800/60 text-xs font-bold text-slate-300 transition-all cursor-pointer"
              >
                Close Details
              </button>
            </div>
            
          </div>
        )}
      </motion.div>
    </div>
  );
}
