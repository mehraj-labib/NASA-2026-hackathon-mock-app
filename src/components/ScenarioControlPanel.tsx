import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SunMedium,
  Brain,
  Sliders,
  Wind,
  Shield,
  FastForward,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { SimulationMode, VitalTelemetry } from '../types/telemetry';

interface ScenarioControlPanelProps {
  currentMode: SimulationMode;
  onSelectMode: (mode: SimulationMode) => void;
  isRunning: boolean;
  onToggleRunning: () => void;
  playbackSpeed: number;
  onSetSpeed: (speed: number) => void;
  vitals: VitalTelemetry;
  onManualOverride: (partial: Partial<VitalTelemetry>) => void;
}

export const ScenarioControlPanel: React.FC<ScenarioControlPanelProps> = ({
  currentMode,
  onSelectMode,
  isRunning,
  onToggleRunning,
  playbackSpeed,
  onSetSpeed,
  vitals,
  onManualOverride,
}) => {
  const [showManualTuning, setShowManualTuning] = useState(false);

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-30 bg-[#090d16]/95 border-t border-slate-800 backdrop-blur-md px-4 py-2.5 shadow-2xl">
      <div className="max-w-7xl mx-auto flex flex-col gap-2">
        {/* Top Mini-Ribbon for Manual Sliders (Collapsible) */}
        {showManualTuning && (
          <div className="p-3 bg-[#0d1322] border border-slate-700/80 rounded-lg mb-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Heart Rate</span>
                <span className="text-cyan-400 font-bold tabular-nums">{vitals.heartRate} BPM</span>
              </div>
              <input
                type="range"
                min="45"
                max="150"
                value={vitals.heartRate}
                onChange={e => onManualOverride({ heartRate: Number(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Daily Radiation</span>
                <span className="text-rose-400 font-bold tabular-nums">{vitals.dailyRadiation.toFixed(2)} mSv/day</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="3.0"
                step="0.05"
                value={vitals.dailyRadiation}
                onChange={e => onManualOverride({ dailyRadiation: Number(e.target.value) })}
                className="w-full accent-rose-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Sleep Last 24h</span>
                <span className="text-amber-400 font-bold tabular-nums">{vitals.sleepDuration.toFixed(1)} hrs</span>
              </div>
              <input
                type="range"
                min="2.0"
                max="10.0"
                step="0.1"
                value={vitals.sleepDuration}
                onChange={e => onManualOverride({ sleepDuration: Number(e.target.value) })}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Cabin CO2</span>
                <span className="text-purple-400 font-bold tabular-nums">{vitals.cabinCo2} ppm</span>
              </div>
              <input
                type="range"
                min="2000"
                max="7500"
                step="50"
                value={vitals.cabinCo2}
                onChange={e => onManualOverride({ cabinCo2: Number(e.target.value) })}
                className="w-full accent-purple-400 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Main Scenario Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Label & Playback Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs uppercase font-mono font-bold tracking-wider text-slate-300">
              Scenario Control Panel
            </span>

            {/* Play/Pause */}
            <button
              type="button"
              onClick={onToggleRunning}
              aria-label={isRunning ? 'Pause telemetry clock' : 'Resume telemetry clock'}
              className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors ml-1"
              title={isRunning ? 'Pause 1-second simulation clock' : 'Start 1-second simulation clock'}
            >
              {isRunning ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
            </button>

            {/* Speed Multiplier */}
            <div className="flex items-center bg-slate-800/90 rounded border border-slate-700 text-[11px] font-mono">
              {[1, 2, 5].map(speed => (
                <button
                  key={speed}
                  type="button"
                  onClick={() => onSetSpeed(speed)}
                  className={`px-2 py-0.5 transition-colors ${
                    playbackSpeed === speed
                      ? 'bg-cyan-600 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>

          {/* Core Interactive Scenario Buttons (Judge Action Suite) */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* 1. Baseline */}
            <button
              type="button"
              onClick={() => onSelectMode('NORMAL')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all shadow-sm ${
                currentMode === 'NORMAL'
                  ? 'bg-emerald-600 text-white ring-2 ring-emerald-400/40'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
              title="Vitals stabilize back to nominal NASA baseline (HR: 70, SpO2: 98%, Rad: 0.1 mSv)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Baseline</span>
            </button>

            {/* 2. Solar Flare Event */}
            <button
              type="button"
              onClick={() => onSelectMode('SOLAR_FLARE')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all shadow-sm ${
                currentMode === 'SOLAR_FLARE'
                  ? 'bg-rose-600 text-white ring-2 ring-rose-400/50'
                  : 'bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 border border-rose-800/60'
              }`}
              title="Radiation climbs by 0.1 per second, triggering CRITICAL UI alert to seek shelter"
            >
              <SunMedium className="w-3.5 h-3.5" />
              <span>Solar Flare Event</span>
            </button>

            {/* 3. Cognitive Fatigue */}
            <button
              type="button"
              onClick={() => onSelectMode('COGNITIVE_FATIGUE')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all shadow-sm ${
                currentMode === 'COGNITIVE_FATIGUE'
                  ? 'bg-amber-600 text-slate-950 ring-2 ring-amber-400/60'
                  : 'bg-amber-950/40 text-amber-300 hover:bg-amber-900/60 border border-amber-800/60'
              }`}
              title="Sleep drops, heart rate elevates, triggering the PVT Micro-test protocol"
            >
              <Brain className="w-3.5 h-3.5" />
              <span>Cognitive Fatigue</span>
            </button>

            {/* Secondary Deep-Space Scenarios */}
            <button
              type="button"
              onClick={() => onSelectMode('CABIN_CO2_SPIKE')}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                currentMode === 'CABIN_CO2_SPIKE'
                  ? 'bg-purple-600 text-white ring-2 ring-purple-400/40'
                  : 'bg-slate-850 text-slate-400 hover:bg-slate-800 border border-slate-800'
              }`}
              title="Environmental ECLSS leak: Cabin CO2 concentration escalates"
            >
              <Wind className="w-3.5 h-3.5" />
              <span>CO2 Spike</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectMode('DECONDITIONING')}
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                currentMode === 'DECONDITIONING'
                  ? 'bg-blue-600 text-white ring-2 ring-blue-400/40'
                  : 'bg-slate-850 text-slate-400 hover:bg-slate-800 border border-slate-800'
              }`}
              title="Microgravity bone and muscle deconditioning progression"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Deconditioning</span>
            </button>
          </div>

          {/* Manual Fine-Tuning Drawer Toggle */}
          <button
            type="button"
            onClick={() => setShowManualTuning(!showManualTuning)}
            className="flex items-center gap-1 text-xs font-mono text-slate-400 hover:text-slate-200 px-2 py-1 rounded bg-slate-850 border border-slate-800 transition-colors shrink-0"
            title="Fine-tune individual parameters"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Manual Sliders</span>
            {showManualTuning ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>
        </div>
      </div>
    </footer>
  );
};
