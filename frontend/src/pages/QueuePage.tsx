import React from "react";
import {
  Database,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  Shield,
  Layers,
  ExternalLink
} from "lucide-react";
import type { DashboardMetrics } from "../types/dashboard";

interface QueuePageProps {
  metrics: DashboardMetrics | null;
  onOpenDatabase: () => void;
}

export const QueuePage: React.FC<QueuePageProps> = ({
  metrics,
  onOpenDatabase,
}) => {
  const pending = metrics?.pending_queue ?? 0;
  const synced = metrics?.synced_queue ?? 0;
  const total = pending + synced;
  const cbState = metrics?.circuit_breaker_state ?? "CLOSED";

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Hero Header */}
      <div className="p-5 rounded-2xl bg-[#0b1220] border border-white/[0.08] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-lg shadow-amber-500/10">
            <Database className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-bold text-white tracking-tight">SQLite Store-and-Forward Buffer</h2>
              <span className={`px-2.5 py-0.5 text-xs font-mono font-bold rounded-full border ${
                pending === 0
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse"
              }`}>
                {pending === 0 ? "BUFFER DRAINED (0 PENDING)" : `${pending} RECORDS BUFFERED`}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Zero Data Loss Architecture • ACID-Compliant SQLite Buffer with WAL Journaling • Exponential Backoff Retries
            </p>
          </div>
        </div>

        <button
          onClick={onOpenDatabase}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-white/[0.08] rounded-xl text-xs font-mono font-semibold flex items-center gap-2 transition"
        >
          <ExternalLink className="w-4 h-4 text-cyan-400" />
          <span>Open Full Database Inspector</span>
        </button>
      </div>

      {/* Queue Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="p-4 rounded-xl bg-[#0b1220] border border-white/[0.08]">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Pending Local Records</span>
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-400">
            {pending.toLocaleString()}
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-1">
            Buffered locally awaiting cloud recovery
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0b1220] border border-white/[0.08]">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Synchronized Records</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-400">
            {synced.toLocaleString()}
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-1">
            Confirmed delivery to cloud.db
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0b1220] border border-white/[0.08]">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Total Processed Volume</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black font-mono text-white">
            {total.toLocaleString()}
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-1">
            100% Ingestion Durability Rate
          </div>
        </div>

      </div>

      {/* Visual Pipeline of Queue Lifecycle */}
      <div className="p-5 rounded-2xl bg-[#0b1220] border border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
              Store-and-Forward Queue Lifecycle Flow
            </h3>
          </div>
          <span className="text-[10px] font-mono text-cyan-400">STATE MACHINE</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
          
          {/* Step 1: Arduino Ingestion */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/15 text-blue-300">
                STAGE 1
              </span>
              <span className="w-2 h-2 rounded-full bg-blue-400" />
            </div>
            <div className="font-bold text-white text-sm">Edge Ingest</div>
            <p className="text-[11px] text-slate-400 font-mono leading-relaxed">
              HTTP POST received from Tinkercad Arduino / simulator. Request validated and assigned unique Request-ID.
            </p>
          </div>

          {/* Step 2: Atomic SQLite Insert */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300">
                STAGE 2
              </span>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            </div>
            <div className="font-bold text-white text-sm">Buffer Persistence</div>
            <p className="text-[11px] text-slate-400 font-mono leading-relaxed">
              Payload written to <code className="text-amber-300">gateway.db</code> with status <code className="text-amber-300">PENDING</code> before any network egress.
            </p>
          </div>

          {/* Step 3: Circuit Breaker Inspection */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/15 text-purple-300">
                STAGE 3
              </span>
              <span className={`w-2 h-2 rounded-full ${cbState === "CLOSED" ? "bg-emerald-400" : "bg-red-400 animate-ping"}`} />
            </div>
            <div className="font-bold text-white text-sm">Circuit Check</div>
            <p className="text-[11px] text-slate-400 font-mono leading-relaxed">
              Circuit Breaker state is evaluated ({cbState}). If OPEN, request is held in buffer without hammering Cloud API.
            </p>
          </div>

          {/* Step 4: Cloud Sync & Confirmation */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300">
                STAGE 4
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </div>
            <div className="font-bold text-white text-sm">Delivery & ACK</div>
            <p className="text-[11px] text-slate-400 font-mono leading-relaxed">
              Forwarded to Cloud API. Upon HTTP 200/201, local record is marked <code className="text-emerald-300">SYNCED</code>.
            </p>
          </div>

        </div>

      </div>

      {/* Queue Resilience Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <div className="p-5 rounded-2xl bg-[#0b1220] border border-white/[0.08] space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-cyan-400" />
            Database Architecture Specs
          </h3>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-2 border-b border-white/[0.04]">
              <span className="text-slate-400">Database Engine:</span>
              <span className="text-white font-bold">SQLite 3 (Local Embedded)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/[0.04]">
              <span className="text-slate-400">Journaling Mode:</span>
              <span className="text-emerald-400 font-bold">WAL (Write-Ahead Logging)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/[0.04]">
              <span className="text-slate-400">Crash Recovery:</span>
              <span className="text-white font-bold">Automatic on Fog Gateway Boot</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/[0.04]">
              <span className="text-slate-400">Idempotency Key:</span>
              <span className="text-cyan-400 font-bold">request_id (UUID/String)</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-400">Data Loss Guarantee:</span>
              <span className="text-emerald-400 font-bold">0% (Zero-Drop Policy)</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0b1220] border border-white/[0.08] space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-400" />
            Store-and-Forward Health Summary
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed font-mono">
            When Cloud Anchor encounters intermittent network drops or simulated outages, all incoming sensor data continues to be safely ingested and committed to the local queue. As soon as connectivity is restored, the background worker automatically flushes the queue in sequential order without dropping any data points.
          </p>

          <div className="pt-3">
            <button
              onClick={onOpenDatabase}
              className="w-full py-2.5 px-4 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-2 transition"
            >
              <Database className="w-4 h-4 text-purple-400" />
              <span>Inspect All Rows in SQLite Buffer</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
