import React from "react";
import {
  Cpu,
  Server,
  Database,
  Cloud,
  ArrowRight,
  Activity
} from "lucide-react";
import type { SystemMetrics } from "../services/api";

interface TopologyPipelineProps {
  metrics: SystemMetrics | null;
  gatewayError: string | null;
}

export const TopologyPipeline: React.FC<TopologyPipelineProps> = ({ metrics, gatewayError }) => {
  const isCloudOnline = metrics?.cloud_api.status === "ONLINE";
  const cbState = (metrics?.circuit_breaker_state ?? "CLOSED").toUpperCase();
  const pendingCount = metrics?.pending_queue ?? 0;

  return (
    <section className="glass-panel p-5 rounded-2xl space-y-4">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              Resilient Topology & Data Flow Pipeline
            </h3>
            <p className="text-[11px] text-slate-400">
              End-to-end edge-to-cloud ingestion pipeline with autonomous SQLite store-and-forward fallback
            </p>
          </div>
        </div>

        {/* Pipeline State Status Badge */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <div className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${
            isCloudOnline && cbState === "CLOSED"
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : pendingCount > 0
              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
              : "bg-red-500/10 text-red-400 border-red-500/20"
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              isCloudOnline && cbState === "CLOSED" ? "bg-emerald-400" : "bg-amber-400 animate-ping"
            }`} />
            <span>
              {isCloudOnline && cbState === "CLOSED"
                ? "Direct Streaming Flow"
                : pendingCount > 0
                ? "Autonomous Store-and-Forward Active"
                : "Degraded Path"}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Topology Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5 relative pt-1">
        
        {/* Node 1: IoT Edge */}
        <div className="glass-panel p-4 rounded-xl relative flex flex-col justify-between border-white/[0.06] hover:border-blue-500/30 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Cpu className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Active
            </span>
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Edge Node</span>
            <h4 className="text-sm font-bold text-white tracking-tight">Arduino Uno / Tinkercad</h4>
            <p className="text-[11px] text-slate-400 mt-1">
              DHT22 Temperature & Humidity Sensor Telemetry
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>Protocol: HTTP POST</span>
            <span>Freq: 2.0s</span>
          </div>

          {/* Flow Indicator Arrow */}
          <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-6 h-6 rounded-full bg-[#0d131f] border border-white/[0.12] items-center justify-center text-blue-400 shadow-md">
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Node 2: Fog Gateway */}
        <div className="glass-panel p-4 rounded-xl relative flex flex-col justify-between border-white/[0.06] hover:border-blue-500/30 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Server className="w-5 h-5" />
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
              gatewayError ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            }`}>
              {gatewayError ? "Error" : "Port 8000"}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Fog Layer</span>
            <h4 className="text-sm font-bold text-white tracking-tight">CloudAnchor Gateway</h4>
            <p className="text-[11px] text-slate-400 mt-1">
              Ingestion proxy, Circuit Breaker & Queue Manager
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>FastAPI ASGI</span>
            <span>Uvicorn Server</span>
          </div>

          {/* Flow Indicator Arrow */}
          <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-6 h-6 rounded-full bg-[#0d131f] border border-white/[0.12] items-center justify-center text-blue-400 shadow-md">
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Node 3: Local SQLite Queue Buffer */}
        <div className={`glass-panel p-4 rounded-xl relative flex flex-col justify-between transition-all group ${
          pendingCount > 0
            ? "border-amber-500/40 bg-amber-500/[0.03]"
            : "border-white/[0.06] hover:border-purple-500/30"
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className={`p-2.5 rounded-xl border ${
              pendingCount > 0
                ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                : "bg-purple-500/10 border-purple-500/20 text-purple-400"
            }`}>
              <Database className="w-5 h-5" />
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
              pendingCount > 0
                ? "bg-amber-500/10 text-amber-400 border-amber-500/20 font-bold"
                : "bg-purple-500/10 text-purple-400 border-purple-500/20"
            }`}>
              {pendingCount > 0 ? `${pendingCount} Buffered` : "Standby"}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Persistence Engine</span>
            <h4 className="text-sm font-bold text-white tracking-tight">SQLite Buffer (gateway.db)</h4>
            <p className="text-[11px] text-slate-400 mt-1">
              Guarantees zero data loss across power cuts and outages
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>Async Worker: 5s</span>
            <span>Crash-Resistant</span>
          </div>

          {/* Flow Indicator Arrow */}
          <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-6 h-6 rounded-full bg-[#0d131f] border border-white/[0.12] items-center justify-center shadow-md">
            <ArrowRight className={`w-3.5 h-3.5 ${isCloudOnline ? "text-emerald-400" : "text-slate-600"}`} />
          </div>
        </div>

        {/* Node 4: Cloud API */}
        <div className={`glass-panel p-4 rounded-xl relative flex flex-col justify-between transition-all group ${
          isCloudOnline
            ? "border-white/[0.06] hover:border-emerald-500/30"
            : "border-red-500/40 bg-red-500/[0.03]"
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className={`p-2.5 rounded-xl border ${
              isCloudOnline
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-red-500/10 border-red-500/20 text-red-400"
            }`}>
              <Cloud className="w-5 h-5" />
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
              isCloudOnline
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-bold"
                : "bg-red-500/10 text-red-400 border-red-500/20 font-bold"
            }`}>
              {isCloudOnline ? "Port 8001" : "Disconnected"}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Cloud Core</span>
            <h4 className="text-sm font-bold text-white tracking-tight">Simulated Cloud API</h4>
            <p className="text-[11px] text-slate-400 mt-1">
              Final analytical store & centralized cloud repository (cloud.db)
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>Destination DB</span>
            <span>REST Receiver</span>
          </div>
        </div>

      </div>

    </section>
  );
};
