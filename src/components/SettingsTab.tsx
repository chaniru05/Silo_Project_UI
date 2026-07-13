import React, { useState } from 'react';
import { SystemConfig } from '../types';
import { initialSystemConfig } from '../data/mockData';

interface SettingsTabProps {
  config: SystemConfig;
  onUpdateConfig: (updatedConfig: SystemConfig) => void;
  theme: 'light' | 'dark';
  onUpdateTheme: (newTheme: 'light' | 'dark') => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ 
  config, 
  onUpdateConfig,
  theme,
  onUpdateTheme
}) => {
  const [unit, setUnit] = useState<'metric' | 'imperial'>(config.measurementUnit);
  const [timezone, setTimezone] = useState<string>(config.timezone);
  const [refresh, setRefresh] = useState<number>(config.refreshRate);

  const [lowStock, setLowStock] = useState<number>(config.notificationThresholds.lowStock);
  const [criticalStock, setCriticalStock] = useState<number>(config.notificationThresholds.criticalLevel);

  const handleSave = () => {
    onUpdateConfig({
      ...config,
      measurementUnit: unit,
      timezone,
      refreshRate: refresh,
      notificationThresholds: {
        ...config.notificationThresholds,
        lowStock,
        criticalLevel: criticalStock
      }
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto text-left">
      {/* 1. Header description */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#222a36] pb-4 text-left">
        <div>
          <h2 className="font-sans text-sm font-black text-gray-200 uppercase tracking-tight">
            Terminal Settings &amp; Configuration Gateway
          </h2>
          <p className="font-mono text-[9px] text-gray-500 uppercase mt-0.5">
            Set metric offsets &bull; Adjust Modbus poll frequencies &bull; Regenerate secure API tokens
          </p>
        </div>
        <button
          onClick={handleSave}
          className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-mono text-[10px] font-bold uppercase rounded cursor-pointer transition-colors"
        >
          Commit Configuration
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 1: System settings */}
        <div className="glass-card border border-[#2d3748] rounded-xl p-5 bg-[#0e141b]/95 space-y-4">
          <span className="font-mono text-[9px] text-gray-500 uppercase tracking-widest block border-b border-[#222a36] pb-2">
            Local Terminal Context
          </span>

          {/* Unit Toggle */}
          <div className="space-y-1">
            <label className="font-mono text-[10px] text-gray-400 uppercase block">Measurement System</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setUnit('metric')}
                className={`flex-1 py-1.5 font-mono text-[10px] font-bold border rounded transition-all cursor-pointer ${
                  unit === 'metric'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-400'
                    : 'bg-transparent border-[#222a36] text-gray-400'
                }`}
              >
                METRIC (KG / METRIC TONS)
              </button>
              <button
                type="button"
                onClick={() => setUnit('imperial')}
                className={`flex-1 py-1.5 font-mono text-[10px] font-bold border rounded transition-all cursor-pointer ${
                  unit === 'imperial'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-400'
                    : 'bg-transparent border-[#222a36] text-gray-400'
                }`}
              >
                IMPERIAL (LBS / SHORT TONS)
              </button>
            </div>
          </div>

          {/* TimezoneDropdown */}
          <div className="space-y-1">
            <label className="font-mono text-[10px] text-gray-400 uppercase block">Local Node Timezone Offset</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full bg-[#11171e] border border-[#232c38] focus:border-amber-500 focus:outline-none rounded-lg py-2 px-3 font-mono text-xs text-gray-200"
            >
              <option value="Asia/Colombo (GMT+5:30)">Asia/Colombo (GMT+5:30)</option>
              <option value="UTC (GMT+0:00)">UTC (GMT+0:00)</option>
              <option value="America/New_York (EST)">America/New_York (EST)</option>
            </select>
          </div>

          {/* Refresh poll speed */}
          <div className="space-y-1 pt-2">
            <div className="flex justify-between font-mono text-[10px]">
              <span className="text-gray-400 uppercase">Modbus Poll Frequency:</span>
              <strong className="text-amber-400">{refresh} Seconds</strong>
            </div>
            <input
              type="range"
              min="0.5"
              max="5.0"
              step="0.5"
              value={refresh}
              onChange={(e) => setRefresh(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-1 bg-gray-800 rounded-lg appearance-none"
            />
            <div className="flex justify-between font-mono text-[8px] text-gray-600">
              <span>0.5S (REAL-TIME STREAM)</span>
              <span>5.0S (CONSERVATIVE BANDWIDTH)</span>
            </div>
          </div>
        </div>

        {/* Card 2: Notification thresholds & safety locks */}
        <div className="glass-card border border-[#2d3748] rounded-xl p-5 bg-[#0e141b]/95 space-y-4">
          <span className="font-mono text-[9px] text-gray-500 uppercase tracking-widest block border-b border-[#222a36] pb-2">
            Silo Warning Thresholds
          </span>

          {/* Low Stock Slider */}
          <div className="space-y-1">
            <div className="flex justify-between font-mono text-[10px]">
              <span className="text-gray-400 uppercase">Low stock advisory warning limit:</span>
              <strong className="text-amber-500">{lowStock}%</strong>
            </div>
            <input
              type="range"
              min="10.0"
              max="25.0"
              step="1.0"
              value={lowStock}
              onChange={(e) => setLowStock(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-1 bg-gray-800 rounded-lg appearance-none"
            />
            <div className="flex justify-between font-mono text-[8px] text-gray-600">
              <span>10.0% (LATE ADVISORY)</span>
              <span>25.0% (EARLY WARNING BUFFER)</span>
            </div>
          </div>

          {/* Critical Stock Slider */}
          <div className="space-y-1">
            <div className="flex justify-between font-mono text-[10px]">
              <span className="text-gray-400 uppercase">Critical depletion alarm limit:</span>
              <strong className="text-red-400">{criticalStock}%</strong>
            </div>
            <input
              type="range"
              min="2.0"
              max="8.0"
              step="0.5"
              value={criticalStock}
              onChange={(e) => setCriticalStock(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-1 bg-gray-800 rounded-lg appearance-none"
            />
            <div className="flex justify-between font-mono text-[8px] text-gray-600">
              <span>2.0% (NEAR EMPTY)</span>
              <span>8.0% (HIGH DUST DISPERSION LEVEL)</span>
            </div>
          </div>
        </div>

        {/* Card 3: UI Themes & Preferences */}
        <div className="glass-card border border-[#2d3748] rounded-xl p-5 bg-[#0e141b]/95 space-y-4 md:col-span-2">
          <span className="font-mono text-[9px] text-gray-500 uppercase tracking-widest block border-b border-[#222a36] pb-2">
            User Interface Visual Theme
          </span>

          <div className="space-y-1">
            <label className="font-mono text-[10px] text-gray-400 uppercase block">Active Workspace Layout Theme</label>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={() => onUpdateTheme('dark')}
                className={`flex-1 py-3 font-mono text-[11px] font-bold border rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  theme === 'dark'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-400 shadow-[0_0_10px_rgba(245,166,35,0.1)]'
                    : 'bg-[#11171e] border-[#222a36] text-gray-400 hover:border-gray-500 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-base">dark_mode</span>
                DARK INDUSTRIAL CONSOLE (DEFAULT)
              </button>
              <button
                type="button"
                onClick={() => onUpdateTheme('light')}
                className={`flex-1 py-3 font-mono text-[11px] font-bold border rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  theme === 'light'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-400 shadow-[0_0_10px_rgba(245,166,35,0.1)]'
                    : 'bg-[#11171e] border-[#222a36] text-gray-400 hover:border-gray-500 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-base">light_mode</span>
                LIGHT OPERATIONAL CONSOLE
              </button>
            </div>
            <p className="text-[8px] text-gray-600 font-mono uppercase leading-tight pt-1">
              Toggle to align console luminosity with physical environmental lighting factors.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
