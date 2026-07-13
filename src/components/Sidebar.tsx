import React from 'react';
import { User } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User | null;
  onLogout: () => void;
  unreadAlertCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onLogout,
  unreadAlertCount
}) => {
  const menuItems = [
    { id: 'overview', label: 'Overview', icon: 'dashboard' },
    { id: 'farms', label: 'Mission Control', icon: 'satellite_alt' },
    { id: 'silos', label: 'Silo Telemetry', icon: 'storage' },
    { id: 'analysis', label: 'Enterprise Analysis', icon: 'analytics' },
    {
      id: 'alerts',
      label: 'Alerts Logs',
      icon: 'notifications_active',
      badge: unreadAlertCount > 0 ? unreadAlertCount : undefined
    },
    { id: 'users', label: 'Workforce', icon: 'group' },
    { id: 'settings', label: 'Settings', icon: 'settings' }
  ];

  return (
    <aside className="w-64 bg-[#0d1218] border-r border-[#222a36] flex flex-col justify-between h-screen sticky top-0 shrink-0">
      {/* Brand Launcher Logo Header */}
      <div>
        <div className="px-6 py-5 border-b border-[#222a36] flex items-center gap-3 bg-[#0a0e12]">
          <div className="w-9 h-9 rounded bg-amber-500 flex items-center justify-center font-black text-black shadow-[0_0_12px_rgba(245,166,35,0.4)]">
            AA
          </div>
          <div>
            <h1 className="font-sans text-sm font-black tracking-tight text-white leading-none">
              APEX AVIAN
            </h1>
            <span className="font-mono text-[9px] text-amber-500 font-bold uppercase tracking-widest block mt-1">
              Industrial Feed
            </span>
          </div>
        </div>

        {/* Navigation Actions Menu */}
        <nav className="p-4 space-y-1">
          {menuItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-link-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-left transition-all duration-150 group cursor-pointer ${
                  isActive
                    ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400 font-medium'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-[#1a212a] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`material-symbols-outlined text-xl transition-transform duration-150 group-hover:scale-105 ${
                      isActive ? 'text-amber-500' : 'text-gray-500'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="font-sans text-xs tracking-wide">
                    {item.label}
                  </span>
                </div>

                {item.badge !== undefined && (
                  <span className="bg-red-500 text-white font-mono text-[9px] font-extrabold px-1.5 py-0.5 rounded-full min-w-[14px] text-center animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Session Footer Card */}
      <div className="p-4 border-t border-[#222a36] bg-[#0a0e12]">
        {currentUser && (
          <div className="flex items-center gap-3 mb-3">
            <img
              src={currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80'}
              alt={currentUser.name}
              referrerPolicy="no-referrer"
              className="w-9 h-9 rounded-full object-cover border border-[#2d3748]"
            />
            <div className="overflow-hidden">
              <h4 className="font-sans text-xs font-bold text-gray-200 truncate leading-tight">
                {currentUser.name}
              </h4>
              <p className="font-mono text-[9px] text-gray-500 uppercase truncate leading-none mt-0.5">
                {currentUser.role}
              </p>
            </div>
          </div>
        )}

        {/* System Connectivity State */}
        <div className="flex items-center justify-between text-[9px] font-mono text-gray-500 mb-4 px-1">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="uppercase">Link: SECURE</span>
          </div>
          <span>v2.8.1-BETA</span>
        </div>

        {/* Logout Control */}
        <button
          onClick={onLogout}
          className="w-full py-1.5 border border-[#2e3745] hover:border-red-500/50 hover:text-red-400 text-gray-400 rounded text-[10px] font-mono uppercase tracking-wider transition-colors duration-150 cursor-pointer"
        >
          Disconnect Terminal
        </button>
      </div>
    </aside>
  );
};
