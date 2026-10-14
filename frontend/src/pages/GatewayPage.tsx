import React from "react";
import {
  Server,
  Activity,
  Cpu,
  ShieldAlert,
  Zap,
  HardDrive,
  Clock,
  Database,
  Sliders
} from "lucide-react";
import type { DashboardMetrics, ParsedTelemetry } from "../types/dashboard";

interface GatewayPageProps {
  metrics: DashboardMetrics | null;
  gatewayError: string | null;
  latestTelemetry: ParsedTelemetry | null;
  localCooldown: number;
  failureThresholdInput: number;
  setFailureThresholdInput: (v: number) => void;
  cooldownDurationInput: number;
  setCooldownDurationInput: (v: number) => void;
  maxBackoffInput: number;
  setMaxBackoffInput: (v: number) => void;
  onSaveConfig: (e?: React.FormEvent) => void;
  isSavingConfig: boolean;
  configFeedback: { message: string; type: "success" | "error" } | null;
  onOpenDatabase: () => void;
}

export const GatewayPage: React.FC<GatewayPageProps> = ({
  metrics,
  gatewayError,
  latestTelemetry,
  localCooldown,
  failureThresholdInput,
  setFailureThresholdInput,
  cooldownDurationInput,
  setCooldownDurationInput,
  maxBackoffInput,
  setMaxBackoffInput,
  onSaveConfig,
  isSavingConfig,
  configFeedback,
  onOpenDatabase,
}) => {
  const isGatewayOnline = !gatewayError && metrics !== null;
  const cbState = metrics?.circuit_breaker_state ?? "CLOSED";
  const queuePending = metrics?.pending_queue ?? 0;
  const queueSynced = metrics?.synced_queue ?? 0;
  const failureCount = metrics?.consecutive_failures ?? 0;
  const failureThreshold = metrics?.failure_threshold ?? 3;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner / Hero Summary */}
      <div className="p-5 rounded-2xl bg-[#0b1220] border border-white/[0.08] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 shadow-lg shadow-cyan-500/10">
            <Server className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-bold text-white tracking-tight">Fog Gateway Node</h2>
              <span className={`px-2.5 py-0.5 text-xs font-mono font-bold rounded-full border ${
                isGatewayOnline
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : "bg-red-500/10 text-red-400 border-red-500/30"
              }`}>
                {isGatewayOnline ? "OPERATIONAL (PORT 8000)" : "UNREACHABLE"}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              FastAPI Edge Ingestion Engine • Local SQLite Store-and-Forward Buffer • Circuit Breaker FSM
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenDatabase}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/[0.08] rounded-xl text-xs font-mono font-semibold flex items-center gap-2 transition"
          >
            <Database className="w-4 h-4 text-purple-400" />
            <span>Inspect SQLite Queue</span>
          </button>
        </div>
      </div>

      {/* Gateway Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Ingest Pipeline */}
        <div className="p-4 rounded-xl bg-[#0b1220] border border-white/[0.08]">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Total Ingested</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black font-mono text-white">
            {(queuePending + queueSynced).toLocaleString()}
          </div>
          <div className="text-[11px] font-mono text-cyan-400 mt-1">
            HTTP POST /data & /api/ingest
          </div>
        </div>

        {/* Card 2: SQLite Local Queue */}
        <div className="p-4 rounded-xl bg-[#0b1220] border border-white/[0.08]">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Local Buffer Queue</span>
            <HardDrive className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-400">
            {queuePending} <span className="text-xs text-slate-400 font-normal">pending</span>
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-1">
            {queueSynced} records synchronized
          </div>
        </div>

        {/* Card 3: Circuit Breaker FSM */}
        <div className="p-4 rounded-xl bg-[#0b1220] border border-white/[0.08]">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Circuit Breaker State</span>
            <ShieldAlert className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xl font-black font-mono ${
              cbState === "CLOSED" ? "text-emerald-400" :
              cbState === "HALF-OPEN" ? "text-amber-400" : "text-red-400"
            }`}>
              {cbState}
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-1">
            Failures: {failureCount} / {failureThreshold}
          </div>
        </div>

        {/* Card 4: Cooldown & Backoff */}
        <div className="p-4 rounded-xl bg-[#0b1220] border border-white/[0.08]">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Recovery Timer</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black font-mono text-blue-400">
            {localCooldown > 0 ? `${localCooldown}s` : "0.0s"}
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-1">
            {localCooldown > 0 ? "Cooling down before retry" : "Ready / Standby"}
          </div>
        </div>

      </div>

      {/* Main Content Grid: In-Memory Cache + Circuit Breaker Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Latest Telemetry Cache */}
        <div className="p-5 rounded-2xl bg-[#0b1220] border border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                Active Node In-Memory Cache
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {latestTelemetry?.timestamp || "Awaiting Telemetry"}
            </span>
          </div>

          {latestTelemetry ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.04]">
                  <span className="text-slate-500 text-[10px]">DEVICE ID</span>
                  <div className="font-bold text-white mt-0.5">{latestTelemetry.deviceId}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.04]">
                  <span className="text-slate-500 text-[10px]">REQUEST ID</span>
                  <div className="font-bold text-cyan-400 mt-0.5 truncate">{latestTelemetry.requestId}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.04]">
                  <span className="text-slate-500 text-[10px]">SYSTEM STATUS</span>
                  <div className={`font-bold mt-0.5 ${
                    latestTelemetry.systemStatus === "NORMAL" ? "text-emerald-400" :
                    latestTelemetry.systemStatus === "WARNING" ? "text-amber-400" : "text-red-400"
                  }`}>
                    {latestTelemetry.systemStatus}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.04]">
                  <span className="text-slate-500 text-[10px]">TEMPERATURE</span>
                  <div className="font-bold text-slate-200 mt-0.5">{latestTelemetry.temperature.toFixed(1)} °C</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.04]">
                  <span className="text-slate-500 text-[10px]">HUMIDITY</span>
                  <div className="font-bold text-slate-200 mt-0.5">{latestTelemetry.humidity.toFixed(1)} %</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.04]">
                  <span className="text-slate-500 text-[10px]">VIBRATION LEVEL</span>
                  <div className="font-bold text-slate-200 mt-0.5">
                    {latestTelemetry.vibrationLevel !== undefined ? latestTelemetry.vibrationLevel.toFixed(3) : "—"} g
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.04]">
                  <span className="text-slate-500 text-[10px]">BUS VOLTAGE</span>
                  <div className="font-bold text-slate-200 mt-0.5">{latestTelemetry.voltage.toFixed(2)} V</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.04]">
                  <span className="text-slate-500 text-[10px]">SHUNT CURRENT</span>
                  <div className="font-bold text-slate-200 mt-0.5">{latestTelemetry.current.toFixed(1)} mA</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.04]">
                  <span className="text-slate-500 text-[10px]">POWER DRAW</span>
                  <div className="font-bold text-slate-200 mt-0.5">{latestTelemetry.power.toFixed(2)} W</div>
                </div>
              </div>

              {latestTelemetry.warningReason && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 font-mono">
                  <span className="font-bold">Edge Warning: </span>
                  {latestTelemetry.warningReason}
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 font-mono text-xs">
              Waiting for incoming telemetry from Tinkercad Arduino or Python simulator...
            </div>
          )}
        </div>

        {/* Right: Resilience Runtime Configuration */}
        <div className="p-5 rounded-2xl bg-[#0b1220] border border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                Circuit Breaker Parameters
              </h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">HOT-RELOADABLE</span>
          </div>

          <form onSubmit={onSaveConfig} className="space-y-4">
            
            {/* Failure Threshold */}
            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <span>Trip Failure Threshold:</span>
                <span className="text-cyan-400 font-bold">{failureThresholdInput} consecutive errors</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={failureThresholdInput}
                onChange={(e) => setFailureThresholdInput(Number(e.target.value))}
                className="w-full accent-cyan-400 bg-slate-900 h-2 rounded-lg cursor-pointer"
              />
              <p className="text-[11px] text-slate-500 mt-1 font-mono">
                Number of failed sync attempts before the circuit opens and protects the cloud.
              </p>
            </div>

            {/* Cooldown Duration */}
            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <span>Cooldown Window:</span>
                <span className="text-blue-400 font-bold">{cooldownDurationInput} seconds</span>
              </div>
              <input
                type="range"
                min={3}
                max={60}
                value={cooldownDurationInput}
                onChange={(e) => setCooldownDurationInput(Number(e.target.value))}
                className="w-full accent-blue-400 bg-slate-900 h-2 rounded-lg cursor-pointer"
              />
              <p className="text-[11px] text-slate-500 mt-1 font-mono">
                Wait time before transitioning from OPEN to HALF-OPEN for probing.
              </p>
            </div>

            {/* Max Backoff */}
            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <span>Max Exponential Backoff:</span>
                <span className="text-purple-400 font-bold">{maxBackoffInput} seconds</span>
              </div>
              <input
                type="range"
                min={8}
                max={120}
                value={maxBackoffInput}
                onChange={(e) => setMaxBackoffInput(Number(e.target.value))}
                className="w-full accent-purple-400 bg-slate-900 h-2 rounded-lg cursor-pointer"
              />
              <p className="text-[11px] text-slate-500 mt-1 font-mono">
                Upper bound for exponential backoff retry delays with jitter.
              </p>
            </div>

            {configFeedback && (
              <div className={`p-2.5 rounded-xl text-xs font-mono ${
                configFeedback.type === "success"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-red-500/10 text-red-400 border border-red-500/20"
              }`}>
                {configFeedback.message}
              </div>
            )}

            <button
              type="submit"
              disabled={isSavingConfig}
              className="w-full py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold rounded-xl shadow-lg shadow-cyan-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Zap className={`w-4 h-4 ${isSavingConfig ? "animate-spin" : ""}`} />
              <span>{isSavingConfig ? "Updating Runtime..." : "Commit Parameters to Gateway"}</span>
            </button>

          </form>
        </div>

      </div>

    </div>
  );
};
