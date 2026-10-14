import {
  ShieldCheck,
  Server,
  Cloud,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Thermometer,
  Droplets,
  Zap,
  Info
} from "lucide-react";
import type { DashboardMetrics, ParsedTelemetry } from "../types/dashboard";

interface OverviewPageProps {
  metrics: DashboardMetrics | null;
  gatewayError: string | null;
  latestTelemetry: ParsedTelemetry | null;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  metrics,
  gatewayError,
  latestTelemetry,
}) => {
  const isGatewayOnline = !gatewayError && metrics !== null;
  const isCloudOnline = metrics?.cloud_api?.status === "ONLINE";
  const hasData = latestTelemetry !== null;
  
  const healthScore = hasData ? (latestTelemetry.healthScore ?? 100) : null;
  const systemStatus = hasData ? (latestTelemetry.systemStatus || "NORMAL") : "NO DATA";
  const warningReason = latestTelemetry?.warningReason;
  const lastUpdatedSec = latestTelemetry?.lastUpdatedSecAgo ?? 0;
  const isStale = hasData && lastUpdatedSec > 15;
  const deviceId = latestTelemetry?.deviceId || "ARDUINO-001";

  // Core 5 Tinkercad sensor parameters (3 primary + 2 derived)
  const sensorItems = [
    {
      name: "Temperature",
      value: hasData ? `${latestTelemetry.temperature.toFixed(1)} °C` : "—",
      unit: "°C",
      icon: <Thermometer className="w-4 h-4 text-rose-400" />,
      source: "Tinkercad Simulation",
      type: "Primary Sensor",
      status: hasData ? (latestTelemetry.temperature > 40 ? "WARNING" : "NORMAL") : "NO DATA",
    },
    {
      name: "Humidity",
      value: hasData ? `${latestTelemetry.humidity.toFixed(1)} %` : "—",
      unit: "%",
      icon: <Droplets className="w-4 h-4 text-blue-400" />,
      source: "Tinkercad Simulation",
      type: "Primary Sensor",
      status: hasData ? ((latestTelemetry.humidity > 80 || latestTelemetry.humidity < 20) ? "WARNING" : "NORMAL") : "NO DATA",
    },
    {
      name: "Voltage",
      value: hasData ? `${latestTelemetry.voltage.toFixed(2)} V` : "—",
      unit: "V",
      icon: <Zap className="w-4 h-4 text-amber-400" />,
      source: "Electrical Input",
      type: "Primary Sensor",
      status: hasData ? ((latestTelemetry.voltage < 4.7 || latestTelemetry.voltage > 5.3) ? "WARNING" : "NORMAL") : "NO DATA",
    },
    {
      name: "Current",
      value: hasData ? `${latestTelemetry.current.toFixed(1)} mA` : "—",
      unit: "mA",
      icon: <Zap className="w-4 h-4 text-cyan-400" />,
      source: "Simulated Load",
      type: "Derived Measurement",
      status: hasData ? (latestTelemetry.current > 350 ? "WARNING" : "NORMAL") : "NO DATA",
    },
    {
      name: "Power",
      value: hasData ? `${latestTelemetry.power.toFixed(3)} W` : "—",
      unit: "W",
      icon: <Zap className="w-4 h-4 text-emerald-400" />,
      source: "P = V × I",
      type: "Derived Calculation",
      status: hasData ? (latestTelemetry.power > 1.8 ? "WARNING" : "NORMAL") : "NO DATA",
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* 1. TOP ROW: 5 COMPACT STATUS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        
        {/* Card 1: System Health */}
        <div className="p-4 rounded-xl bg-[#101827] border border-[#253247] flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>SYSTEM HEALTH</span>
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-100 font-mono tracking-tight">
              {healthScore !== null ? `${healthScore} ` : "— "}
              <span className="text-xs text-slate-500 font-normal">/ 100</span>
            </span>
            <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded ${
              systemStatus === "NORMAL"
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                : systemStatus === "WARNING"
                ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                : systemStatus === "CRITICAL"
                ? "bg-red-500/15 text-red-400 border border-red-500/30"
                : "bg-slate-800 text-slate-400 border border-[#253247]"
            }`}>
              {systemStatus}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-sans">
            Rule-Based Sensor Fusion
          </div>
        </div>

        {/* Card 2: Request Number */}
        <div className="p-4 rounded-xl bg-[#101827] border border-[#253247] flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>REQUEST NUMBER</span>
            <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
              ARDUINO
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-cyan-400 tracking-tight">
              {hasData ? latestTelemetry.requestId : "—"}
            </span>
            <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded ${
              hasData ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30" : "bg-slate-800 text-slate-400 border border-[#253247]"
            }`}>
              {hasData ? "AUTHORITATIVE" : "WAITING"}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-sans">
            Sequential Tinkercad Telemetry ID
          </div>
        </div>

        {/* Card 3: Sensor Node */}
        <div className="p-4 rounded-xl bg-[#101827] border border-[#253247] flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>SENSOR NODE</span>
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold font-mono text-slate-100 tracking-tight">
              {deviceId}
            </span>
            <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded ${
              hasData && !isStale && isGatewayOnline
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                : hasData && isStale
                ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                : "bg-slate-800 text-slate-400 border border-[#253247]"
            }`}>
              {hasData && !isStale && isGatewayOnline ? "● LIVE" : hasData ? "DATA STALE" : "WAITING"}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-sans">
            Tinkercad Arduino Simulation
          </div>
        </div>

        {/* Card 4: Fog Gateway */}
        <div className="p-4 rounded-xl bg-[#101827] border border-[#253247] flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>FOG GATEWAY</span>
            <Server className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className={`text-xl font-bold font-mono tracking-tight ${isGatewayOnline ? "text-emerald-400" : "text-red-400"}`}>
              {isGatewayOnline ? "ONLINE" : "OFFLINE"}
            </span>
            <span className="text-xs font-mono text-slate-400">
              Port :8000
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-sans">
            Event-Driven Ingestion • SQLite WAL
          </div>
        </div>

        {/* Card 5: Cloud API */}
        <div className="p-4 rounded-xl bg-[#101827] border border-[#253247] flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>CLOUD API</span>
            <Cloud className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className={`text-xl font-bold font-mono tracking-tight ${isCloudOnline ? "text-emerald-400" : "text-red-400"}`}>
              {isCloudOnline ? "ONLINE" : "OFFLINE"}
            </span>
            <span className="text-xs font-mono text-slate-400">
              {metrics ? `${metrics.synced_queue} synced` : "—"}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-sans">
            {isCloudOnline ? "Synchronizing Upstream" : "Buffered in SQLite queue"}
          </div>
        </div>

      </div>

      {/* 2. CURRENT SENSOR VALUES */}
      <div className="p-5 rounded-xl bg-[#101827] border border-[#253247] space-y-4">
        <div className="flex items-center justify-between border-b border-[#253247] pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-100 font-sans uppercase tracking-wider">
              Current Sensor Values
            </h2>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Live telemetry stream generated by the simulated Arduino sensor node.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Device: <strong className="text-slate-200">{deviceId}</strong>
          </span>
        </div>

        {/* Clean Table / Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sensorItems.map((item) => (
            <div
              key={item.name}
              className="p-3.5 rounded-lg bg-[#151F2E] border border-[#253247] flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-[#101827] border border-[#253247]">
                  {item.icon}
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-200 font-sans">
                    {item.name}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">
                    {item.source} • {item.type}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-base font-bold font-mono text-slate-100">
                  {item.value}
                </div>
                <span className={`text-[10px] font-mono font-semibold ${
                  item.status === "NORMAL"
                    ? "text-emerald-400"
                    : item.status === "WARNING"
                    ? "text-amber-400"
                    : item.status === "CRITICAL"
                    ? "text-red-400"
                    : "text-slate-500"
                }`}>
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. SYSTEM STATUS BANNER */}
      <div className={`p-4 rounded-xl border flex items-center gap-3.5 ${
        !hasData
          ? "bg-[#101827] border-[#253247]"
          : systemStatus === "NORMAL"
          ? "bg-[#101827] border-[#253247]"
          : systemStatus === "WARNING"
          ? "bg-amber-950/20 border-amber-500/30"
          : "bg-red-950/20 border-red-500/30"
      }`}>
        <div className="p-2 rounded-lg bg-[#151F2E] border border-[#253247] flex-shrink-0">
          {!hasData ? (
            <Info className="w-5 h-5 text-slate-400" />
          ) : systemStatus === "NORMAL" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : systemStatus === "WARNING" ? (
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          ) : (
            <XCircle className="w-5 h-5 text-red-400" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-slate-200 uppercase">
              System Status:
            </span>
            <span className={`text-xs font-mono font-bold ${
              !hasData
                ? "text-slate-400"
                : systemStatus === "NORMAL"
                ? "text-emerald-400"
                : systemStatus === "WARNING"
                ? "text-amber-400"
                : "text-red-400"
            }`}>
              {systemStatus}
            </span>
          </div>
          <p className="text-xs text-slate-300 font-sans mt-0.5 leading-relaxed">
            {!hasData
              ? "No telemetry received yet. Run the Tinkercad Arduino simulation and dispatch telemetry through the bridge."
              : warningReason
              ? `Warning condition detected: ${warningReason}. Inspect respective sensor thresholds.`
              : "All monitored sensor parameters are currently within the configured operating range."}
          </p>
        </div>
      </div>

    </div>
  );
};
