import { Farm, Silo, Alert, User, MaintenanceTask, SystemConfig } from '../types';

export const initialFarms: Farm[] = [
  {
    id: 'anuradhapura',
    name: 'Anuradhapura Central',
    province: 'North Central Province',
    siloCount: 12,
    capacity: 420000,
    utilization: 82.5,
    status: 'operational',
    coords: { top: '32%', left: '47%' },
    manager: 'Amara Okafor',
    lastInspection: '2026-07-10'
  },
  {
    id: 'kurunegala',
    name: 'Kurunegala Highland',
    province: 'North Western Province',
    siloCount: 8,
    capacity: 280000,
    utilization: 68.3,
    status: 'operational',
    coords: { top: '55%', left: '42%' },
    manager: 'Marcus Thorne',
    lastInspection: '2026-07-11'
  },
  {
    id: 'gampaha',
    name: 'Gampaha Coastal',
    province: 'Western Province',
    siloCount: 10,
    capacity: 350000,
    utilization: 94.2,
    status: 'warning',
    coords: { top: '69%', left: '26%' },
    manager: 'Elena Rodriguez',
    lastInspection: '2026-07-09'
  },
  {
    id: 'puttalam',
    name: 'Puttalam Plains',
    province: 'North Western Province',
    siloCount: 6,
    capacity: 210000,
    utilization: 12.2,
    status: 'critical',
    coords: { top: '43%', left: '25%' },
    manager: 'Soren Jensen',
    lastInspection: '2026-07-08'
  }
];

