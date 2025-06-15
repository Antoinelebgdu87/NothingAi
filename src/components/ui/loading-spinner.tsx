import React from "react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "dots" | "pulse" | "orbit" | "wave";
  className?: string;
}

const LoadingSpinner = ({
  size = "md",
  variant = "default",
  className,
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
  };

  if (variant === "dots") {
    return (
      <div className={cn("flex space-x-1", className)}>
        <div
          className={cn(
            "rounded-full bg-primary animate-pulse-dot",
            size === "sm"
              ? "w-1 h-1"
              : size === "md"
                ? "w-2 h-2"
                : size === "lg"
                  ? "w-3 h-3"
                  : "w-4 h-4",
          )}
        />
        <div
          className={cn(
            "rounded-full bg-primary animate-pulse-dot",
            size === "sm"
              ? "w-1 h-1"
              : size === "md"
                ? "w-2 h-2"
                : size === "lg"
                  ? "w-3 h-3"
                  : "w-4 h-4",
          )}
          style={{ animationDelay: "0.2s" }}
        />
        <div
          className={cn(
            "rounded-full bg-primary animate-pulse-dot",
            size === "sm"
              ? "w-1 h-1"
              : size === "md"
                ? "w-2 h-2"
                : size === "lg"
                  ? "w-3 h-3"
                  : "w-4 h-4",
          )}
          style={{ animationDelay: "0.4s" }}
        />
      </div>
    );
  }

  if (variant === "pulse") {
    return (
      <div
        className={cn(
          "rounded-full bg-primary animate-pulse",
          sizeClasses[size],
          className,
        )}
      />
    );
  }

  if (variant === "orbit") {
    return (
      <div className={cn("relative", sizeClasses[size], className)}>
        <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
        <div
          className="absolute inset-2 rounded-full border border-primary/40 animate-spin"
          style={{ animationDirection: "reverse", animationDuration: "0.8s" }}
        />
      </div>
    );
  }

  if (variant === "wave") {
    return (
      <div className={cn("flex space-x-1", className)}>
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className={cn(
              "bg-primary rounded-full animate-pulse",
              size === "sm"
                ? "w-1 h-3"
                : size === "md"
                  ? "w-1.5 h-6"
                  : size === "lg"
                    ? "w-2 h-8"
                    : "w-2.5 h-10",
            )}
            style={{
              animationDelay: `${i * 0.15}s`,
              animationDuration: "0.8s",
            }}
          />
        ))}
      </div>
    );
  }

  // Default spinner
  return (
    <div className={cn("relative", sizeClasses[size], className)}>
      <div className="absolute inset-0 rounded-full border-2 border-muted" />
      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
    </div>
  );
};

interface TypingIndicatorProps {
  className?: string;
}

export const TypingIndicator = ({ className }: TypingIndicatorProps) => {
  return (
    <div
      className={cn(
        "flex items-center space-x-2 text-muted-foreground",
        className,
      )}
    >
      <LoadingSpinner variant="dots" size="sm" />
      <span className="text-sm animate-pulse">NothingAI is typing...</span>
    </div>
  );
};

interface PageLoadingProps {
  message?: string;
  className?: string;
}

export const PageLoading = ({
  message = "Loading...",
  className,
}: PageLoadingProps) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center min-h-[200px] space-y-4",
        className,
      )}
    >
      <LoadingSpinner variant="orbit" size="lg" />
      <div className="text-center space-y-2">
        <h3 className="text-lg font-medium">NothingAI</h3>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
};

interface ButtonLoadingProps {
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const ButtonLoading = ({
  loading,
  children,
  className,
}: ButtonLoadingProps) => {
  return (
    <div className={cn("flex items-center space-x-2", className)}>
      {loading && <LoadingSpinner size="sm" />}
      <span>{children}</span>
    </div>
  );
};

// Named export for compatibility
export { LoadingSpinner };

// Default export
export default LoadingSpinner;
