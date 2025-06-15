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
    console.log("🚀 Démarrage app...");

    // FORCE STOP LOADING après 1 seconde MAXIMUM
    const forceStop = setTimeout(() => {
      console.log("⚠️ FORCE STOP LOADING - Redirection vers activation");
      setIsLoading(false);
      setHasValidLicense(false);
    }, 1000);

    // Vérification ultra-rapide
    const quickCheck = () => {
      try {
        const localLicense = localStorage.getItem(
          "nothingai_user_license_firebase",
        );
        console.log("📋 License locale:", !!localLicense);

        if (localLicense) {
          setHasValidLicense(true);
          console.log("✅ License trouvée");
        } else {
          setHasValidLicense(false);
          console.log("❌ Pas de license");
        }
      } catch (error) {
        console.error("⚠️ Erreur check:", error);
        setHasValidLicense(false);
      }

      // Arrêter le loading
      setIsLoading(false);
      clearTimeout(forceStop);
      console.log("✅ Loading arrêté");
    };

    // Vérification après 500ms
    setTimeout(quickCheck, 500);

    // Cleanup
    return () => {
      clearTimeout(forceStop);
    };
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

  console.log(
    "🔄 App render - Loading:",
    isLoading,
    "HasLicense:",
    hasValidLicense,
  );

  // Écran de chargement très court
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg">Chargement de NothingAI...</p>
          <p className="text-sm text-white/70 mt-2">Vérification rapide</p>
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
              // PAS DE LICENSE → PAGE D'ACTIVATION
              <>
                <FirebaseLicenseGate
                  onLicenseValid={() => {
                    console.log("🎉 License validée !");
                    setHasValidLicense(true);
                  }}
                />
                <FirebaseAdminPanel
                  open={showAdminPanel}
                  onClose={() => setShowAdminPanel(false)}
                />
              </>
            ) : (
              // LICENSE VALIDE → APPLICATION
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
