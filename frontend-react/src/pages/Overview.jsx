import React from 'react';
import GlassCard from '../components/GlassCard';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { 
  ShieldAlert, 
  Activity, 
  Globe, 
  ShieldCheck, 
  TrendingUp, 
  AlertTriangle 
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Overview({ data, onResolveAlert }) {
  const { 
    securityScore, 
    totalThreats, 
    trafficToday, 
    threatLevel, 
    traffic24h, 
    protocolBreakdown, 
    topSuspiciousIPs,
    activeThreats 
  } = data;

  const getThreatLevelColor = (level) => {
    switch (level?.toUpperCase()) {
      case 'CRITICAL':
        return 'text-rose-500 bg-rose-500/10 border-rose-500/30';
      case 'ELEVATED':
      case 'HIGH':
        return 'text-amber-500 bg-amber-500/10 border-amber-500/30';
      case 'MEDIUM':
        return 'text-indigo-400 bg-indigo-400/10 border-indigo-400/30';
      default:
        return 'text-[#00ff88] bg-[#00ff88]/10 border-[#00ff88]/30';
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Security Score Card */}
        <GlassCard glowColor="rgba(0, 255, 136, 0.08)">
          <div className="flex justify-between items-center h-full">
            <div className="flex flex-col">
              <span className="text-xs text-slate-400 font-bold tracking-wider uppercase">Security Score</span>
              <h3 className="text-3xl font-black mt-2 text-white">{securityScore}/100</h3>
              <span className="text-[10px] text-[#00ff88] font-bold mt-1.5 flex items-center gap-1">
                <ShieldCheck size={12} /> Systems Protected
              </span>
            </div>
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                <path className="fill-none stroke-[rgba(255,255,255,0.03)] stroke-[3.5]" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"></path>
                <path className="fill-none stroke-[3.5] stroke-[#00ff88] stroke-linecap-round transition-all duration-[0.8s]" strokeDasharray={`${securityScore}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"></path>
              </svg>
              <span className="absolute text-xs font-black text-white">{securityScore}%</span>
            </div>
          </div>
        </GlassCard>

        {/* Active Threats */}
        <GlassCard glowColor="rgba(239, 68, 68, 0.08)">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-rose-500/10 text-rose-500 border border-rose-500/20">
              <ShieldAlert className="animate-pulse" size={22} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-slate-400 font-bold tracking-wider uppercase">Active Threats</span>
              <h3 className="text-3xl font-black mt-1 text-white">{totalThreats}</h3>
              <span className="text-[10px] text-rose-400 font-bold mt-1">Requires Mitigation</span>
            </div>
          </div>
        </GlassCard>

        {/* Traffic Today */}
        <GlassCard glowColor="rgba(59, 130, 246, 0.08)">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Activity size={22} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-slate-400 font-bold tracking-wider uppercase">Traffic Today</span>
              <h3 className="text-3xl font-black mt-1 text-white">{trafficToday}</h3>
              <span className="text-[10px] text-blue-400 font-bold mt-1 flex items-center gap-1">
                <TrendingUp size={12} /> Packets streaming
              </span>
            </div>
          </div>
        </GlassCard>

        {/* Threat Level */}
        <GlassCard glowColor="rgba(245, 158, 11, 0.08)">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <AlertTriangle className="animate-bounce" size={22} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-slate-400 font-bold tracking-wider uppercase">Threat Level</span>
              <span className={`text-[12px] font-black tracking-widest uppercase border py-1 px-2.5 rounded-lg mt-1.5 inline-block text-center ${getThreatLevelColor(threatLevel)}`}>
                {threatLevel}
              </span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Traffic Area Chart (last 24hrs) */}
      <GlassCard className="w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-black text-white tracking-wide">Live Traffic Timeline (Last 24hrs)</h2>
          <span className="text-slate-400 text-xs font-semibold">Real-time metrics (K Req/s)</span>
        </div>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={traffic24h} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00ff88" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#00ff88" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(10, 16, 32, 0.9)', 
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  color: '#fff' 
                }} 
              />
              <Area type="monotone" dataKey="volume" stroke="#00ff88" strokeWidth={3} fillOpacity={1} fill="url(#colorVolume)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* Pie Chart & Suspicious IPs Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Protocol Breakdown (Pie Chart) */}
        <GlassCard className="col-span-1">
          <h2 className="text-base font-black text-white tracking-wide mb-4">Protocol Breakdown</h2>
          <div className="h-[220px] flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={protocolBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {protocolBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(10, 16, 32, 0.9)', 
                    border: '1px solid rgba(255,255,255,0.08)' 
                  }} 
                />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Top Suspicious IPs Table */}
        <GlassCard className="col-span-2">
          <h2 className="text-base font-black text-white tracking-wide mb-4">Top Suspicious IPs</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.06)] text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3 px-3">IP Address</th>
                  <th className="pb-3 px-3">Region</th>
                  <th className="pb-3 px-3">Telemetry Requests</th>
                  <th className="pb-3 px-3">Risk Index</th>
                  <th className="pb-3 px-3">Threat Badge</th>
                </tr>
              </thead>
              <tbody>
                {topSuspiciousIPs.map((ipRow, idx) => (
                  <tr key={idx} className="border-b border-[rgba(255,255,255,0.03)] last:border-0 hover:bg-[rgba(255,255,255,0.015)] transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-indigo-400">{ipRow.ip}</td>
                    <td className="py-3 px-3 text-slate-300 flex items-center gap-1">
                      <Globe size={12} className="text-slate-500" /> {ipRow.region}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-400">{ipRow.count.toLocaleString()}</td>
                    <td className="py-3 px-3 font-mono font-bold text-[#00ff88]">{ipRow.risk_score}%</td>
                    <td className="py-3 px-3">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${
                        ipRow.threat_level === 'CRITICAL' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse' :
                        ipRow.threat_level === 'HIGH' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                      }`}>
                        {ipRow.threat_level}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
