// Mock Data Service for NetShield AI Dashboard
// Simulates live enterprise network telemetry and AI anomalies with a 5-second interval.

export const generateInitialData = () => {
  // Last 24 hours of traffic for Overview / Traffic Analytics
  const traffic24h = Array.from({ length: 24 }, (_, i) => {
    const hour = (new Date().getHours() - (23 - i) + 24) % 24;
    const base = 30 + Math.sin(i / 3) * 10 + Math.random() * 8;
    return {
      time: `${hour.toString().padStart(2, '0')}:00`,
      volume: parseFloat(base.toFixed(1)), // in K requests
      packets: Math.floor(base * 1200 + Math.random() * 500),
      bytes: parseFloat((base * 10.4 + Math.random() * 2).toFixed(1)), // in MB
    };
  });

  // Threat Timeline (Last 7 Days) for Threat Monitor
  const threat7d = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    return {
      day: dayName,
      Critical: Math.floor(Math.random() * 4) + 1,
      High: Math.floor(Math.random() * 8) + 3,
      Medium: Math.floor(Math.random() * 15) + 8,
    };
  });

  const protocolBreakdown = [
    { name: 'HTTPS', value: 58, color: '#00ff88' },
    { name: 'SSH', value: 18, color: '#facc15' },
    { name: 'DNS', value: 14, color: '#3b82f6' },
    { name: 'FTP', value: 6, color: '#ec4899' },
    { name: 'SMTP', value: 4, color: '#a855f7' },
  ];

  const topSuspiciousIPs = [
    { ip: '103.45.6.78', country: 'RU', count: 1420, risk_score: 96, threat_level: 'CRITICAL', region: 'Russia' },
    { ip: '185.220.1.22', country: 'DE', count: 980, risk_score: 92, threat_level: 'CRITICAL', region: 'Germany' },
    { ip: '45.33.32.156', country: 'US', count: 650, risk_score: 84, threat_level: 'HIGH', region: 'United States' },
    { ip: '192.168.1.5', country: 'LOCAL', count: 120, risk_score: 45, threat_level: 'MEDIUM', region: 'Internal' },
    { ip: '109.202.107.5', country: 'NL', count: 430, risk_score: 72, threat_level: 'HIGH', region: 'Netherlands' }
  ];

  const activeThreats = [
    { id: '1', severity: 'CRITICAL', ip: '103.45.6.78', type: 'SSH Brute Force', time: '2min ago', port: 22, description: '500 failed SSH logins in 60 seconds.' },
    { id: '2', severity: 'CRITICAL', ip: '185.220.1.109', type: 'Port Scan', time: '5min ago', port: 80, description: 'Rapid sequential port scan across 1000+ ports.' },
    { id: '3', severity: 'HIGH', ip: '45.33.32.156', type: 'DDoS Pattern', time: '12min ago', port: 443, description: 'Abnormally high volume of syn packets detected.' },
    { id: '4', severity: 'MEDIUM', ip: '192.168.1.5', type: 'Unusual Traffic', time: '1hr ago', port: 8080, description: 'Internal workstation transmitting high data volumes to external IP.' },
    { id: '5', severity: 'LOW', ip: '192.168.1.111', type: 'Expired SSL Certificate', time: '3hr ago', port: 443, description: 'Client attempting connection with expired certificate.' }
  ];

  const portDistribution = [
    { port: 'Port 443 (HTTPS)', value: 12450 },
    { port: 'Port 80 (HTTP)', value: 8420 },
    { port: 'Port 22 (SSH)', value: 3100 },
    { port: 'Port 53 (DNS)', value: 2450 },
    { port: 'Port 8080 (Alt)', value: 1200 },
  ];

  const anomalyHistogram = [
    { scoreRange: '0.0 - 0.2', normal: 240, anomaly: 0 },
    { scoreRange: '0.2 - 0.4', normal: 480, anomaly: 2 },
    { scoreRange: '0.4 - 0.6', normal: 180, anomaly: 12 },
    { scoreRange: '0.6 - 0.8', normal: 15, anomaly: 58 },
    { scoreRange: '0.8 - 1.0', normal: 1, anomaly: 95 },
  ];

  // Anomaly heatmap: 7 days x 6 time ranges
  const heatmapData = [
    { day: 'Mon', '00:00': 12, '04:00': 8, '08:00': 45, '12:00': 55, '16:00': 78, '20:00': 34 },
    { day: 'Tue', '00:00': 15, '04:00': 10, '08:00': 50, '12:00': 62, '16:00': 80, '20:00': 28 },
    { day: 'Wed', '00:00': 25, '04:00': 14, '08:00': 48, '12:00': 95, '16:00': 64, '20:00': 30 },
    { day: 'Thu', '00:00': 8, '04:00': 5, '08:00': 38, '12:00': 58, '16:00': 72, '20:00': 42 },
    { day: 'Fri', '00:00': 18, '04:00': 12, '08:00': 55, '12:00': 74, '16:00': 92, '20:00': 55 },
    { day: 'Sat', '00:00': 30, '04:00': 22, '08:00': 20, '12:00': 35, '16:00': 40, '20:00': 68 },
    { day: 'Sun', '00:00': 28, '04:00': 25, '08:00': 15, '12:00': 28, '16:00': 35, '20:00': 72 },
  ];

  return {
    securityScore: 87,
    totalThreats: 3,
    trafficToday: '48.2K',
    threatLevel: 'ELEVATED',
    traffic24h,
    threat7d,
    protocolBreakdown,
    topSuspiciousIPs,
    activeThreats,
    portDistribution,
    allowDeny: { allow: 84, deny: 16 },
    anomalyHistogram,
    heatmapData,
    azureConnected: false,
    azureSyncedEvents: 0
  };
};

