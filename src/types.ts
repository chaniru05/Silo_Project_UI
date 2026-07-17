export interface Farm {
  id: string;
  name: string;
  province: string;
  siloCount: number;
  capacity: number; // in kg
  utilization: number; // percentage, e.g. 92.4
  status: 'operational' | 'warning' | 'critical';
  coords: { top: string; left: string; lat?: number; lng?: number };
  manager: string;
  lastInspection: string;
}

export interface Silo {
  id: string;
  farmId: string;
  name: string;
  type: string;
  capacity: number; // in kg
  currentWeight: number; // in kg
  flowRate: number; // in kg/hr (+ for filling, - for unloading, 0 for stable)
  status: 'filling' | 'unloading' | 'stable' | 'warning' | 'critical' | 'sensor_err';
  fillPercent: number; // e.g. 12.2
  lastUpdate: string;
}

export interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info' | 'success';
  timestamp: string;
  assetId: string;
  category: string;
  description: string;
  status: 'new' | 'acknowledged' | 'resolved';
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Super Admin' | 'Facility Manager' | 'Technician';
  assignment: string;
  lastLogin: string;
  status: 'Active' | 'Deactivated' | 'On Leave';
  avatar?: string;
}

export interface MaintenanceTask {
  id: string;
  assetId: string;
  description: string;
  priority: 'URGENT' | 'MEDIUM' | 'LOW';
  assignedTo: string;
  status: 'pending' | 'completed';
}

export interface SystemConfig {
  measurementUnit: 'metric' | 'imperial';
  timezone: string;
  refreshRate: number; // in seconds
  primaryApiKey: string;
  webhookEndpoint: string;
  notificationThresholds: {
    lowStock: number; // percentage
    criticalLevel: number; // percentage
    tempVariance: number; // °C
  };
  regionalAccess: {
    sector04North: boolean;
    coastalLogistics: boolean;
    southernPlains: boolean;
    hqExperimental: boolean;
  };
}
