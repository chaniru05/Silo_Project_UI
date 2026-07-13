import React, { useState, useEffect } from 'react';
import { Silo, Farm } from '../types';
import { SiloShader } from './SiloShader';

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

export const SiloDetailView: React.FC<SiloDetailViewProps> = ({
  silo,
  farm,
  onBack,
  onUpdateSilo
}) => {
  const [sliderWeight, setSliderWeight] = useState<number>(silo.currentWeight);
  const [eventLogs, setEventLogs] = useState<LogEvent[]>([]);

  useEffect(() => {
    setSliderWeight(silo.currentWeight);
  }, [silo.currentWeight]);

  // Seed initial mock logs
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
      ...prev.slice(0, 8) // Limit to 8 logs for visual brevity
    ]);
  };

  // Slider change handler
  const handleWeightSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWeight = Number(e.target.value);
    setSliderWeight(newWeight);
    const fillPercent = Number(((newWeight / silo.capacity) * 100).toFixed(1));
    
    let newStatus = silo.status;
    if (newWeight >= silo.capacity) {
      newStatus = 'warning';
    } else if (newWeight <= 0) {
      newStatus = 'critical';
    } else if (silo.flowRate > 0) {
      newStatus = 'filling';
    } else if (silo.flowRate < 0) {
      newStatus = 'unloading';
    } else {
      newStatus = 'stable';
    }

    onUpdateSilo({
      ...silo,
      currentWeight: newWeight,
      fillPercent,
      status: newStatus
    });

    addLog('MANUAL_DISPLACE', `Weight displacement slider altered capacity to ${fillPercent}% (${newWeight}kg).`);
  };

  // State command buttons
  const triggerRefill = () => {
    onUpdateSilo({
      ...silo,
      status: 'filling',
      flowRate: 1500
    });
    addLog('COMMAND_SEND', 'Refill slide gate solenoid command sent: Gate 100% open [Rate: 1500kg/hr].');
  };

  const triggerDischarge = () => {
    onUpdateSilo({
      ...silo,
      status: 'unloading',
      flowRate: -450
    });
    addLog('COMMAND_SEND', 'Discharge outlet valve command sent: Valve 30% open [Rate: -450kg/hr].');
  };

  const triggerStabilize = () => {
    onUpdateSilo({
      ...silo,
      status: 'stable',
      flowRate: 0
    });
    addLog('COMMAND_SEND', 'All physical actuator valves stabilized. Telemetry monitoring cycle holds stable.');
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with Breadcrumbs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#222a36] pb-4 text-left">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-8 h-8 bg-[#18202b] border border-[#2d3748] rounded-lg text-gray-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
            title="Return to Telemetry List"
          >
            <span className="material-symbols-outlined text-lg">
              arrow_back
            </span>
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
              }`}>
                {silo.status}
              </span>
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

      {/* 2. Double-Column Analysis Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Visual Silo Container & Actuators (Span 5) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-card border border-[#2d3748] rounded-xl p-5 bg-[#0e141b]/95 text-center flex flex-col justify-between">
            <div className="border-b border-[#222a36] pb-3 mb-4 text-left">
              <span className="font-mono text-[9px] text-gray-500 uppercase tracking-widest block">
                Active Physical Model
              </span>
              <p className="font-mono text-[8px] text-gray-600 block mt-0.5">
                Volumetric liquid grain physics overlay
              </p>
            </div>

            {/* Huge Silo Shader */}
            <div className="bg-[#080c10]/90 border border-[#1e2733] rounded-lg p-5 flex justify-center mb-5">
              <SiloShader silo={silo} isLarge={true} />
            </div>

            {/* Dynamic Solenoid Control Buttons (Actuators) */}
            <div className="space-y-3 text-left">
              <span className="font-mono text-[9px] text-gray-500 uppercase tracking-widest block mb-1">
                Solenoid Gate Actuators
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={triggerRefill}
                  disabled={silo.status === 'sensor_err'}
                  className={`py-2 px-1 border border-[#232d3a] hover:border-emerald-500/45 hover:bg-emerald-500/5 text-gray-300 font-mono text-[9px] font-bold uppercase rounded transition-all cursor-pointer ${
                    silo.status === 'filling' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : ''
                  }`}
                >
                  ▲ INTAKE ON
                </button>
                <button
                  onClick={triggerDischarge}
                  disabled={silo.status === 'sensor_err'}
                  className={`py-2 px-1 border border-[#232d3a] hover:border-amber-500/45 hover:bg-amber-500/5 text-gray-300 font-mono text-[9px] font-bold uppercase rounded transition-all cursor-pointer ${
                    silo.status === 'unloading' ? 'border-amber-500 bg-amber-500/10 text-amber-400' : ''
                  }`}
                >
                  ▼ OUTLET VALV
                </button>
                <button
                  onClick={triggerStabilize}
                  disabled={silo.status === 'sensor_err'}
                  className={`py-2 px-1 border border-[#232d3a] hover:border-red-500/45 hover:bg-red-500/5 text-gray-300 font-mono text-[9px] font-bold uppercase rounded transition-all cursor-pointer ${
                    silo.status === 'stable' ? 'border-amber-500 bg-amber-500/10 text-amber-400' : ''
                  }`}
                >
                  ■ STABILIZE
                </button>
              </div>
            </div>

            {/* Manual Calibration Slider Override */}
            <div className="mt-5 space-y-2 text-left pt-4 border-t border-[#1b222c]">
              <div className="flex justify-between font-mono text-[9px]">
                <span className="text-gray-500 uppercase">Manual Weight Displace Override:</span>
                <span className="text-amber-400 font-bold">{sliderWeight.toLocaleString()} kg</span>
              </div>
              <input
                type="range"
                min="0"
                max={silo.capacity}
                step="100"
                value={sliderWeight}
                onChange={handleWeightSliderChange}
                disabled={silo.status === 'sensor_err'}
                className="w-full accent-amber-500 cursor-pointer h-1 bg-gray-800 rounded-lg appearance-none"
              />
              <div className="flex justify-between font-mono text-[8px] text-gray-600">
                <span>0 KG (EMPTY)</span>
                <span>{silo.capacity.toLocaleString()} KG (FULL CAPACITY)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Detailed readouts & live event streams (Span 7) */}
        <div className="lg:col-span-7 space-y-6 text-left">
          
          {/* Detailed Readouts Panel */}
          <div className="glass-card border border-[#2d3748] rounded-xl p-5 bg-[#0e141b]/95">
            <span className="font-mono text-[9px] text-gray-500 uppercase tracking-widest block mb-4 border-b border-[#222a36] pb-2">
              Sensor Node Diagnostics Array
            </span>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-0.5">
                <span className="font-mono text-[8px] text-gray-500 uppercase block">Mass Inventory:</span>
                <span className="font-sans text-base font-extrabold text-gray-100 block">
                  {silo.status === 'sensor_err' ? 'COMS ERR' : `${silo.currentWeight.toLocaleString()} kg`}
                </span>
                <span className="font-mono text-[8px] text-gray-500 block leading-none">
                  {(silo.currentWeight / 1000).toFixed(1)} Metric Tons
                </span>
              </div>

              <div className="space-y-0.5">
                <span className="font-mono text-[8px] text-gray-500 uppercase block">Active Volume:</span>
                <span className="font-sans text-base font-extrabold text-amber-500 block">
                  {silo.status === 'sensor_err' ? '0.0%' : `${silo.fillPercent}%`}
                </span>
                <span className="font-mono text-[8px] text-gray-500 block leading-none">
                  of maximum capacity
                </span>
              </div>

              <div className="space-y-0.5">
                <span className="font-mono text-[8px] text-gray-500 uppercase block">Remaining Margin:</span>
                <span className="font-sans text-base font-semibold text-gray-300 block">
                  {silo.status === 'sensor_err' ? '0 kg' : `${(silo.capacity - silo.currentWeight).toLocaleString()} kg`}
                </span>
                <span className="font-mono text-[8px] text-gray-500 block leading-none">
                  available expansion
                </span>
              </div>

              <div className="space-y-0.5">
                <span className="font-mono text-[8px] text-gray-500 uppercase block">Transceiver Health:</span>
                <span className="font-sans text-base font-semibold text-emerald-400 block flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${silo.status === 'sensor_err' ? 'bg-red-500 animate-ping' : 'bg-emerald-500'}`} />
                  {silo.status === 'sensor_err' ? 'CRIT ERR' : '99.8%'}
                </span>
                <span className="font-mono text-[8px] text-gray-500 block leading-none">
                  RS485 Modbus Link State
                </span>
              </div>
            </div>
          </div>

          {/* Live events terminal */}
          <div className="glass-card border border-[#2d3748] rounded-xl p-5 bg-[#0e141b]/95 flex flex-col h-80 justify-between">
            <div>
              <span className="font-mono text-[9px] text-gray-500 uppercase tracking-widest block mb-3 border-b border-[#222a36] pb-2">
                Auto-Detected Terminal Events Log
              </span>

              <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1 text-left font-mono text-[10px]">
                {eventLogs.map((log, index) => (
                  <div key={index} className="flex items-start gap-2 py-1.5 border-b border-[#1b222c] last:border-none">
                    <span className="text-gray-500 shrink-0">[{log.time}]</span>
                    <span className={`px-1 rounded text-[8px] font-extrabold shrink-0 ${
                      log.type === 'COMMAND_SEND' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      log.type === 'MANUAL_DISPLACE' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                    }`}>
                      {log.type}
                    </span>
                    <span className="text-gray-300">{log.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="font-mono text-[8px] text-gray-500 text-center uppercase tracking-wider pt-2 border-t border-[#1b222c]">
              Modbus physical telemetry loop frequency: &bull; 1.5 Hz Refreshes
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
