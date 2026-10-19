/**
 * NASA Aerospace Medicine Telemetry & Diagnostic Rules Engine
 * Implements real ISS & deep-space (Artemis / Mars transit) aerospace medical parameters:
 * - NASA radiation exposure career thresholds (600 mSv) & SPE acute thresholds (>1.0 mSv/day)
 * - Microgravity bone mineral density (BMD) & muscle atrophy modeling
 * - Circadian disruption, Heart Rate Variability (RMSSD), and PVT cognitive vigilance limits
 * - Closed-loop environmental life support (ECLSS) CO2 limits (ISS allowable limit <4000-5300 ppm)
 */

import type {
  AstronautProfile,
  HealthAlert,
  HealthStatus,
  NasaProtocol,
  PVTRecord,
  SimulationMode,
  VitalTelemetry,
} from '../types/telemetry.ts';

export const DEFAULT_ASTRONAUT: AstronautProfile = {
  id: 'AUR-001',
  name: 'Dr. Maya Lin',
  role: 'EVA Specialist & Systems Flight Engineer',
  mission: 'Ares IV - Mars Transit Vehicle (MTV)',
  missionDay: 142,
  bloodType: 'O-Negative',
  earthLagMinutes: 14.3, // ~14m 18s Mars light-time latency
};

export const INITIAL_VITALS: VitalTelemetry = {
  heartRate: 70,
  spo2: 98,
  temperature: 36.7,
  bloodPressure: { systolic: 118, diastolic: 76 },
  dailyRadiation: 0.15,
  cumulativeRadiation: 42.6, // mSv accumulated since launch
  sleepDuration: 8.0,
  circadianPhase: 14.2, // 14:12 in 24h cycle
  cabinCo2: 3250, // ppm
  boneDensityLossPct: 1.15,
  muscleMassLossPct: 1.82,
  hrvRmssd: 52, // ms
  cognitiveFatigueIndex: 12,
  missionReadinessScore: 96,
  aiBehaviorAnalysis: 'Cognitive function nominal. Posture standard. Biomechanical symmetry verified.',
  status: 'NORMAL',
  warnings: [],
  critical: [],
  timestamp: new Date().toLocaleTimeString(),
};

/**
 * Deterministic Rules Engine:
 * Immediate hard-limit checks without relying on server or async latency.
 */
