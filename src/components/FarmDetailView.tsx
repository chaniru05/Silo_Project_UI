import React from 'react';
import { Farm, Silo, MaintenanceTask } from '../types';
import { SiloShader } from './SiloShader';
import { weightHistory24h } from '../data/mockData';

interface FarmDetailViewProps {
  farm: Farm;
  silos: Silo[];
  maintenanceTasks: MaintenanceTask[];
  onBack: () => void;
  onSelectSilo: (siloId: string) => void;
}

export const FarmDetailView: React.FC<FarmDetailViewProps> = ({
  farm,
  silos,
  maintenanceTasks,
  onBack,
  onSelectSilo
}) => {
  // Filter items specifically for this farm
  const farmSilos = silos.filter(s => s.farmId === farm.id);
  const farmTasks = maintenanceTasks.filter(t => t.assetId.startsWith(farm.id === 'anuradhapura' ? 'SILO-A' : farm.id === 'kurunegala' ? 'SILO-B' : farm.id === 'gampaha' ? 'SILO-C' : 'SILO-D'));

  // Calculate aggregated stats
  const totalCap = farmSilos.reduce((acc, s) => acc + s.capacity, 0);
  const activeWeight = farmSilos.reduce((acc, s) => acc + s.currentWeight, 0);
  const fillIndex = totalCap > 0 ? Math.round((activeWeight / totalCap) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* 1. Facility Header & Breadcrumbs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#222a36] pb-4 text-left">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-8 h-8 bg-[#18202b] border border-[#2d3748] rounded-lg text-gray-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
            title="Return to list"
          >
            <span className="material-symbols-outlined text-lg">
              arrow_back
            </span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-sans text-base font-black text-white uppercase tracking-tight">
                {farm.name}
              </h2>
              <span className={`px-1.5 py-0.2 rounded text-[8px] font-mono uppercase font-bold ${
                farm.status === 'operational' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                farm.status === 'warning' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                'bg-red-500/10 text-red-400 border border-red-500/30'
              }`}>
                {farm.status}
              </span>
            </div>
            <p className="font-mono text-[9px] text-gray-500 uppercase mt-0.5">
              Facility Command Dashboard &bull; Sector {farm.id.toUpperCase()}-GRID
            </p>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-3 font-mono text-[10px]">
          <div className="text-right">
            <span className="text-gray-500 block">FACILITY MANAGER</span>
            <strong className="text-gray-200">{farm.manager}</strong>
          </div>
          <div className="h-6 w-[1px] bg-[#222a36]" />
          <div className="text-right">
            <span className="text-gray-500 block">LAST AUDIT INSPECTION</span>
            <strong className="text-gray-200">{farm.lastInspection}</strong>
          </div>
        </div>
      </div>

      {/* 2. Facility Charts & Quick Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Metric 1: Capacity Status Widget */}
        <div className="glass-card border border-[#2d3748] p-5 rounded-xl bg-[#0e141b]/95 text-left flex flex-col justify-between">
          <div>
            <span className="font-mono text-[9px] text-gray-500 uppercase tracking-widest block mb-1">
              Storage Density Index
            </span>
            <div className="flex items-baseline gap-1.5 mb-2">
              <span className="font-sans text-2xl font-black text-amber-500">
                {fillIndex}%
              </span>
              <span className="font-mono text-[10px] text-gray-400">capacity loaded</span>
            </div>
            <div className="w-full bg-[#1b222c] h-3 rounded-full overflow-hidden border border-[#222c36] mb-4">
              <div
                style={{ width: `${fillIndex}%` }}
                className={`h-full rounded-full transition-all duration-300 ${
                  fillIndex > 90 ? 'bg-red-500' :
                  fillIndex < 15 ? 'bg-red-500 animate-pulse' :
                  'bg-amber-500'
                }`}
              />
            </div>
          </div>

          <div className="space-y-1.5 pt-3 border-t border-[#1b222c] font-mono text-[10px] text-gray-400">
            <div className="flex justify-between">
              <span className="uppercase text-gray-500">Current Load:</span>
              <span className="text-gray-200 font-bold">{(activeWeight / 1000).toFixed(1)} MT</span>
            </div>
            <div className="flex justify-between">
              <span className="uppercase text-gray-500">Volumetric Maximum:</span>
              <span className="text-gray-200">{(totalCap / 1000).toFixed(0)} MT</span>
            </div>
            <div className="flex justify-between">
              <span className="uppercase text-gray-500">Silo Count:</span>
              <span className="text-gray-200">{farmSilos.length} Columns</span>
            </div>
          </div>
        </div>

          {/* Metric 2: 24h Facility Weight Trend (data-bound SVG line chart) */}
          <div className="glass-card border border-[#2d3748] p-5 rounded-xl bg-[#0e141b]/95 text-left lg:col-span-2">
            <div className="flex items-center justify-between border-b border-[#222a36] pb-2 mb-3">
              <span className="font-mono text-[9px] text-gray-500 uppercase tracking-widest">
                24h Weight History
              </span>
              <span className="font-mono text-[9px] text-emerald-400">
                Sensor Loop Stabilized
              </span>
            </div>

            <div className="relative h-28 w-full mt-2">
              {(() => {
                const pts = weightHistory24h;
                const w = 1200, h = 100, pad = { top: 10, bottom: 15, left: 0, right: 0 };
                const plotW = w - pad.left - pad.right;
                const plotH = h - pad.top - pad.bottom;
                const maxW = Math.max(...pts.map(p => p.weight), 1);
                const minW = Math.min(...pts.map(p => p.weight), 0);
                const range = maxW - minW || 1;
                const xScale = (i: number) => pad.left + (i / (pts.length - 1 || 1)) * plotW;
                const yScale = (v: number) => pad.top + plotH - ((v - minW) / range) * plotH;

                const area = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${xScale(i)},${yScale(p.weight)}`).join(' ') + ` L${xScale(pts.length - 1)},${h} L${xScale(0)},${h} Z`;
                const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${xScale(i)},${yScale(p.weight)}`).join(' ');

                return (
                  <svg className="w-full h-full" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(245, 166, 35, 0.2)" />
                        <stop offset="100%" stopColor="rgba(245, 166, 35, 0)" />
                      </linearGradient>
                    </defs>
                    <line x1="0" y1={yScale(minW + range * 0.75)} x2={w} y2={yScale(minW + range * 0.75)} stroke="rgba(37,44,53,0.3)" strokeWidth="0.5" />
                    <line x1="0" y1={yScale(minW + range * 0.5)} x2={w} y2={yScale(minW + range * 0.5)} stroke="rgba(37,44,53,0.3)" strokeWidth="0.5" />
                    <line x1="0" y1={yScale(minW + range * 0.25)} x2={w} y2={yScale(minW + range * 0.25)} stroke="rgba(37,44,53,0.3)" strokeWidth="0.5" />
                    <path d={area} fill="url(#trendGrad)" />
                    <path d={line} fill="none" stroke="#f5a623" strokeWidth="2" />
                    <circle cx={xScale(pts.length - 1)} cy={yScale(pts[pts.length - 1].weight)} r="4.5" fill="#f5a623" />
                    <circle cx={xScale(pts.length - 1)} cy={yScale(pts[pts.length - 1].weight)} r="9" fill="none" stroke="#f5a623" strokeWidth="1" className="animate-ping" />
                  </svg>
                );
              })()}

              <div className="absolute inset-x-0 bottom-0 flex justify-between font-mono text-[8px] text-gray-500 px-1 mt-1">
                <span>{weightHistory24h[0].name}</span>
                <span>{weightHistory24h[4].name}</span>
                <span>{weightHistory24h[8].name}</span>
                <span>{weightHistory24h[11].name} (CURRENT)</span>
              </div>
            </div>
          </div>

      </div>

      {/* 3. Interactive Silos Telemetry Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-[#222a36] pb-2 text-left">
          <div>
            <h3 className="font-sans text-sm font-black text-gray-200 uppercase tracking-tight">
              Integrated Silo Storage Matrix
            </h3>
            <p className="font-mono text-[9px] text-gray-500 uppercase">
              Click silo card to open advanced telemetry and trigger refilling simulation
            </p>
          </div>
          <span className="font-mono text-[9px] text-gray-500 uppercase">
            Active Columns: {farmSilos.length}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {farmSilos.map(silo => (
            <button
              key={silo.id}
              onClick={() => onSelectSilo(silo.id)}
              className="glass-card border border-[#222c37] hover:border-amber-500/40 p-4 rounded-xl bg-[#0c1015]/95 hover:bg-[#111720]/95 transition-all text-center flex flex-col justify-between cursor-pointer group relative overflow-hidden"
            >
              {/* Hotspot details on hover */}
              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-xs text-amber-500 animate-pulse">
                  open_in_new
                </span>
              </div>

              <SiloShader silo={silo} />

              <div className="mt-3 pt-2.5 border-t border-[#1a222c] text-[10px] font-mono text-gray-400">
                <span className="text-[9px] text-gray-600 block uppercase">CURRENT LEVEL:</span>
                <strong className="text-gray-200">
                  {silo.status === 'sensor_err' ? 'COMS ERR' : `${(silo.currentWeight / 1000).toFixed(1)} MT`}
                </strong>
                
                {/* Flow indicator icon overlay */}
                {silo.status === 'filling' && (
                  <span className="text-[8px] text-emerald-400 font-bold block animate-pulse mt-0.5">
                    ▲ FILLING
                  </span>
                )}
                {silo.status === 'unloading' && (
                  <span className="text-[8px] text-amber-500 font-bold block animate-pulse mt-0.5">
                    ▼ DRAINING
                  </span>
                )}
                {silo.status === 'stable' && (
                  <span className="text-[8px] text-gray-500 block mt-0.5">
                    ■ STATIC
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Maintenance / Event Log Section */}
      <div className="glass-card border border-[#2d3748] rounded-xl p-5 bg-[#0e141b]/95 text-left">
        <div className="flex items-center justify-between border-b border-[#222a36] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-500 text-lg">
              construction
            </span>
            <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-gray-200">
              Active Facility Maintenance &amp; Work Orders
            </h3>
          </div>
          <span className="font-mono text-[9px] text-gray-500 uppercase">
            {farmTasks.length} Work Orders Logged
          </span>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left font-mono text-[10px] border-collapse">
            <thead>
              <tr className="border-b border-[#222a36] text-gray-500">
                <th className="py-2.5 font-bold uppercase tracking-wider">Order ID</th>
                <th className="py-2.5 font-bold uppercase tracking-wider">Asset Column</th>
                <th className="py-2.5 font-bold uppercase tracking-wider">Scope of Work</th>
                <th className="py-2.5 font-bold uppercase tracking-wider">Priority</th>
                <th className="py-2.5 font-bold uppercase tracking-wider">Assigned Engineer</th>
                <th className="py-2.5 font-bold uppercase tracking-wider">Work Status</th>
              </tr>
            </thead>
            <tbody className="text-gray-300 divide-y divide-[#1b222c]">
              {farmTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-gray-500 italic">
                    No active maintenance work orders currently pending for this facility.
                  </td>
                </tr>
              ) : (
                farmTasks.map(task => (
                  <tr key={task.id} className="hover:bg-[#151c24]">
                    <td className="py-3 font-bold text-gray-400">{task.id}</td>
                    <td className="py-3 font-bold text-amber-500">{task.assetId}</td>
                    <td className="py-3 text-gray-200">{task.description}</td>
                    <td className="py-3">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold ${
                        task.priority === 'URGENT' ? 'bg-red-500/15 text-red-400 border border-red-500/30 animate-pulse' :
                        task.priority === 'MEDIUM' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                        'bg-gray-500/15 text-gray-400 border border-gray-500/20'
                      }`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="py-3 text-gray-400">{task.assignedTo}</td>
                    <td className="py-3">
                      <span className="flex items-center gap-1.5 text-amber-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        <span>QUEUED ON SITE</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
