import React, { useState } from 'react';
import {
  X,
  Bell,
  CheckCheck,
  AlertTriangle,
  ShieldAlert,
  Info,
  CheckCircle2,
  Filter,
  Trash2,
} from 'lucide-react';
import { HealthAlert } from '../types/telemetry';

interface AlertHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: HealthAlert[];
  onAcknowledge: (id: string) => void;
  onAcknowledgeAll: () => void;
  onClearAll: () => void;
}

export const AlertHistoryDrawer: React.FC<AlertHistoryDrawerProps> = ({
  isOpen,
  onClose,
  alerts,
  onAcknowledge,
  onAcknowledgeAll,
  onClearAll,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'CRITICAL'>('ALL');

  if (!isOpen) return null;

  const filteredAlerts = alerts.filter(a => {
    if (filter === 'ACTIVE') return !a.acknowledged;
    if (filter === 'CRITICAL') return a.status === 'CRITICAL';
    return true;
  });

  const activeCount = alerts.filter(a => !a.acknowledged).length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="alert-drawer-title"
      className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm"
    >
      <div className="bg-[#0b0f1a] border-l border-slate-800 w-full max-w-lg h-full flex flex-col shadow-2xl text-slate-100">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-[#0e1424] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 id="alert-drawer-title" className="text-sm font-bold tracking-tight text-slate-100">
                Medical & Flight Telemetry Alert Log
              </h2>
              <p className="text-[11px] font-mono text-slate-400">
                {activeCount} Active / {alerts.length} Total Logged Events
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Alert Drawer"
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Filters */}
        <div className="px-4 py-2.5 border-b border-slate-800 bg-[#090d16] flex items-center justify-between gap-2">
          {/* Filter Segmented Control */}
          <div className="flex bg-slate-900 rounded p-0.5 border border-slate-800 text-xs font-mono">
            {(['ALL', 'ACTIVE', 'CRITICAL'] as const).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`px-2.5 py-1 rounded transition-colors ${
                  filter === tab
                    ? 'bg-cyan-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 text-xs font-mono">
            {activeCount > 0 && (
              <button
                type="button"
                onClick={onAcknowledgeAll}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ack All</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClearAll}
              aria-label="Clear Alert History"
              className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
              title="Clear all logged alert events"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Alert List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-16 text-slate-400 font-mono text-xs">
              <CheckCircle2 className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p>No alerts matching current filter.</p>
              <p className="text-[11px] text-slate-400 mt-1">All telemetry streams operating within nominal bounds.</p>
            </div>
          ) : (
            filteredAlerts.map(alert => (
              <div
                key={alert.id}
                className={`p-3.5 rounded-lg border transition-all ${
                  alert.status === 'CRITICAL'
                    ? alert.acknowledged
                      ? 'bg-rose-950/20 border-rose-900/40 text-slate-300 opacity-75'
                      : 'bg-rose-950/50 border-rose-700/80 text-rose-100 shadow-sm'
                    : alert.status === 'WARNING'
                    ? alert.acknowledged
                      ? 'bg-amber-950/20 border-amber-900/40 text-slate-300 opacity-75'
                      : 'bg-amber-950/40 border-amber-700/70 text-amber-100'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    {alert.status === 'CRITICAL' ? (
                      <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                    ) : alert.status === 'WARNING' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : (
                      <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                    )}
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider">
                      {alert.category} · {alert.status}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-slate-400">{alert.timestamp}</span>
                </div>

                <p className="text-xs font-medium mb-2 leading-relaxed">{alert.message}</p>

                {alert.protocolTitle && (
                  <div className="p-2 rounded bg-slate-950/60 border border-slate-800 text-[11px] font-mono mb-2">
                    <span className="text-cyan-400 font-semibold block">{alert.protocolTitle}</span>
                    <span className="text-slate-400 mt-0.5 block leading-normal">{alert.protocolAction}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 text-[11px] font-mono">
                  <span className="text-slate-400">Subject: {alert.astronaut}</span>

                  {!alert.acknowledged ? (
                    <button
                      type="button"
                      onClick={() => onAcknowledge(alert.id)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1 transition-colors"
                    >
                      <CheckCheck className="w-3 h-3 text-cyan-400" />
                      <span>Acknowledge</span>
                    </button>
                  ) : (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Acknowledged</span>
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
