import React from 'react';
import GeoMap from '../components/GeoMap';
import GeoThreatPanel from '../components/GeoThreatPanel';

export default function IncidentMap({ data }) {
  return (
    <div className="flex flex-col gap-6 animate-[fadeIn_0.3s_ease-out]">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Columns: Map Display */}
        <div className="lg:col-span-2 w-full">
          <GeoMap activeThreats={data.activeThreats} backendConnected={data.backendConnected} />
        </div>

        {/* Right 1 Column: Statistics, country rankings, IP reputation lists */}
        <div className="lg:col-span-1 w-full">
          <GeoThreatPanel 
            activeThreats={data.activeThreats} 
            topSuspiciousIPs={data.topSuspiciousIPs} 
          />
        </div>
      </div>
    </div>
  );
}