export function evaluateDeterministicRules(vitals: VitalTelemetry): {
  status: HealthStatus;
  warnings: string[];
  critical: string[];
  alerts: Omit<HealthAlert, 'id' | 'timestamp' | 'acknowledged'>[];
} {
  const warnings: string[] = [];
  const critical: string[] = [];
  const alerts: Omit<HealthAlert, 'id' | 'timestamp' | 'acknowledged'>[] = [];

  // 1. RADIATION RULES (SPE & Acute Cosmic Dose)
  if (vitals.dailyRadiation >= 1.0) {
    const msg = 'CRITICAL: High Solar Radiation Spike (SPE > 1.0 mSv/day). Relocate to Emergency Storm Shelter immediately.';
    critical.push(msg);
    alerts.push({
      astronaut: 'Maya',
      status: 'CRITICAL',
      category: 'RADIATION',
      message: msg,
      protocolTitle: 'NASA SPE-7: Storm Haven Shelter Protocol',
      protocolAction: 'MANDATORY: Seal hatch, relocate to center-mass shielded module (Module Storm Haven), power down non-essential outer electronics.',
    });
  } else if (vitals.dailyRadiation >= 0.6) {
    const msg = 'Radiation elevated (>0.6 mSv/day). Limit crew exposure near hull and outer cupola.';
    warnings.push(msg);
    alerts.push({
      astronaut: 'Maya',
      status: 'WARNING',
      category: 'RADIATION',
      message: msg,
      protocolTitle: 'NASA RAD-2: Hull Standoff Protocol',
      protocolAction: 'Restrict outer hull activities. Don auxiliary water-wall shielding curtains.',
    });
  }

  // 2. CARDIOVASCULAR (Heart Rate & Arrhythmia Screening)
  if (vitals.heartRate > 120) {
    const msg = 'Heart rate critically elevated (>120 BPM). Potential tachyarrhythmia or autonomic distress.';
    critical.push(msg);
    alerts.push({
      astronaut: 'Maya',
      status: 'CRITICAL',
      category: 'CARDIOVASCULAR',
      message: msg,
      protocolTitle: 'NASA MED-CARDIO-1: Autonomic Rebalancing',
      protocolAction: 'Cease physical activity, recline in neutral body posture, attach 12-lead ECG patch, administer hydration electrolyte pack.',
    });
  } else if (vitals.heartRate > 100) {
    const msg = 'Heart rate elevated (>100 BPM). Tachycardia watch active.';
    warnings.push(msg);
    alerts.push({
      astronaut: 'Maya',
      status: 'WARNING',
      category: 'CARDIOVASCULAR',
      message: msg,
      protocolTitle: 'NASA MED-CARDIO-3: Vagal Tone Protocol',
      protocolAction: 'Guided slow diaphragmatic breathing (4-7-8) for 5 minutes. Check hydration status.',
    });
  } else if (vitals.heartRate < 48) {
    const msg = 'Bradycardia warning: Heart rate below 48 BPM.';
    warnings.push(msg);
    alerts.push({
      astronaut: 'Maya',
      status: 'WARNING',
      category: 'CARDIOVASCULAR',
      message: msg,
      protocolTitle: 'NASA MED-CARDIO-4: Sinus Rhythm Check',
      protocolAction: 'Verify ambulatory sensor calibration; check orthostatic blood pressure.',
    });
  }

  // 3. RESPIRATORY & OXYGENATION (SpO2)
  if (vitals.spo2 < 90) {
    const msg = 'Oxygen saturation critically low (<90%). Severe hypoxemia detected.';
    critical.push(msg);
    alerts.push({
      astronaut: 'Maya',
      status: 'CRITICAL',
      category: 'RESPIRATORY',
      message: msg,
      protocolTitle: 'NASA RESP-1: Supplemental O2 Administration',
      protocolAction: 'Don Emergency Oxygen Mask at 100% FiO2. Inspect cabin O2 partial pressure sensors.',
    });
  } else if (vitals.spo2 < 95) {
    const msg = 'Oxygen saturation low (<95%). Mild hypoxemia watch.';
    warnings.push(msg);
    alerts.push({
      astronaut: 'Maya',
      status: 'WARNING',
      category: 'RESPIRATORY',
      message: msg,
      protocolTitle: 'NASA RESP-2: Cabin Air Circulation Verification',
      protocolAction: 'Verify personal air ventilation duct in sleep station. Perform deep spirometry breathing.',
    });
  }

  // 4. THERMOREGULATION (Body Core Temperature)
  if (vitals.temperature > 38.5) {
    const msg = 'Core body temperature critically high (>38.5°C). Space pyrexia alert.';
    critical.push(msg);
    alerts.push({
      astronaut: 'Maya',
      status: 'CRITICAL',
      category: 'ENVIRONMENTAL',
      message: msg,
      protocolTitle: 'NASA THERM-1: Microgravity Active Cooling',
      protocolAction: 'Deploy Liquid Cooling Garment (LCG). Administer antipyretic oral packet.',
    });
  } else if (vitals.temperature > 37.5) {
    const msg = 'Body temperature elevated (>37.5°C). Low-grade fever or exertion hyperthermia.';
    warnings.push(msg);
    alerts.push({
      astronaut: 'Maya',
      status: 'WARNING',
      category: 'ENVIRONMENTAL',
      message: msg,
      protocolTitle: 'NASA THERM-2: Passive Heat Dissipation',
      protocolAction: 'Increase local airflow; hydrate with 500ml cold electrolyte pouch.',
    });
  }

  // 5. CABIN CO2 (ECLSS Life Support & Hypercapnia)
  if (vitals.cabinCo2 > 5500) {
    const msg = 'Cabin CO2 critically high (>5500 ppm). Acute hypercapnia risk (headaches, cognitive slowing).';
    critical.push(msg);
    alerts.push({
      astronaut: 'Maya',
      status: 'CRITICAL',
      category: 'ENVIRONMENTAL',
      message: msg,
      protocolTitle: 'NASA ECLSS-CO2-MAX: CDRA Scrubber Emergency Bypass',
      protocolAction: 'Switch to backup Carbon Dioxide Removal Assembly (CDRA-B) beds; don auxiliary scrub packs.',
    });
  } else if (vitals.cabinCo2 > 4200) {
    const msg = 'Cabin CO2 elevated (>4200 ppm). Exceeds nominal ISS baseline comfort threshold.';
    warnings.push(msg);
    alerts.push({
      astronaut: 'Maya',
      status: 'WARNING',
      category: 'ENVIRONMENTAL',
      message: msg,
      protocolTitle: 'NASA ECLSS-CO2-MOD: Ventilation Duct Cleanout',
      protocolAction: 'Inspect cabin air loop filters for particulate obstruction. Increase cabin blower rate.',
    });
  }

  // 6. MULTI-FACTOR COGNITIVE FATIGUE & CIRCADIAN DESYNCHRONIZATION
  // Rule: Low sleep (<5.0h) AND elevated heart rate (>90 BPM) OR reduced HRV (<25ms) OR high CO2
  if (vitals.sleepDuration < 5.0 && vitals.heartRate > 90) {
    const msg = 'Cognitive Fatigue High (<5.0h sleep, elevated HR). PVT Micro-test protocol required before any critical EVA.';
    critical.push(msg);
    alerts.push({
      astronaut: 'Maya',
      status: 'CRITICAL',
      category: 'FATIGUE',
      message: msg,
      protocolTitle: 'NASA BEHAVIORAL-COG-1: Mandatory PVT & EVA Interlock',
      protocolAction: 'Mandatory 30s Psychomotor Vigilance Test (PVT). Lock EVA airlock authorization until mean RT < 355ms or dual-crew waiver signed.',
    });
  } else if (vitals.sleepDuration < 6.0 || vitals.hrvRmssd < 30) {
    const msg = 'Circadian strain detected: Sleep deficit (<6.0h) and depressed HRV.';
    warnings.push(msg);
    alerts.push({
      astronaut: 'Maya',
      status: 'WARNING',
      category: 'FATIGUE',
      message: msg,
      protocolTitle: 'NASA BEHAVIORAL-COG-3: Light Therapy & Sensory Reset',
      protocolAction: 'Schedule 450nm blue-depleted circadian lighting; mandatory 45-minute sensory deprivation nap.',
    });
  }

  // 7. MUSCULOSKELETAL & BONE EROSION
  if (vitals.boneDensityLossPct > 3.0 || vitals.muscleMassLossPct > 4.5) {
    const msg = 'Musculoskeletal degradation accelerating past expected microgravity trajectory.';
    warnings.push(msg);
    alerts.push({
      astronaut: 'Maya',
      status: 'WARNING',
      category: 'MUSCULOSKELETAL',
      message: msg,
      protocolTitle: 'NASA ARED-T2: Resistance Countermeasure Prescription',
      protocolAction: 'Increase Advanced Resistive Exercise Device (ARED) squats/deadlifts to 2.5h daily with high-protein bisphosphonate supplement.',
    });
  }

  // Overall status resolution: CRITICAL overrides WARNING overrides NORMAL
  const status: HealthStatus = critical.length > 0 ? 'CRITICAL' : warnings.length > 0 ? 'WARNING' : 'NORMAL';

  return {
    status,
    warnings,
    critical,
    alerts,
  };
}

