import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Farm, Silo } from '../types';
import { generateAllSiloLogs, LoadingLogEntry } from '../data/mockLogs';

interface AnalysisTabProps {
  farms: Farm[];
  silos: Silo[];
}

type AnalysisScope = 'company' | 'branch' | 'silo';
type TimePeriod = 'daily' | 'monthly' | 'annual';

interface TrendPoint {
  label: string;
  loaded: number;
  unloaded: number;
}

interface MonthlyAgg {
  month: string;
  label: string;
  loaded: number;
  unloaded: number;
  events: number;
}

interface DailyAgg {
  day: string;
  label: string;
  loaded: number;
  unloaded: number;
}

interface SiloStats {
  siloId: string;
  siloName: string;
  farmId: string;
  farmName: string;
  capacity: number;
  latestWeight: number;
  latestFillPct: number;
  totalLoaded: number;
  totalUnloaded: number;
  loadEvents: number;
  unloadEvents: number;
  avgInFlow: number;
  avgOutFlow: number;
  daysSinceLastEvent: number;
  trend: 'rising' | 'declining' | 'stable';
}



function computeSiloStats(silo: Silo, logs: LoadingLogEntry[], farms: Farm[], cutoffTime: number): SiloStats {
  const farm = farms.find(f => f.id === silo.farmId);
  const recentLogs = logs.filter(l => new Date(l.timestamp).getTime() >= cutoffTime).slice(0, 90);
  let totalLoaded = 0, totalUnloaded = 0, loadEvents = 0, unloadEvents = 0;
  let inFlowSum = 0, outFlowSum = 0, inFlowCount = 0, outFlowCount = 0;

  for (const log of recentLogs) {
    if (log.delta > 0) { totalLoaded += log.delta; loadEvents++; if (log.flowRate > 0) { inFlowSum += log.flowRate; inFlowCount++; } }
    if (log.delta < 0) { totalUnloaded += Math.abs(log.delta); unloadEvents++; if (log.flowRate < 0) { outFlowSum += Math.abs(log.flowRate); outFlowCount++; } }
  }

  const latest = logs.length > 0 ? logs[0] : null;
  const now = Date.now();
  const daysSinceLastEvent = latest ? Math.round((now - new Date(latest.timestamp).getTime()) / 86400000) : 0;

  const lookback = logs.slice(0, 60);
  const recentDeltas = lookback.filter(l => l.delta !== 0).map(l => l.delta);
  const avgDelta = recentDeltas.length > 20 ? recentDeltas.slice(0, 20).reduce((a, b) => a + b, 0) / 20 : 0;
  const trend: 'rising' | 'declining' | 'stable' = avgDelta > 100 ? 'rising' : avgDelta < -100 ? 'declining' : 'stable';

  return {
    siloId: silo.id,
    siloName: silo.name,
    farmId: silo.farmId,
    farmName: farm?.name || 'Unknown',
    capacity: silo.capacity,
    latestWeight: latest?.weight ?? silo.currentWeight,
    latestFillPct: latest ? Math.round((latest.weight / silo.capacity) * 100) : silo.fillPercent,
    totalLoaded: Math.round(totalLoaded / 1000),
    totalUnloaded: Math.round(totalUnloaded / 1000),
    loadEvents,
    unloadEvents,
    avgInFlow: inFlowCount > 0 ? Math.round(inFlowSum / inFlowCount) : 0,
    avgOutFlow: outFlowCount > 0 ? Math.round(outFlowSum / outFlowCount) : 0,
    daysSinceLastEvent,
    trend,
  };
}

function computeMonthlyAggs(filteredSiloIds: string[], allLogs: Map<string, LoadingLogEntry[]>, cutoffTime: number, monthsBack: number): MonthlyAgg[] {
  const monthlyMap = new Map<string, { loaded: number; unloaded: number; events: number }>();
  const months: string[] = [];
  const now = new Date();
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    months.push(key);
    monthlyMap.set(key, { loaded: 0, unloaded: 0, events: 0 });
  }

  for (const siloId of filteredSiloIds) {
    const logs = allLogs.get(siloId) || [];
    for (const log of logs) {
      if (new Date(log.timestamp).getTime() < cutoffTime) continue;
      const d = new Date(log.timestamp);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const agg = monthlyMap.get(key);
      if (!agg) continue;
      if (log.delta > 0) { agg.loaded += log.delta; agg.events++; }
      if (log.delta < 0) { agg.unloaded += Math.abs(log.delta); agg.events++; }
    }
  }

  return months.map(m => ({
    month: m,
    label: monthlyMap.get(m)?.loaded !== undefined
      ? new Date(m + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      : m,
    loaded: Math.round((monthlyMap.get(m)?.loaded || 0) / 1000),
    unloaded: Math.round((monthlyMap.get(m)?.unloaded || 0) / 1000),
    events: monthlyMap.get(m)?.events || 0,
  }));
}

