import React, { useState, useRef, useEffect } from 'react';
import { Farm, Silo } from '../types';

interface SateliteMapProps {
  farms: Farm[];
  silos: Silo[];
  onSelectFarm: (farmId: string) => void;
  selectedFarmId?: string;
}

type MapLayer = 'satellite' | 'thermal' | 'rf_grid' | 'density';

export const SateliteMap: React.FC<SateliteMapProps> = ({
  farms,
  silos,
  onSelectFarm,
  selectedFarmId
}) => {
  const [zoom, setZoom] = useState<number>(1.2);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [is3DMode, setIs3DMode] = useState<boolean>(true);
  const [activeLayer, setActiveLayer] = useState<MapLayer>('satellite');
  const [hoveredFarm, setHoveredFarm] = useState<Farm | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const isDragging = useRef<boolean>(false);
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Map image hotlink provided by the user
  const mapUrl = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAbuEkrECIE0MamU5eK7ElXJ-hCIAeKPZUYVBr_4OAmDXTIVO_P8QoMLquEcfvzW4b6W1FclYbZEeza8vV8JQoCZL6Wjv6EpTWsfU6I5oDkxii1hWUv-tvBKuJ7Ddn-SDePRIVrZbQxT3jZflun5zFsWvUF52zv7VyzgiLu63g3dqX7tqAF_WblZYCwQ6V2c2gWLiBRx8h0oA0HyXmR6BkMO9X9ZMqo4Pk9PcT-E0FJcnMSiRzqD5aK-br_FQ_PflZ68YePTBmMVCIM';

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    dragStart.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const nextX = e.clientX - dragStart.current.x;
    const nextY = e.clientY - dragStart.current.y;
    // Bound dragging offsets based on zoom level
    const maxOffset = (zoom - 1) * 200;
    setPanOffset({
      x: Math.max(-maxOffset - 100, Math.min(maxOffset + 100, nextX)),
      y: Math.max(-maxOffset - 150, Math.min(maxOffset + 150, nextY))
    });
  };

  const handleMouseUpOrLeave = () => {
    isDragging.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 0.1;
    let nextZoom = zoom + (e.deltaY < 0 ? zoomFactor : -zoomFactor);
    nextZoom = Math.max(1.0, Math.min(3.0, nextZoom));
    setZoom(nextZoom);
  };

  // Get aggregated stats of a farm for HUD rendering
  const getFarmStats = (farmId: string) => {
    const farmSilos = silos.filter(s => s.farmId === farmId);
    const operationalSilos = farmSilos.filter(s => s.status !== 'sensor_err').length;
    const onlineWeight = farmSilos.reduce((acc, s) => acc + s.currentWeight, 0);
    const totalCapacity = farmSilos.reduce((acc, s) => acc + s.capacity, 0);
    const warningCount = farmSilos.filter(s => s.status === 'warning' || s.status === 'critical').length;
    return {
      operationalSilos,
      onlineWeight,
      totalCapacity,
      warningCount,
      percent: totalCapacity > 0 ? Math.round((onlineWeight / totalCapacity) * 100) : 0
    };
  };

  return (
    <div className="relative glass-card border border-[#2d3748] rounded-xl overflow-hidden h-[540px] flex flex-col bg-[#0b0e12] select-none">
      {/* Console Header */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-[#0d1217] border-b border-[#252c35] z-10">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-amber-500 text-lg animate-pulse">
            satellite_alt
          </span>
          <div>
            <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-gray-200">
              Sri Lanka Mission Control
            </h3>
            <p className="font-mono text-[9px] text-gray-500 uppercase">
              Tactical Orbital Telemetry &bull; Facility Geopositions
            </p>
          </div>
        </div>

        {/* Tactical Layers */}
        <div className="flex items-center gap-1.5 mt-2 sm:mt-0">
          {(['satellite', 'thermal', 'rf_grid', 'density'] as MapLayer[]).map(layer => (
            <button
              key={layer}
              onClick={() => setActiveLayer(layer)}
              className={`px-2 py-1 rounded font-mono text-[9px] font-bold uppercase border tracking-tight transition-all duration-150 ${
                activeLayer === layer
                  ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                  : 'bg-transparent border-[#222b35] text-gray-400 hover:border-gray-500 hover:text-gray-200'
              }`}
            >
              {layer.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* 3D Isometric Toggle */}
        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <span className="font-mono text-[9px] text-gray-500 uppercase">Perspective Tilt:</span>
          <button
            onClick={() => setIs3DMode(!is3DMode)}
            className={`w-9 h-5 rounded-full flex items-center p-0.5 transition-all duration-300 ${
              is3DMode ? 'bg-amber-500' : 'bg-gray-700'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-[#0a0d11] shadow-md transform transition-transform duration-300 ${
                is3DMode ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Map Interactive Sandbox Stage */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onWheel={handleWheel}
        className="relative flex-1 cursor-grab active:cursor-grabbing overflow-hidden bg-[#050709] industrial-grid"
      >
        {/* Orbital HUD Graticules Overlay */}
        <div className="absolute inset-0 pointer-events-none border border-amber-500/10 z-10 m-4 flex flex-col justify-between p-2">
          <div className="flex justify-between text-[8px] font-mono text-amber-500/40">
            <span>GRID LN-209.5A</span>
            <span>SAT BEAM LK-A3</span>
            <span>ALTITUDE: 540KM</span>
          </div>
          <div className="flex justify-between text-[8px] font-mono text-amber-500/40">
            <span>AZIMUTH: 182.4&deg;</span>
            <span>LAT: 7.8731&deg; N / LON: 80.7718&deg; E</span>
            <span>RSSI: -42dBm</span>
          </div>
        </div>

        {/* Map Base Canvas with Perspective and Scaling transforms */}
        <div
          ref={mapRef}
          style={{
            transform: `
              ${is3DMode ? 'perspective(800px) rotateX(15deg) rotateY(-5deg)' : 'perspective(none) rotateX(0) rotateY(0)'}
              scale(${zoom})
              translate(${panOffset.x}px, ${panOffset.y}px)
            `,
            transition: isDragging.current ? 'none' : 'transform 0.4s cubic-bezier(0.1, 0.8, 0.2, 1)'
          }}
          className="absolute inset-0 flex items-center justify-center transition-all duration-300"
        >
          <div className="relative w-[340px] h-[440px] select-none pointer-events-none">
            {/* 1. Underlying Map Image */}
            <img
              src={mapUrl}
              alt="Sri Lanka Satellite Map"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover rounded opacity-75 border border-[#1f2937] shadow-2xl transition-all duration-300 filter grayscale-[20%]"
            />

            {/* 2. Shader overlay layers */}
            {activeLayer === 'thermal' && (
              <div className="absolute inset-0 bg-red-950/20 mix-blend-color-burn pointer-events-none rounded">
                {/* Thermal focal gradient glow around farm centers */}
                {farms.map(f => (
                  <div
                    key={`thermal-${f.id}`}
                    style={{ top: f.coords.top, left: f.coords.left }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full w-24 h-24 bg-gradient-to-r from-red-600/40 to-transparent blur-xl"
                  />
                ))}
              </div>
            )}

            {activeLayer === 'rf_grid' && (
              <div className="absolute inset-0 pointer-events-none rounded opacity-40 overflow-hidden">
                {/* Cyber grid lines and laser linkage */}
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="cyan-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#22d3ee" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#cyan-grid)" />
                  {/* Connect Gampaha, Kurunegala, Puttalam, Anuradhapura */}
                  <line x1="26%" y1="69%" x2="42%" y2="55%" stroke="#ff9f1c" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="42%" y1="55%" x2="47%" y2="32%" stroke="#ff9f1c" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="47%" y1="32%" x2="25%" y2="43%" stroke="#ff9f1c" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="25%" y1="43%" x2="26%" y2="69%" stroke="#ff9f1c" strokeWidth="1" strokeDasharray="3 3" />
                </svg>
              </div>
            )}

            {activeLayer === 'density' && (
              <div className="absolute inset-0 pointer-events-none rounded bg-emerald-950/15 mix-blend-color-dodge">
                {farms.map(f => {
                  const stats = getFarmStats(f.id);
                  const glowColor = stats.percent > 90 ? 'from-red-500/45' : 'from-amber-500/45';
                  return (
                    <div
                      key={`density-${f.id}`}
                      style={{ top: f.coords.top, left: f.coords.left }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full w-20 h-20 bg-gradient-to-r ${glowColor} to-transparent blur-lg`}
                    />
                  );
                })}
              </div>
            )}

            {/* 3. Interactive Facility Markers Pins */}
            {farms.map(farm => {
              const stats = getFarmStats(farm.id);
              const isSelected = selectedFarmId === farm.id;
              
              // Define marker coloring based on active status
              let ringColor = 'border-emerald-500';
              let bgColor = 'bg-emerald-500';
              let glowColor = 'shadow-emerald-500/50';

              if (farm.status === 'warning') {
                ringColor = 'border-amber-500';
                bgColor = 'bg-amber-500';
                glowColor = 'shadow-amber-500/50';
              } else if (farm.status === 'critical') {
                ringColor = 'border-red-500';
                bgColor = 'bg-red-500';
                glowColor = 'shadow-red-500/50';
              }

              return (
                <div
                  key={farm.id}
                  style={{
                    top: farm.coords.top,
                    left: farm.coords.left,
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'auto'
                  }}
                  className="absolute z-20 group"
                  onMouseEnter={() => setHoveredFarm(farm)}
                  onMouseLeave={() => setHoveredFarm(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectFarm(farm.id);
                  }}
                >
                  {/* Glowing Radar Pulse circles */}
                  <div className={`absolute -inset-4 rounded-full border ${ringColor} opacity-50 animate-ping pointer-events-none`} />
                  <div className={`absolute -inset-2 rounded-full border ${ringColor} opacity-30 pointer-events-none`} />

                  {/* Physical Point Marker */}
                  <button
                    className={`w-4.5 h-4.5 rounded-full ${bgColor} border border-black shadow-lg flex items-center justify-center transition-all duration-300 transform group-hover:scale-125 cursor-pointer ${
                      isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0b0e12]' : ''
                    }`}
                  >
                    <span className="material-symbols-outlined text-[9px] text-black font-extrabold">
                      gavel
                    </span>
                  </button>

                  {/* Tiny Label Anchor */}
                  <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-[#090d11]/90 border border-gray-700 px-1.5 py-0.5 rounded shadow text-[8px] font-mono font-bold whitespace-nowrap text-gray-300">
                    {farm.name.split(' ')[0]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating Tactical Hover HUD HUD Panel (Absolute overlay) */}
      {hoveredFarm && (
        <div
          className="absolute z-30 bottom-16 left-4 right-4 sm:left-4 sm:right-auto sm:w-80 bg-[#0e141bc0] backdrop-blur-md border border-amber-500/40 p-4 rounded-lg shadow-2xl animate-fade-in pointer-events-none"
        >
          <div className="flex items-center justify-between border-b border-[#2d3748] pb-1.5 mb-2">
            <div>
              <h4 className="font-sans text-xs font-bold text-gray-100 uppercase">
                {hoveredFarm.name}
              </h4>
              <p className="font-mono text-[9px] text-gray-500 uppercase">
                {hoveredFarm.province}
              </p>
            </div>
            <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono uppercase font-extrabold ${
              hoveredFarm.status === 'operational' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
              hoveredFarm.status === 'warning' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
              'bg-red-500/10 text-red-400 border border-red-500/30'
            }`}>
              {hoveredFarm.status}
            </span>
          </div>

          {(() => {
            const stats = getFarmStats(hoveredFarm.id);
            return (
              <div className="grid grid-cols-2 gap-2 text-left">
                <div>
                  <span className="text-[9px] font-mono text-gray-500 uppercase block">Active Load:</span>
                  <span className="font-mono text-xs text-amber-400 font-bold">
                    {(stats.onlineWeight / 1000).toFixed(1)} MT
                  </span>
                  <span className="text-[9px] text-gray-600 block">/ {(stats.totalCapacity / 1000).toFixed(0)} MT Max</span>
                </div>

                <div>
                  <span className="text-[9px] font-mono text-gray-500 uppercase block">Silo Integrity:</span>
                  <span className="font-mono text-xs text-gray-200 font-semibold block">
                    {stats.operationalSilos} / {hoveredFarm.siloCount} Online
                  </span>
                  {stats.warningCount > 0 && (
                    <span className="text-[9px] text-red-400 font-mono animate-pulse block">
                      ⚠ {stats.warningCount} ALARMS ACTIVE
                    </span>
                  )}
                </div>

                <div className="col-span-2 mt-1">
                  <div className="flex justify-between text-[9px] font-mono mb-0.5">
                    <span className="text-gray-500 uppercase">Facility Fill Index:</span>
                    <span className="text-gray-300">{stats.percent}%</span>
                  </div>
                  <div className="w-full bg-[#1b222c] h-1.5 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${stats.percent}%` }}
                      className={`h-full rounded-full ${
                        stats.percent > 90 ? 'bg-red-500' :
                        stats.percent < 15 ? 'bg-red-500 animate-pulse' :
                        'bg-amber-500'
                      }`}
                    />
                  </div>
                </div>
              </div>
            );
          })()}
          <p className="mt-2 text-[8px] font-mono text-amber-500/50 uppercase leading-tight text-center">
            Click Point To Initiate Detailed Structural Drill-Down
          </p>
        </div>
      )}

      {/* Zoom and Position HUD Bar at the bottom */}
      <div className="px-4 py-2 bg-[#0c1015] border-t border-[#232c38] flex items-center justify-between text-xs font-mono text-gray-500 z-10">
        <div className="flex items-center gap-3">
          <span className="text-[9px] uppercase">Telemetry Refresh: <span className="text-emerald-400 font-bold animate-pulse">1.5s</span></span>
          <span className="text-[9px] uppercase hidden md:inline">|</span>
          <span className="text-[9px] uppercase hidden md:inline">Coordinate System: WGS 84</span>
        </div>

        {/* Floating Zoom Controls HUD */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(prev => Math.max(1.0, prev - 0.2))}
            className="w-5 h-5 bg-[#171f2a] border border-[#2d3748] rounded text-gray-300 flex items-center justify-center font-bold text-xs hover:border-gray-500 active:bg-gray-800"
          >
            -
          </button>
          <span className="text-[10px] min-w-[36px] text-center text-gray-400">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(prev => Math.min(3.0, prev + 0.2))}
            className="w-5 h-5 bg-[#171f2a] border border-[#2d3748] rounded text-gray-300 flex items-center justify-center font-bold text-xs hover:border-gray-500 active:bg-gray-800"
          >
            +
          </button>
          <button
            onClick={() => {
              setZoom(1.2);
              setPanOffset({ x: 0, y: 0 });
            }}
            className="px-1.5 py-0.5 bg-[#171f2a] border border-[#2d3748] rounded text-gray-400 hover:text-gray-200 text-[9px] uppercase"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};
