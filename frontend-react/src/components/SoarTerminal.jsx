import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Terminal, Shield, Cpu, RefreshCw } from 'lucide-react';

export default function SoarTerminal({ events = [], simulatorActive = true, onToggleSimulator }) {
  const terminalEndRef = useRef(null);

  useEffect(() => {
    // Auto-scroll to bottom of terminal when events change
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [events]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-[rgba(0,255,136,0.15)] bg-[#04060e] p-5 shadow-[0_0_30px_rgba(0,255,136,0.03)] backdrop-blur-xl mb-6 font-mono text-xs"
    >
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5 mr-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
          </div>
          <Terminal className="h-4 w-4 text-[#00ff88]" />
          <span className="text-slate-300 font-semibold tracking-wide text-xs uppercase">SOAR Playbook Execution Ticker</span>
          
          <button
            onClick={() => onToggleSimulator(!simulatorActive)}
            className={`ml-4 px-2 py-0.5 rounded border text-[9px] uppercase font-bold transition-all cursor-pointer ${
              simulatorActive 
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20' 
                : 'bg-[#00ff88]/10 border-[#00ff88]/20 text-[#00ff88] hover:bg-[#00ff88]/20'
            }`}
          >
            {simulatorActive ? 'Pause Engine' : 'Resume Engine'}
          </button>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${simulatorActive ? 'bg-[#00ff88] animate-pulse' : 'bg-amber-500'}`} />
            <span>SOAR ENG: {simulatorActive ? 'ACTIVE' : 'PAUSED'}</span>
          </span>
          <span>|</span>
          <span className="flex items-center gap-1">
            <Shield className="h-3 w-3 text-cyan-400" />
            <span>SHIELD: {simulatorActive ? 'IPS_ENG_ON' : 'IPS_ENG_OFF'}</span>
          </span>
        </div>
      </div>

      {/* Terminal Log Console */}
      <div className="h-48 overflow-y-auto pr-2 space-y-2.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {/* Startup static message */}
        <div className="text-emerald-400/70 leading-relaxed flex items-start gap-2">
          <span className="text-slate-600">[SYSTEM]</span>
          <span>SOAR Security Orchestration & Automated Response engine fully initialized. Monitoring Log Analytics telemetry feeds...</span>
        </div>

        {events.length === 0 ? (
          <div className="text-slate-500 leading-relaxed italic flex items-center gap-2 pt-2">
            <Cpu className={`h-3.5 w-3.5 text-slate-600 ${simulatorActive ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
            <span>{simulatorActive ? 'Standing by. No critical anomalies flagged. Active edge firewall rules in sync.' : 'SOAR Simulator Engine has been paused. Standing by for telemetry wake command.'}</span>
          </div>
        ) : (
          events.map((event, idx) => {
            const timeStr = new Date(event.timestamp).toLocaleTimeString();
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="border-l-2 border-emerald-500 pl-3.5 py-0.5 space-y-1 bg-[rgba(0,255,136,0.01)] rounded-r"
              >
                <div className="flex flex-wrap items-center gap-x-2 text-[#00ff88]">
                  <span className="text-slate-500 font-light">[{timeStr}]</span>
                  <span className="font-extrabold uppercase bg-emerald-500/10 px-1.5 py-0.5 rounded text-[10px] tracking-wider border border-emerald-500/20">
                    Playbook Triggered
                  </span>
                  <span className="text-cyan-400 font-bold">Mitigate_{event.reason}_Attack</span>
                </div>
                <div className="text-slate-300 leading-relaxed">
                  Automatically dynamic-blacklisted attacker IP{' '}
                  <span className="text-rose-400 font-semibold font-mono">{event.ip}</span>. Enforced perimeter drops on destination routes.
                </div>
                <div className="text-[10px] text-cyan-500/80 font-bold flex items-center gap-1.5">
                  <Shield className="h-3 w-3" />
                  <span>ACTION: BLOCK_IP | STATE: APPLIED | PERIMETER_DEFENSE: ENGAGED</span>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={terminalEndRef} />
      </div>

      {/* Decorative scanline overlay */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-[rgba(0,255,136,0.005)] to-transparent opacity-30 animate-pulse" />
    </motion.div>
  );
}
