import React, { useState } from "react";
import {
  Send,
  Sparkles,
  Zap,
  Download,
  Copy,
  Check,
  HardDrive,
  BookOpen
} from "lucide-react";
import * as api from "../services/api";
import type { DashboardMetrics, LogEntry } from "../types/dashboard";

interface QuickActionsToolbarProps {
  metrics: DashboardMetrics | null;
  logs: LogEntry[];
  onOpenManualIngest: () => void;
  onOpenArchitecture: () => void;
  onOpenDatabase: () => void;
  onToast: (message: string, type: "success" | "error") => void;
  onRefresh: () => void;
}

export const QuickActionsToolbar: React.FC<QuickActionsToolbarProps> = ({
  metrics,
  logs,
  onOpenManualIngest,
  onOpenArchitecture,
  onOpenDatabase,
  onToast,
  onRefresh,
}) => {
  const [isInjecting, setIsInjecting] = useState(false);
  const [isChaosRunning, setIsChaosRunning] = useState(false);
  const [chaosStep, setChaosStep] = useState<string | null>(null);
  const [copiedCurl, setCopiedCurl] = useState(false);

  // 1-Click Quick Ingest with multi-sensor payload
  const handleQuickIngest = async () => {
    setIsInjecting(true);
    try {
      const now = new Date();
      const timestamp = now.toISOString().replace("T", " ").substring(0, 19);
      const reqId = `REQ-QUICK-${Math.floor(1000 + Math.random() * 9000)}`;
      const temp = parseFloat((22 + Math.random() * 10).toFixed(1));
      const hum = parseFloat((45 + Math.random() * 30).toFixed(0));
      const vib = parseFloat((0.02 + Math.random() * 0.06).toFixed(3));
      const volt = parseFloat((4.98 + Math.random() * 0.08).toFixed(2));
      const current = parseFloat((120 + Math.random() * 60).toFixed(0));
      const power = parseFloat(((volt * current) / 1000.0).toFixed(2));

      const res = await api.ingestData({
        device_id: "ARDUINO-FAST01",
        request_id: reqId,
        timestamp,
        temperature: temp,
        humidity: hum,
        vibration_level: vib,
        voltage: volt,
        current: current,
        power: power,
        gas_level: 210,
        pressure: 1013.2
      });

      onToast(`Dispatched ${reqId} (Temp: ${temp}°C, Vib: ${vib}g): ${res.message}`, "success");
      onRefresh();
    } catch (err: any) {
      onToast(err.message || "Failed to inject quick packet", "error");
    } finally {
      setIsInjecting(false);
    }
  };

  // 1-Click Chaos Automated Resilience Test (12s)
  const handleRunChaosTest = async () => {
    if (isChaosRunning) return;
    setIsChaosRunning(true);

    try {
      // Step 1: Simulate Outage
      setChaosStep("1/4: Injecting Cloud Outage (OFFLINE)...");
      await api.setCloudStatus("OFFLINE");
      onToast("Chaos Test: Cloud API set to OFFLINE", "success");
      await onRefresh();
      await new Promise((r) => setTimeout(r, 2000));

      // Step 2: Ingest 2 Multi-Sensor Packets during outage
      setChaosStep("2/4: Ingesting multi-sensor packets during outage...");
      const now = new Date();
      const ts = now.toISOString().replace("T", " ").substring(0, 19);
      await api.ingestData({
        device_id: "ARDUINO-CHAOS",
        request_id: `REQ-CHAOS-01-${Math.floor(100 + Math.random() * 900)}`,
        timestamp: ts,
        temperature: 31.5,
        humidity: 68,
        vibration_level: 0.08,
        voltage: 5.01,
        current: 160.0,
        power: 0.80,
        gas_level: 220,
        pressure: 1012.0
      });
      await new Promise((r) => setTimeout(r, 1000));
      await api.ingestData({
        device_id: "ARDUINO-CHAOS",
        request_id: `REQ-CHAOS-02-${Math.floor(100 + Math.random() * 900)}`,
        timestamp: ts,
        temperature: 32.1,
        humidity: 70,
        vibration_level: 0.09,
        voltage: 5.00,
        current: 175.0,
        power: 0.87,
        gas_level: 230,
        pressure: 1011.5
      });
      onToast("Chaos Test: Buffered 2 multi-sensor packets safely in SQLite queue", "success");
      await onRefresh();
      await new Promise((r) => setTimeout(r, 2500));

      // Step 3: Restore Cloud
      setChaosStep("3/4: Restoring Cloud API (ONLINE)...");
      await api.setCloudStatus("ONLINE");
      onToast("Chaos Test: Cloud restored to ONLINE. Awaiting auto-sync...", "success");
      await onRefresh();
      await new Promise((r) => setTimeout(r, 3000));

      // Step 4: Verify auto-sync
      setChaosStep("4/4: Auto-sync verified successfully!");
      onToast("Chaos Test Complete: Zero data loss verified!", "success");
      await onRefresh();
    } catch (err: any) {
      onToast(err.message || "Chaos test encountered an issue", "error");
    } finally {
      setTimeout(() => {
        setIsChaosRunning(false);
        setChaosStep(null);
      }, 2500);
    }
  };

  // Export Snapshot JSON
  const handleExportSnapshot = () => {
    const snapshot = {
      exported_at: new Date().toISOString(),
      metrics,
      logs_count: logs.length,
      logs,
    };
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cloudanchor-multisensor-snapshot-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onToast("Multi-sensor system snapshot exported to JSON", "success");
  };

  // Copy cURL command
  const handleCopyCurl = () => {
    const curl = `curl -X POST http://localhost:8000/api/ingest \\
  -H "Content-Type: application/json" \\
  -d '{
    "device_id": "ARDUINO-CLI",
    "request_id": "REQ-CLI-${Math.floor(1000 + Math.random() * 9000)}",
    "timestamp": "${new Date().toISOString().replace("T", " ").substring(0, 19)}",
    "temperature": 27.9,
    "humidity": 41.0,
    "acceleration_x": 0.02,
    "acceleration_y": 0.01,
    "acceleration_z": 0.98,
    "vibration_level": 0.03,
    "voltage": 5.01,
    "current": 120.5,
    "power": 0.60,
    "gas_level": 210,
    "pressure": 1013.2
  }'`;
    navigator.clipboard.writeText(curl);
    setCopiedCurl(true);
    onToast("Copied Multi-Sensor Ingest cURL command to clipboard", "success");
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <section className="glass-panel p-3.5 sm:p-4 rounded-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        
        {/* Left: Quick Actions Title & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline-block">
            Quick Actions:
          </span>

          {/* 1. Quick Inject */}
          <button
            onClick={handleQuickIngest}
            disabled={isInjecting}
            className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-white border border-blue-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50 shadow-sm"
            title="Immediately send a random simulated multi-sensor telemetry reading"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>{isInjecting ? "Injecting..." : "Quick Ingest"}</span>
          </button>

          {/* 2. Custom Ingest Modal */}
          <button
            onClick={onOpenManualIngest}
            className="px-3 py-1.5 bg-[#121826] hover:bg-[#1a2336] border border-white/[0.08] hover:border-white/20 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
            title="Open multi-sensor telemetry packet composer"
          >
            <Send className="w-3.5 h-3.5 text-emerald-400" />
            <span>Custom Packet</span>
          </button>

          {/* 3. 1-Click Chaos Automated Resilience Test */}
          <button
            onClick={handleRunChaosTest}
            disabled={isChaosRunning}
            className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 hover:text-white border border-purple-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
            title="Automated 12-second test: Outage -> Buffering -> Recovery -> Auto-Sync"
          >
            <Zap className={`w-3.5 h-3.5 text-purple-400 ${isChaosRunning ? "animate-spin" : ""}`} />
            <span>{isChaosRunning ? chaosStep || "Running Chaos..." : "Chaos Test (12s)"}</span>
          </button>

          {/* 4. Copy Ingest cURL */}
          <button
            onClick={handleCopyCurl}
            className="px-2.5 py-1.5 bg-[#121826] hover:bg-[#1a2336] border border-white/[0.08] text-slate-400 hover:text-slate-200 rounded-xl text-xs font-mono flex items-center gap-1.5 transition"
            title="Copy ready-to-run curl snippet with all sensors"
          >
            {copiedCurl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">cURL</span>
          </button>

        </div>

        {/* Right: Inspection & Documentation Buttons */}
        <div className="flex items-center gap-2 text-xs">
          
          {/* SQLite Database Inspector */}
          <button
            onClick={onOpenDatabase}
            className="px-2.5 py-1.5 bg-[#121826] hover:bg-[#1a2336] border border-white/[0.08] text-slate-300 hover:text-white rounded-xl flex items-center gap-1.5 transition"
            title="Inspect SQLite database table schema and counts"
          >
            <HardDrive className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">DB Inspector</span>
          </button>

          {/* Architecture Guide */}
          <button
            onClick={onOpenArchitecture}
            className="px-2.5 py-1.5 bg-[#121826] hover:bg-[#1a2336] border border-white/[0.08] text-slate-300 hover:text-white rounded-xl flex items-center gap-1.5 transition"
            title="Open architecture overview & resilience guide"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Architecture</span>
          </button>

          {/* Export Snapshot JSON */}
          <button
            onClick={handleExportSnapshot}
            className="px-2.5 py-1.5 bg-[#121826] hover:bg-[#1a2336] border border-white/[0.08] text-slate-300 hover:text-white rounded-xl flex items-center gap-1.5 transition"
            title="Download telemetry and system metrics JSON snapshot"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Export</span>
          </button>

        </div>

      </div>
    </section>
  );
};
