import React, { useState, useEffect, useMemo } from 'react';
import { Silo, Farm } from '../types';
import { SiloShader } from './SiloShader';
import { generateSiloLogs, LoadingLogEntry } from '../data/mockLogs';

interface SiloDetailViewProps {
  silo: Silo;
  farm?: Farm;
  onBack: () => void;
  onUpdateSilo: (updatedSilo: Silo) => void;
}

interface LogEvent {
  time: string;
  type: string;
  desc: string;
}

type FilterPeriod = 'day' | 'week' | 'month' | 'annual' | 'custom';

function filterLogs(logs: LoadingLogEntry[], period: FilterPeriod, customStart?: string, customEnd?: string): LoadingLogEntry[] {
  const now = Date.now();
  const dayMs = 86400000;
  let cutoff = 0;

  switch (period) {
    case 'day':
      cutoff = now - 1 * dayMs;
      break;
    case 'week':
      cutoff = now - 7 * dayMs;
      break;
    case 'month':
      cutoff = now - 30 * dayMs;
      break;
    case 'annual':
      cutoff = now - 365 * dayMs;
      break;
    case 'custom':
      if (customStart) {
        const s = new Date(customStart).getTime();
        const e = customEnd ? new Date(customEnd).getTime() + dayMs : s + dayMs;
        return logs.filter(l => {
          const t = new Date(l.timestamp).getTime();
          return t >= s && t < e;
        });
      }
      cutoff = now - 30 * dayMs;
      break;
  }
  return logs.filter(l => new Date(l.timestamp).getTime() >= cutoff);
}

