import React, { useState } from 'react';
import type { TurnRecord } from '../types/game.ts';
import { formatNumber } from '../utils/format.ts';

interface HistoryChartProps {
  turns: TurnRecord[];
  startDate: string;
}

type MetricKey = 'gdp' | 'approval' | 'inflation' | 'unemployment' | 'armedForces';

const METRICS: Array<{
  key: MetricKey;
  label: string;
  unit: string;
  color: string;
  getValue: (t: TurnRecord) => number;
  decimals: number;
}> = [
  { key: 'gdp', label: 'GDP ($B)', unit: 'B', color: '#173a63', getValue: (t) => t.statsSnapshot.gdp, decimals: 0 },
  { key: 'approval', label: 'Approval (%)', unit: '%', color: '#1d6346', getValue: (t) => t.governanceSnapshot.approval, decimals: 0 },
  { key: 'inflation', label: 'Inflation (%)', unit: '%', color: '#8b5a00', getValue: (t) => t.statsSnapshot.inflation, decimals: 1 },
  { key: 'unemployment', label: 'Unemployment (%)', unit: '%', color: '#9b2c2c', getValue: (t) => t.statsSnapshot.unemployment, decimals: 1 },
  { key: 'armedForces', label: 'Armed forces', unit: '', color: '#584b8a', getValue: (t) => t.statsSnapshot.armedForces, decimals: 0 },
];

export const HistoryChart: React.FC<HistoryChartProps> = ({ turns, startDate }) => {
  const [selected, setSelected] = useState<MetricKey>('gdp');
  const metric = METRICS.find((m) => m.key === selected) ?? METRICS[0];

  if (turns.length < 2) {
    return (
      <div className="py-8 text-center text-xs text-[#697280]">
        Issue your first directive to begin charting national trajectories from {startDate}.
      </div>
    );
  }

  const values = turns.map((t) => metric.getValue(t));
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || Math.max(Math.abs(maxVal) * 0.1, 1);
  const padMin = minVal - range * 0.15;
  const padMax = maxVal + range * 0.15;
  const padRange = padMax - padMin || 1;

  const width = 420;
  const height = 160;
  const padLeft = 10;
  const padRight = 10;
  const padTop = 16;
  const padBottom = 26;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const points = turns.map((t, i) => {
    const x = padLeft + (turns.length === 1 ? plotW / 2 : (i / (turns.length - 1)) * plotW);
    const y = padTop + plotH - ((values[i] - padMin) / padRange) * plotH;
    return { x, y, value: values[i], turn: t.turn, date: t.date };
  });

  const polyline = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const first = values[0];
  const latest = values[values.length - 1];
  const netDelta = latest - first;

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {METRICS.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setSelected(m.key)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              selected === m.key
                ? 'bg-[#173a63] text-white'
                : 'text-[#5b6573] hover:bg-[#f2efe8] hover:text-[#171a1f]'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-baseline justify-between border-t border-[#e8e3d9] pt-3">
        <div>
          <span className="text-xs text-[#697280]">Current</span>
          <div className="font-mono text-base font-semibold text-[#171a1f] tabular-nums">
            {metric.key === 'gdp' ? '$' : ''}
            {formatNumber(latest, metric.decimals)}
            {metric.unit}
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs text-[#697280]">Since {startDate}</span>
          <div className="font-mono text-xs font-medium text-[#3b4554] tabular-nums">
            {netDelta >= 0 ? '+' : ''}
            {metric.key === 'gdp' ? '$' : ''}
            {formatNumber(netDelta, metric.decimals)}
            {metric.unit}
          </div>
        </div>
      </div>

      <div className="mt-2">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-40 w-full overflow-visible">
          {[0.25, 0.5, 0.75].map((ratio) => {
            const y = padTop + plotH * ratio;
            return (
              <line
                key={ratio}
                x1={padLeft}
                y1={y}
                x2={width - padRight}
                y2={y}
                stroke="#e8e3d9"
                strokeWidth="1"
              />
            );
          })}
          <polyline
            fill="none"
            stroke={metric.color}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={polyline}
          />
          {points.map((p) => (
            <g key={p.turn}>
              <circle cx={p.x} cy={p.y} r="3.4" fill="#ffffff" stroke={metric.color} strokeWidth="2">
                <title>{`Turn ${p.turn} (${p.date}): ${formatNumber(p.value, metric.decimals)}${metric.unit}`}</title>
              </circle>
            </g>
          ))}
          <text x={padLeft} y={height - 4} fill="#6b7480" fontSize="10" fontFamily="IBM Plex Mono, monospace">
            {points[0].date}
          </text>
          <text
            x={width - padRight}
            y={height - 4}
            textAnchor="end"
            fill="#6b7480"
            fontSize="10"
            fontFamily="IBM Plex Mono, monospace"
          >
            {points[points.length - 1].date}
          </text>
        </svg>
      </div>
    </div>
  );
};
