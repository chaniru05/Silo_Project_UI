import React, { useState } from 'react';
import { Farm, Silo, User } from '../types';

interface ManagementTabProps {
  farms: Farm[];
  silos: Silo[];
  users: User[];
  onAddSilo: (silo: Silo) => void;
  onUpdateSilo: (silo: Silo) => void;
  onDeleteSilo: (id: string) => void;
  onAddFarm: (farm: Farm) => void;
  onUpdateFarm: (farm: Farm) => void;
  onDeleteFarm: (id: string) => void;
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
}

type SubTab = 'silos' | 'farms' | 'users';

export const ManagementTab: React.FC<ManagementTabProps> = ({
  farms,
  silos,
  users,
  onAddSilo,
  onUpdateSilo,
  onDeleteSilo,
  onAddFarm,
  onUpdateFarm,
  onDeleteFarm,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('silos');

  // Silo states
  const [isSiloFormOpen, setIsSiloFormOpen] = useState(false);
  const [editingSilo, setEditingSilo] = useState<Silo | null>(null);
  const [siloId, setSiloId] = useState('');
  const [siloFarmId, setSiloFarmId] = useState('');
  const [siloName, setSiloName] = useState('');
  const [siloType, setSiloType] = useState('Starter Feed');
  const [siloCapacity, setSiloCapacity] = useState(35000);
  const [siloCurrentWeight, setSiloCurrentWeight] = useState(15000);
  const [siloStatus, setSiloStatus] = useState<Silo['status']>('stable');

  // Farm states
  const [isFarmFormOpen, setIsFarmFormOpen] = useState(false);
  const [editingFarm, setEditingFarm] = useState<Farm | null>(null);
  const [farmIdState, setFarmIdState] = useState('');
  const [farmName, setFarmName] = useState('');
  const [farmProvince, setFarmProvince] = useState('');
  const [farmManager, setFarmManager] = useState('');
  const [farmStatus, setFarmStatus] = useState<Farm['status']>('operational');
  const [farmCoordTop, setFarmCoordTop] = useState('50%');
  const [farmCoordLeft, setFarmCoordLeft] = useState('50%');
  const [farmLat, setFarmLat] = useState('7.5000');
  const [farmLng, setFarmLng] = useState('80.3000');

  // User states
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState<User['role']>('Technician');
  const [userAssignment, setUserAssignment] = useState('');
  const [userStatus, setUserStatus] = useState<User['status']>('Active');

  // Form togglers & resetters
  const openAddSilo = () => {
    setEditingSilo(null);
    setSiloId(`SILO-${Math.floor(100 + Math.random() * 900)}`);
    setSiloFarmId(farms[0]?.id || '');
    setSiloName('');
    setSiloType('Starter Feed');
    setSiloCapacity(35000);
    setSiloCurrentWeight(15000);
    setSiloStatus('stable');
    setIsSiloFormOpen(true);
  };

  const openEditSilo = (silo: Silo) => {
    setEditingSilo(silo);
    setSiloId(silo.id);
    setSiloFarmId(silo.farmId);
    setSiloName(silo.name);
    setSiloType(silo.type);
    setSiloCapacity(silo.capacity);
    setSiloCurrentWeight(silo.currentWeight);
    setSiloStatus(silo.status);
    setIsSiloFormOpen(true);
  };

  const submitSiloForm = (e: React.FormEvent) => {
    e.preventDefault();
    const fillPercent = Number(((siloCurrentWeight / siloCapacity) * 100).toFixed(1));
    const finalSilo: Silo = {
      id: siloId,
      farmId: siloFarmId,
      name: siloName || `Silo ${siloId}`,
      type: siloType,
      capacity: Number(siloCapacity),
      currentWeight: Number(siloCurrentWeight),
      flowRate: editingSilo ? editingSilo.flowRate : 0,
      status: siloStatus,
      fillPercent,
      lastUpdate: 'Just now'
    };

    if (editingSilo) {
      onUpdateSilo(finalSilo);
    } else {
      onAddSilo(finalSilo);
    }
    setIsSiloFormOpen(false);
  };

  const openAddFarm = () => {
    setEditingFarm(null);
    setFarmIdState(`FARM-${Math.floor(100 + Math.random() * 900)}`);
    setFarmName('');
    setFarmProvince('Western Province');
    setFarmManager('');
    setFarmStatus('operational');
    setFarmCoordTop(`${Math.floor(20 + Math.random() * 60)}%`);
    setFarmCoordLeft(`${Math.floor(20 + Math.random() * 60)}%`);
    setFarmLat('7.5000');
    setFarmLng('80.3000');
    setIsFarmFormOpen(true);
  };

  const openEditFarm = (farm: Farm) => {
    setEditingFarm(farm);
    setFarmIdState(farm.id);
    setFarmName(farm.name);
    setFarmProvince(farm.province);
    setFarmManager(farm.manager);
    setFarmStatus(farm.status);
    setFarmCoordTop(farm.coords.top);
    setFarmCoordLeft(farm.coords.left);
    setFarmLat(farm.coords.lat?.toString() || '7.5000');
    setFarmLng(farm.coords.lng?.toString() || '80.3000');
    setIsFarmFormOpen(true);
  };

  const submitFarmForm = (e: React.FormEvent) => {
    e.preventDefault();
    const finalFarm: Farm = {
      id: farmIdState,
      name: farmName || `Farm ${farmIdState}`,
      province: farmProvince,
      siloCount: editingFarm ? editingFarm.siloCount : 0,
      capacity: editingFarm ? editingFarm.capacity : 0,
      utilization: editingFarm ? editingFarm.utilization : 0,
      status: farmStatus,
      coords: { top: farmCoordTop, left: farmCoordLeft, lat: parseFloat(farmLat) || 7.5, lng: parseFloat(farmLng) || 80.3 },
      manager: farmManager || 'Unassigned',
      lastInspection: new Date().toISOString().substring(0, 10)
    };

    if (editingFarm) {
      onUpdateFarm(finalFarm);
    } else {
      onAddFarm(finalFarm);
    }
    setIsFarmFormOpen(false);
  };

  const openAddUser = () => {
    setEditingUser(null);
    setUserId(`USR-${Math.floor(10 + Math.random() * 90)}`);
    setUserName('');
    setUserEmail('');
    setUserRole('Technician');
    setUserAssignment('');
    setUserStatus('Active');
    setIsUserFormOpen(true);
  };

  const openEditUser = (user: User) => {
    setEditingUser(user);
    setUserId(user.id);
    setUserName(user.name);
    setUserEmail(user.email);
    setUserRole(user.role);
    setUserAssignment(user.assignment);
    setUserStatus(user.status);
    setIsUserFormOpen(true);
  };

  const submitUserForm = (e: React.FormEvent) => {
    e.preventDefault();
    const finalUser: User = {
      id: userId,
      name: userName,
      email: userEmail,
      role: userRole,
      assignment: userAssignment || 'General Grid Operations',
      lastLogin: editingUser ? editingUser.lastLogin : 'Never',
      status: userStatus,
      avatar: editingUser?.avatar || `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 100000)}?w=150&auto=format&fit=crop&q=80`
    };

    if (editingUser) {
      onUpdateUser(finalUser);
    } else {
      onAddUser(finalUser);
    }
    setIsUserFormOpen(false);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Tab Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#222a36] pb-4">
        <div>
          <h2 className="font-sans text-sm font-black text-gray-200 uppercase tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-500">gavel</span>
            Central Management &amp; Resource Provisioning Hub
          </h2>
          <p className="font-mono text-[9px] text-gray-500 uppercase mt-0.5">
            Create, update, or revoke physical silos, regional farm hubs, and personnel permissions.
          </p>
        </div>
        <div className="font-mono text-[9px] text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded uppercase font-bold animate-pulse">
          SUPER ADMIN SECURE ROUTE
        </div>
      </div>

      {/* Internal Management Tabs Switcher */}
      <div className="flex border-b border-[#222a36] gap-2">
        <button
          onClick={() => { setActiveSubTab('silos'); setIsSiloFormOpen(false); }}
          className={`px-4 py-2 font-mono text-[10px] font-bold uppercase transition-all tracking-wide flex items-center gap-1.5 border-b-2 cursor-pointer ${
            activeSubTab === 'silos'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          <span className="material-symbols-outlined text-sm">storage</span>
          Silo Nodes ({silos.length})
        </button>
        <button
          onClick={() => { setActiveSubTab('farms'); setIsFarmFormOpen(false); }}
          className={`px-4 py-2 font-mono text-[10px] font-bold uppercase transition-all tracking-wide flex items-center gap-1.5 border-b-2 cursor-pointer ${
            activeSubTab === 'farms'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          <span className="material-symbols-outlined text-sm">satellite_alt</span>
          Farm Branches ({farms.length})
        </button>
        <button
          onClick={() => { setActiveSubTab('users'); setIsUserFormOpen(false); }}
          className={`px-4 py-2 font-mono text-[10px] font-bold uppercase transition-all tracking-wide flex items-center gap-1.5 border-b-2 cursor-pointer ${
            activeSubTab === 'users'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          <span className="material-symbols-outlined text-sm">group</span>
          User Accounts ({users.length})
        </button>
      </div>

      {/* ----------------------------------------------------------- */}
      {/* 1. SILO NODES MANAGEMENT */}
      {/* ----------------------------------------------------------- */}
      {activeSubTab === 'silos' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-sans text-xs font-bold uppercase text-gray-200">
              Silo Physical Inventory Ledger
            </h3>
            <button
              onClick={openAddSilo}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-mono text-[10px] font-bold uppercase rounded cursor-pointer flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm font-bold">add</span>
              Provision New Silo
            </button>
          </div>

          {/* Form Modal overlay */}
          {isSiloFormOpen && (
            <form onSubmit={submitSiloForm} className="glass-card p-5 border border-amber-500/30 rounded-xl bg-[#0e141b]/98 space-y-4 max-w-xl">
              <h4 className="font-sans text-xs font-black text-amber-500 uppercase pb-2 border-b border-[#222a36]">
                {editingSilo ? `EDIT PHYSICAL NODE STATE: ${editingSilo.id}` : 'PROVISION NEW MODBUS SILO NODE'}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-mono text-[9px] text-gray-400 uppercase">Silo Unique Node ID</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingSilo}
                    value={siloId}
                    onChange={(e) => setSiloId(e.target.value)}
                    placeholder="e.g. SILO-A10"
                    className="w-full bg-[#11171e] border border-[#232c38] focus:border-amber-500 focus:outline-none rounded-lg py-1.5 px-3 font-mono text-xs text-gray-200"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-[9px] text-gray-400 uppercase">Assign to Farm Hub</label>
                  <select
                    value={siloFarmId}
                    onChange={(e) => setSiloFarmId(e.target.value)}
                    className="w-full bg-[#11171e] border border-[#232c38] focus:border-amber-500 focus:outline-none rounded-lg py-1.5 px-3 font-mono text-xs text-gray-200"
                  >
                    {farms.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-[9px] text-gray-400 uppercase">Silo Operational Name</label>
                  <input
                    type="text"
                    required
                    value={siloName}
                    onChange={(e) => setSiloName(e.target.value)}
                    placeholder="e.g. Silo A05 (Finisher)"
                    className="w-full bg-[#11171e] border border-[#232c38] focus:border-amber-500 focus:outline-none rounded-lg py-1.5 px-3 font-sans text-xs text-gray-200"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-[9px] text-gray-400 uppercase">Feed Batch Classification</label>
                  <select
                    value={siloType}
                    onChange={(e) => setSiloType(e.target.value)}
                    className="w-full bg-[#11171e] border border-[#232c38] focus:border-amber-500 focus:outline-none rounded-lg py-1.5 px-3 font-mono text-xs text-gray-200"
                  >
                    <option value="Starter Feed">Starter Feed</option>
                    <option value="Grower B Feed">Grower B Feed</option>
                    <option value="Finisher Feed">Finisher Feed</option>
                    <option value="Pre-Starter Feed">Pre-Starter Feed</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-[9px] text-gray-400 uppercase">Maximum Capacity (KG)</label>
                  <input
                    type="number"
                    required
                    min="1000"
                    max="500000"
                    value={siloCapacity}
                    onChange={(e) => setSiloCapacity(Number(e.target.value))}
                    className="w-full bg-[#11171e] border border-[#232c38] focus:border-amber-500 focus:outline-none rounded-lg py-1.5 px-3 font-mono text-xs text-gray-200"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-[9px] text-gray-400 uppercase">Current Inventory Mass (KG)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    max={siloCapacity}
                    value={siloCurrentWeight}
                    onChange={(e) => setSiloCurrentWeight(Number(e.target.value))}
                    className="w-full bg-[#11171e] border border-[#232c38] focus:border-amber-500 focus:outline-none rounded-lg py-1.5 px-3 font-mono text-xs text-gray-200"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-mono text-[9px] text-gray-400 uppercase">Loadcell Sensor Telemetry Status</label>
                  <select
                    value={siloStatus}
                    onChange={(e) => setSiloStatus(e.target.value as Silo['status'])}
                    className="w-full bg-[#11171e] border border-[#232c38] focus:border-amber-500 focus:outline-none rounded-lg py-1.5 px-3 font-mono text-xs text-gray-200"
                  >
                    <option value="stable">STABLE - ACTIVE LINK</option>
                    <option value="filling">FILLING OPERATION</option>
                    <option value="unloading">DISCHARGING OPERATION</option>
                    <option value="warning">WARNING - OVER CAP DISCREPANCY</option>
                    <option value="critical">CRITICAL - EMPTY DEPLETION</option>
                    <option value="sensor_err">SENSOR TELEMETRY ERROR / MODBUS DISCONNECT</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsSiloFormOpen(false)}
                  className="px-3 py-1.5 border border-[#2d3a4b] hover:bg-gray-800 text-gray-300 font-mono text-[10px] uppercase rounded transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-mono text-[10px] font-bold uppercase rounded transition-colors cursor-pointer"
                >
                  {editingSilo ? 'Save Node Changes' : 'Confirm Provisioning'}
                </button>
              </div>
            </form>
          )}

          {/* Silo Ledger Table */}
          <div className="glass-card rounded-xl p-4 border border-[#222a36] bg-[#0e141b]/95">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left font-mono text-[10px] border-collapse">
                <thead>
                  <tr className="border-b border-[#222a36] text-gray-500 uppercase">
                    <th className="py-2.5">Silo ID</th>
                    <th className="py-2.5">Facility Location</th>
                    <th className="py-2.5">Feed Type</th>
                    <th className="py-2.5 text-right">Max Capacity</th>
                    <th className="py-2.5 text-right">Current stock</th>
                    <th className="py-2.5 text-center">Status</th>
                    <th className="py-2.5 text-center">Control actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1b222c] text-gray-300">
                  {silos.map(s => {
                    const farmObj = farms.find(f => f.id === s.farmId);
                    return (
                      <tr key={s.id} className="hover:bg-[#151c24] transition-colors">
                        <td className="py-2.5 font-bold text-gray-100">{s.id}</td>
                        <td className="py-2.5 text-gray-400">{farmObj ? farmObj.name : s.farmId}</td>
                        <td className="py-2.5">
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/10">
                            {s.type}
                          </span>
                        </td>
                        <td className="py-2.5 text-right font-bold">{s.capacity.toLocaleString()} kg</td>
                        <td className="py-2.5 text-right">
                          <strong className="text-gray-200">{s.currentWeight.toLocaleString()} kg</strong>
                          <span className="text-[8px] text-gray-500 block">({s.fillPercent}%)</span>
                        </td>
                        <td className="py-2.5 text-center">
                          <span className={`px-1 rounded text-[8px] font-extrabold uppercase ${
                            s.status === 'stable' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' :
                            s.status === 'filling' || s.status === 'unloading' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20 animate-pulse' :
                            'bg-red-500/15 text-red-400 border border-red-500/20 animate-pulse'
                          }`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="py-2.5 text-center">
                          <div className="inline-flex gap-2">
                            <button
                              onClick={() => openEditSilo(s)}
                              className="px-2 py-1 border border-[#2d3a4b] hover:border-amber-500/40 text-gray-300 hover:text-amber-400 font-bold uppercase rounded text-[8px] transition-all cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to permanently decommission Silo node ${s.id}?`)) {
                                  onDeleteSilo(s.id);
                                }
                              }}
                              className="px-2 py-1 border border-red-500/20 hover:border-red-500 hover:text-red-400 text-gray-400 font-bold uppercase rounded text-[8px] transition-all cursor-pointer"
                            >
                              Decom
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* 2. FARM BRANCHES MANAGEMENT */}
      {/* ----------------------------------------------------------- */}
      {activeSubTab === 'farms' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-sans text-xs font-bold uppercase text-gray-200">
              Regional Farm Facilities and Coordinates
            </h3>
            <button
              onClick={openAddFarm}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-mono text-[10px] font-bold uppercase rounded cursor-pointer flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm font-bold">add</span>
              Erect New Farm Location
            </button>
          </div>

          {/* Farm Form Modal overlay */}
          {isFarmFormOpen && (
            <form onSubmit={submitFarmForm} className="glass-card p-5 border border-amber-500/30 rounded-xl bg-[#0e141b]/98 space-y-4 max-w-xl">
              <h4 className="font-sans text-xs font-black text-amber-500 uppercase pb-2 border-b border-[#222a36]">
                {editingFarm ? `EDIT FACILITY SPECIFICATIONS: ${editingFarm.id}` : 'ESTABLISH NEW REGIONAL GRAIN HUB'}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-mono text-[9px] text-gray-400 uppercase">Farm Unique ID Key</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingFarm}
                    value={farmIdState}
                    onChange={(e) => setFarmIdState(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                    placeholder="e.g. jaffna-north"
                    className="w-full bg-[#11171e] border border-[#232c38] focus:border-amber-500 focus:outline-none rounded-lg py-1.5 px-3 font-mono text-xs text-gray-200"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-[9px] text-gray-400 uppercase">Province Region</label>
                  <select
                    value={farmProvince}
                    onChange={(e) => setFarmProvince(e.target.value)}
                    className="w-full bg-[#11171e] border border-[#232c38] focus:border-amber-500 focus:outline-none rounded-lg py-1.5 px-3 font-mono text-xs text-gray-200"
                  >
                    <option value="Western Province">Western Province</option>
                    <option value="North Western Province">North Western Province</option>
                    <option value="North Central Province">North Central Province</option>
                    <option value="Southern Province">Southern Province</option>
                    <option value="Eastern Province">Eastern Province</option>
                    <option value="Central Province">Central Province</option>
                    <option value="Northern Province">Northern Province</option>
                  </select>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-mono text-[9px] text-gray-400 uppercase">Facility Operational Name</label>
                  <input
                    type="text"
                    required
                    value={farmName}
                    onChange={(e) => setFarmName(e.target.value)}
                    placeholder="e.g. Puttalam Plains Facility"
                    className="w-full bg-[#11171e] border border-[#232c38] focus:border-amber-500 focus:outline-none rounded-lg py-1.5 px-3 font-sans text-xs text-gray-200"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-[9px] text-gray-400 uppercase">Designated Branch Manager</label>
                  <input
                    type="text"
                    required
                    value={farmManager}
                    onChange={(e) => setFarmManager(e.target.value)}
                    placeholder="e.g. Soren Jensen"
                    className="w-full bg-[#11171e] border border-[#232c38] focus:border-amber-500 focus:outline-none rounded-lg py-1.5 px-3 font-sans text-xs text-gray-200"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-[9px] text-gray-400 uppercase">Overall Branch Status</label>
                  <select
                    value={farmStatus}
                    onChange={(e) => setFarmStatus(e.target.value as Farm['status'])}
                    className="w-full bg-[#11171e] border border-[#232c38] focus:border-amber-500 focus:outline-none rounded-lg py-1.5 px-3 font-mono text-xs text-gray-200"
                  >
                    <option value="operational">OPERATIONAL - SECURE STATUS</option>
                    <option value="warning">WARNING - CRITICAL THRESHOLDS TRIPPED</option>
                    <option value="critical">CRITICAL ALERT - TERMINAL OFFLINE</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-[9px] text-gray-400 uppercase">Map Grid Coordinate Top (e.g. 45%)</label>
                  <input
                    type="text"
                    required
                    value={farmCoordTop}
                    onChange={(e) => setFarmCoordTop(e.target.value)}
                    placeholder="e.g. 52%"
                    className="w-full bg-[#11171e] border border-[#232c38] focus:border-amber-500 focus:outline-none rounded-lg py-1.5 px-3 font-mono text-xs text-gray-200"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-[9px] text-gray-400 uppercase">Map Grid Coordinate Left (e.g. 30%)</label>
                  <input
                    type="text"
                    required
                    value={farmCoordLeft}
                    onChange={(e) => setFarmCoordLeft(e.target.value)}
                    placeholder="e.g. 41%"
                    className="w-full bg-[#11171e] border border-[#232c38] focus:border-amber-500 focus:outline-none rounded-lg py-1.5 px-3 font-mono text-xs text-gray-200"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-[9px] text-gray-400 uppercase">Latitude (e.g. 8.3114)</label>
                  <input
                    type="text"
                    value={farmLat}
                    onChange={(e) => setFarmLat(e.target.value)}
                    placeholder="e.g. 7.5000"
                    className="w-full bg-[#11171e] border border-[#232c38] focus:border-amber-500 focus:outline-none rounded-lg py-1.5 px-3 font-mono text-xs text-gray-200"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-[9px] text-gray-400 uppercase">Longitude (e.g. 80.4037)</label>
                  <input
                    type="text"
                    value={farmLng}
                    onChange={(e) => setFarmLng(e.target.value)}
                    placeholder="e.g. 80.3000"
                    className="w-full bg-[#11171e] border border-[#232c38] focus:border-amber-500 focus:outline-none rounded-lg py-1.5 px-3 font-mono text-xs text-gray-200"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsFarmFormOpen(false)}
                  className="px-3 py-1.5 border border-[#2d3a4b] hover:bg-gray-800 text-gray-300 font-mono text-[10px] uppercase rounded transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-mono text-[10px] font-bold uppercase rounded transition-colors cursor-pointer"
                >
                  {editingFarm ? 'Save Branch Changes' : 'Erect Facility'}
                </button>
              </div>
            </form>
          )}

          {/* Farm Grid Table */}
          <div className="glass-card rounded-xl p-4 border border-[#222a36] bg-[#0e141b]/95">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left font-mono text-[10px] border-collapse">
                <thead>
                  <tr className="border-b border-[#222a36] text-gray-500 uppercase">
                    <th className="py-2.5">Farm ID</th>
                    <th className="py-2.5">Operational Branch Name</th>
                    <th className="py-2.5">Regional Province</th>
                    <th className="py-2.5">Supervising Manager</th>
                    <th className="py-2.5 text-center">Active Silos</th>
                    <th className="py-2.5 text-right">Total Capacity</th>
                    <th className="py-2.5 text-center">Status</th>
                    <th className="py-2.5 text-center">Control Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1b222c] text-gray-300">
                  {farms.map(f => (
                    <tr key={f.id} className="hover:bg-[#151c24] transition-colors">
                      <td className="py-3 font-bold text-gray-100">{f.id}</td>
                      <td className="py-3 text-gray-200 font-semibold">{f.name}</td>
                      <td className="py-3 text-gray-400">{f.province}</td>
                      <td className="py-3 text-gray-300">{f.manager}</td>
                      <td className="py-3 text-center text-amber-400 font-bold">{f.siloCount} Nodes</td>
                      <td className="py-3 text-right font-bold">{f.capacity.toLocaleString()} kg</td>
                      <td className="py-3 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                          f.status === 'operational' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' :
                          f.status === 'warning' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' :
                          'bg-red-500/15 text-red-400 border border-red-500/20 animate-pulse'
                        }`}>
                          {f.status}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => openEditFarm(f)}
                            className="px-2 py-1 border border-[#2d3a4b] hover:border-amber-500/40 text-gray-300 hover:text-amber-400 font-bold uppercase rounded text-[8px] transition-all cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to permanently decommission farm location ${f.name}? This will isolate all linked silos.`)) {
                                onDeleteFarm(f.id);
                              }
                            }}
                            className="px-2 py-1 border border-red-500/20 hover:border-red-500 hover:text-red-400 text-gray-400 font-bold uppercase rounded text-[8px] transition-all cursor-pointer"
                          >
                            Revoke
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* 3. USER ACCOUNTS MANAGEMENT */}
      {/* ----------------------------------------------------------- */}
      {activeSubTab === 'users' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-sans text-xs font-bold uppercase text-gray-200">
              Workforce Access List and Authorization Keys
            </h3>
            <button
              onClick={openAddUser}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-mono text-[10px] font-bold uppercase rounded cursor-pointer flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm font-bold">person_add</span>
              Add User profile
            </button>
          </div>

          {/* User Form Modal overlay */}
          {isUserFormOpen && (
            <form onSubmit={submitUserForm} className="glass-card p-5 border border-amber-500/30 rounded-xl bg-[#0e141b]/98 space-y-4 max-w-xl">
              <h4 className="font-sans text-xs font-black text-amber-500 uppercase pb-2 border-b border-[#222a36]">
                {editingUser ? `EDIT ACCOUNT PERMISSIONS: ${editingUser.id}` : 'AUTHORIZE NEW PERSONNEL TERMINAL ACCESS'}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-mono text-[9px] text-gray-400 uppercase">Staff Unique User ID</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingUser}
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="e.g. USR-06"
                    className="w-full bg-[#11171e] border border-[#232c38] focus:border-amber-500 focus:outline-none rounded-lg py-1.5 px-3 font-mono text-xs text-gray-200"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-[9px] text-gray-400 uppercase">Clearance/System Role</label>
                  <select
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value as User['role'])}
                    className="w-full bg-[#11171e] border border-[#232c38] focus:border-amber-500 focus:outline-none rounded-lg py-1.5 px-3 font-mono text-xs text-gray-200"
                  >
                    <option value="Super Admin">Super Admin (Clearance Level 3)</option>
                    <option value="Facility Manager">Facility Manager (Clearance Level 2)</option>
                    <option value="Technician">Technician (Clearance Level 1)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-[9px] text-gray-400 uppercase">Full Legal Name</label>
                  <input
                    type="text"
                    required
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="e.g. Dilhara Perera"
                    className="w-full bg-[#11171e] border border-[#232c38] focus:border-amber-500 focus:outline-none rounded-lg py-1.5 px-3 font-sans text-xs text-gray-200"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-[9px] text-gray-400 uppercase">Secure Email address</label>
                  <input
                    type="email"
                    required
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="e.g. dilhara@apexavian.lk"
                    className="w-full bg-[#11171e] border border-[#232c38] focus:border-amber-500 focus:outline-none rounded-lg py-1.5 px-3 font-sans text-xs text-gray-200"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-mono text-[9px] text-gray-400 uppercase">Assigned Grid / Regional Hub Jurisdiction</label>
                  <input
                    type="text"
                    required
                    value={userAssignment}
                    onChange={(e) => setUserAssignment(e.target.value)}
                    placeholder="e.g. Anuradhapura Central, Kurunegala Highland"
                    className="w-full bg-[#11171e] border border-[#232c38] focus:border-amber-500 focus:outline-none rounded-lg py-1.5 px-3 font-sans text-xs text-gray-200"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-mono text-[9px] text-gray-400 uppercase">Operational Account Status</label>
                  <select
                    value={userStatus}
                    onChange={(e) => setUserStatus(e.target.value as User['status'])}
                    className="w-full bg-[#11171e] border border-[#232c38] focus:border-amber-500 focus:outline-none rounded-lg py-1.5 px-3 font-mono text-xs text-gray-200"
                  >
                    <option value="Active">Active Account - Valid Authorization</option>
                    <option value="Deactivated">Deactivated Account - Suspended Access</option>
                    <option value="On Leave">On Leave - Temporarily Locked</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsUserFormOpen(false)}
                  className="px-3 py-1.5 border border-[#2d3a4b] hover:bg-gray-800 text-gray-300 font-mono text-[10px] uppercase rounded transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-mono text-[10px] font-bold uppercase rounded transition-colors cursor-pointer"
                >
                  {editingUser ? 'Save Permissions' : 'Confirm Access Grant'}
                </button>
              </div>
            </form>
          )}

          {/* User Ledger Table */}
          <div className="glass-card rounded-xl p-4 border border-[#222a36] bg-[#0e141b]/95">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left font-mono text-[10px] border-collapse">
                <thead>
                  <tr className="border-b border-[#222a36] text-gray-500 uppercase">
                    <th className="py-2.5">Staff Account</th>
                    <th className="py-2.5">Clearance Level</th>
                    <th className="py-2.5">Assigned Jurisdiction Hub</th>
                    <th className="py-2.5">Secure Email</th>
                    <th className="py-2.5 text-center">Status</th>
                    <th className="py-2.5 text-center">Control Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1b222c] text-gray-300">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-[#151c24] transition-colors">
                      <td className="py-3 flex items-center gap-2.5">
                        <img
                          src={u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80'}
                          alt={u.name}
                          referrerPolicy="no-referrer"
                          className="w-7 h-7 rounded-full object-cover border border-[#2d3748]"
                        />
                        <div>
                          <strong className="font-sans text-[11px] text-gray-100 block">{u.name}</strong>
                          <span className="text-[8px] text-gray-500 block lowercase">{u.id}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold border uppercase ${
                          u.role === 'Super Admin' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                          u.role === 'Facility Manager' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                          'bg-gray-500/10 text-gray-400 border-gray-500/20'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 text-gray-300 font-semibold">{u.assignment}</td>
                      <td className="py-3 text-gray-400">{u.email}</td>
                      <td className="py-3 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase ${
                          u.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => openEditUser(u)}
                            className="px-2 py-1 border border-[#2d3a4b] hover:border-amber-500/40 text-gray-300 hover:text-amber-400 font-bold uppercase rounded text-[8px] transition-all cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to permanently revoke all terminal permissions for ${u.name}?`)) {
                                onDeleteUser(u.id);
                              }
                            }}
                            className="px-2 py-1 border border-red-500/20 hover:border-red-500 hover:text-red-400 text-gray-400 font-bold uppercase rounded text-[8px] transition-all cursor-pointer"
                          >
                            Revoke
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
