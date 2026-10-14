import React from "react";
import {
  Sliders,
  Wifi,
  WifiOff,
  Save,
  Check,
  AlertTriangle,
  HelpCircle
} from "lucide-react";

interface ResilienceLabProps {
  isCloudOnline: boolean;
  onToggleCloud: (status: "ONLINE" | "OFFLINE") => void;
  failureThresholdInput: number;
  setFailureThresholdInput: (val: number) => void;
  cooldownDurationInput: number;
  setCooldownDurationInput: (val: number) => void;
  maxBackoffInput: number;
  setMaxBackoffInput: (val: number) => void;
  onSaveConfig: (e?: React.FormEvent) => void;
  isSavingConfig: boolean;
  configFeedback: { message: string; type: "success" | "error" } | null;
}

export const ResilienceLab: React.FC<ResilienceLabProps> = ({
  isCloudOnline,
  onToggleCloud,
  failureThresholdInput,
  setFailureThresholdInput,
  cooldownDurationInput,
  setCooldownDurationInput,
  maxBackoffInput,
  setMaxBackoffInput,
  onSaveConfig,
  isSavingConfig,
  configFeedback,
}) => {
  // Preset handler
  const applyPreset = (threshold: number, cooldown: number, backoff: number) => {
    setFailureThresholdInput(threshold);
    setCooldownDurationInput(cooldown);
    setMaxBackoffInput(backoff);
  };

  return (
    <section className="glass-panel p-5 rounded-2xl space-y-4">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              Resilience Lab & Fault Injection
            </h3>
            <p className="text-[11px] text-slate-400">
              Trigger cloud failure scenarios and tune runtime circuit breaker parameters in real time
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
          Live FSM Tuner
        </span>
      </div>

      {/* Outage Simulation Controls */}
      <div className="space-y-2">
        <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block">
          Cloud Network Link Control
        </label>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onToggleCloud("ONLINE")}
            className={`py-3 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm ${
              isCloudOnline
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 ring-1 ring-emerald-500/30"
                : "bg-[#121826] hover:bg-[#1a2336] border border-white/[0.08] text-slate-400 hover:text-white"
            }`}
          >
            <Wifi className="w-4 h-4 text-emerald-400" />
            <span>RESTORE CLOUD</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleCloud("OFFLINE")}
            className={`py-3 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm ${
              !isCloudOnline
                ? "bg-red-500/20 text-red-300 border border-red-500/40 ring-1 ring-red-500/30"
                : "bg-[#121826] hover:bg-[#1a2336] border border-white/[0.08] text-slate-400 hover:text-white"
            }`}
          >
            <WifiOff className="w-4 h-4 text-red-400" />
            <span>SIMULATE OUTAGE</span>
          </button>
        </div>
      </div>

      {/* Preset Profiles */}
      <div className="pt-2">
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
          <span>Quick Tuning Presets:</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs font-mono">
          <button
            type="button"
            onClick={() => applyPreset(1, 5, 16)}
            className="p-1.5 rounded-lg bg-[#121826] hover:bg-[#1b2336] border border-white/[0.06] text-slate-300 hover:text-white text-center transition"
          >
            ⚡ Fast Test
          </button>
          <button
            type="button"
            onClick={() => applyPreset(3, 10, 32)}
            className="p-1.5 rounded-lg bg-[#121826] hover:bg-[#1b2336] border border-white/[0.06] text-slate-300 hover:text-white text-center transition"
          >
            🎯 Standard
          </button>
          <button
            type="button"
            onClick={() => applyPreset(5, 20, 64)}
            className="p-1.5 rounded-lg bg-[#121826] hover:bg-[#1b2336] border border-white/[0.06] text-slate-300 hover:text-white text-center transition"
          >
            🛡️ High Tolerance
          </button>
        </div>
      </div>

      {/* Parameter Sliders */}
      <form onSubmit={onSaveConfig} className="space-y-3.5 pt-2 border-t border-white/[0.06]">
        
        {/* Feedback Alert */}
        {configFeedback && (
          <div className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 ${
            configFeedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-red-500/10 border-red-500/30 text-red-300"
          }`}>
            {configFeedback.type === "success" ? (
              <Check className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-400" />
            )}
            <span>{configFeedback.message}</span>
          </div>
        )}

        {/* 1. Failure Threshold */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-300 font-medium">Failure Threshold</span>
            <span className="font-mono font-bold text-amber-400 bg-slate-950/80 px-2 py-0.5 rounded border border-white/[0.08]">
              {failureThresholdInput} failures
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={failureThresholdInput}
            onChange={(e) => setFailureThresholdInput(Number(e.target.value))}
            className="w-full accent-blue-500 bg-slate-950 rounded-lg cursor-pointer h-1.5"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>1 (Fast Trip)</span>
            <span>10 (Lenient)</span>
          </div>
        </div>

        {/* 2. Cooldown Duration */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-300 font-medium">Cooldown Duration</span>
            <span className="font-mono font-bold text-blue-400 bg-slate-950/80 px-2 py-0.5 rounded border border-white/[0.08]">
              {cooldownDurationInput}s
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={300}
            step={1}
            value={cooldownDurationInput}
            onChange={(e) => setCooldownDurationInput(Number(e.target.value))}
            className="w-full accent-blue-500 bg-slate-950 rounded-lg cursor-pointer h-1.5"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>1s (Rapid Probe)</span>
            <span>300s (Extended)</span>
          </div>
        </div>

        {/* 3. Maximum Backoff */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-300 font-medium">Maximum Exponential Backoff</span>
            <span className="font-mono font-bold text-purple-400 bg-slate-950/80 px-2 py-0.5 rounded border border-white/[0.08]">
              {maxBackoffInput}s
            </span>
          </div>
          <input
            type="range"
            min={2}
            max={300}
            step={1}
            value={maxBackoffInput}
            onChange={(e) => setMaxBackoffInput(Number(e.target.value))}
            className="w-full accent-blue-500 bg-slate-950 rounded-lg cursor-pointer h-1.5"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>2s (Quick Retry)</span>
            <span>300s (Heavy Backoff)</span>
          </div>
        </div>

        {/* Apply Button */}
        <button
          type="submit"
          disabled={isSavingConfig}
          className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50 mt-2"
        >
          <Save className="w-4 h-4" />
          <span>{isSavingConfig ? "Updating Parameters..." : "Apply Runtime Configuration"}</span>
        </button>

      </form>

      {/* Guide Note */}
      <div className="p-3 bg-slate-950/60 rounded-xl border border-white/[0.04] text-[11px] text-slate-400 space-y-1">
        <span className="font-semibold text-slate-300 block flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
          Test Protocol:
        </span>
        <p>1. Click <strong className="text-red-300">SIMULATE OUTAGE</strong> to inject an upstream failure.</p>
        <p>2. Observe incoming sensor packets get securely buffered to SQLite without dropping.</p>
        <p>3. Click <strong className="text-emerald-300">RESTORE CLOUD</strong> to witness automatic queue synchronization.</p>
      </div>

    </section>
  );
};
