import React from "react";
import {
  ShieldAlert,
  RotateCcw,
  Timer,
  Gauge,
  AlertTriangle,
  RefreshCw,
  CheckCircle2
} from "lucide-react";
import type { SystemMetrics } from "../services/api";

interface CircuitBreakerPanelProps {
  metrics: SystemMetrics | null;
  localCooldown: number;
}

export const CircuitBreakerPanel: React.FC<CircuitBreakerPanelProps> = ({
  metrics,
  localCooldown,
}) => {
  const cbState = (metrics?.circuit_breaker_state ?? "CLOSED").toUpperCase();
  const consecutiveFailures = metrics?.consecutive_failures ?? 0;
  const failureThreshold = metrics?.failure_threshold ?? 3;
  const probeSuccesses = metrics?.probe_successes ?? 0;
  const requiredProbeSuccesses = metrics?.required_probe_successes ?? 2;
  const baseBackoff = metrics?.base_backoff ?? 2;
  const maxBackoff = metrics?.max_backoff ?? 32;
  const currentRetryCount = metrics?.current_retry_count ?? 0;
  const nextRetryIn = metrics?.next_retry_in ?? 0;

  // Visual cues based on state
  let stateTheme = {
    badge: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    dot: "bg-emerald-400",
    title: "Normal Forwarding Mode (CLOSED)",
    desc: "Upstream Cloud is healthy. Requests are proxied directly with zero overhead.",
  };

  if (cbState === "OPEN") {
    stateTheme = {
      badge: "text-red-400 bg-red-500/10 border-red-500/30",
      dot: "bg-red-400 animate-ping",
      title: "Outage Protection Active (OPEN)",
      desc: "Upstream failure threshold exceeded. Outbound requests are fast-failed directly into local SQLite queue to prevent thread pool & socket exhaustion.",
    };
  } else if (cbState === "HALF-OPEN") {
    stateTheme = {
      badge: "text-blue-400 bg-blue-500/10 border-blue-500/30",
      dot: "bg-blue-400 animate-pulse",
      title: "Trial Recovery Probing (HALF-OPEN)",
      desc: "Cooldown timer expired. Transmitting controlled probe requests to safely verify Cloud API availability before reopening the full stream.",
    };
  }

  return (
    <section className="glass-panel p-5 rounded-2xl space-y-4">
      
      {/* Header with State Machine Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              Circuit Breaker & Adaptive Backoff FSM
            </h3>
            <p className="text-[11px] text-slate-400">
              Deterministic finite state machine with automatic failure trip, exponential backoff, and self-healing probes
            </p>
          </div>
        </div>

        {/* State Machine Status Badge */}
        <div className={`px-3 py-1 rounded-xl text-xs font-mono font-bold border flex items-center gap-2 ${stateTheme.badge}`}>
          <span className={`w-2 h-2 rounded-full ${stateTheme.dot}`} />
          <span>FSM: {cbState}</span>
        </div>
      </div>

      {/* State Banner with FSM Pipeline Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        
        {/* State FSM Steps */}
        <div className="lg:col-span-2 glass-panel p-3.5 rounded-xl border-white/[0.06] flex flex-col justify-between">
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5">
              {cbState === "CLOSED" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : cbState === "OPEN" ? (
                <AlertTriangle className="w-4 h-4 text-red-400" />
              ) : (
                <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
              )}
            </div>
            <div>
              <h4 className="text-xs font-bold text-white tracking-tight">{stateTheme.title}</h4>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">{stateTheme.desc}</p>
            </div>
          </div>

          {/* Interactive State Flow Visualization */}
          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/[0.06] font-mono text-[11px]">
            <div className={`p-2 rounded-lg border text-center transition-all ${
              cbState === "CLOSED"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-bold"
                : "bg-slate-950/40 border-white/[0.04] text-slate-500"
            }`}>
              <span>1. CLOSED</span>
              <span className="block text-[9px] font-sans text-slate-400 mt-0.5">Direct Forward</span>
            </div>

            <div className={`p-2 rounded-lg border text-center transition-all ${
              cbState === "OPEN"
                ? "bg-red-500/10 border-red-500/30 text-red-300 font-bold"
                : "bg-slate-950/40 border-white/[0.04] text-slate-500"
            }`}>
              <span>2. OPEN</span>
              <span className="block text-[9px] font-sans text-slate-400 mt-0.5">Fast-Fail Queue</span>
            </div>

            <div className={`p-2 rounded-lg border text-center transition-all ${
              cbState === "HALF-OPEN"
                ? "bg-blue-500/10 border-blue-500/30 text-blue-300 font-bold"
                : "bg-slate-950/40 border-white/[0.04] text-slate-500"
            }`}>
              <span>3. HALF-OPEN</span>
              <span className="block text-[9px] font-sans text-slate-400 mt-0.5">Probe & Verify</span>
            </div>
          </div>
        </div>

        {/* Quick Summary / Safety Guarantee */}
        <div className="glass-panel p-3.5 rounded-xl border-white/[0.06] flex flex-col justify-between text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Resilience Guarantee</span>
            <ul className="mt-2 space-y-1.5 text-[11px] text-slate-300">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Zero message loss under cloud failure</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                <span>Exponential backoff avoids retry storms</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                <span>Background auto-reconnect worker</span>
              </li>
            </ul>
          </div>
          <div className="mt-2 pt-2 border-t border-white/[0.06] text-[10px] font-mono text-slate-500 flex justify-between">
            <span>Circuit FSM</span>
            <span>FastAPI ASGI Native</span>
          </div>
        </div>

      </div>

      {/* 4 Diagnostic Parameter Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* 1. Consecutive Failures */}
        <div className="glass-panel p-3.5 rounded-xl border-white/[0.06] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Consecutive Errors
              </span>
              <span className="font-mono text-slate-300 font-bold">{consecutiveFailures} / {failureThreshold}</span>
            </div>
            <div className="text-xl font-bold font-mono text-white mt-1.5 flex items-baseline gap-1.5">
              <span className={consecutiveFailures >= failureThreshold ? "text-red-400" : consecutiveFailures > 0 ? "text-amber-400" : "text-emerald-400"}>
                {consecutiveFailures}
              </span>
              <span className="text-xs text-slate-500 font-normal">/ {failureThreshold} threshold</span>
            </div>

            {/* Threshold Segments */}
            <div className="flex gap-1 mt-2.5">
              {Array.from({ length: failureThreshold }).map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                    consecutiveFailures > idx
                      ? idx + 1 >= failureThreshold
                        ? "bg-red-500"
                        : "bg-amber-400"
                      : "bg-slate-800"
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-2.5 pt-2 border-t border-white/[0.06]">
            Trips to OPEN at {failureThreshold} consecutive errors
          </p>
        </div>

        {/* 2. Cooldown Timer */}
        <div className="glass-panel p-3.5 rounded-xl border-white/[0.06] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <Timer className="w-3.5 h-3.5 text-blue-400" /> Cooldown Timer
              </span>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                localCooldown > 0 ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-slate-900 text-slate-500"
              }`}>
                {localCooldown > 0 ? "COUNTDOWN" : "IDLE"}
              </span>
            </div>
            <div className="text-xl font-bold font-mono text-white mt-1.5 flex items-baseline gap-1.5">
              <span className={localCooldown > 0 ? "text-amber-400 font-mono" : "text-slate-400 font-mono"}>
                {localCooldown > 0 ? `${localCooldown.toFixed(1)}s` : "0.0s"}
              </span>
              <span className="text-xs text-slate-500 font-normal">remaining</span>
            </div>

            {/* Cooldown bar */}
            <div className="w-full bg-slate-950/60 h-1.5 rounded-full overflow-hidden mt-2.5 border border-white/[0.04]">
              <div
                className={`h-full transition-all duration-150 ${localCooldown > 0 ? "bg-amber-400" : "bg-slate-800"}`}
                style={{ width: `${Math.min(100, Math.max(0, (localCooldown / 10.0) * 100))}%` }}
              />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-2.5 pt-2 border-t border-white/[0.06]">
            Transitions to HALF-OPEN upon expiration
          </p>
        </div>

        {/* 3. Probe Recovery Progress */}
        <div className="glass-panel p-3.5 rounded-xl border-white/[0.06] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <Gauge className="w-3.5 h-3.5 text-emerald-400" /> Probe Recovery
              </span>
              <span className="font-mono text-slate-300 font-bold">{probeSuccesses} / {requiredProbeSuccesses}</span>
            </div>
            <div className="text-xl font-bold font-mono text-white mt-1.5 flex items-baseline gap-1.5">
              <span className={probeSuccesses > 0 ? "text-emerald-400 font-mono" : "text-slate-400 font-mono"}>
                {probeSuccesses}
              </span>
              <span className="text-xs text-slate-500 font-normal">/ {requiredProbeSuccesses} passed</span>
            </div>

            {/* Probe segments */}
            <div className="flex gap-1 mt-2.5">
              {Array.from({ length: requiredProbeSuccesses }).map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                    probeSuccesses > idx ? "bg-emerald-400 shadow-sm shadow-emerald-400/50" : "bg-slate-800"
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-2.5 pt-2 border-t border-white/[0.06]">
            {requiredProbeSuccesses} consecutive successes restore CLOSED state
          </p>
        </div>

        {/* 4. Adaptive Exponential Backoff */}
        <div className="glass-panel p-3.5 rounded-xl border-white/[0.06] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <RotateCcw className="w-3.5 h-3.5 text-purple-400" /> Adaptive Backoff
              </span>
              <span className="text-[10px] font-mono text-purple-400 font-semibold">EXPONENTIAL</span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2 font-mono">
              <div className="bg-slate-950/60 p-1.5 rounded-lg border border-white/[0.04] text-center">
                <span className="text-[9px] text-slate-500 block font-sans">Retries</span>
                <span className="text-xs font-bold text-white">{currentRetryCount}</span>
              </div>
              <div className="bg-slate-950/60 p-1.5 rounded-lg border border-white/[0.04] text-center">
                <span className="text-[9px] text-slate-500 block font-sans">Next Retry</span>
                <span className="text-xs font-bold text-amber-400">{nextRetryIn}s</span>
              </div>
            </div>
          </div>
          <div className="text-[10px] font-mono text-slate-500 mt-2.5 pt-2 border-t border-white/[0.06] flex justify-between">
            <span>Base: {baseBackoff}s</span>
            <span>Max: {maxBackoff}s</span>
          </div>
        </div>

      </div>

    </section>
  );
};
