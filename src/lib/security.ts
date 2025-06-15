// Système de sécurité et protection pour NothingAI
class SecurityManager {
  private protectionEnabled: boolean = true;
  private intervals: NodeJS.Timeout[] = [];

  constructor() {
    this.initProtection();
  }

  private initProtection() {
    if (!this.protectionEnabled) return;

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
  }

  private protectDevTools() {
    // Redefinir console pour masquer les logs
    const noop = () => {};
    Object.keys(console).forEach((key) => {
      (console as any)[key] = noop;
    });

    // Protection contre l'ouverture des DevTools
    let devtools = { open: false, orientation: null };
    const threshold = 160;

    setInterval(() => {
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
    }, 500);
  }

  private onDevToolsDetected() {
    // Rediriger vers une page blanche
    document.documentElement.innerHTML = `
      <div style="
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
      ">
        <div style="text-align: center;">
          <h1>🔒 Accès Restreint</h1>
          <p>Les outils de développement ne sont pas autorisés.</p>
          <p>Fermez les DevTools pour continuer.</p>
        </div>
      </div>
    `;

    // Bloquer l'exécution
    setTimeout(() => {
      location.reload();
    }, 3000);
  }

  private protectRightClick() {
    document.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    });
  }

  private protectKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
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
    });
  }

  private protectTextSelection() {
    document.addEventListener("selectstart", (e) => {
      e.preventDefault();
      return false;
    });

    document.addEventListener("dragstart", (e) => {
      e.preventDefault();
      return false;
    });

    // CSS pour désactiver la sélection
    const style = document.createElement("style");
    style.textContent = `
      * {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
        -webkit-tap-highlight-color: transparent !important;
      }
      
      input, textarea {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
      }
    `;
    document.head.appendChild(style);
  }

  private startDevToolsDetection() {
    const devToolsDetector = () => {
      const before = new Date().getTime();
      debugger;
      const after = new Date().getTime();

      if (after - before > 100) {
        this.onDevToolsDetected();
      }
    };

    // Vérification périodique
    const interval = setInterval(devToolsDetector, 1000);
    this.intervals.push(interval);
  }

  private protectDragDrop() {
    document.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    document.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  }

  private protectPrint() {
    window.addEventListener("beforeprint", (e) => {
      e.preventDefault();
      return false;
    });

    // Redéfinir window.print
    window.print = () => {
      console.log("Impression désactivée");
    };
  }

  public disable() {
    this.protectionEnabled = false;
    this.intervals.forEach((interval) => clearInterval(interval));
    this.intervals = [];
  }

  public enable() {
    this.protectionEnabled = true;
    this.initProtection();
  }
}

// Instance globale
export const securityManager = new SecurityManager();

// Protection contre la modification de l'objet
Object.freeze(securityManager);
