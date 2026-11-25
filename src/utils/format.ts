import type { CountryStats } from '../types/game.ts';

export function formatNumber(n: number, decimals = 0): string {
  if (!Number.isFinite(n)) return '0';
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatPopulation(millions: number): string {
  if (millions < 1) return formatNumber(millions, 2);
  if (millions < 100) return formatNumber(millions, 1);
  return formatNumber(millions, 1);
}

export function formatGdp(billions: number): string {
  if (billions < 10) return formatNumber(billions, 1);
  return formatNumber(Math.round(billions), 0);
}

export function formatDelta(value: number | undefined, suffix = '', decimals = 1): string | null {
  if (value === undefined || !Number.isFinite(value) || Math.abs(value) < 0.005) {
    return null;
  }
  const sign = value > 0 ? '+' : '';
  const formatted =
    decimals === 0 ? formatNumber(Math.round(value), 0) : formatNumber(value, decimals);
  return `${sign}${formatted}${suffix}`;
}

export function formatStatValue(key: keyof CountryStats, value: number): string {
  switch (key) {
    case 'population':
      return formatPopulation(value);
    case 'gdp':
      return formatGdp(value);
    case 'unemployment':
    case 'inflation':
      return formatNumber(value, 1);
    case 'armedForces':
    case 'tanks':
    case 'fighterJets':
    case 'aircraftCarriers':
      return formatNumber(Math.round(value), 0);
  }
}

export function formatDateReadable(isoDate: string): string {
  const parts = isoDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some((p) => Number.isNaN(p))) {
    return isoDate;
  }
  const [year, month, day] = parts;
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const m = months[(month - 1 + 12) % 12] ?? 'Feb';
  return `${day} ${m} ${year}`;
}

export const STAT_FIELDS: Array<{
  key: keyof CountryStats;
  label: string;
  shortLabel: string;
  unit: string;
  decimals: number;
  goodWhenHigher: boolean;
}> = [
  { key: 'population', label: 'Population, million', shortLabel: 'Population', unit: 'M', decimals: 1, goodWhenHigher: true },
  { key: 'gdp', label: 'GDP, $ billion', shortLabel: 'GDP', unit: 'B', decimals: 0, goodWhenHigher: true },
  { key: 'unemployment', label: 'Unemployment, %', shortLabel: 'Unemployment', unit: '%', decimals: 1, goodWhenHigher: false },
  { key: 'inflation', label: 'Inflation, %', shortLabel: 'Inflation', unit: '%', decimals: 1, goodWhenHigher: false },
  { key: 'armedForces', label: 'Armed forces', shortLabel: 'Armed forces', unit: '', decimals: 0, goodWhenHigher: true },
  { key: 'tanks', label: 'Tanks', shortLabel: 'Tanks', unit: '', decimals: 0, goodWhenHigher: true },
  { key: 'fighterJets', label: 'Fighter jets', shortLabel: 'Fighter jets', unit: '', decimals: 0, goodWhenHigher: true },
  { key: 'aircraftCarriers', label: 'Aircraft carriers', shortLabel: 'Carriers', unit: '', decimals: 0, goodWhenHigher: true },
];