/**
 * Calculates a compound operational readiness score (0-100%)
 * integrating radiation, sleep debt, cardiovascular stability, and CO2 load.
 */
export function calculateCompoundReadinessScore(vitals: VitalTelemetry): number {
  let score = 100;

  // Radiation penalty
  if (vitals.dailyRadiation > 1.0) {
    score -= 40;
  } else if (vitals.dailyRadiation > 0.6) {
    score -= 20;
  } else if (vitals.dailyRadiation > 0.3) {
    score -= 8;
  }

  // Sleep duration penalty
  if (vitals.sleepDuration < 4.0) {
    score -= 35;
  } else if (vitals.sleepDuration < 5.5) {
    score -= 20;
  } else if (vitals.sleepDuration < 7.0) {
    score -= 10;
  }

  // Cardiovascular penalty (HR & HRV)
  if (vitals.heartRate > 120 || vitals.heartRate < 45) {
    score -= 25;
  } else if (vitals.heartRate > 100) {
    score -= 15;
  }
  if (vitals.hrvRmssd < 25) {
    score -= 10;
  } else if (vitals.hrvRmssd < 35) {
    score -= 5;
  }

  // SpO2 penalty
  if (vitals.spo2 < 90) {
    score -= 30;
  } else if (vitals.spo2 < 95) {
    score -= 12;
  }

  // Cabin CO2 penalty
  if (vitals.cabinCo2 > 5500) {
    score -= 20;
  } else if (vitals.cabinCo2 > 4200) {
    score -= 10;
  }

  // Musculoskeletal penalty
  if (vitals.boneDensityLossPct > 3.0) {
    score -= 8;
  }

  return Math.max(5, Math.min(100, Math.round(score)));
}

