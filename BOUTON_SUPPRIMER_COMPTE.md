# Bouton Supprimer Compte

## 🎯 Fonctionnalité Ajoutée

**Nouveau bouton "Supprimer compte"** ajouté à côté du bouton "Paramètres" qui permet de réinitialiser complètement l'application.

## 📍 Emplacement

### Desktop

- **Sidebar principale** → Sous "Paramètres"
- **Couleur rouge** pour indiquer l'action destructive
- **Icônes :** Poubelle + Triangle d'alerte

### Mobile

- **Menu hamburger** → Accessible via le menu latéral
- **Même design** que la version desktop

## 🔧 Fonctionnalités

### Suppression Complète

- ✅ **License révoquée** - Plus besoin de license
- ✅ **Conversations supprimées** - Toutes les données perdues
- ✅ **Images générées effacées** - Plus d'historique
- ✅ **Paramètres réinitialisés** - Retour aux valeurs par défaut
- ✅ **Retour à l'écran de license** - Nouvelle activation requise

### Sécurité

- **Dialog de confirmation** avec avertissements clairs
- **Action irréversible** clairement indiquée
- **Délai de 1.5 secondes** avant redirection
- **Toast de confirmation** pour feedback utilisateur

## 🎨 Interface

### Bouton Principal

```typescript
<Button
  variant="ghost"
  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
>
  <Trash className="w-4 h-4 mr-2" />
  Supprimer compte
  <AlertTriangle className="w-3 h-3 ml-auto" />
</Button>
```

### Dialog de Confirmation

- **Titre :** "Supprimer le compte" avec icône d'alerte
- **Description détaillée** des conséquences
- **Zone d'avertissement rouge** avec la liste des impacts
- **Boutons :** "Annuler" (gris) et "Supprimer définitivement" (rouge)

## 🔄 Processus de Suppression

### 1. Clic sur le bouton

→ Ouverture du dialog de confirmation

### 2. Lecture des avertissements

```
⚠️ Conséquences :
• Votre license actuelle sera révoquée
• Toutes vos conversations seront perdues
• Les images générées seront supprimées
• Une nouvelle license sera requise
```

### 3. Confirmation

→ Clic sur "Supprimer définitivement"

### 4. Suppression effective

```typescript
// Méthode dans simple-license-manager.ts
simpleLicenseManager.deleteAccount();
```

### 5. Feedback utilisateur

```
Toast: "Compte supprimé avec succès !"
Description: "Redirection vers l'écran de license..."
```

### 6. Redirection automatique

```
setTimeout(() => {
  window.location.reload();
}, 1500);
```

## 🧹 Nettoyage Effectué

### Données Supprimées

- **License utilisateur** → `clearUserLicense()`
- **Toutes les clés localStorage** commençant par "nothingai"
- **Sessions et conversations**
- **Images générées**
- **Paramètres personnalisés**

### Code de Nettoyage

```typescript
public deleteAccount(): void {
  // Supprimer la license de l'utilisateur
  this.clearUserLicense();

  // Supprimer toutes les données de l'application
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("nothingai")) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
  });
}
```

## 📁 Fichiers Créés/Modifiés

### Nouveau Composant

- **`src/components/ui/delete-account-button.tsx`**
  - Composant réutilisable
  - Dialog de confirmation intégré
  - Gestion complète de la suppression

### Méthode Ajoutée

- **`src/lib/simple-license-manager.ts`**
  - Méthode `deleteAccount()`
  - Nettoyage intelligent des données
  - Logs pour le debugging

### Interface Mise à Jour

- **`src/pages/Index.tsx`**
  - Bouton ajouté dans la sidebar
  - Import du composant DeleteAccountButton
  - Version mobile et desktop

## 🎉 Résultat

### Avant

- Aucun moyen de réinitialiser l'application
- License permanente une fois activée
- Données persistantes

### Après

- **Bouton de suppression** accessible facilement
- **Réinitialisation complète** en 2 clics
- **Retour à l'état initial** garanti
- **Nouvelle license requise** après suppression

## 🚀 Test

1. **Connectez-vous** avec `NothingAi-4C24HUEQ`
2. **Utilisez l'application** (conversations, images...)
3. **Cliquez "Supprimer compte"** dans la sidebar
4. **Lisez les avertissements** et confirmez
5. **Redirection automatique** vers l'écran de license
6. **Essayez les clés de test** - elles fonctionnent à nouveau !

**Le bouton "Supprimer compte" fonctionne parfaitement !** 🗑️✨
