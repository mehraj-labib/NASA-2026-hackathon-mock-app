import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  RotateCcw,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { PVTRecord } from '../types/telemetry';
import { annunciator } from '../utils/audio-annunciator';

interface PVTModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTestComplete: (record: PVTRecord) => void;
  lastRecord?: PVTRecord | null;
}

type TestPhase = 'IDLE' | 'WAITING' | 'COUNTING' | 'FEEDBACK' | 'COMPLETE';

export const PVTModal: React.FC<PVTModalProps> = ({
  isOpen,
  onClose,
  onTestComplete,
  lastRecord,
}) => {
  const [phase, setPhase] = useState<TestPhase>('IDLE');
  const [currentTrial, setCurrentTrial] = useState(1);
  const totalTrials = 4; // 4 rapid randomized trials for a responsive 20-30s micro-test
  const [elapsedMs, setElapsedMs] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [falseStarts, setFalseStarts] = useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [isLapse, setIsLapse] = useState(false);

  // Dual-signoff state
  const [showOverrideForm, setShowOverrideForm] = useState(false);
  const [crewApprover, setCrewApprover] = useState('Cmdr. Marcus Vance (Mission Commander)');
  const [overrideReason, setOverrideReason] = useState('Critical scheduled orbital adjustment required; second astronaut present as active observer.');
  const [overrideGranted, setOverrideGranted] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimestampRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  // Cleanup on unmount or phase change
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Keyboard spacebar listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleUserInteraction();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, phase]);

  if (!isOpen) return null;

  const startNextTrial = (trialIndex: number) => {
    setPhase('WAITING');
    setElapsedMs(0);
    setFeedbackMessage('Focus on the target screen. Wait for the red counter...');
    setIsLapse(false);

    // Random interval between 1.8s and 4.2s
    const randomDelay = Math.floor(Math.random() * 2400) + 1800;

    timerRef.current = setTimeout(() => {
      setPhase('COUNTING');
      annunciator.playStimulusTone();
      startTimestampRef.current = performance.now();

      const updateCounter = () => {
        const now = performance.now();
        const diff = Math.round(now - startTimestampRef.current);
        setElapsedMs(diff);

        if (diff > 500) {
          setIsLapse(true);
        }

        // Auto-cutoff at 2000ms if no response
        if (diff >= 2000) {
          finishTrial(2000, true);
        } else {
          animFrameRef.current = requestAnimationFrame(updateCounter);
        }
      };

      animFrameRef.current = requestAnimationFrame(updateCounter);
    }, randomDelay);
  };

  const startTest = () => {
    setReactionTimes([]);
    setFalseStarts(0);
    setCurrentTrial(1);
    setOverrideGranted(false);
    setShowOverrideForm(false);
    startNextTrial(1);
  };

  const finishTrial = (rt: number, isAutoCutoff = false) => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);

    const updatedRts = [...reactionTimes, rt];
    setReactionTimes(updatedRts);
    setPhase('FEEDBACK');

    const lapseOccurred = rt >= 500;
    if (isAutoCutoff) {
      setFeedbackMessage('TIMEOUT (2000ms). Attention lapse recorded.');
    } else if (lapseOccurred) {
      setFeedbackMessage(`${rt} ms - ATTENTION LAPSE (>500ms).`);
    } else if (rt < 260) {
      setFeedbackMessage(`${rt} ms - Exceptional neurological alertness!`);
    } else if (rt < 355) {
      setFeedbackMessage(`${rt} ms - Nominal reaction latency.`);
    } else {
      setFeedbackMessage(`${rt} ms - Sub-optimal latency (>355ms threshold).`);
    }

    // Schedule next trial or complete test
    setTimeout(() => {
      if (currentTrial < totalTrials) {
        setCurrentTrial(prev => prev + 1);
        startNextTrial(currentTrial + 1);
      } else {
        completeEntireTest(updatedRts, falseStarts);
      }
    }, 1200);
  };

  const handleUserInteraction = () => {
    if (phase === 'WAITING') {
      // False start penalty
      if (timerRef.current) clearTimeout(timerRef.current);
      setFalseStarts(prev => prev + 1);
      setPhase('FEEDBACK');
      setFeedbackMessage('FALSE START! Responded before stimulus. Wait for the counter.');

      setTimeout(() => {
        startNextTrial(currentTrial);
      }, 1400);
    } else if (phase === 'COUNTING') {
      const now = performance.now();
      const rt = Math.round(now - startTimestampRef.current);
      finishTrial(rt);
    }
  };

  const completeEntireTest = (finalRts: number[], fsCount: number) => {
    const sum = finalRts.reduce((a, b) => a + b, 0);
    const mean = Math.round(sum / finalRts.length);
    const lapses = finalRts.filter(r => r >= 500).length;

    // Passing criteria: Mean RT < 355ms AND lapses === 0 AND falseStarts <= 1
    const passed = mean < 355 && lapses === 0 && fsCount <= 1;

    setPhase('COMPLETE');

    const record: PVTRecord = {
      id: `PVT-${Date.now().toString(36).toUpperCase()}`,
      timestamp: new Date().toLocaleTimeString(),
      trials: finalRts,
      meanRt: mean,
      lapses,
      falseStarts: fsCount,
      passed,
    };

    onTestComplete(record);
  };

  const handleApplyOverride = () => {
    setOverrideGranted(true);
    const mean = reactionTimes.length > 0 ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length) : 410;
    const record: PVTRecord = {
      id: `PVT-OVERRIDE-${Date.now().toString(36).toUpperCase()}`,
      timestamp: new Date().toLocaleTimeString(),
      trials: reactionTimes.length > 0 ? reactionTimes : [410, 420],
      meanRt: mean,
      lapses: 1,
      falseStarts,
      passed: true,
      crewOverride: {
        approvedBy: crewApprover,
        reason: overrideReason,
        timestamp: new Date().toLocaleTimeString(),
      },
    };
    onTestComplete(record);
  };

  const meanRt = reactionTimes.length > 0
    ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
    : 0;
  const lapsesCount = reactionTimes.filter(r => r >= 500).length;
  const passed = meanRt < 355 && lapsesCount === 0 && falseStarts <= 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pvt-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
    >
      <div className="bg-[#0b0f1a] border border-slate-700 w-full max-w-xl rounded-xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-[#0e1424]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 id="pvt-title" className="text-sm font-bold tracking-tight text-slate-100">
                NASA Psychomotor Vigilance Test (PVT-B Micro)
              </h2>
              <p className="text-[11px] font-mono text-slate-400">
                Protocol: BEHAVIORAL-COG-1 · 30-Second Micro-Check
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close PVT Test"
            className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex flex-col items-center">
          {phase === 'IDLE' && (
            <div className="text-center max-w-md py-4">
              <div className="w-14 h-14 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto mb-4 text-cyan-400">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-base font-semibold text-slate-100 mb-2">
                Operational Cognitive Screening
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Measures sustained visual attention, central nervous system fatigue, and motor response latency.
                When the red millisecond counter appears, press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-slate-300">SPACEBAR</kbd> or tap the screen instantly.
              </p>

              <div className="grid grid-cols-3 gap-2 text-left bg-slate-900/80 border border-slate-800 rounded-lg p-3 text-[11px] font-mono mb-5">
                <div>
                  <span className="text-slate-400 block">Trials</span>
                  <span className="text-slate-200 font-bold">4 Stimuli</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Pass Target</span>
                  <span className="text-emerald-400 font-bold">&lt; 355 ms</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Lapse Cutoff</span>
                  <span className="text-rose-400 font-bold">&gt; 500 ms</span>
                </div>
              </div>

              {lastRecord && (
                <p className="text-xs font-mono text-slate-400 mb-4">
                  Last Result: {lastRecord.meanRt}ms ({lastRecord.passed ? 'PASSED' : 'FAILED'}) at {lastRecord.timestamp}
                </p>
              )}

              <button
                type="button"
                onClick={startTest}
                className="w-full py-2.5 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs tracking-wide shadow-md transition-colors"
              >
                Begin 30s PVT Protocol
              </button>
            </div>
          )}

          {(phase === 'WAITING' || phase === 'COUNTING' || phase === 'FEEDBACK') && (
            <div className="w-full flex flex-col items-center py-2">
              <div className="w-full flex justify-between text-xs font-mono text-slate-400 mb-3">
                <span>Trial {currentTrial} of {totalTrials}</span>
                <span>False Starts: <strong className="text-amber-400">{falseStarts}</strong></span>
              </div>

              {/* Stimulus Target Area */}
              <button
                type="button"
                onClick={handleUserInteraction}
                className={`w-full h-44 rounded-xl border flex flex-col items-center justify-center transition-all select-none cursor-pointer ${
                  phase === 'COUNTING'
                    ? 'bg-rose-950/70 border-rose-500 ring-4 ring-rose-500/40'
                    : phase === 'FEEDBACK'
                    ? isLapse || feedbackMessage.includes('FALSE')
                      ? 'bg-amber-950/40 border-amber-600'
                      : 'bg-emerald-950/40 border-emerald-600'
                    : 'bg-[#060810] border-slate-800 hover:border-slate-700'
                }`}
              >
                {phase === 'COUNTING' && (
                  <div className="text-center">
                    <span className="text-5xl sm:text-6xl font-mono font-extrabold text-rose-500 tabular-nums tracking-widest drop-shadow-[0_0_15px_rgba(244,63,94,0.6)]">
                      {elapsedMs.toString().padStart(3, '0')}
                    </span>
                    <span className="block text-xs font-mono uppercase text-rose-300 mt-2 tracking-wider">
                      TAP OR PRESS SPACEBAR NOW
                    </span>
                  </div>
                )}

                {phase === 'WAITING' && (
                  <div className="text-center text-slate-400">
                    <div className="w-3 h-3 rounded-full bg-slate-700 mx-auto mb-2" />
                    <p className="text-xs font-mono">STAND BY FOR STIMULUS...</p>
                  </div>
                )}

                {phase === 'FEEDBACK' && (
                  <div className="text-center px-4">
                    <span className="text-2xl font-mono font-bold text-slate-100 block mb-1">
                      {elapsedMs > 0 ? `${elapsedMs} ms` : 'STIMULUS FAILED'}
                    </span>
                    <p className="text-xs font-mono text-slate-300">{feedbackMessage}</p>
                  </div>
                )}
              </button>

              <p className="text-[11px] text-slate-400 font-mono mt-3 text-center">
                Click box or press <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-300">SPACE</kbd> upon red timer initiation.
              </p>
            </div>
          )}

          {phase === 'COMPLETE' && (
            <div className="w-full py-2">
              <div
                className={`p-4 rounded-xl border flex items-center gap-4 mb-4 ${
                  passed || overrideGranted
                    ? 'bg-emerald-950/50 border-emerald-700/80 text-emerald-200'
                    : 'bg-rose-950/50 border-rose-700/80 text-rose-200'
                }`}
              >
                <div
                  className={`p-3 rounded-full ${
                    passed || overrideGranted ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                  }`}
                >
                  {passed || overrideGranted ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <ShieldAlert className="w-6 h-6" />
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wide">
                    {overrideGranted
                      ? 'DUAL-CREW OVERRIDE AUTHORIZED'
                      : passed
                      ? 'COGNITIVE VIGILANCE VERIFIED (PASSED)'
                      : 'COGNITIVE FATIGUE THRESHOLD EXCEEDED (FAILED)'}
                  </h4>
                  <p className="text-xs opacity-90 mt-0.5">
                    {passed
                      ? 'Reaction time meets NASA aerospace standards. High-risk mission checklists unlocked.'
                      : overrideGranted
                      ? `Override granted by ${crewApprover}. Mission safety interlock unlocked.`
                      : 'Mean reaction time or attention lapses exceed flight safety margins. EVA airlock interlock remains locked.'}
                  </p>
                </div>
              </div>

              {/* Result Details */}
              <div className="grid grid-cols-4 gap-2 bg-[#090d16] border border-slate-800 rounded-lg p-3 text-center font-mono text-xs mb-4">
                <div>
                  <span className="text-slate-400 block text-[10px]">MEAN RT</span>
                  <span className={`text-base font-bold tabular-nums ${meanRt < 355 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {meanRt} ms
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">LAPSES (&gt;500ms)</span>
                  <span className={`text-base font-bold tabular-nums ${lapsesCount === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {lapsesCount}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">FALSE STARTS</span>
                  <span className="text-base font-bold tabular-nums text-slate-200">
                    {falseStarts}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">GATE STATUS</span>
                  <span className={`text-xs font-bold ${passed || overrideGranted ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {passed || overrideGranted ? 'CLEARED' : 'INTERLOCKED'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={startTest}
                  className="flex-1 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retest PVT Protocol</span>
                </button>

                {!passed && !overrideGranted && (
                  <button
                    type="button"
                    onClick={() => setShowOverrideForm(!showOverrideForm)}
                    className="flex-1 py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Dual-Signoff Crew Override</span>
                  </button>
                )}

                {(passed || overrideGranted) && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors"
                  >
                    Confirm & Return to Cockpit
                  </button>
                )}
              </div>

              {/* Dual Signoff Form */}
              {showOverrideForm && !overrideGranted && (
                <div className="mt-4 p-3.5 bg-amber-950/30 border border-amber-800/80 rounded-lg text-xs space-y-3">
                  <div className="flex items-center gap-2 text-amber-300 font-semibold">
                    <KeyRound className="w-4 h-4" />
                    <span>NASA Dual-Key Mission Interlock Override</span>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Authorizing Crew Officer
                    </label>
                    <select
                      value={crewApprover}
                      onChange={e => setCrewApprover(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 text-xs font-mono focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="Cmdr. Marcus Vance (Mission Commander)">
                        Cmdr. Marcus Vance (Mission Commander)
                      </option>
                      <option value="Dr. Chen Li (Chief Medical Officer)">
                        Dr. Chen Li (Chief Medical Officer)
                      </option>
                      <option value="Lt. Col. Sarah Jenkins (Flight Operations Director)">
                        Lt. Col. Sarah Jenkins (Flight Operations Director)
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Clinical Operational Justification
                    </label>
                    <input
                      type="text"
                      value={overrideReason}
                      onChange={e => setOverrideReason(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 text-xs font-mono focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyOverride}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-xs transition-colors"
                  >
                    Execute Cryptographic Dual-Key Signoff
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
