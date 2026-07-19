import React, { useState, useMemo, useRef } from 'react';
import { Silo, Farm } from '../types';
import { generateAllSiloLogs, LoadingLogEntry } from '../data/mockLogs';

interface LogSearchModalProps {
  silos: Silo[];
  farms: Farm[];
  onClose: () => void;
}

export const LogSearchModal: React.FC<LogSearchModalProps> = ({ silos, farms, onClose }) => {
  const [searchSiloId, setSearchSiloId] = useState('');
  const [searchStart, setSearchStart] = useState('');
  const [searchEnd, setSearchEnd] = useState('');
  const [logType, setLogType] = useState<'all' | 'loading' | 'unloading'>('all');
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const allLogsRef = useRef<Map<string, LoadingLogEntry[]>>(generateAllSiloLogs(silos));

  const filteredLogs = useMemo(() => {
    const results: (LoadingLogEntry & { siloId: string; farmName: string })[] = [];
    const startMs = searchStart ? new Date(searchStart).getTime() : 0;
    const endMs = searchEnd ? new Date(searchEnd).getTime() + 86400000 : Date.now() + 86400000;

    const targetIds = searchSiloId
      ? silos.filter(s => s.id.toLowerCase().includes(searchSiloId.toLowerCase())).map(s => s.id)
      : silos.map(s => s.id);

    for (const id of targetIds) {
      const logs = allLogsRef.current.get(id) || [];
      for (const log of logs) {
        if (log.type === 'stable') continue;
        if (logType !== 'all' && log.type !== logType) continue;
        const t = new Date(log.timestamp).getTime();
        if (t < startMs || t >= endMs) continue;
        const farm = farms.find(f => f.id === silos.find(s => s.id === id)?.farmId);
        results.push({ ...log, siloId: id, farmName: farm?.name || 'Unknown' });
      }
    }
    return results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [silos, farms, searchSiloId, searchStart, searchEnd, logType]);

  const totalPages = Math.ceil(filteredLogs.length / pageSize);
  const pageLogs = filteredLogs.slice(page * pageSize, (page + 1) * pageSize);

  const exportCSV = () => {
    const header = 'Silo ID,Farm,Date,Time,Type,Weight (kg),Delta (kg),Flow (kg/h),Source\n';
    const rows = filteredLogs.map(l => {
      const d = new Date(l.timestamp);
      const date = d.toLocaleDateString('en-GB');
      const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      return `${l.siloId},${l.farmName},${date},${time},${l.type},${l.weight},${l.delta},${l.flowRate},${l.source}`;
    }).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'log_search_results.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#0e141b] border border-[#2d3748] rounded-xl w-[90vw] max-w-5xl max-h-[85vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#222a36]">
          <h2 className="font-sans text-sm font-black text-gray-200 uppercase tracking-tight">Cross-Silo Log Search</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-200 cursor-pointer text-lg font-mono">&times;</button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-[#222a36] bg-[#11171e]/50">
          <div className="flex-1 min-w-[140px]">
            <span className="font-mono text-[8px] text-gray-500 uppercase block mb-0.5">Silo ID</span>
            <input type="text" value={searchSiloId} onChange={e => { setSearchSiloId(e.target.value); setPage(0); }}
              placeholder="Search by ID..." className="w-full bg-[#0c1015] border border-[#232c38] rounded px-2 py-1 font-mono text-[10px] text-gray-200 focus:border-amber-500 focus:outline-none" />
          </div>
          <div className="min-w-[120px]">
            <span className="font-mono text-[8px] text-gray-500 uppercase block mb-0.5">From</span>
            <input type="date" value={searchStart} onChange={e => { setSearchStart(e.target.value); setPage(0); }}
              className="w-full bg-[#0c1015] border border-[#232c38] rounded px-2 py-1 font-mono text-[10px] text-gray-200 focus:border-amber-500 focus:outline-none" />
          </div>
          <div className="min-w-[120px]">
            <span className="font-mono text-[8px] text-gray-500 uppercase block mb-0.5">To</span>
            <input type="date" value={searchEnd} onChange={e => { setSearchEnd(e.target.value); setPage(0); }}
              className="w-full bg-[#0c1015] border border-[#232c38] rounded px-2 py-1 font-mono text-[10px] text-gray-200 focus:border-amber-500 focus:outline-none" />
          </div>
          <div className="min-w-[100px]">
            <span className="font-mono text-[8px] text-gray-500 uppercase block mb-0.5">History</span>
            <select value={logType} onChange={e => { setLogType(e.target.value as typeof logType); setPage(0); }}
              className="w-full bg-[#0c1015] border border-[#232c38] rounded px-2 py-1 font-mono text-[10px] text-gray-200 focus:border-amber-500 focus:outline-none">
              <option value="all">ALL HISTORY</option>
              <option value="loading">LOADING RECORDS</option>
              <option value="unloading">UNLOADING RECORDS</option>
            </select>
          </div>
          <div className="self-end">
            <button onClick={exportCSV}
              className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 font-mono text-[9px] font-bold uppercase rounded transition-all duration-150 cursor-pointer">
              Export CSV
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {pageLogs.length === 0 ? (
            <div className="py-16 text-center text-gray-500 font-mono text-[10px]">No records match the specified criteria.</div>
          ) : (
            <table className="w-full text-left font-mono text-[9px] border-collapse">
              <thead className="sticky top-0 bg-[#0e141b] z-10">
                <tr className="text-gray-500 uppercase text-[8px] border-b border-[#1b222c]">
                  <th className="py-2 px-3">Silo</th>
                  <th className="py-2 px-3">Farm</th>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Time</th>
                  <th className="py-2 px-3">Type</th>
                  <th className="py-2 px-3 text-right">Weight</th>
                  <th className="py-2 px-3 text-right">Delta</th>
                  <th className="py-2 px-3 text-right">Flow</th>
                  <th className="py-2 px-3">Source</th>
                </tr>
              </thead>
              <tbody>
                {pageLogs.map((log, i) => (
                  <tr key={i} className="border-b border-[#1b222c]/50 hover:bg-[#11171e]/50 transition-colors">
                    <td className="py-1.5 px-3 text-amber-500 font-bold">{log.siloId}</td>
                    <td className="py-1.5 px-3 text-gray-400">{log.farmName}</td>
                    <td className="py-1.5 px-3 text-gray-400">{new Date(log.timestamp).toLocaleDateString('en-GB')}</td>
                    <td className="py-1.5 px-3 text-gray-500">{new Date(log.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="py-1.5 px-3">
                      <span className={`px-1 rounded text-[7px] font-extrabold ${
                        log.type === 'loading' ? 'bg-emerald-500/10 text-emerald-400' :
                        log.type === 'unloading' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-gray-500/10 text-gray-400'
                      }`}>{log.type === 'loading' ? 'LOAD' : log.type === 'unloading' ? 'UNLOAD' : 'STABLE'}</span>
                    </td>
                    <td className="py-1.5 px-3 text-right text-gray-200 font-semibold">{(log.weight / 1000).toFixed(1)}</td>
                    <td className={`py-1.5 px-3 text-right font-semibold ${log.delta > 0 ? 'text-emerald-400' : log.delta < 0 ? 'text-amber-400' : 'text-gray-500'}`}>
                      {log.delta > 0 ? `+${(log.delta / 1000).toFixed(1)}` : (log.delta / 1000).toFixed(1)}
                    </td>
                    <td className="py-1.5 px-3 text-right text-gray-400">{log.flowRate > 0 ? `+${log.flowRate}` : log.flowRate} kg/h</td>
                    <td className="py-1.5 px-3"><span className={`text-[7px] ${log.source === 'manual' ? 'text-amber-500' : 'text-gray-500'}`}>{log.source === 'manual' ? 'MANUAL' : 'AUTO'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#222a36]">
          <span className="font-mono text-[9px] text-gray-500">{filteredLogs.length} records</span>
          <div className="flex items-center gap-2">
            <button disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}
              className="px-2 py-1 border border-[#232c38] rounded text-gray-400 hover:text-gray-200 font-mono text-[9px] disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed">Prev</button>
            <span className="font-mono text-[9px] text-gray-400">{page + 1} / {Math.max(1, totalPages)}</span>
            <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
              className="px-2 py-1 border border-[#232c38] rounded text-gray-400 hover:text-gray-200 font-mono text-[9px] disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};
