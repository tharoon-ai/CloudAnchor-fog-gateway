import React from "react";
import {
  Cloud,
  Server,
  ShieldCheck,
  ShieldAlert,
  Database,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  Clock
} from "lucide-react";
import type { SystemMetrics } from "../services/api";

interface KpiMetricsProps {
  metrics: SystemMetrics | null;
  gatewayError: string | null;
}

export const KpiMetrics: React.FC<KpiMetricsProps> = ({ metrics, gatewayError }) => {
  const isCloudOnline = metrics?.cloud_api.status === "ONLINE";
  const cbState = (metrics?.circuit_breaker_state ?? "CLOSED").toUpperCase();
  const pendingCount = metrics?.pending_queue ?? 0;
  const syncedCount = metrics?.synced_queue ?? 0;
  const failedCount = metrics?.failed_queue ?? 0;
  const totalRequests = metrics?.total_requests ?? 0;
  const successRequests = metrics?.success_requests ?? 0;
  const failedRequests = metrics?.failed_requests ?? 0;
  const gatewayMode = metrics?.gateway_mode ?? (isCloudOnline ? "NORMAL" : "DEGRADED");

  const successRate = totalRequests > 0 ? ((successRequests / totalRequests) * 100).toFixed(1) : "100.0";
  const totalQueueRecords = pendingCount + syncedCount + failedCount;
  const syncPercentage = totalQueueRecords > 0 ? Math.round((syncedCount / totalQueueRecords) * 100) : 100;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          System Overview & Ingestion Metrics
        </h2>
        <span className="text-[11px] text-slate-500 font-mono">
          Persistence: SQLite (gateway.db)
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Card 1: Cloud & Circuit Breaker Health */}
        <div className="glass-panel p-4 rounded-2xl flex flex-col justify-between glass-panel-hover">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
              <Cloud className="w-4 h-4 text-blue-400" />
              <span>Upstream Cloud</span>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold border ${
              isCloudOnline
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-red-500/10 text-red-400 border-red-500/20"
            }`}>
              {isCloudOnline ? "ONLINE" : "OFFLINE"}
            </span>
          </div>

          <div className="my-3">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold tracking-tight text-white font-mono">
                {isCloudOnline ? "Connected" : "Outage"}
              </span>
              <span className="text-xs font-mono text-slate-400">:8001/api</span>
            </div>

            <div className="mt-2.5 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                {cbState === "CLOSED" ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                )}
                Circuit State:
              </span>
              <span className={`font-mono font-bold text-[11px] ${
                cbState === "CLOSED" ? "text-emerald-400" : cbState === "OPEN" ? "text-red-400" : "text-blue-400"
              }`}>
                {cbState}
              </span>
            </div>
          </div>

          <div className="w-full bg-slate-950/60 h-1.5 rounded-full overflow-hidden border border-white/[0.04]">
            <div
              className={`h-full transition-all duration-500 ${isCloudOnline ? "bg-emerald-500" : "bg-red-500"}`}
              style={{ width: isCloudOnline ? "100%" : "25%" }}
            />
          </div>
        </div>

        {/* Card 2: Fog Gateway Node Mode */}
        <div className="glass-panel p-4 rounded-2xl flex flex-col justify-between glass-panel-hover">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
              <Server className="w-4 h-4 text-indigo-400" />
              <span>Fog Gateway Engine</span>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold border ${
              gatewayError
                ? "bg-red-500/10 text-red-400 border-red-500/20"
                : gatewayMode === "NORMAL"
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
            }`}>
              {gatewayError ? "OFFLINE" : gatewayMode}
            </span>
          </div>

          <div className="my-3">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold tracking-tight text-white font-mono">
                {gatewayError ? "Disconnected" : gatewayMode === "NORMAL" ? "Optimal" : "Degraded"}
              </span>
              <span className="text-xs font-mono text-slate-400">:8000/api</span>
            </div>

            <div className="mt-2.5 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
              <span>Auto-Failover Mode:</span>
              <span className="font-mono text-slate-300 font-semibold">Local SQLite Buffer</span>
            </div>
          </div>

          <div className="w-full bg-slate-950/60 h-1.5 rounded-full overflow-hidden border border-white/[0.04]">
            <div
              className={`h-full transition-all duration-500 ${
                gatewayError ? "bg-red-500" : gatewayMode === "NORMAL" ? "bg-emerald-500" : "bg-amber-500"
              }`}
              style={{ width: gatewayError ? "0%" : "100%" }}
            />
          </div>
        </div>

        {/* Card 3: Ingestion & Forward Traffic */}
        <div className="glass-panel p-4 rounded-2xl flex flex-col justify-between glass-panel-hover">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              <span>Ingested Telemetry</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold">
              {successRate}% Synced
            </span>
          </div>

          <div className="my-3">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold tracking-tight text-white font-mono">
                {totalRequests}
              </span>
              <span className="text-xs text-slate-400">Total Packets</span>
            </div>

            <div className="mt-2.5 pt-2.5 border-t border-white/[0.06] grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="flex items-center gap-1.5 text-slate-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>OK: <strong className="text-emerald-300 font-semibold">{successRequests}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400 justify-end">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Fail: <strong className={failedRequests > 0 ? "text-amber-300" : "text-slate-400"}>{failedRequests}</strong></span>
              </div>
            </div>
          </div>

          <div className="w-full bg-slate-950/60 h-1.5 rounded-full overflow-hidden border border-white/[0.04]">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, Number(successRate)))}%` }}
            />
          </div>
        </div>

        {/* Card 4: Local SQLite Queue Buffer */}
        <div className={`glass-panel p-4 rounded-2xl flex flex-col justify-between glass-panel-hover ${
          pendingCount > 0 ? "border-amber-500/40 bg-amber-500/[0.03]" : ""
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
              <Database className="w-4 h-4 text-purple-400" />
              <span>Local SQLite Buffer</span>
            </div>
            {pendingCount > 0 ? (
              <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                Buffering
              </span>
            ) : (
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold">
                Idle / Synced
              </span>
            )}
          </div>

          <div className="my-3">
            <div className="flex items-baseline justify-between">
              <span className={`text-2xl font-bold tracking-tight font-mono ${
                pendingCount > 0 ? "text-amber-400" : "text-white"
              }`}>
                {pendingCount}
              </span>
              <span className="text-xs text-slate-400">Pending Sync</span>
            </div>

            <div className="mt-2.5 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" /> Synced: <strong className="text-emerald-400">{syncedCount}</strong>
              </span>
              <span>Failed: <strong className="text-slate-400">{failedCount}</strong></span>
            </div>
          </div>

          <div className="w-full bg-slate-950/60 h-1.5 rounded-full overflow-hidden border border-white/[0.04]">
            <div
              className={`h-full transition-all duration-500 ${pendingCount > 0 ? "bg-amber-400" : "bg-purple-500"}`}
              style={{ width: `${syncPercentage}%` }}
            />
          </div>
        </div>

      </div>
    </section>
  );
};
