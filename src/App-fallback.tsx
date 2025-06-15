import React, { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import Settings from "./pages/Settings";
import GeneratedImages from "./pages/GeneratedImages";
import NotFound from "./pages/NotFound";
import SimpleLicenseGate from "./components/ui/simple-license-gate";
import SimpleAdminPanel from "./components/ui/simple-admin-panel";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    },
    mutations: {
      retry: 1,
    },
  },
});

const App = () => {
  const [hasValidLicense, setHasValidLicense] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  useEffect(() => {
    console.log("🚀 Version fallback - Démarrage direct");

    // Gestionnaire pour Ctrl+F1 (Admin Panel)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "F1") {
        e.preventDefault();
        setShowAdminPanel(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleLicenseValid = () => {
    setHasValidLicense(true);
  };

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner
            position="bottom-right"
            theme="dark"
            toastOptions={{
              style: {
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                color: "hsl(var(--foreground))",
              },
            }}
          />

          {!hasValidLicense ? (
            <>
              <SimpleLicenseGate onLicenseValid={handleLicenseValid} />
              <SimpleAdminPanel
                open={showAdminPanel}
                onClose={() => setShowAdminPanel(false)}
              />
            </>
          ) : (
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/images" element={<GeneratedImages />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <SimpleAdminPanel
                open={showAdminPanel}
                onClose={() => setShowAdminPanel(false)}
              />
            </BrowserRouter>
          )}
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
