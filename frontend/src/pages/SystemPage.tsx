import {
  Server,
  Cloud,
  Database,
  Shield,
  Radio,
  Terminal,
  Cpu,
  Layers,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import type { DashboardMetrics, LogEntry, ParsedTelemetry } from "../types/dashboard";

interface SystemPageProps {
  metrics: DashboardMetrics | null;
  gatewayError: string | null;
  latestTelemetry: ParsedTelemetry | null;
  logs: LogEntry[];
  onToggleCloud: (status: "ONLINE" | "OFFLINE") => void;
}

export const SystemPage: React.FC<SystemPageProps> = ({
  metrics,
  gatewayError,
  latestTelemetry,
  logs,
  onToggleCloud,
}) => {
  const isGatewayOnline = !gatewayError && metrics !== null;
  const isCloudOnline = metrics?.cloud_api?.status === "ONLINE";
  const deviceId = latestTelemetry?.deviceId || "ARDUINO-001";
  const lastUpdatedSec = latestTelemetry?.lastUpdatedSecAgo ?? 0;
  const isStale = lastUpdatedSec > 15;

  const cbState = metrics?.circuit_breaker_state ?? "CLOSED";
  const pendingQueue = metrics?.pending_queue ?? 0;
  const syncedQueue = metrics?.synced_queue ?? 0;
  const failureThreshold = metrics?.failure_threshold ?? 3;
  const consecutiveFailures = metrics?.consecutive_failures ?? 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* 1. HEADER BAR */}
      <div className="p-4 rounded-xl bg-[#101827] border border-[#253247] flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 font-sans tracking-tight">
            System & Infrastructure Status
          </h2>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Real-time status of simulated Arduino hardware, Fog Gateway, local SQLite persistence, and cloud synchronization.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-3 py-1.5 rounded-lg bg-[#151F2E] border border-[#253247] text-slate-300">
            Request: <strong className="text-cyan-400">{latestTelemetry?.requestId || "—"}</strong>
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-[#151F2E] border border-[#253247] text-slate-300">
            Node: <strong className="text-slate-100">{deviceId}</strong>
          </span>
        </div>
      </div>

      {/* 2. COMPACT SYSTEM STATUS CARDS (8 Compact Summary Blocks) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        
        {/* Block 1: Sensor Node */}
        <div className="p-3.5 rounded-xl bg-[#101827] border border-[#253247] space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[10px]">
            <span>SENSOR NODE</span>
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-sm font-bold text-slate-100 font-sans">Arduino Sensor Node</div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-slate-400 font-mono text-[11px]">{deviceId}</span>
            <span className={`px-1.5 py-0.2 text-[9px] font-bold rounded ${
              latestTelemetry && !isStale && isGatewayOnline
                ? "bg-emerald-500/20 text-emerald-400"
                : latestTelemetry
                ? "bg-amber-500/20 text-amber-400"
                : "bg-slate-500/20 text-slate-400"
            }`}>
              {latestTelemetry ? (!isStale && isGatewayOnline ? "● LIVE" : "STALE") : "WAITING"}
            </span>
          </div>
        </div>

        {/* Block 2: Simulation Platform */}
        <div className="p-3.5 rounded-xl bg-[#101827] border border-[#253247] space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[10px]">
            <span>SIMULATION PLATFORM</span>
            <Radio className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-sm font-bold text-slate-100 font-sans">Tinkercad Circuits</div>
          <div className="text-[11px] text-slate-400 pt-1">Arduino Uno Microcontroller</div>
        </div>

        {/* Block 3: Fog Gateway */}
        <div className="p-3.5 rounded-xl bg-[#101827] border border-[#253247] space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[10px]">
            <span>FOG GATEWAY</span>
            <Server className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className={`text-sm font-bold ${isGatewayOnline ? "text-emerald-400" : "text-red-400"}`}>
            {isGatewayOnline ? "ONLINE" : "OFFLINE"}
          </div>
          <div className="text-[11px] text-slate-400 pt-1">Port :8000 • FastAPI</div>
        </div>

        {/* Block 4: Cloud API */}
        <div className="p-3.5 rounded-xl bg-[#101827] border border-[#253247] space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[10px]">
            <span>CLOUD API</span>
            <Cloud className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className={`text-sm font-bold ${isCloudOnline ? "text-emerald-400" : "text-red-400"}`}>
            {isCloudOnline ? "ONLINE" : "OFFLINE"}
          </div>
          <div className="text-[11px] text-slate-400 pt-1">Port :8001 • Target API</div>
        </div>

        {/* Block 5: Database */}
        <div className="p-3.5 rounded-xl bg-[#101827] border border-[#253247] space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[10px]">
            <span>DATABASE</span>
            <Database className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-sm font-bold text-slate-100">SQLite</div>
          <div className="text-[11px] text-slate-400 pt-1">gateway.db (WAL Mode)</div>
        </div>

        {/* Block 6: Pending Queue */}
        <div className="p-3.5 rounded-xl bg-[#101827] border border-[#253247] space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[10px]">
            <span>PENDING QUEUE</span>
            <Layers className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className={`text-sm font-bold ${pendingQueue > 0 ? "text-amber-400" : "text-emerald-400"}`}>
            {pendingQueue} records
          </div>
          <div className="text-[11px] text-slate-400 pt-1">{syncedQueue} synced total</div>
        </div>

        {/* Block 7: Circuit Breaker */}
        <div className="p-3.5 rounded-xl bg-[#101827] border border-[#253247] space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[10px]">
            <span>CIRCUIT BREAKER</span>
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className={`text-sm font-bold ${
            cbState === "CLOSED" ? "text-emerald-400" : cbState === "HALF-OPEN" ? "text-blue-400" : "text-red-400"
          }`}>
            {cbState}
          </div>
          <div className="text-[11px] text-slate-400 pt-1">{consecutiveFailures}/{failureThreshold} failures</div>
        </div>

        {/* Block 8: Last Sync */}
        <div className="p-3.5 rounded-xl bg-[#101827] border border-[#253247] space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[10px]">
            <span>LAST SYNC</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-sm font-bold text-slate-100">
            {latestTelemetry ? `${lastUpdatedSec.toFixed(1)}s ago` : "Waiting"}
          </div>
          <div className="text-[11px] text-emerald-400 pt-1">Automatic sync worker</div>
        </div>

      </div>

      {/* 3. FOG RESILIENCE DATA DELIVERY ARCHITECTURE */}
      <div className="p-5 rounded-xl bg-[#101827] border border-[#253247] space-y-4">
        <div className="flex items-center justify-between border-b border-[#253247] pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-100 font-sans uppercase tracking-wider text-[11px]">
              Data Delivery & Fog Resilience
            </h3>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Core store-and-forward mechanism guaranteeing zero data loss during cloud disconnections.
            </p>
          </div>
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            STORE-AND-FORWARD
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs font-mono">
          
          {/* Normal Online Path */}
          <div className="p-4 rounded-lg bg-[#151F2E] border border-emerald-500/30 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4" />
              <span>NORMAL ONLINE DELIVERY</span>
            </div>
            
            <div className="p-3 rounded bg-[#0B1220] border border-[#253247] text-slate-300 text-[11px] leading-relaxed">
              <span className="text-cyan-400 font-semibold">Sensor Node</span>
              <span className="text-slate-500"> → </span>
              <span className="text-indigo-400 font-semibold">Fog Gateway</span>
              <span className="text-slate-500"> → </span>
              <span className="text-purple-400 font-semibold">SQLite Queue</span>
              <span className="text-slate-500"> → </span>
              <span className="text-emerald-400 font-semibold">Cloud API</span>
            </div>
            <p className="text-xs text-slate-400 font-sans">
              Telemetry packets are validated, persisted to the local SQLite database for durability, and immediately forwarded to the Cloud API in real time.
            </p>
          </div>

          {/* Cloud Outage Resilient Path */}
          <div className="p-4 rounded-lg bg-[#151F2E] border border-amber-500/30 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
              <AlertTriangle className="w-4 h-4" />
              <span>INTERMITTENT CLOUD OUTAGE RECOVERY</span>
            </div>
            
            <div className="p-3 rounded bg-[#0B1220] border border-[#253247] text-slate-300 text-[11px] leading-relaxed">
              <span className="text-cyan-400 font-semibold">Sensor Node</span>
              <span className="text-slate-500"> → </span>
              <span className="text-indigo-400 font-semibold">Fog Gateway</span>
              <span className="text-slate-500"> → </span>
              <span className="text-purple-400 font-semibold">SQLite Queue</span>
              <span className="text-slate-500"> → </span>
              <span className="text-amber-400 font-semibold">Retry / Backoff</span>
              <span className="text-slate-500"> → </span>
              <span className="text-blue-400 font-semibold">Cloud Recovery</span>
              <span className="text-slate-500"> → </span>
              <span className="text-emerald-400 font-semibold">Synchronization</span>
            </div>
            <p className="text-xs text-slate-400 font-sans">
              When the cloud is unreachable, the Circuit Breaker opens to prevent socket exhaustion. All sensor data is safely buffered in SQLite and drained automatically once the cloud recovers.
            </p>
          </div>

        </div>

        {/* Interactive Outage Toggle Button */}
        <div className="pt-2">
          <button
            onClick={() => onToggleCloud(isCloudOnline ? "OFFLINE" : "ONLINE")}
            className={`w-full py-2.5 px-4 rounded-lg text-xs font-mono font-bold transition border flex items-center justify-center gap-2 ${
              isCloudOnline
                ? "bg-red-500/15 hover:bg-red-500/25 text-red-300 border-red-500/30"
                : "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/30"
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>
              {isCloudOnline
                ? "Simulate Cloud Outage Drill (Disconnect Cloud API)"
                : "Restore Cloud Connection (Drain Local SQLite Queue)"}
            </span>
          </button>
        </div>
      </div>

      {/* 4. RECENT SYSTEM EVENT LOGS */}
      <div className="p-5 rounded-xl bg-[#101827] border border-[#253247] space-y-3">
        <div className="flex items-center gap-2 border-b border-[#253247] pb-3">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <div>
            <h3 className="text-sm font-bold text-slate-100 font-sans">
              Recent System Event Stream
            </h3>
            <p className="text-xs text-slate-400 font-sans">
              Audit trail of Arduino telemetry ingests, SQLite storage, and cloud synchronizations.
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-[#080D1A] border border-[#253247] font-mono text-xs space-y-1.5 max-h-48 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="py-6 text-center text-slate-500 text-xs italic">
              Waiting for Tinkercad telemetry...
            </div>
          ) : (
            logs.slice(-10).reverse().map((log) => (
              <div key={log.id} className="flex items-start gap-2.5 text-slate-300">
                <span className="text-slate-500 text-[10px] flex-shrink-0">{log.timestamp.split(" ")[1] || log.timestamp}</span>
                <span className={`px-1.5 py-0.2 text-[9px] font-bold rounded flex-shrink-0 ${
                  log.level === "SUCCESS"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : log.level === "WARNING"
                    ? "bg-amber-500/20 text-amber-400"
                    : log.level === "ERROR"
                    ? "bg-red-500/20 text-red-400"
                    : "bg-blue-500/20 text-blue-400"
                }`}>
                  {log.level}
                </span>
                <span className="text-slate-300 text-xs break-all leading-snug">{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};
