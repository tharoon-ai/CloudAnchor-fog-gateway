import React from "react";
import { History } from "lucide-react";
import type { LogEntry, TimelineEvent } from "../types/dashboard";
import { TimelinePanel } from "../components/TimelinePanel";
import { LogsConsole } from "../components/LogsConsole";

interface EventsPageProps {
  logs: LogEntry[];
  timelineEvents: TimelineEvent[];
}

export const EventsPage: React.FC<EventsPageProps> = ({
  logs,
  timelineEvents,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Hero Header */}
      <div className="p-5 rounded-2xl bg-[#0b1220] border border-white/[0.08] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-lg shadow-amber-500/10">
            <History className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-bold text-white tracking-tight">Audit Trail & Gateway Telemetry Logs</h2>
              <span className="px-2.5 py-0.5 text-xs font-mono font-bold rounded-full bg-slate-800 text-slate-300 border border-white/[0.08]">
                {logs.length} BUFFERED LOG ENTRIES
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Live System Ingestion Trace • Circuit Breaker Transitions • Resilience Operations
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Timeline Audit Trail + Real-Time Console */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <TimelinePanel events={timelineEvents} />
        </div>
        <div className="lg:col-span-2">
          <LogsConsole logs={logs} />
        </div>
      </div>

    </div>
  );
};
