import React, { useState, useEffect } from 'react';
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

  // Drill-down navigation states
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const [selectedSiloId, setSelectedSiloId] = useState<string | null>(null);

  // Visual toast message overlays
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 1. Real-time telemetry tick simulation loop
  useEffect(() => {
    if (!currentUser) return;

    const interval = setInterval(() => {
      setSilos(prevSilos => {
        const nextSilos = simulateTelemetryUpdate(prevSilos);
        
        // Dynamic alarm generation based on simulation levels
        nextSilos.forEach(silo => {
          if (silo.fillPercent <= systemConfig.notificationThresholds.criticalLevel && silo.status !== 'sensor_err') {
            // Check if alert already exists to prevent duplicate spamming
            const exists = alerts.some(a => a && a.assetId === silo.id && a.category && typeof a.category === 'string' && a.category.includes('Critical Low') && a.status === 'new');
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
  }, [currentUser, systemConfig.refreshRate, alerts]);

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
    setSilos(prev => prev.map(s => (s.id === updatedSilo.id ? updatedSilo : s)));
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
        return <UsersTab users={initialUsers} />;
      case 'settings':
        return <SettingsTab config={systemConfig} onUpdateConfig={handleUpdateConfig} />;
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
    <div className="flex h-screen bg-[#070a0e] text-[#dde3ee] overflow-hidden select-none">
      <div className="scanline" />

      {/* Primary Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setSelectedFarmId(null);
          setSelectedSiloId(null);
        }}
        currentUser={currentUser}
        onLogout={() => setCurrentUser(null)}
        unreadAlertCount={unreadAlertCount}
      />

      {/* Main Terminal Sandbox viewport */}
      <main className="flex-1 overflow-y-auto custom-scrollbar p-6 relative">
        {/* Floating cyber graticules background */}
        <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-amber-500/[0.015] rounded-full blur-3xl pointer-events-none" />
        
        {renderTabContent()}

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
