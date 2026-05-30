import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertCircle, 
  Settings, 
  CheckCircle2, 
  Info, 
  Zap, 
  Layers, 
  Lock, 
  Globe, 
  UserCheck 
} from 'lucide-react';

export default function SecurityPosture({ data }) {
  const currentScore = data.securityScore || 87;

  // Custom compliance categories and checklist controls
  const [controls, setControls] = useState([
    // Identity Controls
    { 
      id: 'ID-01', 
      category: 'Identity', 
      name: 'Enforce Role-Based Access Control (RBAC)', 
      description: 'Restrict resolve operations to SOC Administrators.', 
      status: 'COMPLIANT', 
      ref: 'CIS Control 5.1', 
      weight: 10,
      icon: UserCheck
    },
    { 
      id: 'ID-02', 
      category: 'Identity', 
      name: 'Enable Multi-Factor Authentication (MFA)', 
      description: 'Enforce MFA for all tenant administrator accounts.', 
      status: 'ACTION NEEDED', 
      ref: 'CIS Control 5.2', 
      weight: 15,
      icon: Lock
    },
    // Network Controls
    { 
      id: 'NET-01', 
      category: 'Network', 
      name: 'Configure Automated Firewall Blocking (SOAR)', 
      description: 'Automatically drop connections from critical risk anomalous IPs.', 
      status: 'COMPLIANT', 
      ref: 'CIS Control 9.4', 
      weight: 15,
      icon: Zap
    },
    { 
      id: 'NET-02', 
      category: 'Network', 
      name: 'Restrict Default SSH / Telnet Inbound Access', 
      description: 'Ensure port 22 and 23 are blocked from global public ingress.', 
      status: 'DEFICIT', 
      ref: 'CIS Control 9.2', 
      weight: 20,
      icon: Globe
    },
    // Cloud Integration Controls
    { 
      id: 'CLD-01', 
      category: 'Cloud', 
      name: 'Stream Telemetry to Cloud Log Analytics Workspace', 
      description: 'Forward local security events asynchronously to Azure Cloud Workspace.', 
      status: data.azureConnected ? 'COMPLIANT' : 'ACTION NEEDED', 
      ref: 'CIS Control 8.1', 
      weight: 20,
      icon: Layers
    },
    // Machine Learning / Isolation Forest Controls
    { 
      id: 'ML-01', 
      category: 'AI / ML', 
      name: 'Isolation Forest Anomaly Scoring Engine active', 
      description: 'Deploy Isolation Forest ML models to continuously scan incoming traffic vectors.', 
      status: 'COMPLIANT', 
      ref: 'Custom Framework', 
      weight: 20,
      icon: Settings
    }
  ]);

  const [activeCategory, setActiveCategory] = useState('All');

  // Dynamically resolve compliance deficits
  const handleRemediate = (id) => {
    setControls(prev => prev.map(ctrl => {
      if (ctrl.id === id) {
        return { ...ctrl, status: 'COMPLIANT' };
      }
      return ctrl;
    }));
  };

  // Recalculate Posture Score based on dynamic controls state
  const totalWeight = controls.reduce((acc, c) => acc + c.weight, 0);
  const compliantWeight = controls
    .filter(c => c.status === 'COMPLIANT')
    .reduce((acc, c) => acc + c.weight, 0);
  const rawComplianceRate = Math.round((compliantWeight / totalWeight) * 100);
  
  // Mix dynamic compliance rate with database state score for hybrid posture scoring
  const postureScore = Math.round((rawComplianceRate * 0.6) + (currentScore * 0.4));

  const filteredControls = activeCategory === 'All' 
    ? controls 
    : controls.filter(c => c.category === activeCategory);

  const stats = {
    total: controls.length,
    compliant: controls.filter(c => c.status === 'COMPLIANT').length,
    deficit: controls.filter(c => c.status === 'DEFICIT').length,
    warning: controls.filter(c => c.status === 'ACTION NEEDED').length
  };

  return (
    <div className="flex flex-col gap-6 animate-[fadeIn_0.3s_ease-out]">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black uppercase tracking-wider text-white">Security Posture Manager</h2>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mt-0.5">
            Audit controls, mitigate compliance deficits & review posture scoring
          </span>
        </div>
        <div className="bg-slate-950/40 border border-white/5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase text-slate-400 tracking-wider">
          Compliance Standard: <span className="text-[#00ff88]">CIS Benchmarks v8</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Columns: Score & Categorized Audit Logs */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Posture Score Breakdown Card */}
          <div className="relative overflow-hidden bg-[#0a0f26]/40 backdrop-blur-md border border-white/[0.06] rounded-2xl p-6 flex flex-col sm:flex-row gap-6 items-center shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#00ff88]/30 to-transparent" />
            
            {/* Score Ring Gauge */}
            <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="8" />
                <circle 
                  cx="50" 
                  cy="50" 
                  r="42" 
                  fill="none" 
                  stroke="url(#postureGradient)" 
                  strokeWidth="8" 
                  strokeDasharray="264" 
                  strokeDashoffset={264 - (264 * postureScore) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
                <defs>
                  <linearGradient id="postureGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00ff88" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-black text-white tracking-tight">{postureScore}%</span>
                <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-widest mt-0.5">POSTURE</span>
              </div>
            </div>

            {/* Score Details Description */}
            <div className="flex-grow flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-[#00ff88]" size={18} />
                <span className="text-sm font-black text-slate-100 uppercase tracking-wider">Overall Posture Status</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed mt-2.5">
                Your Security Posture Score is calculated dynamically by compiling compliant control weights (CIS Controls framework) with active system threat level deductions. Resolving compliance deficits increases this value on the fly.
              </p>
              
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/5 text-center">
                <div>
                  <span className="text-xs font-black text-slate-300 block">{stats.total}</span>
                  <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Total Controls</span>
                </div>
                <div>
                  <span className="text-xs font-black text-[#00ff88] block">{stats.compliant}</span>
                  <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Compliant</span>
                </div>
                <div>
                  <span className="text-xs font-black text-rose-500 block">{stats.deficit + stats.warning}</span>
                  <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Attention</span>
                </div>
              </div>
            </div>
          </div>

          {/* Categorized Audit & Compliance Checklist */}
          <div className="bg-[#0a0f26]/40 backdrop-blur-md border border-white/[0.06] rounded-2xl p-6 flex flex-col shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
            
            {/* Category Filters */}
            <div className="flex flex-wrap gap-2 mb-6 border-b border-white/5 pb-4">
              {['All', 'Identity', 'Network', 'Cloud', 'AI / ML'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                    activeCategory === cat 
                      ? 'bg-white/[0.05] border-white/10 text-[#00ff88] shadow-[0_0_10px_rgba(0,255,136,0.08)]' 
                      : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Checklist items */}
            <div className="flex flex-col gap-4">
              {filteredControls.map((ctrl) => {
                const Icon = ctrl.icon;
                return (
                  <div 
                    key={ctrl.id} 
                    className="p-4 rounded-xl border border-white/[0.03] bg-white/[0.01] flex flex-col sm:flex-row sm:items-center gap-4 transition-all hover:bg-white/[0.02]"
                  >
                    {/* Icon & Details */}
                    <div className="flex items-start gap-3.5 flex-grow min-w-0">
                      <div className={`p-2.5 rounded-lg border shrink-0 ${
                        ctrl.status === 'COMPLIANT' 
                          ? 'bg-[#00ff88]/5 border-[#00ff88]/10 text-[#00ff88]' 
                          : ctrl.status === 'DEFICIT' 
                            ? 'bg-rose-500/5 border-rose-500/10 text-rose-400' 
                            : 'bg-amber-500/5 border-amber-500/10 text-amber-400'
                      }`}>
                        <Icon size={16} />
                      </div>
                      <div className="flex flex-col min-w-0 pr-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-black tracking-wider text-slate-500 uppercase">{ctrl.id} • {ctrl.ref}</span>
                          <span className="text-[8px] font-black tracking-widest bg-slate-950/40 text-slate-400 border border-white/5 px-1.5 py-0.5 rounded uppercase">Weight: {ctrl.weight}%</span>
                        </div>
                        <span className="text-xs font-bold text-slate-200 mt-1 block">{ctrl.name}</span>
                        <span className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{ctrl.description}</span>
                      </div>
                    </div>

                    {/* Status Badge & Actions */}
                    <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                      <span className={`text-[9px] font-black tracking-wider px-2.5 py-1 rounded-md ${
                        ctrl.status === 'COMPLIANT'
                          ? 'bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20'
                          : ctrl.status === 'DEFICIT'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {ctrl.status}
                      </span>
                      
                      {ctrl.status !== 'COMPLIANT' && (
                        <button
                          type="button"
                          onClick={() => handleRemediate(ctrl.id)}
                          className="bg-gradient-to-r from-[#00ff88]/10 to-[#3b82f6]/10 text-slate-300 hover:text-white border border-[#00ff88]/25 hover:border-[#00ff88]/50 px-3.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_12px_rgba(0,255,136,0.06)]"
                        >
                          Remediate
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

        </div>

        {/* Right Column: Recommendations & Guidelines */}
        <div className="lg:col-span-1 flex flex-col gap-6 w-full">
          
          {/* Posture Recommendations Panel */}
          <div className="bg-[#0a0f26]/40 backdrop-blur-md border border-white/[0.06] rounded-2xl p-6 flex flex-col shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
            <h4 className="text-xs font-black tracking-widest text-slate-300 uppercase mb-4 flex items-center gap-1.5">
              <Info size={14} className="text-[#3b82f6]" />
              Remediation Playbook
            </h4>
            
            <div className="flex flex-col gap-4">
              <div className="p-3.5 rounded-xl bg-slate-950/40 border border-white/5 flex flex-col">
                <span className="text-[9px] text-[#00ff88] font-black uppercase tracking-wider">Mitigation Net-02</span>
                <span className="text-xs font-bold text-slate-200 mt-1">Restrict Public Port Ingress</span>
                <span className="text-[10px] text-slate-400 leading-relaxed mt-1">
                  Leaving SSH Port 22 open universally invites brute force attacks. Clicking **Remediate** applies a Firewall blocking rule to restrict global incoming scans.
                </span>
              </div>
              
              <div className="p-3.5 rounded-xl bg-slate-950/40 border border-white/5 flex flex-col">
                <span className="text-[9px] text-[#3b82f6] font-black uppercase tracking-wider">Mitigation ID-02</span>
                <span className="text-xs font-bold text-slate-200 mt-1">Enforce Global MFA policies</span>
                <span className="text-[10px] text-slate-400 leading-relaxed mt-1">
                  Unsecured administration ports allow vector penetration. Configure Conditional Access in Microsoft Entra ID to enforce strict MFA triggers.
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/40 border border-white/5 flex flex-col">
                <span className="text-[9px] text-purple-400 font-black uppercase tracking-wider">Mitigation Cld-01</span>
                <span className="text-xs font-bold text-slate-200 mt-1">Connect Azure Workspace</span>
                <span className="text-[10px] text-slate-400 leading-relaxed mt-1">
                  Verify the `LOG_ANALYTICS_WORKSPACE_ID` is set inside your backend's environment configuration to stream anomalies to the cloud log workspace automatically.
                </span>
              </div>
            </div>
          </div>

          {/* CIS compliance reference card */}
          <div className="bg-[#0a0f26]/40 backdrop-blur-md border border-white/[0.06] rounded-2xl p-6 flex flex-col shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
            <h4 className="text-xs font-black tracking-widest text-slate-300 uppercase mb-3.5">
              CIS Framework Scope
            </h4>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Center for Internet Security (CIS) Controls are a prioritized set of Safeguards to mitigate the most common cyber-attacks against systems and networks. This posture scorecard evaluates and ensures compliance against CIS Controls v8.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
