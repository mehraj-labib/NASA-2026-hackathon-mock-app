import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  CheckSquare,
  Square,
  ShieldAlert,
  ShieldCheck,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { PVTRecord } from '../types/telemetry';

interface MissionChecklistProps {
  pvtStatus: {
    cleared: boolean;
    lastRecord: PVTRecord | null;
  };
  onLaunchPvt: () => void;
}

interface ChecklistItem {
  id: string;
  task: string;
  risk: 'CRITICAL' | 'ELEVATED' | 'STANDARD';
  completed: boolean;
}

export const MissionChecklist: React.FC<MissionChecklistProps> = ({
  pvtStatus,
  onLaunchPvt,
}) => {
  const [items, setItems] = useState<ChecklistItem[]>([
    {
      id: 'chk-1',
      task: 'Verify EMU Spacesuit 100% O2 Pre-breathe (120 min scrub cycle)',
      risk: 'CRITICAL',
      completed: false,
    },
    {
      id: 'chk-2',
      task: 'External Airlock Outer Hatch Manual Interlock Latch release',
      risk: 'CRITICAL',
      completed: false,
    },
    {
      id: 'chk-3',
      task: 'Primary Tether 85m reel tension & secondary carabiner lock',
      risk: 'CRITICAL',
      completed: false,
    },
    {
      id: 'chk-4',
      task: 'Autonomous SAFER Jetpack Nitrogen propulsion propellant check (P > 3000 psi)',
      risk: 'ELEVATED',
      completed: false,
    },
    {
      id: 'chk-5',
      task: 'EVA Bio-Telemetry uplink verified with MTV Central Hab computer',
      risk: 'STANDARD',
      completed: false,
    },
  ]);

  const toggleItem = (id: string) => {
    if (!pvtStatus.cleared) return;
    setItems(prev =>
      prev.map(item => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const isLocked = !pvtStatus.cleared;

  return (
    <div className="bg-[#0b0f1a] border border-slate-800 rounded-lg overflow-hidden flex flex-col shadow-sm">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-slate-800 bg-[#0e1424] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {isLocked ? (
            <Lock className="w-4 h-4 text-rose-400" />
          ) : (
            <Unlock className="w-4 h-4 text-emerald-400" />
          )}
          <h3 className="text-xs uppercase font-mono font-bold tracking-wider text-slate-200">
            High-Risk Mission Safety Interlock
          </h3>
        </div>

        <span
          className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
            isLocked
              ? 'bg-rose-950/60 border-rose-800 text-rose-300'
              : 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
          }`}
        >
          {isLocked ? 'INTERLOCKED (LOCKED)' : 'INTERLOCK CLEARED'}
        </span>
      </div>

      {/* Safety Gate Advisory Banner */}
      <div
        className={`px-4 py-2.5 border-b text-xs font-mono flex items-center justify-between gap-3 ${
          isLocked
            ? 'bg-rose-950/30 border-rose-900/50 text-rose-200'
            : 'bg-emerald-950/30 border-emerald-900/50 text-emerald-200'
        }`}
      >
        <div className="flex items-center gap-2">
          {isLocked ? (
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>
            {isLocked
              ? 'NASA Safety Rule: Checklist locked until astronaut passes 30s PVT vigilance test or obtains dual-signoff.'
              : pvtStatus.lastRecord?.crewOverride
              ? `Safety interlock released via Dual-Crew Override (${pvtStatus.lastRecord.crewOverride.approvedBy}).`
              : `Safety interlock cleared. PVT Mean RT: ${pvtStatus.lastRecord?.meanRt} ms (Passed).`}
          </span>
        </div>

        {isLocked && (
          <button
            type="button"
            onClick={onLaunchPvt}
            className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs whitespace-nowrap transition-colors"
          >
            Execute PVT &gt;
          </button>
        )}
      </div>

      {/* Checklist Items */}
      <div className="p-3 divide-y divide-slate-800/80">
        {items.map(item => (
          <button
            key={item.id}
            type="button"
            disabled={isLocked}
            onClick={() => toggleItem(item.id)}
            className={`w-full text-left py-2.5 px-2 flex items-center justify-between gap-3 rounded transition-colors ${
              isLocked
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-slate-800/60 cursor-pointer'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {item.completed ? (
                <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <Square className="w-4 h-4 text-slate-500 shrink-0" />
              )}
              <span
                className={`text-xs ${
                  item.completed
                    ? 'line-through text-slate-500'
                    : 'text-slate-200 font-medium'
                }`}
              >
                {item.task}
              </span>
            </div>

            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded border shrink-0 ${
                item.risk === 'CRITICAL'
                  ? 'bg-rose-950/40 border-rose-800/60 text-rose-400'
                  : item.risk === 'ELEVATED'
                  ? 'bg-amber-950/40 border-amber-800/60 text-amber-400'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              {item.risk}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
