import React from 'react';
import { 
  Activity, 
  ShieldAlert, 
  Terminal, 
  BrainCircuit, 
  AlertOctagon,
  RefreshCw,
  Server,
  Sparkles,
  LogOut,
  User as UserIcon,
  Globe,
  ShieldCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ activeTab, setActiveTab, securityScore, totalThreats, alertsCount, socketConnected }) {
  const { user, logout } = useAuth();

  const menuItems = [
    { id: 'overview', name: 'Overview', icon: Activity },
    { id: 'threats', name: 'Threat Monitor', icon: AlertOctagon, count: totalThreats },
    { id: 'traffic', name: 'Traffic Analytics', icon: Terminal },
    { id: 'heatmap', name: 'GeographicIP Attack', icon: Globe },
    { id: 'alerts', name: 'Security Alerts', icon: ShieldAlert, count: alertsCount, countColor: 'bg-rose-500' },
    { id: 'posture', name: 'Security Posture', icon: ShieldCheck },
    { id: 'risk', name: 'Risk Insights (AI)', icon: BrainCircuit },
    { id: 'kql', name: 'AI KQL Copilot', icon: Sparkles }
  ];

  return (
    <aside className="w-[280px] bg-[rgba(10,12,22,0.85)] border-r border-[rgba(255,255,255,0.06)] backdrop-blur-md flex flex-col p-6 fixed h-screen z-50">
      {/* Brand Section */}
      <div className="mb-6 pl-3">
        <div className="flex items-center gap-4">
          <div className="relative">
            <ShieldAlert className="text-[#00ff88] w-8 h-8 drop-shadow-[0_0_12px_rgba(0,255,136,0.6)] animate-pulse" />
            <div className="absolute inset-0 bg-[#00ff88] filter blur-md opacity-25 rounded-full scale-125 animate-ping" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-wide text-white">
              NetShield <span className="text-[#00ff88]">AI</span>
            </span>
            <span className="text-[9px] text-[#00ff88] font-bold tracking-widest uppercase mt-0.5 opacity-80">
              Enterprise SOC v4
            </span>
          </div>
        </div>
      </div>

      {/* User Profile Card */}
      {user && (
        <div className="mx-2 mb-8 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00ff88]/10 to-[#3b82f6]/10 border border-white/10 flex items-center justify-center text-slate-300">
            <UserIcon size={18} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-slate-200 truncate">{user.username}</span>
            <span className={`inline-flex self-start text-[9px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded-md mt-1 ${
              user.role === 'ADMIN' 
                ? 'bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 shadow-[0_0_10px_rgba(0,255,136,0.1)]' 
                : 'bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/20'
            }`}>
              {user.role}
            </span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex flex-col gap-2 flex-grow">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-4 py-3.5 px-4 rounded-xl text-[14px] font-semibold tracking-wide transition-all duration-200 relative group cursor-pointer ${
                isActive 
                  ? 'text-white bg-[rgba(0,255,136,0.08)] border-l-4 border-[#00ff88] pl-5' 
                  : 'text-slate-400 hover:bg-[rgba(255,255,255,0.02)] hover:text-slate-200 hover:pl-5'
              }`}
            >
              <Icon className={`${isActive ? 'text-[#00ff88]' : 'text-slate-400 group-hover:text-slate-200'} transition-colors`} size={18} />
              <span>{item.name}</span>
              
              {item.count !== undefined && item.count > 0 && (
                <span className={`ml-auto ${item.countColor || 'bg-amber-500'} text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full shadow-[0_0_8px_rgba(0,255,136,0.2)]`}>
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Connection Indicator & Logout */}
      <div className="border-t border-[rgba(255,255,255,0.06)] pt-4 flex flex-col gap-3">
        <div className="flex items-center gap-3.5 p-3 rounded-xl bg-[rgba(255,255,255,0.01)] border border-[rgba(255,255,255,0.04)]">
          <span className={`w-2.5 h-2.5 rounded-full relative flex`}>
            <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${socketConnected ? 'bg-[#00ff88]' : 'bg-amber-500'}`} />
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${socketConnected ? 'bg-[#00ff88]' : 'bg-amber-500'}`} />
          </span>
          <div className="flex flex-col">
            <span className="text-[11px] font-extrabold text-slate-300">Live Agent Socket</span>
            <span className="text-[9px] font-bold text-slate-500 tracking-wider">
              {socketConnected ? 'WEB-SOCKET CONNECTED' : 'FALLBACK SIMULATOR ACTIVE'}
            </span>
          </div>
        </div>

        {user && (
          <button
            onClick={logout}
            className="flex items-center justify-center gap-3.5 py-3 px-4 rounded-xl text-[13px] font-bold tracking-wide text-rose-400 border border-rose-500/10 hover:bg-rose-500/10 hover:text-rose-300 transition-all duration-200"
          >
            <LogOut size={16} />
            <span>Terminate Session</span>
          </button>
        )}
      </div>
    </aside>
  );
}
