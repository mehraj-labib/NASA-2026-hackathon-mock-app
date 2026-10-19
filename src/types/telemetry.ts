export type HealthStatus = 'NORMAL' | 'WARNING' | 'CRITICAL';

export type SimulationMode =
  | 'NORMAL'
  | 'SOLAR_FLARE'
  | 'COGNITIVE_FATIGUE'
  | 'CABIN_CO2_SPIKE'
  | 'DECONDITIONING';

export interface BloodPressure {
  systolic: number;
  diastolic: number;
}

export interface VitalTelemetry {
  heartRate: number; // BPM
  spo2: number; // %
  temperature: number; // °C
  bloodPressure: BloodPressure; // mmHg
  dailyRadiation: number; // mSv/day (NASA limit: >0.6 warning, >1.0 critical)
  cumulativeRadiation: number; // mSv (NASA career/mission limit: 600 mSv)
  sleepDuration: number; // hours
  circadianPhase: number; // 0-24 hour cycle
  cabinCo2: number; // ppm (ISS nominal 2500-3800, warning >4200, critical >5500)
  boneDensityLossPct: number; // % estimated microgravity degradation
  muscleMassLossPct: number; // % estimated atrophy
  hrvRmssd: number; // ms (Heart rate variability)
  cognitiveFatigueIndex: number; // 0-100 compound fatigue score
  missionReadinessScore: number; // 0-100 compound readiness index
  aiBehaviorAnalysis: string;
  status: HealthStatus;
  warnings: string[];
  critical: string[];
  timestamp: string;
}

export interface AstronautProfile {
  id: string;
  name: string;
  role: string;
  mission: string;
  missionDay: number;
  bloodType: string;
  earthLagMinutes: number;
}

export interface HealthAlert {
  id: string;
  astronaut: string;
  status: HealthStatus;
  category: 'RADIATION' | 'CARDIOVASCULAR' | 'RESPIRATORY' | 'FATIGUE' | 'ENVIRONMENTAL' | 'MUSCULOSKELETAL';
  message: string;
  protocolTitle: string;
  protocolAction: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface PVTRecord {
  id: string;
  timestamp: string;
  trials: number[];
  meanRt: number;
  lapses: number;
  falseStarts: number;
  passed: boolean;
  crewOverride?: {
    approvedBy: string;
    reason: string;
    timestamp: string;
  };
}

export interface NasaProtocol {
  id: string;
  title: string;
  category: string;
  priority: 'ROUTINE' | 'ELEVATED' | 'IMMEDIATE';
  description: string;
  steps: string[];
}
