import React from "react";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

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
    md: { container: "w-10 h-10", text: "text-xs", flag: "w-4 h-4" },
    lg: { container: "w-12 h-12", text: "text-sm", flag: "w-5 h-5" },
    xl: { container: "w-16 h-16", text: "text-base", flag: "w-6 h-6" },
  };

  const sizes = sizeClasses[size];

  return (
    <div className={cn("flex items-center space-x-3", className)}>
      {/* Professional Logo Icon */}
      <div
        className={cn(
          "relative rounded-xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center overflow-hidden",
          sizes.container,
          animated && "hover:scale-105 transition-all duration-200",
        )}
      >
        {/* Sparkles Icon */}
        <Sparkles
          className={cn(
            "text-white drop-shadow-sm",
            size === "sm"
              ? "w-4 h-4"
              : size === "md"
                ? "w-5 h-5"
                : size === "lg"
                  ? "w-6 h-6"
                  : "w-8 h-8",
          )}
        />

        {/* Subtle glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl" />
      </div>

      {/* Brand Text */}
      <div className="flex flex-col">
        <h1 className="text-xl font-bold text-foreground leading-none">
          Nothing<span className="text-primary">AI</span>
        </h1>
        {showFlag && (
          <div className="flex items-center space-x-1 mt-0.5">
            <div className="flex rounded-sm overflow-hidden w-4 h-3 border border-border/30">
              <div className="flex-1 bg-blue-600" />
              <div className="flex-1 bg-white" />
              <div className="flex-1 bg-red-600" />
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              France
            </span>
          </div>
        )}
      </div>
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
    lg: "text-3xl",
  };

  return (
    <div className={cn("flex items-center space-x-3", className)}>
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center">
        <Sparkles className="w-5 h-5 text-white" />
      </div>
      <div className="flex flex-col">
        <h1
          className={cn(
            "font-bold text-foreground leading-none",
            sizeClasses[size],
          )}
        >
          Nothing<span className="text-primary">AI</span>
        </h1>
        <p className="text-xs text-muted-foreground">
          Assistant IA Professionnel
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
        "fixed inset-0 opacity-[0.02] pointer-events-none",
        className,
      )}
    >
      <div className="absolute inset-0">
        <svg
          className="w-full h-full"
          viewBox="0 0 400 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="logo-pattern"
              x="0"
              y="0"
              width="80"
              height="80"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="40" cy="40" r="1" fill="currentColor" opacity="0.3" />
            </pattern>
          </defs>
          <rect width="400" height="400" fill="url(#logo-pattern)" />
        </svg>
      </div>
    </div>
  );
};

export default NothingAILogo;
