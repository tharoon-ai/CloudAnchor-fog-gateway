import React, { useMemo } from "react";
import {
  LineChart as LineChartIcon,
  Activity,
  TrendingUp,
  ShieldCheck,
  Zap,
  Gauge
} from "lucide-react";
import type { ChartDataPoint, ParsedTelemetry } from "../types/dashboard";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  AreaChart,
  Area
} from "recharts";

interface AnalyticsPageProps {
  latestTelemetry: ParsedTelemetry | null;
  telemetryHistory: ChartDataPoint[];
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({
  latestTelemetry,
  telemetryHistory,
}) => {
  // Compute descriptive statistics across rolling history
  const stats = useMemo(() => {
    if (!telemetryHistory || telemetryHistory.length === 0) {
      return {
        avgTemp: 25.0,
        maxTemp: 25.0,
        minTemp: 25.0,
        avgVib: 0.05,
        maxVib: 0.05,
        avgPower: 0.75,
        maxPower: 0.75,
        avgHealth: 100,
        minHealth: 100,
      };
    }

    const temps = telemetryHistory.map((p) => p.temperature);
    const vibs = telemetryHistory.map((p) => p.vibrationLevel);
    const powers = telemetryHistory.map((p) => p.power);
    const healths = telemetryHistory.map((p) => p.healthScore);

    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

    return {
      avgTemp: avg(temps),
      maxTemp: Math.max(...temps),
      minTemp: Math.min(...temps),
      avgVib: avg(vibs),
      maxVib: Math.max(...vibs),
      avgPower: avg(powers),
      maxPower: Math.max(...powers),
      avgHealth: avg(healths),
      minHealth: Math.min(...healths),
    };
  }, [telemetryHistory]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Hero Header */}
      <div className="p-5 rounded-2xl bg-[#0b1220] border border-white/[0.08] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 shadow-lg shadow-indigo-500/10">
            <LineChartIcon className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-bold text-white tracking-tight">Edge Intelligence & Analytics</h2>
              <span className="px-2.5 py-0.5 text-xs font-mono font-bold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                REAL-TIME INFERENCE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Continuous Rule-Based Multi-Sensor Fusion • Telemetry Drift & Anomaly Quantification
            </p>
          </div>
        </div>

        <div className="text-right font-mono text-xs text-slate-400">
          <span>Telemetry Sample Pool: </span>
          <span className="text-white font-bold">{telemetryHistory.length} Points (Rolling Window)</span>
        </div>
      </div>

      {/* Analytics Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-4 rounded-xl bg-[#0b1220] border border-white/[0.08]">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Thermal Average</span>
            <Activity className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-black font-mono text-orange-400">
            {stats.avgTemp.toFixed(1)} °C
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-1 flex justify-between">
            <span>Min: {stats.minTemp.toFixed(1)} °C</span>
            <span>Max: {stats.maxTemp.toFixed(1)} °C</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0b1220] border border-white/[0.08]">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Vibration Peak</span>
            <Activity className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black font-mono text-purple-400">
            {stats.maxVib.toFixed(3)} g
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-1 flex justify-between">
            <span>Avg: {stats.avgVib.toFixed(3)} g</span>
            <span>MPU6050 3-Axis</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0b1220] border border-white/[0.08]">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Power Consumption</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-400">
            {stats.avgPower.toFixed(2)} W
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-1 flex justify-between">
            <span>Peak: {stats.maxPower.toFixed(2)} W</span>
            <span>INA219 Sensor</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0b1220] border border-white/[0.08]">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Mean Health Score</span>
            <Gauge className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-400">
            {stats.avgHealth.toFixed(0)} / 100
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-1 flex justify-between">
            <span>Min: {stats.minHealth.toFixed(0)}</span>
            <span>Edge Fusion Metric</span>
          </div>
        </div>

      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Health Score Trend */}
        <div className="p-5 rounded-2xl bg-[#0b1220] border border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                Edge Health Score Trend (0 - 100)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 font-bold">
              Current: {latestTelemetry?.healthScore ?? 100}
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={telemetryHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="healthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "12px" }}
                />
                <Area
                  type="monotone"
                  dataKey="healthScore"
                  name="Health Score"
                  stroke="#10B981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#healthGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Vibration & Power Corelation */}
        <div className="p-5 rounded-2xl bg-[#0b1220] border border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                Vibration & Electrical Load Correlation
              </h3>
            </div>
            <span className="text-[11px] font-mono text-cyan-400 font-bold">
              MPU6050 + INA219
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={telemetryHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "12px" }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                <Line
                  type="monotone"
                  dataKey="vibrationLevel"
                  name="Vibration (g)"
                  stroke="#A855F7"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="power"
                  name="Power (W)"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};
