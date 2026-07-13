import React, { useState, useEffect } from 'react';
import { Farm, Silo, Alert } from '../types';
import { SiloShader } from './SiloShader';
import { colomboHourlyTrends } from '../data/mockData';

interface OverviewTabProps {
  farms: Farm[];
  silos: Silo[];
  alerts: Alert[];
  onSelectSilo: (siloId: string) => void;
  onNavigateToTab: (tabId: string) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  farms,
  silos,
  alerts,
  onSelectSilo,
  onNavigateToTab
}) => {
  const [totalCapacity, setTotalCapacity] = useState<number>(0);
  const [totalInventory, setTotalInventory] = useState<number>(0);
  const [systemHealth, setSystemHealth] = useState<number>(99.8);
  const [estRunout, setEstRunout] = useState<number>(4.2);

  useEffect(() => {
    const cap = silos.reduce((acc, s) => acc + s.capacity, 0);
    const inv = silos.reduce((acc, s) => acc + s.currentWeight, 0);
    setTotalCapacity(cap);
    setTotalInventory(inv);

    // Dynamic calculations based on warning / err silos
    const offlineCount = silos.filter(s => s.status === 'sensor_err').length;
    const criticalCount = silos.filter(s => s.status === 'critical').length;
    const health = 100 - ((offlineCount + criticalCount * 0.5) / silos.length) * 100;
    setSystemHealth(Number(health.toFixed(1)));
  }, [silos]);

  const activeAlerts = alerts.filter(a => a.status === 'new');
  
  // Get Gampaha silo C02 as a highlighted risk
  const highlightedSilo = silos.find(s => s.id === 'SILO-A03') || silos[0];

  return (
    <div className="space-y-6">
      {/* 1. Header KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="glass-card border border-[#2d3748] rounded-xl p-4 flex items-center justify-between">
          <div className="space-y-1 text-left">
            <span className="font-mono text-[9px] text-gray-500 uppercase block tracking-wider">
              Total Active Inventory
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-sans text-xl font-extrabold text-amber-500 tracking-tight">
                {(totalInventory / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}
              </span>
              <span className="font-mono text-[10px] text-gray-400">MT</span>
            </div>
            <span className="text-[8px] text-gray-500 block leading-none">
              of {(totalCapacity / 1000).toLocaleString(undefined, { maximumFractionDigits: 0 })} MT Total Capacity
            </span>
          </div>
          <div className="w-10 h-10 bg-[#1e252e] border border-[#2d3748] rounded-lg flex items-center justify-center text-amber-500">
            <span className="material-symbols-outlined text-xl">
              warehouse
            </span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="glass-card border border-[#2d3748] rounded-xl p-4 flex items-center justify-between">
          <div className="space-y-1 text-left">
            <span className="font-mono text-[9px] text-gray-500 uppercase block tracking-wider">
              Network Capacity Index
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-sans text-xl font-extrabold text-gray-100 tracking-tight">
                {totalCapacity > 0 ? Math.round((totalInventory / totalCapacity) * 100) : 0}%
              </span>
              <span className="font-mono text-[10px] text-emerald-400">Stable</span>
            </div>
            <span className="text-[8px] text-gray-500 block leading-none">
              Safe inventory threshold compliance
            </span>
          </div>
          <div className="w-10 h-10 bg-[#1e252e] border border-[#2d3748] rounded-lg flex items-center justify-center text-gray-400">
            <span className="material-symbols-outlined text-xl">
              speed
            </span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="glass-card border border-[#2d3748] rounded-xl p-4 flex items-center justify-between">
          <div className="space-y-1 text-left">
            <span className="font-mono text-[9px] text-gray-500 uppercase block tracking-wider">
              Network Link Integrity
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-sans text-xl font-extrabold text-emerald-400 tracking-tight">
                {systemHealth}%
              </span>
              <span className="font-mono text-[9px] bg-emerald-500/10 border border-emerald-500/20 px-1 py-0.2 text-emerald-400 rounded">
                SECURE
              </span>
            </div>
            <span className="text-[8px] text-gray-500 block leading-none">
              {silos.filter(s => s.status === 'sensor_err').length} nodes reported telemetry loss
            </span>
          </div>
          <div className="w-10 h-10 bg-[#1e252e] border border-[#2d3748] rounded-lg flex items-center justify-center text-emerald-500">
            <span className="material-symbols-outlined text-xl animate-pulse">
              rss_feed
            </span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="glass-card border border-[#2d3748] rounded-xl p-4 flex items-center justify-between">
          <div className="space-y-1 text-left">
            <span className="font-mono text-[9px] text-gray-500 uppercase block tracking-wider">
              System Depot Security
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-sans text-xl font-extrabold text-amber-500 tracking-tight">
                {estRunout} Days
              </span>
              <span className="font-mono text-[10px] text-gray-400">Safe</span>
            </div>
            <span className="text-[8px] text-gray-500 block leading-none">
              Until critical supply depletion
            </span>
          </div>
          <div className="w-10 h-10 bg-[#1e252e] border border-[#2d3748] rounded-lg flex items-center justify-center text-amber-500">
            <span className="material-symbols-outlined text-xl">
              schedule
            </span>
          </div>
        </div>
      </div>

      {/* 2. Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns - Performance & History charts (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Provincial Performance bento card */}
          <div className="glass-card border border-[#2d3748] rounded-xl p-5 bg-[#0e141b]/80 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#222a36] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500 text-lg">
                  bar_chart
                </span>
                <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-gray-200">
                  Provincial Active Throughput
                </h3>
              </div>
              <span className="font-mono text-[9px] text-gray-500 uppercase">
                Last 24h Aggregated Volumes
              </span>
            </div>

            {/* Custom SVG Bar Grid */}
            <div className="space-y-4 text-left">
              {farms.map(farm => {
                // Calculate utilization from silos
                const farmSilos = silos.filter(s => s.farmId === farm.id);
                const onlineWeight = farmSilos.reduce((acc, s) => acc + s.currentWeight, 0);
                const totalCap = farmSilos.reduce((acc, s) => acc + s.capacity, 0);
                const utilizationPercent = totalCap > 0 ? Math.round((onlineWeight / totalCap) * 100) : 0;

                // Color based on status
                let barColor = 'bg-amber-500';
                let textColor = 'text-amber-400';
                if (farm.status === 'warning') {
                  barColor = 'bg-amber-600';
                  textColor = 'text-amber-500';
                } else if (farm.status === 'critical') {
                  barColor = 'bg-red-500';
                  textColor = 'text-red-400';
                }

                return (
                  <div key={farm.id} className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-gray-300 font-bold uppercase">{farm.name}</span>
                      <span className={`${textColor} font-semibold`}>
                        {(onlineWeight / 1000).toFixed(1)} MT / {(totalCap / 1000).toFixed(0)} MT ({utilizationPercent}%)
                      </span>
                    </div>
                    <div className="relative w-full bg-[#171f2a] h-4 rounded-md overflow-hidden border border-[#222c39]">
                      <div
                        style={{ width: `${utilizationPercent}%` }}
                        className={`h-full ${barColor} rounded-r-md transition-all duration-500 ease-out`}
                      />
                      <div className="absolute inset-0 flex items-center justify-start pl-3">
                        <span className="font-mono text-[8px] text-gray-400 uppercase tracking-widest">
                          {farm.province}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Real-time system log ticker */}
          <div className="glass-card border border-[#2d3748] rounded-xl p-5 bg-[#0e141b]/80">
            <div className="flex items-center justify-between border-b border-[#222a36] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500 text-lg">
                  timeline
                </span>
                <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-gray-200">
                  Network Load Balance History
                </h3>
              </div>
              <span className="font-mono text-[9px] bg-amber-500/10 border border-amber-500/20 px-1 py-0.2 text-amber-400 rounded">
                LIVE DYNAMIC TREND
              </span>
            </div>

            {/* Simulated Line Chart inside SVG for extreme high fidelity and responsive speed */}
            <div className="relative h-44 w-full">
              <svg className="w-full h-full" viewBox="0 0 500 150" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="loadGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(245, 166, 35, 0.25)" />
                    <stop offset="100%" stopColor="rgba(245, 166, 35, 0)" />
                  </linearGradient>
                  <linearGradient id="supplyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(34, 197, 94, 0.15)" />
                    <stop offset="100%" stopColor="rgba(34, 197, 94, 0)" />
                  </linearGradient>
                </defs>

                {/* Grid guidelines */}
                <line x1="0" y1="25" x2="500" y2="25" stroke="rgba(37,44,53,0.3)" strokeWidth="0.5" />
                <line x1="0" y1="75" x2="500" y2="75" stroke="rgba(37,44,53,0.3)" strokeWidth="0.5" />
                <line x1="0" y1="125" x2="500" y2="125" stroke="rgba(37,44,53,0.3)" strokeWidth="0.5" />

                {/* Areas */}
                <path
                  d="M 0,140 Q 80,100 160,110 T 320,50 T 500,60 L 500,150 L 0,150 Z"
                  fill="url(#loadGrad)"
                />
                <path
                  d="M 0,120 Q 80,80 160,95 T 320,65 T 500,75 L 500,150 L 0,150 Z"
                  fill="url(#supplyGrad)"
                />

                {/* Lines */}
                <path
                  d="M 0,140 Q 80,100 160,110 T 320,50 T 500,60"
                  fill="none"
                  stroke="#f5a623"
                  strokeWidth="2"
                />
                <path
                  d="M 0,120 Q 80,80 160,95 T 320,65 T 500,75"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />

                {/* Pinging Hotspots on current values */}
                <circle cx="500" cy="60" r="4" fill="#f5a623" />
                <circle cx="500" cy="75" r="3.5" fill="#22c55e" />
              </svg>

              <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-2 font-mono text-[8px] text-gray-500">
                <div className="flex justify-between">
                  <span>1.4k MT</span>
                  <span>SUPPLY CAP REF (AMBER: REFILL, GREEN: OUTFLOW)</span>
                </div>
                <div className="flex justify-between">
                  <span>700 MT</span>
                  <span />
                </div>
                <div className="flex justify-between">
                  <span>0 MT</span>
                  <span />
                </div>
              </div>
            </div>

            {/* Graph Legend */}
            <div className="flex items-center justify-center gap-6 mt-3 pt-2 border-t border-[#1b232c] text-[10px] font-mono text-gray-400">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Aggregated Supply Replenishment</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-0.5 border-t border-dashed border-emerald-500 block" />
                <span>Active Crop/Flock Consumption Rate</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Alerts and Highlights (Span 1) */}
        <div className="space-y-6">
          
          {/* Active alerts panel */}
          <div className="glass-card border border-[#2d3748] rounded-xl p-5 bg-[#0e141b]/80 text-left">
            <div className="flex items-center justify-between border-b border-[#222a36] pb-3 mb-4">
              <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-gray-200">
                Priority System Alerts ({activeAlerts.length})
              </h3>
              <button
                onClick={() => onNavigateToTab('alerts')}
                className="font-mono text-[9px] text-amber-500 hover:text-amber-400 uppercase hover:underline cursor-pointer"
              >
                Log Console &raquo;
              </button>
            </div>

            <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar pr-1">
              {activeAlerts.length === 0 ? (
                <div className="text-center py-6 font-mono text-[10px] text-gray-500">
                  ✓ NO ACTIVE SYSTEM ANOMALIES
                </div>
              ) : (
                activeAlerts.map(alert => (
                  <div
                    key={alert.id}
                    className={`p-2.5 rounded-lg border text-left flex items-start gap-2.5 ${
                      alert.severity === 'critical'
                        ? 'bg-red-500/5 border-red-500/20'
                        : 'bg-amber-500/5 border-amber-500/20'
                    }`}
                  >
                    <span className={`material-symbols-outlined text-base mt-0.5 shrink-0 ${
                      alert.severity === 'critical' ? 'text-red-400 animate-pulse' : 'text-amber-400'
                    }`}>
                      {alert.severity === 'critical' ? 'warning' : 'gavel'}
                    </span>
                    <div className="space-y-1 overflow-hidden">
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-[9px] text-gray-400 font-bold uppercase">
                          {alert.category}
                        </span>
                        <span className="font-mono text-[8px] text-gray-500">
                          {alert.id}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-300 leading-normal truncate-multiline">
                        {alert.description}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Featured highlighted unit - Dynamic focus */}
          <div className="glass-card border border-[#2d3748] rounded-xl p-5 bg-[#0e141b]/80 text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3">
              <span className="bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded text-[8px] font-mono text-amber-400 animate-pulse">
                ACTIVE REFILL STREAM
              </span>
            </div>

            <div className="border-b border-[#222a36] pb-3 mb-4">
              <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-gray-200">
                Primary Monitored Node
              </h3>
              <p className="font-mono text-[9px] text-gray-500 uppercase mt-0.5">
                Real-Time Volumetric Feed Shader
              </p>
            </div>

            {/* Shader layout anchor */}
            <div className="flex justify-center py-2 bg-[#090d11]/85 border border-[#1e2733] rounded-lg p-4">
              <SiloShader silo={highlightedSilo} isLarge={true} />
            </div>

            <div className="mt-4 space-y-2.5 text-xs font-mono">
              <div className="flex justify-between border-b border-[#1b232c] pb-1">
                <span className="text-gray-500 uppercase">Selected Unit:</span>
                <span className="text-gray-200 font-bold">{highlightedSilo.id}</span>
              </div>
              <div className="flex justify-between border-b border-[#1b232c] pb-1">
                <span className="text-gray-500 uppercase">Assigned Hub:</span>
                <span className="text-gray-200 font-bold">Anuradhapura Central</span>
              </div>
              <div className="flex justify-between border-b border-[#1b232c] pb-1">
                <span className="text-gray-500 uppercase">Flow Velocity:</span>
                <span className="text-emerald-400 font-bold font-mono">
                  +{highlightedSilo.flowRate.toLocaleString()} kg/hr
                </span>
              </div>
              <button
                onClick={() => onSelectSilo(highlightedSilo.id)}
                className="w-full mt-2 py-1.5 bg-[#1a232d] hover:bg-[#232f3d] border border-[#2d3a4b] text-amber-400 rounded text-[10px] font-mono uppercase tracking-widest text-center transition-colors cursor-pointer"
              >
                Launch Deep Diagnostics &raquo;
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* 3. Global Sustainability Compliance Banner */}
      <div className="glass-card border border-[#2d3748] rounded-xl p-5 bg-gradient-to-r from-emerald-950/20 via-[#0e141b] to-[#0e141b] flex flex-wrap items-center justify-between gap-4 text-left">
        <div className="flex items-center gap-4">
          {/* Circular Indicator */}
          <div className="relative w-14 h-14 flex items-center justify-center rounded-full border-2 border-emerald-500/20 bg-[#0c1015] shrink-0">
            <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="24" fill="none" stroke="#10b981" strokeWidth="4" strokeDasharray="150.79" strokeDashoffset="24.12" />
            </svg>
            <span className="font-mono text-xs font-extrabold text-emerald-400 relative z-10">
              84%
            </span>
          </div>

          <div>
            <h4 className="font-sans text-sm font-extrabold text-gray-200 uppercase tracking-tight">
              Carbon footprint &amp; logistics stability index
            </h4>
            <p className="text-xs text-gray-400 leading-normal max-w-xl">
              Anuradhapura and Kurunegala facilities have achieved Category A carbon reductions through optimized, zero-drift telemetry sensor feedback and localized logistics routing.
            </p>
          </div>
        </div>

        <div className="font-mono text-[10px] text-[#dde3ee] bg-emerald-500/10 border border-emerald-500/20 rounded px-3 py-1.5 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>SUSTAINABILITY CERTIFIED STATUS</span>
        </div>
      </div>
    </div>
  );
};