export const initialSilos: Silo[] = [
  // Anuradhapura Silos
  {
    id: 'SILO-A01',
    farmId: 'anuradhapura',
    name: 'Silo A01 (Starter)',
    type: 'Starter Feed',
    capacity: 35000,
    currentWeight: 4280,
    flowRate: -420,
    status: 'unloading',
    fillPercent: 12.2,
    lastUpdate: 'Just now'
  },
  {
    id: 'SILO-A02',
    farmId: 'anuradhapura',
    name: 'Silo A02 (Grower)',
    type: 'Grower B Feed',
    capacity: 35000,
    currentWeight: 31500,
    flowRate: 0,
    status: 'stable',
    fillPercent: 90.0,
    lastUpdate: '1 min ago'
  },
  {
    id: 'SILO-A03',
    farmId: 'anuradhapura',
    name: 'Silo A03 (Finisher)',
    type: 'Finisher Feed',
    capacity: 35000,
    currentWeight: 14000,
    flowRate: 1200,
    status: 'filling',
    fillPercent: 40.0,
    lastUpdate: 'Just now'
  },
  {
    id: 'SILO-A04',
    farmId: 'anuradhapura',
    name: 'Silo A04 (Starter)',
    type: 'Starter Feed',
    capacity: 35000,
    currentWeight: 0,
    flowRate: 0,
    status: 'sensor_err',
    fillPercent: 0,
    lastUpdate: 'Comms Offline'
  },
  {
    id: 'SILO-A05',
    farmId: 'anuradhapura',
    name: 'Silo A05 (Pre-Starter)',
    type: 'Pre-Starter Feed',
    capacity: 35000,
    currentWeight: 28900,
    flowRate: 0,
    status: 'stable',
    fillPercent: 82.5,
    lastUpdate: '3 mins ago'
  },
  {
    id: 'SILO-A06',
    farmId: 'anuradhapura',
    name: 'Silo A06 (Finisher)',
    type: 'Finisher Feed',
    capacity: 35000,
    currentWeight: 18500,
    flowRate: -280,
    status: 'unloading',
    fillPercent: 52.8,
    lastUpdate: 'Just now'
  },
  {
    id: 'SILO-A07',
    farmId: 'anuradhapura',
    name: 'Silo A07 (Grower)',
    type: 'Grower B Feed',
    capacity: 35000,
    currentWeight: 34200,
    flowRate: 1500,
    status: 'warning', // Near overflow
    fillPercent: 97.7,
    lastUpdate: 'Just now'
  },
  {
    id: 'SILO-A08',
    farmId: 'anuradhapura',
    name: 'Silo A08 (Starter)',
    type: 'Starter Feed',
    capacity: 35000,
    currentWeight: 22100,
    flowRate: 0,
    status: 'stable',
    fillPercent: 63.1,
    lastUpdate: '8 mins ago'
  },
  {
    id: 'SILO-A09',
    farmId: 'anuradhapura',
    name: 'Silo A09 (Finisher)',
    type: 'Finisher Feed',
    capacity: 35000,
    currentWeight: 8900,
    flowRate: 0,
    status: 'stable',
    fillPercent: 25.4,
    lastUpdate: '5 mins ago'
  },
  {
    id: 'SILO-A10',
    farmId: 'anuradhapura',
    name: 'Silo A10 (Grower)',
    type: 'Grower B Feed',
    capacity: 35000,
    currentWeight: 12050,
    flowRate: -180,
    status: 'unloading',
    fillPercent: 34.4,
    lastUpdate: 'Just now'
  },
  {
    id: 'SILO-A11',
    farmId: 'anuradhapura',
    name: 'Silo A11 (Finisher)',
    type: 'Finisher Feed',
    capacity: 35000,
    currentWeight: 19600,
    flowRate: 0,
    status: 'stable',
    fillPercent: 56.0,
    lastUpdate: '10 mins ago'
  },
  {
    id: 'SILO-A12',
    farmId: 'anuradhapura',
    name: 'Silo A12 (Pre-Starter)',
    type: 'Pre-Starter Feed',
    capacity: 35000,
    currentWeight: 27300,
    flowRate: 450,
    status: 'filling',
    fillPercent: 78.0,
    lastUpdate: 'Just now'
  },

  // Kurunegala Silos
  {
    id: 'SILO-B01',
    farmId: 'kurunegala',
    name: 'Silo B01 (Grower)',
    type: 'Grower B Feed',
    capacity: 35000,
    currentWeight: 22400,
    flowRate: 0,
    status: 'stable',
    fillPercent: 64.0,
    lastUpdate: '2 mins ago'
  },
  {
    id: 'SILO-B02',
    farmId: 'kurunegala',
    name: 'Silo B02 (Starter)',
    type: 'Starter Feed',
    capacity: 35000,
    currentWeight: 18900,
    flowRate: -320,
    status: 'unloading',
    fillPercent: 54.0,
    lastUpdate: 'Just now'
  },
  {
    id: 'SILO-B03',
    farmId: 'kurunegala',
    name: 'Silo B03 (Finisher)',
    type: 'Finisher Feed',
    capacity: 35000,
    currentWeight: 32200,
    flowRate: 0,
    status: 'stable',
    fillPercent: 92.0,
    lastUpdate: '5 mins ago'
  },
  {
    id: 'SILO-B04',
    farmId: 'kurunegala',
    name: 'Silo B04 (Grower)',
    type: 'Grower B Feed',
    capacity: 35000,
    currentWeight: 5100,
    flowRate: -150,
    status: 'unloading',
    fillPercent: 14.5,
    lastUpdate: 'Just now'
  },
  {
    id: 'SILO-B05',
    farmId: 'kurunegala',
    name: 'Silo B05 (Finisher)',
    type: 'Finisher Feed',
    capacity: 35000,
    currentWeight: 12000,
    flowRate: 850,
    status: 'filling',
    fillPercent: 34.2,
    lastUpdate: 'Just now'
  },
  {
    id: 'SILO-B06',
    farmId: 'kurunegala',
    name: 'Silo B06 (Starter)',
    type: 'Starter Feed',
    capacity: 35000,
    currentWeight: 15400,
    flowRate: 0,
    status: 'stable',
    fillPercent: 44.0,
    lastUpdate: '11 mins ago'
  },
  {
    id: 'SILO-B07',
    farmId: 'kurunegala',
    name: 'Silo B07 (Grower)',
    type: 'Grower B Feed',
    capacity: 35000,
    currentWeight: 26100,
    flowRate: 0,
    status: 'stable',
    fillPercent: 74.5,
    lastUpdate: '12 mins ago'
  },
  {
    id: 'SILO-B08',
    farmId: 'kurunegala',
    name: 'Silo B08 (Pre-Starter)',
    type: 'Pre-Starter Feed',
    capacity: 35000,
    currentWeight: 14100,
    flowRate: -300,
    status: 'unloading',
    fillPercent: 40.2,
    lastUpdate: 'Just now'
  },

  // Gampaha Silos
  {
    id: 'SILO-C01',
    farmId: 'gampaha',
    name: 'Silo C01 (Starter)',
    type: 'Starter Feed',
    capacity: 35000,
    currentWeight: 34100,
    flowRate: 0,
    status: 'stable',
    fillPercent: 97.4,
    lastUpdate: '4 mins ago'
  },
  {
    id: 'SILO-C02',
    farmId: 'gampaha',
    name: 'Silo C02 (Grower)',
    type: 'Grower B Feed',
    capacity: 35000,
    currentWeight: 33800,
    flowRate: 200,
    status: 'warning', // Critical overfill hazard
    fillPercent: 96.5,
    lastUpdate: 'Just now'
  },
  {
    id: 'SILO-C03',
    farmId: 'gampaha',
    name: 'Silo C03 (Finisher)',
    type: 'Finisher Feed',
    capacity: 35000,
    currentWeight: 32900,
    flowRate: 0,
    status: 'stable',
    fillPercent: 94.0,
    lastUpdate: '1 min ago'
  },
  {
    id: 'SILO-C04',
    farmId: 'gampaha',
    name: 'Silo C04 (Grower)',
    type: 'Grower B Feed',
    capacity: 35000,
    currentWeight: 31200,
    flowRate: 0,
    status: 'stable',
    fillPercent: 89.1,
    lastUpdate: '6 mins ago'
  },
  {
    id: 'SILO-C05',
    farmId: 'gampaha',
    name: 'Silo C05 (Starter)',
    type: 'Starter Feed',
    capacity: 35000,
    currentWeight: 33400,
    flowRate: 0,
    status: 'stable',
    fillPercent: 95.4,
    lastUpdate: '7 mins ago'
  },
  {
    id: 'SILO-C06',
    farmId: 'gampaha',
    name: 'Silo C06 (Finisher)',
    type: 'Finisher Feed',
    capacity: 35000,
    currentWeight: 31800,
    flowRate: -650,
    status: 'unloading',
    fillPercent: 90.8,
    lastUpdate: 'Just now'
  },
  {
    id: 'SILO-C07',
    farmId: 'gampaha',
    name: 'Silo C07 (Grower)',
    type: 'Grower B Feed',
    capacity: 35000,
    currentWeight: 34500,
    flowRate: 0,
    status: 'stable',
    fillPercent: 98.5,
    lastUpdate: '2 mins ago'
  },
  {
    id: 'SILO-C08',
    farmId: 'gampaha',
    name: 'Silo C08 (Starter)',
    type: 'Starter Feed',
    capacity: 35000,
    currentWeight: 32600,
    flowRate: -120,
    status: 'unloading',
    fillPercent: 93.1,
    lastUpdate: 'Just now'
  },
  {
    id: 'SILO-C09',
    farmId: 'gampaha',
    name: 'Silo C09 (Finisher)',
    type: 'Finisher Feed',
    capacity: 35000,
    currentWeight: 31400,
    flowRate: 0,
    status: 'stable',
    fillPercent: 89.7,
    lastUpdate: '4 mins ago'
  },
  {
    id: 'SILO-C10',
    farmId: 'gampaha',
    name: 'Silo C10 (Grower)',
    type: 'Grower B Feed',
    capacity: 35000,
    currentWeight: 34300,
    flowRate: 350,
    status: 'warning',
    fillPercent: 98.0,
    lastUpdate: 'Just now'
  },

  // Puttalam Silos
  {
    id: 'SILO-D01',
    farmId: 'puttalam',
    name: 'Silo D01 (Grower)',
    type: 'Grower B Feed',
    capacity: 35000,
    currentWeight: 920,
    flowRate: -850,
    status: 'critical', // Depleted & active depletion rate
    fillPercent: 2.6,
    lastUpdate: 'Just now'
  },
  {
    id: 'SILO-D02',
    farmId: 'puttalam',
    name: 'Silo D02 (Starter)',
    type: 'Starter Feed',
    capacity: 35000,
    currentWeight: 1450,
    flowRate: 0,
    status: 'critical', // Extremely low stock
    fillPercent: 4.1,
    lastUpdate: '10 mins ago'
  },
  {
    id: 'SILO-D03',
    farmId: 'puttalam',
    name: 'Silo D03 (Finisher)',
    type: 'Finisher Feed',
    capacity: 35000,
    currentWeight: 4200,
    flowRate: 1400,
    status: 'filling',
    fillPercent: 12.0,
    lastUpdate: 'Just now'
  },
  {
    id: 'SILO-D04',
    farmId: 'puttalam',
    name: 'Silo D04 (Grower)',
    type: 'Grower B Feed',
    capacity: 35000,
    currentWeight: 6800,
    flowRate: 0,
    status: 'stable',
    fillPercent: 19.4,
    lastUpdate: '12 mins ago'
  },
  {
    id: 'SILO-D05',
    farmId: 'puttalam',
    name: 'Silo D05 (Starter)',
    type: 'Starter Feed',
    capacity: 35000,
    currentWeight: 3800,
    flowRate: -250,
    status: 'unloading',
    fillPercent: 10.8,
    lastUpdate: 'Just now'
  },
  {
    id: 'SILO-D06',
    farmId: 'puttalam',
    name: 'Silo D06 (Finisher)',
    type: 'Finisher Feed',
    capacity: 35000,
    currentWeight: 8450,
    flowRate: 0,
    status: 'stable',
    fillPercent: 24.1,
    lastUpdate: '15 mins ago'
  }
];

