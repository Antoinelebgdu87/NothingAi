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
import FirebaseLicenseGate from "./components/ui/firebase-license-gate";
import FirebaseAdminPanel from "./components/ui/firebase-admin-panel";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

const App = () => {
  const [hasValidLicense, setHasValidLicense] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Version directe et simple - pas de complications
    console.log("🚀 Démarrage simple de l'application...");

    const checkLicense = async () => {
      try {
        console.log("🔍 Vérification des licenses...");

        // Import du manager Firebase
        const { firebaseLicenseManager } = await import(
          "./lib/firebase-license-manager"
        );

        // Vérification asynchrone avec Firebase
        const hasValidLicense = await firebaseLicenseManager.hasValidLicense();
        console.log("📋 License valide:", hasValidLicense);

        setHasValidLicense(hasValidLicense);

        if (hasValidLicense) {
          console.log("✅ License valide - Accès à l'application");
        } else {
          console.log("❌ Aucune license valide - Page d'activation");
        }
      } catch (error) {
        console.error("⚠️ Erreur vérification license:", error);
        setHasValidLicense(false);
      }

      // Arrêter le loading dans tous les cas
      setIsLoading(false);
      console.log("✅ Application initialisée");
    };

    // Petit délai pour l'effet visuel puis vérification directe
    setTimeout(checkLicense, 300);
  }, []);

  useEffect(() => {
    // Gestionnaire pour Ctrl+F1 (Admin Panel)
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

  // Écran de chargement simple
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg">Chargement de NothingAI...</p>
          <p className="text-sm text-white/70 mt-2">
            Vérification des licenses
          </p>
        </div>
      </div>
    );
  }

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
              // Pas de license → Page d'activation directe (comme au début)
              <>
                <FirebaseLicenseGate
                  onLicenseValid={() => setHasValidLicense(true)}
                />
                {/* Panel Admin accessible même sans license */}
                <FirebaseAdminPanel
                  open={showAdminPanel}
                  onClose={() => setShowAdminPanel(false)}
                />
              </>
            ) : (
              // License valide → Application complète
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/images" element={<GeneratedImages />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <FirebaseAdminPanel
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
