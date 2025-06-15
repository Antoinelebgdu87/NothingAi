import { useState, useCallback, useEffect } from "react";

export interface LogoCustomization {
  text: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  size: "sm" | "md" | "lg" | "xl";
  showFlag: boolean;
  customImage?: string;
  style: "modern" | "classic" | "minimal" | "playful";
}

const DEFAULT_CUSTOMIZATION: LogoCustomization = {
  text: "NothingAI",
  primaryColor: "#10b981", // emerald-500
  secondaryColor: "#059669", // emerald-600
  backgroundColor: "#ffffff",
  size: "lg",
  showFlag: true,
  style: "modern",
};

const STORAGE_KEY = "nothingai-logo-customization";

export function useLogoCustomization() {
  const [customization, setCustomization] = useState<LogoCustomization>(
    DEFAULT_CUSTOMIZATION,
  );

  // Load customization from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsedCustomization = JSON.parse(saved);
        setCustomization({ ...DEFAULT_CUSTOMIZATION, ...parsedCustomization });
      }
    } catch (error) {
      console.warn("Failed to load logo customization:", error);
    }
  }, []);

  // Save customization to localStorage
  const saveCustomization = useCallback(
    (newCustomization: LogoCustomization) => {
      try {
        setCustomization(newCustomization);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newCustomization));
      } catch (error) {
        console.warn("Failed to save logo customization:", error);
      }
    },
    [],
  );

  // Update specific customization properties
  const updateCustomization = useCallback(
    (updates: Partial<LogoCustomization>) => {
      const updated = { ...customization, ...updates };
      saveCustomization(updated);
    },
    [customization, saveCustomization],
  );

  // Reset to default customization
  const resetToDefault = useCallback(() => {
    saveCustomization(DEFAULT_CUSTOMIZATION);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn("Failed to clear logo customization:", error);
    }
  }, [saveCustomization]);

  // Export customization
  const exportCustomization = useCallback(() => {
    const dataStr = JSON.stringify(customization, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `nothingai-logo-customization-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [customization]);

  // Import customization
  const importCustomization = useCallback(
    (file: File): Promise<void> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const imported = JSON.parse(e.target?.result as string);
            const validated = { ...DEFAULT_CUSTOMIZATION, ...imported };
            saveCustomization(validated);
            resolve();
          } catch (error) {
            reject(new Error("Invalid customization file"));
          }
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsText(file);
      });
    },
    [saveCustomization],
  );

  // Generate CSS variables for current customization
  const getCSSVariables = useCallback(() => {
    return {
      "--logo-primary-color": customization.primaryColor,
      "--logo-secondary-color": customization.secondaryColor,
      "--logo-background-color": customization.backgroundColor,
    };
  }, [customization]);

  // Check if current customization is default
  const isDefault = useCallback(() => {
    return (
      JSON.stringify(customization) === JSON.stringify(DEFAULT_CUSTOMIZATION)
    );
  }, [customization]);

  // Generate logo styles based on customization
  const getLogoStyles = useCallback(() => {
    const baseStyles = {
      background: customization.customImage
        ? `url(${customization.customImage})`
        : `linear-gradient(135deg, ${customization.primaryColor}, ${customization.secondaryColor})`,
      backgroundSize: customization.customImage ? "cover" : "auto",
      backgroundPosition: customization.customImage ? "center" : "auto",
    };

    const sizeClasses = {
      sm: "w-8 h-8",
      md: "w-10 h-10",
      lg: "w-12 h-12",
      xl: "w-16 h-16",
    };

    const textSizeClasses = {
      sm: "text-sm",
      md: "text-base",
      lg: "text-lg",
      xl: "text-xl",
    };

    return {
      containerClass: `${sizeClasses[customization.size]} rounded-xl overflow-hidden`,
      textClass: `${textSizeClasses[customization.size]} font-bold`,
      textColor: customization.primaryColor,
      styles: baseStyles,
    };
  }, [customization]);

  return {
    customization,
    updateCustomization,
    saveCustomization,
    resetToDefault,
    exportCustomization,
    importCustomization,
    getCSSVariables,
    getLogoStyles,
    isDefault: isDefault(),
  };
}

export default useLogoCustomization;