export const initialAlerts: Alert[] = [
  {
    id: 'ALT-402',
    severity: 'critical',
    timestamp: '2026-07-12 14:32:15',
    assetId: 'SILO-D01',
    category: 'Silo Low Level Warning',
    description: 'Puttalam Plains Silo D01 weight drops below critical threshold (2.6%). Active flow out is recorded.',
    status: 'new'
  },
  {
    id: 'ALT-399',
    severity: 'critical',
    timestamp: '2026-07-12 12:05:44',
    assetId: 'SILO-A04',
    category: 'Sensor Telemetry Error',
    description: 'Anuradhapura Central Silo A04 telemetry module reports persistent CRC errors. Comms loop offline.',
    status: 'new'
  },
  {
    id: 'ALT-391',
    severity: 'warning',
    timestamp: '2026-07-12 10:45:12',
    assetId: 'SILO-C02',
    category: 'Overfill Hazard Detection',
    description: 'Gampaha Coastal Silo C02 reaches 96.5% capacity. Continuous fill cycle active. Risks emergency overflow.',
    status: 'acknowledged'
  },
  {
    id: 'ALT-385',
    severity: 'warning',
    timestamp: '2026-07-12 08:22:19',
    assetId: 'SILO-A07',
    category: 'Stock Limit Alert',
    description: 'Anuradhapura Central Silo A07 capacity exceeds standard limit (97.7%). Flow stabilization recommended.',
    status: 'acknowledged'
  },
  {
    id: 'ALT-354',
    severity: 'info',
    timestamp: '2026-07-11 17:30:00',
    assetId: 'ANURADHAPURA',
    category: 'Scheduled Inspection',
    description: 'Annual electrical safety inspection completed successfully by Amara Okafor.',
    status: 'resolved'
  }
];

