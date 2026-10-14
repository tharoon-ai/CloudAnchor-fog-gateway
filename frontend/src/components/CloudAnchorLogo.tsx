import React from "react";

interface LogoProps {
  variant?: "full" | "header" | "compact" | "monochrome";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const CloudAnchorLogo: React.FC<LogoProps> = ({
  variant = "full",
  size = "md",
  className = "",
}) => {
  const iconSizes = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  };

  const isMono = variant === "monochrome";

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      
      {/* Geometric SVG Cloud + Anchor Emblem */}
      <div className={`relative flex items-center justify-center ${iconSizes[size]} flex-shrink-0`}>
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm"
        >
          {/* Background Rounded Shield / Node Base */}
          <rect
            x="3"
            y="3"
            width="42"
            height="42"
            rx="10"
            fill={isMono ? "#1E293B" : "#0F172A"}
            stroke={isMono ? "#475569" : "#1E293B"}
            strokeWidth="1.5"
          />

          {/* Upper Geometric Cloud Arc */}
          <path
            d="M16 26C14.3431 26 13 24.6569 13 23C13 21.4589 14.1627 20.19 15.6588 20.0222C16.1407 16.5916 19.071 14 22.6 14C25.4348 14 27.8778 15.6669 28.9892 18.0694C29.6105 17.7126 30.3298 17.5 31.1 17.5C33.5853 17.5 35.6 19.5147 35.6 22C35.6 22.1819 35.5892 22.3611 35.5683 22.5372C36.4258 23.2384 37 24.3013 37 25.5C37 27.433 35.433 29 33.5 29H16"
            stroke={isMono ? "#CBD5E1" : "url(#cloudGradient)"}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Central Vertical Connectivity Stem */}
          <path
            d="M24 22V35"
            stroke={isMono ? "#94A3B8" : "#22D3EE"}
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Lower Anchoring Flukes / Cross-Bar */}
          <path
            d="M17 31C18.8 34.5 21.2 36 24 36C26.8 36 29.2 34.5 31 31"
            stroke={isMono ? "#94A3B8" : "url(#anchorGradient)"}
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Central Pivot Node */}
          <circle
            cx="24"
            cy="24"
            r="2"
            fill={isMono ? "#FFFFFF" : "#22D3EE"}
          />

          {/* Gradients */}
          <defs>
            <linearGradient id="cloudGradient" x1="13" y1="14" x2="37" y2="29" gradientUnits="userSpaceOnUse">
              <stop stopColor="#38BDF8" />
              <stop offset="1" stopColor="#3B82F6" />
            </linearGradient>
            <linearGradient id="anchorGradient" x1="17" y1="31" x2="31" y2="36" gradientUnits="userSpaceOnUse">
              <stop stopColor="#22D3EE" />
              <stop offset="1" stopColor="#0284C7" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Wordmark and Tagline */}
      {variant !== "compact" && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold tracking-wider text-slate-100 font-sans text-sm">
              CLOUD<span className="text-cyan-400">ANCHOR</span>
            </span>
          </div>

          {variant === "full" && (
            <span className="text-[10px] font-mono tracking-wide text-slate-400 font-medium">
              Resilient Edge Connectivity
            </span>
          )}
        </div>
      )}

    </div>
  );
};
