import React from 'react';
import GlassCard from '../components/GlassCard';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  Legend,
  AreaChart,
  Area,
  CartesianGrid
} from 'recharts';
import { ShieldCheck, Ban, ArrowUpRight } from 'lucide-react';

export default function TrafficAnalytics({ data }) {
  const { traffic24h, portDistribution, allowDeny } = data;

  const donutData = [
    { name: 'Allowed Requests', value: allowDeny.allow, color: '#00ff88' },
    { name: 'Blocked Attacks', value: allowDeny.deny, color: '#ef4444' }
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Network Traffic Analytics Header Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="flex items-center justify-between" glowColor="rgba(0, 255, 136, 0.05)">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Firewall Access</span>
            <span className="text-2xl font-black text-[#00ff88] mt-1 flex items-center gap-1.5">
              <ShieldCheck size={18} /> {allowDeny.allow}% Safe
            </span>
          </div>
        </GlassCard>
        
        <GlassCard className="flex items-center justify-between" glowColor="rgba(239, 68, 68, 0.05)">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Blocked Ratio</span>
            <span className="text-2xl font-black text-rose-500 mt-1 flex items-center gap-1.5">
              <Ban size={18} /> {allowDeny.deny}% Dropped
            </span>
          </div>
        </GlassCard>

        <GlassCard className="flex items-center justify-between" glowColor="rgba(59, 130, 246, 0.05)">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Peak Bandwidth</span>
            <span className="text-2xl font-black text-white mt-1 flex items-center gap-1.5">
              <ArrowUpRight size={18} className="text-blue-400" /> 14.8 Gbps
            </span>
          </div>
        </GlassCard>
      </div>

      {/* Traffic Volume (Line Chart - 24hrs) */}
      <GlassCard>
        <h2 className="text-base font-black text-white tracking-wide mb-4">Traffic Volume (Line Chart - 24hrs)</h2>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={traffic24h} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(10, 16, 32, 0.9)', 
                  border: '1px solid rgba(255,255,255,0.08)' 
                }} 
              />
              <Line type="monotone" dataKey="volume" stroke="#00ff88" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* Port Distribution & Donut Ratio Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Port Distribution (Horizontal Bar Chart) */}
        <GlassCard>
          <h2 className="text-base font-black text-white tracking-wide mb-4">Port Distribution</h2>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={portDistribution}
                layout="vertical"
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
              >
                <XAxis type="number" stroke="#64748b" fontSize={9} tickLine={false} />
                <YAxis dataKey="port" type="category" stroke="#64748b" fontSize={10} width={100} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(10, 16, 32, 0.9)', 
                    border: '1px solid rgba(255,255,255,0.08)' 
                  }} 
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Allow vs Deny Ratio (Donut Chart) */}
        <GlassCard>
          <h2 className="text-base font-black text-white tracking-wide mb-4">Allow vs Deny Ratio</h2>
          <div className="h-[240px] flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(10, 16, 32, 0.9)', 
                    border: '1px solid rgba(255,255,255,0.08)' 
                  }} 
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* Packets/sec Timeline & Bytes Transferred Chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard>
          <h2 className="text-base font-black text-white tracking-wide mb-4">Packets/sec Timeline</h2>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={traffic24h} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="time" stroke="#64748b" fontSize={9} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={9} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(10, 16, 32, 0.9)', 
                    border: '1px solid rgba(255,255,255,0.08)' 
                  }} 
                />
                <Area type="monotone" dataKey="packets" stroke="#3b82f6" fill="rgba(59, 130, 246, 0.05)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard>
          <h2 className="text-base font-black text-white tracking-wide mb-4">Bytes Transferred Chart (MB)</h2>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={traffic24h} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="time" stroke="#64748b" fontSize={9} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={9} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(10, 16, 32, 0.9)', 
                    border: '1px solid rgba(255,255,255,0.08)' 
                  }} 
                />
                <Area type="monotone" dataKey="bytes" stroke="#a855f7" fill="rgba(168, 85, 247, 0.05)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