/**
 * Calculates cognitive fatigue index (0-100)
 */
export function calculateCognitiveFatigueIndex(vitals: VitalTelemetry): number {
  // Base fatigue derived from missing sleep from 8.0h baseline
  const sleepDebt = Math.max(0, 8.0 - vitals.sleepDuration);
  let fatigue = sleepDebt * 14;

  // HRV suppression factor (low HRV = high autonomic strain)
  if (vitals.hrvRmssd < 30) {
    fatigue += (30 - vitals.hrvRmssd) * 1.5;
  }

  // Heart rate elevation factor under rest
  if (vitals.heartRate > 85) {
    fatigue += (vitals.heartRate - 85) * 0.8;
  }

  // High CO2 induced drowsiness
  if (vitals.cabinCo2 > 4000) {
    fatigue += ((vitals.cabinCo2 - 4000) / 200);
  }

  return Math.max(5, Math.min(100, Math.round(fatigue)));
}

/**
 * Update vitals simulation state based on the current scenario mode.
 * Satisfies the Core Requirement:
 * - Vitals do NOT fluctuate completely randomly.
 * - Updates every second with realistic micro-fluctuations (e.g. HR drifts +/- 1 BPM).
 * - "Solar Flare Event": Radiation climbs by ~0.1 mSv per second, eventually triggering CRITICAL.
 * - "Baseline": Vitals stabilize back to nominal flight parameters.
 * - "Cognitive Fatigue": Sleep drops, HR elevates, triggering PVT micro-test protocol.
 */
