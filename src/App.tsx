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
import { firebaseLicenseManager } from "./lib/firebase-license-manager";
import { securityManager } from "./lib/security";

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
    // Initialiser la sécurité
    securityManager.enable();

    // Vérifier la license existante avec Firebase
    const checkLicense = async () => {
      try {
        const hasLicense = await firebaseLicenseManager.hasValidLicense();
        setHasValidLicense(hasLicense);
      } catch (error) {
        console.error("Erreur lors de la vérification de la license:", error);
        setHasValidLicense(false);
      } finally {
        setIsLoading(false);
      }
    };

    // Délai pour l'effet de chargement puis vérification
    setTimeout(checkLicense, 1500);

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
      securityManager.disable();
    };
  }, []);

  const handleLicenseValid = () => {
    setHasValidLicense(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-white">Chargement de NothingAI...</p>
        </div>
      </div>
    );
  }

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
              <FirebaseLicenseGate onLicenseValid={handleLicenseValid} />
              <FirebaseAdminPanel
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
              <FirebaseAdminPanel
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
