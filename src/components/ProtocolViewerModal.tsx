import React from 'react';
import { X, BookOpen, CheckCircle, ShieldAlert, AlertTriangle } from 'lucide-react';
import { NasaProtocol } from '../types/telemetry';

interface ProtocolViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  protocol: NasaProtocol | null;
}

export const ProtocolViewerModal: React.FC<ProtocolViewerModalProps> = ({
  isOpen,
  onClose,
  protocol,
}) => {
  if (!isOpen || !protocol) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="protocol-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <div className="bg-[#0b0f1a] border border-slate-700 w-full max-w-xl rounded-xl shadow-2xl flex flex-col max-h-[85vh] text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-[#0e1424] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400 block">
                NASA Standard Operating Directive · {protocol.category}
              </span>
              <h2 id="protocol-modal-title" className="text-sm font-bold text-slate-100">
                {protocol.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Protocol Viewer"
            className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Priority & Description */}
        <div className="p-4 border-b border-slate-800/80 bg-[#080c14] text-xs">
          <div className="flex items-center gap-2 mb-2 font-mono">
            <span className="text-slate-400">PRIORITY LEVEL:</span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                protocol.priority === 'IMMEDIATE'
                  ? 'bg-rose-950/70 border border-rose-700 text-rose-300'
                  : protocol.priority === 'ELEVATED'
                  ? 'bg-amber-950/70 border border-amber-700 text-amber-300'
                  : 'bg-emerald-950/70 border border-emerald-700 text-emerald-300'
              }`}
            >
              {protocol.priority}
            </span>
          </div>

          <p className="text-slate-300 leading-relaxed font-mono text-[11px]">
            {protocol.description}
          </p>
        </div>

        {/* Step-by-Step Procedure Checklist */}
        <div className="flex-1 p-4 overflow-y-auto space-y-2.5">
          <h3 className="text-xs font-mono font-bold uppercase text-slate-300 tracking-wider mb-2">
            Sequential Action Directives:
          </h3>

          {protocol.steps.map((step, idx) => (
            <div
              key={idx}
              className="p-3 rounded-lg bg-[#0e1424] border border-slate-800 flex items-start gap-3"
            >
              <div className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                {idx + 1}
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">{step}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-[#0e1424] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs transition-colors"
          >
            Acknowledge & Close Directive
          </button>
        </div>
      </div>
    </div>
  );
};
