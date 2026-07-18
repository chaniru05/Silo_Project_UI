import React, { useState } from 'react';
import { Farm, Silo } from '../types';
import { SateliteMap } from './SateliteMap';

interface FarmsTabProps {
  farms: Farm[];
  silos: Silo[];
  onSelectFarm: (farmId: string) => void;
  selectedFarmId?: string;
}

export const FarmsTab: React.FC<FarmsTabProps> = ({
  farms,
  silos,
  onSelectFarm,
  selectedFarmId
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredFarms = farms.filter(farm => {
    const matchesStatus = statusFilter === 'all' || farm.status === statusFilter;
    const matchesSearch = (farm.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                          (farm.province?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getFarmAggregatedStats = (farmId: string) => {
    const farmSilos = silos.filter(s => s.farmId === farmId);
    const totalCap = farmSilos.reduce((acc, s) => acc + s.capacity, 0);
    const activeWeight = farmSilos.reduce((acc, s) => acc + s.currentWeight, 0);
    const warningCount = farmSilos.filter(s => s.status === 'warning' || s.status === 'critical').length;
    const errCount = farmSilos.filter(s => s.status === 'sensor_err').length;
    const utilPercent = totalCap > 0 ? Math.round((activeWeight / totalCap) * 100) : 0;

    return {
      totalCap,
      activeWeight,
      warningCount,
      errCount,
      utilPercent
    };
  };

  return (
    <div className="space-y-6">
      {/* 1. Tactical Mission Map Container */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-left">
          <div>
            <h2 className="font-sans text-sm font-black text-gray-200 uppercase tracking-tight">
              Orbital Map &amp; Geopositional Telemetry
            </h2>
            <p className="font-mono text-[9px] text-gray-500 uppercase">
              Interactive 3D satellite link &bull; Drag to pan &bull; Scroll to zoom
            </p>
          </div>
          <div className="text-right">
            <span className="font-mono text-[9px] text-gray-400 uppercase bg-[#18202b] border border-[#2d3748] px-2 py-0.5 rounded">
              LINK: ACTIVE
            </span>
          </div>
        </div>
        <SateliteMap
          farms={farms}
          silos={silos}
          onSelectFarm={onSelectFarm}
          selectedFarmId={selectedFarmId}
        />
      </div>

      {/* 2. Facility Index & Search HUD */}
      <div className="glass-card border border-[#2d3748] rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-left">
        <div className="flex items-center gap-3 flex-1 min-w-0 w-full sm:min-w-[280px] sm:w-auto">
          <div className="relative flex-1">
            <span className="material-symbols-outlined text-gray-500 absolute left-3 top-2 text-lg">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search facilities by name or province..."
              className="w-full bg-[#11171e] border border-[#232c38] focus:border-amber-500 focus:outline-none rounded-lg py-1.5 pl-10 pr-4 font-mono text-xs text-gray-100 placeholder-gray-600 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="font-mono text-[9px] text-gray-500 uppercase">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#11171e] border border-[#232c38] focus:border-amber-500 focus:outline-none rounded px-2 py-1 font-mono text-[10px] text-gray-300"
            >
              <option value="all">ALL FACILITIES</option>
              <option value="operational">OPERATIONAL</option>
              <option value="warning">WARNING STAGE</option>
              <option value="critical">CRITICAL ALERT</option>
            </select>
          </div>
        </div>

        <div className="font-mono text-[9px] text-gray-500 uppercase">
          Displaying {filteredFarms.length} of {farms.length} Facility Profiles
        </div>
      </div>

      {/* 3. Regional Hubs Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
        {filteredFarms.map(farm => {
          const stats = getFarmAggregatedStats(farm.id);
          
          let cardGlow = 'border-[#2d3748] hover:border-gray-500';
          let badgeStyle = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';
          if (farm.status === 'warning') {
            cardGlow = 'border-amber-500/30 hover:border-amber-500/60';
            badgeStyle = 'bg-amber-500/10 text-amber-400 border border-amber-500/30';
          } else if (farm.status === 'critical') {
            cardGlow = 'border-red-500/30 hover:border-red-500/60 animate-critical-border';
            badgeStyle = 'bg-red-500/10 text-red-400 border border-red-500/30';
          }

          return (
            <div
              key={farm.id}
              className={`glass-card border rounded-xl p-5 bg-[#0e141b]/90 transition-all duration-250 flex flex-col justify-between group ${cardGlow}`}
            >
              <div>
                <div className="flex items-start justify-between border-b border-[#222a36] pb-3 mb-4">
                  <div>
                    <h3 className="font-sans text-sm font-black text-gray-100 group-hover:text-amber-400 transition-colors uppercase">
                      {farm.name}
                    </h3>
                    <p className="font-mono text-[9px] text-gray-500 uppercase mt-0.5">
                      {farm.province}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase font-extrabold ${badgeStyle}`}>
                    {farm.status}
                  </span>
                </div>

                {/* Aggregated Capacity Readout */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                  <div className="space-y-1">
                    <span className="font-mono text-[8px] text-gray-500 uppercase block">Total Silos:</span>
                    <span className="font-sans text-xs font-extrabold text-gray-200">
                      {farm.siloCount} Units
                    </span>
                    <span className="font-mono text-[8px] text-emerald-500 block leading-none mt-1">
                      {farm.siloCount - stats.errCount} Online
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="font-mono text-[8px] text-gray-500 uppercase block">Active Load:</span>
                    <span className="font-sans text-xs font-extrabold text-amber-500">
                      {(stats.activeWeight / 1000).toFixed(1)} MT
                    </span>
                    <span className="font-mono text-[8px] text-gray-500 block leading-none mt-1">
                      of {(stats.totalCap / 1000).toFixed(0)} MT
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="font-mono text-[8px] text-gray-500 uppercase block">Alert Loops:</span>
                    <span className={`font-sans text-xs font-extrabold ${stats.warningCount > 0 ? 'text-red-400 animate-pulse' : 'text-gray-400'}`}>
                      {stats.warningCount} Incident{stats.warningCount !== 1 ? 's' : ''}
                    </span>
                    {stats.errCount > 0 && (
                      <span className="font-mono text-[8px] text-red-500 block leading-none mt-1 animate-pulse">
                        ⚠ {stats.errCount} Offline
                      </span>
                    )}
                  </div>
                </div>

                {/* Utilization Gauge */}
                <div className="space-y-1.5 mb-5">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-gray-500 uppercase">Aggregated Storage Utilization:</span>
                    <span className="text-gray-300 font-bold">{stats.utilPercent}%</span>
                  </div>
                  <div className="w-full bg-[#171f2a] h-2.5 rounded-full overflow-hidden border border-[#232d39]">
                    <div
                      style={{ width: `${stats.utilPercent}%` }}
                      className={`h-full rounded-full transition-all duration-300 ${
                        stats.utilPercent > 90 ? 'bg-red-500' :
                        stats.utilPercent < 15 ? 'bg-red-500 animate-pulse' :
                        'bg-amber-500'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Sub-Card Metadata & CTA */}
              <div className="pt-3 border-t border-[#1a212b] flex items-center justify-between text-[10px] font-mono text-gray-500">
                <div className="space-y-0.5">
                  <span>Manager: <strong className="text-gray-300">{farm.manager}</strong></span>
                  <span className="block text-[9px] text-gray-600">Inspected: {farm.lastInspection}</span>
                </div>

                <button
                  onClick={() => onSelectFarm(farm.id)}
                  className="px-3 py-1.5 bg-[#17202a] hover:bg-amber-500/10 border border-[#2d3a4b] hover:border-amber-500/30 text-amber-400 font-bold uppercase text-[9px] tracking-wide rounded transition-all cursor-pointer"
                >
                  Enter Command Panel &raquo;
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
