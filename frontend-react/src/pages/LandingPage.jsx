import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, 
  Activity, 
  Globe, 
  Terminal, 
  BrainCircuit, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  ArrowRight, 
  ChevronRight, 
  Server, 
  CheckCircle2, 
  Cpu, 
  Layers, 
  Radio, 
  Play, 
  BarChart3, 
  Database, 
  Cloud, 
  User, 
  Lock,
  Radar,
  ArrowUpRight,
  Shield,
  Eye,
  Crosshair
} from 'lucide-react';

export default function LandingPage({ onLaunchDashboard, onOpenLogin, onDemoLogin }) {
  const [activeTab, setActiveTab] = useState('all');
  const [simulatedAlerts, setSimulatedAlerts] = useState([
    { id: 1, type: 'SSH BRUTE FORCE', severity: 'CRITICAL', ip: '194.26.29.112', country: 'RU', time: 'JUST NOW', status: 'MITIGATED (SOAR)' },
    { id: 2, type: 'SQL INJECTION VECTOR', severity: 'HIGH', ip: '45.146.164.88', country: 'CN', time: '2s ago', status: 'BLOCKED' },
    { id: 3, type: 'DDOS SYN FLOOD', severity: 'CRITICAL', ip: '185.220.101.5', country: 'DE', time: '5s ago', status: 'QUARANTINED' },
    { id: 4, type: 'DATA EXFILTRATION', severity: 'HIGH', ip: '82.102.23.14', country: 'US', time: '12s ago', status: 'ANALYZING' }
  ]);
  const [liveScore, setLiveScore] = useState(96);

  // Dynamic telemetry simulator ticker
  useEffect(() => {
    const interval = setInterval(() => {
      const types = ['PORT SCAN DETECTED', 'ANOMALOUS TCP BURST', 'RDP BRUTE FORCE', 'MALICIOUS BEACON'];
      const countries = ['RU', 'DE', 'CN', 'US', 'NL', 'BR'];
      const severities = ['HIGH', 'CRITICAL', 'MEDIUM'];
      const randomType = types[Math.floor(Math.random() * types.length)];
      const randomCountry = countries[Math.floor(Math.random() * countries.length)];
      const randomSev = severities[Math.floor(Math.random() * severities.length)];
      const randomIp = `${Math.floor(Math.random() * 200 + 10)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;

      const newAlert = {
        id: Date.now(),
        type: randomType,
        severity: randomSev,
        ip: randomIp,
        country: randomCountry,
        time: 'JUST NOW',
        status: 'MITIGATED (SOAR)'
      };

      setSimulatedAlerts(prev => [newAlert, ...prev.slice(0, 4)]);
      setLiveScore(prev => Math.max(85, Math.min(99, prev + (Math.random() > 0.5 ? 1 : -1))));
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: BrainCircuit,
      title: "Real-Time AI Anomaly Detection",
      badge: "ML Engine",
      color: "from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400",
      description: "Sub-millisecond traffic vector scoring powered by Isolation Forest & Random Forest models. Detects stealthy DDoS, brute-forcing, and exfiltration attempts instantly."
    },
    {
      icon: Globe,
      title: "Geographic IP Threat Mapping",
      badge: "Real-Time GeoIP",
      color: "from-blue-500/20 to-indigo-500/10 border-blue-500/30 text-blue-400",
      description: "Interactive Leaflet geospatial visualizer projecting live attack sources globally. Analyzes country-level threat risk metrics with dynamic risk scoring."
    },
    {
      icon: ShieldAlert,
      title: "SOAR Automated Response",
      badge: "Zero-Trust SOAR",
      color: "from-rose-500/20 to-orange-500/10 border-rose-500/30 text-rose-400",
      description: "Automated playbook execution. Instant IP blocklisting, automated quarantine protocols, and firewall rules dispatch without human delay."
    },
    {
      icon: Sparkles,
      title: "AI KQL Copilot for SIEM",
      badge: "LLM Intelligence",
      color: "from-purple-500/20 to-pink-500/10 border-purple-500/30 text-purple-400",
      description: "Natural language query translation for Kusto Query Language (KQL). Effortlessly hunt threats across millions of security logs with AI assist."
    },
    {
      icon: Cloud,
      title: "Azure Sentinel Integration",
      badge: "Cloud SIEM Sync",
      color: "from-cyan-500/20 to-blue-500/10 border-cyan-500/30 text-cyan-400",
      description: "Seamless synchronization with Microsoft Azure Sentinel & Log Analytics workspaces. Unified cloud & hybrid infrastructure defense."
    },
    {
      icon: Lock,
      title: "Enterprise RBAC Enforcement",
      badge: "Multi-Role SOC",
      color: "from-amber-500/20 to-yellow-500/10 border-amber-500/30 text-amber-400",
      description: "Strict Role-Based Access Controls dividing SOC Administrators and Security Analysts. Secure threat resolution and audit logging."
    }
  ];

  const workflowSteps = [
    {
      step: "01",
      title: "Packet Ingestion & Log Stream",
      desc: "Raw NetFlow, Syslog, and HTTP packet data are continuously ingested via FastAPI WebSockets.",
      icon: Radio
    },
    {
      step: "02",
      title: "Machine Learning Vector Analysis",
      desc: "ML model evaluates entropy, packet size ratio, port variance, and frequency to score risk (0-100).",
      icon: Cpu
    },
    {
      step: "03",
      title: "SOAR Trigger & Threat Mitigation",
      desc: "High-severity vectors activate automated SOAR playbooks to quarantine malicious endpoints.",
      icon: Zap
    },
    {
      step: "04",
      title: "SOC Dashboard & Azure SIEM Sync",
      desc: "Analyst dashboard updates live while event payloads are mirrored to Azure Log Analytics.",
      icon: BarChart3
    }
  ];

  const stats = [
    { value: "< 5ms", label: "AI Threat Inference Latency", color: "text-[#00ff88]" },
    { value: "99.8%", label: "Anomaly Detection Accuracy", color: "text-blue-400" },
    { value: "24/7", label: "Autonomous SOAR Protection", color: "text-purple-400" },
    { value: "100%", label: "Zero-Trust RBAC Compliance", color: "text-amber-400" }
  ];

  return (
    <div className="min-h-screen bg-[#040612] text-[#f8fafc] font-sans antialiased overflow-x-hidden selection:bg-[#00ff88]/30 selection:text-[#00ff88] relative">
      
      {/* Background Lighting & Grid Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-[#00ff88] rounded-full blur-[180px] opacity-10 animate-pulse" />
        <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] bg-[#3b82f6] rounded-full blur-[180px] opacity-10 animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute -bottom-40 left-1/3 w-[600px] h-[600px] bg-[#a855f7] rounded-full blur-[180px] opacity-10 animate-pulse" style={{ animationDelay: '4s' }} />
        
        {/* Subtle Cyber Grid Lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <div className="relative z-10">

        {/* ─── Top Navbar ────────────────────────────────────────── */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-[#060814]/80 backdrop-blur-xl border-b border-white/[0.08] px-6 py-4 transition-all">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Brand Logo */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="relative">
                <ShieldAlert className="text-[#00ff88] w-8 h-8 drop-shadow-[0_0_12px_rgba(0,255,136,0.8)] animate-pulse" />
                <div className="absolute inset-0 bg-[#00ff88] filter blur-md opacity-30 rounded-full scale-125" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-wide text-white flex items-center gap-1.5">
                  NETSHIELD <span className="text-[#00ff88]">AI</span>
                  <span className="text-[10px] font-extrabold bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/30 px-2 py-0.5 rounded-full uppercase tracking-widest ml-1">
                    v4 SOC
                  </span>
                </span>
                <span className="text-[9px] text-slate-400 font-bold tracking-widest uppercase -mt-0.5">
                  Autonomous Cyber Defense Platform
                </span>
              </div>
            </div>

            {/* Nav Links */}
            <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
              <a href="#features" className="hover:text-[#00ff88] transition-colors">Capabilities</a>
              <a href="#demo" className="hover:text-[#00ff88] transition-colors">Live Telemetry</a>
              <a href="#workflow" className="hover:text-[#00ff88] transition-colors">Architecture</a>
              <a href="#metrics" className="hover:text-[#00ff88] transition-colors">Benchmarks</a>
            </nav>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={onOpenLogin}
                className="px-4 py-2 text-xs font-extrabold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all duration-200 flex items-center gap-2 cursor-pointer"
              >
                <User size={14} className="text-[#00ff88]" />
                <span>Sign In</span>
              </button>

              <button
                onClick={onDemoLogin}
                className="px-5 py-2 text-xs font-black tracking-wide bg-gradient-to-r from-[#00ff88] to-[#00cc66] text-slate-950 hover:brightness-110 rounded-xl shadow-[0_0_20px_rgba(0,255,136,0.3)] transition-all duration-200 flex items-center gap-2 cursor-pointer"
              >
                <Play size={14} className="fill-slate-950" />
                <span>Launch SOC Demo</span>
              </button>
            </div>
          </div>
        </header>

        {/* ─── Hero Section ───────────────────────────────────────── */}
        <section className="pt-36 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
          
          {/* Live Status Chip */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/10 text-xs text-slate-300 mb-8 backdrop-blur-md shadow-lg"
          >
            <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-ping" />
            <span className="text-[#00ff88] font-bold uppercase tracking-wider text-[11px]">Real-time AI Defense Active</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">Security Score: <strong className="text-white font-mono">{liveScore}/100</strong></span>
          </motion.div>

          {/* Main Title */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight max-w-5xl leading-[1.1] text-white"
          >
            Autonomous Threat Analytics & <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-[#00ff88] via-[#3b82f6] to-[#a855f7] bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(0,255,136,0.25)]">
              Real-Time AI SOC Defense
            </span>
          </motion.h1>

          {/* Hero Subtitle */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-lg sm:text-xl text-slate-400 max-w-3xl leading-relaxed font-normal"
          >
            NetShield AI fuses machine learning anomaly detection with automated SOAR playbooks, global GeoIP attack maps, and Microsoft Azure SIEM sync to neutralize cyber threats before impact.
          </motion.p>

          {/* Hero Action Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <button
              onClick={onDemoLogin}
              className="px-8 py-4 text-sm font-black tracking-wider uppercase bg-gradient-to-r from-[#00ff88] via-[#00e676] to-[#00c853] text-slate-950 hover:brightness-110 rounded-2xl shadow-[0_0_30px_rgba(0,255,136,0.4)] transition-all duration-300 flex items-center gap-3 group cursor-pointer"
            >
              <span>Explore Live Dashboard</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onOpenLogin}
              className="px-8 py-4 text-sm font-bold tracking-wider uppercase bg-white/[0.03] hover:bg-white/[0.08] text-slate-200 border border-white/15 rounded-2xl backdrop-blur-xl transition-all duration-300 flex items-center gap-3 cursor-pointer"
            >
              <Lock size={16} className="text-[#00ff88]" />
              <span>SOC Portal Login</span>
            </button>
          </motion.div>

          {/* Trust Badges */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-medium"
          >
            <div className="flex items-center gap-2 bg-white/[0.02] border border-white/5 px-3 py-1.5 rounded-lg">
              <CheckCircle2 size={14} className="text-[#00ff88]" />
              <span>FastAPI & Python 3.11+</span>
            </div>
            <div className="flex items-center gap-2 bg-white/[0.02] border border-white/5 px-3 py-1.5 rounded-lg">
              <CheckCircle2 size={14} className="text-[#00ff88]" />
              <span>React 19 & Vite Engine</span>
            </div>
            <div className="flex items-center gap-2 bg-white/[0.02] border border-white/5 px-3 py-1.5 rounded-lg">
              <CheckCircle2 size={14} className="text-[#00ff88]" />
              <span>Azure Sentinel Ready</span>
            </div>
            <div className="flex items-center gap-2 bg-white/[0.02] border border-white/5 px-3 py-1.5 rounded-lg">
              <CheckCircle2 size={14} className="text-[#00ff88]" />
              <span>Sub-5ms ML Inference</span>
            </div>
          </motion.div>
        </section>

        {/* ─── Interactive Telemetry Preview Section (Demo Widget) ─── */}
        <section id="demo" className="py-12 px-6 max-w-7xl mx-auto">
          <div className="relative bg-[#0a0e24]/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
            {/* Ambient Card Top Bar Line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#00ff88] via-[#3b82f6] to-[#a855f7]" />

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pb-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#00ff88]/10 border border-[#00ff88]/20 rounded-xl text-[#00ff88]">
                  <Radar size={22} className="animate-spin" style={{ animationDuration: '8s' }} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    Live Telemetry Threat Stream
                    <span className="w-2.5 h-2.5 rounded-full bg-[#00ff88] animate-ping" />
                  </h3>
                  <p className="text-xs text-slate-400">Real-time attack packet inspection & automated SOAR mitigation stream</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 font-mono bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                  WebSocket: <strong className="text-[#00ff88]">CONNECTED</strong>
                </span>
                <button
                  onClick={onDemoLogin}
                  className="text-xs font-bold text-[#00ff88] hover:text-white bg-[#00ff88]/10 hover:bg-[#00ff88]/20 border border-[#00ff88]/30 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Open Interactive SOC</span>
                  <ArrowUpRight size={14} />
                </button>
              </div>
            </div>

            {/* Live Alerts Stream Table Preview */}
            <div className="space-y-3">
              <AnimatePresence>
                {simulatedAlerts.map((alert, idx) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 transition-all gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        alert.severity === 'CRITICAL' ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]' : 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]'
                      }`} />
                      <div>
                        <span className="text-xs font-black text-white tracking-wide">{alert.type}</span>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 font-mono">
                          <span>IP: <strong className="text-slate-200">{alert.ip}</strong></span>
                          <span>•</span>
                          <span>Origin: <strong className="text-slate-200">{alert.country}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{alert.time}</span>
                      <span className="px-2.5 py-1 text-[10px] font-black rounded-lg bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 tracking-wider">
                        {alert.status}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* ─── Capabilities & Feature Grid ────────────────────────── */}
        <section id="features" className="py-20 px-6 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-black text-[#00ff88] uppercase tracking-widest bg-[#00ff88]/10 px-3.5 py-1.5 rounded-full border border-[#00ff88]/20">
              Enterprise SOC Modules
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white mt-4 tracking-tight">
              Engineered for Comprehensive Cyber Supremacy
            </h2>
            <p className="text-slate-400 text-sm sm:text-base mt-4">
              From raw packet capture to automated mitigation, NetShield AI equips SOC teams with intelligence at every layer.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={idx}
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="p-8 rounded-3xl bg-[#0a0f26]/60 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all shadow-xl group relative overflow-hidden flex flex-col justify-between"
                >
                  <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-15 transition-opacity text-white pointer-events-none">
                    <Icon size={120} />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div className={`p-3.5 rounded-2xl bg-gradient-to-br border ${feat.color}`}>
                        <Icon size={24} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-slate-300">
                        {feat.badge}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-[#00ff88] transition-colors">
                      {feat.title}
                    </h3>
                    <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                      {feat.description}
                    </p>
                  </div>

                  <div className="mt-8 pt-4 border-t border-white/5 flex items-center gap-2 text-xs font-bold text-slate-400 group-hover:text-[#00ff88] transition-colors">
                    <span>Explore module</span>
                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ─── Workflow Architecture Breakdown ───────────────────── */}
        <section id="workflow" className="py-20 px-6 max-w-7xl mx-auto bg-gradient-to-b from-transparent via-white/[0.01] to-transparent rounded-3xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-black text-blue-400 uppercase tracking-widest bg-blue-500/10 px-3.5 py-1.5 rounded-full border border-blue-500/20">
              System Architecture
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white mt-4 tracking-tight">
              End-to-End Threat Telemetry Pipeline
            </h2>
            <p className="text-slate-400 text-sm sm:text-base mt-4">
              How NetShield AI ingests, detects, mitigates, and reports cyber anomalies in real time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {workflowSteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={idx} className="relative p-6 rounded-2xl bg-[#090d20]/80 border border-white/10 backdrop-blur-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-3xl font-black text-[#00ff88]/40 font-mono">{step.step}</span>
                      <div className="p-2.5 rounded-xl bg-white/5 text-[#00ff88] border border-white/10">
                        <Icon size={20} />
                      </div>
                    </div>
                    <h4 className="text-base font-bold text-white mb-2">{step.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ─── Benchmarks & Metrics ────────────────────────────────── */}
        <section id="metrics" className="py-20 px-6 max-w-7xl mx-auto">
          <div className="p-10 rounded-3xl bg-gradient-to-r from-[#0a0e28] via-[#091230] to-[#0a0e28] border border-white/15 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#00ff88]/10 rounded-full filter blur-3xl pointer-events-none" />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center relative z-10">
              {stats.map((stat, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <span className={`text-4xl sm:text-5xl font-black font-mono tracking-tight ${stat.color} drop-shadow-[0_0_15px_rgba(0,255,136,0.2)]`}>
                    {stat.value}
                  </span>
                  <span className="text-xs font-bold text-slate-300 mt-2 uppercase tracking-wider">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA Banner ─────────────────────────────────────────── */}
        <section className="py-20 px-6 max-w-5xl mx-auto text-center">
          <div className="p-12 rounded-3xl bg-gradient-to-br from-[#00ff88]/10 via-[#0a142e] to-[#3b82f6]/10 border border-[#00ff88]/30 relative overflow-hidden shadow-[0_0_50px_rgba(0,255,136,0.15)]">
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Ready to Secure Your Cloud Infrastructure?
            </h2>
            <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto mt-4 leading-relaxed">
              Experience the power of real-time AI anomaly detection, automated SOAR playbooks, and Microsoft Azure SIEM log analytics.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={onDemoLogin}
                className="px-8 py-4 text-xs sm:text-sm font-black tracking-wider uppercase bg-[#00ff88] text-slate-950 hover:bg-[#00ff88]/90 rounded-2xl shadow-[0_0_25px_rgba(0,255,136,0.4)] transition-all flex items-center gap-2.5 cursor-pointer"
              >
                <Shield size={18} />
                <span>Launch Interactive SOC Demo</span>
              </button>
            </div>
          </div>
        </section>

        {/* ─── Footer ─────────────────────────────────────────────── */}
        <footer className="border-t border-white/10 py-12 px-6 bg-[#03040c]">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-3">
              <ShieldAlert className="text-[#00ff88] w-6 h-6" />
              <span className="font-extrabold text-white text-sm">
                NETSHIELD <span className="text-[#00ff88]">AI</span>
              </span>
              <span className="text-slate-600">|</span>
              <span>Enterprise SOC Platform v4</span>
            </div>

            <div className="flex items-center gap-6 font-medium">
              <a href="#features" className="hover:text-white transition-colors">Capabilities</a>
              <a href="#demo" className="hover:text-white transition-colors">Telemetry</a>
              <a href="#workflow" className="hover:text-white transition-colors">Architecture</a>
              <button onClick={onOpenLogin} className="hover:text-[#00ff88] transition-colors cursor-pointer">
                Portal Login
              </button>
            </div>

            <span className="text-slate-500 text-[11px]">
              © {new Date().getFullYear()} NetShield AI Security. All rights reserved.
            </span>
          </div>
        </footer>

      </div>
    </div>
  );
}
