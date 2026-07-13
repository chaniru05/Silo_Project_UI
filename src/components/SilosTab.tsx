import React, { useState } from 'react';
import { Silo, Farm } from '../types';
import { SiloShader } from './SiloShader';

interface SilosTabProps {
  silos: Silo[];
  farms: Farm[];
  onSelectSilo: (siloId: string) => void;
}

export const SilosTab: React.FC<SilosTabProps> = ({ silos, farms, onSelectSilo }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [farmFilter, setFarmFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('id');

  // Filter & sort logic
  const filteredSilos = silos
    .filter(silo => {
      const matchesSearch = (silo.id?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                            (silo.type?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      const matchesFarm = farmFilter === 'all' || silo.farmId === farmFilter;
      const matchesStatus = statusFilter === 'all' || silo.status === statusFilter;
      return matchesSearch && matchesFarm && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'id') {
        return a.id.localeCompare(b.id);
      } else if (sortBy === 'weight-desc') {
        return b.currentWeight - a.currentWeight;
      } else if (sortBy === 'weight-asc') {
        return a.currentWeight - b.currentWeight;
      } else if (sortBy === 'percent-desc') {
        return b.fillPercent - a.fillPercent;
      } else if (sortBy === 'percent-asc') {
        return a.fillPercent - b.fillPercent;
      }
      return 0;
    });

  return (
    <div className="space-y-6">
      {/* 1. Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#222a36] pb-4 text-left">
        <div>
          <h2 className="font-sans text-sm font-black text-gray-200 uppercase tracking-tight">
            Integrated Silo Telemetry Grid
          </h2>
          <p className="font-mono text-[9px] text-gray-500 uppercase mt-0.5">
            Real-Time sensor network &bull; Flow velocity diagnostics &bull; Calibration logs
          </p>
        </div>
        <div className="font-mono text-[9px] text-gray-400 bg-[#161f2a] border border-[#2d3748] px-2 py-0.5 rounded">
          Active Node Count: {filteredSilos.length}
        </div>
      </div>

      {/* 2. Advanced Multi-Filter Control Console */}
      <div className="glass-card border border-[#2d3748] rounded-xl p-4 bg-[#0e141b]/90 text-left space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <span className="material-symbols-outlined text-gray-500 absolute left-3 top-2 text-lg">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID or feed type..."
              className="w-full bg-[#11171e] border border-[#232c38] focus:border-amber-500 focus:outline-none rounded-lg py-1.5 pl-10 pr-4 font-mono text-xs text-gray-100 placeholder-gray-600 transition-colors"
            />
          </div>

          {/* Facility Filter */}
          <div className="relative">
            <select
              value={farmFilter}
              onChange={(e) => setFarmFilter(e.target.value)}
              className="w-full bg-[#11171e] border border-[#232c38] focus:border-amber-500 focus:outline-none rounded-lg py-1.5 px-3 font-mono text-xs text-gray-300"
            >
              <option value="all">ALL REGIONAL HUBS</option>
              {farms.map(f => (
                <option key={f.id} value={f.id}>
                  {f.name.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-[#11171e] border border-[#232c38] focus:border-amber-500 focus:outline-none rounded-lg py-1.5 px-3 font-mono text-xs text-gray-300"
            >
              <option value="all">ALL SENSOR STATES</option>
              <option value="stable">STABLE / IDLE</option>
              <option value="filling">FILLING OPERATION</option>
              <option value="unloading">DISCHARGING OPERATION</option>
              <option value="warning">WARNING STAGE</option>
              <option value="critical">CRITICAL DEPL</option>
              <option value="sensor_err">TELEMETRY LOSS (ERR)</option>
            </select>
          </div>

          {/* Sort Control */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-[#11171e] border border-[#232c38] focus:border-amber-500 focus:outline-none rounded-lg py-1.5 px-3 font-mono text-xs text-gray-300"
            >
              <option value="id">SORT BY COLUMN ID</option>
              <option value="weight-desc">WEIGHT: HIGHEST FIRST</option>
              <option value="weight-asc">WEIGHT: LOWEST FIRST</option>
              <option value="percent-desc">CAPACITY: HIGHEST FIRST</option>
              <option value="percent-asc">CAPACITY: LOWEST FIRST</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Grid of Silos */}
      {filteredSilos.length === 0 ? (
        <div className="glass-card border border-[#222a36] py-16 text-center text-gray-500 font-mono text-xs">
          ✕ NO SILO COLUMNS MATCHED SPECIFIED FILTER PRESETS
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredSilos.map(silo => {
            const farm = farms.find(f => f.id === silo.farmId);
            const isWarning = silo.status === 'warning' || silo.status === 'critical';

            return (
              <button
                key={silo.id}
                onClick={() => onSelectSilo(silo.id)}
                className={`glass-card border p-4 rounded-xl bg-[#0c1015]/95 hover:bg-[#111720]/95 transition-all text-center flex flex-col justify-between cursor-pointer group relative overflow-hidden ${
                  isWarning
                    ? silo.status === 'critical'
                      ? 'border-red-500/30 hover:border-red-500/50 animate-critical-border'
                      : 'border-amber-500/30 hover:border-amber-500/50'
                    : 'border-[#222c37] hover:border-amber-500/40'
                }`}
              >
                {/* Overlay link icon */}
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="material-symbols-outlined text-xs text-amber-500">
                    open_in_new
                  </span>
                </div>

                <SiloShader silo={silo} />

                <div className="mt-3 pt-2.5 border-t border-[#1a222c] text-[10px] font-mono text-gray-400">
                  <span className="text-[8px] text-gray-600 block uppercase leading-none mb-0.5">
                    {farm ? farm.name.split(' ')[0] : 'System'} Hub
                  </span>
                  <span className="text-[9px] text-gray-600 block uppercase">Level:</span>
                  <strong className="text-gray-200">
                    {silo.status === 'sensor_err' ? 'OFFLINE' : `${(silo.currentWeight / 1000).toFixed(1)} MT`}
                  </strong>
                  
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
            );
          })}
        </div>
      )}
    </div>
  );
};
