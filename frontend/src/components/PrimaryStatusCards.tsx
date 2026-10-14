import React from "react";
import { Server, Cloud, Shield, Database, Activity } from "lucide-react";
import type { DashboardMetrics } from "../types/dashboard";

interface PrimaryStatusCardsProps {
  metrics: DashboardMetrics | null;
  gatewayError: string | null;
}

export const PrimaryStatusCards: React.FC<PrimaryStatusCardsProps> = ({
  metrics,
  gatewayError,
}) => {
  const isCloudOnline = metrics?.cloud_api?.status === "ONLINE";
  const isGatewayOnline = !gatewayError && metrics !== null;
  const cbState = metrics?.circuit_breaker_state ?? "CLOSED";
  const pendingCount = metrics?.pending_queue ?? 0;
  const syncedCount = metrics?.synced_queue ?? 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      
      {/* 1. GATEWAY CARD */}
      <div className="p-4 rounded-xl bg-[#101827] border border-[#253247] flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Server className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-300 font-sans">Fog Gateway</span>
          </div>
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
            isGatewayOnline
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25"
              : "bg-red-500/10 text-red-400 border border-red-500/25"
          }`}>
            {isGatewayOnline ? "ONLINE" : "OFFLINE"}
          </span>
        </div>

        <div>
          <div className="text-xl font-bold font-mono text-slate-100">
            {metrics?.gateway_mode ?? "NORMAL"}
          </div>
          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
            Ingestion Port: 8000
          </p>
        </div>

        <div className="pt-2 border-t border-[#253247] text-[11px] font-mono text-slate-400 flex items-center justify-between">
          <span>Processed: <strong className="text-slate-200">{metrics?.total_requests ?? 0}</strong></span>
          <span className="text-emerald-400 flex items-center gap-1">
            <Activity className="w-3 h-3" /> Live
          </span>
        </div>
      </div>

      {/* 2. CLOUD API CARD */}
      <div className="p-4 rounded-xl bg-[#101827] border border-[#253247] flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Cloud className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-300 font-sans">Cloud API</span>
          </div>
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
            isCloudOnline
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25"
              : "bg-red-500/10 text-red-400 border border-red-500/25 animate-pulse"
          }`}>
            {isCloudOnline ? "ONLINE" : "OUTAGE"}
          </span>
        </div>

        <div>
          <div className="text-xl font-bold font-mono text-slate-100">
            {syncedCount.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
            Synchronized Records (cloud.db)
          </p>
        </div>

        <div className="pt-2 border-t border-[#253247] text-[11px] font-mono text-slate-400 flex items-center justify-between">
          <span>Target: <strong className="text-slate-200">:8001/data</strong></span>
          <span className={isCloudOnline ? "text-emerald-400" : "text-red-400 font-bold"}>
            {isCloudOnline ? "Connected" : "Outage"}
          </span>
        </div>
      </div>

      {/* 3. CIRCUIT BREAKER CARD */}
      <div className="p-4 rounded-xl bg-[#101827] border border-[#253247] flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg border ${
              cbState === "CLOSED"
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : cbState === "HALF-OPEN"
                ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                : "bg-red-500/10 text-red-400 border-red-500/20"
            }`}>
              <Shield className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-300 font-sans">Circuit Breaker</span>
          </div>
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
            cbState === "CLOSED"
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25"
              : cbState === "HALF-OPEN"
              ? "bg-blue-500/10 text-blue-400 border border-blue-500/25"
              : "bg-red-500/10 text-red-400 border border-red-500/25"
          }`}>
            {cbState}
          </span>
        </div>

        <div>
          <div className="text-xl font-bold font-mono text-slate-100">
            {cbState}
          </div>
          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
            Failures: {metrics?.consecutive_failures ?? 0} / {metrics?.failure_threshold ?? 3}
          </p>
        </div>

        <div className="pt-2 border-t border-[#253247] text-[11px] font-mono text-slate-400 flex items-center justify-between">
          <span>Cooldown: {metrics?.cooldown_remaining ? `${metrics.cooldown_remaining.toFixed(1)}s` : "0.0s"}</span>
          <span>Backoff: {metrics?.max_backoff ?? 32}s</span>
        </div>
      </div>

      {/* 4. SQLITE QUEUE CARD */}
      <div className="p-4 rounded-xl bg-[#101827] border border-[#253247] flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Database className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-300 font-sans">Local Queue</span>
          </div>
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
            pendingCount > 0
              ? "bg-amber-500/10 text-amber-300 border border-amber-500/30"
              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25"
          }`}>
            {pendingCount > 0 ? "BUFFERING" : "DRAINED"}
          </span>
        </div>

        <div>
          <div className="text-xl font-bold font-mono text-slate-100 flex items-baseline gap-2">
            <span className={pendingCount > 0 ? "text-amber-400" : "text-slate-100"}>
              {pendingCount}
            </span>
            <span className="text-xs text-slate-400 font-normal font-sans">pending records</span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
            gateway.db (WAL Mode)
          </p>
        </div>

        <div className="pt-2 border-t border-[#253247] text-[11px] font-mono text-slate-400 flex items-center justify-between">
          <span>Failed: {metrics?.failed_queue ?? 0}</span>
          <span className="text-purple-400">FIFO Drain</span>
        </div>
      </div>

    </div>
  );
};
