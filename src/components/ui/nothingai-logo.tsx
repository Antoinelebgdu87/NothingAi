import React from "react";
import { cn } from "@/lib/utils";

interface NothingAILogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showFlag?: boolean;
  animated?: boolean;
  className?: string;
}

const NothingAILogo = ({
  size = "md",
  showFlag = true,
  animated = true,
  className,
}: NothingAILogoProps) => {
  const sizeClasses = {
    sm: { container: "w-8 h-8", text: "text-xs", flag: "w-3 h-3" },
    md: { container: "w-12 h-12", text: "text-sm", flag: "w-4 h-4" },
    lg: { container: "w-16 h-16", text: "text-lg", flag: "w-5 h-5" },
    xl: { container: "w-24 h-24", text: "text-2xl", flag: "w-6 h-6" },
  };

  const sizes = sizeClasses[size];

  return (
    <div className={cn("flex flex-col items-center space-y-2", className)}>
      {/* Main Logo */}
      <div
        className={cn(
          "relative rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center overflow-hidden",
          sizes.container,
          animated && "logo-float hover:scale-105 transition-transform",
        )}
      >
        {/* Diagonal Lines Background */}
        <div className="absolute inset-0 opacity-30">
          <svg
            className="w-full h-full"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id="diagonal-lines"
                x="0"
                y="0"
                width="20"
                height="20"
                patternUnits="userSpaceOnUse"
              >
                <line
                  x1="0"
                  y1="0"
                  x2="20"
                  y2="20"
                  stroke="white"
                  strokeWidth="1"
                  opacity="0.6"
                />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#diagonal-lines)" />
          </svg>
        </div>

        {/* Blue Accent Areas */}
        <div className="absolute top-0 left-0 w-4 h-4 bg-gradient-to-br from-blue-500 to-blue-600 opacity-60 rounded-br-lg" />
        <div className="absolute bottom-0 right-0 w-4 h-4 bg-gradient-to-tl from-blue-500 to-blue-600 opacity-60 rounded-tl-lg" />

        {/* Nothing AI Text */}
        <div className="relative z-10 text-center">
          <div
            className={cn(
              "font-bold text-white tracking-tight leading-none",
              sizes.text,
            )}
          >
            <div>NOTHING</div>
            <div className="text-blue-400">AI</div>
          </div>
        </div>

        {/* Decorative Border */}
        <div className="absolute inset-0 border border-white/20 rounded-2xl" />
      </div>

      {/* French Flag */}
      {showFlag && (
        <div
          className={cn(
            "rounded-sm overflow-hidden border border-white/20",
            sizes.flag,
          )}
        >
          <div className="flex h-full">
            <div className="flex-1 bg-blue-600" />
            <div className="flex-1 bg-white" />
            <div className="flex-1 bg-red-600" />
          </div>
        </div>
      )}
    </div>
  );
};

interface NothingAIWordmarkProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const NothingAIWordmark = ({
  size = "md",
  className,
}: NothingAIWordmarkProps) => {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
  };

  return (
    <div className={cn("flex items-center space-x-3", className)}>
      <NothingAILogo size={size === "lg" ? "lg" : "md"} animated={false} />
      <div className="flex flex-col">
        <h1
          className={cn(
            "font-bold gradient-text leading-none",
            sizeClasses[size],
          )}
        >
          NothingAI
        </h1>
        <p className="text-xs text-muted-foreground hidden sm:block">
          Assistant IA Français Avancé
        </p>
      </div>
    </div>
  );
};

interface LogoGridBackgroundProps {
  className?: string;
}

export const LogoGridBackground = ({ className }: LogoGridBackgroundProps) => {
  return (
    <div
      className={cn(
        "absolute inset-0 opacity-5 pointer-events-none",
        className,
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Diagonal Lines Pattern */}
        <svg
          className="w-full h-full"
          viewBox="0 0 400 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="logo-diagonal-lines"
              x="0"
              y="0"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <line
                x1="0"
                y1="0"
                x2="40"
                y2="40"
                stroke="white"
                strokeWidth="1"
                opacity="0.3"
              />
              <line
                x1="0"
                y1="10"
                x2="40"
                y2="50"
                stroke="white"
                strokeWidth="0.5"
                opacity="0.2"
              />
            </pattern>
          </defs>
          <rect width="400" height="400" fill="url(#logo-diagonal-lines)" />
        </svg>

        {/* Blue Accent Spots */}
        <div className="absolute top-1/4 left-1/4 w-20 h-20 bg-blue-500/10 rounded-full blur-xl" />
        <div className="absolute bottom-1/3 right-1/3 w-16 h-16 bg-blue-400/10 rounded-full blur-lg" />
      </div>
    </div>
  );
};

export default NothingAILogo;
