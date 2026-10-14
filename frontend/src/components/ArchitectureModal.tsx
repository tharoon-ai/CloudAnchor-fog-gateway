import React from "react";
import {
  BookOpen,
  X,
  Shield,
  Layers,
  Database,
  Cpu,
  Sparkles
} from "lucide-react";

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-white/[0.12] p-6 shadow-2xl relative text-xs">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/[0.06] transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5 border-b border-white/[0.06] pb-4">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              CloudAnchor Multi-Sensor Architecture & Resilience Guide
            </h3>
            <p className="text-xs text-slate-400">
              Autonomous Edge-to-Cloud Fault-Tolerant Store-and-Forward + Multi-Sensor Edge Fusion
            </p>
          </div>
        </div>

        {/* Pillars of Architecture */}
        <div className="space-y-4 text-slate-300 leading-relaxed">
          
          {/* Pillar 1: Multi-Sensor Ingestion */}
          <div className="p-4 bg-slate-950/60 rounded-xl border border-white/[0.06] space-y-1.5">
            <div className="flex items-center gap-2 text-white font-bold text-xs">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>1. Multi-Sensor Edge Ingestion & Idempotency</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Arduino sensor nodes simulated via Tinkercad Circuits aggregate telemetry from physical/analog environmental, motion, and electrical inputs. The gateway enforces idempotency on <code className="font-mono text-emerald-400">request_id</code>.
            </p>
          </div>

          {/* Pillar 2: Multi-Sensor Fusion Engine */}
          <div className="p-4 bg-slate-950/60 rounded-xl border border-white/[0.06] space-y-1.5">
            <div className="flex items-center gap-2 text-white font-bold text-xs">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>2. Rule-Based Multi-Sensor Fusion (Edge Intelligence)</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Prior to buffering or cloud forwarding, the Fog Gateway executes explainable edge analytics evaluating thermal stress, mechanical vibration, electrical overcurrent, and gas anomalies to derive an instantaneous <strong>Health Score (0-100)</strong>, <strong>System Status</strong> (NORMAL / WARNING / CRITICAL), and <strong>Risk Level</strong>.
            </p>
          </div>

          {/* Pillar 3: SQLite Persistent Queue */}
          <div className="p-4 bg-slate-950/60 rounded-xl border border-white/[0.06] space-y-1.5">
            <div className="flex items-center gap-2 text-white font-bold text-xs">
              <Database className="w-4 h-4 text-purple-400" />
              <span>3. Crash-Surviving Local Buffer (<code className="font-mono text-purple-400">gateway.db</code>)</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Every incoming packet is immediately committed into local SQLite storage in transaction isolation. If the fog node loses power, reboot recovers all pending records automatically with zero loss.
            </p>
          </div>

          {/* Pillar 4: Circuit Breaker FSM */}
          <div className="p-4 bg-slate-950/60 rounded-xl border border-white/[0.06] space-y-1.5">
            <div className="flex items-center gap-2 text-white font-bold text-xs">
              <Shield className="w-4 h-4 text-amber-400" />
              <span>4. Circuit Breaker Finite State Machine</span>
            </div>
            <div className="grid grid-cols-3 gap-2 font-mono text-[10.5px] mt-2">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                <span className="font-bold block">CLOSED</span>
                <span className="text-[9.5px] opacity-80">Direct proxying</span>
              </div>
              <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300">
                <span className="font-bold block">OPEN</span>
                <span className="text-[9.5px] opacity-80">Fast-fail to SQLite</span>
              </div>
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300">
                <span className="font-bold block">HALF-OPEN</span>
                <span className="text-[9.5px] opacity-80">Trial health probes</span>
              </div>
            </div>
          </div>

          {/* Pillar 5: Exponential Backoff Sync */}
          <div className="p-4 bg-slate-950/60 rounded-xl border border-white/[0.06] space-y-1.5">
            <div className="flex items-center gap-2 text-white font-bold text-xs">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>5. Adaptive Exponential Backoff Worker</span>
            </div>
            <p className="text-[11px] text-slate-400">
              When upstream cloud drops, the FIFO background sync worker backs off exponentially (<code className="font-mono text-cyan-400">delay = min(2 * 2^retry, max_backoff)</code>) to prevent socket starvation and sync queued data smoothly upon cloud recovery.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between">
          <span className="font-mono text-[10px] text-slate-500">FastAPI • SQLite • Multi-Sensor Fusion • React 19</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-white/[0.08] text-white rounded-xl font-medium transition"
          >
            Got it, Dismiss
          </button>
        </div>

      </div>
    </div>
  );
};
