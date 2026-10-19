import React from 'react';
import { HealthStatus } from '../types/telemetry';

interface VitalCardProps {
  label: string;
  value: string | number;
  unit: string;
  secondaryValue?: string;
  secondaryLabel?: string;
  nominalRange: string;
  status: HealthStatus;
  history?: number[];
  icon: React.ReactNode;
  description?: string;
  customColor?: string;
}

export const VitalCard: React.FC<VitalCardProps> = ({
  label,
  value,
  unit,
  secondaryValue,
  secondaryLabel,
  nominalRange,
  status,
  history = [],
  icon,
  description,
}) => {
  const getStatusBadge = () => {
    switch (status) {
      case 'CRITICAL':
        return {
          text: '✖ Critical',
          style: 'text-rose-400 bg-rose-950/50 border-rose-800/80',
          accent: 'text-rose-400',
        };
      case 'WARNING':
        return {
          text: '▲ Warning',
          style: 'text-amber-400 bg-amber-950/50 border-amber-800/80',
          accent: 'text-amber-400',
        };
      default:
        return {
          text: '● Nominal',
          style: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60',
          accent: 'text-emerald-400',
        };
    }
  };

  const badge = getStatusBadge();

  // Generate SVG Sparkline path
  const renderSparkline = () => {
    if (!history || history.length < 2) return null;
    const min = Math.min(...history);
    const max = Math.max(...history);
    const range = max - min === 0 ? 1 : max - min;
    const width = 120;
    const height = 28;

    const points = history.map((val, idx) => {
      const x = (idx / (history.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    const strokeColor =
      status === 'CRITICAL'
        ? '#f43f5e'
        : status === 'WARNING'
        ? '#f59e0b'
        : '#10b981';

    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-24 h-7 overflow-visible shrink-0"
        aria-hidden="true"
      >
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points.join(' ')}
        />
      </svg>
    );
  };

  return (
    <div className="bg-[#0e1424] border border-slate-800/90 rounded-lg p-3.5 flex flex-col justify-between hover:border-slate-700 transition-colors shadow-sm">
      {/* Top Header: Label, Icon, and Status */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">{icon}</span>
          <span className="text-xs uppercase tracking-wider font-mono text-slate-300 font-semibold truncate max-w-[130px] sm:max-w-none">
            {label}
          </span>
        </div>

        <span
          className={`text-[11px] font-mono px-2 py-0.5 rounded border ${badge.style} whitespace-nowrap`}
        >
          {badge.text}
        </span>
      </div>

      {/* Main Metric Value and Sparkline */}
      <div className="flex items-baseline justify-between gap-2 my-1">
        <div className="flex items-baseline">
          <span className="text-2xl sm:text-3xl font-mono font-bold tracking-tight tabular-nums text-slate-100">
            {value}
          </span>
          <span className="text-xs uppercase font-mono text-slate-400 ml-1.5 font-medium">
            {unit}
          </span>
        </div>

        {renderSparkline()}
      </div>

      {/* Secondary Metrics / Subtext / Bounds */}
      <div className="pt-2 mt-2 border-t border-slate-800/70 flex items-center justify-between text-[11px] font-mono text-slate-400">
        <div className="truncate">
          {secondaryLabel && (
            <span>
              {secondaryLabel}:{' '}
              <strong className="text-slate-200 tabular-nums">{secondaryValue}</strong>
            </span>
          )}
          {!secondaryLabel && description && (
            <span className="text-slate-400 truncate">{description}</span>
          )}
        </div>

        <span className="text-slate-400 shrink-0 ml-2" title="Aerospace flight nominal bounds">
          Bound: {nominalRange}
        </span>
      </div>
    </div>
  );
};
