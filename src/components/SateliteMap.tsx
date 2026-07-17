import React, { useState, useRef, useEffect } from 'react';
import { Farm, Silo } from '../types';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface SateliteMapProps {
  farms: Farm[];
  silos: Silo[];
  onSelectFarm: (farmId: string) => void;
  selectedFarmId?: string;
}

const createFarmIcon = (name: string, status: Farm['status'], isSelected: boolean) => {
  const color = status === 'critical' ? '#ef4444' : status === 'warning' ? '#f59e0b' : '#10b981';
  const label = name.split(' ')[0];
  return L.divIcon({
    className: 'custom-farm-marker',
    html: `
      <div style="
        width: 16px; height: 16px;
        background: ${color};
        border: 2px solid #000;
        border-radius: 50%;
        box-shadow: 0 0 8px ${color}88, ${isSelected ? '0 0 0 3px white' : 'none'};
        transition: all 0.2s;
      ">
        <div style="
          position: absolute;
          top: -12px; left: 50%; transform: translateX(-50%);
          background: rgba(9,13,17,0.9);
          border: 1px solid #374151;
          padding: 1px 5px;
          border-radius: 3px;
          font: bold 7px monospace;
          color: #d1d5db;
          white-space: nowrap;
          pointer-events: none;
        ">${label}</div>
      </div>
    `,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
};

const getFarmCoords = (farm: Farm): [number, number] | null => {
  if (farm.coords.lat != null && farm.coords.lng != null) {
    return [farm.coords.lat, farm.coords.lng];
  }
  return null;
};

export const SateliteMap: React.FC<SateliteMapProps> = ({
  farms,
  silos,
  onSelectFarm,
  selectedFarmId
}) => {
  const [hoveredFarm, setHoveredFarm] = useState<Farm | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

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

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [7.5, 80.3],
      zoom: 7.8,
      zoomControl: false,
      attributionControl: false,
      dragging: true,
      scrollWheelZoom: true,
      doubleClickZoom: false,
    });

    const tiles = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 18,
      minZoom: 5,
      crossOrigin: true,
      className: 'map-tiles-fade',
    });
    tiles.addTo(map);

    tiles.on('load', () => setIsLoading(false));
    tiles.on('tileerror', () => setIsLoading(false));

    map.on('zoomstart', () => setIsLoading(true));
    map.on('zoomend', () => setIsLoading(false));
    map.on('movestart', () => setIsLoading(true));
    map.on('moveend', () => setIsLoading(false));

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    farms.forEach(farm => {
      const coords = getFarmCoords(farm);
      if (!coords) return;

      const isSelected = selectedFarmId === farm.id;
      const icon = createFarmIcon(farm.name, farm.status, isSelected);

      const marker = L.marker(coords, { icon }).addTo(map);

      marker.on('click', () => onSelectFarm(farm.id));
      marker.on('mouseover', () => setHoveredFarm(farm));
      marker.on('mouseout', () => setHoveredFarm(null));

      markersRef.current.push(marker);
    });
  }, [farms, selectedFarmId, onSelectFarm]);

  return (
    <div className="relative glass-card border border-[#2d3748] rounded-xl overflow-hidden h-[540px] flex flex-col bg-[#0b0e12] select-none">
      {/* Console Header */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-[#0d1217] border-b border-[#252c35] z-20">
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
      </div>

      {/* Map Area */}
      <div className="relative flex-1 overflow-hidden bg-[#050709]">
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-amber-500/40 border-t-amber-400 rounded-full animate-spin" />
              <span className="font-mono text-[9px] text-amber-500/60 uppercase tracking-widest animate-pulse">
                Acquiring Signal&hellip;
              </span>
            </div>
          </div>
        )}

        {/* Leaflet Map */}
        <div
          ref={mapContainerRef}
          className="absolute inset-0 z-0"
        />

        {/* Orbital HUD Graticules Overlay */}
        <div className="absolute inset-0 pointer-events-none z-10 border border-amber-500/10 m-4 flex flex-col justify-between p-2">
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

        {/* Floating Tactical Hover HUD Panel */}
        {hoveredFarm && (
          <div
            className="absolute z-20 bottom-16 left-4 right-4 sm:left-4 sm:right-auto sm:w-80 bg-[#0e141bc0] backdrop-blur-md border border-amber-500/40 p-4 rounded-lg shadow-2xl animate-fade-in pointer-events-none"
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
                        &#9888; {stats.warningCount} ALARMS ACTIVE
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
      </div>

      {/* Zoom and Position HUD Bar at the bottom */}
      <div className="px-4 py-2 bg-[#0c1015] border-t border-[#232c38] flex items-center justify-between text-xs font-mono text-gray-500 z-20">
        <div className="flex items-center gap-3">
          <span className="text-[9px] uppercase">Telemetry Refresh: <span className="text-emerald-400 font-bold animate-pulse">1.5s</span></span>
          <span className="text-[9px] uppercase hidden md:inline">|</span>
          <span className="text-[9px] uppercase hidden md:inline">Coordinate System: WGS 84</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="w-5 h-5 bg-[#171f2a] border border-[#2d3748] rounded text-gray-300 flex items-center justify-center font-bold text-xs hover:border-gray-500 active:bg-gray-800 cursor-pointer"
          >
            -
          </button>
          <span className="text-[10px] min-w-[36px] text-center text-gray-400">
            {mapInstanceRef.current ? `${Math.round(mapInstanceRef.current.getZoom() / 18 * 100)}%` : '100%'}
          </span>
          <button
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="w-5 h-5 bg-[#171f2a] border border-[#2d3748] rounded text-gray-300 flex items-center justify-center font-bold text-xs hover:border-gray-500 active:bg-gray-800 cursor-pointer"
          >
            +
          </button>
          <button
            onClick={() => {
              mapInstanceRef.current?.setView([7.5, 80.3], 7.8);
            }}
            className="px-1.5 py-0.5 bg-[#171f2a] border border-[#2d3748] rounded text-gray-400 hover:text-gray-200 text-[9px] uppercase cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};
