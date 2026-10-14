import React, { useState, useEffect } from "react";
import {
  Cloud,
  ShieldCheck,
  AlertTriangle,
  Zap,
  Activity,
  Server,
  RefreshCw,
  Database,
  CheckCircle2,
  XCircle,
  Clock
} from "lucide-react";
import type { DashboardMetrics } from "../types/dashboard";

interface CloudPageProps {
  metrics: DashboardMetrics | null;
  onToggleCloud: (status: "ONLINE" | "OFFLINE") => void;
  onRunChaos: () => void;
  isChaosRunning: boolean;
}

interface CloudRecord {
  id?: number;
  request_id: string;
  device_id: string;
  temperature?: number;
  humidity?: number;
  vibration_level?: number;
  power?: number;
  gas_level?: number;
  pressure?: number;
  health_score?: number;
  system_status?: string;
  timestamp?: string;
  created_at?: string;
}

export const CloudPage: React.FC<CloudPageProps> = ({
  metrics,
  onToggleCloud,
  onRunChaos,
  isChaosRunning,
}) => {
  const isCloudOnline = metrics?.cloud_api?.status === "ONLINE";
  const [cloudRecords, setCloudRecords] = useState<CloudRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchCloudRecords = async () => {
    setLoadingRecords(true);
    setFetchError(null);
    try {
      // Query Cloud API directly on 8001
      const res = await fetch("http://127.0.0.1:8001/data");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setCloudRecords(data.reverse().slice(0, 50));
        }
      } else {
        setFetchError(`Cloud API returned HTTP ${res.status}`);
      }
    } catch (e: any) {
      setFetchError("Unable to query Cloud API directly on Port 8001. " + (e.message || ""));
    } finally {
      setLoadingRecords(false);
    }
  };

  useEffect(() => {
    fetchCloudRecords();
    const interval = setInterval(fetchCloudRecords, 4000);
    return () => clearInterval(interval);
  }, []);

  const syncedCount = metrics?.synced_queue ?? cloudRecords.length;
  const cbState = metrics?.circuit_breaker_state ?? "CLOSED";
  const failureCount = metrics?.consecutive_failures ?? 0;
  const failureThreshold = metrics?.failure_threshold ?? 3;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Cloud Service Banner */}
      <div className={`p-5 rounded-2xl border flex flex-wrap items-center justify-between gap-4 transition-all ${
        isCloudOnline
          ? "bg-[#0b1220] border-white/[0.08]"
          : "bg-red-950/20 border-red-500/30 shadow-lg shadow-red-950/30"
      }`}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl border ${
            isCloudOnline
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
              : "bg-red-500/20 border-red-500/40 text-red-400 animate-pulse"
          }`}>
            <Cloud className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-bold text-white tracking-tight">Cloud Destination API</h2>
              <span className={`px-2.5 py-0.5 text-xs font-mono font-bold rounded-full border ${
                isCloudOnline
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : "bg-red-500/15 text-red-300 border-red-500/30 animate-pulse"
              }`}>
                {isCloudOnline ? "ONLINE (PORT 8001)" : "SIMULATED OUTAGE (OFFLINE)"}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Primary Endpoint: <code className="text-cyan-400">http://127.0.0.1:8001/data</code> • Idempotent De-duplication on Request-ID
            </p>
          </div>
        </div>

        {/* Resilience Outage Simulation Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onToggleCloud(isCloudOnline ? "OFFLINE" : "ONLINE")}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition shadow-lg ${
              isCloudOnline
                ? "bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 hover:border-red-500/50"
                : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20"
            }`}
          >
            {isCloudOnline ? (
              <>
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span>Simulate Cloud Outage</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-white" />
                <span>Restore Cloud ONLINE</span>
              </>
            )}
          </button>

          <button
            onClick={onRunChaos}
            disabled={isChaosRunning}
            className="px-3.5 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-mono font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
            title="Trigger a 12s chaos outage test with automatic self-recovery"
          >
            <Zap className={`w-4 h-4 text-purple-400 ${isChaosRunning ? "animate-spin" : ""}`} />
            <span>{isChaosRunning ? "Chaos Test Running..." : "Chaos Drill"}</span>
          </button>
        </div>
      </div>

      {/* Cloud KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-4 rounded-xl bg-[#0b1220] border border-white/[0.08]">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Cloud API Status</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-center gap-2">
            {isCloudOnline ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <XCircle className="w-5 h-5 text-red-400 animate-pulse" />
            )}
            <span className={`text-xl font-black font-mono ${isCloudOnline ? "text-emerald-400" : "text-red-400"}`}>
              {isCloudOnline ? "HEALTHY" : "OUTAGE"}
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-1">
            HTTP Status: {isCloudOnline ? "200 OK" : "503 Service Unavailable"}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0b1220] border border-white/[0.08]">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Synchronized Records</span>
            <Database className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-400">
            {syncedCount}
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-1">
            Stored in cloud.db SQLite database
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0b1220] border border-white/[0.08]">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Gateway Circuit Protection</span>
            <Server className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-black font-mono text-white">
            {cbState}
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-1">
            Failures: {failureCount} / {failureThreshold}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0b1220] border border-white/[0.08]">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Sync Latency & Integrity</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black font-mono text-blue-400">
            {isCloudOnline ? "~12 ms" : "BLOCKED"}
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-1">
            100% Zero-Loss Store-and-Forward
          </div>
        </div>

      </div>

      {/* Cloud Database Stream Table */}
      <div className="p-5 rounded-2xl bg-[#0b1220] border border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
              Cloud Database Records Stream (cloud.db)
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-slate-400">
              Showing last {cloudRecords.length} synchronized records
            </span>
            <button
              onClick={fetchCloudRecords}
              disabled={loadingRecords}
              className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-white/[0.06] rounded-lg text-slate-400 hover:text-white transition"
              title="Refresh Cloud Records"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingRecords ? "animate-spin text-emerald-400" : ""}`} />
            </button>
          </div>
        </div>

        {fetchError && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 font-mono">
            {fetchError}
          </div>
        )}

        {cloudRecords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-white/[0.06] text-slate-400 text-[11px]">
                  <th className="py-2.5 px-3">REQ ID</th>
                  <th className="py-2.5 px-3">DEVICE</th>
                  <th className="py-2.5 px-3">TEMP (°C)</th>
                  <th className="py-2.5 px-3">HUM (%)</th>
                  <th className="py-2.5 px-3">VIB (g)</th>
                  <th className="py-2.5 px-3">POWER (W)</th>
                  <th className="py-2.5 px-3">FUSION STATUS</th>
                  <th className="py-2.5 px-3">TIMESTAMP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-slate-300">
                {cloudRecords.map((r, i) => (
                  <tr key={r.request_id || i} className="hover:bg-slate-900/50 transition">
                    <td className="py-2.5 px-3 text-cyan-400 font-semibold">{r.request_id}</td>
                    <td className="py-2.5 px-3 text-white">{r.device_id}</td>
                    <td className="py-2.5 px-3">{r.temperature !== undefined ? r.temperature.toFixed(1) : "—"}</td>
                    <td className="py-2.5 px-3">{r.humidity !== undefined ? r.humidity.toFixed(1) : "—"}</td>
                    <td className="py-2.5 px-3">{r.vibration_level !== undefined ? r.vibration_level.toFixed(3) : "—"}</td>
                    <td className="py-2.5 px-3">{r.power !== undefined ? r.power.toFixed(2) : "—"}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        (r.system_status || "NORMAL") === "NORMAL"
                          ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                          : (r.system_status === "WARNING"
                            ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                            : "bg-red-500/15 text-red-300 border border-red-500/30")
                      }`}>
                        {r.system_status || "NORMAL"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{r.timestamp || r.created_at || "Just now"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500 font-mono text-xs">
            No synchronized records found yet. Ingest telemetry or start the simulator to stream data to Cloud API.
          </div>
        )}
      </div>

    </div>
  );
};
