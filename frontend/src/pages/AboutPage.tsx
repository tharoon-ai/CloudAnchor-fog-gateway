import React from "react";
import {
  Shield,
  Cpu,
  HardDrive
} from "lucide-react";
import { CloudAnchorLogo } from "../components/CloudAnchorLogo";

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-200">
      
      {/* Brand Hero Card */}
      <div className="p-6 md:p-8 rounded-xl bg-[#101827] border border-[#253247] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-3">
          <CloudAnchorLogo size="lg" variant="full" />
          <p className="text-sm text-slate-300 leading-relaxed font-sans max-w-2xl mt-2">
            CloudAnchor is a fog-assisted resilient gateway architecture engineered to preserve 100% telemetry data integrity when cloud connectivity is intermittent, slow, or completely unavailable.
          </p>
        </div>

        <div className="p-4 rounded-lg bg-[#151F2E] border border-[#253247] text-xs font-mono text-slate-400 space-y-1.5 flex-shrink-0">
          <div className="text-slate-200 font-bold text-[11px] uppercase tracking-wider">SYSTEM RELEASE</div>
          <div>Version: <span className="text-cyan-400 font-semibold">2.4.0 (Enterprise)</span></div>
          <div>Architecture: <span className="text-slate-200">Fog Store-and-Forward</span></div>
          <div>Data Guarantee: <span className="text-emerald-400 font-semibold">Zero-Drop Policy</span></div>
        </div>
      </div>

      {/* Core Architectural Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        <div className="p-5 rounded-xl bg-[#101827] border border-[#253247] space-y-3">
          <div className="p-2.5 w-fit rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <HardDrive className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-100 font-sans">Local Queue Persistence</h3>
          <p className="text-xs text-slate-400 font-sans leading-relaxed">
            Every incoming telemetry packet is atomically committed to embedded SQLite WAL storage before network forwarding. Packets survive gateway reboots and crashes.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-[#101827] border border-[#253247] space-y-3">
          <div className="p-2.5 w-fit rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-100 font-sans">Circuit Breaker & Backoff</h3>
          <p className="text-xs text-slate-400 font-sans leading-relaxed">
            Detects cloud API outages automatically, trips to OPEN state to prevent request storms, and uses exponential backoff to probe for health recovery without socket exhaustion.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-[#101827] border border-[#253247] space-y-3">
          <div className="p-2.5 w-fit rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-100 font-sans">Edge Intelligence</h3>
          <p className="text-xs text-slate-400 font-sans leading-relaxed">
            Evaluates multi-sensor telemetry locally (thermal, inertial, and electrical) to assign health scores and detect anomalous drift before records reach upstream databases.
          </p>
        </div>

      </div>

      {/* End-to-End Architectural Pipeline */}
      <div className="p-6 rounded-xl bg-[#101827] border border-[#253247] space-y-5">
        <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
          End-to-End Data Pipeline Architecture
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 pt-1">
          
          <div className="p-3.5 rounded-lg bg-[#151F2E] border border-[#253247] space-y-1 text-center">
            <div className="text-[10px] font-mono font-bold text-slate-500 uppercase">NODE 01</div>
            <div className="text-xs font-bold text-white">Sensors</div>
            <p className="text-[11px] text-slate-400 font-sans">DHT22, MPU6050, INA219</p>
          </div>

          <div className="p-3.5 rounded-lg bg-[#151F2E] border border-[#253247] space-y-1 text-center">
            <div className="text-[10px] font-mono font-bold text-slate-500 uppercase">NODE 02</div>
            <div className="text-xs font-bold text-white">Arduino Uno</div>
            <p className="text-[11px] text-slate-400 font-sans">Tinkercad Circuits</p>
          </div>

          <div className="p-3.5 rounded-lg bg-[#151F2E] border border-cyan-500/30 bg-cyan-950/20 space-y-1 text-center">
            <div className="text-[10px] font-mono font-bold text-cyan-400 uppercase">NODE 03</div>
            <div className="text-xs font-bold text-cyan-300">Fog Gateway</div>
            <p className="text-[11px] text-slate-300 font-sans">FastAPI Ingest (:8000)</p>
          </div>

          <div className="p-3.5 rounded-lg bg-[#151F2E] border border-[#253247] space-y-1 text-center">
            <div className="text-[10px] font-mono font-bold text-slate-500 uppercase">NODE 04</div>
            <div className="text-xs font-bold text-white">SQLite Queue</div>
            <p className="text-[11px] text-slate-400 font-sans">gateway.db (WAL)</p>
          </div>

          <div className="p-3.5 rounded-lg bg-[#151F2E] border border-[#253247] space-y-1 text-center">
            <div className="text-[10px] font-mono font-bold text-slate-500 uppercase">NODE 05</div>
            <div className="text-xs font-bold text-white">Circuit Breaker</div>
            <p className="text-[11px] text-slate-400 font-sans">FSM State Machine</p>
          </div>

          <div className="p-3.5 rounded-lg bg-[#151F2E] border border-emerald-500/30 bg-emerald-950/20 space-y-1 text-center">
            <div className="text-[10px] font-mono font-bold text-emerald-400 uppercase">NODE 06</div>
            <div className="text-xs font-bold text-emerald-300">Cloud API</div>
            <p className="text-[11px] text-slate-300 font-sans">cloud.db Consumer</p>
          </div>

        </div>
      </div>

      {/* Verified Technology Stack */}
      <div className="p-6 rounded-xl bg-[#101827] border border-[#253247] space-y-4">
        <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
          Verified Technology Stack
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          
          <div className="p-3 rounded-lg bg-[#151F2E] border border-[#253247]">
            <span className="text-slate-500 text-[10px] block">EDGE FIRMWARE</span>
            <div className="font-bold text-slate-200 mt-1">C++ / Arduino Core</div>
            <div className="text-slate-400 text-[11px] mt-0.5">Arduino & Tinkercad</div>
          </div>

          <div className="p-3 rounded-lg bg-[#151F2E] border border-[#253247]">
            <span className="text-slate-500 text-[10px] block">BACKEND ENGINE</span>
            <div className="font-bold text-slate-200 mt-1">Python 3.13 / FastAPI</div>
            <div className="text-slate-400 text-[11px] mt-0.5">Asyncio Workers</div>
          </div>

          <div className="p-3 rounded-lg bg-[#151F2E] border border-[#253247]">
            <span className="text-slate-500 text-[10px] block">PERSISTENT STORAGE</span>
            <div className="font-bold text-slate-200 mt-1">SQLite 3 (WAL Mode)</div>
            <div className="text-slate-400 text-[11px] mt-0.5">ACID Compliant</div>
          </div>

          <div className="p-3 rounded-lg bg-[#151F2E] border border-[#253247]">
            <span className="text-slate-500 text-[10px] block">FRONTEND NOC</span>
            <div className="font-bold text-slate-200 mt-1">React 18 + TypeScript</div>
            <div className="text-slate-400 text-[11px] mt-0.5">Vite & Tailwind CSS</div>
          </div>

        </div>
      </div>

    </div>
  );
};
