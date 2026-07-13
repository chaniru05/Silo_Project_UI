import React, { useState } from 'react';
import { User } from '../types';

interface UsersTabProps {
  users: User[];
}

interface AuditLog {
  time: string;
  user: string;
  action: string;
}

export const UsersTab: React.FC<UsersTabProps> = ({ users }) => {
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredUsers = users.filter(user => {
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesRole && matchesStatus;
  });

  const auditLogs: AuditLog[] = [
    { time: '14:52:12', user: 'Marcus Thorne', action: 'Authorized high-velocity refilling stream calibration on Silo A03.' },
    { time: '13:05:41', user: 'Elena Rodriguez', action: 'Completed physical security seal inspection at Gampaha Coastal.' },
    { time: '11:22:19', user: 'Amara Okafor', action: 'Reset Modbus address loop node 04 for Silo A04.' },
    { time: '08:15:00', user: 'Kavinda Bandara', action: 'Logged in via secure terminal at Puttalam Plains.' }
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header description */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#222a36] pb-4 text-left">
        <div>
          <h2 className="font-sans text-sm font-black text-gray-200 uppercase tracking-tight">
            Workforce Logistics &amp; Security Clearance
          </h2>
          <p className="font-mono text-[9px] text-gray-500 uppercase mt-0.5">
            Cryptographic personnel keys &bull; Active dispatcher sessions &bull; Access audits
          </p>
        </div>
        <div className="font-mono text-[9px] text-gray-400 bg-[#161f2a] border border-[#2d3748] px-2 py-0.5 rounded">
          Active Operator Seats: {users.filter(u => u.status === 'Active').length}
        </div>
      </div>

      {/* 2. Workforce KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
        <div className="glass-card border border-[#2d3748] rounded-xl p-4 bg-[#0e141b]/90">
          <span className="font-mono text-[9px] text-gray-500 uppercase block tracking-wider">
            Total Staff Profiles
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="font-sans text-2xl font-black text-gray-100">
              {users.length}
            </span>
            <span className="font-mono text-[10px] text-gray-500">Personnel authorized</span>
          </div>
        </div>

        <div className="glass-card border border-[#2d3748] rounded-xl p-4 bg-[#0e141b]/90">
          <span className="font-mono text-[9px] text-gray-500 uppercase block tracking-wider">
            Terminal Sessions Online
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="font-sans text-2xl font-black text-emerald-400">
              2 Active
            </span>
            <span className="font-mono text-[10px] text-gray-500">Terminal channels</span>
          </div>
        </div>

        <div className="glass-card border border-[#2d3748] rounded-xl p-4 bg-[#0e141b]/90">
          <span className="font-mono text-[9px] text-gray-500 uppercase block tracking-wider">
            Network Access Standard
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="font-sans text-2xl font-black text-amber-500">
              ISO-27001
            </span>
            <span className="font-mono text-[10px] text-gray-500">Security certified</span>
          </div>
        </div>
      </div>

      {/* 3. Personnel Table & Access Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
        
        {/* Personnel table (Span 2) */}
        <div className="lg:col-span-2 glass-card border border-[#2d3748] rounded-xl p-5 bg-[#0e141b]/90 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#222a36] pb-3">
            <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-gray-200">
              Authorized System Operators
            </h3>

            {/* Quick Filters */}
            <div className="flex gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-[#11171e] border border-[#232c38] focus:border-amber-500 focus:outline-none rounded px-2 py-0.5 font-mono text-[9px] text-gray-300"
              >
                <option value="all">ALL ROLES</option>
                <option value="Super Admin">SUPER ADMIN</option>
                <option value="Facility Manager">FACILITY MGR</option>
                <option value="Technician">FIELD TECH</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left font-mono text-[10px] border-collapse">
              <thead>
                <tr className="border-b border-[#222a36] text-gray-500">
                  <th className="py-2 font-bold uppercase">Staff Member</th>
                  <th className="py-2 font-bold uppercase">Authorized Hub Assignment</th>
                  <th className="py-2 font-bold uppercase">Access Level</th>
                  <th className="py-2 font-bold uppercase">Terminal Status</th>
                </tr>
              </thead>
              <tbody className="text-gray-300 divide-y divide-[#1b222c]">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-[#151c24] transition-colors">
                    <td className="py-3 flex items-center gap-2.5">
                      <img
                        src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80'}
                        alt={user.name}
                        referrerPolicy="no-referrer"
                        className="w-7 h-7 rounded-full object-cover border border-[#2d3748]"
                      />
                      <div>
                        <strong className="font-sans text-[11px] text-gray-200 block">{user.name}</strong>
                        <span className="text-[8px] text-gray-500 block lowercase">{user.email}</span>
                      </div>
                    </td>
                    <td className="py-3 text-gray-200">{user.assignment}</td>
                    <td className="py-3">
                      <span className={`px-1 rounded text-[8px] font-extrabold border uppercase ${
                        user.role === 'Super Admin' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                        user.role === 'Facility Manager' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                        'bg-gray-500/10 text-gray-400 border-gray-500/20'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-gray-200">{user.lastLogin}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Access audit ledger (Span 1) */}
        <div className="glass-card border border-[#2d3748] rounded-xl p-5 bg-[#0e141b]/90 flex flex-col justify-between">
          <div>
            <div className="border-b border-[#222a36] pb-3 mb-4">
              <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-gray-200">
                Personnel Access Audits
              </h3>
            </div>

            <div className="space-y-3.5 max-h-80 overflow-y-auto custom-scrollbar font-mono text-[9px] text-left">
              {auditLogs.map((log, index) => (
                <div key={index} className="space-y-1 py-1.5 border-b border-[#1b222c] last:border-none">
                  <div className="flex justify-between text-gray-500 font-semibold">
                    <span>{log.user}</span>
                    <span>{log.time}</span>
                  </div>
                  <p className="text-gray-300 leading-normal">
                    {log.action}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#1a212b] font-mono text-[8px] text-gray-600 text-center uppercase tracking-wider mt-4">
            Security logs are encrypted &amp; mirrored to Colombo Core
          </div>
        </div>

      </div>
    </div>
  );
};
