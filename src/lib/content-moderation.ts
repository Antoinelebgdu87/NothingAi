// Système de modération de contenu pour NothingAI
// Filtre les contenus inappropriés, NSFW, et potentiellement dangereux

interface ModerationResult {
  isBlocked: boolean;
  reason?: string;
  blockedWords?: string[];
  suggestion?: string;
}

// Listes de mots bloqués par catégorie
const BLOCKED_WORDS = {
  // Contenu sexuel explicite
  sexual: [
    "sex",
    "sexy",
    "porn",
    "pornographie",
    "porno",
    "xxx",
    "adulte",
    "nue",
    "nu",
    "naked",
    "nude",
    "seins",
    "penis",
    "vagina",
    "fesses",
    "cul",
    "nichons",
    "bite",
    "chatte",
    "sexe",
    "érotique",
    "erotic",
    "lingerie",
    "sous-vêtements",
    "bikini sexy",
    "topless",
    "strip",
    "prostitution",
    "escort",
    "bordel",
    "orgie",
    "fetish",
    "bdsm",
    "masturbation",
    "masturbate",
    "orgasm",
    "orgasme",
    "jouir",
    "éjaculation",
    "ejaculation",
    "lubrifiant",
    "préservatif",
    "condom",
    "vibromasseur",
    "sextoy",
    "dildo",
    "plug anal",
    "anal",
    "fellatio",
    "fellation",
    "cunnilingus",
    "sodomie",
    "69",
    "gangbang",
    "bukkake",
    "creampie",
    "milf",
    "cougar",
    "teen sex",
    "lolita",
    "schoolgirl",
    "uniform sexy",
    "maid sexy",
    "nurse sexy",
  ],

  // Violence et contenu choquant
  violence: [
    "violence",
    "violent",
    "tuer",
    "kill",
    "mort",
    "death",
    "suicide",
    "meurtre",
    "murder",
    "assassinat",
    "torture",
    "mutilation",
    "sang",
    "blood",
    "gore",
    "cadavre",
    "corps",
    "weapon",
    "arme",
    "pistolet",
    "gun",
    "fusil",
    "couteau",
    "knife",
    "explosion",
    "bombe",
    "bomb",
    "terrorisme",
    "terrorist",
    "guerre",
    "war",
  ],

  // Drogues et substances
  drugs: [
    "drogue",
    "drug",
    "cocaïne",
    "cocaine",
    "héroïne",
    "heroin",
    "cannabis",
    "marijuana",
    "weed",
    "joint",
    "shit",
    "beuh",
    "mdma",
    "ecstasy",
    "lsd",
    "acid",
    "champignons hallucinogènes",
    "méthamphétamine",
    "crack",
    "opium",
    "fentanyl",
    "dealer",
    "narcotique",
    "narcotic",
    "sniff",
    "shoot",
    "injection",
  ],

  // Contenu haineux
  hate: [
    "nazi",
    "hitler",
    "holocaust",
    "génocide",
    "genocide",
    "kkk",
    "raciste",
    "racist",
    "nigger",
    "nègre",
    "youpin",
    "bougnoule",
    "terroriste",
    "terrorist",
    "kamikaze",
    "djihad",
    "jihad",
    "suprémaciste",
    "supremacist",
    "antisémite",
    "antisemitic",
  ],

  // Mineurs (protection)
  minors: [
    "enfant nu",
    "child nude",
    "mineur",
    "minor",
    "bébé nu",
    "baby nude",
    "adolescent nu",
    "teen nude",
    "schoolgirl nude",
    "young girl",
    "petite fille",
    "little girl",
    "jeune garçon",
    "little boy",
    "pédophile",
    "pedophile",
    "lolicon",
    "shotacon",
    "cp",
    "child porn",
    "underage",
    "mineur sexuel",
  ],
};

