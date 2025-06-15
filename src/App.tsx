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
import InstantLicenseGate from "./components/ui/instant-license-gate";
import InstantAdminPanel from "./components/ui/instant-admin-panel";

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
    // VÉRIFICATION INSTANTANÉE - ZERO latence
    console.log("🚀 NothingAI - Démarrage instantané");

    const checkLicense = () => {
      try {
        // Import du manager instantané
        const {
          instantLicenseManager,
        } = require("@/lib/instant-license-manager");

        // Vérification synchrone instantanée
        const hasLicense = instantLicenseManager.hasValidLicense();
        console.log("📋 License valide:", hasLicense);

        setHasValidLicense(hasLicense);

        if (hasLicense) {
          console.log("✅ Accès autorisé - Application chargée");
        } else {
          console.log("❌ Aucune license - Page d'activation");
        }
      } catch (error) {
        console.error("⚠️ Erreur vérification:", error);
        setHasValidLicense(false);
      }
    };

    // Exécution immédiate - pas de timeout
    checkLicense();
  }, []);

  useEffect(() => {
    // Gestionnaire Ctrl+F1 pour panel admin
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === "F1") {
        event.preventDefault();
        setShowAdminPanel(true);
        console.log("🔧 Panel admin ouvert");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <TooltipProvider>
          <div className="min-h-screen bg-background font-sans antialiased">
            <Toaster />
            <Sonner
              position="bottom-right"
              toastOptions={{
                style: {
                  background: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  color: "hsl(var(--foreground))",
                },
              }}
            />

            {!hasValidLicense ? (
              // PAS DE LICENSE → ACTIVATION INSTANTANÉE
              <>
                <InstantLicenseGate
                  onLicenseValid={() => {
                    console.log("🎉 License activée instantanément !");
                    setHasValidLicense(true);
                  }}
                />
                <InstantAdminPanel
                  open={showAdminPanel}
                  onClose={() => setShowAdminPanel(false)}
                />
              </>
            ) : (
              // LICENSE VALIDE → APPLICATION COMPLÈTE
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/images" element={<GeneratedImages />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <InstantAdminPanel
                  open={showAdminPanel}
                  onClose={() => setShowAdminPanel(false)}
                />
              </BrowserRouter>
            )}
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