export const updateLiveTelemetry = (currentData) => {
  // Slightly adjust scores
  const scoreNoise = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
  const newScore = Math.max(70, Math.min(100, currentData.securityScore + scoreNoise));

  // Update last point in traffic timeline
  const updatedTraffic = [...currentData.traffic24h];
  const lastPoint = updatedTraffic[updatedTraffic.length - 1];
  const nextVal = Math.max(10, lastPoint.volume + (Math.random() * 6 - 3));
  updatedTraffic.shift();
  
  const now = new Date();
  const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  updatedTraffic.push({
    time: timeString,
    volume: parseFloat(nextVal.toFixed(1)),
    packets: Math.floor(nextVal * 1200 + Math.random() * 400),
    bytes: parseFloat((nextVal * 10.4 + Math.random() * 1.5).toFixed(1)),
  });

  // Maybe add a new threat with 30% probability
  let updatedThreats = [...currentData.activeThreats];
  const hasNewThreat = Math.random() < 0.3;
  if (hasNewThreat) {
    const maliciousIPs = ['198.51.100.42', '203.0.113.89', '185.190.140.11', '109.202.107.99'];
    const attackTypes = ['SQL Injection Spike', 'LDAP Injection attempt', 'Malware Beaconing', 'XSS Ingress'];
    const severities = ['CRITICAL', 'HIGH', 'MEDIUM'];
    const randomIP = maliciousIPs[Math.floor(Math.random() * maliciousIPs.length)];
    const randomAttack = attackTypes[Math.floor(Math.random() * attackTypes.length)];
    const randomSeverity = severities[Math.floor(Math.random() * severities.length)];
    const randomPort = [80, 443, 389, 3306][Math.floor(Math.random() * 4)];

    updatedThreats.unshift({
      id: String(Date.now()),
      severity: randomSeverity,
      ip: randomIP,
      type: randomAttack,
      time: 'Just now',
      port: randomPort,
      description: `Suspicious activity flagged by Isolation Forest on port ${randomPort}.`
    });

    if (updatedThreats.length > 8) {
      updatedThreats.pop();
    }
  }

  // Update suspicious IP list counts occasionally
  const updatedIPs = currentData.topSuspiciousIPs.map(ip => {
    if (Math.random() < 0.4) {
      return {
        ...ip,
        count: ip.count + Math.floor(Math.random() * 50) + 10,
        risk_score: Math.min(99, ip.risk_score + (Math.random() < 0.5 ? 1 : 0))
      };
    }
    return ip;
  });

  return {
    ...currentData,
    securityScore: newScore,
    totalThreats: updatedThreats.filter(t => t.severity === 'CRITICAL' || t.severity === 'HIGH').length,
    trafficToday: (48.2 + (updatedTraffic.reduce((acc, curr) => acc + curr.volume, 0) / 100)).toFixed(1) + 'K',
    traffic24h: updatedTraffic,
    activeThreats: updatedThreats,
    topSuspiciousIPs: updatedIPs
  };
};
