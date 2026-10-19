import React from 'react';
import { AlertTriangle, ShieldAlert, ArrowRight, X } from 'lucide-react';
import { HealthStatus } from '../types/telemetry';

interface EmergencyBannerProps {
  status: HealthStatus;
  criticalMessages: string[];
  warningMessages: string[];
  dailyRadiation: number;
  onOpenStormHaven: () => void;
  onOpenPvt: () => void;
  onDismiss?: () => void;
}

export const EmergencyBanner: React.FC<EmergencyBannerProps> = ({
  status,
  criticalMessages,
  warningMessages,
  dailyRadiation,
  onOpenStormHaven,
  onOpenPvt,
}) => {
  if (status === 'NORMAL') {
    return null;
  }

  const isCritical = status === 'CRITICAL';
  const isSpe = dailyRadiation >= 1.0;
  const isHighFatigue = criticalMessages.some(m => m.toLowerCase().includes('fatigue') || m.toLowerCase().includes('pvt'));

  return (
    <div
      role="alert"
      className={`border-b transition-all duration-300 ${
        isCritical
          ? 'bg-rose-950/80 border-rose-600/80 text-rose-100'
          : 'bg-amber-950/70 border-amber-600/70 text-amber-100'
      } px-4 py-3`}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`p-2 rounded-lg shrink-0 mt-0.5 ${
              isCritical ? 'bg-rose-600 text-white' : 'bg-amber-500 text-slate-950'
            }`}
          >
            {isCritical ? <ShieldAlert className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-mono font-bold tracking-wider">
                {isCritical ? 'CRITICAL TELEMETRY ALERT' : 'WARNING PROTOCOL ADVISORY'}
              </span>
              <span className="text-xs opacity-75">· Deterministic Rule Engine Trigger</span>
            </div>

            <p className="text-sm font-semibold mt-0.5">
              {isCritical
                ? criticalMessages[0] || 'Multiple critical flight parameters exceeded safety bounds.'
                : warningMessages[0] || 'Vitals drifting outside nominal envelope.'}
            </p>

            <p className="text-xs opacity-90 mt-0.5">
              {isSpe
                ? 'Ionizing particle flux exceeds human endurance thresholds. Outer hull shielding compromised.'
                : isHighFatigue
                ? 'High-risk spacewalk checklists locked until cognitive vigilance is objectively verified.'
                : 'NASA aerospace clinical decision support recommends immediate crew verification.'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          {isSpe && (
            <button
              type="button"
              onClick={onOpenStormHaven}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <span>Storm Haven Shelter Protocol</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {isHighFatigue && !isSpe && (
            <button
              type="button"
              onClick={onOpenPvt}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-sm transition-colors"
            >
              <span>Launch PVT Micro-Test</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {!isSpe && !isHighFatigue && (
            <button
              type="button"
              onClick={onOpenStormHaven}
              className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-medium border border-slate-700 transition-colors"
            >
              View Countermeasures
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
