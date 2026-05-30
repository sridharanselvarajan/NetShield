import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import { useAuth } from './context/AuthContext';
import Alerts from './pages/Alerts';
import IncidentMap from './pages/IncidentMap';
import KqlCopilot from './pages/KqlCopilot';
import Login from './pages/Login';
import Overview from './pages/Overview';
import RiskInsights from './pages/RiskInsights';
import SecurityPosture from './pages/SecurityPosture';
import ThreatMonitor from './pages/ThreatMonitor';
import TrafficAnalytics from './pages/TrafficAnalytics';
import { generateInitialData, updateLiveTelemetry } from './services/mockData';

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000/api/security";

export default function App() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [backendConnected, setBackendConnected] = useState(false);
  const [dashboardData, setDashboardData] = useState(() => generateInitialData());
  const [rbacError, setRbacError] = useState('');
  const [soarEvents, setSoarEvents] = useState([]);

  // Auto-clear RBAC errors after 4 seconds
  useEffect(() => {
    if (rbacError) {
      const timer = setTimeout(() => {
        setRbacError('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [rbacError]);

  // Function to sync with FastAPI backend
  const syncWithBackend = async (silent = true) => {
    if (!user) return;
    if (!silent) setIsRefreshing(true);
    try {
      const headers = {
        'Authorization': `Bearer ${user.token}`
      };

      // 1. Fetch dashboard stats
      const statsRes = await fetch(`${API_BASE}/dashboard-stats`, { headers });
      if (!statsRes.ok) throw new Error("Backend offline");
      const stats = await statsRes.json();

      // 2. Fetch active alerts
      const alertsRes = await fetch(`${API_BASE}/alerts?unresolved_only=true`, { headers });
      let activeThreats = [];
      if (alertsRes.ok) {
        const rawAlerts = await alertsRes.json();
        activeThreats = rawAlerts.map(alert => ({
          id: String(alert.id),
          severity: alert.severity || 'MEDIUM',
          ip: alert.source_ip || '0.0.0.0',
          type: alert.alert_type ? alert.alert_type.replace('_', ' ').toUpperCase() : 'ALERT',
          time: new Date(alert.timestamp).toLocaleTimeString(),
          port: 22, // default fallback
          description: alert.message || 'Suspicious network vector flagged.'
        }));
      }

      // 3. Fetch protocol breakdown
      const protoRes = await fetch(`${API_BASE}/analytics/protocols`, { headers });
      let protocolBreakdown = dashboardData.protocolBreakdown;
      if (protoRes.ok) {
        const rawProtos = await protoRes.json();
        const colors = ['#00ff88', '#facc15', '#3b82f6', '#ec4899', '#a855f7'];
        protocolBreakdown = rawProtos.map((p, idx) => ({
          name: p.protocol,
          value: Math.round(p.percentage),
          color: colors[idx % colors.length]
        }));
      }

      // 4. Fetch timeline
      const timelineRes = await fetch(`${API_BASE}/analytics/timeline`, { headers });
      let traffic24h = dashboardData.traffic24h;
      if (timelineRes.ok) {
        const rawTimeline = await timelineRes.json();
        traffic24h = rawTimeline.map(pt => {
          const hour = new Date(pt.timestamp).getHours();
          return {
            time: `${hour.toString().padStart(2, '0')}:00`,
            volume: pt.count,
            packets: pt.allowed * 12 + pt.denied * 5,
            bytes: parseFloat(((pt.allowed * 10.4) / 10).toFixed(1))
          };
        });
      }

      // Calculate total allowable ratio
      const totalRatio = stats.allowed_traffic + stats.blocked_traffic;
      const allowPercent = totalRatio > 0 ? Math.round((stats.allowed_traffic / totalRatio) * 100) : 85;
      const denyPercent = 100 - allowPercent;

      setDashboardData(prev => ({
        ...prev,
        securityScore: stats.security_score,
        totalThreats: stats.active_alerts,
        trafficToday: (stats.total_traffic / 1000).toFixed(1) + 'K',
        threatLevel: stats.security_score > 90 ? 'HEALTHY' : stats.security_score > 75 ? 'ELEVATED' : 'CRITICAL',
        activeThreats,
        topSuspiciousIPs: stats.top_suspicious_ips.map(ipRow => ({
          ip: ipRow.ip,
          country: ipRow.country || 'US',
          count: ipRow.count,
          risk_score: Math.round(ipRow.risk_score),
          threat_level: ipRow.threat_level,
          region: ipRow.country === 'RU' ? 'Russia' : ipRow.country === 'DE' ? 'Germany' : 'United States'
        })),
        protocolBreakdown: protocolBreakdown.length > 0 ? protocolBreakdown : prev.protocolBreakdown,
        traffic24h: traffic24h.length > 0 ? traffic24h : prev.traffic24h,
        allowDeny: { allow: allowPercent, deny: denyPercent },
        azureConnected: stats.azure_connected,
        azureSyncedEvents: stats.azure_synced_events || 0,
        simulatorActive: stats.simulator_active !== undefined ? stats.simulator_active : true,
        backendConnected: true
      }));

      setBackendConnected(true);
    } catch (error) {
      // Fallback to beautiful live simulator
      setBackendConnected(false);
      setDashboardData(prev => ({
        ...updateLiveTelemetry(prev),
        backendConnected: false
      }));
    } finally {
      if (!silent) setIsRefreshing(false);
    }
  };

  // ─── WebSocket Event Stream & Fallback Polling ─────────────────────
  useEffect(() => {
    if (!user) return;

    let ws = null;
    let wsConnectInterval = null;
    let fallbackPollInterval = null;

    const connectWebSocket = () => {
      console.log("[>>] Connecting to WebSocket Threat Stream...");
      const wsUrl = API_BASE.replace("http://", "ws://").replace("https://", "wss://") + "/ws";
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("[OK] WebSocket Threat Stream Connected.");
        setBackendConnected(true);
        if (wsConnectInterval) {
          clearInterval(wsConnectInterval);
          wsConnectInterval = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.event === "ping") {
            return;
          }

          if (data.event === "soar_playbook") {
            setSoarEvents(prev => [...prev, data]);
            return;
          }

          if (data.event === "live_telemetry") {
            const stats = data.stats;
            const totalRatio = stats.allowed_traffic + stats.blocked_traffic;
            const allowPercent = totalRatio > 0 ? Math.round((stats.allowed_traffic / totalRatio) * 100) : 85;
            const denyPercent = 100 - allowPercent;

            setDashboardData(prev => {
              let updatedAlerts = prev.activeThreats;
              if (data.alert) {
                if (!updatedAlerts.some(a => a.id === data.alert.id)) {
                  updatedAlerts = [data.alert, ...updatedAlerts].slice(0, 50);
                }
              }

              // Append live timeline data point to chart to simulate moving logs timeline
              let traffic24h = prev.traffic24h;
              if (data.new_log) {
                const nowStr = new Date(data.new_log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const newPoint = {
                  time: nowStr,
                  volume: stats.total_traffic % 250, 
                  packets: data.new_log.packets,
                  bytes: parseFloat((data.new_log.bytes_sent / 1000).toFixed(1))
                };
                traffic24h = [...traffic24h.slice(1), newPoint];
              }

              return {
                ...prev,
                securityScore: stats.security_score,
                totalThreats: stats.active_alerts,
                trafficToday: (stats.total_traffic / 1000).toFixed(1) + 'K',
                threatLevel: stats.security_score > 90 ? 'HEALTHY' : stats.security_score > 75 ? 'ELEVATED' : 'CRITICAL',
                activeThreats: updatedAlerts,
                topSuspiciousIPs: stats.top_suspicious_ips.map(ipRow => ({
                  ip: ipRow.ip,
                  country: ipRow.country || 'US',
                  count: ipRow.count,
                  risk_score: Math.round(ipRow.risk_score),
                  threat_level: ipRow.threat_level,
                  region: ipRow.country === 'RU' ? 'Russia' : ipRow.country === 'DE' ? 'Germany' : 'United States'
                })),
                traffic24h,
                allowDeny: { allow: allowPercent, deny: denyPercent },
                azureConnected: stats.azure_connected,
                azureSyncedEvents: stats.azure_synced_events || 0,
                simulatorActive: stats.simulator_active !== undefined ? stats.simulator_active : true,
                backendConnected: true
              };
            });
          }
        } catch (err) {
          console.error("Error parsing WebSocket payload:", err);
        }
      };

      ws.onerror = (err) => {
        console.warn("[WARN] WebSocket threat stream error. Falling back to HTTP polling...");
        setBackendConnected(false);
      };

      ws.onclose = () => {
        console.warn("[WARN] WebSocket threat stream closed. Attempting reconnect...");
        setBackendConnected(false);
        if (!wsConnectInterval) {
          wsConnectInterval = setInterval(() => {
            connectWebSocket();
          }, 5000);
        }
      };
    };

    // Initial sync
    syncWithBackend(false);

    // Connect
    connectWebSocket();

    // Fallback poll
    fallbackPollInterval = setInterval(() => {
      syncWithBackend(true);
    }, 12000);

    return () => {
      if (ws) ws.close();
      if (wsConnectInterval) clearInterval(wsConnectInterval);
      if (fallbackPollInterval) clearInterval(fallbackPollInterval);
    };
  }, [user]);

  const triggerRefresh = () => {
    syncWithBackend(false);
  };

  const handleResolveAlert = async (id) => {
    if (backendConnected && user) {
      try {
        const res = await fetch(`${API_BASE}/alerts/${id}/resolve`, { 
          method: 'POST',
          headers: { 'Authorization': `Bearer ${user.token}` }
        });

        if (res.status === 403) {
          const errData = await res.json();
          setRbacError(errData.detail || "Permission Denied: Resolve permissions are restricted to SOC Administrators.");
          return;
        }

        if (res.ok) {
          syncWithBackend(true);
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      // Offline resolution handling (only if not mock connected or user role is admin)
      if (user && user.role !== 'ADMIN') {
        setRbacError("Permission Denied: Resolve permissions are restricted to SOC Administrators.");
        return;
      }
      setDashboardData(prev => {
        const updatedAlerts = prev.activeThreats.filter(t => t.id !== id);
        return {
          ...prev,
          activeThreats: updatedAlerts,
          totalThreats: updatedAlerts.filter(t => t.severity === 'CRITICAL' || t.severity === 'HIGH').length,
          securityScore: Math.min(100, prev.securityScore + 4)
        };
      });
    }
  };

  const handleResolveAll = async () => {
    if (user && user.role !== 'ADMIN') {
      setRbacError("Permission Denied: Resolve permissions are restricted to SOC Administrators.");
      return;
    }
    
    if (backendConnected && user) {
      try {
        const res = await fetch(`${API_BASE}/alerts/resolve-all`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if (res.ok) {
          syncWithBackend(true);
        }
      } catch (err) {
        console.error("Error resolving all alerts:", err);
      }
    } else {
      setDashboardData(prev => ({
        ...prev,
        activeThreats: [],
        totalThreats: 0,
        securityScore: 100
      }));
    }
  };

  const handlePurgeLogs = async () => {
    if (backendConnected && user) {
      try {
        const res = await fetch(`${API_BASE}/logs/purge?limit=100`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if (res.ok) {
          syncWithBackend(true);
        }
      } catch (err) {
        console.error("Error purging old logs:", err);
      }
    } else {
      // Offline fallback: decrement local traffic count
      setDashboardData(prev => {
        const currentCount = parseFloat(prev.trafficToday);
        const newCount = Math.max(0, currentCount - 0.1).toFixed(1) + 'K';
        return {
          ...prev,
          trafficToday: newCount
        };
      });
    }
  };

  const handleToggleSimulator = async (active) => {
    if (backendConnected && user) {
      try {
        const res = await fetch(`${API_BASE}/simulator/toggle?active=${active}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if (res.ok) {
          syncWithBackend(true);
        }
      } catch (err) {
        console.error("Error toggling simulator:", err);
      }
    } else {
      // Offline fallback: toggle local state
      setDashboardData(prev => ({
        ...prev,
        simulatorActive: active
      }));
    }
  };

  // ─── Loading Screen ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#060814] flex items-center justify-center">
        <span className="w-12 h-12 border-4 border-[#00ff88] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ─── Unauthenticated: Show Login screen ──────────────────────────
  if (!user) {
    return <Login />;
  }

  return (
    <div className="flex min-h-screen bg-[#060814] text-[#f8fafc] font-sans antialiased overflow-x-hidden" style={{
      backgroundImage: `
        radial-gradient(circle at 10% 20%, rgba(0, 255, 136, 0.04) 0%, transparent 40%),
        radial-gradient(circle at 90% 80%, rgba(59, 130, 246, 0.03) 0%, transparent 40%)
      `,
      backgroundAttachment: 'fixed'
    }}>
      {/* Dynamic Floating Toast Alerts for Permission Denied errors */}
      <AnimatePresence>
        {rbacError && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-6 right-6 z-[9999] max-w-md bg-[#1c0f16]/90 border border-rose-500/30 backdrop-blur-xl px-5 py-4 rounded-xl flex items-start gap-3.5 shadow-2xl"
          >
            <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M13.477 3.03a.75.75 0 01.02 1.06L7.732 10l5.765 5.91a.75.75 0 11-1.08 1.04l-6.25-6.4a.75.75 0 010-1.04l6.25-6.4a.75.75 0 011.06-.02z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[13px] font-extrabold text-rose-300 uppercase tracking-wide">Privilege Restriction</span>
              <span className="text-xs text-slate-300 pr-4">{rbacError}</span>
            </div>
            <button 
              type="button" 
              onClick={() => setRbacError('')}
              className="text-slate-400 hover:text-slate-200 ml-auto focus:outline-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        securityScore={dashboardData.securityScore}
        totalThreats={dashboardData.totalThreats}
        alertsCount={dashboardData.activeThreats.length}
        socketConnected={backendConnected}
      />

      {/* Main Content Area */}
      <main className="ml-[280px] flex-grow p-10 w-[calc(100vw-280px)] min-h-screen flex flex-col">
        {/* Header bar */}
        <Header 
          activeTab={activeTab} 
          isRefreshing={isRefreshing} 
          triggerRefresh={triggerRefresh} 
          securityScore={dashboardData.securityScore}
          azureConnected={dashboardData.azureConnected}
          azureSyncedEvents={dashboardData.azureSyncedEvents}
          trafficToday={dashboardData.trafficToday}
          onPurgeLogs={handlePurgeLogs}
          simulatorActive={dashboardData.simulatorActive !== undefined ? dashboardData.simulatorActive : true}
          onToggleSimulator={handleToggleSimulator}
        />

        {/* Tab view containers with page transition animation */}
        <div className="flex-grow">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              {activeTab === 'overview' && (
                <Overview data={dashboardData} onResolveAlert={handleResolveAlert} />
              )}
              {activeTab === 'threats' && (
                <ThreatMonitor 
                  data={dashboardData} 
                  onResolveAlert={handleResolveAlert} 
                  soarEvents={soarEvents} 
                  simulatorActive={dashboardData.simulatorActive !== undefined ? dashboardData.simulatorActive : true}
                  onToggleSimulator={handleToggleSimulator}
                />
              )}
              {activeTab === 'traffic' && (
                <TrafficAnalytics data={dashboardData} />
              )}
              {activeTab === 'heatmap' && (
                <IncidentMap data={dashboardData} />
              )}
              {activeTab === 'alerts' && (
                <Alerts 
                  data={dashboardData} 
                  onResolveAlert={handleResolveAlert} 
                  onResolveAll={handleResolveAll} 
                />
              )}
              {activeTab === 'posture' && (
                <SecurityPosture data={dashboardData} />
              )}
              {activeTab === 'risk' && (
                <RiskInsights data={dashboardData} />
              )}
              {activeTab === 'kql' && (
                <KqlCopilot />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