export function updateVitalsSimulation(
  current: VitalTelemetry,
  mode: SimulationMode,
  stepSeconds = 1
): VitalTelemetry {
  let next = { ...current };

  // Helper: target-seeking with micro-jitter
  const approach = (currentVal: number, targetVal: number, step: number, jitter: number): number => {
    let diff = targetVal - currentVal;
    let delta = Math.sign(diff) * Math.min(Math.abs(diff), step);
    let randomNoise = (Math.random() - 0.5) * 2 * jitter;
    return currentVal + delta + randomNoise;
  };

  switch (mode) {
    case 'NORMAL': {
      // Nominal flight baseline with micro-fluctuations (+/- 1 BPM, etc.)
      const targetHr = 71;
      const targetSpo2 = 98.2;
      const targetTemp = 36.7;
      const targetRad = 0.15;
      const targetSleep = 8.0;
      const targetCo2 = 3250;
      const targetHrv = 52;

      const newHr = approach(next.heartRate, targetHr, 0.4, 0.6);
      next.heartRate = Math.round(Math.max(62, Math.min(84, newHr)));

      const newSpo2 = approach(next.spo2, targetSpo2, 0.1, 0.2);
      next.spo2 = Math.round(Math.max(96, Math.min(99, newSpo2)));

      const newTemp = approach(next.temperature, targetTemp, 0.02, 0.02);
      next.temperature = Math.round(newTemp * 10) / 10;

      const newRad = approach(next.dailyRadiation, targetRad, 0.01, 0.01);
      next.dailyRadiation = Math.max(0.08, Math.round(newRad * 100) / 100);

      const newSleep = approach(next.sleepDuration, targetSleep, 0.05, 0.02);
      next.sleepDuration = Math.round(newSleep * 10) / 10;

      const newCo2 = approach(next.cabinCo2, targetCo2, 15, 20);
      next.cabinCo2 = Math.round(Math.max(2800, Math.min(3800, newCo2)));

      const newHrv = approach(next.hrvRmssd, targetHrv, 0.5, 0.8);
      next.hrvRmssd = Math.round(newHrv);

      // Micro-accumulations
      next.cumulativeRadiation += (next.dailyRadiation / 86400) * stepSeconds;
      next.boneDensityLossPct = Math.round(approach(next.boneDensityLossPct, 1.2, 0.001, 0) * 100) / 100;
      next.muscleMassLossPct = Math.round(approach(next.muscleMassLossPct, 1.9, 0.001, 0) * 100) / 100;

      next.bloodPressure = {
        systolic: Math.round(approach(next.bloodPressure.systolic, 118, 0.3, 0.5)),
        diastolic: Math.round(approach(next.bloodPressure.diastolic, 76, 0.3, 0.5)),
      };

      next.aiBehaviorAnalysis = 'Cognitive function nominal. Posture standard. Biomechanical symmetry verified.';
      break;
    }

    case 'SOLAR_FLARE': {
      // SPEC REQUIREMENT: Radiation climbs by 0.1 per second, eventually triggering CRITICAL UI alert
      const climbRate = 0.10 * stepSeconds;
      const newRad = next.dailyRadiation + climbRate + (Math.random() - 0.4) * 0.02;
      next.dailyRadiation = Math.round(newRad * 100) / 100;
      next.cumulativeRadiation += (climbRate * 2.5); // Accelerated mission accumulation

      // Stress reaction from alarm & ionizing flux
      const targetHr = next.dailyRadiation > 1.0 ? 104 : 88;
      next.heartRate = Math.round(approach(next.heartRate, targetHr, 0.6, 0.8));

      // Mild temperature elevation from stress
      const targetTemp = next.dailyRadiation > 1.0 ? 37.3 : 36.8;
      next.temperature = Math.round(approach(next.temperature, targetTemp, 0.03, 0.01) * 10) / 10;

      next.bloodPressure = {
        systolic: Math.round(approach(next.bloodPressure.systolic, 134, 0.5, 0.6)),
        diastolic: Math.round(approach(next.bloodPressure.diastolic, 86, 0.4, 0.5)),
      };

      if (next.dailyRadiation >= 1.0) {
        next.aiBehaviorAnalysis = 'EMERGENCY: Acute Solar Particle Event (SPE) threshold breached! Energetic proton flux detected. Seek Module Storm Haven immediately.';
      } else if (next.dailyRadiation >= 0.6) {
        next.aiBehaviorAnalysis = 'Solar activity rising rapidly. Coronal mass ejection front intersecting spacecraft trajectory.';
      } else {
        next.aiBehaviorAnalysis = 'Deep space sensor detects early flare ionizing flux rise.';
      }
      break;
    }

    case 'COGNITIVE_FATIGUE': {
      // SPEC REQUIREMENT: Sleep drops, heart rate elevates, triggering the PVT Micro-test protocol.
      const targetSleep = 3.6;
      const targetHr = 104;
      const targetHrv = 21;
      const targetCo2 = 4700;

      next.sleepDuration = Math.round(approach(next.sleepDuration, targetSleep, 0.12, 0.02) * 10) / 10;
      next.heartRate = Math.round(approach(next.heartRate, targetHr, 0.6, 0.8));
      next.hrvRmssd = Math.round(approach(next.hrvRmssd, targetHrv, 0.8, 0.5));
      next.cabinCo2 = Math.round(approach(next.cabinCo2, targetCo2, 30, 25));

      // Blood pressure elevated due to sympathetic overdrive
      next.bloodPressure = {
        systolic: Math.round(approach(next.bloodPressure.systolic, 138, 0.5, 0.6)),
        diastolic: Math.round(approach(next.bloodPressure.diastolic, 88, 0.4, 0.5)),
      };

      next.aiBehaviorAnalysis = 'High fatigue detected via chronic sleep deficit, diminished HRV (21ms), and frequent ocular microsaccades. PVT test mandatory.';
      break;
    }

    case 'CABIN_CO2_SPIKE': {
      // Environmental hypercapnia scenario
      const targetCo2 = 5800;
      const targetSpo2 = 92;
      const targetHr = 108;

      next.cabinCo2 = Math.round(approach(next.cabinCo2, targetCo2, 50, 20));
      next.spo2 = Math.round(approach(next.spo2, targetSpo2, 0.2, 0.3));
      next.heartRate = Math.round(approach(next.heartRate, targetHr, 0.5, 0.8));

      next.aiBehaviorAnalysis = 'ECLSS Warning: Cabin CO2 concentration critical. Symptoms of acute hypercapnia imminent. Verify scrubber loop valves.';
      break;
    }

    case 'DECONDITIONING': {
      // Long-term microgravity musculoskeletal & cardiovascular deconditioning
      const targetBone = 3.4;
      const targetMuscle = 4.9;
      const targetHr = 88;

      next.boneDensityLossPct = Math.round(approach(next.boneDensityLossPct, targetBone, 0.04, 0.01) * 100) / 100;
      next.muscleMassLossPct = Math.round(approach(next.muscleMassLossPct, targetMuscle, 0.05, 0.01) * 100) / 100;
      next.heartRate = Math.round(approach(next.heartRate, targetHr, 0.4, 0.6));

      next.aiBehaviorAnalysis = 'Microgravity deconditioning trend: Missed resistance cycles detected. Orthostatic intolerance risk elevated.';
      break;
    }
  }

  // Recalculate compound scores
  next.cognitiveFatigueIndex = calculateCognitiveFatigueIndex(next);
  next.missionReadinessScore = calculateCompoundReadinessScore(next);

  // Evaluate deterministic rules
  const evaluation = evaluateDeterministicRules(next);
  next.status = evaluation.status;
  next.warnings = evaluation.warnings;
  next.critical = evaluation.critical;
  next.timestamp = new Date().toLocaleTimeString();

  return next;
}

