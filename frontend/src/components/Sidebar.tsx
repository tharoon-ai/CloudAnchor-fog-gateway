import {
  LayoutDashboard,
  Cpu,
  Calculator,
  Server,
  Radio
} from "lucide-react";
import { CloudAnchorLogo } from "./CloudAnchorLogo";
import type { DashboardMetrics, NavTab } from "../types/dashboard";

export type { NavTab };

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  metrics: DashboardMetrics | null;
  gatewayError: string | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  metrics,
  gatewayError,
}) => {
  const isGatewayOnline = !gatewayError && metrics !== null;
  const isCloudOnline = metrics?.cloud_api?.status === "ONLINE";
  const deviceId = metrics?.latest_telemetry?.device_id || "ARDUINO-001";
  const lastUpdatedSec = metrics?.latest_telemetry?.last_updated_sec_ago ?? 0;
  const isStale = lastUpdatedSec > 15;

  const navItems = [
    { id: "overview" as NavTab, label: "Overview", icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: "sensors" as NavTab, label: "Sensors", icon: <Cpu className="w-4 h-4" /> },
    { id: "data_calc" as NavTab, label: "Data & Calculation", icon: <Calculator className="w-4 h-4" /> },
    { id: "system" as NavTab, label: "System", icon: <Server className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-60 bg-[#0B1220] border-r border-[#253247] flex flex-col justify-between h-screen sticky top-0 select-none z-40">
      
      {/* Top Brand + Nav */}
      <div className="flex-1 overflow-y-auto">
        
        {/* Brand Header */}
        <div className="p-4 border-b border-[#253247]">
          <CloudAnchorLogo variant="full" size="md" />
        </div>

        {/* Navigation Items */}
        <div className="p-3">
          <div className="text-[10px] font-mono uppercase font-bold text-slate-500 px-3 pb-1.5 tracking-wider">
            NAVIGATION
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-[#151F2E] text-cyan-400 font-semibold border border-[#253247]"
                      : "text-slate-400 hover:text-slate-200 hover:bg-[#151F2E]/60"
                  }`}
                >
                  <span className={`${isActive ? "text-cyan-400" : "text-slate-500"}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

      </div>

      {/* Bottom Status Block: ARDUINO-001 LIVE / STALE */}
      <div className="p-3 border-t border-[#253247] space-y-2 bg-[#0A101D]">
        
        <div className="p-2.5 rounded-lg bg-[#151F2E] border border-[#253247] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className={`w-3.5 h-3.5 ${!isStale && isGatewayOnline ? "text-emerald-400" : "text-slate-500"}`} />
            <div>
              <div className="text-[10px] text-slate-400 font-sans">Arduino Sensor Node</div>
              <span className="text-xs font-mono font-bold text-slate-200">{deviceId}</span>
            </div>
          </div>
          <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded ${
            !isStale && isGatewayOnline
              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
              : isStale
              ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
              : "bg-slate-800 text-slate-400 border border-[#253247]"
          }`}>
            {!isStale && isGatewayOnline ? "● LIVE" : isStale ? "STALE" : "OFFLINE"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
          <div className="px-2 py-1 rounded bg-[#101827] border border-[#253247] flex items-center justify-between">
            <span className="text-slate-500 text-[10px]">GW:8000</span>
            <span className={`text-[10px] font-bold ${isGatewayOnline ? "text-emerald-400" : "text-red-400"}`}>
              {isGatewayOnline ? "ONLINE" : "OFFLINE"}
            </span>
          </div>

          <div className="px-2 py-1 rounded bg-[#101827] border border-[#253247] flex items-center justify-between">
            <span className="text-slate-500 text-[10px]">CLOUD:8001</span>
            <span className={`text-[10px] font-bold ${isCloudOnline ? "text-emerald-400" : "text-red-400"}`}>
              {isCloudOnline ? "ONLINE" : "OFFLINE"}
            </span>
          </div>
        </div>

      </div>

    </aside>
  );
};
