// Système de sécurité et protection pour NothingAI - Version améliorée
class SecurityManager {
  private _protectionEnabled: boolean = true;
  private intervals: NodeJS.Timeout[] = [];
  private eventListeners: Array<{
    element: EventTarget;
    event: string;
    handler: EventListener;
  }> = [];

  constructor() {
    try {
      this.initProtection();
    } catch (error) {
      console.warn("Erreur lors de l'initialisation de la sécurité:", error);
    }
  }

  private initProtection() {
    if (!this._protectionEnabled) return;

    try {
      // Protection contre les DevTools
      this.protectDevTools();

      // Protection contre le clic droit
      this.protectRightClick();

      // Protection contre les raccourcis clavier
      this.protectKeyboardShortcuts();

      // Protection contre la sélection de texte
      this.protectTextSelection();

      // Detection continue des DevTools
      this.startDevToolsDetection();

      // Protection contre le drag & drop
      this.protectDragDrop();

      // Protection contre l'impression
      this.protectPrint();
    } catch (error) {
      console.warn("Erreur lors de l'activation de la protection:", error);
    }
  }

  private addEventListenerSafe(
    element: EventTarget,
    event: string,
    handler: EventListener,
  ) {
    try {
      element.addEventListener(event, handler);
      this.eventListeners.push({ element, event, handler });
    } catch (error) {
      console.warn(
        `Erreur lors de l'ajout de l'event listener ${event}:`,
        error,
      );
    }
  }

  private protectDevTools() {
    try {
      // Redefinir console pour masquer les logs (seulement en production)
      if (import.meta.env.PROD) {
        const noop = () => {};
        Object.keys(console).forEach((key) => {
          try {
            (console as any)[key] = noop;
          } catch (error) {
            // Certaines propriétés peuvent être en lecture seule
          }
        });
      }

      // Protection contre l'ouverture des DevTools
      let devtools = { open: false };
      const threshold = 160;

      const checkDevTools = () => {
        try {
          if (
            window.outerHeight - window.innerHeight > threshold ||
            window.outerWidth - window.innerWidth > threshold
          ) {
            if (!devtools.open) {
              devtools.open = true;
              this.onDevToolsDetected();
            }
          } else {
            devtools.open = false;
          }
        } catch (error) {
          // Ignorer les erreurs de détection
        }
      };

      const interval = setInterval(checkDevTools, 500);
      this.intervals.push(interval);
    } catch (error) {
      console.warn("Erreur lors de la protection des DevTools:", error);
    }
  }