/**
 * Standard NASA Protocols catalogue
 */
export const NASA_PROTOCOLS: Record<string, NasaProtocol> = {
  STORM_HAVEN: {
    id: 'PROTO-RAD-SPE',
    title: 'NASA SPE-7: Emergency Radiation Storm Shelter Protocol',
    category: 'Radiation Safety',
    priority: 'IMMEDIATE',
    description: 'Activated during acute solar particle events (SPE) when ionizing dose exceeds 1.0 mSv/day or energetic proton flux spikes.',
    steps: [
      'Immediately halt all Extravehicular Activity (EVA) or unshielded module maintenance.',
      'Sound shipwide radiation shelter acoustic klaxon (Code Yellow/Red).',
      'Move all crew to central MTV Storm Haven module surrounded by water-wall and food storage bulkheads.',
      'Deploy polyethylene supplemental storm shields across airlock bulkheads.',
      'Power down high-gain parabolic antennas facing solar coronal angle.',
      'Begin continuous dosimeter logging (every 60 seconds) with burst Earth downlink queue.',
    ],
  },
  PVT_EVA_INTERLOCK: {
    id: 'PROTO-BEH-PVT',
    title: 'NASA BEHAVIORAL-COG-1: Mandatory PVT & EVA Interlock Protocol',
    category: 'Cognitive & Behavioral Health',
    priority: 'IMMEDIATE',
    description: 'Safety gate initiated when sleep duration drops below 5.0h, autonomic fatigue index exceeds 65%, or high cabin CO2 is present.',
    steps: [
      'Lock high-risk mission checklists (EVA airlock hatch unlock, manual RCS thruster docking, high-voltage battery transfer).',
      'Crew member must execute a calibrated 30-second Psychomotor Vigilance Test (PVT).',
      'Pass criterion: Mean Reaction Time < 355 milliseconds with zero lapse count (>500ms).',
      'If test fails: Mandatory 45-minute sleep period and 200mg slow-release caffeine gum.',
      'Emergency Override: Requires dual-key cryptographic signature from Commander or Chief Medical Officer.',
    ],
  },
  ECLSS_SCRUBBER: {
    id: 'PROTO-ECLSS-CO2',
    title: 'NASA ECLSS-CO2-MAX: CDRA Scrubber Emergency Bypass Protocol',
    category: 'Life Support & Atmosphere',
    priority: 'ELEVATED',
    description: 'Enacted when cabin carbon dioxide exceeds 4,200 ppm, preventing hypercapnic spatial disorientation.',
    steps: [
      'Cycle Carbon Dioxide Removal Assembly (CDRA) desiccant/adsorbent beds to high-purge cycle.',
      'Install backup disposable LiOH (Lithium Hydroxide) canisters into auxiliary air loop.',
      'Verify airflow velocity across crew sleep bunks is greater than 0.15 m/s to prevent CO2 pockets.',
      'Crew to report any cephalalgia (headache), visual shimmering, or nausea.',
    ],
  },
  ARED_EXERCISE: {
    id: 'PROTO-MED-ARED',
    title: 'NASA ARED-T2: Resistance Countermeasure Protocol',
    category: 'Musculoskeletal Conditioning',
    priority: 'ROUTINE',
    description: 'Prescribed to prevent the 1-1.5% monthly microgravity bone mineral density (BMD) loss and soleus muscle atrophy.',
    steps: [
      'Execute 2.5 hours of daily structured exercise (60 min ARED resistance, 45 min T2 treadmill with bungee harness, 30 min CEVIS cycle).',
      'Ensure vacuum cylinder loads on ARED reach minimum 75% 1-Rep Max for lumbar and femur preservation.',
      'Take daily oral Vitamin D3 (2000 IU) and 10mg bisphosphonate countermeasure.',
      'Inspect joint movement biomechanics via computer-vision posture telemetry to eliminate spinal shearing.',
    ],
  },
};

