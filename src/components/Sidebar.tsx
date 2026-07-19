import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User | null;
  onLogout: () => void;
  unreadAlertCount: number;
  onLogSearch?: () => void;
  onProfileSettings?: () => void;
  theme?: 'light' | 'dark';
  onThemeToggle?: () => void;
  mobileOpen?: boolean;
  onToggleMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onLogout,
  unreadAlertCount,
  onLogSearch,
  onProfileSettings,
  theme,
  onThemeToggle,
  mobileOpen,
  onToggleMobile
}) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

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
    ...(currentUser?.role === 'Super Admin' ? [
      { id: 'management', label: 'Management', icon: 'gavel' }
    ] : []),
    { id: 'settings', label: 'Settings', icon: 'settings' },
    { id: 'logsearch', label: 'Log Search', icon: 'search' }
  ];

  const profileMenuItems = [
    {
      label: 'Profile Settings',
      icon: 'manage_accounts',
      action: () => { setProfileOpen(false); onProfileSettings?.(); }
    },
    {
      label: theme === 'light' ? 'Dark Theme' : 'Light Theme',
      icon: theme === 'light' ? 'dark_mode' : 'light_mode',
      action: () => { onThemeToggle?.(); setProfileOpen(false); }
    },
    { type: 'divider' as const },
    {
      label: 'Sign Out',
      icon: 'logout',
      action: () => { setProfileOpen(false); onLogout(); },
      danger: true
    }
  ];

  return (
    <aside className={`sidebar-panel w-64 bg-[#0d1218] border-r border-[#222a36] flex flex-col justify-between h-screen sticky top-0 shrink-0 ${mobileOpen ? 'open' : ''}`}>
      {/* Brand Launcher Logo Header */}
      <div>
        <div className="px-4 sm:px-6 py-5 border-b border-[#222a36] flex items-center gap-3 bg-[#0a0e12]">
          {/* Close button inside sidebar header — mobile only */}
          <button
            onClick={onToggleMobile}
            className="lg:hidden w-8 h-8 bg-[#18202b] border border-[#2d3748] rounded-lg flex items-center justify-center cursor-pointer hover:bg-[#232f3d] transition-colors shrink-0"
            aria-label="Close sidebar"
          >
            <span className="material-symbols-outlined text-gray-400 text-lg">close</span>
          </button>
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
                onClick={() => item.id === 'logsearch' ? onLogSearch?.() : setActiveTab(item.id)}
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
      <div className="relative" ref={menuRef}>
        <div className="p-4 border-t border-[#222a36] bg-[#0a0e12]">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="w-full flex items-center gap-3 mb-3 cursor-pointer text-left group"
          >
            <div className="relative shrink-0">
              <img
                src={currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80'}
                alt={currentUser?.name || 'User'}
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-full object-cover border border-[#2d3748] group-hover:border-amber-500/50 transition-colors"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#0a0e12] rounded-full" />
            </div>
            <div className="overflow-hidden flex-1">
              <h4 className="font-sans text-xs font-bold text-gray-200 truncate leading-tight group-hover:text-amber-400 transition-colors">
                {currentUser?.name || 'Unknown'}
              </h4>
              <p className="font-mono text-[9px] text-gray-500 uppercase truncate leading-none mt-0.5">
                {currentUser?.role || 'N/A'}
              </p>
            </div>
            <span className={`material-symbols-outlined text-gray-500 text-base transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`}>
              expand_less
            </span>
          </button>

          {/* System Connectivity State */}
          <div className="flex items-center justify-between text-[9px] font-mono text-gray-500 px-1">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="uppercase">Link: SECURE</span>
            </div>
            <span>v2.8.1-BETA</span>
          </div>
          <div className="text-center font-mono text-[7px] text-gray-600 mt-3 px-1">
            Developed by Team Zynthera
          </div>
        </div>

        {/* Profile Dropdown Menu */}
        {profileOpen && (
          <div className="absolute bottom-full left-2 right-2 mb-1 bg-[#0f151c] border border-[#222a36] rounded-lg shadow-[0_-8px_25px_rgba(0,0,0,0.5)] overflow-hidden z-50">
            {profileMenuItems.map((item, i) => {
              if ('type' in item && item.type === 'divider') {
                return <div key={i} className="h-px bg-[#222a36] mx-2" />;
              }
              const menuItem = item as { label: string; icon: string; action: () => void; danger?: boolean };
              return (
                <button
                  key={i}
                  onClick={menuItem.action}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition-colors duration-100 cursor-pointer ${
                    menuItem.danger
                      ? 'text-red-400 hover:bg-red-500/10'
                      : 'text-gray-300 hover:bg-[#1a212a] hover:text-gray-100'
                  }`}
                >
                  <span className={`material-symbols-outlined text-lg ${menuItem.danger ? 'text-red-400' : 'text-gray-500'}`}>
                    {menuItem.icon}
                  </span>
                  <span className="font-sans text-[10px] tracking-wide">{menuItem.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
};