// Mots de remplacement suggérés
const REPLACEMENT_SUGGESTIONS = {
  sexy: "élégant, sophistiqué, stylé",
  nude: "portrait artistique, art classique",
  naked: "statue antique, art renaissance",
  érotique: "romantique, passionné",
  porn: "art photographique, beauté artistique",
  adult: "mature, professionnel",
  sex: "genre, romantique",
  seins: "portrait, buste artistique",
  violence: "action dramatique, scène épique",
  kill: "vaincre, surmonter",
  weapon: "objet historique, collection",
  drug: "médicament, herbes",
  nazi: "histoire, période historique",
  racist: "diversité, inclusion",
};

export class ContentModerator {
  private static instance: ContentModerator;

  private constructor() {}

  public static getInstance(): ContentModerator {
    if (!ContentModerator.instance) {
      ContentModerator.instance = new ContentModerator();
    }
    return ContentModerator.instance;
  }

  /**
   * Modère un prompt de génération d'image
   */
  public moderateImagePrompt(prompt: string): ModerationResult {
    const normalizedPrompt = this.normalizeText(prompt);

    // Vérification de chaque catégorie
    for (const [category, words] of Object.entries(BLOCKED_WORDS)) {
      const blockedWords = this.findBlockedWords(normalizedPrompt, words);

      if (blockedWords.length > 0) {
        return {
          isBlocked: true,
          reason: this.getCategoryReason(category),
          blockedWords,
          suggestion: this.generateSuggestion(prompt, blockedWords),
        };
      }
    }

    // Vérifications spéciales pour les combinaisons de mots
    if (this.hasInappropriateCombinations(normalizedPrompt)) {
      return {
        isBlocked: true,
        reason: "Combinaison de termes inappropriée détectée",
        suggestion:
          "Essayez de reformuler votre demande de manière plus appropriée",
      };
    }

    return { isBlocked: false };
  }

  /**
   * Modère un message de chat
   */
  public moderateChatMessage(message: string): ModerationResult {
    // Pour les messages de chat, on est moins strict
    const normalizedMessage = this.normalizeText(message);

    // Seulement les catégories les plus graves
    const strictCategories = ["minors", "hate", "violence"];

    for (const category of strictCategories) {
      const words = BLOCKED_WORDS[category as keyof typeof BLOCKED_WORDS];
      const blockedWords = this.findBlockedWords(normalizedMessage, words);

      if (blockedWords.length > 0) {
        return {
          isBlocked: true,
          reason: this.getCategoryReason(category),
          blockedWords,
        };
      }
    }

    return { isBlocked: false };
  }

  /**
   * Nettoie un prompt en supprimant/remplaçant les mots problématiques
   */
  public cleanPrompt(prompt: string): string {
    let cleanedPrompt = prompt;
    const normalizedPrompt = this.normalizeText(prompt);

    // Remplacement par des alternatives
    for (const [blockedWord, replacement] of Object.entries(
      REPLACEMENT_SUGGESTIONS,
    )) {
      const regex = new RegExp(`\\b${this.escapeRegex(blockedWord)}\\b`, "gi");
      if (normalizedPrompt.includes(blockedWord.toLowerCase())) {
        cleanedPrompt = cleanedPrompt.replace(regex, replacement);
      }
    }

    return cleanedPrompt;
  }

  /**
   * Normalise le texte pour la comparaison
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Supprime les accents
      .replace(/[^a-z0-9\s]/g, " ") // Remplace la ponctuation par des espaces
      .replace(/\s+/g, " ") // Normalise les espaces
      .trim();
  }

  /**
   * Trouve les mots bloqués dans un texte
   */
  private findBlockedWords(text: string, blockedWords: string[]): string[] {
    const found: string[] = [];

    for (const word of blockedWords) {
      const normalizedWord = this.normalizeText(word);

      // Recherche exacte et partielle
      if (
        text.includes(normalizedWord) ||
        this.fuzzyMatch(text, normalizedWord)
      ) {
        found.push(word);
      }
    }

    return found;
  }