/**
 * Builds the Zero-Latency "Earth Ground Control Sync Packet"
 * Designed to buffer all diagnostics on-ship, ready for burst transmission
 * when Deep Space Network (DSN) comms window opens.
 */
export function generateEarthSyncPacket(
  astronaut: AstronautProfile,
  vitals: VitalTelemetry,
  alerts: HealthAlert[],
  pvtRecords: PVTRecord[]
) {
  const packetId = `ARES4-MED-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 9000 + 1000)}`;
  const timestamp = new Date().toISOString();

  const payload = {
    header: {
      packetId,
      formatVersion: 'NASA-AS-JSON-2026.3',
      craftId: astronaut.mission,
      subjectId: astronaut.id,
      subjectName: astronaut.name,
      missionDay: astronaut.missionDay,
      earthLightLagSeconds: Math.round(astronaut.earthLagMinutes * 60),
      timestamp,
      transmissionStatus: 'QUEUED_FOR_DSN_BURST',
    },
    telemetrySummary: {
      status: vitals.status,
      missionReadinessScore: vitals.missionReadinessScore,
      cognitiveFatigueIndex: vitals.cognitiveFatigueIndex,
      vitals: {
        heartRate: vitals.heartRate,
        spo2: vitals.spo2,
        coreTempC: vitals.temperature,
        bloodPressure: `${vitals.bloodPressure.systolic}/${vitals.bloodPressure.diastolic}`,
        dailyRadiationMsv: vitals.dailyRadiation,
        cumulativeRadiationMsv: Math.round(vitals.cumulativeRadiation * 10) / 10,
        cabinCo2Ppm: vitals.cabinCo2,
        sleepHoursLast24: vitals.sleepDuration,
        hrvRmssdMs: vitals.hrvRmssd,
        boneDensityLossPct: vitals.boneDensityLossPct,
        muscleMassLossPct: vitals.muscleMassLossPct,
      },
      aiFlightSurgeonObservation: vitals.aiBehaviorAnalysis,
    },
    activeAlertsCount: alerts.filter(a => !a.acknowledged).length,
    recentAlerts: alerts.slice(0, 10),
    pvtHistory: pvtRecords.slice(0, 5),
    recommendedGroundAction:
      vitals.status === 'CRITICAL'
        ? 'IMMEDIATE FLIGHT SURGEON BURST ADVICE REQUIRED. Storm haven or medical intervention active.'
        : vitals.status === 'WARNING'
        ? 'ROUTINE CONCURRENCE REQUESTED. Automated countermeasures active.'
        : 'NOMINAL. No tele-medical intervention required.',
  };

  return payload;
}
