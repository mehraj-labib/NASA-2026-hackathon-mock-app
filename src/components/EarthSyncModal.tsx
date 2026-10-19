import React, { useState } from 'react';
import {
  X,
  Radio,
  Download,
  Copy,
  Check,
  Send,
  ShieldCheck,
  Clock,
  Sparkles,
} from 'lucide-react';
import { AstronautProfile, HealthAlert, PVTRecord, VitalTelemetry } from '../types/telemetry';
import { generateEarthSyncPacket } from '../utils/aerospace-medicine';

interface EarthSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  astronaut: AstronautProfile;
  vitals: VitalTelemetry;
  alerts: HealthAlert[];
  pvtRecords: PVTRecord[];
}

export const EarthSyncModal: React.FC<EarthSyncModalProps> = ({
  isOpen,
  onClose,
  astronaut,
  vitals,
  alerts,
  pvtRecords,
}) => {
  const [copied, setCopied] = useState(false);
  const [transmitting, setTransmitting] = useState(false);
  const [transmitted, setTransmitted] = useState(false);

  if (!isOpen) return null;

  const packet = generateEarthSyncPacket(astronaut, vitals, alerts, pvtRecords);
  const jsonString = JSON.stringify(packet, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${packet.header.packetId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleBurstTransmit = () => {
    setTransmitting(true);
    setTimeout(() => {
      setTransmitting(false);
      setTransmitted(true);
      setTimeout(() => setTransmitted(false), 4000);
    }, 1800);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sync-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <div className="bg-[#0b0f1a] border border-slate-700 w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[90vh] text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-[#0e1424] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <h2 id="sync-modal-title" className="text-sm font-bold tracking-tight text-slate-100">
                Earth Ground Control Sync Packet (DSN Burst)
              </h2>
              <p className="text-[11px] font-mono text-slate-400">
                Zero-Latency Offline Diagnostic Payload · Deep Space Network (DSN) Goldstone Uplink
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Earth Sync Modal"
            className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mars Comms Latency Indicator */}
        <div className="px-5 py-3 bg-[#080c14] border-b border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">1-Way Light Time</span>
              <span className="font-bold text-slate-200 tabular-nums">14m 18s (858s)</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Round-Trip Comms Lag</span>
              <span className="font-bold text-slate-200 tabular-nums">28m 36s (1,716s)</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Local Diagnostic State</span>
              <span className="font-bold text-emerald-400">Autonomous Offline</span>
            </div>
          </div>
        </div>

        {/* Payload JSON Preview */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
            <span>PACKET ID: <strong className="text-slate-200">{packet.header.packetId}</strong></span>
            <span>FORMAT: NASA-AS-JSON-2026.3</span>
          </div>

          <pre className="p-3.5 rounded-lg bg-[#05070d] border border-slate-800 text-[11px] font-mono text-cyan-300/90 overflow-x-auto leading-relaxed max-h-72">
            {jsonString}
          </pre>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-[#0e1424] flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copied ? 'Copied' : 'Copy JSON'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Download File</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleBurstTransmit}
            disabled={transmitting}
            className={`px-4 py-2 rounded-md font-semibold text-xs flex items-center gap-2 transition-all shadow-md ${
              transmitted
                ? 'bg-emerald-600 text-white'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white'
            }`}
          >
            <Send className={`w-3.5 h-3.5 ${transmitting ? 'animate-bounce' : ''}`} />
            <span>
              {transmitting
                ? 'Modulating DSN Carrier...'
                : transmitted
                ? 'Burst Queued in High-Gain Buffer!'
                : 'Queue Burst Uplink (DSN)'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
