import React, { useState, useMemo } from "react";
import {
  Thermometer,
  Activity,
  Zap,
  Gauge,
  ShieldCheck,
  AlertTriangle,
  Flame
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";
import type { ParsedTelemetry, ChartDataPoint } from "../types/dashboard";

interface SensorPanelProps {
  latestTelemetry: ParsedTelemetry | null;
  telemetryHistory: ChartDataPoint[];
}

export const SensorPanel: React.FC<SensorPanelProps> = ({
  latestTelemetry,
  telemetryHistory,
}) => {
  const [chartCategory, setChartCategory] = useState<"thermal" | "vibration" | "electrical" | "environmental" | "health">("thermal");

  // Calculate live statistics from history
  const stats = useMemo(() => {
    if (telemetryHistory.length === 0) {
      return {
        avgTemp: "0.0", maxTemp: "0.0",
        avgHum: "0", maxHum: "0",
        maxVib: "0.00", avgVib: "0.00",
        avgVolt: "0.00", maxCurrent: "0",
        avgPower: "0.00",
        avgHealth: "100"
      };
    }
    const temps = telemetryHistory.map((d) => d.temperature);
    const hums = telemetryHistory.map((d) => d.humidity);
    const vibs = telemetryHistory.map((d) => d.vibrationLevel || 0.0);
    const volts = telemetryHistory.map((d) => d.voltage || 5.0);
    const currents = telemetryHistory.map((d) => d.current || 0.0);
    const powers = telemetryHistory.map((d) => d.power || 0.0);
    const healths = telemetryHistory.map((d) => d.healthScore || 100);

    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

    return {
      avgTemp: avg(temps).toFixed(1),
      maxTemp: Math.max(...temps).toFixed(1),
      avgHum: avg(hums).toFixed(0),
      maxHum: Math.max(...hums).toFixed(0),
      avgVib: avg(vibs).toFixed(3),
      maxVib: Math.max(...vibs).toFixed(3),
      avgVolt: avg(volts).toFixed(2),
      maxCurrent: Math.max(...currents).toFixed(0),
      avgPower: avg(powers).toFixed(2),
      avgHealth: avg(healths).toFixed(0)
    };
  }, [telemetryHistory]);

  const healthScore = latestTelemetry?.healthScore ?? 100;
  const systemStatus = latestTelemetry?.systemStatus ?? "NORMAL";
  const riskLevel = latestTelemetry?.riskLevel ?? "LOW";
  const warningReason = latestTelemetry?.warningReason;

  const sensorStatus = latestTelemetry?.sensorStatus ?? {
    dht22: "ONLINE",
    mpu6050: "ONLINE",
    ina219: "ONLINE",
    mq2: "ONLINE",
    bmp280: "ONLINE"
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "ONLINE":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "STALE":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "OFFLINE":
        return "bg-red-500/10 text-red-400 border-red-500/30";
      default:
        return "bg-slate-800 text-slate-400 border-white/[0.06]";
    }
  };

  return (
    <section className="space-y-4">
      
      {/* 1. SENSOR HEALTH & FUSION INTELLIGENCE STRIP */}
      <div className="glass-panel p-4 rounded-2xl border-white/[0.08] relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          
          {/* Edge Intelligence Badge & System Status */}
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              systemStatus === "NORMAL"
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                : systemStatus === "WARNING"
                ? "bg-amber-500/15 border-amber-500/30 text-amber-400 animate-pulse"
                : "bg-red-500/15 border-red-500/30 text-red-400 animate-bounce"
            }`}>
              {systemStatus === "NORMAL" ? (
                <ShieldCheck className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Fog Edge Intelligence
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Rule-Based Multi-Sensor Fusion
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-base font-bold font-mono ${
                  systemStatus === "NORMAL" ? "text-emerald-400" : systemStatus === "WARNING" ? "text-amber-400" : "text-red-400"
                }`}>
                  {systemStatus}
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-xs font-mono text-slate-300">
                  Risk Level: <strong className={riskLevel === "LOW" ? "text-emerald-400" : riskLevel === "MEDIUM" ? "text-amber-400" : "text-red-400"}>{riskLevel}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Health Score Gauge Progress */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">System Health Score</div>
              <div className="text-2xl font-black font-mono tracking-tight text-white flex items-baseline justify-end gap-1">
                <span className={healthScore > 75 ? "text-emerald-400" : healthScore > 45 ? "text-amber-400" : "text-red-400"}>
                  {healthScore}
                </span>
                <span className="text-xs text-slate-500 font-normal">/ 100</span>
              </div>
            </div>
            <div className="w-24 bg-slate-800/80 rounded-full h-3 p-0.5 border border-white/[0.08] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  healthScore > 75 ? "bg-emerald-400" : healthScore > 45 ? "bg-amber-400" : "bg-red-500"
                }`}
                style={{ width: `${Math.max(5, healthScore)}%` }}
              />
            </div>
          </div>

        </div>

        {/* Anomaly Reason Banner (if warning or critical) */}
        {warningReason && (
          <div className="mt-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-2.5 text-xs text-amber-300 font-mono">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span><strong>Anomaly Trigger:</strong> {warningReason}</span>
          </div>
        )}

        {/* SENSOR STATUS CHIPS */}
        <div className="mt-3 pt-3 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
          <span className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold">Attached Bus:</span>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-2 py-0.5 rounded-lg border flex items-center gap-1.5 ${getStatusColor(sensorStatus.dht22)}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              DHT22 (Temp/Hum)
            </span>
            <span className={`px-2 py-0.5 rounded-lg border flex items-center gap-1.5 ${getStatusColor(sensorStatus.mpu6050)}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              MPU6050 (Vib/Motion)
            </span>
            <span className={`px-2 py-0.5 rounded-lg border flex items-center gap-1.5 ${getStatusColor(sensorStatus.ina219)}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              INA219 (V/I/Power)
            </span>
            <span className={`px-2 py-0.5 rounded-lg border flex items-center gap-1.5 ${getStatusColor(sensorStatus.mq2)}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              MQ-2 (Gas)
            </span>
            <span className={`px-2 py-0.5 rounded-lg border flex items-center gap-1.5 ${getStatusColor(sensorStatus.bmp280)}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              BMP280 (Pres)
            </span>
          </div>
        </div>

      </div>

      {/* 2. MULTI-SENSOR LIVE READINGS GRID (4 CLUSTERS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Card 1: DHT22 (Thermal & Humidity) */}
        <div className="glass-panel p-3.5 rounded-xl border-white/[0.06] flex flex-col justify-between hover:border-orange-500/30 transition">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400">
                <Thermometer className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-slate-300 uppercase">Thermal / Humidity</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">DHT22</span>
          </div>
          
          <div className="my-3 grid grid-cols-2 gap-2">
            <div>
              <div className="text-[10px] text-slate-500 font-mono">Temperature</div>
              <div className="text-xl font-bold font-mono text-white">
                {latestTelemetry ? `${latestTelemetry.temperature.toFixed(1)}°C` : "--.-°C"}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-mono">Humidity</div>
              <div className="text-xl font-bold font-mono text-blue-400">
                {latestTelemetry ? `${latestTelemetry.humidity.toFixed(0)}%` : "--%"}
              </div>
            </div>
          </div>

          <div className="text-[10px] font-mono text-slate-500 flex justify-between border-t border-white/[0.04] pt-1.5">
            <span>Avg: {stats.avgTemp}°C</span>
            <span>Max: {stats.maxTemp}°C</span>
          </div>
        </div>

        {/* Card 2: MPU6050 (Vibration & Motion) */}
        <div className="glass-panel p-3.5 rounded-xl border-white/[0.06] flex flex-col justify-between hover:border-purple-500/30 transition">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
                <Activity className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-slate-300 uppercase">Vibration / Motion</span>
            </div>
            <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">MPU6050</span>
          </div>
          
          <div className="my-3 grid grid-cols-2 gap-2">
            <div>
              <div className="text-[10px] text-slate-500 font-mono">Vibration Index</div>
              <div className="text-xl font-bold font-mono text-purple-300">
                {latestTelemetry && latestTelemetry.vibrationLevel !== undefined ? `${latestTelemetry.vibrationLevel.toFixed(3)}g` : "0.000g"}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-mono">Vector (Z)</div>
              <div className="text-xl font-bold font-mono text-slate-200">
                {latestTelemetry && latestTelemetry.accelerationZ !== undefined ? `${latestTelemetry.accelerationZ.toFixed(2)}g` : "1.00g"}
              </div>
            </div>
          </div>

          <div className="text-[10px] font-mono text-slate-500 flex justify-between border-t border-white/[0.04] pt-1.5">
            <span>Ax: {latestTelemetry?.accelerationX?.toFixed(2) ?? "0.00"}</span>
            <span>Ay: {latestTelemetry?.accelerationY?.toFixed(2) ?? "0.00"}</span>
            <span>Peak: {stats.maxVib}g</span>
          </div>
        </div>

        {/* Card 3: INA219 (Voltage, Current, Power) */}
        <div className="glass-panel p-3.5 rounded-xl border-white/[0.06] flex flex-col justify-between hover:border-amber-500/30 transition">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                <Zap className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-slate-300 uppercase">Electrical Power</span>
            </div>
            <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">INA219</span>
          </div>
          
          <div className="my-3 grid grid-cols-3 gap-1">
            <div>
              <div className="text-[10px] text-slate-500 font-mono">Voltage</div>
              <div className="text-base font-bold font-mono text-white">
                {latestTelemetry ? `${latestTelemetry.voltage.toFixed(2)}V` : "-.--V"}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-mono">Current</div>
              <div className="text-base font-bold font-mono text-amber-300">
                {latestTelemetry ? `${latestTelemetry.current.toFixed(0)}mA` : "---mA"}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-mono">Power</div>
              <div className="text-base font-bold font-mono text-emerald-400">
                {latestTelemetry ? `${latestTelemetry.power.toFixed(2)}W` : "-.--W"}
              </div>
            </div>
          </div>

          <div className="text-[10px] font-mono text-slate-500 flex justify-between border-t border-white/[0.04] pt-1.5">
            <span>Avg: {stats.avgVolt}V</span>
            <span>Peak I: {stats.maxCurrent}mA</span>
          </div>
        </div>

        {/* Card 4: Environmental & Gas (MQ-2 & BMP280) */}
        <div className="glass-panel p-3.5 rounded-xl border-white/[0.06] flex flex-col justify-between hover:border-cyan-500/30 transition">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                <Flame className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-slate-300 uppercase">Gas & Barometer</span>
            </div>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">MQ2/BMP</span>
          </div>
          
          <div className="my-3 grid grid-cols-2 gap-2">
            <div>
              <div className="text-[10px] text-slate-500 font-mono">Gas / Smoke</div>
              <div className="text-xl font-bold font-mono text-cyan-300">
                {latestTelemetry?.gasLevel ? `${latestTelemetry.gasLevel.toFixed(0)} ppm` : "210 ppm"}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-mono">Pressure</div>
              <div className="text-xl font-bold font-mono text-slate-200">
                {latestTelemetry?.pressure ? `${latestTelemetry.pressure.toFixed(1)} hPa` : "1013.2 hPa"}
              </div>
            </div>
          </div>

          <div className="text-[10px] font-mono text-slate-500 flex justify-between border-t border-white/[0.04] pt-1.5">
            <span>Air Quality: Normal</span>
            <span>Elev: MSL</span>
          </div>
        </div>

      </div>

      {/* 3. MULTI-SENSOR TIMESERIES CHART PANEL */}
      <div className="glass-panel p-4 rounded-2xl border-white/[0.06] space-y-3">
        
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Gauge className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Multi-Sensor Rolling Timeseries
              </h3>
              <p className="text-[11px] text-slate-400">
                Real-time telemetry stream synchronized across edge bus sensors
              </p>
            </div>
          </div>

          {/* Timeseries Category Toggle Buttons */}
          <div className="flex flex-wrap items-center gap-1 font-mono text-[11px] bg-[#121826] p-1 rounded-xl border border-white/[0.06]">
            <button
              onClick={() => setChartCategory("thermal")}
              className={`px-2.5 py-1 rounded-lg transition ${
                chartCategory === "thermal" ? "bg-orange-600 text-white font-semibold" : "text-slate-400 hover:text-white"
              }`}
            >
              🌡️ Thermal (DHT22)
            </button>
            <button
              onClick={() => setChartCategory("vibration")}
              className={`px-2.5 py-1 rounded-lg transition ${
                chartCategory === "vibration" ? "bg-purple-600 text-white font-semibold" : "text-slate-400 hover:text-white"
              }`}
            >
              〰️ Vibration (MPU6050)
            </button>
            <button
              onClick={() => setChartCategory("electrical")}
              className={`px-2.5 py-1 rounded-lg transition ${
                chartCategory === "electrical" ? "bg-amber-600 text-white font-semibold" : "text-slate-400 hover:text-white"
              }`}
            >
              ⚡ Electrical (INA219)
            </button>
            <button
              onClick={() => setChartCategory("environmental")}
              className={`px-2.5 py-1 rounded-lg transition ${
                chartCategory === "environmental" ? "bg-cyan-600 text-white font-semibold" : "text-slate-400 hover:text-white"
              }`}
            >
              🍃 Gas / Pres (MQ-2)
            </button>
            <button
              onClick={() => setChartCategory("health")}
              className={`px-2.5 py-1 rounded-lg transition ${
                chartCategory === "health" ? "bg-emerald-600 text-white font-semibold" : "text-slate-400 hover:text-white"
              }`}
            >
              🛡️ Fusion Health
            </button>
          </div>
        </div>

        {/* Responsive Area Chart */}
        {telemetryHistory.length > 1 ? (
          <div className="h-[210px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={telemetryHistory} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="orangeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="amberGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis
                  dataKey="time"
                  stroke="#475569"
                  tick={{ fill: "#64748b", fontSize: 9, fontFamily: "JetBrains Mono" }}
                  tickLine={false}
                />
                <YAxis
                  stroke="#475569"
                  tick={{ fill: "#64748b", fontSize: 9, fontFamily: "JetBrains Mono" }}
                  tickLine={false}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0d131f",
                    borderColor: "rgba(255,255,255,0.1)",
                    borderRadius: "0.75rem",
                    fontSize: "11px",
                    fontFamily: "JetBrains Mono",
                    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)"
                  }}
                />

                {chartCategory === "thermal" && (
                  <>
                    <Area type="monotone" dataKey="temperature" name="Temp (°C)" stroke="#f97316" strokeWidth={2} fill="url(#orangeGrad)" />
                    <Area type="monotone" dataKey="humidity" name="Humidity (%)" stroke="#3b82f6" strokeWidth={2} fill="url(#blueGrad)" />
                  </>
                )}

                {chartCategory === "vibration" && (
                  <Area type="monotone" dataKey="vibrationLevel" name="Vibration (g)" stroke="#a855f7" strokeWidth={2} fill="url(#purpleGrad)" />
                )}

                {chartCategory === "electrical" && (
                  <>
                    <Area type="monotone" dataKey="voltage" name="Voltage (V)" stroke="#f59e0b" strokeWidth={2} fill="url(#amberGrad)" />
                    <Area type="monotone" dataKey="power" name="Power (W)" stroke="#10b981" strokeWidth={2} fill="url(#emeraldGrad)" />
                  </>
                )}

                {chartCategory === "environmental" && (
                  <Area type="monotone" dataKey="gasLevel" name="Gas (ppm)" stroke="#06b6d4" strokeWidth={2} fill="url(#cyanGrad)" />
                )}

                {chartCategory === "health" && (
                  <Area type="monotone" dataKey="healthScore" name="Health Score" stroke="#10b981" strokeWidth={2.5} fill="url(#emeraldGrad)" />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[200px] flex flex-col items-center justify-center text-slate-500 space-y-2 text-center p-4">
            <Activity className="w-6 h-6 text-slate-600 animate-spin" />
            <span className="text-slate-400 text-xs font-mono">Listening for Multi-Sensor Telemetry stream...</span>
          </div>
        )}

        <div className="text-[10px] font-mono text-slate-500 flex justify-between border-t border-white/[0.04] pt-2">
          <span>Active Device: <strong className="text-slate-300">{latestTelemetry?.deviceId ?? "ARDUINO-001"}</strong></span>
          <span>Rolling Window: 20 Samples</span>
          <span>Sampling Interval: ~3.0s</span>
        </div>

      </div>

    </section>
  );
};