export const initialUsers: User[] = [
  {
    id: 'USR-01',
    name: 'Marcus Thorne',
    email: 'marcus.thorne@apexavian.lk',
    role: 'Super Admin',
    assignment: 'Colombo Headquarters & Regional Ops',
    lastLogin: 'Active Now',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'USR-02',
    name: 'Elena Rodriguez',
    email: 'elena.rodriguez@apexavian.lk',
    role: 'Facility Manager',
    assignment: 'Gampaha Coastal Hub',
    lastLogin: '10 mins ago',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'USR-03',
    name: 'Soren Jensen',
    email: 'soren.jensen@apexavian.lk',
    role: 'Facility Manager',
    assignment: 'Puttalam Plains Facility',
    lastLogin: '2 hrs ago',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'USR-04',
    name: 'Amara Okafor',
    email: 'amara.okafor@apexavian.lk',
    role: 'Facility Manager',
    assignment: 'Anuradhapura Central',
    lastLogin: 'Yesterday',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'USR-05',
    name: 'Kavinda Bandara',
    email: 'kavinda.bandara@apexavian.lk',
    role: 'Technician',
    assignment: 'Western & North Western Grid',
    lastLogin: 'Active Now',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
  }
];

export const initialMaintenanceTasks: MaintenanceTask[] = [
  {
    id: 'TSK-201',
    assetId: 'SILO-A04',
    description: 'Replace faulty RS485 communication transceiver module',
    priority: 'URGENT',
    assignedTo: 'Kavinda Bandara',
    status: 'pending'
  },
  {
    id: 'TSK-198',
    assetId: 'SILO-D01',
    description: 'Verify weight loadcell calibration zero-drift error',
    priority: 'MEDIUM',
    assignedTo: 'Kavinda Bandara',
    status: 'pending'
  },
  {
    id: 'TSK-185',
    assetId: 'SILO-C02',
    description: 'Clean emergency overflow slide gate actuators',
    priority: 'LOW',
    assignedTo: 'Soren Jensen',
    status: 'pending'
  }
];

