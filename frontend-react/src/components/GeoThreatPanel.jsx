import React from 'react';
import GlassCard from './GlassCard';
import { ShieldAlert, AlertTriangle, Globe } from 'lucide-react';

export default function GeoThreatPanel({ activeThreats, topSuspiciousIPs }) {
  // Aggregate attack volume by country/region
  const regionCounts = {};
  activeThreats.forEach(t => {
    const region = t.region || t.country || 'Unknown';
    regionCounts[region] = (regionCounts[region] || 0) + 1;
  });

  const sortedRegions = Object.entries(regionCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Country Leaderboard */}
      <GlassCard className="p-5 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Globe size={16} />
          </div>
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider">Origin Leaderboard</h3>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mt-0.5">
              Threat volumes ranked by country
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 mt-2">
          {sortedRegions.length > 0 ? (
            sortedRegions.slice(0, 5).map((region, idx) => {
              // Map country flags
              const flagCode = region.name === 'Russia' ? '🇷🇺' : region.name === 'Germany' ? '🇩🇪' : region.name === 'Singapore' ? '🇸🇬' : region.name === 'Iran' ? '🇮🇷' : region.name === 'Ukraine' ? '🇺🇦' : region.name === 'China' ? '🇨🇳' : '🏳️';
              return (
                <div key={idx} className="flex items-center justify-between bg-slate-950/20 border border-white/[0.03] px-3.5 py-3 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-lg leading-none">{flagCode}</span>
                    <span className="text-xs font-bold text-slate-300">{region.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 font-black tracking-wider uppercase">Threats:</span>
                    <span className="text-xs font-black text-rose-500 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md">
                      {region.count}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-[11px] font-semibold text-slate-500 italic text-center py-4">
              No live threat origins recorded.
            </p>
          )}
        </div>
      </GlassCard>

      {/* Suspicious IP List */}
      <GlassCard className="p-5 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <ShieldAlert size={16} />
          </div>
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider">Top External Targets</h3>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mt-0.5">
              High-Risk IPs currently flagged by SOC
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 mt-2">
          {topSuspiciousIPs && topSuspiciousIPs.length > 0 ? (
            topSuspiciousIPs.slice(0, 4).map((row, idx) => {
              const flagCode = row.ip.startsWith('185.220.') ? '🇷🇺' : row.ip.startsWith('45.33.') ? '🇺🇸' : row.ip.startsWith('167.99.') ? '🇩🇪' : row.ip.startsWith('178.128.') ? '🇸🇬' : row.ip.startsWith('194.165.') ? '🇮🇷' : '🏳️';
              return (
                <div key={idx} className="flex items-center justify-between bg-slate-950/20 border border-white/[0.03] p-3 rounded-xl">
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-200 truncate">{row.ip}</span>
                      <span className="text-xs">{flagCode}</span>
                    </div>
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider truncate">
                      Hits: {row.count} | Region: {row.region}
                    </span>
                  </div>
                  <div className={`px-2 py-1 rounded-md text-[10px] font-black border uppercase tracking-wider flex items-center gap-1 ${
                    row.threat_level === 'CRITICAL' 
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_8px_rgba(239,68,68,0.1)]' 
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    <AlertTriangle size={10} />
                    <span>{row.threat_level}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-[11px] font-semibold text-slate-500 italic text-center py-4">
              No high-risk suspicious IPs detected.
            </p>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
