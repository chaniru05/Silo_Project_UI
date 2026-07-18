import React, { useState, useEffect, useRef } from 'react';
import { User, Farm, Silo, Alert, MaintenanceTask, SystemConfig } from './types';
import { Sidebar } from './components/Sidebar';
import { LoginScreen } from './components/LoginScreen';
import { OverviewTab } from './components/OverviewTab';
import { FarmsTab } from './components/FarmsTab';
import { FarmDetailView } from './components/FarmDetailView';
import { SilosTab } from './components/SilosTab';
import { SiloDetailView } from './components/SiloDetailView';
import { AnalysisTab } from './components/AnalysisTab';
import { AlertsTab } from './components/AlertsTab';
import { UsersTab } from './components/UsersTab';
import { SettingsTab } from './components/SettingsTab';
import { ManagementTab } from './components/ManagementTab';
import { LogSearchModal } from './components/LogSearchModal';
import { ProfileModal } from './components/ProfileModal';

import {
  initialFarms,
  initialSilos,
  initialAlerts,
  initialUsers,
  initialMaintenanceTasks,
  initialSystemConfig,
  simulateTelemetryUpdate
} from './data/mockData';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Core application state
  const [farms, setFarms] = useState<Farm[]>(initialFarms);
  const [silos, setSilos] = useState<Silo[]>(initialSilos);
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>(initialMaintenanceTasks);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>(initialSystemConfig);
  const [users, setUsers] = useState<User[]>(initialUsers);

  // Theme support
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('apex_theme') as 'light' | 'dark') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('apex_theme', theme);
    const body = document.body;
    if (theme === 'light') {
      body.classList.add('light-theme');
    } else {
      body.classList.remove('light-theme');
    }
  }, [theme]);

  // Drill-down navigation states
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const [selectedSiloId, setSelectedSiloId] = useState<string | null>(null);

  // Visual toast message overlays
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showLogSearch, setShowLogSearch] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Mobile sidebar state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // 1. Real-time telemetry tick simulation loop
  const alertsRef = useRef(alerts);
  alertsRef.current = alerts;

  useEffect(() => {
    if (!currentUser) return;

    const interval = setInterval(() => {
      setSilos(prevSilos => {
        const nextSilos = simulateTelemetryUpdate(prevSilos);
        const currentAlerts = alertsRef.current;

        // Dynamic alarm generation based on simulation levels
        nextSilos.forEach(silo => {
          if (silo.fillPercent <= systemConfig.notificationThresholds.criticalLevel && silo.status !== 'sensor_err') {
            // Check if alert already exists to prevent duplicate spamming
            const exists = currentAlerts.some(a => a && a.assetId === silo.id && a.category && typeof a.category === 'string' && a.category.includes('Critical Low') && a.status === 'new');
            if (!exists) {
              const newAlert: Alert = {
                id: `ALT-${Math.floor(100 + Math.random() * 900)}`,
                severity: 'critical',
                timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
                assetId: silo.id,
                category: 'Critical Low Level Threshold',
                description: `Emergency warning: Silo ${silo.id} stock is critically depleted at ${silo.fillPercent}%. Immediate milling refilling is mandatory.`,
                status: 'new'
              };
              setAlerts(prevAlerts => [newAlert, ...prevAlerts]);
              triggerToast(`CRITICAL: Silo ${silo.id} depleted!`);
            }
          }
        });

        return nextSilos;
      });
    }, systemConfig.refreshRate * 1000);

    return () => clearInterval(interval);
  }, [currentUser, systemConfig.refreshRate]);

  // Toast trigger utility
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 2. Action Handlers
  const handleAcknowledgeAlert = (alertId: string) => {
    setAlerts(prev =>
      prev.map(a => (a.id === alertId ? { ...a, status: 'acknowledged' as const } : a))
    );
    triggerToast(`Acknowledged Alert ID ${alertId}`);
  };

  const handleDispatchTech = (alertId: string, assetId: string, description: string) => {
    // Acknowledge the alert
    setAlerts(prev =>
      prev.map(a => (a.id === alertId ? { ...a, status: 'resolved' as const } : a))
    );

    // Append a new maintenance work order
    const newTask: MaintenanceTask = {
      id: `TSK-${Math.floor(200 + Math.random() * 800)}`,
      assetId,
      description,
      priority: 'URGENT',
      assignedTo: 'Kavinda Bandara',
      status: 'pending'
    };

    setMaintenanceTasks(prev => [newTask, ...prev]);
    triggerToast(`DISPATCHED: Eng. Kavinda Bandara routed to ${assetId}`);
  };

  const handleUpdateSilo = (updatedSilo: Silo) => {
    setSilos(prevSilos => {
      const nextSilos = prevSilos.map(s => s.id === updatedSilo.id ? updatedSilo : s);
      setFarms(prevFarms => syncFarmsWithSilos(prevFarms, nextSilos));
      return nextSilos;
    });
  };

  const handleUpdateProfile = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    setCurrentUser(updatedUser);
  };

  // Synchronize and update a farm's dynamic properties (siloCount, capacity, utilization) based on silos
  const syncFarmsWithSilos = (currentFarms: Farm[], currentSilos: Silo[]): Farm[] => {
    return currentFarms.map(farm => {
      const farmSilos = currentSilos.filter(s => s.farmId === farm.id);
      const siloCount = farmSilos.length;
      const totalCapacity = farmSilos.reduce((sum, s) => sum + s.capacity, 0);
      const totalWeight = farmSilos.reduce((sum, s) => sum + s.currentWeight, 0);
      const utilization = totalCapacity > 0 ? Number(((totalWeight / totalCapacity) * 100).toFixed(1)) : 0;
      
      return {
        ...farm,
        siloCount,
        capacity: totalCapacity,
        utilization
      };
    });
  };

  const handleAddSilo = (newSilo: Silo) => {
    setSilos(prevSilos => {
      const nextSilos = [newSilo, ...prevSilos];
      setFarms(prevFarms => syncFarmsWithSilos(prevFarms, nextSilos));
      return nextSilos;
    });
    triggerToast(`PROVISIONED: Silo ${newSilo.id} added.`);
  };

  const handleUpdateSiloFromMgmt = (updatedSilo: Silo) => {
    setSilos(prevSilos => {
      const nextSilos = prevSilos.map(s => s.id === updatedSilo.id ? updatedSilo : s);
      setFarms(prevFarms => syncFarmsWithSilos(prevFarms, nextSilos));
      return nextSilos;
    });
    triggerToast(`UPDATED: Silo ${updatedSilo.id} specifications saved.`);
  };

  const handleDeleteSilo = (siloId: string) => {
    setSilos(prevSilos => {
      const nextSilos = prevSilos.filter(s => s.id !== siloId);
      setFarms(prevFarms => syncFarmsWithSilos(prevFarms, nextSilos));
      return nextSilos;
    });
    triggerToast(`DECOMMISSIONED: Silo ${siloId} removed.`);
  };

  const handleAddFarm = (newFarm: Farm) => {
    setFarms(prev => [newFarm, ...prev]);
    triggerToast(`ESTABLISHED: Farm branch ${newFarm.name} added.`);
  };

  const handleUpdateFarm = (updatedFarm: Farm) => {
    setFarms(prev => prev.map(f => f.id === updatedFarm.id ? { ...f, ...updatedFarm } : f));
    triggerToast(`UPDATED: Farm branch ${updatedFarm.name} specifications saved.`);
  };

  const handleDeleteFarm = (farmId: string) => {
    setFarms(prev => prev.filter(f => f.id !== farmId));
    triggerToast(`REVOKED: Farm branch ${farmId} removed.`);
  };

  const handleAddUser = (newUser: User) => {
    setUsers(prev => [newUser, ...prev]);
    triggerToast(`AUTHORIZED: User ${newUser.name} created.`);
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    if (currentUser && currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
    triggerToast(`UPDATED: User ${updatedUser.name} permissions saved.`);
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    triggerToast(`REVOKED: User ${userId} access removed.`);
  };

  const handleUpdateConfig = (updatedConfig: SystemConfig) => {
    setSystemConfig(updatedConfig);
    triggerToast('CONFIGURATION SAVED: System values committed.');
  };

  const unreadAlertCount = alerts.filter(a => a.status === 'new').length;

  // Render components dynamically based on routing selections
  const renderTabContent = () => {
    if (selectedSiloId) {
      const activeSilo = silos.find(s => s.id === selectedSiloId);
      const parentFarm = activeSilo ? farms.find(f => f.id === activeSilo.farmId) : undefined;
      if (activeSilo) {
        return (
          <SiloDetailView
            silo={activeSilo}
            farm={parentFarm}
            onBack={() => setSelectedSiloId(null)}
            onUpdateSilo={handleUpdateSilo}
          />
        );
      }
    }

    if (selectedFarmId) {
      const activeFarm = farms.find(f => f.id === selectedFarmId);
      if (activeFarm) {
        return (
          <FarmDetailView
            farm={activeFarm}
            silos={silos}
            maintenanceTasks={maintenanceTasks}
            onBack={() => setSelectedFarmId(null)}
            onSelectSilo={(siloId) => setSelectedSiloId(siloId)}
          />
        );
      }
    }

    switch (activeTab) {
      case 'overview':
        return (
          <OverviewTab
            farms={farms}
            silos={silos}
            alerts={alerts}
            onSelectSilo={(siloId) => setSelectedSiloId(siloId)}
            onNavigateToTab={(tabId) => {
              setActiveTab(tabId);
              setSelectedFarmId(null);
              setSelectedSiloId(null);
            }}
          />
        );
      case 'farms':
        return (
          <FarmsTab
            farms={farms}
            silos={silos}
            onSelectFarm={(farmId) => setSelectedFarmId(farmId)}
            selectedFarmId={selectedFarmId || undefined}
          />
        );
      case 'silos':
        return (
          <SilosTab
            silos={silos}
            farms={farms}
            onSelectSilo={(siloId) => setSelectedSiloId(siloId)}
          />
        );
      case 'analysis':
        return <AnalysisTab farms={farms} silos={silos} />;
      case 'alerts':
        return (
          <AlertsTab
            alerts={alerts}
            onAcknowledge={handleAcknowledgeAlert}
            onDispatchTech={handleDispatchTech}
          />
        );
      case 'users':
        return <UsersTab users={users} />;
      case 'management':
        if (currentUser?.role !== 'Super Admin') {
          return (
            <div className="py-20 text-center font-mono text-red-500 font-bold uppercase tracking-widest">
              ACCESS DENIED. HIGH CLEARANCE SECURE LOG REQUIRED.
            </div>
          );
        }
        return (
          <ManagementTab
            farms={farms}
            silos={silos}
            users={users}
            onAddSilo={handleAddSilo}
            onUpdateSilo={handleUpdateSiloFromMgmt}
            onDeleteSilo={handleDeleteSilo}
            onAddFarm={handleAddFarm}
            onUpdateFarm={handleUpdateFarm}
            onDeleteFarm={handleDeleteFarm}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
          />
        );
      case 'settings':
        return (
          <SettingsTab
            config={systemConfig}
            onUpdateConfig={handleUpdateConfig}
            theme={theme}
            onUpdateTheme={setTheme}
          />
        );
      default:
        return (
          <div className="py-20 text-center font-mono text-gray-500">
            TAB CONTEXT CORRUPTED. RE-ESTABLISHING SYNC GATEWAY...
          </div>
        );
    }
  };

  // 3. User Authentication Guard
  if (!currentUser) {
    return <LoginScreen onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  return (
    <div className="flex h-screen bg-[#070a0e] text-[#dde3ee] select-none">
      <div className="scanline" />

      {/* Mobile sidebar overlay */}
      <div className={`sidebar-overlay ${mobileSidebarOpen ? 'open' : ''}`} onClick={() => setMobileSidebarOpen(false)} />

      {/* Primary Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setSelectedFarmId(null);
          setSelectedSiloId(null);
          setMobileSidebarOpen(false);
        }}
        currentUser={currentUser}
        onLogout={() => setCurrentUser(null)}
        unreadAlertCount={unreadAlertCount}
        onLogSearch={() => setShowLogSearch(true)}
        onProfileSettings={() => setShowProfileModal(true)}
        theme={theme}
        onThemeToggle={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
        mobileOpen={mobileSidebarOpen}
        onToggleMobile={() => setMobileSidebarOpen(prev => !prev)}
      />

      {/* Mobile hamburger toggle — top-left of main content, only when sidebar closed */}
      {!mobileSidebarOpen && (
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-30 w-10 h-10 bg-[#0d1218] border border-[#222a36] rounded-lg flex items-center justify-center cursor-pointer hover:bg-[#1a212a] transition-colors shadow-lg"
          aria-label="Open sidebar"
        >
          <span className="material-symbols-outlined text-gray-400 text-xl">menu</span>
        </button>
      )}

      {/* Main Terminal Sandbox viewport */}
      <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 pt-14 sm:pt-6 relative min-w-0">
        {/* Floating cyber graticules background */}
        <div className="absolute top-0 right-0 w-[200px] sm:w-[350px] lg:w-[450px] h-[200px] sm:h-[350px] lg:h-[450px] bg-amber-500/[0.015] rounded-full blur-3xl pointer-events-none" />
        
        {renderTabContent()}

        {showLogSearch && (
          <LogSearchModal silos={silos} farms={farms} onClose={() => setShowLogSearch(false)} />
        )}

        {showProfileModal && currentUser && (
          <ProfileModal user={currentUser} onClose={() => setShowProfileModal(false)} onUpdateUser={handleUpdateProfile} />
        )}

        {/* Global Floating Toast HUD notifications overlay */}
        {toastMessage && (
          <div className="fixed z-50 bottom-6 right-6 bg-[#0c1015] border border-amber-500/50 p-4 rounded-lg shadow-[0_8px_30px_rgba(0,0,0,0.6)] flex items-center gap-3 animate-fade-in max-w-sm">
            <span className="material-symbols-outlined text-amber-500 text-xl animate-pulse">
              notifications_active
            </span>
            <div className="text-left font-mono text-[10px]">
              <span className="text-amber-500 font-black block uppercase">HUD NOTIFICATION</span>
              <span className="text-gray-200 mt-0.5 block leading-normal">{toastMessage}</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