function computeDailyAggs(filteredSiloIds: string[], allLogs: Map<string, LoadingLogEntry[]>, cutoffTime: number, daysBack: number): DailyAgg[] {
  const dailyMap = new Map<string, { loaded: number; unloaded: number }>();
  const days: string[] = [];
  const now = Date.now();
  const dayMs = 86400000;
  for (let i = daysBack - 1; i >= 0; i--) {
    const d = new Date(now - i * dayMs);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    days.push(key);
    dailyMap.set(key, { loaded: 0, unloaded: 0 });
  }

  for (const siloId of filteredSiloIds) {
    const logs = allLogs.get(siloId) || [];
    for (const log of logs) {
      if (new Date(log.timestamp).getTime() < cutoffTime) continue;
      const d = new Date(log.timestamp);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const agg = dailyMap.get(key);
      if (!agg) continue;
      if (log.delta > 0) agg.loaded += log.delta;
      if (log.delta < 0) agg.unloaded += Math.abs(log.delta);
    }
  }

  return days.map(d => ({
    day: d,
    label: d.slice(5),
    loaded: Math.round((dailyMap.get(d)?.loaded || 0) / 1000),
    unloaded: Math.round((dailyMap.get(d)?.unloaded || 0) / 1000),
  }));
}

export const AnalysisTab: React.FC<AnalysisTabProps> = ({ farms, silos }) => {
  const [scope, setScope] = useState<AnalysisScope>('company');
  const [branchSearch, setBranchSearch] = useState('');
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [siloSearch, setSiloSearch] = useState('');
  const [selectedSilo, setSelectedSilo] = useState<string>('');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('monthly');
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [siloDropdownOpen, setSiloDropdownOpen] = useState(false);
  const observerRef = useRef<ResizeObserver | null>(null);
  const [chartWidth, setChartWidth] = useState(600);
  const chartAreaRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) { observerRef.current.disconnect(); observerRef.current = null; }
    if (!node) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) setChartWidth(entry.contentRect.width);
    });
    ro.observe(node);
    observerRef.current = ro;
  }, []);

  const allLogsRef = useRef<Map<string, LoadingLogEntry[]>>(generateAllSiloLogs(silos));
  const stableSilosRef = useRef<Silo[]>(silos);
  const stableFarmsRef = useRef<Farm[]>(farms);

  const cutoffTime = useMemo(() => {
    const now = Date.now();
    const dayMs = 86400000;
    switch (timePeriod) {
      case 'daily': return now - 30 * dayMs;
      case 'monthly': return now - 180 * dayMs;
      case 'annual': return now - 365 * dayMs;
    }
  }, [timePeriod]);

  const monthsBack = useMemo(() => {
    switch (timePeriod) {
      case 'daily': return 1;
      case 'monthly': return 6;
      case 'annual': return 12;
    }
  }, [timePeriod]);

  const daysBack = useMemo(() => {
    switch (timePeriod) {
      case 'daily': return 30;
      case 'monthly': return 30;
      case 'annual': return 90;
    }
  }, [timePeriod]);

  const periodLabel = useMemo(() => {
    switch (timePeriod) {
      case 'daily': return '30-Day';
      case 'monthly': return '6-Month';
      case 'annual': return '12-Month';
    }
  }, [timePeriod]);

  const filteredSiloIds = useMemo(() => {
    const silos = stableSilosRef.current;
    if (scope === 'company') return silos.map(s => s.id);
    if (scope === 'branch') {
      if (selectedBranches.length === 0) return [];
      return silos.filter(s => selectedBranches.includes(s.farmId)).map(s => s.id);
    }
    if (scope === 'silo') {
      if (!selectedSilo) return [];
      return [selectedSilo];
    }
    return [];
  }, [scope, selectedBranches, selectedSilo]);

  const filteredFarms = useMemo(() => {
    const silos = stableSilosRef.current;
    const farms = stableFarmsRef.current;
    const farmIds = new Set(silos.filter(s => filteredSiloIds.includes(s.id)).map(s => s.farmId));
    return farms.filter(f => farmIds.has(f.id));
  }, [filteredSiloIds]);

  const siloStatsList = useMemo(() => {
    const silos = stableSilosRef.current;
    const farms = stableFarmsRef.current;
    return filteredSiloIds.map(id => {
      const silo = silos.find(s => s.id === id);
      if (!silo) return null;
      const logs = allLogsRef.current.get(id) || [];
      return computeSiloStats(silo, logs, farms, cutoffTime);
    }).filter(Boolean) as SiloStats[];
  }, [filteredSiloIds, cutoffTime]);

  const totalLoaded = siloStatsList.reduce((a, s) => a + s.totalLoaded, 0);
  const totalUnloaded = siloStatsList.reduce((a, s) => a + s.totalUnloaded, 0);
  const totalCapacity = siloStatsList.reduce((a, s) => a + s.capacity, 0);
  const totalCurrent = siloStatsList.reduce((a, s) => a + s.latestWeight, 0);
  const avgFill = siloStatsList.length > 0
    ? Math.round(siloStatsList.reduce((a, s) => a + s.latestFillPct, 0) / siloStatsList.length)
    : 0;
  const surplusPercent = totalCapacity > 0 ? Math.round(((totalCapacity - totalCurrent) / totalCapacity) * 100) : 0;

  const activeSilos = siloStatsList.filter(s => s.daysSinceLastEvent < 7).length;

  const shortfalls = useMemo(() => {
    return siloStatsList
      .filter(s => s.trend === 'declining' && (s.latestFillPct < 20 || s.daysSinceLastEvent < 2))
      .map(s => {
        const hoursLeft = s.avgOutFlow > 0 ? Math.round((s.latestWeight / 1000) / s.avgOutFlow * 24) : Math.round(s.latestFillPct * 2.4);
        return {
          siloId: s.siloId,
          farmName: s.farmName,
          feedType: stableSilosRef.current.find(x => x.id === s.siloId)?.type || '',
          currentLevel: s.latestFillPct,
          hoursLeft: Math.max(1, hoursLeft),
        };
      })
      .sort((a, b) => a.hoursLeft - b.hoursLeft);
  }, [siloStatsList]);

  const monthlyAggs = useMemo(() => computeMonthlyAggs(filteredSiloIds, allLogsRef.current, cutoffTime, monthsBack), [filteredSiloIds, cutoffTime, monthsBack]);
  const dailyAggs = useMemo(() => computeDailyAggs(filteredSiloIds, allLogsRef.current, cutoffTime, daysBack), [filteredSiloIds, cutoffTime, daysBack]);

  const trendPoints = useMemo((): TrendPoint[] => {
    if (timePeriod === 'daily') return dailyAggs;
    return monthlyAggs;
  }, [timePeriod, dailyAggs, monthlyAggs]);

  const peakDay = useMemo(() => {
    if (dailyAggs.length === 0) return null;
    return dailyAggs.reduce((a, b) => (a.loaded + a.unloaded > b.loaded + b.unloaded ? a : b));
  }, [dailyAggs]);

  const busiestMonth = useMemo(() => {
    if (monthlyAggs.length === 0) return null;
    return monthlyAggs.reduce((a, b) => (a.loaded + a.unloaded > b.loaded + b.unloaded ? a : b));
  }, [monthlyAggs]);

  const avgDailyThroughput = useMemo(() => {
    if (dailyAggs.length === 0) return 0;
    const total = dailyAggs.reduce((a, d) => a + d.loaded + d.unloaded, 0);
    return Math.round(total / dailyAggs.length);
  }, [dailyAggs]);

  const [compareSiloIds, setCompareSiloIds] = useState<string[]>([]);

  const toggleCompareSilo = (id: string) => {
    setCompareSiloIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const weightTrajectories = useMemo(() => {
    const now = Date.now();
    const dayMs = 86400000;
    const labels: string[] = [];
    const siloData: { id: string; name: string; points: number[] }[] = [];
    const ids = compareSiloIds.length > 0 ? compareSiloIds : filteredSiloIds.slice(0, 5);
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now - i * dayMs);
      labels.push(`${d.getMonth() + 1}/${d.getDate()}`);
    }
    for (const id of ids) {
      const silo = stableSilosRef.current.find(s => s.id === id);
      if (!silo) continue;
      const logs = allLogsRef.current.get(id) || [];
      const points: number[] = [];
      for (let i = 29; i >= 0; i--) {
        const dayStart = now - i * dayMs;
        const dayEnd = dayStart + dayMs;
        const dayLogs = logs.filter(l => {
          const t = new Date(l.timestamp).getTime();
          return t >= dayStart && t < dayEnd && l.type !== 'stable';
        });
        const last = dayLogs.length > 0 ? dayLogs[dayLogs.length - 1] : null;
        points.push(last ? last.weight : (i === 0 ? silo.currentWeight : 0));
      }
      siloData.push({ id: silo.id, name: silo.name, points });
    }
    return { labels, series: siloData };
  }, [filteredSiloIds, compareSiloIds]);

  const exportAnalysisCSV = () => {
    const header = 'Silo ID,Farm,Capacity (kg),Current Weight (kg),Fill %,Total Loaded (MT),Total Unloaded (MT),Trend\n';
    const rows = siloStatsList.map(s =>
      `${s.siloId},${s.farmName},${s.capacity},${s.latestWeight},${s.latestFillPct},${s.totalLoaded},${s.totalUnloaded},${s.trend}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'analysis_report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredBranchList = useMemo(() =>
    stableFarmsRef.current.filter(f =>
      f.name.toLowerCase().includes(branchSearch.toLowerCase())
    ),
  [branchSearch]);

  const filteredSiloList = useMemo(() => {
    const silos = stableSilosRef.current;
    const farms = stableFarmsRef.current;
    return silos.filter(s => {
      const farm = farms.find(f => f.id === s.farmId);
      return s.id.toLowerCase().includes(siloSearch.toLowerCase()) ||
        s.name.toLowerCase().includes(siloSearch.toLowerCase()) ||
        (farm?.name || '').toLowerCase().includes(siloSearch.toLowerCase());
    });
  }, [siloSearch]);

  const toggleBranch = (id: string) => {
    setSelectedBranches(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectedBranchNames = useMemo(() => {
    const farms = stableFarmsRef.current;
    return selectedBranches.map(id => {
      const f = farms.find(x => x.id === id);
      return f ? f.name.split(' ')[0] : '';
    }).filter(Boolean);
  }, [selectedBranches]);

  const siloSearchDisplay = useMemo(() => {
    if (scope === 'silo' && selectedSilo) {
      return selectedSilo;
    }
    return siloSearch;
  }, [scope, selectedSilo, siloSearch]);

  const selectedSiloName = useMemo(() => {
    if (!selectedSilo) return '';
    const s = stableSilosRef.current.find(x => x.id === selectedSilo);
    return s?.name || '';
  }, [selectedSilo]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#222a36] pb-4 text-left">
        <div>
          <h2 className="font-sans text-sm font-black text-gray-200 uppercase tracking-tight">
            Enterprise Consumption &amp; Predictive Forecasting
          </h2>
          <p className="font-mono text-[9px] text-gray-500 uppercase mt-0.5">
            Statistical regression models &bull; Auto-predicted supply shortages &bull; Depot utilization audits
          </p>
        </div>
        <div className="font-mono text-[9px] text-gray-400 bg-[#161f2a] border border-[#2d3748] px-2 py-0.5 rounded">
          MODEL RE-CALCULATION FREQUENCY: 24H
        </div>
      </div>

      {/* Scope Filter Bar */}
      <div className="glass-card border border-[#2d3748] rounded-xl p-4 bg-[#0e141b]/90 overflow-visible relative z-40">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 border-r border-[#222a36] pr-3">
            {(['company', 'branch', 'silo'] as AnalysisScope[]).map(s => (
              <button key={s} onClick={() => { setScope(s); setBranchDropdownOpen(false); setSiloDropdownOpen(false); }}
                className={`px-2.5 py-1.5 rounded font-mono text-[9px] font-bold uppercase border tracking-tight transition-all duration-150 cursor-pointer ${
                  scope === s
                    ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                    : 'bg-transparent border-[#222b35] text-gray-400 hover:border-gray-500'
                }`}>
                {s === 'company' ? 'Company' : s === 'branch' ? 'Branch' : 'Silo'}
              </button>
            ))}
          </div>

          {/* Period filter */}
          <div className="flex items-center gap-1 border-r border-[#222a36] pr-3">
            {(['daily', 'monthly', 'annual'] as TimePeriod[]).map(p => (
              <button key={p} onClick={() => setTimePeriod(p)}
                className={`px-2.5 py-1.5 rounded font-mono text-[9px] font-bold uppercase border tracking-tight transition-all duration-150 cursor-pointer ${
                  timePeriod === p
                    ? 'bg-sky-500/10 border-sky-500 text-sky-400'
                    : 'bg-transparent border-[#222b35] text-gray-400 hover:border-gray-500'
                }`}>
                {p === 'daily' ? 'Daily' : p === 'monthly' ? 'Monthly' : 'Annual'}
              </button>
            ))}
          </div>

          {/* Branch multi-select */}
          {scope === 'branch' && (
            <div className="relative flex-1 max-w-sm">
              <div className="flex items-center gap-1">
                <div className="flex-1 flex flex-wrap items-center gap-1 bg-[#11171e] border border-[#232c38] rounded px-2 py-1 min-h-[32px] cursor-text"
                  onClick={() => setBranchDropdownOpen(true)}>
                  {selectedBranchNames.length > 0 && !branchSearch ? (
                    selectedBranchNames.map((name, i) => (
                      <span key={i} className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 rounded px-1.5 py-0.5 font-mono text-[9px] text-amber-400">
                        {name}
                        <button onClick={(e) => { e.stopPropagation(); toggleBranch(selectedBranches[i]); }}
                          className="text-amber-400/60 hover:text-amber-300 cursor-pointer">&times;</button>
                      </span>
                    ))
                  ) : null}
                  <input type="text" value={branchSearch} onChange={e => setBranchSearch(e.target.value)}
                    onFocus={() => setBranchDropdownOpen(true)}
                    placeholder={selectedBranchNames.length > 0 ? '' : 'Search branches...'}
                    className="flex-1 bg-transparent border-none outline-none font-mono text-[10px] text-gray-200 placeholder:text-gray-600 min-w-[80px]" />
                </div>
                <button onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
                  className="px-2 py-1 border border-[#232c38] rounded text-gray-400 hover:text-gray-200 font-mono text-[9px] cursor-pointer shrink-0">
                  {branchDropdownOpen ? '\u25B2' : '\u25BC'}
                </button>
              </div>
              {branchDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#11171e] border border-[#232c38] rounded max-h-48 overflow-y-auto custom-scrollbar z-50 shadow-xl">
                  {filteredBranchList.length === 0 ? (
                    <div className="p-3 text-center font-mono text-[9px] text-gray-500">No branches found</div>
                  ) : (
                    filteredBranchList.map(f => (
                      <label key={f.id} className="flex items-center gap-2 px-3 py-2 hover:bg-[#1a222c] cursor-pointer transition-colors">
                        <input type="checkbox" checked={selectedBranches.includes(f.id)}
                          onChange={() => toggleBranch(f.id)}
                          className="accent-amber-500" />
                        <span className="font-mono text-[10px] text-gray-200">{f.name}</span>
                        <span className="font-mono text-[8px] text-gray-500 ml-auto">{f.siloCount} silos</span>
                      </label>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Silo single-select */}
          {scope === 'silo' && (
            <div className="relative flex-1 max-w-sm">
              <div className="flex items-center gap-1">
                <input type="text" value={siloSearchDisplay} onChange={e => { setSiloSearch(e.target.value); if (e.target.value !== selectedSilo) setSelectedSilo(''); }}
                  onFocus={() => setSiloDropdownOpen(true)}
                  placeholder="Search silos..."
                  className="flex-1 bg-[#11171e] border border-[#232c38] rounded px-2 py-1 font-mono text-[10px] text-gray-200 focus:border-amber-500 focus:outline-none placeholder:text-gray-600" />
                <button onClick={() => setSiloDropdownOpen(!siloDropdownOpen)}
                  className="px-2 py-1 border border-[#232c38] rounded text-gray-400 hover:text-gray-200 font-mono text-[9px] cursor-pointer shrink-0">
                  {'\u25BC'}
                </button>
              </div>
              {selectedSilo && (
                <div className="mt-1 font-mono text-[8px] text-gray-500 px-1">{selectedSiloName}</div>
              )}
              {siloDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#11171e] border border-[#232c38] rounded max-h-48 overflow-y-auto custom-scrollbar z-50 shadow-xl">
                  {filteredSiloList.length === 0 ? (
                    <div className="p-3 text-center font-mono text-[9px] text-gray-500">No silos found</div>
                  ) : (
                    filteredSiloList.map(s => {
                      const parentFarm = farms.find(f => f.id === s.farmId);
                      return (
                        <button key={s.id} onClick={() => { setSelectedSilo(s.id); setSiloDropdownOpen(false); setSiloSearch(s.id); }}
                          className={`w-full text-left px-3 py-2 hover:bg-[#1a222c] transition-colors cursor-pointer ${
                            selectedSilo === s.id ? 'bg-amber-500/5' : ''
                          }`}>
                          <span className="font-mono text-[10px] text-gray-200 block">{s.id}</span>
                          <span className="font-mono text-[8px] text-gray-500 block">{s.name} &bull; {parentFarm?.name || 'Unknown'}</span>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card border border-[#2d3748] rounded-xl p-5 bg-[#0e141b]/90 text-left">
          <span className="font-mono text-[9px] text-gray-500 uppercase tracking-widest block mb-1">
            {scope === 'company' ? 'Enterprise' : 'Filtered'} Utilization Index
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="font-sans text-2xl font-black text-emerald-400">
              {siloStatsList.length > 0 ? `${avgFill}%` : '--'}
            </span>
            <span className="font-mono text-[10px] text-gray-400">avg fill</span>
          </div>
          <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
            {siloStatsList.length === 0
              ? 'No data for current selection.'
              : `${activeSilos} active of ${siloStatsList.length} silos monitored across ${filteredFarms.length} branch${filteredFarms.length > 1 ? 'es' : ''}.`
            }
          </p>
        </div>

        <div className="glass-card border border-[#2d3748] rounded-xl p-5 bg-[#0e141b]/90 text-left">
          <span className="font-mono text-[9px] text-gray-500 uppercase tracking-widest block mb-1">
            Throughput Volume ({periodLabel})
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="font-sans text-2xl font-black text-amber-500">
              {siloStatsList.length > 0 ? `${totalLoaded} MT` : '--'}
            </span>
            <span className="font-mono text-[10px] text-gray-400">loaded</span>
          </div>
          <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
            {siloStatsList.length === 0
              ? 'No data for current selection.'
              : `${totalUnloaded} MT unloaded &bull; ${siloStatsList.reduce((a, s) => a + s.loadEvents + s.unloadEvents, 0)} total events.`
            }
          </p>
        </div>

        <div className="glass-card border border-[#2d3748] rounded-xl p-5 bg-[#0e141b]/90 text-left">
          <span className="font-mono text-[9px] text-gray-500 uppercase tracking-widest block mb-1">
            Volumetric Cushion Margin
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="font-sans text-2xl font-black text-gray-200">
              {siloStatsList.length > 0 ? `${surplusPercent}%` : '--'}
            </span>
            <span className="font-mono text-[10px] text-gray-400">safety buffer</span>
          </div>
          <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
            {siloStatsList.length === 0
              ? 'No data for current selection.'
              : `${((totalCapacity - totalCurrent) / 1000).toFixed(0)} MT free across ${siloStatsList.length} silo${siloStatsList.length > 1 ? 's' : ''}.`
            }
          </p>
        </div>
      </div>

      {/* Main Bento grid — individual rows for horizontal alignment */}
      <div className="text-left space-y-4">
        {/* Row 1: Trend Chart + Shortfalls */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-7">
            {/* Single Trend Line Chart */}
            <div className="glass-card border border-[#2d3748] rounded-xl p-5 bg-[#0e141b]/90 h-full">
              <div className="flex items-center justify-between border-b border-[#222a36] pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-500 text-lg">trending_up</span>
                  <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-gray-200">
                    Loading &amp; Unloading Trend
                  </h3>
                </div>
                <span className="font-mono text-[8px] text-gray-500">{periodLabel} &bull; {timePeriod === 'daily' ? 'daily' : 'monthly'} buckets</span>
              </div>

              {siloStatsList.length === 0 ? (
                <div className="py-12 text-center text-gray-500 font-mono text-[10px]">Select a branch or silo to view data.</div>
              ) : (
                <div key={`${scope}-${timePeriod}-${selectedBranches.join(',')}-${selectedSilo}`}>
                  <div className="flex gap-0 ml-10 h-32 sm:h-44 lg:h-[180px]">
                    <div className="flex flex-col justify-between pr-2 py-1 font-mono text-[7px] sm:text-[9px] text-gray-500 text-right shrink-0">
                      <span>{Math.max(...trendPoints.map(p => p.loaded + p.unloaded), 1)}</span>
                      <span>{Math.round(Math.max(...trendPoints.map(p => p.loaded + p.unloaded), 1) / 2)}</span>
                      <span>0</span>
                    </div>
                    <div ref={chartAreaRef} className="flex-1 relative">
                      {trendPoints.length > 0 && (() => {
                        const viewW = 1200;
                        const h = 180;
                        const pad = { top: 10, bottom: 20, left: 0, right: 0 };
                        const plotW = viewW - pad.left - pad.right;
                        const plotH = h - pad.top - pad.bottom;
                        const maxVal = Math.max(...trendPoints.map(p => p.loaded + p.unloaded), 1);
                        const xScale = (i: number) => pad.left + (i / (trendPoints.length - 1 || 1)) * plotW;
                        const yScale = (v: number) => pad.top + plotH - (v / maxVal) * plotH;
                        const loadPath = trendPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${xScale(i)},${yScale(p.loaded)}`).join(' ');
                        const unloadPath = trendPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${xScale(i)},${yScale(p.unloaded)}`).join(' ');

                        return (
                          <svg width="100%" height="100%" viewBox={`0 0 ${viewW} ${h}`} preserveAspectRatio="none" className="overflow-visible">
                            <line x1="0" y1={yScale(0)} x2={viewW} y2={yScale(0)} stroke="rgba(37,44,53,0.3)" strokeWidth="0.5" />
                            <line x1="0" y1={yScale(maxVal / 2)} x2={viewW} y2={yScale(maxVal / 2)} stroke="rgba(37,44,53,0.3)" strokeWidth="0.5" />
                            <path d={loadPath} fill="none" stroke="rgba(52,211,153,0.8)" strokeWidth="2" strokeLinejoin="round" />
                            <path d={unloadPath} fill="none" stroke="rgba(245,166,35,0.8)" strokeWidth="2" strokeLinejoin="round" />
                            {trendPoints.map((p, i) => (
                              <g key={i} className="group/point">
                                <circle cx={xScale(i)} cy={yScale(p.loaded)} r="3" fill="rgba(52,211,153,0.9)" stroke="#0e141b" strokeWidth="1" />
                                <circle cx={xScale(i)} cy={yScale(p.unloaded)} r="3" fill="rgba(245,166,35,0.9)" stroke="#0e141b" strokeWidth="1" />
                                <rect x={xScale(i) - 24} y="4" width="48" height="32" fill="rgba(14,20,27,0.95)" rx="3" className="opacity-0 group-hover/point:opacity-100 transition-opacity pointer-events-none" stroke="#2d3748" strokeWidth="0.5" />
                                <text x={xScale(i)} y="14" textAnchor="middle" fill="#9ca3af" fontSize="7" fontFamily="monospace" className="opacity-0 group-hover/point:opacity-100 transition-opacity pointer-events-none">{p.label}</text>
                                <text x={xScale(i)} y="24" textAnchor="middle" fill="rgba(52,211,153,0.9)" fontSize="7" fontFamily="monospace" className="opacity-0 group-hover/point:opacity-100 transition-opacity pointer-events-none">&#9650;{p.loaded}</text>
                                <text x={xScale(i)} y="33" textAnchor="middle" fill="rgba(245,166,35,0.9)" fontSize="7" fontFamily="monospace" className="opacity-0 group-hover/point:opacity-100 transition-opacity pointer-events-none">&#9660;{p.unloaded}</text>
                              </g>
                            ))}
                          </svg>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-4 mt-2 pt-2 border-t border-[#222a36] text-[8px] font-mono text-gray-500">
                    <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400/80 inline-block shrink-0" /><span>Loading</span></div>
                    <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400/80 inline-block shrink-0" /><span>Unloading</span></div>
                    <span className="text-gray-600">|</span>
                    <span className="text-gray-400">Avg: {avgDailyThroughput} MT/{timePeriod === 'daily' ? 'day' : 'mo'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="lg:col-span-5">
            {/* Shortfalls */}
            <div className="glass-card border border-[#2d3748] rounded-xl p-5 bg-[#0e141b]/90 h-full">
              <div className="flex items-center justify-between border-b border-[#222a36] pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-500 text-lg animate-pulse">gavel</span>
                  <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-gray-200">
                    Predicted Shortfalls
                  </h3>
                </div>
                {shortfalls.length > 0 && (
                  <span className="font-mono text-[9px] text-red-400 bg-red-500/10 border border-red-500/20 px-1 py-0.2 rounded animate-pulse">
                    {shortfalls.length} AT RISK
                  </span>
                )}
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                {siloStatsList.length === 0 ? (
                  <div className="py-8 text-center text-gray-500 font-mono text-[10px]">Select a branch or silo to view data.</div>
                ) : shortfalls.length === 0 ? (
                  <div className="py-8 text-center text-gray-500 font-mono text-[10px]">
                    &#10003; ALL SELECTED SILOS ARE ABOVE SAFE STOCK LEVELS
                  </div>
                ) : (
                  shortfalls.slice(0, 6).map((s, idx) => (
                    <div key={idx}
                      className="p-2.5 bg-[#11171e] border border-[#222c37] hover:border-red-500/40 rounded-lg flex items-center justify-between gap-2 transition-colors">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <strong className="font-sans text-[10px] text-gray-100">{s.siloId}</strong>
                          <span className="font-mono text-[7px] bg-[#1a222c] px-1 text-amber-500 rounded font-bold shrink-0">{s.feedType.split(' ')[0]}</span>
                        </div>
                        <span className="font-mono text-[8px] text-gray-500 block truncate">{s.farmName}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <span className="text-[8px] font-mono text-gray-500 block">LEVEL</span>
                          <strong className="text-red-400 font-mono text-[10px]">{s.currentLevel}%</strong>
                        </div>
                        <div className="text-right">
                          <span className="text-[8px] font-mono text-gray-500 block">DUE</span>
                          <strong className="text-red-500 font-mono text-[10px] animate-pulse">{s.hoursLeft}h</strong>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Summary Stats + Weight Trajectory */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-7">
            {/* Historical Summary Stats */}
            <div className="glass-card border border-[#2d3748] rounded-xl p-5 bg-[#0e141b]/90 h-full">
              <div className="flex items-center justify-between border-b border-[#222a36] pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-500 text-lg">analytics</span>
                  <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-gray-200">
                    Throughput History Summary
                  </h3>
                </div>
              </div>

              {siloStatsList.length === 0 ? (
                <div className="py-8 text-center text-gray-500 font-mono text-[10px]">Select a branch or silo to view data.</div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-[#11171e] border border-[#222c37] rounded-lg p-3">
                    <div className="font-mono text-[7px] text-gray-500 uppercase">{periodLabel} Loaded</div>
                    <div className="font-sans text-lg font-black text-emerald-400">{monthlyAggs.reduce((a, m) => a + m.loaded, 0)} MT</div>
                    <div className="font-mono text-[7px] text-gray-500">{monthlyAggs.reduce((a, m) => a + m.events, 0)} events</div>
                  </div>
                  <div className="bg-[#11171e] border border-[#222c37] rounded-lg p-3">
                    <div className="font-mono text-[7px] text-gray-500 uppercase">{periodLabel} Unloaded</div>
                    <div className="font-sans text-lg font-black text-amber-400">{monthlyAggs.reduce((a, m) => a + m.unloaded, 0)} MT</div>
                    <div className="font-mono text-[7px] text-gray-500">{monthlyAggs.reduce((a, m) => a + m.events, 0)} events</div>
                  </div>
                  <div className="bg-[#11171e] border border-[#222c37] rounded-lg p-3">
                    <div className="font-mono text-[7px] text-gray-500 uppercase">Peak Day</div>
                    <div className="font-sans text-lg font-black text-gray-200">{peakDay ? `${peakDay.loaded + peakDay.unloaded}` : '--'} MT</div>
                    <div className="font-mono text-[7px] text-gray-500">{peakDay?.label || '--'}</div>
                  </div>
                  <div className="bg-[#11171e] border border-[#222c37] rounded-lg p-3">
                    <div className="font-mono text-[7px] text-gray-500 uppercase">Busiest Month</div>
                    <div className="font-sans text-lg font-black text-amber-500">{busiestMonth ? `${busiestMonth.loaded + busiestMonth.unloaded}` : '--'} MT</div>
                    <div className="font-mono text-[7px] text-gray-500">{busiestMonth?.label || '--'}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="lg:col-span-5">
            {/* Weight Trajectory */}
            <div className="glass-card border border-[#2d3748] rounded-xl p-5 bg-[#0e141b]/90 h-full">
              <div className="flex items-center justify-between border-b border-[#222a36] pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-500 text-lg">show_chart</span>
                  <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-gray-200">
                    Weight Trajectory &amp; Projection
                  </h3>
                </div>
              </div>
              {siloStatsList.length === 0 ? (
                <div className="py-10 text-center text-gray-500 font-mono text-[10px]">Select a branch or silo to view data.</div>
              ) : (
                <>
                  <div className="flex gap-0 ml-8 h-32 sm:h-40 lg:h-[150px]">
                    <div className="flex flex-col justify-between pr-2 py-1 font-mono text-[7px] sm:text-[9px] text-gray-500 text-right shrink-0">
                      {(() => {
                        const allVals = weightTrajectories.series.flatMap(s => s.points);
                        const maxW = Math.max(...allVals, 1);
                        return <><span>{maxW}</span><span>{Math.round(maxW / 2)}</span><span>0</span></>;
                      })()}
                    </div>
                    <div className="flex-1 relative">
                      {(() => {
                        const { labels, series } = weightTrajectories;
                        if (series.length === 0) return <div className="text-gray-500 font-mono text-[9px] text-center py-12">No data</div>;
                        const w = 1200, h = 150;
                        const pad = { top: 5, bottom: 18, left: 0, right: 0 };
                        const plotW = w - pad.left - pad.right;
                        const plotH = h - pad.top - pad.bottom;
                        const allVals = series.flatMap(s => s.points);
                        const maxW = Math.max(...allVals, 1);
                        const xScale = (i: number) => pad.left + (i / (labels.length - 1 || 1)) * plotW;
                        const yScale = (v: number) => pad.top + plotH - (v / maxW) * plotH;
                        const colors = ['#d97706', '#16a34a', '#2563eb', '#db2777', '#7c3aed'];
                        return (
                          <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
                            <line x1="0" y1={yScale(0)} x2={w} y2={yScale(0)} stroke="rgba(37,44,53,0.3)" strokeWidth="0.5" />
                            <line x1="0" y1={yScale(maxW / 2)} x2={w} y2={yScale(maxW / 2)} stroke="rgba(37,44,53,0.3)" strokeWidth="0.5" />
                            {series.map((s, si) => {
                              const path = s.points.map((v, i) => `${i === 0 ? 'M' : 'L'}${xScale(i)},${yScale(v)}`).join(' ');
                              return <path key={s.id} d={path} fill="none" stroke={colors[si % colors.length]} strokeWidth="1.5" strokeLinejoin="round" />;
                            })}
                            {labels.filter((_, i) => i % 5 === 0 || i === labels.length - 1).map((l, i) => {
                              const idx = labels.indexOf(l);
                              return <text key={i} x={xScale(idx)} y={h - 2} textAnchor="middle" fill="#6b7280" fontSize="6" fontFamily="monospace">{l}</text>;
                            })}
                          </svg>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3 mt-2 pt-2 border-t border-[#222a36] text-[8px] font-mono text-gray-400">
                    {weightTrajectories.series.slice(0, 5).map((s, i) => {
                      const colors = ['#d97706', '#16a34a', '#2563eb', '#db2777', '#7c3aed'];
                      return (
                        <div key={s.id} className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ background: colors[i % colors.length] }} />
                          <span>{s.id}</span>
                          <button onClick={() => toggleCompareSilo(s.id)} className="text-red-400 hover:text-red-300 ml-0.5 cursor-pointer">&times;</button>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Row 3: Stockout Projection (full width) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-12">
            <div className="glass-card border border-[#2d3748] rounded-xl p-5 bg-[#0e141b]/90">
              <div className="flex items-center justify-between border-b border-[#222a36] pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-500 text-lg">trending_up</span>
                  <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-gray-200">
                    Stockout Projection (30d)
                  </h3>
                </div>
                <button onClick={exportAnalysisCSV}
                  className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 font-mono text-[8px] font-bold uppercase rounded transition-all duration-150 cursor-pointer shrink-0">
                  CSV
                </button>
              </div>
              {siloStatsList.length === 0 ? (
                <div className="py-10 text-center text-gray-500 font-mono text-[10px]">Select a branch or silo to view projection.</div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                  {(() => {
                    const now = Date.now();
                    const dayMs = 86400000;
                    const projections = siloStatsList.map(s => {
                      const silo = stableSilosRef.current.find(x => x.id === s.siloId);
                      if (!silo) return null;
                      const dailyOut = s.avgOutFlow > 0 ? s.avgOutFlow * 24 / 1000 : 0;
                      const daysUntilEmpty = dailyOut > 0 ? Math.round(s.latestWeight / 1000 / dailyOut) : 999;
                      const projected30 = s.latestWeight / 1000 - dailyOut * 30;
                      return { siloId: s.siloId, farmName: s.farmName, currentMT: s.latestWeight / 1000, dailyOut, daysUntilEmpty, projected30, atRisk: daysUntilEmpty < 30 };
                    }).filter(Boolean) as { siloId: string; farmName: string; currentMT: number; dailyOut: number; daysUntilEmpty: number; projected30: number; atRisk: boolean }[];

                    if (projections.length === 0) return <div className="py-4 text-center text-gray-500 font-mono text-[10px]">No projection data.</div>;
                    return projections.sort((a, b) => a.daysUntilEmpty - b.daysUntilEmpty).slice(0, 8).map((p, i) => (
                      <div key={i} className={`p-2.5 rounded-lg flex items-center justify-between gap-2 ${p.atRisk ? 'bg-red-500/5 border border-red-500/20' : 'bg-[#11171e] border border-[#222c37]'}`}>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <strong className="font-sans text-[10px] text-gray-100">{p.siloId}</strong>
                            {p.atRisk && <span className="text-[8px] font-mono text-red-400 bg-red-500/10 px-1 rounded animate-pulse">RISK</span>}
                          </div>
                          <span className="font-mono text-[8px] text-gray-500 block truncate">{p.farmName}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 text-right">
                          <div>
                            <span className="text-[8px] font-mono text-gray-500 block">NOW</span>
                            <span className="font-mono text-[9px] text-gray-200">{p.currentMT.toFixed(1)} MT</span>
                          </div>
                          <div>
                            <span className="text-[8px] font-mono text-gray-500 block">30d</span>
                            <span className={`font-mono text-[9px] ${p.projected30 < 0 ? 'text-red-400' : 'text-amber-400'}`}>
                              {p.projected30 < 0 ? 'DEPL' : `${p.projected30.toFixed(1)}`}
                            </span>
                          </div>
                          <div>
                            <span className="text-[8px] font-mono text-gray-500 block">DUE</span>
                            <span className={`font-mono text-[9px] ${p.daysUntilEmpty < 30 ? 'text-red-500 animate-pulse' : 'text-gray-400'}`}>
                              {p.daysUntilEmpty >= 999 ? '--' : `${p.daysUntilEmpty}d`}
                            </span>
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
