import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Farm, Silo, Alert } from '../types';
import { SiloShader } from './SiloShader';
import { generateAllSiloLogs, LoadingLogEntry } from '../data/mockLogs';

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

  const allLogsRef = useRef<Map<string, LoadingLogEntry[]>>(generateAllSiloLogs(silos));

  const dailyTotals = useMemo(() => {
    const now = Date.now();
    const dayMs = 86400000;
    const days: { label: string; loaded: number; unloaded: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now - i * dayMs);
      days.push({
        label: `${d.getMonth() + 1}/${d.getDate()}`,
        loaded: 0,
        unloaded: 0,
      });
    }
    for (const [, logs] of allLogsRef.current) {
      for (const log of logs) {
        const t = new Date(log.timestamp).getTime();
        if (t < now - 30 * dayMs) continue;
        const d = new Date(t);
        const key = `${d.getMonth() + 1}/${d.getDate()}`;
        const idx = days.findIndex(x => x.label === key);
        if (idx === -1) continue;
        if (log.delta > 0) days[idx].loaded += log.delta;
        if (log.delta < 0) days[idx].unloaded += Math.abs(log.delta);
      }
    }
    const maxVal = Math.max(...days.map(d => d.loaded + d.unloaded), 1);
    return days.map(d => ({
      ...d,
      loaded: Math.round(d.loaded / 1000),
      unloaded: Math.round(d.unloaded / 1000),
      pctLoaded: (d.loaded + d.unloaded) / maxVal,
    }));
  }, []);

  const criticalSilo = useMemo(() => {
    const sorted = [...silos]
      .filter(s => s.status !== 'sensor_err')
      .sort((a, b) => {
        const aScore = a.status === 'critical' ? 3 : a.status === 'warning' ? 2 : a.flowRate < 0 ? 1 : 0;
        const bScore = b.status === 'critical' ? 3 : b.status === 'warning' ? 2 : b.flowRate < 0 ? 1 : 0;
        if (bScore !== aScore) return bScore - aScore;
        return a.fillPercent - b.fillPercent;
      });
    return sorted[0] || silos[0];
  }, [silos]);

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
                      <span className="font-mono text-[8px] text-gray-500 uppercase tracking-widest">{farm.province}</span>
                      <span className={`${textColor} font-semibold`}>
                        {(onlineWeight / 1000).toFixed(1)} MT / {(totalCap / 1000).toFixed(0)} MT ({utilizationPercent}%)
                      </span>
                    </div>
                    <div className="relative w-full bg-[#171f2a] h-4 rounded-md overflow-hidden border border-[#222c39]">
                      <div
                        style={{ width: `${utilizationPercent}%` }}
                        className={`h-full ${barColor} rounded-r-md transition-all duration-500 ease-out`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Real daily loading/unloading totals (30-day) */}
          <div className="glass-card border border-[#2d3748] rounded-xl p-5 bg-[#0e141b]/80">
            <div className="flex items-center justify-between border-b border-[#222a36] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500 text-lg">
                  bar_chart
                </span>
                <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-gray-200">
                  Daily Loading &amp; Unloading Volume (30d)
                </h3>
              </div>
              <span className="font-mono text-[9px] bg-amber-500/10 border border-amber-500/20 px-1 py-0.2 text-amber-400 rounded">
                LIVE DATA
              </span>
            </div>

            <div className="flex gap-0 ml-10 h-28 sm:h-32 lg:h-[140px]">
              <div className="flex flex-col justify-between pr-2 py-1 font-mono text-[7px] sm:text-[9px] text-gray-500 text-right shrink-0">
                <span>{Math.max(...dailyTotals.map(d => d.loaded + d.unloaded), 1)}</span>
                <span>{Math.round(Math.max(...dailyTotals.map(d => d.loaded + d.unloaded), 1) / 2)}</span>
                <span>0</span>
              </div>
              <div className="flex-1 flex items-end gap-px">
                {dailyTotals.map((d, i) => {
                  const maxVal = Math.max(...dailyTotals.map(x => x.loaded + x.unloaded), 1);
                  const barMax = 120;
                  const loadH = (d.loaded / maxVal) * barMax;
                  const unloadH = (d.unloaded / maxVal) * barMax;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end h-full relative group">
                      <div className="flex flex-col items-center justify-end w-full h-full max-h-[120px]">
                        {d.loaded > 0 && <div style={{ height: `${Math.max(loadH, 1)}px` }} className="w-full bg-emerald-500/60 rounded-t-sm" />}
                        {d.unloaded > 0 && <div style={{ height: `${Math.max(unloadH, 1)}px` }} className="w-full bg-amber-500/60 rounded-t-sm" />}
                      </div>
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 mb-[-16px] opacity-0 group-hover:opacity-100 bg-[#0e141b] border border-[#2d3748] px-1.5 py-0.5 rounded text-[7px] font-mono text-gray-200 whitespace-nowrap z-10 transition-opacity pointer-events-none">
                        {d.label}: +{d.loaded}/-{d.unloaded} MT
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* X-axis date labels — invisible Y-axis column mirrors the chart exactly */}
            <div className="flex gap-0 ml-10 mt-1">
              <div className="flex flex-col justify-between pr-2 py-1 font-mono text-[7px] sm:text-[9px] text-gray-500 text-right shrink-0 invisible">
                <span>{Math.max(...dailyTotals.map(d => d.loaded + d.unloaded), 1)}</span>
                <span>{Math.round(Math.max(...dailyTotals.map(d => d.loaded + d.unloaded), 1) / 2)}</span>
                <span>0</span>
              </div>
              <div className="flex-1 flex gap-px">
                {dailyTotals.map((d, i) => (
                  <span key={i} className={`flex-1 text-center font-mono text-[6px] sm:text-[7px] text-gray-500 ${
                    i % 5 !== 0 && i !== dailyTotals.length - 1 ? 'hidden sm:block' : ''
                  } ${i % 7 !== 0 ? 'lg:block' : ''}`}>
                    {d.label}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 mt-3 pt-2 border-t border-[#222a36] text-[8px] font-mono text-gray-500">
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500/60 inline-block shrink-0" /><span>Loading</span></div>
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-500/60 inline-block shrink-0" /><span>Unloading</span></div>
            </div>
          </div>

          {/* Network Telemetry Matrix */}
          <div className="glass-card border border-[#2d3748] rounded-xl p-5 bg-[#0e141b]/80 text-left">
            <div>
              <div className="flex items-center justify-between border-b border-[#222a36] pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-500 text-lg">
                    grid_view
                  </span>
                  <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-gray-200">
                    Network Telemetry Matrix
                  </h3>
                </div>
                <span className="font-mono text-[8px] bg-emerald-500/10 border border-emerald-500/20 px-1 py-0.2 text-emerald-400 rounded">
                  ONLINE
                </span>
              </div>

              <p className="text-[10px] text-gray-400 font-mono mb-4 leading-relaxed">
                Click any node in the grid below to launch targeted diagnostics and inspect instantaneous telemetry levels.
              </p>

              {/* Node Matrix by Farm */}
              <div className="space-y-4 max-h-[160px] sm:max-h-[200px] lg:max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                {farms.map(farm => {
                  const farmSilos = silos.filter(s => s.farmId === farm.id);
                  return (
                    <div key={farm.id} className="space-y-1.5 pb-2 border-b border-[#222a36]/40 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <span className="font-sans text-[10px] font-bold text-gray-300 uppercase tracking-wide">
                          {farm.name.split(' ')[0]}
                        </span>
                        <span className="font-mono text-[8px] text-gray-500">
                          {farmSilos.length} Nodes
                        </span>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5">
                        {farmSilos.map(silo => {
                          let statusColor = 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400';
                          if (silo.status === 'critical') {
                            statusColor = 'border-red-500/40 bg-red-500/15 text-red-400 animate-pulse';
                          } else if (silo.status === 'warning') {
                            statusColor = 'border-amber-500/40 bg-amber-500/15 text-amber-400';
                          } else if (silo.status === 'sensor_err') {
                            statusColor = 'border-gray-500/30 bg-gray-500/10 text-gray-400';
                          }

                          // Get last 3 chars of ID (e.g. A01)
                          const shortId = silo.id.substring(silo.id.indexOf('-') + 1);

                          return (
                            <button
                              key={silo.id}
                              onClick={() => onSelectSilo(silo.id)}
                              className={`group relative flex flex-col items-center justify-center p-1.5 rounded border ${statusColor} hover:scale-105 hover:border-amber-500/60 hover:bg-amber-500/10 transition-all cursor-pointer`}
                            >
                              <span className="font-mono text-[9px] font-bold tracking-tight">
                                {shortId}
                              </span>
                              
                              {/* Small fill bar */}
                              <div className="w-full bg-[#1b222c] h-1 rounded-full overflow-hidden mt-1 border border-black/10">
                                <div
                                  style={{ width: `${silo.fillPercent}%` }}
                                  className={`h-full ${silo.status === 'critical' ? 'bg-red-500' : 'bg-emerald-500'}`}
                                />
                              </div>

                              {/* Hover Tooltip Card */}
                              <div className="absolute z-50 bottom-full mb-2 hidden group-hover:block w-44 bg-[#0e141bf5] border border-[#2d3748] rounded-lg shadow-xl p-2.5 text-left pointer-events-none text-gray-200">
                                <div className="flex justify-between items-center border-b border-gray-800 pb-1 mb-1.5">
                                  <span className="font-sans text-[10px] font-extrabold text-amber-500">{silo.id}</span>
                                  <span className="font-mono text-[8px] uppercase px-1 rounded bg-gray-800 text-gray-400">{silo.status}</span>
                                </div>
                                <div className="space-y-1 font-mono text-[9px]">
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Weight:</span>
                                    <span>{(silo.currentWeight / 1000).toFixed(1)} MT</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Percent:</span>
                                    <span>{silo.fillPercent}%</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Flow:</span>
                                    <span className={silo.flowRate < 0 ? 'text-red-400' : silo.flowRate > 0 ? 'text-emerald-400' : 'text-gray-400'}>
                                      {silo.flowRate > 0 ? '+' : ''}{silo.flowRate} kg/h
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Micro KPI Summary */}
            <div className="mt-4 pt-3 border-t border-[#222a36] grid grid-cols-1 sm:grid-cols-2 gap-2 text-center">
              <div className="p-2 rounded bg-[#11171e] border border-[#232c38]">
                <div className="font-sans text-xs font-bold text-emerald-400">
                  {silos.filter(s => s.status !== 'sensor_err' && s.status !== 'critical').length} / {silos.length}
                </div>
                <div className="font-mono text-[8px] text-gray-500 uppercase">Nodes Operational</div>
              </div>
              <div className="p-2 rounded bg-[#11171e] border border-[#232c38]">
                <div className="font-sans text-xs font-bold text-amber-500">
                  {silos.filter(s => s.status === 'critical' || s.status === 'sensor_err').length}
                </div>
                <div className="font-mono text-[8px] text-gray-500 uppercase">Attention Req</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Alerts and Highlights (Span 1) */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          
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

          {/* Primary Monitored Node - most critical silo */}
          <div className="glass-card border border-[#2d3748] rounded-xl p-5 bg-[#0e141b]/80 text-left relative overflow-hidden flex flex-col flex-1">
            <div className="absolute top-0 right-0 p-3">
              <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono animate-pulse ${
                criticalSilo.status === 'critical'
                  ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                  : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
              }`}>
                {criticalSilo.status === 'critical' ? 'CRITICAL' : criticalSilo.flowRate < 0 ? 'ACTIVE DRAIN' : criticalSilo.flowRate > 0 ? 'FILLING' : 'STABLE'}
              </span>
            </div>

            <div className="border-b border-[#222a36] pb-3 mb-4 shrink-0">
              <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-gray-200">
                Priority Monitored Node
              </h3>
              <p className="font-mono text-[9px] text-gray-500 uppercase mt-0.5">
                Most critical silo by status &amp; fill level
              </p>
            </div>

            {/* Shader layout anchor */}
            <div className="flex-1 flex items-center justify-center py-4 bg-[#090d11]/85 border border-[#1e2733] rounded-lg p-4 my-auto">
              <SiloShader silo={criticalSilo} isLarge={true} />
            </div>

            <div className="mt-4 space-y-2.5 text-xs font-mono shrink-0">
              <div className="flex justify-between border-b border-[#1b232c] pb-1">
                <span className="text-gray-500 uppercase">Selected Unit:</span>
                <span className="text-gray-200 font-bold">{criticalSilo.id}</span>
              </div>
              <div className="flex justify-between border-b border-[#1b232c] pb-1">
                <span className="text-gray-500 uppercase">Fill Level:</span>
                <span className={`font-bold ${criticalSilo.fillPercent < 20 ? 'text-red-400' : criticalSilo.fillPercent > 90 ? 'text-amber-400' : 'text-gray-200'}`}>
                  {criticalSilo.fillPercent}%
                </span>
              </div>
              <div className="flex justify-between border-b border-[#1b232c] pb-1">
                <span className="text-gray-500 uppercase">Flow Velocity:</span>
                <span className={`font-bold font-mono ${criticalSilo.flowRate < 0 ? 'text-red-400' : criticalSilo.flowRate > 0 ? 'text-emerald-400' : 'text-gray-400'}`}>
                  {criticalSilo.flowRate > 0 ? '+' : ''}{criticalSilo.flowRate.toLocaleString()} kg/hr
                </span>
              </div>
              <button
                onClick={() => onSelectSilo(criticalSilo.id)}
                className="w-full mt-2 py-1.5 bg-[#1a232d] hover:bg-[#232f3d] border border-[#2d3a4b] text-amber-400 rounded text-[10px] font-mono uppercase tracking-widest text-center transition-colors cursor-pointer"
              >
                Launch Deep Diagnostics &raquo;
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
