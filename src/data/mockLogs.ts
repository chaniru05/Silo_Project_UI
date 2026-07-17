import { Silo } from '../types';

export interface LoadingLogEntry {
  id: string;
  timestamp: string;
  type: 'loading' | 'unloading' | 'stable';
  weight: number;
  delta: number;
  flowRate: number;
  source: 'auto' | 'manual';
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

export function generateSiloLogs(silo: Silo, days = 365): LoadingLogEntry[] {
  const logs: LoadingLogEntry[] = [];
  const now = Date.now();
  const dayMs = 86400000;
  let id = 0;
  const rng = seededRandom(silo.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) + 42);

  let currentWeight = silo.capacity * (0.1 + rng() * 0.5);

  for (let d = days; d >= 0; d--) {
    if (d % 2 === 0 && d > 300) continue;
    if (d % 3 === 0 && d > 200 && d <= 300) continue;

    const date = new Date(now - d * dayMs);
    if (d % 15 === 0 || d % 7 === 0 || d === 0) {
      logs.push({
        id: `${silo.id}-LOG-${id++}`,
        timestamp: date.toISOString(),
        type: 'stable',
        weight: Math.round(currentWeight),
        delta: 0,
        flowRate: 0,
        source: 'auto',
      });
      continue;
    }

    const entries = 1 + Math.floor(rng() * 3);
    for (let e = 0; e < entries; e++) {
      const isLoad = rng() > 0.45;
      const delta = isLoad
        ? Math.round(500 + rng() * 4000)
        : -Math.round(300 + rng() * 3000);
      currentWeight = Math.max(0, Math.min(silo.capacity, currentWeight + delta));
      const flow = isLoad
        ? Math.round(300 + rng() * 1700)
        : -Math.round(200 + rng() * 1300);

      const entryDate = new Date(date.getTime() + e * 3600000);
      logs.push({
        id: `${silo.id}-LOG-${id++}`,
        timestamp: entryDate.toISOString(),
        type: isLoad ? 'loading' : 'unloading',
        weight: Math.round(currentWeight),
        delta,
        flowRate: flow,
        source: rng() > 0.85 ? 'manual' : 'auto',
      });
    }
  }

  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function generateAllSiloLogs(allSilos: Silo[]): Map<string, LoadingLogEntry[]> {
  const map = new Map<string, LoadingLogEntry[]>();
  for (const silo of allSilos) {
    map.set(silo.id, generateSiloLogs(silo));
  }
  return map;
}
