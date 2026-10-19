import React, { useState } from 'react';
import {
  Brain,
  ShieldCheck,
  Stethoscope,
  ChevronRight,
  BookOpen,
  Send,
  Sparkles,
  AlertCircle,
  Activity,
} from 'lucide-react';
import { HealthStatus, NasaProtocol, VitalTelemetry } from '../types/telemetry';
import { NASA_PROTOCOLS } from '../utils/aerospace-medicine';

interface AiMedicalOfficerProps {
  vitals: VitalTelemetry;
  status: HealthStatus;
  readinessScore: number;
  cognitiveFatigueIndex: number;
  onOpenProtocol: (protocol: NasaProtocol) => void;
}

export const AiMedicalOfficer: React.FC<AiMedicalOfficerProps> = ({
  vitals,
  status,
  readinessScore,
  cognitiveFatigueIndex,
  onOpenProtocol,
}) => {
  const [selectedConsultQuery, setSelectedConsultQuery] = useState('');
  const [consultationHistory, setConsultationHistory] = useState<
    { role: 'user' | 'agent'; text: string; time: string; protocolId?: string }[]
  >([
    {
      role: 'agent',
      text: 'Bio-Sentinel Medical Officer online (Zero-Latency Local Engine). Autonomous aerospace decision matrix synchronized with NASA Flight Surgeon Clinical Directives. Multi-factor telemetry monitoring active.',
      time: new Date().toLocaleTimeString(),
    },
  ]);
  const [isConsulting, setIsConsulting] = useState(false);

  // Quick prompt buttons
  const quickPrompts = [
    'Assess cognitive readiness for scheduled EVA airlock operations',
    'Evaluate acute SPE radiation exposure and storm shelter status',
    'Review microgravity musculoskeletal loss & ARED prescription',
    'Provide circadian rest and blue-depleted lighting schedule',
  ];

  const handleRunConsultation = (queryText: string) => {
    if (!queryText.trim()) return;

    const userEntry = {
      role: 'user' as const,
      text: queryText,
      time: new Date().toLocaleTimeString(),
    };
    setConsultationHistory(prev => [...prev, userEntry]);
    setSelectedConsultQuery('');
    setIsConsulting(true);

    setTimeout(() => {
      let responseText = '';
      let protocolId: string | undefined;

      const lower = queryText.toLowerCase();

      if (lower.includes('eva') || lower.includes('cognitive') || lower.includes('fatigue')) {
        if (vitals.sleepDuration < 5.0 || vitals.heartRate > 90 || cognitiveFatigueIndex > 50) {
          responseText = `CLINICAL FLIGHT SURGEON EVALUATION:\nHigh cognitive fatigue detected. Astronaut recorded only ${vitals.sleepDuration}h of sleep with elevated resting HR (${vitals.heartRate} BPM) and suppressed HRV (${vitals.hrvRmssd}ms). NASA aerospace risk modeling predicts a 4.2x elevated risk of procedural omission or tether mismanagement during depressurized EVA. High-risk checklist is strictly interlocked. Mandatory action: Complete 30-second PVT micro-test (Mean RT must be <355ms) or obtain Dual-Signoff waiver from Mission Commander.`;
          protocolId = 'PVT_EVA_INTERLOCK';
        } else {
          responseText = `CLINICAL FLIGHT SURGEON EVALUATION:\nCognitive status is within nominal parameters (Sleep: ${vitals.sleepDuration}h, HRV: ${vitals.hrvRmssd}ms, Fatigue Index: ${cognitiveFatigueIndex}%). Astronaut exhibits clear ocular saccades and nominal central nervous system vigilance. Recommendation: Cleared for scheduled EVA spacewalk preparation, maintaining standard 100% O2 pre-breathe protocol.`;
        }
      } else if (lower.includes('radiation') || lower.includes('spe') || lower.includes('shelter')) {
        if (vitals.dailyRadiation >= 1.0) {
          responseText = `CRITICAL RADIATION ADVISORY:\nDaily ionizing dose has reached ${vitals.dailyRadiation.toFixed(2)} mSv/day, exceeding the NASA acute Solar Particle Event (SPE) critical threshold. Spacecraft hull shielding is insufficient against high-energy solar proton flux. Mandatory action: Relocate astronaut Maya to Module Storm Haven immediately. Close outer bulkheads and deploy polyethylene water-wall shielding curtains.`;
          protocolId = 'STORM_HAVEN';
        } else if (vitals.dailyRadiation >= 0.6) {
          responseText = `ELEVATED RADIATION ADVISORY:\nDaily dose is at ${vitals.dailyRadiation.toFixed(2)} mSv/day (Elevated Warning). Coronal mass ejection front detected. Standoff protocol active. Limit work near outer cupola windows and prepare auxiliary shielding.`;
          protocolId = 'STORM_HAVEN';
        } else {
          responseText = `RADIATION STATUS NOMINAL:\nDaily dose is ${vitals.dailyRadiation.toFixed(2)} mSv/day. Cumulative mission total is ${vitals.cumulativeRadiation.toFixed(1)} mSv (well within NASA career career limit of 600 mSv). Background galactic cosmic rays (GCR) are within transit projections.`;
        }
      } else if (lower.includes('bone') || lower.includes('muscle') || lower.includes('ared') || lower.includes('exercise')) {
        responseText = `MUSCULOSKELETAL ASSESSMENT:\nCumulative microgravity bone mineral density loss is estimated at ${vitals.boneDensityLossPct}%, with muscle atrophy at ${vitals.muscleMassLossPct}%. Without countermeasure adherence, cancellous trabecular bone in the femoral head and calcaneus degrades at 1.0-1.5% per month. Prescription: Maintain 2.5h daily exercise protocol using ARED (75% 1-Rep Max for spinal axial loading) combined with T2 vibration-isolated treadmill and bisphosphonate regimen.`;
        protocolId = 'ARED_EXERCISE';
      } else {
        responseText = `GENERAL AEROSPACE CLINICAL ASSESSMENT:\nCurrent composite Mission Readiness is at ${readinessScore}%. Status: ${status}. Vitals: HR ${vitals.heartRate} BPM, SpO2 ${vitals.spo2}%, Core Temp ${vitals.temperature}°C, Cabin CO2 ${vitals.cabinCo2} ppm. Autonomous life support algorithms indicate all closed-loop ECLSS buffers are operating within aerospace flight specifications.`;
      }

      setConsultationHistory(prev => [
        ...prev,
        {
          role: 'agent',
          text: responseText,
          time: new Date().toLocaleTimeString(),
          protocolId,
        },
      ]);
      setIsConsulting(false);
    }, 600);
  };

  return (
    <div className="bg-[#0b0f1a] border border-slate-800 rounded-lg overflow-hidden flex flex-col shadow-sm">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-slate-800 bg-[#0e1424] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs uppercase font-mono font-bold tracking-wider text-slate-200">
            AI Medical Officer (Bio-Sentinel Agent)
          </h3>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
          <span className="hidden sm:inline">Diagnostic Mode:</span>
          <span className="text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded">
            Autonomous Local
          </span>
        </div>
      </div>

      {/* Real-time Multi-Factor Trend Summary */}
      <div className="p-3.5 bg-[#090d18] border-b border-slate-800 text-xs font-mono">
        <div className="flex items-center justify-between text-slate-300 mb-1.5">
          <span className="text-slate-400">Compound Multi-Factor Synthesis:</span>
          <span
            className={`font-bold ${
              status === 'CRITICAL'
                ? 'text-rose-400'
                : status === 'WARNING'
                ? 'text-amber-400'
                : 'text-emerald-400'
            }`}
          >
            {status === 'CRITICAL'
              ? 'Multi-Factor Emergency Risk'
              : status === 'WARNING'
              ? 'Multi-Factor Warning Drift'
              : 'Multi-Factor Homeostasis'}
          </span>
        </div>

        <p className="text-slate-300 leading-relaxed text-xs">
          {vitals.aiBehaviorAnalysis}
        </p>

        {/* Quick Prescribed NASA Protocols Carousel */}
        <div className="mt-3 pt-2.5 border-t border-slate-800 flex flex-wrap gap-2">
          <span className="text-[11px] text-slate-400 self-center">Actionable Protocols:</span>

          {vitals.dailyRadiation >= 0.6 && (
            <button
              type="button"
              onClick={() => onOpenProtocol(NASA_PROTOCOLS.STORM_HAVEN)}
              className="px-2.5 py-1 rounded bg-rose-950/80 hover:bg-rose-900 border border-rose-700 text-rose-200 text-xs flex items-center gap-1.5 transition-colors"
            >
              <BookOpen className="w-3 h-3 text-rose-400" />
              <span>NASA SPE-7: Storm Haven Shelter</span>
            </button>
          )}

          {cognitiveFatigueIndex > 40 && (
            <button
              type="button"
              onClick={() => onOpenProtocol(NASA_PROTOCOLS.PVT_EVA_INTERLOCK)}
              className="px-2.5 py-1 rounded bg-amber-950/80 hover:bg-amber-900 border border-amber-700 text-amber-200 text-xs flex items-center gap-1.5 transition-colors"
            >
              <BookOpen className="w-3 h-3 text-amber-400" />
              <span>NASA BEH-1: PVT & EVA Interlock</span>
            </button>
          )}

          {vitals.cabinCo2 > 4000 && (
            <button
              type="button"
              onClick={() => onOpenProtocol(NASA_PROTOCOLS.ECLSS_SCRUBBER)}
              className="px-2.5 py-1 rounded bg-purple-950/80 hover:bg-purple-900 border border-purple-700 text-purple-200 text-xs flex items-center gap-1.5 transition-colors"
            >
              <BookOpen className="w-3 h-3 text-purple-400" />
              <span>NASA ECLSS: CDRA Bypass</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onOpenProtocol(NASA_PROTOCOLS.ARED_EXERCISE)}
            className="px-2.5 py-1 rounded bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition-colors"
          >
            <BookOpen className="w-3 h-3 text-cyan-400" />
            <span>NASA ARED-T2: Resistance</span>
          </button>
        </div>
      </div>

      {/* Interactive Flight Surgeon Dialogue Feed */}
      <div className="p-3.5 max-h-56 overflow-y-auto space-y-2.5 text-xs">
        {consultationHistory.map((item, idx) => (
          <div
            key={idx}
            className={`p-2.5 rounded-lg border leading-relaxed ${
              item.role === 'user'
                ? 'bg-slate-800/80 border-slate-700 text-slate-100 ml-6'
                : 'bg-[#0e1627] border-cyan-900/60 text-slate-200 mr-4'
            }`}
          >
            <div className="flex items-center justify-between text-[10px] font-mono mb-1 text-slate-400">
              <span className="font-semibold text-cyan-400">
                {item.role === 'user' ? 'Astronaut Maya' : 'Bio-Sentinel Flight Surgeon'}
              </span>
              <span>{item.time}</span>
            </div>
            <p className="whitespace-pre-line text-[11px] sm:text-xs text-slate-200">{item.text}</p>

            {item.protocolId && NASA_PROTOCOLS[item.protocolId] && (
              <button
                type="button"
                onClick={() => onOpenProtocol(NASA_PROTOCOLS[item.protocolId!])}
                className="mt-2 text-[11px] font-mono text-cyan-300 hover:text-cyan-200 flex items-center gap-1 underline"
              >
                <span>View Full Protocol Checklist ({item.protocolId}) &gt;</span>
              </button>
            )}
          </div>
        ))}

        {isConsulting && (
          <div className="p-2.5 rounded-lg bg-[#0e1627] border border-cyan-900/60 text-xs text-cyan-300 font-mono animate-pulse">
            Bio-Sentinel Flight Surgeon analyzing multi-parameter telemetry vectors...
          </div>
        )}
      </div>

      {/* Quick Prompts Bar */}
      <div className="px-3.5 py-2 border-t border-slate-800 bg-[#090d16] flex flex-wrap gap-1.5">
        {quickPrompts.map((q, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleRunConsultation(q)}
            className="text-[11px] px-2 py-1 rounded bg-slate-800/90 hover:bg-slate-750 text-slate-300 hover:text-cyan-300 border border-slate-700/80 transition-colors text-left"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-2.5 border-t border-slate-800 bg-[#0d1322] flex gap-2">
        <input
          type="text"
          value={selectedConsultQuery}
          onChange={e => setSelectedConsultQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleRunConsultation(selectedConsultQuery)}
          placeholder="Query autonomous flight surgeon on clinical status..."
          className="flex-1 bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
        />
        <button
          type="button"
          onClick={() => handleRunConsultation(selectedConsultQuery)}
          className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-md text-xs font-semibold flex items-center gap-1 transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Consult</span>
        </button>
      </div>
    </div>
  );
};
