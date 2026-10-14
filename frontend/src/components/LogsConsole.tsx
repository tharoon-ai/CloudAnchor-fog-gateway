import React, { useState, useRef, useEffect } from "react";
import {
  Terminal,
  Search,
  Copy,
  Check,
  ArrowDownCircle,
  Pause,
  Download,
  Trash2
} from "lucide-react";
import type { TechnicalLog } from "../services/api";

interface LogsConsoleProps {
  logs: TechnicalLog[];
}

export const LogsConsole: React.FC<LogsConsoleProps> = ({ logs }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("ALL");
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isCleared, setIsCleared] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Reset clear when new logs arrive
  useEffect(() => {
    if (isCleared) {
      setIsCleared(false);
    }
  }, [logs.length]);

  // Auto-scroll when logs change if autoScroll is enabled
  useEffect(() => {
    if (autoScroll && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  // Filter logs
  const displayLogs = isCleared ? [] : logs;
  const filteredLogs = displayLogs.filter((log) => {
    const matchesLevel = levelFilter === "ALL" || log.level === levelFilter;
    const matchesSearch =
      searchQuery === "" ||
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.timestamp.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  const handleCopyLogs = () => {
    const text = filteredLogs
      .map((l) => `[${l.timestamp}] [${l.level}] ${l.message}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadLogs = () => {
    const text = filteredLogs
      .map((l) => `[${l.timestamp}] [${l.level}] ${l.message}`)
      .join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cloudanchor-logs-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="glass-panel p-5 rounded-2xl flex flex-col justify-between space-y-3.5">
      
      {/* Console Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              Real-Time Ingestion Logs & Console
            </h3>
            <p className="text-[11px] text-slate-400">
              Live stdout observability stream for gateway forwarding, queue events, and error traces
            </p>
          </div>
        </div>

        {/* Console Action Buttons */}
        <div className="flex items-center gap-1.5 text-xs font-mono">
          
          {/* Clear View */}
          <button
            onClick={() => setIsCleared(true)}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-white/[0.08] text-slate-400 hover:text-white rounded-lg transition"
            title="Clear display logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Download Logs */}
          <button
            onClick={handleDownloadLogs}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-white/[0.08] text-slate-400 hover:text-white rounded-lg transition"
            title="Download logs as .txt"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Follow/Pause */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-2 py-1 rounded-lg border flex items-center gap-1.5 transition ${
              autoScroll
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-slate-900 text-slate-400 border-white/[0.08]"
            }`}
            title={autoScroll ? "Auto-scroll is ON" : "Auto-scroll is PAUSED"}
          >
            {autoScroll ? <ArrowDownCircle className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{autoScroll ? "Follow" : "Paused"}</span>
          </button>

          {/* Copy */}
          <button
            onClick={handleCopyLogs}
            className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-white/[0.08] hover:border-white/20 text-slate-300 rounded-lg flex items-center gap-1.5 transition"
            title="Copy filtered logs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Level Badges */}
        <div className="flex items-center gap-1.5 font-mono text-[11px]">
          {["ALL", "INFO", "SUCCESS", "WARNING", "ERROR"].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setLevelFilter(lvl)}
              className={`px-2 py-0.5 rounded-md border transition ${
                levelFilter === lvl
                  ? "bg-blue-600 text-white border-blue-500 font-semibold"
                  : "bg-slate-950/60 border-white/[0.06] text-slate-400 hover:text-slate-200"
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search logs by ID, message..."
            className="w-full pl-8 pr-3 py-1 bg-slate-950/80 border border-white/[0.08] focus:border-blue-500/50 rounded-lg text-slate-200 placeholder-slate-500 text-xs focus:outline-none font-mono"
          />
        </div>

      </div>

      {/* Terminal Viewport */}
      <div
        ref={terminalRef}
        className="bg-[#050810] border border-white/[0.06] rounded-xl p-3.5 font-mono text-[11px] space-y-1.5 max-h-[360px] min-h-[220px] overflow-y-auto shadow-inner"
      >
        {filteredLogs.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-slate-600 space-y-2 text-center">
            <Terminal className="w-6 h-6" />
            <p className="text-xs">No logs matching the current filter.</p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            let levelBadge = "text-blue-400 bg-blue-500/10 border-blue-500/20";
            if (log.level === "SUCCESS") levelBadge = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
            if (log.level === "WARNING") levelBadge = "text-amber-400 bg-amber-500/10 border-amber-500/20";
            if (log.level === "ERROR") levelBadge = "text-red-400 bg-red-500/10 border-red-500/20";

            return (
              <div
                key={log.id}
                className="flex items-start gap-2.5 py-1 px-1.5 rounded hover:bg-white/[0.02] transition"
              >
                <span className="text-[10px] text-slate-500 flex-shrink-0 select-none pt-0.5">
                  {log.timestamp.split(" ")[1] || log.timestamp}
                </span>

                <span className={`text-[9.5px] px-1.5 py-0.2 rounded border font-semibold flex-shrink-0 select-none ${levelBadge}`}>
                  {log.level}
                </span>

                <span className="text-slate-300 leading-relaxed break-all flex-1">
                  {log.message}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Console Footer Status */}
      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 border-t border-white/[0.04] pt-2">
        <span>Showing {filteredLogs.length} / {logs.length} entries</span>
        <span>Storage: RAM Buffer (100 cap)</span>
      </div>

    </section>
  );
};
