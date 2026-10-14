import { useState, useEffect, useMemo } from "react";
import { RefreshCw, AlertTriangle } from "lucide-react";
import * as api from "./services/api";
import type { DashboardMetrics, LogEntry, ParsedTelemetry, ChartDataPoint, NavTab } from "./types/dashboard";

import { Sidebar } from "./components/Sidebar";
import { TopHeader } from "./components/TopHeader";
import { Toast } from "./components/Toast";

import { OverviewPage } from "./pages/OverviewPage";
import { SensorsPage } from "./pages/SensorsPage";
import { DataCalculationPage } from "./pages/DataCalculationPage";
import { SystemPage } from "./pages/SystemPage";

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>("overview");
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [gatewayError, setGatewayError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [autoRefreshInterval] = useState<number>(3000);

  // Telemetry timeseries history for Recharts
  const [telemetryHistory, setTelemetryHistory] = useState<ChartDataPoint[]>([]);

  // Fetch metrics & logs from backend
  const fetchData = async () => {
    try {
      const [met, lg] = await Promise.all([
        api.fetchMetrics(),
        api.fetchLogs(),
      ]);
      setMetrics(met);
      setLogs(lg);
      setGatewayError(null);
    } catch (err: any) {
      console.error("Gateway fetch error:", err);
      setGatewayError("Gateway connection unavailable. Verify that CloudAnchor Fog Gateway (Port 8000) is running.");
    } finally {
      setLoading(false);
    }
  };

  // Live polling effect
  useEffect(() => {
    fetchData();
    if (autoRefreshInterval <= 0) return;

    const interval = setInterval(fetchData, autoRefreshInterval);
    return () => clearInterval(interval);
  }, [autoRefreshInterval]);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Handle Cloud Resilience Toggle
  const handleToggleCloud = async (status: "ONLINE" | "OFFLINE") => {
    try {
      await api.setCloudStatus(status);
      showToast(
        status === "ONLINE" ? "Cloud API restored to ONLINE" : "Cloud outage simulated (OFFLINE)",
        "success"
      );
      await fetchData();
    } catch (e: any) {
      showToast("Failed to update cloud resilience state", "error");
    }
  };

  // Extract latest multi-sensor telemetry & fusion state (Purely Event-Driven)
  const latestTelemetry = useMemo<ParsedTelemetry | null>(() => {
    if (metrics?.latest_telemetry) {
      const t = metrics.latest_telemetry;
      const volt = t.voltage ?? 5.0;
      const curr = t.current ?? 0.0;
      const pwr = t.power ?? parseFloat(((volt * curr) / 1000.0).toFixed(3));

      return {
        deviceId: t.device_id || "ARDUINO-001",
        requestId: t.request_id || "N/A",
        timestamp: t.timestamp || "Live",
        temperature: t.temperature,
        humidity: t.humidity,
        voltage: volt,
        current: curr,
        power: pwr,
        healthScore: t.health_score ?? null,
        systemStatus: t.system_status || "NORMAL",
        riskLevel: t.risk_level || "LOW",
        warningReason: t.warning_reason,
        sensorStatus: t.sensor_status,
        statusLabel: t.label,
        lastUpdatedSecAgo: t.last_updated_sec_ago,
        accelerationX: t.acceleration_x,
        accelerationY: t.acceleration_y,
        accelerationZ: t.acceleration_z,
        vibrationLevel: t.vibration_level,
        gasLevel: t.gas_level,
        pressure: t.pressure,
      };
    }
    return null;
  }, [metrics?.latest_telemetry]);

  // Update telemetry chart history when new telemetry arrives
  useEffect(() => {
    if (!latestTelemetry) return;
    const timeStr = latestTelemetry.timestamp.split(" ")[1] || latestTelemetry.timestamp;

    setTelemetryHistory((prev) => {
      const lastPoint = prev[prev.length - 1];
      if (lastPoint && lastPoint.time === timeStr) return prev;

      const newPoint: ChartDataPoint = {
        time: timeStr,
        temperature: latestTelemetry.temperature,
        humidity: latestTelemetry.humidity,
        vibrationLevel: latestTelemetry.vibrationLevel ?? 0,
        voltage: latestTelemetry.voltage,
        current: latestTelemetry.current,
        power: latestTelemetry.power,
        healthScore: latestTelemetry.healthScore ?? 100,
      };

      const updated = [...prev, newPoint];
      return updated.slice(-20);
    });
  }, [latestTelemetry]);

  // Initial loading state
  if (loading && !metrics && !gatewayError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0B1220] text-slate-200">
        <div className="p-4 rounded-xl bg-[#151F2E] border border-[#253247] mb-4">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
        <h1 className="text-sm font-bold text-slate-100 font-sans tracking-tight">Initializing CloudAnchor Control Platform</h1>
        <p className="text-xs text-slate-400 mt-1 font-mono">Connecting to Fog Gateway at http://127.0.0.1:8000...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1220] text-slate-100 flex font-sans selection:bg-cyan-600 selection:text-white">
      
      {/* Toast Feedback */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* 1. Left Navigation Sidebar (Exactly 4 Tabs) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        metrics={metrics}
        gatewayError={gatewayError}
      />

      {/* 2. Main Work Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Header */}
        <TopHeader
          activeTab={activeTab}
          metrics={metrics}
          gatewayError={gatewayError}
          loading={loading}
          onRefresh={() => { setLoading(true); fetchData(); }}
        />

        {/* Gateway Error Warning Banner */}
        {gatewayError && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2.5">
            <div className="flex items-center justify-between text-xs text-amber-300">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>{gatewayError}</span>
              </div>
              <button
                onClick={() => { setLoading(true); fetchData(); }}
                className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 rounded font-semibold text-xs transition"
              >
                Retry Connection
              </button>
            </div>
          </div>
        )}

        {/* Tab Page Router - 4 Main Pages */}
        <main className="flex-1 p-6 space-y-6">
          {activeTab === "overview" && (
            <OverviewPage
              metrics={metrics}
              gatewayError={gatewayError}
              latestTelemetry={latestTelemetry}
            />
          )}

          {activeTab === "sensors" && (
            <SensorsPage
              latestTelemetry={latestTelemetry}
              telemetryHistory={telemetryHistory}
            />
          )}

          {activeTab === "data_calc" && (
            <DataCalculationPage
              latestTelemetry={latestTelemetry}
            />
          )}

          {activeTab === "system" && (
            <SystemPage
              metrics={metrics}
              gatewayError={gatewayError}
              latestTelemetry={latestTelemetry}
              logs={logs}
              onToggleCloud={handleToggleCloud}
            />
          )}
        </main>

        {/* Industrial Engineering Footer */}
        <footer className="border-t border-[#253247] bg-[#0A101D] py-3.5 px-6 text-xs text-slate-400 font-sans flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">CloudAnchor</span>
            <span className="text-slate-600">•</span>
            <span>Fog-Assisted Resilient Gateway for Intermittent Cloud APIs</span>
          </div>
          <span className="font-mono text-[11px] text-slate-500">SQLite Store-and-Forward + Circuit Breaker FSM</span>
        </footer>

      </div>

    </div>
  );
}
