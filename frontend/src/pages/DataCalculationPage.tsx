import { useState } from "react";
import {
  Calculator,
  Layers,
  Code2,
  ChevronDown,
  ChevronUp,
  ShieldCheck
} from "lucide-react";
import type { ParsedTelemetry } from "../types/dashboard";

interface DataCalculationPageProps {
  latestTelemetry: ParsedTelemetry | null;
}

export const DataCalculationPage: React.FC<DataCalculationPageProps> = ({
  latestTelemetry,
}) => {
  const [isRawJsonExpanded, setIsRawJsonExpanded] = useState<boolean>(false);
  const hasData = latestTelemetry !== null;

  // Live telemetry values or default reference values
  const temp = hasData ? latestTelemetry.temperature : 25.5;
  const hum = hasData ? latestTelemetry.humidity : 56.4;
  const volt = hasData ? latestTelemetry.voltage : 7.14;
  const curr = hasData ? latestTelemetry.current : 110.02;
  const power = hasData ? latestTelemetry.power : parseFloat(((volt * curr) / 1000.0).toFixed(3));
  
  // Health score & fusion
  const healthScore = hasData ? (latestTelemetry.healthScore ?? 100) : 100;
  const systemStatus = hasData ? (latestTelemetry.systemStatus || "NORMAL") : "NORMAL";
  const riskLevel = hasData ? (latestTelemetry.riskLevel || "LOW") : "LOW";

  // Raw telemetry JSON object
  const rawJsonObject = {
    request_id: latestTelemetry?.requestId || "REQ-1",
    device_id: latestTelemetry?.deviceId || "ARDUINO-001",
    timestamp: latestTelemetry?.timestamp || new Date().toISOString(),
    temperature: temp,
    humidity: hum,
    voltage: volt,
    current: curr,
    power: power,
    health_score: healthScore,
    system_status: systemStatus,
    risk_level: riskLevel,
  };

  const pipelineStages = [
    { step: "1", title: "Tinkercad Circuits", desc: "Interactive Arduino circuit simulation environment" },
    { step: "2", title: "Arduino Uno", desc: "Microcontroller reading analog simulation inputs" },
    { step: "3", title: "Simulated Sensor Inputs", desc: "Analog values mapped to Temperature, Humidity, and Voltage" },
    { step: "4", title: "Arduino Processing", desc: "Converts ADC readings (0–1023) into calibrated engineering units" },
    { step: "5", title: "Telemetry JSON", desc: "Formats validated sensor readings into structured JSON payload" },
    { step: "6", title: "CloudAnchor Fog Gateway", desc: "Ingests payload on port :8000 via POST /api/ingest" },
    { step: "7", title: "SQLite Queue", desc: "Persists records to gateway.db with store-and-forward reliability" },
    { step: "8", title: "Cloud Synchronization", desc: "Synchronizes data to Cloud API with retry and circuit breaker" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* 1. HEADER BAR */}
      <div className="p-4 rounded-xl bg-[#101827] border border-[#253247] flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 font-sans tracking-tight">
            Data & Calculation
          </h2>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Understand where each telemetry value comes from and how derived values are calculated.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-lg bg-[#151F2E] border border-[#253247] text-slate-300 flex items-center gap-1.5">
            <span className="text-slate-400">Request:</span>
            <span className="font-bold text-cyan-400">{hasData ? latestTelemetry.requestId : "—"}</span>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-[#151F2E] border border-[#253247] text-cyan-400 font-semibold flex items-center gap-1.5">
            <Calculator className="w-3.5 h-3.5" />
            <span>Tinkercad → Arduino Architecture</span>
          </div>
        </div>
      </div>

      {/* 2. DATA PIPELINE ARCHITECTURE (8 Stages) */}
      <div className="p-5 rounded-xl bg-[#101827] border border-[#253247] space-y-4">
        <div className="flex items-center gap-2 border-b border-[#253247] pb-3">
          <Layers className="w-4 h-4 text-indigo-400" />
          <div>
            <h3 className="text-sm font-bold text-slate-100 font-sans uppercase tracking-wider text-[11px]">
              Sensor Telemetry Flow & Generation Architecture
            </h3>
            <p className="text-xs text-slate-400 font-sans">
              End-to-end data pipeline from Tinkercad simulation to cloud persistence.
            </p>
          </div>
        </div>

        {/* Linear Flow Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {pipelineStages.map((stage, idx) => (
            <div
              key={stage.step}
              className="p-3.5 rounded-lg bg-[#151F2E] border border-[#253247] flex flex-col justify-between space-y-2 relative"
            >
              <div className="flex items-center justify-between font-mono">
                <span className="w-5 h-5 rounded-full bg-[#101827] border border-[#253247] text-cyan-400 flex items-center justify-center font-bold text-[10px]">
                  {stage.step}
                </span>
                {idx < pipelineStages.length - 1 && (
                  <span className="text-[10px] text-slate-500 font-mono hidden lg:inline">→</span>
                )}
              </div>
              <div>
                <div className="font-semibold text-slate-200 font-sans">{stage.title}</div>
                <p className="text-[11px] text-slate-400 font-sans mt-0.5 leading-relaxed">{stage.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. SENSOR INPUT MAPPING VS DERIVED CALCULATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT COLUMN: SIMULATED SENSOR INPUTS & PROCESSING */}
        <div className="p-5 rounded-xl bg-[#101827] border border-[#253247] space-y-4">
          <div className="flex items-center justify-between border-b border-[#253247] pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-100 font-sans">
                Simulated Sensor Inputs & Mapping
              </h3>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Conversion of Tinkercad Arduino analog simulation values into calibrated units.
              </p>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              SIMULATION MAPPING
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            
            {/* Temperature */}
            <div className="p-3.5 rounded-lg bg-[#151F2E] border border-[#253247] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-200 font-bold">1. TEMPERATURE</span>
                <span className="text-emerald-400 font-bold">{temp.toFixed(1)} °C</span>
              </div>
              <div className="text-slate-300 text-[11px] font-sans">
                <strong>Source:</strong> Simulated temperature input
              </div>
              <div className="text-slate-400 text-[11px] font-sans leading-relaxed">
                <strong>Processing:</strong> Arduino converts the analog simulation value into a temperature range.
              </div>
              <div className="p-2 rounded bg-[#0B1220] border border-[#253247] text-[11px] text-slate-400 space-y-0.5">
                <div>Analog input: <span className="text-cyan-400">0 – 1023</span></div>
                <div>Mapped to: <span className="text-emerald-400 font-semibold">15 – 50 °C</span> (Simulation Mapping)</div>
              </div>
            </div>

            {/* Humidity */}
            <div className="p-3.5 rounded-lg bg-[#151F2E] border border-[#253247] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-200 font-bold">2. HUMIDITY</span>
                <span className="text-blue-400 font-bold">{hum.toFixed(1)} %</span>
              </div>
              <div className="text-slate-300 text-[11px] font-sans">
                <strong>Source:</strong> Simulated humidity input
              </div>
              <div className="text-slate-400 text-[11px] font-sans leading-relaxed">
                <strong>Processing:</strong> Arduino converts the analog input into a humidity percentage.
              </div>
              <div className="p-2 rounded bg-[#0B1220] border border-[#253247] text-[11px] text-slate-400 space-y-0.5">
                <div>Analog input: <span className="text-cyan-400">0 – 1023</span></div>
                <div>Mapped to: <span className="text-blue-400 font-semibold">20 – 90 %</span> (Simulation Mapping)</div>
              </div>
            </div>

            {/* Electrical Inputs */}
            <div className="p-3.5 rounded-lg bg-[#151F2E] border border-[#253247] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-200 font-bold">3. VOLTAGE & CURRENT INPUTS</span>
                <span className="text-amber-400 font-bold">{volt.toFixed(2)} V / {curr.toFixed(1)} mA</span>
              </div>
              <div className="text-slate-300 text-[11px] font-sans">
                <strong>Source:</strong> Simulated electrical measurement circuit
              </div>
              <div className="text-slate-400 text-[11px] font-sans leading-relaxed">
                <strong>Processing:</strong> Represents simulated bus voltage and load current drawn by the Arduino node.
              </div>
              <div className="p-2 rounded bg-[#0B1220] border border-[#253247] text-[11px] text-slate-400">
                Nominal Voltage: <span className="text-amber-300">5.0V DC</span> • Load Current: <span className="text-cyan-300">80–260 mA</span>
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: MATHEMATICALLY DERIVED PARAMETERS */}
        <div className="p-5 rounded-xl bg-[#101827] border border-[#253247] space-y-4">
          <div className="flex items-center justify-between border-b border-[#253247] pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-100 font-sans">
                Derived Calculations & Formulas
              </h3>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Mathematical computation of electrical power from voltage and current.
              </p>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              DERIVED VALUES
            </span>
          </div>

          <div className="space-y-4 font-mono text-xs">
            
            {/* Electrical Power Calculation */}
            <div className="p-4 rounded-lg bg-[#151F2E] border border-amber-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-amber-300 font-bold">ELECTRICAL POWER CALCULATION</span>
                <span className="px-2 py-0.5 text-[10px] rounded bg-[#101827] text-amber-400 font-bold">
                  DERIVED
                </span>
              </div>

              <div className="text-xs text-slate-300 font-sans leading-relaxed">
                Power is derived from simulated voltage and current measurements:
              </div>

              {/* Formula Box */}
              <div className="p-2.5 rounded bg-[#0B1220] border border-[#253247] text-xs text-slate-200 font-mono space-y-1">
                <div className="text-slate-400 text-[10px]">FORMULA (P = V × I):</div>
                <div className="text-amber-400 font-bold">
                  P(W) = V × I(mA) / 1000
                </div>
              </div>

              {/* Live Substitution */}
              <div className="p-2.5 rounded bg-[#0B1220] border border-[#253247] text-xs text-slate-300 font-mono space-y-1">
                <div className="text-slate-400 text-[10px]">LIVE CALCULATION:</div>
                <div className="text-slate-300">
                  V = {volt.toFixed(2)} V, I = {curr.toFixed(1)} mA
                </div>
                <div className="text-slate-300">
                  P = {volt.toFixed(2)} × {curr.toFixed(1)} / 1000
                </div>
                <div className="text-emerald-300 font-bold mt-1">
                  P ≈ {power.toFixed(3)} W
                </div>
              </div>
            </div>

            {/* Derivation Principles */}
            <div className="p-4 rounded-lg bg-[#151F2E] border border-[#253247] space-y-2">
              <div className="text-slate-200 font-bold text-xs font-sans">
                Why Power is a Derived Value
              </div>
              <p className="text-xs text-slate-400 font-sans leading-relaxed">
                Sensors do not measure power directly; transducers sample voltage (potential difference) and current (charge flow). The Fog Gateway computes instantaneous electrical power $P = V \times I$ before evaluating system operating limits.
              </p>
            </div>

          </div>
        </div>

      </div>

      {/* 4. SENSOR HEALTH ASSESSMENT (RULE-BASED SENSOR FUSION) */}
      <div className="p-5 rounded-xl bg-[#101827] border border-[#253247] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#253247] pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-100 font-sans">
                Sensor Health Assessment
              </h3>
              <p className="text-xs text-slate-400 font-sans">
                The health score combines monitored sensor conditions using deterministic rules to provide an overall indication of system health.
              </p>
            </div>
          </div>

          <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-slate-800 text-slate-300 border border-[#253247]">
            Rule-Based Sensor Fusion
          </span>
        </div>

        {/* Fusion Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          <div className="p-3 rounded-lg bg-[#151F2E] border border-[#253247]">
            <span className="text-slate-400 text-[10px] block">HEALTH SCORE</span>
            <span className="text-xl font-bold text-slate-100 mt-0.5 block">
              {healthScore} / 100
            </span>
            <span className="text-[10px] text-emerald-400 font-sans">Weighted Multi-Sensor Score</span>
          </div>

          <div className="p-3 rounded-lg bg-[#151F2E] border border-[#253247]">
            <span className="text-slate-400 text-[10px] block">SYSTEM STATUS</span>
            <span className={`text-xl font-bold mt-0.5 block ${
              systemStatus === "NORMAL" ? "text-emerald-400" : "text-amber-400"
            }`}>
              {systemStatus}
            </span>
            <span className="text-[10px] text-slate-400 font-sans">Evaluated against boundary limits</span>
          </div>

          <div className="p-3 rounded-lg bg-[#151F2E] border border-[#253247]">
            <span className="text-slate-400 text-[10px] block">OPERATIONAL RISK</span>
            <span className={`text-xl font-bold mt-0.5 block ${
              riskLevel === "LOW" ? "text-emerald-400" : "text-amber-400"
            }`}>
              {riskLevel} RISK
            </span>
            <span className="text-[10px] text-slate-400 font-sans">Deterministic rule evaluation</span>
          </div>
        </div>
      </div>

      {/* 5. RAW TELEMETRY (EXPANDABLE) */}
      <div className="p-5 rounded-xl bg-[#101827] border border-[#253247] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-cyan-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-100 font-sans">
                Raw Telemetry Payload
              </h3>
              <p className="text-xs text-slate-400 font-sans">
                Inspect the actual JSON packet received from the Arduino sensor simulation.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsRawJsonExpanded((prev) => !prev)}
            className="px-3 py-1.5 rounded-lg bg-[#151F2E] hover:bg-[#1E293B] border border-[#253247] text-xs font-mono text-cyan-400 flex items-center gap-1.5 transition"
          >
            <span>{isRawJsonExpanded ? "Hide Raw JSON" : "View Raw Telemetry"}</span>
            {isRawJsonExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {isRawJsonExpanded && (
          <div className="mt-3 p-4 rounded-lg bg-[#080D1A] border border-[#253247] font-mono text-xs text-cyan-300 overflow-x-auto leading-relaxed animate-in fade-in duration-150">
            <pre>{JSON.stringify(rawJsonObject, null, 2)}</pre>
          </div>
        )}
      </div>

    </div>
  );
};
