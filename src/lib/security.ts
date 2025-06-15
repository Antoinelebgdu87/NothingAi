// Système de sécurité et protection pour NothingAI - Version adoucie
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
      // Protection contre le clic droit
      this.protectRightClick();

      // Protection contre les raccourcis clavier
      this.protectKeyboardShortcuts();

      // Protection contre la sélection de texte (adoucie)
      this.protectTextSelection();

      // Protection contre le drag & drop
      this.protectDragDrop();

      // Protection contre l'impression
      this.protectPrint();

      // Détection DevTools adoucie (pas de redirection forcée)
      this.startDevToolsDetection();
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
          (e.ctrlKey && (e.key === "s" || e.key === "S"))
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
      // Protection plus douce - permettre la sélection dans les inputs
      const handleSelectStart = (e: Event) => {
        const target = e.target;

        // Vérifier que target est un élément HTML
        if (!target || !(target instanceof HTMLElement)) {
          return true; // Permettre si ce n'est pas un élément HTML
        }

        // Permettre la sélection dans les éléments d'input
        if (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.contentEditable === "true"
        ) {
          return true;
        }

        // Vérifier avec closest() seulement si target est un Element
        if (typeof target.closest === "function") {
          try {
            if (target.closest("input, textarea, [contenteditable]")) {
              return true;
            }
          } catch (error) {
            // Si closest() échoue, permettre la sélection par sécurité
            console.warn("Erreur avec closest():", error);
            return true;
          }
        }

        e.preventDefault();
        return false;
      };

      this.addEventListenerSafe(document, "selectstart", handleSelectStart);

      // CSS pour désactiver la sélection (plus sélectif)
      const style = document.createElement("style");
      style.id = "nothingai-security-styles";
      style.textContent = `
        body, div, p, h1, h2, h3, h4, h5, h6, span, button {
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          user-select: none !important;
          -webkit-touch-callout: none !important;
        }

        input, textarea, [contenteditable="true"], code, pre {
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
      // Détection plus douce des DevTools - juste bloquer certaines actions
      let devToolsWarningShown = false;

      const devToolsDetector = () => {
        try {
          const before = new Date().getTime();
          debugger;
          const after = new Date().getTime();

          if (after - before > 100) {
            this.onDevToolsDetected(devToolsWarningShown);
            devToolsWarningShown = true;
          }
        } catch (error) {
          // Ignorer les erreurs du debugger
        }
      };

      // Vérification périodique plus espacée
      if (import.meta.env.PROD) {
        const interval = setInterval(devToolsDetector, 5000);
        this.intervals.push(interval);
      }
    } catch (error) {
      console.warn("Erreur lors de la détection des DevTools:", error);
    }
  }

  private onDevToolsDetected(warningShown: boolean) {
    try {
      // Réponse plus douce - juste un avertissement discret
      if (!warningShown) {
        console.clear();
        console.log(
          "🔒 NothingAI - Inspection désactivée pour des raisons de sécurité",
        );

        // Notification discrète sans bloquer l'interface
        if (typeof window !== "undefined" && (window as any).toast) {
          (window as any).toast("🔒 Inspection désactivée", {
            duration: 3000,
          });
        }
      }

      // Juste nettoyer la console périodiquement
      setTimeout(() => {
        try {
          console.clear();
        } catch (error) {
          // Ignorer si console.clear échoue
        }
      }, 1000);
    } catch (error) {
      console.warn("Erreur lors de la détection des DevTools:", error);
    }
  }

  private protectDragDrop() {
    const handleDragOver = (e: Event) => {
      const target = e.target;

      // Vérifier que target est un élément HTML avec closest()
      if (
        target &&
        target instanceof HTMLElement &&
        typeof target.closest === "function"
      ) {
        try {
          if (target.closest("[data-allow-drop]")) {
            return;
          }
        } catch (error) {
          console.warn("Erreur avec closest() dans dragover:", error);
        }
      }

      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e: Event) => {
      const target = e.target;

      // Vérifier que target est un élément HTML avec closest()
      if (
        target &&
        target instanceof HTMLElement &&
        typeof target.closest === "function"
      ) {
        try {
          if (target.closest("[data-allow-drop]")) {
            return;
          }
        } catch (error) {
          console.warn("Erreur avec closest() dans drop:", error);
        }
      }

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
        console.log("🔒 Impression désactivée pour des raisons de sécurité");
        return false;
      };

      this.addEventListenerSafe(window, "beforeprint", handleBeforePrint);

      // Redéfinir window.print avec message plus doux
      const originalPrint = window.print;
      window.print = function () {
        console.log("🔒 Impression désactivée pour des raisons de sécurité");

        // Notification si possible
        if (typeof window !== "undefined" && (window as any).toast) {
          (window as any).toast("🔒 Impression désactivée", {
            duration: 3000,
          });
        }

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
      protectionLevel: "soft", // Protection douce
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
      protectionLevel: "none",
    }),
  } as any;
}

export { securityManager };
