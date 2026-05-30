import React, { useState } from 'react';
import { RefreshCw, Server, AlertTriangle, Settings, X, Database, ShieldCheck, HelpCircle, Play, Pause, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Header({ 
  activeTab, 
  isRefreshing, 
  triggerRefresh, 
  securityScore, 
  azureConnected,
  azureSyncedEvents = 0,
  trafficToday = '0.0K',
  onPurgeLogs,
  simulatorActive = true,
  onToggleSimulator
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPurging, setIsPurging] = useState(false);

  const getTabDetails = () => {
    switch (activeTab) {
      case 'overview':
        return {
          title: 'Security Operations Center',
          subtitle: 'Enterprise cyber telemetry overview & anomaly heat signatures'
        };
      case 'threats':
        return {
          title: 'Threat Incident Monitor',
          subtitle: 'Real-time malicious traffic capture & signature analysis'
        };
      case 'traffic':
        return {
          title: 'Deep Network Traffic Analytics',
          subtitle: 'Granular flow metrics, protocols & security policy breakdown'
        };
      case 'alerts':
        return {
          title: 'Incident Action Alerts',
          subtitle: 'SOC alerts requiring manual review or active threat isolation'
        };
      case 'risk':
        return {
          title: 'AI Anomaly & Risk Insights',
          subtitle: 'Scikit-learn Isolation Forest engine analysis & contamination rates'
        };
      default:
        return {
          title: 'NetShield AI Control Panel',
          subtitle: 'Next-generation neural threat mitigation platform'
        };
    }
  };

  const details = getTabDetails();

  // Helper to convert "48.2K" string/number into human-readable estimation of total packets
  const getApproxLocalCount = () => {
    if (typeof trafficToday === 'string') {
      const parsed = parseFloat(trafficToday);
      return isNaN(parsed) ? 'N/A' : Math.round(parsed * 1000).toLocaleString();
    }
    return trafficToday.toLocaleString();
  };

  return (
    <header className="flex justify-between items-center mb-10">
      <div>
        <motion.h1 
          key={activeTab + '-title'}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="text-3xl font-black tracking-tight text-white flex items-center gap-3"
        >
          {details.title}
        </motion.h1>
        <motion.p 
          key={activeTab + '-sub'}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="text-[14px] font-medium text-slate-400 mt-1"
        >
          {details.subtitle}
        </motion.p>
      </div>

      <div className="flex items-center gap-4">
        {/* Real-time Threat Warning Banner if Score is Low */}
        <AnimatePresence>
          {securityScore < 90 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-amber-500/10 border border-amber-500/25 px-4 py-2.5 rounded-xl text-amber-400 font-bold text-xs flex items-center gap-2.5 animate-pulse"
            >
              <AlertTriangle size={14} />
              <span>ELEVATED THREAT DETECTED</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] py-2.5 px-4 rounded-xl font-mono text-xs flex items-center gap-2.5 text-slate-400">
          <Server className="text-[#00ff88]" size={14} />
          <span>Local Engine Active</span>
        </div>

        {/* Clickable Azure Badge triggers pop-up modal */}
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsModalOpen(true)}
          className={`border py-2.5 px-4 rounded-xl font-mono text-xs flex items-center gap-2.5 shadow-md transition-all cursor-pointer ${
            azureConnected 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/25' 
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/25'
          }`}
        >
          <Server className={azureConnected ? 'text-emerald-400' : 'text-rose-400'} size={14} />
          <span>{azureConnected ? 'Cloud Azure: Connected' : 'Cloud Azure: Disconnected'}</span>
          <Settings size={12} className="opacity-75 hover:opacity-100 transition-opacity ml-0.5" />
        </motion.button>

        <button 
          onClick={triggerRefresh}
          className="bg-slate-800 hover:bg-slate-700 active:translate-y-0 text-white font-semibold text-xs py-2.5 px-5 rounded-xl border border-[rgba(255,255,255,0.08)] flex items-center gap-2 transition-all cursor-pointer shadow-lg"
        >
          <RefreshCw className={isRefreshing ? 'animate-spin text-[#00ff88]' : 'text-slate-400'} size={14} />
          <span>Force Sync</span>
        </button>
      </div>

      {/* Cloud Ingestion & Cost Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
            {/* Modal Backdrop Click-to-Close */}
            <div className="absolute inset-0" onClick={() => setIsModalOpen(false)} />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="bg-[#0b0e24]/90 border border-slate-700/40 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 relative z-10"
              style={{
                backgroundImage: 'radial-gradient(circle at top right, rgba(0, 255, 136, 0.04) 0%, transparent 70%)'
              }}
            >
              {/* Close Button */}
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-lg bg-slate-800/40 border border-slate-700/30 hover:border-slate-600/40 transition-all cursor-pointer"
              >
                <X size={14} />
              </button>

              {/* Title Header */}
              <div className="flex items-center gap-3 mb-5">
                <div className={`p-2.5 rounded-xl border ${
                  azureConnected 
                    ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' 
                    : 'bg-rose-500/10 border-rose-500/25 text-rose-400'
                }`}>
                  <Server size={18} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Azure Cloud Telemetry</h3>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    {azureConnected ? 'Integration Active & Connected' : 'Cloud Integration Offline'}
                  </p>
                </div>
              </div>

              {/* Metrics Breakdown Grid */}
              <div className="grid grid-cols-2 gap-4 mb-5">
                {/* Local Simulated Events */}
                <div className="bg-slate-900/45 border border-slate-800/60 rounded-xl p-3.5 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold">
                    <Database size={13} className="text-[#00ff88]" />
                    <span>Local Events</span>
                  </div>
                  <span className="text-xl font-black text-white">{getApproxLocalCount()}</span>
                  <span className="text-[10px] text-slate-500 font-medium">Edge Simulation Feed</span>
                </div>

                {/* Azure Cloud Synced Events */}
                <div className="bg-slate-900/45 border border-slate-800/60 rounded-xl p-3.5 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold">
                    <Database size={13} className="text-sky-400" />
                    <span>Azure Synced</span>
                  </div>
                  <span className="text-xl font-black text-white">{azureSyncedEvents.toLocaleString()}</span>
                  <span className="text-[10px] text-slate-500 font-medium">Uploaded Telemetry Logs</span>
                </div>
              </div>

              {/* Dynamic Progress Bar */}
              <div className="mb-6 bg-slate-900/40 border border-slate-850 p-4 rounded-xl">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-400 mb-2">
                  <span>Edge-to-Cloud Sync Ratio</span>
                  <span className="text-[#00ff88]">
                    {azureSyncedEvents > 0 && parseFloat(getApproxLocalCount().replace(/,/g, '')) > 0
                      ? ((azureSyncedEvents / parseFloat(getApproxLocalCount().replace(/,/g, ''))) * 100).toFixed(2)
                      : '0.00'}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ 
                      width: azureSyncedEvents > 0 && parseFloat(getApproxLocalCount().replace(/,/g, '')) > 0 
                        ? `${Math.min(100, (azureSyncedEvents / parseFloat(getApproxLocalCount().replace(/,/g, ''))) * 100)}%` 
                        : '0%' 
                    }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-[#00ff88] to-sky-400 rounded-full"
                  />
                </div>
              </div>

              {/* Pipeline cost-awareness Banner */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col gap-2 mb-2">
                <div className="flex items-center gap-2 text-xs font-extrabold text-white">
                  <ShieldCheck size={14} className="text-emerald-400" />
                  <span>Cost-Aware Pipeline: ENABLED</span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-400">
                  To prevent high log ingestion bills, the NetShield AI proxy performs **selective cloud logging**. 
                  Normal traffic is processed locally, while only **ML-flagged anomalies** and **CRITICAL/HIGH** threats are synchronized to the Azure Sentinel Workspace.
                </p>
              </div>

              {/* Telemetry Simulator Control Toggle */}
              <button
                onClick={() => onToggleSimulator(!simulatorActive)}
                className={`w-full mt-4 active:scale-[0.98] font-extrabold text-xs py-2.5 px-4 rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                  simulatorActive
                    ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30'
                    : 'bg-emerald-500/10 hover:bg-[#00ff88]/20 text-[#00ff88] border-[#00ff88]/30 shadow-[0_0_15px_rgba(0,255,136,0.05)]'
                }`}
              >
                {simulatorActive ? <Pause size={13} className="animate-pulse" /> : <Play size={13} />}
                <span>{simulatorActive ? 'PAUSE TELEMETRY FEED' : 'START TELEMETRY FEED'}</span>
              </button>

              {/* Database Pruning Control */}
              <button
                onClick={async () => {
                  setIsPurging(true);
                  await onPurgeLogs();
                  setTimeout(() => setIsPurging(false), 800);
                }}
                disabled={isPurging}
                className="w-full mt-4 bg-rose-500/10 hover:bg-rose-500/20 active:scale-[0.98] text-rose-400 font-extrabold text-xs py-2.5 px-4 rounded-xl border border-rose-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
              >
                <RefreshCw className={isPurging ? 'animate-spin' : ''} size={13} />
                <span>{isPurging ? 'PRUNING DATABASE...' : 'PRUNE OLDEST 100 LOGS'}</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
}
