import React, { useState, useEffect } from 'react';
import GlassCard from '../components/GlassCard';
import { 
  ShieldAlert, 
  Search, 
  Database, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  RefreshCw, 
  Clock, 
  HelpCircle,
  TrendingUp,
  Cpu,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

let API_BASE_RAW = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000/api/security";
if (API_BASE_RAW.endsWith("/")) {
  API_BASE_RAW = API_BASE_RAW.slice(0, -1);
}
const INTEL_API_BASE = API_BASE_RAW.replace("/api/security", "/api/threat-intel");

export default function ThreatIntel() {
  const { user } = useAuth();
  const [searchIp, setSearchIp] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState(null);

  const [cacheList, setCacheList] = useState([]);
  const [cacheLoading, setCacheLoading] = useState(true);
  const [cacheSearch, setCacheSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Reset pagination when search query or database list changes
  useEffect(() => {
    setCurrentPage(1);
  }, [cacheSearch, cacheList]);
  
  const [apiStatus, setApiStatus] = useState({
    abuseipdb: false,
    virustotal: false,
    alienvault: false,
    mode: 'simulated'
  });
  const [apiStatusLoading, setApiStatusLoading] = useState(true);

  // Fetch API Status & Cache List on mount
  useEffect(() => {
    fetchApiStatus();
    fetchCacheList();
  }, [user]);

  const fetchApiStatus = async () => {
    setApiStatusLoading(true);
    try {
      const headers = user ? { 'Authorization': `Bearer ${user.token}` } : {};
      const res = await fetch(`${INTEL_API_BASE}/status`, { headers });
      if (res.ok) {
        const data = await res.json();
        setApiStatus(data);
      }
    } catch (err) {
      console.error("Error fetching API status:", err);
    } finally {
      setApiStatusLoading(false);
    }
  };

  const fetchCacheList = async () => {
    setCacheLoading(true);
    try {
      const headers = user ? { 'Authorization': `Bearer ${user.token}` } : {};
      const res = await fetch(`${INTEL_API_BASE}/cache`, { headers });
      if (res.ok) {
        const data = await res.json();
        setCacheList(data);
      }
    } catch (err) {
      console.error("Error fetching cache list:", err);
    } finally {
      setCacheLoading(false);
    }
  };

  const handleLookup = async (e) => {
    if (e) e.preventDefault();
    if (!searchIp.trim()) return;

    setLookupLoading(true);
    setLookupError(null);
    setLookupResult(null);

    try {
      const headers = user ? { 'Authorization': `Bearer ${user.token}` } : {};
      const res = await fetch(`${INTEL_API_BASE}/lookup?ip=${searchIp.trim()}`, { headers });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Query failed. Ensure IP format is correct.");
      }
      const data = await res.json();
      setLookupResult(data);
      // Refresh cache table in background
      fetchCacheList();
    } catch (err) {
      setLookupError(err.message);
    } finally {
      setLookupLoading(false);
    }
  };

  const handlePurgeCache = async () => {
    if (!window.confirm("Are you sure you want to purge all cached Threat Intelligence records?")) return;
    
    try {
      const headers = user ? { 'Authorization': `Bearer ${user.token}` } : {};
      const res = await fetch(`${INTEL_API_BASE}/cache/purge`, { 
        method: 'DELETE',
        headers 
      });
      if (res.ok) {
        setCacheList([]);
        if (lookupResult && lookupResult.source === 'cache') {
          setLookupResult(null);
        }
      }
    } catch (err) {
      console.error("Error purging cache:", err);
    }
  };

  const getScoreColorBadge = (score) => {
    if (score >= 75) return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    if (score >= 45) return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    if (score >= 15) return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  };

  const filteredCache = cacheList.filter(item => 
    item.ip_address.toLowerCase().includes(cacheSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      
      {/* Dynamic API Status Indicators Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Overall Status */}
        <GlassCard className="flex items-center gap-4.5" glowColor="rgba(0, 255, 136, 0.05)">
          <div className="w-11 h-11 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
            <Database size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">TI Cache Engine</span>
            <span className="text-sm font-black text-white mt-0.5">
              {cacheList.length} Active Records
            </span>
          </div>
        </GlassCard>

        {/* AbuseIPDB status card */}
        <GlassCard className="flex items-center gap-4" glowColor="rgba(0, 255, 136, 0.05)">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${
            apiStatus.abuseipdb 
              ? 'bg-emerald-500/10 text-[#00ff88] border-emerald-500/20 shadow-[0_0_8px_rgba(0,255,136,0.1)]' 
              : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
          }`}>
            <ShieldAlert size={16} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold tracking-wider">AbuseIPDB Feed</span>
            <span className="text-[11px] font-extrabold text-white mt-0.5">
              {apiStatus.abuseipdb ? 'LIVE KEYS DETECTED' : 'SIMULATED FALLBACK'}
            </span>
          </div>
        </GlassCard>

        {/* VirusTotal status card */}
        <GlassCard className="flex items-center gap-4" glowColor="rgba(0, 255, 136, 0.05)">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${
            apiStatus.virustotal 
              ? 'bg-emerald-500/10 text-[#00ff88] border-emerald-500/20 shadow-[0_0_8px_rgba(0,255,136,0.1)]' 
              : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
          }`}>
            <Cpu size={16} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold tracking-wider">VirusTotal Feed</span>
            <span className="text-[11px] font-extrabold text-white mt-0.5">
              {apiStatus.virustotal ? 'LIVE KEYS DETECTED' : 'SIMULATED FALLBACK'}
            </span>
          </div>
        </GlassCard>

        {/* AlienVault OTX status card */}
        <GlassCard className="flex items-center gap-4" glowColor="rgba(0, 255, 136, 0.05)">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${
            apiStatus.alienvault 
              ? 'bg-emerald-500/10 text-[#00ff88] border-emerald-500/20 shadow-[0_0_8px_rgba(0,255,136,0.1)]' 
              : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
          }`}>
            <Globe size={16} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold tracking-wider">AlienVault OTX Feed</span>
            <span className="text-[11px] font-extrabold text-white mt-0.5">
              {apiStatus.alienvault ? 'LIVE KEYS DETECTED' : 'SIMULATED FALLBACK'}
            </span>
          </div>
        </GlassCard>

      </div>

      {/* Lookup Tool & Fusion Card Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Lookup Tool (Span 2) */}
        <div className="md:col-span-2 flex flex-col gap-6">
          <GlassCard glowColor="rgba(59, 130, 246, 0.05)">
            <h2 className="text-base font-black text-white tracking-wide mb-4">Manual IP Reputation Query</h2>
            
            <form onSubmit={handleLookup} className="flex gap-3 mb-6">
              <div className="flex-grow relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-4.5 h-4.5" />
                <input 
                  type="text"
                  placeholder="Enter IPv4 Address (e.g. 103.45.67.89)..."
                  value={searchIp}
                  onChange={(e) => setSearchIp(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500/50 focus:bg-slate-900/80 transition-all font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={lookupLoading}
                className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold text-sm rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
              >
                {lookupLoading ? <RefreshCw className="animate-spin w-4 h-4" /> : 'Inspect'}
              </button>
            </form>

            <AnimatePresence mode="wait">
              {lookupLoading && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-10 gap-3 text-slate-400"
                >
                  <span className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs uppercase font-bold tracking-wider">Querying threat feeds...</span>
                </motion.div>
              )}

              {lookupError && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold rounded-xl flex items-start gap-2.5"
                >
                  <XCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <span>{lookupError}</span>
                </motion.div>
              )}

              {!lookupLoading && !lookupError && lookupResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="bg-slate-950/40 border border-slate-900/60 rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-6"
                >
                  <div className="flex flex-col gap-2 w-full md:w-auto">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Lookup Result Target</span>
                    <span className="text-xl font-mono font-black text-white">{lookupResult.ip_address}</span>
                    
                    <div className="flex items-center gap-2.5 mt-1">
                      <span className={`text-[9px] font-black tracking-wider uppercase px-2 py-0.5 border rounded ${
                        lookupResult.source === 'live'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {lookupResult.source === 'live' ? 'Live API Feed' : 'Simulated Profile'}
                      </span>
                      {lookupResult.cached_at && (
                        <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                          <Clock size={11} className="text-slate-500" /> Cache Registered
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Metrics meters */}
                  <div className="flex gap-6 w-full md:w-auto justify-around flex-grow md:flex-grow-0 md:justify-end">
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wide">AbuseIPDB</span>
                      <span className="text-sm font-black text-indigo-400 font-mono mt-1">{lookupResult.abuse_score}%</span>
                    </div>
                    <div className="flex flex-col items-center border-l border-slate-900/60 pl-6">
                      <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wide">VirusTotal</span>
                      <span className="text-sm font-black text-blue-400 font-mono mt-1">{lookupResult.vt_score}%</span>
                    </div>
                    <div className="flex flex-col items-center border-l border-slate-900/60 pl-6">
                      <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wide">OTX Pulses</span>
                      <span className="text-sm font-black text-[#00ff88] font-mono mt-1">{lookupResult.otx_score}%</span>
                    </div>
                    <div className="flex flex-col items-center border-l border-slate-900/60 pl-6">
                      <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wide">Unified S_TI</span>
                      <span className={`text-base font-black font-mono mt-0.5 px-2 py-0.5 rounded border ${
                        lookupResult.reputation_rating >= 75 ? 'bg-rose-500/10 text-rose-500 border-rose-500/20 animate-pulse' :
                        lookupResult.reputation_rating >= 45 ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>{lookupResult.reputation_rating}%</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>
        </div>

        {/* Fusion Equation Card */}
        <GlassCard className="col-span-1" glowColor="rgba(168, 85, 247, 0.05)">
          <h2 className="text-base font-black text-white tracking-wide mb-3">Fusion Weights</h2>
          <div className="flex flex-col gap-3.5 mt-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold">AbuseIPDB (w_abuse)</span>
              <span className="font-bold text-white">40% Weight</span>
            </div>
            <div className="w-full bg-slate-900 border border-slate-850 h-2.5 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full" style={{ width: '40%' }} />
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold">VirusTotal (w_vt)</span>
              <span className="font-bold text-white">40% Weight</span>
            </div>
            <div className="w-full bg-slate-900 border border-slate-850 h-2.5 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: '40%' }} />
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold">AlienVault OTX (w_otx)</span>
              <span className="font-bold text-white">20% Weight</span>
            </div>
            <div className="w-full bg-slate-900 border border-slate-850 h-2.5 rounded-full overflow-hidden">
              <div className="h-full bg-[#00ff88] rounded-full" style={{ width: '20%' }} />
            </div>
          </div>
          
          <div className="p-3 bg-white/[0.01] border border-white/[0.03] rounded-xl text-[9px] text-slate-500 font-mono leading-relaxed mt-4.5">
            S_TI(x) = 0.4 * Abuse(x) + 0.4 * VT(x) + 0.2 * OTX(x)
          </div>
        </GlassCard>

      </div>

      {/* Cache Registry Table (Full Width) */}
      <GlassCard className="w-full" glowColor="rgba(0, 255, 136, 0.05)">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center gap-2.5">
            <Database className="text-indigo-400" size={20} />
            <h2 className="text-base font-black text-white tracking-wide">Threat Intel cache table (netshield.db)</h2>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Table Search Input */}
            <div className="relative flex-grow md:flex-grow-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-3.5 h-3.5" />
              <input 
                type="text"
                placeholder="Search cached IP..."
                value={cacheSearch}
                onChange={(e) => setCacheSearch(e.target.value)}
                className="bg-slate-900/60 border border-slate-800 rounded-xl py-1.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500/50 transition-all font-mono"
              />
            </div>

            <button 
              onClick={fetchCacheList}
              className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer"
              title="Refresh Registry"
            >
              <RefreshCw size={14} className={cacheLoading ? "animate-spin" : ""} />
            </button>

            <button 
              onClick={handlePurgeCache}
              disabled={cacheList.length === 0}
              className="bg-rose-500/10 hover:bg-rose-500 border border-rose-500/30 hover:border-rose-500 text-rose-400 hover:text-slate-950 px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <Trash2 size={13} />
              <span>Purge Cache</span>
            </button>
          </div>
        </div>

        {/* Cache List Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.06)] text-slate-500 font-bold uppercase tracking-wider">
                <th className="pb-3 px-3">IP Address</th>
                <th className="pb-3 px-3">AbuseIPDB (40%)</th>
                <th className="pb-3 px-3">VirusTotal (40%)</th>
                <th className="pb-3 px-3">AlienVault OTX (20%)</th>
                <th className="pb-3 px-3">Reputation S_TI</th>
                <th className="pb-3 px-3">Age / Registered At</th>
              </tr>
            </thead>
            <tbody>
              {cacheLoading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500 font-bold uppercase tracking-widest">
                    Loading cached profiles...
                  </td>
                </tr>
              ) : filteredCache.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500 font-bold uppercase tracking-widest">
                    No matching records in SQLite Cache table.
                  </td>
                </tr>
              ) : (
                filteredCache.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item, idx) => (
                  <tr key={idx} className="border-b border-[rgba(255,255,255,0.03)] last:border-0 hover:bg-white/[0.01] transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-indigo-400">{item.ip_address}</td>
                    <td className="py-3 px-3 font-mono text-slate-400">{item.abuse_score}%</td>
                    <td className="py-3 px-3 font-mono text-slate-400">{item.vt_score}%</td>
                    <td className="py-3 px-3 font-mono text-slate-400">{item.otx_score}%</td>
                    <td className="py-3 px-3">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${getScoreColorBadge(item.reputation_rating)}`}>
                        {item.reputation_rating}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400 font-medium">
                      {item.cached_at ? (
                        (() => {
                          const d = new Date(item.cached_at);
                          return isNaN(d.getTime()) ? 'N/A' : d.toLocaleString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', month: 'short', day: 'numeric' });
                        })()
                      ) : 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {filteredCache.length > itemsPerPage && (
          <div className="flex justify-between items-center mt-4 pt-3 border-t border-[rgba(255,255,255,0.06)] text-xs text-slate-400">
            <span>
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredCache.length)} of {filteredCache.length} records
            </span>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-all font-bold"
              >
                &lt; Previous
              </button>
              <span className="flex items-center px-3.5 font-mono font-bold text-white bg-slate-900 border border-slate-800 rounded-lg">
                {currentPage} / {Math.ceil(filteredCache.length / itemsPerPage)}
              </span>
              <button
                disabled={currentPage === Math.ceil(filteredCache.length / itemsPerPage)}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredCache.length / itemsPerPage)))}
                className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-all font-bold"
              >
                Next &gt;
              </button>
            </div>
          </div>
        )}
      </GlassCard>

    </div>
  );
}