  /**
   * Correspondance floue pour détecter les variantes
   */
  private fuzzyMatch(text: string, word: string): boolean {
    // Remplace certains caractères par des alternatives
    const variations = word
      .replace(/[e]/g, "[e3]")
      .replace(/[a]/g, "[a@4]")
      .replace(/[i]/g, "[i1!]")
      .replace(/[o]/g, "[o0]")
      .replace(/[s]/g, "[s5$]");

    const regex = new RegExp(`\\b${variations}\\b`, "i");
    return regex.test(text);
  }

  /**
   * Détecte les combinaisons inappropriées
   */
  private hasInappropriateCombinations(text: string): boolean {
    const inappropriateCombinations = [
      ["young", "girl"],
      ["little", "girl"],
      ["school", "uniform"],
      ["nurse", "costume"],
      ["maid", "outfit"],
      ["teen", "model"],
      ["child", "like"],
      ["baby", "face"],
      ["innocent", "look"],
    ];

    for (const [word1, word2] of inappropriateCombinations) {
      if (text.includes(word1) && text.includes(word2)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Génère un message d'explication par catégorie
   */
  private getCategoryReason(category: string): string {
    const reasons = {
      sexual: "Contenu à caractère sexuel détecté",
      violence: "Contenu violent détecté",
      drugs: "Référence à des substances illicites détectée",
      hate: "Contenu haineux ou discriminatoire détecté",
      minors: "Contenu inapproprié impliquant des mineurs détecté",
    };

    return (
      reasons[category as keyof typeof reasons] || "Contenu inapproprié détecté"
    );
  }

  /**
   * Génère une suggestion de remplacement
   */
  private generateSuggestion(
    originalPrompt: string,
    blockedWords: string[],
  ): string {
    const suggestions = [
      "Essayez de décrire votre image de manière plus artistique",
      "Reformulez votre demande en vous concentrant sur l'esthétique",
      "Décrivez plutôt le style, l'ambiance ou les couleurs souhaitées",
      "Pensez à une approche plus créative et artistique",
    ];

    // Suggestion spécifique si on a des remplacements
    const hasReplacements = blockedWords.some(
      (word) =>
        REPLACEMENT_SUGGESTIONS[word as keyof typeof REPLACEMENT_SUGGESTIONS],
    );

    if (hasReplacements) {
      const replacements = blockedWords
        .map(
          (word) =>
            REPLACEMENT_SUGGESTIONS[
              word as keyof typeof REPLACEMENT_SUGGESTIONS
            ],
        )
        .filter(Boolean)
        .join(", ");

      return `Essayez plutôt : ${replacements}`;
    }

    return suggestions[Math.floor(Math.random() * suggestions.length)];
  }

  /**
   * Échappe les caractères spéciaux pour regex
   */
  private escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  /**
   * Vérifie si un prompt semble sûr pour la génération d'images
   */
  public isImagePromptSafe(prompt: string): boolean {
    const moderation = this.moderateImagePrompt(prompt);
    return !moderation.isBlocked;
  }

  /**
   * Ajoute un prompt négatif de sécurité
   */
  public getSafetyNegativePrompt(): string {
    return "nsfw, nude, naked, sexual, porn, explicit, inappropriate, violence, blood, gore, drugs, hate speech, minor, child, underage, offensive, disturbing, harmful";
  }

  /**
   * Valide et nettoie un prompt pour la génération
   */
  public validateAndCleanImagePrompt(prompt: string): {
    isValid: boolean;
    cleanedPrompt?: string;
    error?: string;
    suggestion?: string;
  } {
    const moderation = this.moderateImagePrompt(prompt);

    if (moderation.isBlocked) {
      return {
        isValid: false,
        error: moderation.reason,
        suggestion: moderation.suggestion,
      };
    }

    const cleanedPrompt = this.cleanPrompt(prompt);

    return {
      isValid: true,
      cleanedPrompt: cleanedPrompt,
    };
  }
}

// Instance singleton
export const contentModerator = ContentModerator.getInstance();

// Utilitaires d'export
export { type ModerationResult };
export default contentModerator;
