import React, { useState } from "react";
import {
  Clock
} from "lucide-react";
import type { TimelineEvent } from "../types/dashboard";

interface TimelinePanelProps {
  events: TimelineEvent[];
}

export const TimelinePanel: React.FC<TimelinePanelProps> = ({ events }) => {
  const [filter, setFilter] = useState<"ALL" | "CLOUD" | "QUEUE" | "CIRCUIT">("ALL");

  const filteredEvents = events.filter((evt) => {
    if (filter === "ALL") return true;
    if (filter === "CLOUD") return evt.type === "cloud";
    if (filter === "QUEUE") return evt.type === "queue";
    if (filter === "CIRCUIT") return evt.type === "circuit_breaker";
    return true;
  });

  return (
    <section className="glass-panel p-5 rounded-2xl flex flex-col justify-between space-y-4">
      
      {/* Header */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-3.5 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                Resilience Event Audit Trail
              </h3>
              <p className="text-[11px] text-slate-400">
                Chronological log of failovers, circuit-trips, and queue recovery
              </p>
            </div>
          </div>

          <span className="text-[10px] font-mono text-slate-400">
            {filteredEvents.length} Events
          </span>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 mb-3 text-[11px] font-mono">
          <button
            onClick={() => setFilter("ALL")}
            className={`px-2.5 py-1 rounded-lg border transition ${
              filter === "ALL"
                ? "bg-blue-600 text-white border-blue-500"
                : "bg-slate-950/60 border-white/[0.06] text-slate-400 hover:text-slate-200"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("CLOUD")}
            className={`px-2.5 py-1 rounded-lg border transition ${
              filter === "CLOUD"
                ? "bg-blue-600 text-white border-blue-500"
                : "bg-slate-950/60 border-white/[0.06] text-slate-400 hover:text-slate-200"
            }`}
          >
            Cloud
          </button>
          <button
            onClick={() => setFilter("QUEUE")}
            className={`px-2.5 py-1 rounded-lg border transition ${
              filter === "QUEUE"
                ? "bg-blue-600 text-white border-blue-500"
                : "bg-slate-950/60 border-white/[0.06] text-slate-400 hover:text-slate-200"
            }`}
          >
            Queue
          </button>
          <button
            onClick={() => setFilter("CIRCUIT")}
            className={`px-2.5 py-1 rounded-lg border transition ${
              filter === "CIRCUIT"
                ? "bg-blue-600 text-white border-blue-500"
                : "bg-slate-950/60 border-white/[0.06] text-slate-400 hover:text-slate-200"
            }`}
          >
            Circuit Breaker
          </button>
        </div>

        {/* Timeline Events List */}
        <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
          {filteredEvents.length === 0 ? (
            <div className="p-8 text-center text-slate-500 space-y-2">
              <Clock className="w-6 h-6 mx-auto text-slate-600" />
              <p className="text-xs">No events match the selected filter.</p>
            </div>
          ) : (
            filteredEvents.map((evt) => {
              let dotColor = "bg-blue-400";
              if (evt.level === "success") {
                dotColor = "bg-emerald-400";
              } else if (evt.level === "error") {
                dotColor = "bg-red-400";
              } else if (evt.level === "warning") {
                dotColor = "bg-amber-400";
              }

              return (
                <div key={evt.id} className="flex items-start gap-3 text-xs group">
                  <div className="relative mt-1">
                    <span className={`w-2.5 h-2.5 rounded-full block ${dotColor}`} />
                  </div>

                  <div className="flex-1 bg-slate-950/60 border border-white/[0.04] p-2.5 rounded-xl group-hover:border-white/[0.1] transition-all">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-200 text-[11px]">{evt.title}</span>
                      <span className="font-mono text-[10px] text-slate-500">{evt.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{evt.description}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="pt-3 border-t border-white/[0.06] text-[10px] font-mono text-slate-500 flex justify-between">
        <span>Lifecycle Engine: Active</span>
        <span>Auto-Journaled</span>
      </div>

    </section>
  );
};
