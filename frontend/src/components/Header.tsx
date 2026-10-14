import React from "react";
import {
  RefreshCw,
  ExternalLink,
  Shield,
  Activity,
  Radio,
  Sliders,
  Terminal
} from "lucide-react";
import type { SystemMetrics } from "../services/api";

interface HeaderProps {
  metrics: SystemMetrics | null;
  gatewayError: string | null;
  loading: boolean;
  onRefresh: () => void;
  autoRefreshInterval: number;
  setAutoRefreshInterval: (interval: number) => void;
  activeView: "all" | "resilience" | "logs";
  setActiveView: (view: "all" | "resilience" | "logs") => void;
}

export const Header: React.FC<HeaderProps> = ({
  metrics,
  gatewayError,
  loading,
  onRefresh,
  autoRefreshInterval,
  setAutoRefreshInterval,
  activeView,
  setActiveView,
}) => {
  const isCloudOnline = metrics?.cloud_api.status === "ONLINE";

  return (
    <header className="border-b border-white/[0.08] bg-[#090d16]/90 sticky top-0 z-40 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        
        {/* Brand & Subtitle */}
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-white/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#090d16] ${
              gatewayError ? "bg-red-500" : isCloudOnline ? "bg-emerald-500" : "bg-amber-500"
            }`} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-white tracking-tight">CloudAnchor</span>
              <span className="text-[11px] font-medium font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                v1.4 Enterprise
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Fog-Assisted Resilient Gateway Console
            </p>
          </div>
        </div>

        {/* View Mode Selector Tabs */}
        <div className="hidden md:flex items-center p-1 bg-[#121826] border border-white/[0.06] rounded-xl text-xs">
          <button
            onClick={() => setActiveView("all")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              activeView === "all"
                ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Cockpit Overview
          </button>
          <button
            onClick={() => setActiveView("resilience")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              activeView === "resilience"
                ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Resilience & Circuit Breaker
          </button>
          <button
            onClick={() => setActiveView("logs")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              activeView === "logs"
                ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Live Logs & Audit
          </button>
        </div>

        {/* System Indicators & Quick Controls */}
        <div className="flex items-center gap-2.5">
          
          {/* Quick Endpoint Health Badge */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-[#121826] border border-white/[0.06] rounded-xl text-[11px] font-mono">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${gatewayError ? "bg-red-500" : "bg-emerald-400"}`} />
              <span className="text-slate-300">Fog :8000</span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isCloudOnline ? "bg-emerald-400" : "bg-red-500"}`} />
              <span className="text-slate-300">Cloud :8001</span>
            </div>
          </div>

          {/* Polling Interval Dropdown */}
          <div className="flex items-center gap-1.5 bg-[#121826] border border-white/[0.06] rounded-xl px-2.5 py-1 text-xs text-slate-300">
            <Radio className={`w-3.5 h-3.5 ${autoRefreshInterval > 0 ? "text-emerald-400 animate-pulse" : "text-slate-500"}`} />
            <select
              value={autoRefreshInterval}
              onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
              className="bg-transparent text-slate-300 text-xs focus:outline-none cursor-pointer pr-1 font-mono"
            >
              <option value={2000} className="bg-slate-900 text-white">2s</option>
              <option value={3000} className="bg-slate-900 text-white">3s (Default)</option>
              <option value={5000} className="bg-slate-900 text-white">5s</option>
              <option value={0} className="bg-slate-900 text-white">Paused</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 bg-[#121826] hover:bg-[#1b2336] border border-white/[0.08] hover:border-white/20 text-slate-300 hover:text-white rounded-xl transition-all disabled:opacity-50"
            title="Manual Fetch"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-400" : ""}`} />
          </button>

          {/* Swagger Docs Dropdown / Links */}
          <a
            href="http://127.0.0.1:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 bg-[#121826] hover:bg-[#1b2336] border border-white/[0.06] rounded-xl transition"
            title="Open Gateway OpenAPI documentation"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="font-mono text-[11px]">API Docs</span>
          </a>

        </div>

      </div>
    </header>
  );
};