export const initialSystemConfig: SystemConfig = {
  measurementUnit: 'metric',
  timezone: 'Asia/Colombo (GMT+5:30)',
  refreshRate: 1.5,
  primaryApiKey: 'apk_avian_prod_sec_4091a18bc928f117a',
  webhookEndpoint: 'https://telemetry.apexavian.lk/v1/webhook',
  notificationThresholds: {
    lowStock: 15.0,
    criticalLevel: 5.0,
    tempVariance: 2.5
  },
  regionalAccess: {
    sector04North: true,
    coastalLogistics: true,
    southernPlains: false,
    hqExperimental: true
  }
};

// Static visual graphs datasets
export const colomboHourlyTrends = [
  { time: '08:00', load: 1040, supply: 1200 },
  { time: '10:00', load: 1120, supply: 1200 },
  { time: '12:00', load: 1248, supply: 1250 },
  { time: '14:00', load: 1210, supply: 1250 },
  { time: '16:00', load: 1180, supply: 1200 },
  { time: '18:00', load: 1020, supply: 1100 }
];

export const regionalFulfillments = [
  { name: 'Anuradhapura', throughput: 82.5, capacity: 100 },
  { name: 'Kurunegala', throughput: 68.3, capacity: 100 },
  { name: 'Gampaha', throughput: 94.2, capacity: 100 },
  { name: 'Puttalam', throughput: 12.2, capacity: 100 }
];

export const weightHistory24h = [
  { name: '15:00', weight: 4120 },
  { name: '17:00', weight: 4180 },
  { name: '19:00', weight: 4150 },
  { name: '21:00', weight: 4220 },
  { name: '23:00', weight: 4250 },
  { name: '01:00', weight: 4310 },
  { name: '03:00', weight: 4380 },
  { name: '05:00', weight: 4350 },
  { name: '07:00', weight: 4420 },
  { name: '09:00', weight: 4390 },
  { name: '11:00', weight: 4480 },
  { name: '13:00', weight: 4280 }
];

export const consumptionForecast30d = [
  { day: 'Day 1', predicted: 4200, current: 4100 },
  { day: 'Day 5', predicted: 4400, current: 4320 },
  { day: 'Day 10', predicted: 4600, current: 4410 },
  { day: 'Day 15', predicted: 4850, current: 4690 },
  { day: 'Day 20', predicted: 5100, current: 4850 },
  { day: 'Day 25', predicted: 5320, current: 4980 },
  { day: 'Day 30', predicted: 5600, current: 5120 }
];

// Telemetry state noise and logic updates
export function simulateTelemetryUpdate(silos: Silo[]): Silo[] {
  return silos.map(silo => {
    if (silo.status === 'sensor_err') {
      return silo; // offline silos stay offline
    }

    // Telemetry noise (small sensor fluctuation ±1.5 kg)
    const noise = (Math.random() - 0.5) * 3;
    
    // Add real movement based on active flowRate
    // flowRate is kg/hr. Since our simulator ticks every ~1.5s,
    // flow rate per tick is: flowRate / 3600 * 1.5
    const tickRate = 1.5;
    const ratePerSec = silo.flowRate / 3600;
    const deltaWeight = ratePerSec * tickRate + noise;

    let newWeight = Math.max(0, Math.min(silo.capacity, silo.currentWeight + deltaWeight));
    
    // Auto stabilize if we reach boundary
    let newStatus: Silo['status'] = silo.status;
    let newFlowRate = silo.flowRate;
    
    if (newWeight >= silo.capacity && silo.flowRate > 0) {
      newWeight = silo.capacity;
      newFlowRate = 0;
      newStatus = 'stable';
    } else if (newWeight <= 0 && silo.flowRate < 0) {
      newWeight = 0;
      newFlowRate = 0;
      newStatus = 'critical';
    }

    // Recalculate percent
    const fillPercent = Number(((newWeight / silo.capacity) * 100).toFixed(1));

    // Dynamic warning updates
    if (fillPercent >= 95.0 && newStatus !== 'critical') {
      newStatus = 'warning';
    } else if (fillPercent <= 5.0) {
      newStatus = 'critical';
    } else if (newFlowRate > 0) {
      newStatus = 'filling';
    } else if (newFlowRate < 0) {
      newStatus = 'unloading';
    } else {
      newStatus = 'stable';
    }

    return {
      ...silo,
      currentWeight: Math.round(newWeight),
      fillPercent,
      status: newStatus,
      flowRate: newFlowRate,
      lastUpdate: 'Just now'
    };
  });
}
