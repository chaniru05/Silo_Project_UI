import React, { useState } from 'react';
import { Alert } from '../types';

interface AlertsTabProps {
  alerts: Alert[];
  onAcknowledge: (alertId: string) => void;
  onDispatchTech: (alertId: string, assetId: string, description: string) => void;
}

export const AlertsTab: React.FC<AlertsTabProps> = ({
  alerts,
  onAcknowledge,
  onDispatchTech
}) => {
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredAlerts = alerts.filter(alert => {
    const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter;
    const matchesStatus = statusFilter === 'all' || alert.status === statusFilter;
    return matchesSeverity && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#222a36] pb-4 text-left">
        <div>
          <h2 className="font-sans text-sm font-black text-gray-200 uppercase tracking-tight">
            Security Incident Command Log
          </h2>
          <p className="font-mono text-[9px] text-gray-500 uppercase mt-0.5">
            RS485 CRC packet analyzer &bull; Structural weight warning handlers &bull; Telemetry audits
          </p>
        </div>
        <div className="font-mono text-[9px] text-gray-400 bg-[#161f2a] border border-[#2d3748] px-2 py-0.5 rounded">
          Active Incidents: {alerts.filter(a => a.status === 'new').length}
        </div>
      </div>

      {/* 2. Log Filters Dashboard */}
      <div className="glass-card border border-[#2d3748] rounded-xl p-4 bg-[#0e141b]/95 text-left flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[9px] text-gray-500 uppercase">Severity Class:</span>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-[#11171e] border border-[#232c38] focus:border-amber-500 focus:outline-none rounded px-2.5 py-1 font-mono text-[10px] text-gray-300"
          >
            <option value="all">ALL CLASSIFICATIONS</option>
            <option value="critical">CRITICAL ALARM</option>
            <option value="warning">WARNING ADVISORY</option>
            <option value="info">SYSTEM INFORMATIONAL</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[9px] text-gray-500 uppercase">Operational Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#11171e] border border-[#232c38] focus:border-amber-500 focus:outline-none rounded px-2.5 py-1 font-mono text-[10px] text-gray-300"
          >
            <option value="all">ALL DISPOSITION STATES</option>
            <option value="new">NEW / ACTIVE</option>
            <option value="acknowledged">ACKNOWLEDGED STAGE</option>
            <option value="resolved">RESOLVED / DISPATCHED</option>
          </select>
        </div>
      </div>

      {/* 3. Incidents Ledger Cards */}
      <div className="space-y-4 text-left">
        {filteredAlerts.length === 0 ? (
          <div className="glass-card border border-[#222a36] py-16 text-center text-gray-500 font-mono text-xs">
            ✕ NO SYSTEMIC ANOMALIES DISCOVERED MATCHING CHOSEN CRITERIA
          </div>
        ) : (
          filteredAlerts.map(alert => {
            let containerStyle = 'border-[#2d3748] bg-[#0e141b]/95';
            let statusBadge = 'bg-gray-500/10 text-gray-400 border border-gray-500/20';

            if (alert.status === 'new') {
              if (alert.severity === 'critical') {
                containerStyle = 'border-red-500/30 bg-red-950/5 animate-critical-border';
                statusBadge = 'bg-red-500/15 text-red-400 border border-red-500/30 animate-pulse';
              } else {
                containerStyle = 'border-amber-500/30 bg-amber-950/5';
                statusBadge = 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
              }
            } else if (alert.status === 'acknowledged') {
              containerStyle = 'border-amber-500/10 bg-[#0e141b]/95';
              statusBadge = 'bg-amber-500/10 text-amber-400 border border-amber-500/15';
            } else if (alert.status === 'resolved') {
              containerStyle = 'border-emerald-500/10 bg-[#0e141b]/95 opacity-60';
              statusBadge = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15';
            }

            return (
              <div
                key={alert.id}
                className={`glass-card border rounded-xl p-5 flex flex-col justify-between gap-4 transition-all group ${containerStyle}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#222a36] pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className={`material-symbols-outlined text-lg ${
                      alert.severity === 'critical' ? 'text-red-400' : 'text-amber-400'
                    }`}>
                      {alert.severity === 'critical' ? 'warning' : 'gavel'}
                    </span>
                    <div>
                      <h4 className="font-sans text-xs font-black text-gray-100 uppercase">
                        {alert.category}
                      </h4>
                      <p className="font-mono text-[9px] text-gray-500 uppercase mt-0.5">
                        Incident Code: {alert.id} &bull; Target Column: <strong className="text-amber-500">{alert.assetId}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-[9px] text-gray-500">
                      {alert.timestamp}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-extrabold uppercase ${statusBadge}`}>
                      {alert.status}
                    </span>
                  </div>
                </div>

                <p className="font-mono text-[10px] text-gray-300 leading-relaxed">
                  {alert.description}
                </p>

                {/* Inline Action HUD for Active Warnings */}
                {alert.status === 'new' && (
                  <div className="pt-3 border-t border-[#1a212b] flex items-center justify-end gap-2.5">
                    <button
                      onClick={() => onAcknowledge(alert.id)}
                      className="px-3 py-1 bg-[#17202a] hover:bg-amber-500/10 border border-[#2d3a4b] hover:border-amber-500/30 text-amber-400 font-mono font-bold uppercase text-[9px] tracking-wide rounded transition-all cursor-pointer"
                    >
                      Acknowledge Alarm
                    </button>
                    {alert.severity === 'critical' && (
                      <button
                        onClick={() => onDispatchTech(
                          alert.id,
                          alert.assetId,
                          `Emergency repairs triggered by alert ${alert.id}: ${alert.category}`
                        )}
                        className="px-3 py-1 bg-red-500 hover:bg-red-400 border border-transparent text-black font-mono font-bold uppercase text-[9px] tracking-wide rounded transition-all cursor-pointer"
                      >
                        Dispatch Field Tech
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
