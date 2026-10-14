import React from "react";
import {
  X,
  HardDrive,
  Table
} from "lucide-react";
import type { DashboardMetrics } from "../types/dashboard";

interface DatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: DashboardMetrics | null;
}

export const DatabaseModal: React.FC<DatabaseModalProps> = ({
  isOpen,
  onClose,
  metrics,
}) => {
  if (!isOpen) return null;

  const pending = metrics?.pending_queue ?? 0;
  const synced = metrics?.synced_queue ?? 0;
  const failed = metrics?.failed_queue ?? 0;
  const total = pending + synced + failed;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-white/[0.12] p-6 shadow-2xl relative text-xs">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/[0.06] transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5 border-b border-white/[0.06] pb-4">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              SQLite Multi-Sensor Storage Inspector (<code className="font-mono text-purple-400">gateway.db</code>)
            </h3>
            <p className="text-xs text-slate-400">
              ACID-compliant queue table storing raw sensor telemetry + derived edge fusion intelligence
            </p>
          </div>
        </div>

        {/* Status Highlights */}
        <div className="grid grid-cols-3 gap-3 mb-5 font-mono text-xs">
          <div className="p-3 bg-slate-950/60 border border-white/[0.06] rounded-xl text-center">
            <span className="text-[10px] text-slate-400 block font-sans uppercase">Pending Sync</span>
            <span className={`text-xl font-bold mt-1 block ${pending > 0 ? "text-amber-400" : "text-slate-300"}`}>{pending}</span>
          </div>
          <div className="p-3 bg-slate-950/60 border border-white/[0.06] rounded-xl text-center">
            <span className="text-[10px] text-slate-400 block font-sans uppercase">Committed / Synced</span>
            <span className="text-xl font-bold text-emerald-400 mt-1 block">{synced}</span>
          </div>
          <div className="p-3 bg-slate-950/60 border border-white/[0.06] rounded-xl text-center">
            <span className="text-[10px] text-slate-400 block font-sans uppercase">Total Ingested</span>
            <span className="text-xl font-bold text-white mt-1 block">{total}</span>
          </div>
        </div>

        {/* Schema Table */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Table className="w-3.5 h-3.5 text-blue-400" />
            Table Schema: <code className="font-mono text-blue-400">sensor_queue</code>
          </h4>

          <div className="bg-slate-950/80 border border-white/[0.06] rounded-xl overflow-hidden font-mono text-[11px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.02] text-slate-400 text-[10px] uppercase">
                  <th className="p-2.5">Column</th>
                  <th className="p-2.5">Type</th>
                  <th className="p-2.5">Source / Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-slate-300">
                <tr>
                  <td className="p-2.5 text-blue-400">request_id</td>
                  <td className="p-2.5 text-slate-400">TEXT</td>
                  <td className="p-2.5">UNIQUE NOT NULL (Idempotency Key)</td>
                </tr>
                <tr>
                  <td className="p-2.5 text-purple-400">device_id</td>
                  <td className="p-2.5 text-slate-400">TEXT</td>
                  <td className="p-2.5">Edge Node (e.g. ARDUINO-001)</td>
                </tr>
                <tr>
                  <td className="p-2.5 text-orange-400">temperature / humidity</td>
                  <td className="p-2.5 text-slate-400">REAL</td>
                  <td className="p-2.5">DHT22 Ambient Environment (°C / %)</td>
                </tr>
                <tr>
                  <td className="p-2.5 text-purple-400">acceleration_x / y / z</td>
                  <td className="p-2.5 text-slate-400">REAL</td>
                  <td className="p-2.5">MPU6050 3-Axis Gravitational Acceleration (g)</td>
                </tr>
                <tr>
                  <td className="p-2.5 text-purple-400">vibration_level</td>
                  <td className="p-2.5 text-slate-400">REAL</td>
                  <td className="p-2.5">MPU6050 Vibration Index |Δg|</td>
                </tr>
                <tr>
                  <td className="p-2.5 text-amber-400">voltage / current / power</td>
                  <td className="p-2.5 text-slate-400">REAL</td>
                  <td className="p-2.5">INA219 Electrical Monitoring (V / mA / W)</td>
                </tr>
                <tr>
                  <td className="p-2.5 text-cyan-400">gas_level / pressure</td>
                  <td className="p-2.5 text-slate-400">REAL</td>
                  <td className="p-2.5">MQ-2 Smoke (ppm) & BMP280 Barometer (hPa)</td>
                </tr>
                <tr>
                  <td className="p-2.5 text-emerald-400">health_score / system_status</td>
                  <td className="p-2.5 text-slate-400">INT / TEXT</td>
                  <td className="p-2.5">Rule-Based Multi-Sensor Edge Fusion</td>
                </tr>
                <tr>
                  <td className="p-2.5 text-amber-400">status</td>
                  <td className="p-2.5 text-slate-400">TEXT</td>
                  <td className="p-2.5">'PENDING' | 'SYNCED' | 'FAILED'</td>
                </tr>
                <tr>
                  <td className="p-2.5 text-slate-300">retry_count</td>
                  <td className="p-2.5 text-slate-400">INTEGER</td>
                  <td className="p-2.5">Exponential backoff retry counter</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between">
          <span className="font-mono text-[10px] text-slate-500">WAL Mode Enabled • Thread-Safe SQLite</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-white/[0.08] text-white rounded-xl font-medium transition"
          >
            Close Inspector
          </button>
        </div>

      </div>
    </div>
  );
};