export const SiloDetailView: React.FC<SiloDetailViewProps> = ({
  silo,
  farm,
  onBack,
  onUpdateSilo
}) => {
  const [sliderWeight, setSliderWeight] = useState<number>(silo.currentWeight);
  const [eventLogs, setEventLogs] = useState<LogEvent[]>([]);
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const allLogs = useMemo(() => generateSiloLogs(silo), [silo]);

  const filteredLogs = useMemo(
    () => filterLogs(allLogs, filterPeriod, customStart, customEnd),
    [allLogs, filterPeriod, customStart, customEnd]
  );

  const logStats = useMemo(() => {
    if (filteredLogs.length === 0) return { totalLoads: 0, totalUnloads: 0, netDelta: 0, totalLoading: 0, totalUnloading: 0 };
    let totalLoads = 0, totalUnloads = 0, totalLoading = 0, totalUnloading = 0;
    filteredLogs.forEach(l => {
      if (l.delta > 0) { totalLoads++; totalLoading += l.delta; }
      if (l.delta < 0) { totalUnloads++; totalUnloading += Math.abs(l.delta); }
    });
    return { totalLoads, totalUnloads, netDelta: totalLoading - totalUnloading, totalLoading, totalUnloading };
  }, [filteredLogs]);

  const weightHistoryPoints = useMemo(() => {
    const now = Date.now();
    const dayMs = 86400000;
    const pts: { label: string; weight: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const dayStart = now - i * dayMs;
      const dayEnd = dayStart + dayMs;
      const dayLogs = allLogs.filter(l => {
        const t = new Date(l.timestamp).getTime();
        return t >= dayStart && t < dayEnd && l.type !== 'stable';
      });
      const last = dayLogs.length > 0 ? dayLogs[dayLogs.length - 1] : null;
      const weight = last ? last.weight : (i === 0 ? silo.currentWeight : 0);
      const d = new Date(dayStart);
      pts.push({ label: `${d.getMonth() + 1}/${d.getDate()}`, weight });
    }
    return pts;
  }, [allLogs, silo.currentWeight]);

  const exportLogsCSV = () => {
    const header = 'Date,Time,Type,Weight (kg),Delta (kg),Flow (kg/h),Source\n';
    const rows = filteredLogs.map(l => {
      const d = new Date(l.timestamp);
      const date = d.toLocaleDateString('en-GB');
      const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      return `${date},${time},${l.type},${l.weight},${l.delta},${l.flowRate},${l.source}`;
    }).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${silo.id}_logs_${filterPeriod}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    setSliderWeight(silo.currentWeight);
  }, [silo.currentWeight]);

  useEffect(() => {
    const initialLogs: LogEvent[] = [
      { time: '14:30:12', type: 'CALIBRATION', desc: 'Silo loadcell zero-point balanced to 0.00kg offset.' },
      { time: '12:15:44', type: 'STATE_CHANGE', desc: `Telemetry transition to: ${silo.status.toUpperCase()}` },
      { time: '09:00:00', type: 'DIAGNOSTIC', desc: 'Sensor health check: Comms signal RSSI at -48dBm (99.8% compliance).' }
    ];
    setEventLogs(initialLogs);
  }, [silo.id]);

  const addLog = (type: string, desc: string) => {
    const timeStr = new Date().toTimeString().split(' ')[0];
    setEventLogs(prev => [
      { time: timeStr, type, desc },
      ...prev.slice(0, 8)
    ]);
  };

  const handleWeightSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWeight = Number(e.target.value);
    setSliderWeight(newWeight);
    const fillPercent = Number(((newWeight / silo.capacity) * 100).toFixed(1));
    let newStatus = silo.status;
    if (newWeight >= silo.capacity) newStatus = 'warning';
    else if (newWeight <= 0) newStatus = 'critical';
    else if (silo.flowRate > 0) newStatus = 'filling';
    else if (silo.flowRate < 0) newStatus = 'unloading';
    else newStatus = 'stable';
    onUpdateSilo({ ...silo, currentWeight: newWeight, fillPercent, status: newStatus });
    addLog('MANUAL_DISPLACE', `Weight displacement slider altered capacity to ${fillPercent}% (${newWeight}kg).`);
  };

  const triggerRefill = () => {
    onUpdateSilo({ ...silo, status: 'filling', flowRate: 1500 });
    addLog('COMMAND_SEND', 'Refill slide gate solenoid command sent: Gate 100% open [Rate: 1500kg/hr].');
  };

  const triggerDischarge = () => {
    onUpdateSilo({ ...silo, status: 'unloading', flowRate: -450 });
    addLog('COMMAND_SEND', 'Discharge outlet valve command sent: Valve 30% open [Rate: -450kg/hr].');
  };

  const triggerStabilize = () => {
    onUpdateSilo({ ...silo, status: 'stable', flowRate: 0 });
    addLog('COMMAND_SEND', 'All physical actuator valves stabilized. Telemetry monitoring cycle holds stable.');
  };

  const formatDate = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#222a36] pb-4 text-left">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-8 h-8 bg-[#18202b] border border-[#2d3748] rounded-lg text-gray-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors" title="Return to Telemetry List">
            <span className="material-symbols-outlined text-lg">arrow_back</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-sans text-base font-black text-white uppercase tracking-tight">
                Deep Telemetry Diagnostic: {silo.id}
              </h2>
              <span className={`px-1.5 py-0.2 rounded text-[8px] font-mono uppercase font-bold ${
                silo.status === 'stable' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                silo.status === 'filling' || silo.status === 'unloading' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>{silo.status}</span>
            </div>
            <p className="font-mono text-[9px] text-gray-500 uppercase mt-0.5">
              Assigned Regional Node &bull; {farm ? farm.name.toUpperCase() : 'CENTRAL DATA GRID'}
            </p>
          </div>
        </div>
        <div className="font-mono text-[10px] text-gray-500">
          Flow Solenoid Stream: <strong className={silo.flowRate > 0 ? 'text-emerald-400' : silo.flowRate < 0 ? 'text-amber-500' : 'text-gray-400'}>
            {silo.flowRate > 0 ? `+${silo.flowRate}` : silo.flowRate < 0 ? silo.flowRate : 'STABLE (0)'} kg/hr
          </strong>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Gauge */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-card border border-[#2d3748] rounded-xl p-5 bg-[#0e141b]/95 text-center">
            <div className="border-b border-[#222a36] pb-3 mb-4 text-left">
              <span className="font-mono text-[9px] text-gray-500 uppercase tracking-widest block">Active Physical Model</span>
              <p className="font-mono text-[8px] text-gray-600 block mt-0.5">Volumetric liquid grain physics overlay</p>
            </div>
            <div className="bg-[#080c10]/90 border border-[#1e2733] rounded-lg p-5 flex justify-center mb-5">
              <SiloShader silo={silo} isLarge={true} />
            </div>
              <div className="space-y-3 text-left">
                <span className="font-mono text-[9px] text-gray-500 uppercase tracking-widest block mb-1">Solenoid Gate Actuators</span>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={triggerRefill} disabled={silo.status === 'sensor_err'}
                    className={`py-2 px-1 border border-[#232d3a] hover:border-emerald-500/45 hover:bg-emerald-500/5 text-gray-300 font-mono text-[9px] font-bold uppercase rounded transition-all cursor-pointer ${silo.status === 'filling' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : ''}`}>
                    &#9650; INTAKE ON
                  </button>
                  <button onClick={triggerDischarge} disabled={silo.status === 'sensor_err'}
                    className={`py-2 px-1 border border-[#232d3a] hover:border-amber-500/45 hover:bg-amber-500/5 text-gray-300 font-mono text-[9px] font-bold uppercase rounded transition-all cursor-pointer ${silo.status === 'unloading' ? 'border-amber-500 bg-amber-500/10 text-amber-400' : ''}`}>
                    &#9660; OUTLET VALV
                  </button>
                  <button onClick={triggerStabilize} disabled={silo.status === 'sensor_err'}
                    className={`py-2 px-1 border border-[#232d3a] hover:border-red-500/45 hover:bg-red-500/5 text-gray-300 font-mono text-[9px] font-bold uppercase rounded transition-all cursor-pointer ${silo.status === 'stable' ? 'border-amber-500 bg-amber-500/10 text-amber-400' : ''}`}>
                    &#9632; STABILIZE
                  </button>
                </div>
              </div>
              <div className="mt-5 space-y-2 text-left pt-4 border-t border-[#1b222c]">
                <div className="flex justify-between font-mono text-[9px]">
                  <span className="text-gray-500 uppercase">Manual Weight Displace Override:</span>
                  <span className="text-amber-400 font-bold">{sliderWeight.toLocaleString()} kg</span>
                </div>
                <input type="range" min="0" max={silo.capacity} step="100" value={sliderWeight} onChange={handleWeightSliderChange}
                  disabled={silo.status === 'sensor_err'}
                  className="w-full accent-amber-500 cursor-pointer h-1 bg-gray-800 rounded-lg appearance-none" />
                <div className="flex justify-between font-mono text-[8px] text-gray-600">
                  <span>0 KG (EMPTY)</span>
                  <span>{silo.capacity.toLocaleString()} KG (FULL CAPACITY)</span>
                </div>
              </div>
          </div>
        </div>

        {/* Right Column: Sensor + Charts + Log */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-card border border-[#2d3748] rounded-xl p-5 bg-[#0e141b]/95">
            <span className="font-mono text-[9px] text-gray-500 uppercase tracking-widest block mb-4 border-b border-[#222a36] pb-2">Sensor Node Diagnostics Array</span>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-0.5">
                <span className="font-mono text-[8px] text-gray-500 uppercase block">Mass Inventory:</span>
                <span className="font-sans text-base font-extrabold text-gray-100 block">{silo.status === 'sensor_err' ? 'COMS ERR' : `${silo.currentWeight.toLocaleString()} kg`}</span>
                <span className="font-mono text-[8px] text-gray-500 block leading-none">{(silo.currentWeight / 1000).toFixed(1)} Metric Tons</span>
              </div>
              <div className="space-y-0.5">
                <span className="font-mono text-[8px] text-gray-500 uppercase block">Active Volume:</span>
                <span className="font-sans text-base font-extrabold text-amber-500 block">{silo.status === 'sensor_err' ? '0.0%' : `${silo.fillPercent}%`}</span>
                <span className="font-mono text-[8px] text-gray-500 block leading-none">of maximum capacity</span>
              </div>
              <div className="space-y-0.5">
                <span className="font-mono text-[8px] text-gray-500 uppercase block">Remaining Margin:</span>
                <span className="font-sans text-base font-semibold text-gray-300 block">{silo.status === 'sensor_err' ? '0 kg' : `${(silo.capacity - silo.currentWeight).toLocaleString()} kg`}</span>
                <span className="font-mono text-[8px] text-gray-500 block leading-none">available expansion</span>
              </div>
              <div className="space-y-0.5">
                <span className="font-mono text-[8px] text-gray-500 uppercase block">Transceiver Health:</span>
                <span className="font-sans text-base font-semibold text-emerald-400 block flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${silo.status === 'sensor_err' ? 'bg-red-500 animate-ping' : 'bg-emerald-500'}`} />
                  {silo.status === 'sensor_err' ? 'CRIT ERR' : '99.8%'}
                </span>
                <span className="font-mono text-[8px] text-gray-500 block leading-none">RS485 Modbus Link State</span>
              </div>
            </div>
          </div>

          {/* Weight History Chart (30 days) */}
          <div className="glass-card border border-[#2d3748] rounded-xl p-5 bg-[#0e141b]/95">
            <div className="flex items-center justify-between border-b border-[#222a36] pb-2 mb-3">
              <span className="font-mono text-[9px] text-gray-500 uppercase tracking-widest">Weight Over Time (30d)</span>
            </div>
            <div className="flex gap-0 ml-8" style={{ height: '100px' }}>
              <div className="flex flex-col justify-between pr-2 py-1 font-mono text-[7px] text-gray-500 text-right shrink-0">
                <span>{Math.max(...weightHistoryPoints.map(p => p.weight), 1)}</span>
                <span>{Math.round(Math.max(...weightHistoryPoints.map(p => p.weight), 1) / 2)}</span>
                <span>0</span>
              </div>
              <div className="flex-1 relative">
                {(() => {
                  const pts = weightHistoryPoints;
                  const w = 600, h = 100;
                  const pad = { top: 5, bottom: 15, left: 0, right: 0 };
                  const plotW = w - pad.left - pad.right;
                  const plotH = h - pad.top - pad.bottom;
                  const maxW = Math.max(...pts.map(p => p.weight), 1);
                  const xScale = (i: number) => pad.left + (i / (pts.length - 1 || 1)) * plotW;
                  const yScale = (v: number) => pad.top + plotH - (v / maxW) * plotH;
                  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${xScale(i)},${yScale(p.weight)}`).join(' ');
                  return (
                    <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
                      <line x1="0" y1={yScale(0)} x2={w} y2={yScale(0)} stroke="rgba(37,44,53,0.3)" strokeWidth="0.5" />
                      <line x1="0" y1={yScale(maxW / 2)} x2={w} y2={yScale(maxW / 2)} stroke="rgba(37,44,53,0.3)" strokeWidth="0.5" />
                      <path d={line} fill="none" stroke="#f5a623" strokeWidth="2" strokeLinejoin="round" />
                      {pts.filter((_, i) => i % 5 === 0 || i === pts.length - 1).map((p, i) => (
                        <text key={i} x={xScale(pts.indexOf(p))} y={h - 2} textAnchor="middle" fill="#6b7280" fontSize="6" fontFamily="monospace">{p.label}</text>
                      ))}
                      <circle cx={xScale(pts.length - 1)} cy={yScale(pts[pts.length - 1].weight)} r="3" fill="#f5a623" stroke="#0e141b" strokeWidth="1" />
                    </svg>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Full Loading/Unloading History Log */}
          <div className="glass-card border border-[#2d3748] rounded-xl p-5 bg-[#0e141b]/95 flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#222a36] pb-3 mb-3">
            <span className="font-mono text-[9px] text-gray-500 uppercase tracking-widest">Loading & Unloading History Log</span>
            <div className="flex flex-wrap items-center gap-1">
              {(['day', 'week', 'month', 'annual'] as FilterPeriod[]).map(p => (
                <button key={p} onClick={() => setFilterPeriod(p)}
                  className={`px-2 py-1 rounded font-mono text-[8px] font-bold uppercase border tracking-tight transition-all duration-150 cursor-pointer ${
                    filterPeriod === p
                      ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                      : 'bg-transparent border-[#222b35] text-gray-400 hover:border-gray-500'
                  }`}>
                  {p === 'annual' ? 'YEAR' : p.toUpperCase()}
                </button>
              ))}
              <button onClick={() => setFilterPeriod('custom')}
                className={`px-2 py-1 rounded font-mono text-[8px] font-bold uppercase border tracking-tight transition-all duration-150 cursor-pointer ${
                  filterPeriod === 'custom'
                    ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                    : 'bg-transparent border-[#222b35] text-gray-400 hover:border-gray-500'
                }`}>
                DATE
              </button>
              <button onClick={exportLogsCSV}
                className="px-2 py-1 rounded font-mono text-[8px] font-bold uppercase border border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all duration-150 cursor-pointer">
                CSV
              </button>
            </div>
          </div>

            {/* Custom date range */}
            {filterPeriod === 'custom' && (
              <div className="flex flex-wrap items-center gap-2 mb-3 pb-3 border-b border-[#222a36]">
                <span className="font-mono text-[8px] text-gray-500 uppercase">From:</span>
                <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
                  className="bg-[#11171e] border border-[#232c38] rounded px-2 py-1 font-mono text-[10px] text-gray-200 focus:border-amber-500 focus:outline-none" />
                <span className="font-mono text-[8px] text-gray-500 uppercase">To:</span>
                <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
                  className="bg-[#11171e] border border-[#232c38] rounded px-2 py-1 font-mono text-[10px] text-gray-200 focus:border-amber-500 focus:outline-none" />
              </div>
            )}

            {/* Summary stats */}
            {filteredLogs.length > 0 && (
              <div className="grid grid-cols-4 gap-3 mb-3 pb-3 border-b border-[#222a36]">
                <div>
                  <span className="font-mono text-[7px] text-gray-500 uppercase block">Load Events</span>
                  <span className="font-mono text-[10px] text-emerald-400 font-bold">{logStats.totalLoads}</span>
                </div>
                <div>
                  <span className="font-mono text-[7px] text-gray-500 uppercase block">Unload Events</span>
                  <span className="font-mono text-[10px] text-amber-400 font-bold">{logStats.totalUnloads}</span>
                </div>
                <div>
                  <span className="font-mono text-[7px] text-gray-500 uppercase block">Total Loaded</span>
                  <span className="font-mono text-[10px] text-gray-200 font-bold">{(logStats.totalLoading / 1000).toFixed(1)} MT</span>
                </div>
                <div>
                  <span className="font-mono text-[7px] text-gray-500 uppercase block">Total Unloaded</span>
                  <span className="font-mono text-[10px] text-gray-200 font-bold">{(logStats.totalUnloading / 1000).toFixed(1)} MT</span>
                </div>
              </div>
            )}

            {/* Log table */}
            <div className="max-h-64 overflow-y-auto custom-scrollbar pr-1">
              {filteredLogs.length === 0 ? (
                <div className="py-8 text-center font-mono text-[10px] text-gray-500">No loading/unloading records found for this period.</div>
              ) : (
                <table className="w-full text-left font-mono text-[9px] border-collapse">
                  <thead>
                    <tr className="text-gray-500 uppercase text-[8px] border-b border-[#1b222c]">
                      <th className="py-1.5 pr-2">Date</th>
                      <th className="py-1.5 pr-2">Time</th>
                      <th className="py-1.5 pr-2">Type</th>
                      <th className="py-1.5 pr-2 text-right">Weight</th>
                      <th className="py-1.5 pr-2 text-right">Delta</th>
                      <th className="py-1.5 pr-2 text-right">Flow</th>
                      <th className="py-1.5">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map(log => (
                      <tr key={log.id} className="border-b border-[#1b222c]/50 hover:bg-[#11171e]/50 transition-colors">
                        <td className="py-1.5 pr-2 text-gray-400">{formatDate(log.timestamp)}</td>
                        <td className="py-1.5 pr-2 text-gray-500">{formatTime(log.timestamp)}</td>
                        <td className="py-1.5 pr-2">
                          <span className={`px-1 rounded text-[7px] font-extrabold ${
                            log.type === 'loading' ? 'bg-emerald-500/10 text-emerald-400' :
                            log.type === 'unloading' ? 'bg-amber-500/10 text-amber-400' :
                            'bg-gray-500/10 text-gray-400'
                          }`}>
                            {log.type === 'loading' ? 'LOAD' : log.type === 'unloading' ? 'UNLOAD' : 'STABLE'}
                          </span>
                        </td>
                        <td className="py-1.5 pr-2 text-right text-gray-200 font-semibold">{(log.weight / 1000).toFixed(1)}</td>
                        <td className={`py-1.5 pr-2 text-right font-semibold ${log.delta > 0 ? 'text-emerald-400' : log.delta < 0 ? 'text-amber-400' : 'text-gray-500'}`}>
                          {log.delta > 0 ? `+${(log.delta / 1000).toFixed(1)}` : (log.delta / 1000).toFixed(1)}
                        </td>
                        <td className="py-1.5 pr-2 text-right text-gray-400">{log.flowRate > 0 ? `+${log.flowRate}` : log.flowRate} kg/h</td>
                        <td className="py-1.5">
                          <span className={`text-[7px] ${log.source === 'manual' ? 'text-amber-500' : 'text-gray-500'}`}>
                            {log.source === 'manual' ? 'MANUAL' : 'AUTO'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="font-mono text-[8px] text-gray-500 text-center uppercase tracking-wider pt-3 border-t border-[#1b222c] mt-3">
              {filteredLogs.length} records &bull; Modbus physical telemetry loop frequency: 1.5 Hz Refreshes
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
