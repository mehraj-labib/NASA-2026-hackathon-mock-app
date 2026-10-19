import React from 'react';
import {
  Bell,
  Volume2,
  VolumeX,
  Radio,
  FileText,
  Activity,
  ShieldAlert,
  Clock,
} from 'lucide-react';
import { AstronautProfile, HealthStatus } from '../types/telemetry';

interface TopTelemetryBarProps {
  astronaut: AstronautProfile;
  status: HealthStatus;
  readinessScore: number;
  activeAlertCount: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenAlerts: () => void;
  onOpenEarthSync: () => void;
  onOpenPvt: () => void;
}

export const TopTelemetryBar: React.FC<TopTelemetryBarProps> = ({
  astronaut,
  status,
  readinessScore,
  activeAlertCount,
  isMuted,
  onToggleMute,
  onOpenAlerts,
  onOpenEarthSync,
  onOpenPvt,
}) => {
  const getStatusColor = (s: HealthStatus) => {
    switch (s) {
      case 'CRITICAL':
        return 'text-rose-400 bg-rose-950/60 border-rose-700/60';
      case 'WARNING':
        return 'text-amber-400 bg-amber-950/60 border-amber-700/60';
      default:
        return 'text-emerald-400 bg-emerald-950/50 border-emerald-700/50';
    }
  };

  return (
    <header className="border-b border-slate-800 bg-[#090d16]/95 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-6 py-2.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-white shadow-sm shadow-cyan-900/40">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-tight text-slate-100 whitespace-nowrap">
                AstroPulse Bio-Sentinel
              </span>
              <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                / {astronaut.id}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-[200px] sm:max-w-xs">
              {astronaut.name} · {astronaut.role}
            </p>
          </div>
        </div>

        {/* Zone 2: Aerospace Telemetry Ribbon (Single-line metrics with separators) */}
        <div className="hidden md:flex items-center gap-4 text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-300">MET Day {astronaut.missionDay}</span>
          </div>

          <span aria-hidden="true" className="text-slate-700">·</span>

          <div className="flex items-center gap-1.5" title="Mars-to-Earth speed-of-light communication latency">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span>Earth Lag: <strong className="text-slate-200 tabular-nums">14m 18s</strong></span>
          </div>

          <span aria-hidden="true" className="text-slate-700">·</span>

          <div className="flex items-center gap-1.5">
            <span>Readiness:</span>
            <span
              className={`font-semibold tabular-nums ${
                readinessScore >= 80
                  ? 'text-emerald-400'
                  : readinessScore >= 60
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {readinessScore}%
            </span>
          </div>

          <span aria-hidden="true" className="text-slate-700">·</span>

          <span
            className={`border px-2 py-0.5 rounded text-[11px] font-medium tracking-wide uppercase ${getStatusColor(
              status
            )}`}
          >
            {status}
          </span>
        </div>

        {/* Zone 3: Primary Action Suite */}
        <div className="flex items-center gap-2 shrink-0">
          {/* PVT Micro-test Trigger */}
          <button
            type="button"
            onClick={onOpenPvt}
            className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors whitespace-nowrap"
            title="Launch 30-Second Psychomotor Vigilance Test"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">PVT Protocol</span>
            <span className="sm:hidden">PVT</span>
          </button>

          {/* Earth Burst Sync Packet */}
          <button
            type="button"
            onClick={onOpenEarthSync}
            className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 transition-colors whitespace-nowrap"
            title="Generate Earth Ground Control Burst Sync Packet"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden lg:inline">Earth Sync Packet</span>
            <span className="lg:hidden">Sync</span>
          </button>

          {/* Audio Annunciator Mute/Unmute */}
          <button
            type="button"
            onClick={onToggleMute}
            aria-label={isMuted ? 'Unmute Acoustic Alarms' : 'Mute Acoustic Alarms'}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800 transition-colors"
            title={isMuted ? 'Acoustic C&W alarms muted. Click to enable audio.' : 'Acoustic C&W alarms active. Click to mute.'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          {/* Alert Drawer Trigger with Badge */}
          <button
            type="button"
            onClick={onOpenAlerts}
            aria-label={`View Alert Log (${activeAlertCount} active)`}
            className={`relative p-1.5 rounded-md border transition-colors ${
              activeAlertCount > 0
                ? 'bg-rose-950/60 border-rose-800 text-rose-300 hover:bg-rose-900/60'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Bell className="w-4 h-4" />
            {activeAlertCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white font-mono text-[10px] font-bold flex items-center justify-center leading-none">
                {activeAlertCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