  private onDevToolsDetected() {
    try {
      // Rediriger vers une page blanche
      const overlay = document.createElement("div");
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: #000;
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: Arial, sans-serif;
        z-index: 999999;
      `;

      overlay.innerHTML = `
        <div style="text-align: center;">
          <h1>🔒 Accès Restreint</h1>
          <p>Les outils de développement ne sont pas autorisés.</p>
          <p>Fermez les DevTools pour continuer.</p>
          <p style="font-size: 12px; margin-top: 20px; opacity: 0.7;">
            Rechargement automatique dans 3 secondes...
          </p>
        </div>
      `;

      document.body.appendChild(overlay);

      // Bloquer l'exécution
      setTimeout(() => {
        try {
          location.reload();
        } catch (error) {
          // Si le reload échoue, retirer l'overlay
          overlay.remove();
        }
      }, 3000);
    } catch (error) {
      console.warn("Erreur lors de la détection des DevTools:", error);
    }
  }

  private protectRightClick() {
    const handleContextMenu = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    this.addEventListenerSafe(document, "contextmenu", handleContextMenu);
  }

  private protectKeyboardShortcuts() {
    const handleKeyDown = (e: KeyboardEvent) => {
      try {
        // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+S, Ctrl+Shift+C
        if (
          e.key === "F12" ||
          (e.ctrlKey &&
            e.shiftKey &&
            (e.key === "I" || e.key === "J" || e.key === "C")) ||
          (e.ctrlKey && (e.key === "u" || e.key === "U")) ||
          (e.ctrlKey && (e.key === "s" || e.key === "S")) ||
          (e.ctrlKey && (e.key === "a" || e.key === "A")) ||
          (e.ctrlKey && (e.key === "p" || e.key === "P"))
        ) {
          // Exception pour Ctrl+F1 (admin panel)
          if (e.ctrlKey && e.key === "F1") {
            return; // Laisser passer pour l'admin panel
          }

          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      } catch (error) {
        // Ignorer les erreurs de gestion des touches
      }
    };

    this.addEventListenerSafe(document, "keydown", handleKeyDown);
  }

  private protectTextSelection() {
    try {
      const handleSelectStart = (e: Event) => {
        e.preventDefault();
        return false;
      };

      const handleDragStart = (e: Event) => {
        e.preventDefault();
        return false;
      };

      this.addEventListenerSafe(document, "selectstart", handleSelectStart);
      this.addEventListenerSafe(document, "dragstart", handleDragStart);

      // CSS pour désactiver la sélection
      const style = document.createElement("style");
      style.id = "nothingai-security-styles";
      style.textContent = `
        * {
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          user-select: none !important;
          -webkit-touch-callout: none !important;
          -webkit-tap-highlight-color: transparent !important;
        }
        
        input, textarea, [contenteditable="true"] {
          -webkit-user-select: text !important;
          -moz-user-select: text !important;
          -ms-user-select: text !important;
          user-select: text !important;
        }
      `;

      if (!document.head.querySelector("#nothingai-security-styles")) {
        document.head.appendChild(style);
      }
    } catch (error) {
      console.warn("Erreur lors de la protection de la sélection:", error);
    }
  }

  private startDevToolsDetection() {
    try {
      const devToolsDetector = () => {
        try {
          const before = new Date().getTime();
          debugger;
          const after = new Date().getTime();

          if (after - before > 100) {
            this.onDevToolsDetected();
          }
        } catch (error) {
          // Ignorer les erreurs du debugger
        }
      };

      // Vérification périodique seulement en production
      if (import.meta.env.PROD) {
        const interval = setInterval(devToolsDetector, 2000);
        this.intervals.push(interval);
      }
    } catch (error) {
      console.warn("Erreur lors de la détection des DevTools:", error);
    }
  }

  private protectDragDrop() {
    const handleDragOver = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };

    this.addEventListenerSafe(document, "dragover", handleDragOver);
    this.addEventListenerSafe(document, "drop", handleDrop);
  }

  private protectPrint() {
    try {
      const handleBeforePrint = (e: Event) => {
        e.preventDefault();
        return false;
      };

      this.addEventListenerSafe(window, "beforeprint", handleBeforePrint);

      // Redéfinir window.print avec protection
      const originalPrint = window.print;
      window.print = function () {
        console.warn("Impression désactivée pour des raisons de sécurité");
        return false;
      };

      // Sauvegarder la référence originale
      (window as any).__originalPrint = originalPrint;
    } catch (error) {
      console.warn("Erreur lors de la protection de l'impression:", error);
    }
  }

  public disable() {
    try {
      this._protectionEnabled = false;

      // Nettoyer les intervals
      this.intervals.forEach((interval) => {
        try {
          clearInterval(interval);
        } catch (error) {
          console.warn("Erreur lors du nettoyage d'un interval:", error);
        }
      });
      this.intervals = [];

      // Nettoyer les event listeners
      this.eventListeners.forEach(({ element, event, handler }) => {
        try {
          element.removeEventListener(event, handler);
        } catch (error) {
          console.warn(
            `Erreur lors de la suppression de l'event listener ${event}:`,
            error,
          );
        }
      });
      this.eventListeners = [];

      // Retirer les styles de sécurité
      const securityStyles = document.head.querySelector(
        "#nothingai-security-styles",
      );
      if (securityStyles) {
        securityStyles.remove();
      }

      // Restaurer window.print si possible
      if ((window as any).__originalPrint) {
        window.print = (window as any).__originalPrint;
      }
    } catch (error) {
      console.warn("Erreur lors de la désactivation de la sécurité:", error);
    }
  }

  public enable() {
    try {
      this._protectionEnabled = true;
      this.initProtection();
    } catch (error) {
      console.warn("Erreur lors de l'activation de la sécurité:", error);
    }
  }

  public get protectionEnabled(): boolean {
    return this._protectionEnabled;
  }

  public getStatus() {
    return {
      enabled: this._protectionEnabled,
      activeIntervals: this.intervals.length,
      activeListeners: this.eventListeners.length,
      environment: import.meta.env.MODE,
    };
  }
}

// Instance globale avec gestion d'erreur
let securityManager: SecurityManager;

try {
  securityManager = new SecurityManager();
} catch (error) {
  console.warn("Erreur lors de la création du SecurityManager:", error);
  // Créer un manager de fallback sans protection
  securityManager = {
    disable: () => {},
    enable: () => {},
    protectionEnabled: false,
    getStatus: () => ({
      enabled: false,
      activeIntervals: 0,
      activeListeners: 0,
      environment: import.meta.env.MODE,
    }),
  } as any;
}

export { securityManager };
