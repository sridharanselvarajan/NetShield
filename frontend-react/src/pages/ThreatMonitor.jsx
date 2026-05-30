import React, { useState } from 'react';
import GlassCard from '../components/GlassCard';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  LineChart,
  Line,
  CartesianGrid,
  Cell
} from 'recharts';
import { ShieldAlert, Download, SlidersHorizontal, AlertTriangle, ShieldCheck, Terminal, Copy, Check, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SoarTerminal from '../components/SoarTerminal';

export default function ThreatMonitor({ 
  data, 
  onResolveAlert, 
  soarEvents = [], 
  simulatorActive = true, 
  onToggleSimulator 
}) {
  const { activeThreats, threat7d } = data;
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [isolatingThreat, setIsolatingThreat] = useState(null);
  const [copied, setCopied] = useState(false);

  // Calculate attack type distribution counts from live threats
  const getAttackTypeDistribution = () => {
    const distribution = {};
    activeThreats.forEach(t => {
      distribution[t.type] = (distribution[t.type] || 0) + 1;
    });
    return Object.entries(distribution).map(([name, value]) => ({
      name,
      Threats: value,
    }));
  };

  const attackData = getAttackTypeDistribution();

  const filteredThreats = activeThreats.filter(t => 
    filterSeverity === 'ALL' ? true : t.severity === filterSeverity
  );

  const handleExport = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(activeThreats, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `netshield_active_threats_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* SOAR Playbook Execution Terminal Log */}
      <SoarTerminal 
        events={soarEvents} 
        simulatorActive={simulatorActive} 
        onToggleSimulator={onToggleSimulator} 
      />

      {/* Active Threats Table Card */}
      <GlassCard glowColor="rgba(239, 68, 68, 0.06)">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="text-rose-500 animate-pulse" size={20} />
            <h2 className="text-lg font-black text-white tracking-wide">Live Threat Logs</h2>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Severity Filter */}
            <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-1.5">
              <SlidersHorizontal size={12} className="text-slate-400" />
              <select 
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="bg-transparent text-xs text-white outline-none border-none cursor-pointer font-bold"
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
              </select>
            </div>

            <button 
              onClick={handleExport}
              className="bg-slate-800 hover:bg-slate-700 hover:text-[#00ff88] text-white border border-[rgba(255,255,255,0.06)] px-4 py-1.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <Download size={12} />
              <span>Export Reports</span>
            </button>
          </div>
        </div>

        {/* Live List */}
        <div className="flex flex-col gap-3.5 max-h-[350px] overflow-y-auto pr-1.5">
          <AnimatePresence mode="popLayout">
            {filteredThreats.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-12 text-slate-500 gap-2"
              >
                <ShieldCheck className="text-[#00ff88]" size={36} />
                <span className="text-xs font-black uppercase tracking-widest text-[#00ff88]">Zero threats matching filter</span>
              </motion.div>
            ) : (
              filteredThreats.map((threat) => (
                <motion.div
                  key={threat.id}
                  layoutId={threat.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-slate-950/40 border border-slate-900/60 p-4.5 rounded-xl flex justify-between items-center hover:border-slate-800/80 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <span className={`text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded border ${
                      threat.severity === 'CRITICAL' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                      threat.severity === 'HIGH' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                      'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                    }`}>
                      {threat.severity}
                    </span>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-3.5">
                        <span className="text-sm font-bold text-white font-mono">{threat.ip}</span>
                        <span className="text-xs font-semibold text-slate-400">{threat.type}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">Port Destination: <strong className="font-mono">{threat.port}</strong> | {threat.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-bold text-slate-500">{threat.time}</span>
                    <button 
                      onClick={() => setIsolatingThreat(threat)}
                      className="bg-rose-500/10 hover:bg-rose-500 border border-rose-500/30 hover:border-rose-500 text-rose-400 hover:text-slate-950 font-black text-[10px] py-1.5 px-3.5 rounded-lg cursor-pointer transition-all uppercase tracking-wider"
                    >
                      Isolate
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </GlassCard>

      {/* Row with distribution bar chart & timeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Attack Type Distribution (Bar Chart) */}
        <GlassCard>
          <h2 className="text-base font-black text-white tracking-wide mb-4">Attack Type Distribution</h2>
          <div className="h-[240px]">
            {attackData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-500 text-xs uppercase font-bold">No data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attackData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(10, 16, 32, 0.9)', 
                      border: '1px solid rgba(255,255,255,0.08)' 
                    }} 
                  />
                  <Bar dataKey="Threats" fill="#facc15" radius={[4, 4, 0, 0]}>
                    {attackData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={idx % 2 === 0 ? '#00ff88' : '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>

        {/* Threat Timeline (Last 7 days) */}
        <GlassCard>
          <h2 className="text-base font-black text-white tracking-wide mb-4">Threat Timeline (Last 7 Days)</h2>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={threat7d} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(10, 16, 32, 0.9)', 
                    border: '1px solid rgba(255,255,255,0.08)' 
                  }} 
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                <Line type="monotone" dataKey="Critical" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="High" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Medium" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* SOAR Automated Remediation Modal */}
      <AnimatePresence>
        {isolatingThreat && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.08)] bg-slate-905 bg-[rgba(15,22,40,0.95)] p-7 shadow-2xl backdrop-blur-xl"
            >
              <div className="flex items-center gap-3.5 mb-6">
                <div className="w-11 h-11 rounded-xl bg-[#00ff88]/10 border border-[#00ff88]/20 flex items-center justify-center text-[#00ff88]">
                  <Terminal size={20} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Azure SOAR Incident Responder</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Automated Inbound Firewall Rule Generator</p>
                </div>
              </div>

              <div className="bg-slate-950/40 rounded-xl p-4.5 border border-slate-900/60 flex flex-col gap-3 mb-6 text-xs">
                <div className="flex justify-between border-b border-slate-900/60 pb-2">
                  <span className="text-slate-500 font-bold uppercase">Attack Pattern</span>
                  <span className="text-white font-mono font-bold uppercase">{isolatingThreat.type}</span>
                </div>
                <div className="flex justify-between border-b border-slate-900/60 pb-2">
                  <span className="text-slate-500 font-bold uppercase">Malicious Target</span>
                  <span className="text-indigo-400 font-mono font-bold">{isolatingThreat.ip} : {isolatingThreat.port}</span>
                </div>
                <div className="flex justify-between pb-1">
                  <span className="text-slate-500 font-bold uppercase">Remediation Action</span>
                  <span className="text-rose-500 font-bold uppercase">Deny Inbound Traffic (NSG Rule)</span>
                </div>
              </div>

              {/* Azure CLI Rule Code block */}
              <div className="flex flex-col gap-2 mb-6">
                <span className="text-[10px] text-slate-500 font-black tracking-wider uppercase">Generated Azure CLI Firewall Command:</span>
                <div className="relative bg-slate-950/60 p-4 rounded-xl border border-slate-900 font-mono text-[10px] text-slate-300 select-all pr-12 leading-relaxed">
                  <code>
                    az network nsg rule create \<br />
                    &nbsp;&nbsp;--resource-group NetShieldRG \<br />
                    &nbsp;&nbsp;--nsg-name NetShieldNSG \<br />
                    &nbsp;&nbsp;--name Block-{isolatingThreat.ip.replace(/\./g, '-')}-{isolatingThreat.port} \<br />
                    &nbsp;&nbsp;--priority 100 \<br />
                    &nbsp;&nbsp;--source-address-prefixes {isolatingThreat.ip} \<br />
                    &nbsp;&nbsp;--destination-port-ranges "*" \<br />
                    &nbsp;&nbsp;--access Deny \<br />
                    &nbsp;&nbsp;--direction Inbound
                  </code>

                  <button
                    onClick={() => {
                      const cmd = `az network nsg rule create --resource-group NetShieldRG --nsg-name NetShieldNSG --name Block-${isolatingThreat.ip.replace(/\./g, '-')}-${isolatingThreat.port} --priority 100 --source-address-prefixes ${isolatingThreat.ip} --destination-port-ranges "*" --access Deny --direction Inbound`;
                      navigator.clipboard.writeText(cmd);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="absolute right-3.5 top-3.5 w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer transition-colors"
                  >
                    {copied ? <Check size={12} className="text-[#00ff88]" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 text-xs font-bold">
                <button
                  onClick={() => setIsolatingThreat(null)}
                  className="bg-transparent hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white py-2.5 px-5 rounded-xl cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onResolveAlert(isolatingThreat.id);
                    setIsolatingThreat(null);
                  }}
                  className="bg-rose-600 hover:bg-rose-500 text-white py-2.5 px-6 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg transition-all"
                >
                  <ShieldCheck size={14} />
                  <span>Confirm Isolation</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
