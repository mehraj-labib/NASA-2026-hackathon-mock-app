import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateDeterministicRules,
  calculateCompoundReadinessScore,
  calculateCognitiveFatigueIndex,
  updateVitalsSimulation,
  INITIAL_VITALS,
} from './aerospace-medicine.ts';
import type { VitalTelemetry } from '../types/telemetry.ts';

test('Baseline vitals evaluate to NORMAL status without critical alarms', () => {
  const result = evaluateDeterministicRules(INITIAL_VITALS);
  assert.equal(result.status, 'NORMAL');
  assert.equal(result.critical.length, 0);
  assert.equal(result.warnings.length, 0);
});

test('Radiation threshold >= 1.0 mSv triggers CRITICAL and Storm Shelter protocol', () => {
  const highRadVitals: VitalTelemetry = {
    ...INITIAL_VITALS,
    dailyRadiation: 1.25,
  };
  const result = evaluateDeterministicRules(highRadVitals);
  assert.equal(result.status, 'CRITICAL');
  assert.ok(result.critical.some(c => c.includes('High Solar Radiation Spike')));
  assert.ok(result.alerts.some(a => a.category === 'RADIATION' && a.status === 'CRITICAL'));
});

test('Radiation threshold between 0.6 and 1.0 mSv triggers WARNING', () => {
  const elevatedRadVitals: VitalTelemetry = {
    ...INITIAL_VITALS,
    dailyRadiation: 0.75,
  };
  const result = evaluateDeterministicRules(elevatedRadVitals);
  assert.equal(result.status, 'WARNING');
  assert.ok(result.warnings.some(w => w.includes('Radiation elevated')));
});

test('Cognitive fatigue check: sleep < 5.0h and HR > 90 triggers CRITICAL PVT requirement', () => {
  const fatigueVitals: VitalTelemetry = {
    ...INITIAL_VITALS,
    sleepDuration: 4.2,
    heartRate: 98,
  };
  const result = evaluateDeterministicRules(fatigueVitals);
  assert.equal(result.status, 'CRITICAL');
  assert.ok(result.critical.some(c => c.includes('Cognitive Fatigue High')));
  assert.ok(result.alerts.some(a => a.category === 'FATIGUE'));
});

test('Compound Readiness Score decreases as multi-factor risks accumulate', () => {
  const nominalScore = calculateCompoundReadinessScore(INITIAL_VITALS);
  assert.ok(nominalScore >= 90, `Expected nominal score >= 90, got ${nominalScore}`);

  const degradedVitals: VitalTelemetry = {
    ...INITIAL_VITALS,
    dailyRadiation: 1.1,
    sleepDuration: 3.5,
    heartRate: 110,
    cabinCo2: 5600,
  };
  const degradedScore = calculateCompoundReadinessScore(degradedVitals);
  assert.ok(degradedScore < 40, `Expected degraded score < 40, got ${degradedScore}`);
});

test('Cognitive Fatigue Index scales with sleep debt and HRV suppression', () => {
  const nominalFatigue = calculateCognitiveFatigueIndex(INITIAL_VITALS);
  const severeFatigue = calculateCognitiveFatigueIndex({
    ...INITIAL_VITALS,
    sleepDuration: 3.0,
    hrvRmssd: 18,
    heartRate: 102,
  });
  assert.ok(severeFatigue > nominalFatigue + 40);
});

test('Solar Flare simulation mode steps radiation upward by ~0.1 per second', () => {
  const start = { ...INITIAL_VITALS, dailyRadiation: 0.2 };
  const updated = updateVitalsSimulation(start, 'SOLAR_FLARE', 1);
  assert.ok(updated.dailyRadiation >= 0.28, `Expected dailyRadiation >= 0.28, got ${updated.dailyRadiation}`);
});
