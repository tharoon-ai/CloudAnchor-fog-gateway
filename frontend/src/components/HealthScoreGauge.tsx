import React from "react";
import { ShieldCheck, AlertTriangle, ShieldAlert } from "lucide-react";
import type { SystemStatus, RiskLevel } from "../types/dashboard";

interface HealthScoreGaugeProps {
  score: number;
  status: SystemStatus;
  riskLevel: RiskLevel;
  warningReason?: string | null;
}

export const HealthScoreGauge: React.FC<HealthScoreGaugeProps> = ({
  score,
  status,
  riskLevel,
  warningReason,
}) => {
  const radius = 68;
  const strokeWidth = 9;
  const circumference = Math.PI * radius;
  const clampedScore = Math.max(0, Math.min(100, score));
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  const getStatusTheme = () => {
    switch (status) {
      case "NORMAL":
        return {
          stroke: "#22C55E",
          text: "text-emerald-400",
          badgeBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
          icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
        };
      case "WARNING":
        return {
          stroke: "#F59E0B",
          text: "text-amber-400",
          badgeBg: "bg-amber-500/10 text-amber-400 border-amber-500/25",
          icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
        };
      case "CRITICAL":
        return {
          stroke: "#EF4444",
          text: "text-red-400",
          badgeBg: "bg-red-500/10 text-red-400 border-red-500/25",
          icon: <ShieldAlert className="w-4 h-4 text-red-400" />,
        };
      default:
        return {
          stroke: "#3B82F6",
          text: "text-blue-400",
          badgeBg: "bg-blue-500/10 text-blue-400 border-blue-500/25",
          icon: <ShieldCheck className="w-4 h-4 text-blue-400" />,
        };
    }
  };

  const theme = getStatusTheme();

  return (
    <div className="p-5 rounded-xl bg-[#101827] border border-[#253247] flex flex-col justify-between">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#253247] pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-[#151F2E] border border-[#253247]">
            {theme.icon}
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-sans">
              System Health & Edge Fusion
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Rule-Based Edge Intelligence
            </p>
          </div>
        </div>

        <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold border ${theme.badgeBg}`}>
          {status}
        </span>
      </div>

      {/* Main Gauge */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-2">
        
        {/* Semi-Circular SVG Gauge */}
        <div className="relative flex flex-col items-center justify-center">
          <svg width="160" height="95" className="overflow-visible">
            <path
              d="M 12 85 A 68 68 0 0 1 148 85"
              fill="none"
              stroke="#1E293B"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            <path
              d="M 12 85 A 68 68 0 0 1 148 85"
              fill="none"
              stroke={theme.stroke}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-500 ease-out"
            />
          </svg>

          <div className="absolute bottom-0 text-center">
            <div className="text-3xl font-black font-mono tracking-tight text-slate-100">
              {score}
            </div>
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              Health Index / 100
            </div>
          </div>
        </div>

        {/* Diagnostics Summary */}
        <div className="flex-1 space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between p-2 rounded-lg bg-[#151F2E] border border-[#253247]">
            <span className="text-slate-400">Risk Level:</span>
            <span className={`font-bold ${
              riskLevel === "LOW" ? "text-emerald-400" : riskLevel === "MEDIUM" ? "text-amber-400" : "text-red-400"
            }`}>
              {riskLevel} RISK
            </span>
          </div>
          
          <div className="flex items-center justify-between p-2 rounded-lg bg-[#151F2E] border border-[#253247]">
            <span className="text-slate-400">Inference:</span>
            <span className="text-cyan-400 font-semibold">Fog Gateway :8000</span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-[#151F2E] border border-[#253247]">
            <span className="text-slate-400">Evaluation:</span>
            <span className="text-slate-200">Deterministic Rules</span>
          </div>
        </div>

      </div>

      {/* Dynamic Warning or Nominal Banner */}
      <div className="mt-4 pt-3 border-t border-[#253247]">
        {warningReason ? (
          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-xs text-amber-300 font-sans flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold font-mono">Detected Anomaly:</span> {warningReason}
            </div>
          </div>
        ) : (
          <div className="text-[11px] text-slate-400 flex items-center justify-between font-mono">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              All sensor boundaries nominal
            </span>
            <span className="text-slate-500">Autonomous Edge Check</span>
          </div>
        )}
      </div>

    </div>
  );
};
