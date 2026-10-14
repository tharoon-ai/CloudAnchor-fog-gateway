import React, { useState } from "react";
import {
  Send,
  X,
  Cpu,
  Thermometer,
  Droplets,
  Activity,
  Zap,
  Flame,
  Gauge,
  CheckCircle2,
  AlertCircle,
  Clock
} from "lucide-react";
import { api } from "../services/api";

interface ManualIngestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ManualIngestModal: React.FC<ManualIngestModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [deviceId, setDeviceId] = useState("ARDUINO-001");
  const [customRequestId, setCustomRequestId] = useState(`REQ-MANUAL-${Math.floor(1000 + Math.random() * 9000)}`);
  
  // Primary Sensors
  const [temperature, setTemperature] = useState(26.8);
  const [humidity, setHumidity] = useState(54.0);
  const [vibrationLevel, setVibrationLevel] = useState(0.04);
  const [voltage, setVoltage] = useState(5.02);
  const [current, setCurrent] = useState(140.0);
  
  // Secondary Sensors
  const [gasLevel, setGasLevel] = useState(210.0);
  const [pressure, setPressure] = useState(1013.2);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: "normal" | "warning" | "critical") => {
    setCustomRequestId(`REQ-${preset.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`);
    if (preset === "normal") {
      setTemperature(26.5);
      setHumidity(52.0);
      setVibrationLevel(0.03);
      setVoltage(5.02);
      setCurrent(130.0);
      setGasLevel(200.0);
      setPressure(1013.2);
    } else if (preset === "warning") {
      setTemperature(34.0);
      setHumidity(65.0);
      setVibrationLevel(0.42); // Elevated vibration
      setVoltage(4.95);
      setCurrent(580.0);       // Elevated current
      setGasLevel(380.0);
      setPressure(1008.0);
    } else if (preset === "critical") {
      setTemperature(74.5);    // Severe overheating
      setHumidity(88.0);
      setVibrationLevel(0.85); // Dangerous vibration
      setVoltage(4.30);
      setCurrent(950.0);       // Current overload
      setGasLevel(820.0);      // Hazardous gas
      setPressure(975.0);
    }
    setResult(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const now = new Date();
      const timestamp = now.toISOString().replace("T", " ").substring(0, 19);
      const power_W = parseFloat(((Number(voltage) * Number(current)) / 1000.0).toFixed(3));

      const res = await api.ingestData({
        device_id: deviceId,
        request_id: customRequestId,
        timestamp,
        temperature: Number(temperature),
        humidity: Number(humidity),
        acceleration_x: 0.02,
        acceleration_y: 0.01,
        acceleration_z: 0.98,
        vibration_level: Number(vibrationLevel),
        voltage: Number(voltage),
        current: Number(current),
        power: power_W,
        gas_level: Number(gasLevel),
        pressure: Number(pressure),
      });

      setResult(res);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to submit telemetry packet");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-xl rounded-2xl border border-white/[0.12] p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/[0.06] transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5 border-b border-white/[0.06] pb-4">
          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              Compose Multi-Sensor Telemetry Packet
            </h3>
            <p className="text-xs text-slate-400">
              Transmit custom DHT22, MPU6050, INA219, MQ-2 & BMP280 payload to Fog Gateway (<code className="font-mono text-blue-400">/api/ingest</code>)
            </p>
          </div>
        </div>

        {/* Quick Scenario Presets */}
        <div className="mb-4 p-3 bg-slate-950/60 rounded-xl border border-white/[0.06] flex items-center justify-between gap-2">
          <span className="text-[11px] font-mono text-slate-400 font-semibold">Test Scenarios:</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleApplyPreset("normal")}
              className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition"
            >
              🟢 Normal (Health 95+)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset("warning")}
              className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition"
            >
              🟡 Warning (Vib/Load)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset("critical")}
              className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition"
            >
              🔴 Critical (Overheat)
            </button>
          </div>
        </div>

        {/* Result notification */}
        {result && (
          <div className={`p-3.5 rounded-xl border mb-4 text-xs font-mono flex items-start gap-2.5 ${
            result.status === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : result.status === "duplicate"
              ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
              : "bg-blue-500/10 border-blue-500/30 text-blue-300"
          }`}>
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold uppercase tracking-wider">Status: {result.status}</span>
                {result.health_score !== undefined && (
                  <span className="px-2 py-0.2 rounded bg-white/10 text-white">
                    Fusion Score: <strong>{result.health_score}/100</strong> [{result.system_status}]
                  </span>
                )}
              </div>
              <p className="text-[11px] opacity-90 mt-1">{result.message}</p>
              <div className="mt-1 text-[10px] text-slate-400 flex gap-3">
                <span>Queue: <strong>{result.queue_status}</strong></span>
                {result.circuit_breaker_state && (
                  <span>Circuit: <strong>{result.circuit_breaker_state}</strong></span>
                )}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 mb-4 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-medium block mb-1 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-blue-400" /> Device ID
              </label>
              <input
                type="text"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-950/80 border border-white/[0.08] focus:border-blue-500/50 rounded-xl text-white font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-purple-400" /> Request ID (Idempotency Key)
              </label>
              <input
                type="text"
                value={customRequestId}
                onChange={(e) => setCustomRequestId(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-950/80 border border-white/[0.08] focus:border-blue-500/50 rounded-xl text-white font-mono focus:outline-none"
              />
            </div>
          </div>

          {/* Thermal & Vibration */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-slate-300 font-medium block mb-1 flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-orange-400" /> Temp (°C)
              </label>
              <input
                type="number"
                step="0.1"
                min="-40"
                max="120"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value) || 0)}
                required
                className="w-full px-3 py-2 bg-slate-950/80 border border-white/[0.08] focus:border-orange-500/50 rounded-xl text-white font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1 flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-blue-400" /> Humidity (%)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                max="100"
                value={humidity}
                onChange={(e) => setHumidity(parseFloat(e.target.value) || 0)}
                required
                className="w-full px-3 py-2 bg-slate-950/80 border border-white/[0.08] focus:border-blue-500/50 rounded-xl text-white font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-purple-400" /> Vibration (g)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                value={vibrationLevel}
                onChange={(e) => setVibrationLevel(parseFloat(e.target.value) || 0)}
                required
                className="w-full px-3 py-2 bg-slate-950/80 border border-white/[0.08] focus:border-purple-500/50 rounded-xl text-white font-mono focus:outline-none"
              />
            </div>
          </div>

          {/* Electrical Load (INA219) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-medium block mb-1 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Bus Voltage (V)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="32"
                value={voltage}
                onChange={(e) => setVoltage(parseFloat(e.target.value) || 0)}
                required
                className="w-full px-3 py-2 bg-slate-950/80 border border-white/[0.08] focus:border-amber-500/50 rounded-xl text-white font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Load Current (mA)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                max="5000"
                value={current}
                onChange={(e) => setCurrent(parseFloat(e.target.value) || 0)}
                required
                className="w-full px-3 py-2 bg-slate-950/80 border border-white/[0.08] focus:border-amber-500/50 rounded-xl text-white font-mono focus:outline-none"
              />
            </div>
          </div>

          {/* Environmental (MQ-2 & BMP280) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-medium block mb-1 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-cyan-400" /> Gas / Smoke Level (ppm)
              </label>
              <input
                type="number"
                step="10"
                min="0"
                max="2000"
                value={gasLevel}
                onChange={(e) => setGasLevel(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-950/80 border border-white/[0.08] focus:border-cyan-500/50 rounded-xl text-white font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-cyan-400" /> Atmospheric Pressure (hPa)
              </label>
              <input
                type="number"
                step="0.5"
                min="800"
                max="1200"
                value={pressure}
                onChange={(e) => setPressure(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-950/80 border border-white/[0.08] focus:border-cyan-500/50 rounded-xl text-white font-mono focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-between gap-3 border-t border-white/[0.06]">
            <span className="text-[10px] text-slate-500 font-mono">P = {(voltage * current / 1000).toFixed(2)}W</span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-400 hover:text-white transition"
              >
                Close
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/20 flex items-center gap-2 transition disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? "Ingesting..." : "Dispatch Packet"}</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
