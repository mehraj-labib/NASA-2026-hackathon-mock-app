import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  VideoOff,
  Eye,
  Shield,
  Activity,
  UserCheck,
  Dumbbell,
  Lock,
  Unlock,
  Maximize2,
  RefreshCw,
} from 'lucide-react';
import { HealthStatus } from '../types/telemetry';

interface BehavioralVisionFeedProps {
  status: HealthStatus;
  cognitiveFatigueIndex: number;
  onTriggerPvtSuggest: () => void;
}

export const BehavioralVisionFeed: React.FC<BehavioralVisionFeedProps> = ({
  status,
  cognitiveFatigueIndex,
  onTriggerPvtSuggest,
}) => {
  const [useWebcam, setUseWebcam] = useState(false);
  const [webcamAvailable, setWebcamAvailable] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [activeTrackingMode, setActiveTrackingMode] = useState<'COGNITIVE' | 'EXERCISE'>('COGNITIVE');
  const [privacyQuartersEngaged, setPrivacyQuartersEngaged] = useState(false);
  const [doorTransitionEvent, setDoorTransitionEvent] = useState<string | null>(null);

  // Simulated behavioral metrics
  const [postureSlumpDeg, setPostureSlumpDeg] = useState(4.2);
  const [blinkRatePerMin, setBlinkRatePerMin] = useState(14);
  const [microSaccadeIndex, setMicroSaccadeIndex] = useState(88);
  const [affectState, setAffectState] = useState('Attentive / Nominal');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Toggle live webcam
  useEffect(() => {
    if (useWebcam) {
      navigator.mediaDevices?.getUserMedia({ video: { width: 480, height: 360 } })
        .then(stream => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
          }
          setCameraError(null);
        })
        .catch(err => {
          console.warn('Webcam access not granted or unavailable:', err);
          setCameraError('Webcam unavailable in this frame. Falling back to spacecraft tele-vision stream.');
          setUseWebcam(false);
          setWebcamAvailable(false);
        });
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [useWebcam]);

  // Procedural Canvas Animation for Posture & Movement Skeleton
  useEffect(() => {
    let animId: number;
    let frame = 0;

    const render = () => {
      frame++;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;

      // Clear with dark space station console tone
      ctx.fillStyle = '#060a12';
      ctx.fillRect(0, 0, w, h);

      if (privacyQuartersEngaged) {
        // Privacy mode active
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('CREW PRIVACY SHUTTER ACTIVE', w / 2, h / 2 - 10);
        ctx.fillText('Washroom / Sleep Quarters Protected', w / 2, h / 2 + 10);
        animId = requestAnimationFrame(render);
        return;
      }

      // Draw grid telemetry
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.5)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Animated Astronaut Body Skeleton
      const t = frame * 0.04;
      const breathing = Math.sin(t * 1.5) * 2;
      const isFatigued = cognitiveFatigueIndex > 50;

      // Head center
      const headX = w / 2;
      const headY = 65 + (isFatigued ? 12 : 0) + breathing;
      const neckY = headY + 22;
      const spineMidY = neckY + 45;
      const spineBaseY = spineMidY + 40;

      // Posture Slump offset
      const slumpOffset = isFatigued ? Math.sin(t * 0.5) * 8 + 12 : Math.sin(t * 0.8) * 3;

      // Color scheme based on state
      const wireColor = isFatigued ? '#f59e0b' : '#06b6d4';
      const jointColor = isFatigued ? '#fbbf24' : '#22d3ee';

      ctx.strokeStyle = wireColor;
      ctx.fillStyle = jointColor;
      ctx.lineWidth = 2;

      // Head circle
      ctx.beginPath();
      ctx.arc(headX + slumpOffset * 0.5, headY, 18, 0, Math.PI * 2);
      ctx.stroke();

      // Facial bounding box
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
      ctx.strokeRect(headX + slumpOffset * 0.5 - 14, headY - 14, 28, 28);

      // Spine & Torso
      ctx.strokeStyle = wireColor;
      ctx.beginPath();
      ctx.moveTo(headX + slumpOffset * 0.5, neckY);
      ctx.lineTo(headX + slumpOffset * 0.8, spineMidY);
      ctx.lineTo(headX, spineBaseY);
      ctx.stroke();

      // Shoulders
      const leftShoulderX = headX - 42;
      const rightShoulderX = headX + 42;
      ctx.beginPath();
      ctx.moveTo(leftShoulderX, neckY + 8);
      ctx.lineTo(rightShoulderX, neckY + 8);
      ctx.stroke();

      // Arms
      if (activeTrackingMode === 'EXERCISE') {
        // Resistance exercise kinematics: moving arms & knees
        const armWave = Math.sin(t * 3) * 25;
        ctx.beginPath();
        ctx.moveTo(leftShoulderX, neckY + 8);
        ctx.lineTo(leftShoulderX - 20, neckY + 45 + armWave);
        ctx.lineTo(leftShoulderX - 10, neckY + 85 + armWave);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(rightShoulderX, neckY + 8);
        ctx.lineTo(rightShoulderX + 20, neckY + 45 - armWave);
        ctx.lineTo(rightShoulderX + 10, neckY + 85 - armWave);
        ctx.stroke();
      } else {
        // Workstation console posture
        ctx.beginPath();
        ctx.moveTo(leftShoulderX, neckY + 8);
        ctx.lineTo(leftShoulderX - 15, neckY + 45);
        ctx.lineTo(leftShoulderX + 10, neckY + 75);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(rightShoulderX, neckY + 8);
        ctx.lineTo(rightShoulderX + 15, neckY + 45);
        ctx.lineTo(rightShoulderX - 10, neckY + 75);
        ctx.stroke();
      }

      // Joints
      [
        [headX + slumpOffset * 0.5, neckY],
        [leftShoulderX, neckY + 8],
        [rightShoulderX, neckY + 8],
        [headX + slumpOffset * 0.8, spineMidY],
        [headX, spineBaseY],
      ].forEach(([jx, jy]) => {
        ctx.beginPath();
        ctx.arc(jx, jy, 3.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Target Crosshairs HUD
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.7)';
      ctx.beginPath();
      ctx.moveTo(headX + slumpOffset * 0.5 - 24, headY);
      ctx.lineTo(headX + slumpOffset * 0.5 - 18, headY);
      ctx.moveTo(headX + slumpOffset * 0.5 + 18, headY);
      ctx.lineTo(headX + slumpOffset * 0.5 + 24, headY);
      ctx.stroke();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [privacyQuartersEngaged, activeTrackingMode, cognitiveFatigueIndex]);

  // Update simulated behavioral readings based on cognitive fatigue
  useEffect(() => {
    if (cognitiveFatigueIndex > 60) {
      setPostureSlumpDeg(14.8);
      setBlinkRatePerMin(29);
      setMicroSaccadeIndex(42);
      setAffectState('High Cognitive Strain / Fatigue Slump');
    } else if (cognitiveFatigueIndex > 35) {
      setPostureSlumpDeg(8.5);
      setBlinkRatePerMin(21);
      setMicroSaccadeIndex(65);
      setAffectState('Mild Sensory Overload / Rest Advised');
    } else {
      setPostureSlumpDeg(3.8);
      setBlinkRatePerMin(14);
      setMicroSaccadeIndex(92);
      setAffectState('Attentive / Nominal Posture');
    }
  }, [cognitiveFatigueIndex]);

  const handleSimulateDoorTransition = () => {
    setDoorTransitionEvent('Transit recorded: Private Quarters -> MTV Central Hab. Facial micro-expression analysis: 0.12 stress delta (Nominal, within crew coping envelope).');
    setTimeout(() => {
      setDoorTransitionEvent(null);
    }, 6000);
  };

  return (
    <div className="bg-[#0b0f1a] border border-slate-800 rounded-lg overflow-hidden flex flex-col shadow-sm">
      {/* Card Header */}
      <div className="px-4 py-2.5 border-b border-slate-800 bg-[#0e1424] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs uppercase font-mono font-bold tracking-wider text-slate-200">
            Vision & Behavioral Posture Analysis
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {/* Tracking Mode Toggle */}
          <div className="flex bg-slate-900 rounded p-0.5 border border-slate-800 text-[11px] font-mono">
            <button
              type="button"
              onClick={() => setActiveTrackingMode('COGNITIVE')}
              className={`px-2 py-0.5 rounded transition-colors ${
                activeTrackingMode === 'COGNITIVE'
                  ? 'bg-cyan-600 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Cognitive
            </button>
            <button
              type="button"
              onClick={() => setActiveTrackingMode('EXERCISE')}
              className={`px-2 py-0.5 rounded transition-colors ${
                activeTrackingMode === 'EXERCISE'
                  ? 'bg-cyan-600 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ARED Exercise
            </button>
          </div>

          {/* Privacy Quarters Toggle */}
          <button
            type="button"
            onClick={() => setPrivacyQuartersEngaged(!privacyQuartersEngaged)}
            className={`p-1 rounded border text-[11px] flex items-center gap-1 font-mono transition-colors ${
              privacyQuartersEngaged
                ? 'bg-amber-950/60 border-amber-700 text-amber-300'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
            title="Toggle Private Stateroom Privacy Mask"
          >
            {privacyQuartersEngaged ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{privacyQuartersEngaged ? 'Private Mode' : 'Hab Stream'}</span>
          </button>
        </div>
      </div>

      {/* Main Canvas / Video Stage */}
      <div className="relative aspect-video max-h-56 bg-black flex items-center justify-center overflow-hidden">
        {useWebcam && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover opacity-60"
          />
        )}

        <canvas
          ref={canvasRef}
          width={480}
          height={270}
          className="w-full h-full object-contain"
        />

        {/* HUD Telemetry Watermark & Coordinates */}
        <div className="absolute top-2 left-2 text-[10px] font-mono text-cyan-400/80 bg-slate-950/70 px-2 py-1 rounded backdrop-blur-sm pointer-events-none">
          <div>CAM: HAB-FWD-02 · 1080p @ 30fps</div>
          <div>MODEL: NASA-POSE-BIO-v3.1</div>
        </div>

        {/* Live Affect Status Badge */}
        <div className="absolute top-2 right-2 text-[10px] font-mono px-2 py-1 rounded backdrop-blur-sm pointer-events-none bg-slate-950/70 border border-slate-800 text-slate-200">
          <span className="text-slate-400">Affect: </span>
          <span
            className={`font-semibold ${
              cognitiveFatigueIndex > 50 ? 'text-amber-400' : 'text-emerald-400'
            }`}
          >
            {affectState}
          </span>
        </div>

        {/* Exercise Joint Telemetry Overlay */}
        {activeTrackingMode === 'EXERCISE' && (
          <div className="absolute bottom-2 left-2 text-[10px] font-mono text-slate-300 bg-slate-950/80 px-2.5 py-1.5 rounded border border-slate-800">
            <div className="flex items-center gap-1.5 text-cyan-400 font-bold mb-0.5">
              <Dumbbell className="w-3.5 h-3.5" />
              <span>ARED Biomechanics Telemetry</span>
            </div>
            <div>Spinal Vector: 1.2° (Target &lt; 3.0° Safe)</div>
            <div>Femoral Joint Load: 142 kg · Countermeasure Optimal</div>
          </div>
        )}
      </div>

      {/* Door Transition Notification Banner (Requested in prompt) */}
      {doorTransitionEvent && (
        <div className="px-3 py-1.5 bg-cyan-950/60 border-t border-b border-cyan-800 text-[11px] font-mono text-cyan-300 flex items-center justify-between">
          <span>{doorTransitionEvent}</span>
        </div>
      )}

      {/* Telemetry Metrics Bar */}
      <div className="p-3 bg-[#0d1322] border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
        <div>
          <span className="text-[10px] uppercase text-slate-400 block">Thoracic Slump</span>
          <span
            className={`font-bold tabular-nums text-sm ${
              postureSlumpDeg > 10 ? 'text-amber-400' : 'text-slate-200'
            }`}
          >
            {postureSlumpDeg}°
          </span>
          <span className="text-[10px] text-slate-400 block">Bound &lt; 12°</span>
        </div>

        <div>
          <span className="text-[10px] uppercase text-slate-400 block">Blink Rate</span>
          <span
            className={`font-bold tabular-nums text-sm ${
              blinkRatePerMin > 24 ? 'text-amber-400' : 'text-slate-200'
            }`}
          >
            {blinkRatePerMin} /min
          </span>
          <span className="text-[10px] text-slate-400 block">Nominal 12-18</span>
        </div>

        <div>
          <span className="text-[10px] uppercase text-slate-400 block">Microsaccades</span>
          <span
            className={`font-bold tabular-nums text-sm ${
              microSaccadeIndex < 50 ? 'text-amber-400' : 'text-emerald-400'
            }`}
          >
            {microSaccadeIndex} %
          </span>
          <span className="text-[10px] text-slate-400 block">Alertness Index</span>
        </div>

        <div>
          <span className="text-[10px] uppercase text-slate-400 block">Intervention</span>
          {cognitiveFatigueIndex > 50 ? (
            <button
              type="button"
              onClick={onTriggerPvtSuggest}
              className="text-[11px] font-bold text-amber-300 hover:text-amber-200 underline text-left"
            >
              Recommend PVT &gt;
            </button>
          ) : (
            <span className="text-emerald-400 font-semibold">None Required</span>
          )}
        </div>
      </div>

      {/* Control Footer */}
      <div className="px-3 py-2 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
        <button
          type="button"
          onClick={handleSimulateDoorTransition}
          className="hover:text-cyan-400 transition-colors underline"
          title="Simulate astronaut transit into/out of private stateroom"
        >
          Test Post-Quarters Analysis
        </button>

        {webcamAvailable && (
          <button
            type="button"
            onClick={() => setUseWebcam(!useWebcam)}
            className="flex items-center gap-1 hover:text-slate-200 transition-colors"
          >
            {useWebcam ? <VideoOff className="w-3.5 h-3.5 text-rose-400" /> : <Video className="w-3.5 h-3.5 text-cyan-400" />}
            <span>{useWebcam ? 'Stop Live Cam' : 'Enable Real Webcam'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
