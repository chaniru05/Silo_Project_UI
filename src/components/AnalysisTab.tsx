import React from 'react';
import { Farm, Silo } from '../types';

interface AnalysisTabProps {
  farms: Farm[];
  silos: Silo[];
}

export const AnalysisTab: React.FC<AnalysisTabProps> = ({ farms, silos }) => {
  // Analytical helpers
  const totalCap = silos.reduce((acc, s) => acc + s.capacity, 0);
  const totalInv = silos.reduce((acc, s) => acc + s.currentWeight, 0);
  const surplusPercent = totalCap > 0 ? Math.round(((totalCap - totalInv) / totalCap) * 100) : 0;

  // Find critical/low silos to display as "predicted shortfalls"
  const shortfalls = silos
    .filter(s => s.status === 'critical' || (s.fillPercent < 15 && s.status !== 'sensor_err'))
    .map(s => {
      const parentFarm = farms.find(f => f.id === s.farmId);
      // Depletion estimate: if draining, divide by flowRate. Otherwise random logic
      let hoursLeft = 0;
      if (s.flowRate < 0) {
        hoursLeft = Number((s.currentWeight / Math.abs(s.flowRate)).toFixed(1));
      } else {
        hoursLeft = Number((s.currentWeight / 300).toFixed(1)); // simulate average hourly consumption
      }
      return {
        siloId: s.id,
        farmName: parentFarm ? parentFarm.name : 'Unknown Facility',
        currentLevel: s.fillPercent,
        hoursLeft: Math.max(0.1, hoursLeft),
        feedType: s.type
      };
    })
    .sort((a, b) => a.hoursLeft - b.hoursLeft);

  return (
    <div className="space-y-6">
      {/* 1. Header description */}
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

      {/* 2. Analytical KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* KPI 1 */}
        <div className="glass-card border border-[#2d3748] rounded-xl p-5 bg-[#0e141b]/90 text-left">
          <span className="font-mono text-[9px] text-gray-500 uppercase tracking-widest block mb-1">
            Global Utilization Performance Index
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="font-sans text-2xl font-black text-emerald-400">
              94.2%
            </span>
            <span className="font-mono text-[10px] text-gray-400">score</span>
          </div>
          <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
            Measures sensor drift consistency, refill alignment, and outlet valve responsiveness across all grids.
          </p>
        </div>

        {/* KPI 2 */}
        <div className="glass-card border border-[#2d3748] rounded-xl p-5 bg-[#0e141b]/90 text-left">
          <span className="font-mono text-[9px] text-gray-500 uppercase tracking-widest block mb-1">
            Network Stock Turnover Rate
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="font-sans text-2xl font-black text-amber-500">
              4.2 Days
            </span>
            <span className="font-mono text-[10px] text-gray-400">mean duration</span>
          </div>
          <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
            Represents the average duration a feed batch resides in silo before total flock consumption replenishment.
          </p>
        </div>

        {/* KPI 3 */}
        <div className="glass-card border border-[#2d3748] rounded-xl p-5 bg-[#0e141b]/90 text-left">
          <span className="font-mono text-[9px] text-gray-500 uppercase tracking-widest block mb-1">
            Volumetric Cushion Margin
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="font-sans text-2xl font-black text-gray-200">
              {surplusPercent}%
            </span>
            <span className="font-mono text-[10px] text-gray-400">safety buffer</span>
          </div>
          <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
            The safety margin represented by currently empty, sanitized silo space to store surplus milling cargo.
          </p>
        </div>
      </div>

      {/* 3. Main Bento grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
        
        {/* Left: Predictive Depletion warnings (Span 7) */}
        <div className="lg:col-span-7 glass-card border border-[#2d3748] rounded-xl p-5 bg-[#0e141b]/90 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#222a36] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-red-500 text-lg animate-pulse">
                  gavel
                </span>
                <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-gray-200">
                  Predicted Depot Shortfalls &bull; Urgent Dispatch List
                </h3>
              </div>
              <span className="font-mono text-[9px] text-red-400 bg-red-500/10 border border-red-500/20 px-1 py-0.2 rounded animate-pulse">
                ACTION RECOMMENDED
              </span>
            </div>

            <div className="space-y-3">
              {shortfalls.length === 0 ? (
                <div className="py-12 text-center text-gray-500 font-mono text-[10px]">
                  ✓ ALL SYSTEM DEPOS ARE SAFE ABOVE LOW STOCK CONTEXT
                </div>
              ) : (
                shortfalls.map((s, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-[#11171e] border border-[#222c37] hover:border-red-500/40 rounded-lg flex flex-wrap items-center justify-between gap-3 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <strong className="font-sans text-xs text-gray-100">{s.siloId}</strong>
                        <span className="font-mono text-[8px] bg-[#1a222c] px-1 text-amber-500 rounded font-bold">
                          {s.feedType}
                        </span>
                      </div>
                      <span className="font-mono text-[9px] text-gray-500 uppercase block">
                        Hub Location: {s.farmName}
                      </span>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <span className="text-[9px] font-mono text-gray-500 block">LEVEL:</span>
                        <strong className="text-red-400 font-mono text-xs">{s.currentLevel}%</strong>
                      </div>

                      <div className="text-right">
                        <span className="text-[9px] font-mono text-gray-500 block">DEPLETION IN:</span>
                        <strong className="text-red-500 font-mono text-xs animate-pulse">
                          {s.hoursLeft} Hours
                        </strong>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-[#1a212b] mt-4 text-[9px] font-mono text-gray-500 text-center uppercase">
            Dispersion models are recalculating load variances... Safe stock buffers are currently configured to 15.0%
          </div>
        </div>

        {/* Right: 30d forecast (Span 5) */}
        <div className="lg:col-span-5 glass-card border border-[#2d3748] rounded-xl p-5 bg-[#0e141b]/90">
          <div className="flex items-center justify-between border-b border-[#222a36] pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500 text-lg">
                trending_up
              </span>
              <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-gray-200">
                Predictive Crop Demand (30d)
              </h3>
            </div>
          </div>

          {/* Forecast bar visualization inside SVG for extreme performance */}
          <div className="relative h-48 w-full mt-4">
            <svg className="w-full h-full" viewBox="0 0 300 150" preserveAspectRatio="none">
              {/* Guidelines */}
              <line x1="0" y1="30" x2="300" y2="30" stroke="rgba(37,44,53,0.3)" strokeWidth="0.5" />
              <line x1="0" y1="80" x2="300" y2="80" stroke="rgba(37,44,53,0.3)" strokeWidth="0.5" />
              <line x1="0" y1="130" x2="300" y2="130" stroke="rgba(37,44,53,0.3)" strokeWidth="0.5" />

              {/* Day 1 Bars */}
              <rect x="25" y="80" width="12" height="55" fill="rgba(37,44,53,0.8)" rx="2" />
              <rect x="40" y="70" width="12" height="65" fill="#f5a623" rx="2" />

              {/* Day 10 Bars */}
              <rect x="95" y="60" width="12" height="75" fill="rgba(37,44,53,0.8)" rx="2" />
              <rect x="110" y="50" width="12" height="85" fill="#f5a623" rx="2" />

              {/* Day 20 Bars */}
              <rect x="165" y="45" width="12" height="90" fill="rgba(37,44,53,0.8)" rx="2" />
              <rect x="180" y="35" width="12" height="100" fill="#f5a623" rx="2" />

              {/* Day 30 Bars */}
              <rect x="235" y="30" width="12" height="105" fill="rgba(37,44,53,0.8)" rx="2" />
              <rect x="250" y="15" width="12" height="120" fill="#f5a623" rx="2" />
            </svg>

            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-1 font-mono text-[8px] text-gray-500 text-left">
              <span>6,000 MT/Mo</span>
              <span>3,000 MT/Mo</span>
              <span>0 MT/Mo</span>
            </div>

            {/* Labels */}
            <div className="flex justify-between px-6 font-mono text-[8px] text-gray-400 mt-2">
              <span>DAY 1</span>
              <span>DAY 10</span>
              <span>DAY 20</span>
              <span>DAY 30</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 mt-3 text-[9px] font-mono text-gray-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-gray-700 inline-block" />
              <span>Prior Baseline Demand</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block" />
              <span>Regression Model Curve</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
