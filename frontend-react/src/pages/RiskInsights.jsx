import React from 'react';
import GlassCard from '../components/GlassCard';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  Cell
} from 'recharts';
import { BrainCircuit, Cpu, TrendingUp, HelpCircle } from 'lucide-react';

export default function RiskInsights({ data }) {
  const { anomalyHistogram, heatmapData } = data;

  const riskFactors = [
    { factor: 'Port 22 (SSH) login attempts', percentage: 38, count: 184 },
    { factor: 'High frequency requests from single IP', percentage: 28, count: 120 },
    { factor: 'Unknown non-standard protocols', percentage: 18, count: 76 },
    { factor: 'Malformed HTTP payload packets', percentage: 16, count: 48 },
  ];

  const hours = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'];

  const getHeatmapColor = (val) => {
    if (val > 80) return 'bg-rose-500/80 text-white font-bold border-rose-500 shadow-[0_0_12px_rgba(239,68,68,0.4)] animate-pulse';
    if (val > 60) return 'bg-amber-500/60 text-slate-950 font-bold border-amber-500';
    if (val > 40) return 'bg-indigo-500/40 text-white border-indigo-400/20';
    if (val > 20) return 'bg-[#00ff88]/20 text-[#00ff88] border-[#00ff88]/20';
    return 'bg-slate-950/40 text-slate-500 border-transparent';
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Model parameters metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="flex items-center gap-4.5" glowColor="rgba(0, 255, 136, 0.05)">
          <div className="w-11 h-11 rounded-xl bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 flex items-center justify-center">
            <BrainCircuit size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active ML Model</span>
            <span className="text-base font-black text-white mt-0.5">Isolation Forest Ensemble</span>
          </div>
        </GlassCard>

        <GlassCard className="flex items-center gap-4.5" glowColor="rgba(59, 130, 246, 0.05)">
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
            <Cpu size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Model Accuracy</span>
            <span className="text-base font-black text-white mt-0.5">94.2% Confidence</span>
          </div>
        </GlassCard>

        <GlassCard className="flex items-center gap-4.5" glowColor="rgba(168, 85, 247, 0.05)">
          <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
            <TrendingUp size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Target Contamination</span>
            <span className="text-base font-black text-white mt-0.5">15% Sensitivity</span>
          </div>
        </GlassCard>
      </div>

      {/* Anomaly Score Distribution Histogram */}
      <GlassCard>
        <h2 className="text-base font-black text-white tracking-wide mb-4">Anomaly Score Distribution (Histogram)</h2>
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={anomalyHistogram} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <XAxis dataKey="scoreRange" stroke="#64748b" fontSize={10} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(10, 16, 32, 0.9)', 
                  border: '1px solid rgba(255,255,255,0.08)' 
                }} 
              />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <Bar dataKey="normal" name="Normal Sessions" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="anomaly" name="Anomaly Flags" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* Risk Factors & Heatmap Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Risk Factors */}
        <GlassCard>
          <h2 className="text-base font-black text-white tracking-wide mb-4">Top Risk Factors</h2>
          <div className="flex flex-col gap-4.5 mt-2">
            {riskFactors.map((rf, idx) => (
              <div key={idx} className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-300">
                  <span>{rf.factor}</span>
                  <span className="text-[#00ff88]">{rf.percentage}%</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex-grow h-2 bg-slate-900 border border-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-[#00ff88] to-emerald-500 shadow-[0_0_8px_rgba(0,255,136,0.3)] transition-all duration-500"
                      style={{ width: `${rf.percentage}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold tracking-wider">{rf.count} Events</span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Risk Score Heatmap Grid */}
        <GlassCard>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-black text-white tracking-wide">Risk Score Heatmap</h2>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">By Hour of Day</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse text-[10px]">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.06)]">
                  <th className="pb-2 text-slate-400 font-bold uppercase text-left">Day</th>
                  {hours.map(h => (
                    <th key={h} className="pb-2 text-slate-400 font-bold font-mono">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmapData.map((row, idx) => (
                  <tr key={idx} className="border-b border-[rgba(255,255,255,0.02)] last:border-0">
                    <td className="py-2.5 text-left font-bold text-slate-300">{row.day}</td>
                    {hours.map(h => {
                      const val = row[h];
                      return (
                        <td key={h} className="py-2.5 px-0.5">
                          <div className={`w-8.5 h-7.5 rounded flex items-center justify-center font-mono border text-[9px] mx-auto transition-all ${getHeatmapColor(val)}`}>
                            {val}
                          </div>
                        </td>
                      );
                    })}
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
