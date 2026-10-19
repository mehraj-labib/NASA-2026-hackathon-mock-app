import React, { useState, useEffect, useRef } from 'react';
import {
  Heart,
  Droplet,
  Thermometer,
  SunMedium,
  Moon,
  Wind,
  Activity,
  Shield,
  Clock,
  Radio,
  FileText,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import {
  AstronautProfile,
  HealthAlert,
  HealthStatus,
  NasaProtocol,
  PVTRecord,
  SimulationMode,
  VitalTelemetry,
} from './types/telemetry';
import {
  DEFAULT_ASTRONAUT,
  INITIAL_VITALS,
  NASA_PROTOCOLS,
  updateVitalsSimulation,
  evaluateDeterministicRules,
} from './utils/aerospace-medicine';
import { annunciator } from './utils/audio-annunciator';
import { TopTelemetryBar } from './components/TopTelemetryBar';
import { EmergencyBanner } from './components/EmergencyBanner';
import { VitalCard } from './components/VitalCard';
import { ScenarioControlPanel } from './components/ScenarioControlPanel';
import { PVTModal } from './components/PVTModal';
import { BehavioralVisionFeed } from './components/BehavioralVisionFeed';
import { AiMedicalOfficer } from './components/AiMedicalOfficer';
import { AlertHistoryDrawer } from './components/AlertHistoryDrawer';
import { EarthSyncModal } from './components/EarthSyncModal';
import { MissionChecklist } from './components/MissionChecklist';
import { ProtocolViewerModal } from './components/ProtocolViewerModal';

export default function App() {
  const [astronaut] = useState<AstronautProfile>(DEFAULT_ASTRONAUT);
  const [vitals, setVitals] = useState<VitalTelemetry>(INITIAL_VITALS);
  const [simulationMode, setSimulationMode] = useState<SimulationMode>('NORMAL');
  const [isClockRunning, setIsClockRunning] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(true);

  // Sparkline history buffers (last 16 points for each vital)
  const [hrHistory, setHrHistory] = useState<number[]>([70, 71, 70, 69, 70, 71, 72, 70]);
  const [spo2History, setSpo2History] = useState<number[]>([98, 98, 99, 98, 98, 97, 98, 98]);
  const [radHistory, setRadHistory] = useState<number[]>([0.14, 0.15, 0.15, 0.16, 0.14, 0.15]);
  const [tempHistory, setTempHistory] = useState<number[]>([36.7, 36.7, 36.8, 36.7, 36.6, 36.7]);
  const [co2History, setCo2History] = useState<number[]>([3200, 3240, 3220, 3260, 3250, 3230]);
  const [sleepHistory, setSleepHistory] = useState<number[]>([8.0, 8.0, 7.9, 8.0, 8.1, 8.0]);

  // Alerts state (initialized with localStorage or defaults, mirroring database.py)
  const [alerts, setAlerts] = useState<HealthAlert[]>(() => {
    try {
      const saved = localStorage.getItem('astropulse_alerts');
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return [
      {
        id: 'ALT-INIT-01',
        astronaut: 'Maya',
        status: 'NORMAL',
        category: 'ENVIRONMENTAL',
        message: 'Bio-Sentinel Telemetry initial handshake nominal. Baseline vitals calibrated.',
        protocolTitle: 'NASA FLIGHT-CHECK-0',
        protocolAction: 'Standard monitoring operational.',
        timestamp: new Date().toLocaleTimeString(),
        acknowledged: true,
      },
    ];
  });

  // PVT Record History & Checklist Gate State
  const [pvtRecords, setPvtRecords] = useState<PVTRecord[]>([]);
  const [pvtCleared, setPvtCleared] = useState<boolean>(true);

  // Modals & Drawers
  const [isPvtOpen, setIsPvtOpen] = useState(false);
  const [isAlertDrawerOpen, setIsAlertDrawerOpen] = useState(false);
  const [isEarthSyncOpen, setIsEarthSyncOpen] = useState(false);
  const [activeProtocolModal, setActiveProtocolModal] = useState<NasaProtocol | null>(null);

  // Track previous status to trigger acoustic tones & alerts on state change
  const prevStatusRef = useRef<HealthStatus>('NORMAL');
  const prevCriticalMsgRef = useRef<string>('');

  // Persist alerts to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('astropulse_alerts', JSON.stringify(alerts.slice(0, 50)));
    } catch {
      // Ignore storage errors in sandbox
    }
  }, [alerts]);

  // Main 1-Second Stateful Simulation Interval
  useEffect(() => {
    if (!isClockRunning) return;

    const intervalTime = Math.max(150, Math.round(1000 / playbackSpeed));

    const interval = setInterval(() => {
      setVitals(prev => {
        const next = updateVitalsSimulation(prev, simulationMode, 1);

        // Update history sparklines
        setHrHistory(h => [...h.slice(-15), next.heartRate]);
        setSpo2History(h => [...h.slice(-15), next.spo2]);
        setRadHistory(h => [...h.slice(-15), next.dailyRadiation]);
        setTempHistory(h => [...h.slice(-15), next.temperature]);
        setCo2History(h => [...h.slice(-15), next.cabinCo2]);
        setSleepHistory(h => [...h.slice(-15), next.sleepDuration]);

        // Evaluate deterministic rules and create alerts on critical/warning changes
        const evalResult = evaluateDeterministicRules(next);

        // Acoustic Annunciator on transitions
        if (evalResult.status === 'CRITICAL' && prevStatusRef.current !== 'CRITICAL') {
          annunciator.playCriticalKlaxon();
        } else if (evalResult.status === 'WARNING' && prevStatusRef.current === 'NORMAL') {
          annunciator.playCaution();
        }
        prevStatusRef.current = evalResult.status;

        // Auto-lock high-risk checklist if cognitive fatigue triggers
        if (evalResult.critical.some(c => c.includes('Cognitive Fatigue'))) {
          setPvtCleared(false);
        }

        // Check if there is a new critical alert message to record into log
        if (evalResult.alerts.length > 0) {
          const firstNew = evalResult.alerts[0];
          if (firstNew.message !== prevCriticalMsgRef.current) {
            prevCriticalMsgRef.current = firstNew.message;
            setAlerts(old => [
              {
                id: `ALT-${Date.now().toString(36).toUpperCase()}`,
                astronaut: firstNew.astronaut,
                status: firstNew.status,
                category: firstNew.category,
                message: firstNew.message,
                protocolTitle: firstNew.protocolTitle,
                protocolAction: firstNew.protocolAction,
                timestamp: new Date().toLocaleTimeString(),
                acknowledged: false,
              },
              ...old,
            ]);
          }
        }

        return next;
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [isClockRunning, playbackSpeed, simulationMode]);

  // Handle Scenario Mode Switching
  const handleSelectMode = (mode: SimulationMode) => {
    setSimulationMode(mode);
    setIsClockRunning(true);

    if (mode === 'NORMAL') {
      // Reset critical messages reference so baseline can be reached cleanly
      prevCriticalMsgRef.current = '';
    } else if (mode === 'SOLAR_FLARE') {
      // Rapid feedback for judges
      annunciator.playCaution();
    } else if (mode === 'COGNITIVE_FATIGUE') {
      setPvtCleared(false);
    }
  };

  // Manual Tuning Override from sliders
  const handleManualOverride = (partial: Partial<VitalTelemetry>) => {
    setVitals(prev => {
      const updated = { ...prev, ...partial };
      const evalRes = evaluateDeterministicRules(updated);
      return {
        ...updated,
        status: evalRes.status,
        warnings: evalRes.warnings,
        critical: evalRes.critical,
      };
    });
  };

  // Alert Management (Mirroring Flask/SQLite API)
  const handleAcknowledgeAlert = (id: string) => {
    setAlerts(prev =>
      prev.map(a => (a.id === id ? { ...a, acknowledged: true } : a))
    );
  };

  const handleAcknowledgeAllAlerts = () => {
    setAlerts(prev => prev.map(a => ({ ...a, acknowledged: true })));
  };

  const handleClearAllAlerts = () => {
    setAlerts([]);
  };

  // PVT Test Completion Handler
  const handlePvtComplete = (record: PVTRecord) => {
    setPvtRecords(prev => [record, ...prev]);
    if (record.passed || record.crewOverride) {
      setPvtCleared(true);
    } else {
      setPvtCleared(false);
    }
  };

  const activeAlertCount = alerts.filter(a => !a.acknowledged).length;

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col pb-24 font-sans antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* 1. Top Aerospace Telemetry Bar */}
      <TopTelemetryBar
        astronaut={astronaut}
        status={vitals.status}
        readinessScore={vitals.missionReadinessScore}
        activeAlertCount={activeAlertCount}
        isMuted={isMuted}
        onToggleMute={() => {
          const next = !isMuted;
          setIsMuted(next);
          annunciator.setMuted(next);
        }}
        onOpenAlerts={() => setIsAlertDrawerOpen(true)}
        onOpenEarthSync={() => setIsEarthSyncOpen(true)}
        onOpenPvt={() => setIsPvtOpen(true)}
      />

      {/* 2. Prominent Emergency Alert Banner (when Warning or Critical) */}
      <EmergencyBanner
        status={vitals.status}
        criticalMessages={vitals.critical}
        warningMessages={vitals.warnings}
        dailyRadiation={vitals.dailyRadiation}
        onOpenStormHaven={() => setActiveProtocolModal(NASA_PROTOCOLS.STORM_HAVEN)}
        onOpenPvt={() => setIsPvtOpen(true)}
      />

      {/* 3. Main Dashboard Workspace Container */}
      <main className="max-w-7xl mx-auto w-full px-4 lg:px-6 py-5 flex-1 flex flex-col gap-6">
        {/* Mission Status Header Sub-Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-slate-400">
            <span>VESSEL: <strong className="text-slate-200">ARES-IV MTV</strong></span>
            <span aria-hidden="true" className="text-slate-700">·</span>
            <span>TRAJECTORY: <strong className="text-slate-200">Earth-Mars Hohmann Transfer</strong></span>
            <span aria-hidden="true" className="text-slate-700">·</span>
            <span>DISTANCE FROM EARTH: <strong className="text-slate-200 tabular-nums">1.42 AU (212M km)</strong></span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-400">Sim Mode:</span>
            <span className="font-bold text-cyan-400 bg-slate-900 border border-slate-700 px-2 py-0.5 rounded">
              {simulationMode}
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-400 tabular-nums">Tick: 1s</span>
          </div>
        </div>

        {/* 4. Core Primary Vitals Telemetry Grid (8 Medical & Environmental Indicators) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs uppercase font-mono font-bold tracking-wider text-slate-400 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>Astronaut Maya - Primary Physiological & Environmental Telemetry</span>
            </h2>
            <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
              1-Second Micro-Fluctuation Telemetry Engine
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. Heart Rate */}
            <VitalCard
              label="Heart Rate"
              value={vitals.heartRate}
              unit="BPM"
              secondaryLabel="HRV (RMSSD)"
              secondaryValue={`${vitals.hrvRmssd} ms`}
              nominalRange="60 - 95 BPM"
              status={vitals.heartRate > 120 ? 'CRITICAL' : vitals.heartRate > 100 || vitals.heartRate < 48 ? 'WARNING' : 'NORMAL'}
              history={hrHistory}
              icon={<Heart className="w-4 h-4 text-rose-400" />}
            />

            {/* 2. Blood Oxygenation (SpO2) */}
            <VitalCard
              label="Blood Oxygen (SpO2)"
              value={vitals.spo2}
              unit="%"
              secondaryLabel="ppO2 Cabin"
              secondaryValue="148 mmHg"
              nominalRange="95 - 99 %"
              status={vitals.spo2 < 90 ? 'CRITICAL' : vitals.spo2 < 95 ? 'WARNING' : 'NORMAL'}
              history={spo2History}
              icon={<Droplet className="w-4 h-4 text-cyan-400" />}
            />

            {/* 3. Daily Radiation Dose (Core Spec Requirement) */}
            <VitalCard
              label="Daily Radiation Dose"
              value={vitals.dailyRadiation.toFixed(2)}
              unit="mSv/day"
              secondaryLabel="Mission Total"
              secondaryValue={`${vitals.cumulativeRadiation.toFixed(1)} mSv`}
              nominalRange="< 0.6 mSv"
              status={vitals.dailyRadiation >= 1.0 ? 'CRITICAL' : vitals.dailyRadiation >= 0.6 ? 'WARNING' : 'NORMAL'}
              history={radHistory}
              icon={<SunMedium className="w-4 h-4 text-amber-400" />}
            />

            {/* 4. Core Body Temperature */}
            <VitalCard
              label="Core Temperature"
              value={vitals.temperature.toFixed(1)}
              unit="°C"
              secondaryLabel="Equiv"
              secondaryValue={`${((vitals.temperature * 9) / 5 + 32).toFixed(1)}°F`}
              nominalRange="36.4 - 37.4 °C"
              status={vitals.temperature > 38.5 ? 'CRITICAL' : vitals.temperature > 37.5 ? 'WARNING' : 'NORMAL'}
              history={tempHistory}
              icon={<Thermometer className="w-4 h-4 text-orange-400" />}
            />

            {/* 5. Sleep Duration & Circadian Phase */}
            <VitalCard
              label="Sleep (Last 24h)"
              value={vitals.sleepDuration.toFixed(1)}
              unit="HRS"
              secondaryLabel="Circadian Phase"
              secondaryValue="T+14:12 MET"
              nominalRange="7.0 - 8.5 hrs"
              status={vitals.sleepDuration < 5.0 && vitals.heartRate > 90 ? 'CRITICAL' : vitals.sleepDuration < 6.0 ? 'WARNING' : 'NORMAL'}
              history={sleepHistory}
              icon={<Moon className="w-4 h-4 text-indigo-400" />}
            />

            {/* 6. Cabin CO2 (Closed-Loop Life Support) */}
            <VitalCard
              label="Cabin CO2 (ECLSS)"
              value={vitals.cabinCo2}
              unit="PPM"
              secondaryLabel="CDRA Scrub Bed"
              secondaryValue="Cycle A (Nominal)"
              nominalRange="< 4200 ppm"
              status={vitals.cabinCo2 > 5500 ? 'CRITICAL' : vitals.cabinCo2 > 4200 ? 'WARNING' : 'NORMAL'}
              history={co2History}
              icon={<Wind className="w-4 h-4 text-teal-400" />}
            />

            {/* 7. Blood Pressure */}
            <VitalCard
              label="Blood Pressure"
              value={`${vitals.bloodPressure.systolic}/${vitals.bloodPressure.diastolic}`}
              unit="mmHg"
              secondaryLabel="Mean Arterial (MAP)"
              secondaryValue={`${Math.round(vitals.bloodPressure.diastolic + (vitals.bloodPressure.systolic - vitals.bloodPressure.diastolic) / 3)} mmHg`}
              nominalRange="110-125 / 70-80"
              status={vitals.bloodPressure.systolic > 140 ? 'WARNING' : 'NORMAL'}
              icon={<Activity className="w-4 h-4 text-emerald-400" />}
            />

            {/* 8. Bone & Muscle Atrophy Model */}
            <VitalCard
              label="Musculoskeletal Degradation"
              value={vitals.boneDensityLossPct.toFixed(2)}
              unit="% BMD"
              secondaryLabel="Soleus Muscle Atrophy"
              secondaryValue={`${vitals.muscleMassLossPct.toFixed(2)}%`}
              nominalRange="< 2.5% loss"
              status={vitals.boneDensityLossPct > 3.0 ? 'WARNING' : 'NORMAL'}
              icon={<Shield className="w-4 h-4 text-violet-400" />}
            />
          </div>
        </div>

        {/* 5. Asymmetric Split Console: Behavioral Vision & Safety Interlock (Left) vs AI Medical Officer (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Vision/Posture Tracking & Safety Checklist Gate (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            {/* Vision & Behavioral Posture Tracking */}
            <BehavioralVisionFeed
              status={vitals.status}
              cognitiveFatigueIndex={vitals.cognitiveFatigueIndex}
              onTriggerPvtSuggest={() => setIsPvtOpen(true)}
            />

            {/* High-Risk Mission Checklist with Safety Interlock */}
            <MissionChecklist
              pvtStatus={{
                cleared: pvtCleared,
                lastRecord: pvtRecords[0] || null,
              }}
              onLaunchPvt={() => setIsPvtOpen(true)}
            />
          </div>

          {/* Right Column: AI Medical Officer Clinical Decision Support (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            <AiMedicalOfficer
              vitals={vitals}
              status={vitals.status}
              readinessScore={vitals.missionReadinessScore}
              cognitiveFatigueIndex={vitals.cognitiveFatigueIndex}
              onOpenProtocol={proto => setActiveProtocolModal(proto)}
            />

            {/* Aerospace Flight Surgeon Clinical Reference Notes */}
            <div className="bg-[#0b0f1a] border border-slate-800 rounded-lg p-4 text-xs font-mono">
              <h3 className="font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                <span>Aerospace Flight Surgeon Threshold Boundaries</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-400 text-[11px] leading-relaxed">
                <div>
                  <strong className="text-slate-300">Radiation Limit:</strong> Daily warning at 0.6 mSv; Critical at 1.0 mSv/day triggers mandatory Storm Haven shelter. NASA Career limit is 600 mSv.
                </div>
                <div>
                  <strong className="text-slate-300">Cognitive Fatigue:</strong> Sleep &lt; 5.0h + resting HR &gt; 90 BPM triggers PVT micro-test interlock to prevent EVA tether/procedural failure.
                </div>
                <div>
                  <strong className="text-slate-300">ECLSS Hypercapnia:</strong> Cabin CO2 &gt; 4,200 ppm requires scrubber recirculation; &gt; 5,500 ppm brings acute cognitive slowing.
                </div>
                <div>
                  <strong className="text-slate-300">Zero-Earth Comms:</strong> Mars-Earth 14m speed-of-light delay mandates 100% onboard local diagnostics with burst sync.
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 6. Fixed Bottom Scenario Control Panel (Core Hackathon Requirement) */}
      <ScenarioControlPanel
        currentMode={simulationMode}
        onSelectMode={handleSelectMode}
        isRunning={isClockRunning}
        onToggleRunning={() => setIsClockRunning(!isClockRunning)}
        playbackSpeed={playbackSpeed}
        onSetSpeed={speed => setPlaybackSpeed(speed)}
        vitals={vitals}
        onManualOverride={handleManualOverride}
      />

      {/* 7. Interactive PVT Test Modal */}
      <PVTModal
        isOpen={isPvtOpen}
        onClose={() => setIsPvtOpen(false)}
        onTestComplete={handlePvtComplete}
        lastRecord={pvtRecords[0] || null}
      />

      {/* 8. Alert History Drawer */}
      <AlertHistoryDrawer
        isOpen={isAlertDrawerOpen}
        onClose={() => setIsAlertDrawerOpen(false)}
        alerts={alerts}
        onAcknowledge={handleAcknowledgeAlert}
        onAcknowledgeAll={handleAcknowledgeAllAlerts}
        onClearAll={handleClearAllAlerts}
      />

      {/* 9. Earth Ground Control Sync Packet Modal */}
      <EarthSyncModal
        isOpen={isEarthSyncOpen}
        onClose={() => setIsEarthSyncOpen(false)}
        astronaut={astronaut}
        vitals={vitals}
        alerts={alerts}
        pvtRecords={pvtRecords}
      />

      {/* 10. NASA Protocol Viewer Modal */}
      <ProtocolViewerModal
        isOpen={activeProtocolModal !== null}
        onClose={() => setActiveProtocolModal(null)}
        protocol={activeProtocolModal}
      />
    </div>
  );
}
