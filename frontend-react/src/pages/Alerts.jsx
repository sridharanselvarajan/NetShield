import React, { useState } from 'react';
import GlassCard from '../components/GlassCard';
import { ShieldAlert, ShieldCheck, Check, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Alerts({ data, onResolveAlert, onResolveAll }) {
  const { activeThreats } = data;
  const [selectedAlert, setSelectedAlert] = useState(null);

  return (
    <div className="flex flex-col gap-6">
      {/* Header section with Mark All Read */}
      <GlassCard glowColor="rgba(239, 68, 68, 0.05)" hoverGlow={false}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20">
              <ShieldAlert size={20} className="animate-pulse" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-lg font-black text-white">Action Center</h2>
              <span className="text-xs text-slate-400 font-semibold">{activeThreats.length} Unresolved Incidents Active</span>
            </div>
          </div>

          <button 
            onClick={onResolveAll}
            className="bg-[#00ff88]/10 hover:bg-[#00ff88] border border-[#00ff88]/30 hover:border-[#00ff88] text-[#00ff88] hover:text-slate-950 font-black text-xs py-2 px-5 rounded-xl flex items-center gap-2 cursor-pointer transition-all uppercase tracking-wider"
          >
            <Check size={14} />
            <span>Mark All Resolved</span>
          </button>
        </div>
      </GlassCard>

      {/* Alerts Grid List */}
      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="popLayout">
          {activeThreats.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="py-16 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 flex items-center justify-center mx-auto mb-4 animate-bounce">
                <ShieldCheck size={32} />
              </div>
              <h3 className="text-lg font-black text-white uppercase tracking-wide">All Threats Fully Remediated</h3>
              <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">Excellent! No threat patterns have been flagged by the machine learning security layer at this time.</p>
            </motion.div>
          ) : (
            activeThreats.map((alert) => (
              <motion.div
                key={alert.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative overflow-hidden rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(15,22,40,0.45)] hover:border-slate-800 transition-all p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              >
                {/* Alert side glow stripe */}
                <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${
                  alert.severity === 'CRITICAL' ? 'bg-rose-500' :
                  alert.severity === 'HIGH' ? 'bg-amber-500' : 'bg-indigo-500'
                }`} />

                <div className="flex gap-4 items-start pl-2">
                  <div className="relative mt-1">
                    <div className={`w-3 h-3 rounded-full ${
                      alert.severity === 'CRITICAL' ? 'bg-rose-500 animate-ping' :
                      alert.severity === 'HIGH' ? 'bg-amber-500' : 'bg-indigo-500'
                    }`} />
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-center gap-3">
                      <span className={`text-[9px] font-black tracking-widest px-2 py-0.5 rounded border uppercase ${
                        alert.severity === 'CRITICAL' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                        alert.severity === 'HIGH' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                      }`}>
                        [{alert.severity}]
                      </span>
                      <h3 className="text-[15px] font-extrabold text-white">{alert.type} detected</h3>
                    </div>

                    <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-500 mt-2">
                      <span>IP Address: <strong className="font-mono text-indigo-400">{alert.ip}</strong></span>
                      <span>Port Target: <strong className="font-mono">{alert.port}</strong></span>
                      <span>Ingest Time: <strong>{alert.time}</strong></span>
                    </div>

                    <p className="text-xs font-medium text-slate-400 mt-2.5 leading-relaxed">{alert.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pl-6 md:pl-0">
                  <button 
                    onClick={() => setSelectedAlert(selectedAlert?.id === alert.id ? null : alert)}
                    className="bg-slate-800 hover:bg-slate-700 text-white border border-[rgba(255,255,255,0.06)] font-bold text-xs py-2 px-4 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Info size={12} />
                    <span>Details</span>
                  </button>

                  <button 
                    onClick={() => onResolveAlert(alert.id)}
                    className="bg-[#00ff88]/10 hover:bg-[#00ff88] border border-[#00ff88]/20 hover:border-[#00ff88] text-[#00ff88] hover:text-slate-950 font-black text-xs py-2 px-4 rounded-lg transition-all cursor-pointer uppercase tracking-wider"
                  >
                    Resolve
                  </button>
                </div>

                {/* Dropdown details panel */}
                {selectedAlert?.id === alert.id && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="w-full border-t border-[rgba(255,255,255,0.06)] pt-4 mt-4 text-xs text-slate-400 col-span-full"
                  >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-slate-950/60 rounded-lg">
                      <div>
                        <span className="block text-[10px] text-slate-500 uppercase font-black">Mitigation Strategy</span>
                        <span className="font-bold text-slate-300">Null route traffic at border BGP</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-500 uppercase font-black">Assigned Engine</span>
                        <span className="font-bold text-slate-300">Isolation Forest Neural Sub-layer</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-500 uppercase font-black">Threat Actor Fingerprint</span>
                        <span className="font-bold text-slate-300">Botnet scanning client</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-500 uppercase font-black">Confidence Index</span>
                        <span className="font-bold text-[#00ff88]">98.4% Match</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
