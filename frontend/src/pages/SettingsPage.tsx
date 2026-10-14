import React from "react";
import {
  Settings,
  Sliders,
  Zap,
  Globe,
  Radio,
  Server,
  Cloud,
  Send,
  BookOpen
} from "lucide-react";
import type { DashboardMetrics } from "../types/dashboard";

interface SettingsPageProps {
  metrics: DashboardMetrics | null;
  failureThresholdInput: number;
  setFailureThresholdInput: (v: number) => void;
  cooldownDurationInput: number;
  setCooldownDurationInput: (v: number) => void;
  maxBackoffInput: number;
  setMaxBackoffInput: (v: number) => void;
  onSaveConfig: (e?: React.FormEvent) => void;
  isSavingConfig: boolean;
  configFeedback: { message: string; type: "success" | "error" } | null;
  autoRefreshInterval: number;
  setAutoRefreshInterval: (v: number) => void;
  onOpenManualIngest: () => void;
  onOpenArchitecture: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  failureThresholdInput,
  setFailureThresholdInput,
  cooldownDurationInput,
  setCooldownDurationInput,
  maxBackoffInput,
  setMaxBackoffInput,
  onSaveConfig,
  isSavingConfig,
  configFeedback,
  autoRefreshInterval,
  setAutoRefreshInterval,
  onOpenManualIngest,
  onOpenArchitecture,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Hero Header */}
      <div className="p-5 rounded-2xl bg-[#0b1220] border border-white/[0.08] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 shadow-lg shadow-cyan-500/10">
            <Settings className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-bold text-white tracking-tight">System & Gateway Settings</h2>
              <span className="px-2.5 py-0.5 text-xs font-mono font-bold rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                RUNTIME CONFIGURATION
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Resilience Circuit Parameters • Telemetry Polling Frequencies • Network Endpoints
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenArchitecture}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/[0.08] rounded-xl text-xs font-mono font-semibold flex items-center gap-2 transition"
          >
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span>Architecture Specs</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Circuit Breaker Tuning */}
        <div className="p-5 rounded-2xl bg-[#0b1220] border border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                Circuit Breaker & Backoff Tuning
              </h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">HOT-RELOADABLE</span>
          </div>

          <form onSubmit={onSaveConfig} className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <span>Failure Threshold:</span>
                <span className="text-cyan-400 font-bold">{failureThresholdInput} failures</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={failureThresholdInput}
                onChange={(e) => setFailureThresholdInput(Number(e.target.value))}
                className="w-full accent-cyan-400 bg-slate-900 h-2 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <span>Cooldown Duration:</span>
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
            </div>

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
              <span>{isSavingConfig ? "Saving..." : "Apply Runtime Configuration"}</span>
            </button>
          </form>
        </div>

        {/* Right: Network Endpoints & UI Preferences */}
        <div className="space-y-6">
          
          {/* Dashboard Polling */}
          <div className="p-5 rounded-2xl bg-[#0b1220] border border-white/[0.08] space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400" />
              Live Telemetry Polling Rate
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: "1.5s (Realtime)", val: 1500 },
                { label: "3.0s (Normal)", val: 3000 },
                { label: "5.0s (Eco)", val: 5000 },
                { label: "Paused", val: 0 },
              ].map((opt) => (
                <button
                  key={opt.val}
                  onClick={() => setAutoRefreshInterval(opt.val)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-mono font-bold border transition ${
                    autoRefreshInterval === opt.val
                      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                      : "bg-slate-900/60 text-slate-400 border-white/[0.04] hover:text-slate-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Endpoints Table */}
          <div className="p-5 rounded-2xl bg-[#0b1220] border border-white/[0.08] space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-400" />
              Active System Network Endpoints
            </h3>

            <div className="space-y-2 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/[0.04] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-300">Fog Gateway Ingestion:</span>
                </div>
                <code className="text-cyan-400 font-bold">http://127.0.0.1:8000/data</code>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/[0.04] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-emerald-400" />
                  <span className="text-slate-300">Cloud Destination API:</span>
                </div>
                <code className="text-emerald-400 font-bold">http://127.0.0.1:8001/data</code>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/[0.04] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-300">NOC Frontend Dashboard:</span>
                </div>
                <code className="text-purple-400 font-bold">http://localhost:5173</code>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={onOpenManualIngest}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-white/[0.08] rounded-xl text-xs font-mono font-semibold flex items-center justify-center gap-2 transition"
              >
                <Send className="w-4 h-4 text-emerald-400" />
                <span>Open Custom Telemetry Packet Ingestion Composer</span>
              </button>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
