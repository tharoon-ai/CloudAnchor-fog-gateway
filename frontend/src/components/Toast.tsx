import React from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

interface ToastProps {
  toast: { message: string; type: "success" | "error" } | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  if (!toast) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div
        className={`px-4 py-3 rounded-xl shadow-2xl border text-xs font-medium flex items-center gap-3 backdrop-blur-xl ${
          toast.type === "success"
            ? "bg-[#0c1624]/90 border-emerald-500/40 text-emerald-300 shadow-emerald-950/40"
            : "bg-[#1c0e14]/90 border-red-500/40 text-red-300 shadow-red-950/40"
        }`}
      >
        {toast.type === "success" ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        ) : (
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
        )}
        <span className="flex-1">{toast.message}</span>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-0.5 rounded transition"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
