# 🏗️ Générateur de Plan de Course V2.1 - Architecture Modulaire

## 🎯 Objectifs

Cette refonte permet de :
- ✅ **Modifier facilement** n'importe quelle partie sans tout régénérer
- ✅ **Déboguer rapidement** en isolant les problèmes
- ✅ **Étendre les fonctionnalités** sans casser le code existant
- ✅ **Maintenir le code** avec une séparation claire des responsabilités

---

## 📁 Structure des fichiers

```
plan-course-v2.1/
├── index.html                    # Structure HTML minimale
├── css/
│   └── styles.css               # Tous les styles CSS
├── js/
│   ├── config.js                # Configuration globale
│   ├── utils/
│   │   ├── dates.js            # Manipulation de dates
│   │   ├── formatters.js       # Formatage des données
│   │   └── storage.js          # Import/Export JSON
│   ├── core/
│   │   ├── vdot.js             # Calculs physiologiques
│   │   ├── progression.js      # Algorithme de progression
│   │   └── placement.js        # Placement intelligent
│   ├── sessions/
│   │   ├── beginner.js         # Bibliothèque débutant
│   │   ├── intermediate.js     # Bibliothèque intermédiaire
│   │   └── advanced.js         # Bibliothèque avancé
│   ├── ui/
│   │   ├── forms.js            # Gestion des formulaires
│   │   ├── render.js           # Affichage du plan
│   │   └── interactions.js     # Drag & drop, édition
│   └── app.js                   # Orchestration principale
└── README.md                     # Cette documentation
```

---

## 🔧 Responsabilités de chaque fichier

### **index.html**
- Structure HTML pure
- Chargement des scripts dans l'ordre
- Pas de logique JavaScript inline

### **css/styles.css**
- Tous les styles visuels
- Variables CSS pour faciliter les modifications
- Classes réutilisables

### **js/config.js**
- Constantes globales (version, dates, labels)
- Configuration des profils de coureur
- État global de l'application
- **Modifier ici** : labels, fréquence des tests, jours préférés

### **js/utils/dates.js**
- Formatage des dates
- Calculs de dates (prochain lundi, ajout de jours)
- **Modifier ici** : format d'affichage des dates

### **js/utils/formatters.js**
- Conversion temps ↔ secondes
- Formatage des allures, durées, distances
- **Modifier ici** : format des allures, unités

### **js/utils/storage.js**
- Export JSON avec métadonnées
- Import JSON avec validation
- localStorage optionnel
- **Modifier ici** : format d'export, nom des fichiers

### **js/core/vdot.js**
- Calcul VDOT (formule Jack Daniels)
- Calcul VMA
- Calcul des 6 allures d'entraînement
- Calcul TSS
- **Modifier ici** : formules physiologiques, pourcentages d'allures

### **js/core/progression.js**
- Calcul du kilométrage cible
- Génération des cycles 3/1
- Planification des tests
- Phases du plan (Fondation, Qualité, Pic, Affûtage)
- **Modifier ici** : progression hebdomadaire, cycles, durée des phases

### **js/core/placement.js**
- Logique de placement des séances
- Espacement intelligent
- Jours préférés par type de séance
- **Modifier ici** : règles de placement, priorités des jours

### **js/sessions/beginner.js**
- Bibliothèque de 9 séances débutant
- Échauffements/retours au calme adaptés
- **Modifier ici** : ajouter/modifier des séances débutant

### **js/sessions/intermediate.js**
- Bibliothèque de 12 séances intermédiaire
- Séances plus variées
- **Modifier ici** : ajouter/modifier des séances intermédiaire

### **js/sessions/advanced.js**
- Bibliothèque de 12 séances avancé
- Séances complexes (double seuil, pyramides)
- **Modifier ici** : ajouter/modifier des séances avancé

### **js/ui/forms.js**
- Initialisation des formulaires
- Gestion des événements (changement de dates, VDOT)
- Validation des entrées
- **Modifier ici** : valeurs par défaut, validation

### **js/ui/render.js**
- Affichage du plan généré
- Rendu des semaines et séances
- Graphique de charge
- **Modifier ici** : affichage visuel, organisation

### **js/ui/interactions.js**
- Drag & drop des séances
- Éditeur de séances
- Modals (Cooper, édition)
- **Modifier ici** : interactions utilisateur

### **js/app.js**
- Point d'entrée principal
- Orchestration de tous les modules
- Génération du plan complet
- **Modifier ici** : flux principal de l'application

---

## 🚀 Comment modifier le code

### Exemple 1 : Changer la fréquence des tests

**Fichier :** `js/config.js`

```javascript
// Passer de 6 à 4 semaines
testFrequency: 4,  // Au lieu de 6
```

**Effet :** Tests aux semaines 5, 9, 13, 17... au lieu de 5, 11, 17...

### Exemple 2 : Ajouter une nouvelle séance pour débutants

**Fichier :** `js/sessions/beginner.js`

```javascript
// Ajouter dans la phase "base"
base: [
    // ... séances existantes
    {
        type: 'Ma Nouvelle Séance',
        intensity: 3,
        reps: [4, 5, 6],
        duration: [5, 5, 5]
    }
]
```

**Effet :** La séance apparaîtra dans la rotation des débutants en phase de base

### Exemple 3 : Modifier le format d'affichage des dates

**Fichier :** `js/utils/dates.js`

```javascript
// Changer le format
format(date) {
    // Format actuel : JJ/MM/AA
    // Nouveau format : Lundi 10 janvier 2025
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
}
```

**Effet :** Toutes les dates s'afficheront avec le nouveau format

### Exemple 4 : Ajuster l'algorithme de progression

**Fichier :** `js/core/progression.js`

```javascript
// Modifier le taux maximum de croissance
generateWeekConfigs(weeks, currentKm, targetKm, profile, taperWeeks) {
    // ...
    // Limiter à 8% au lieu de 10%
    buildRate = Math.min(buildRate, 1.08);  // Au lieu de profile.buildRateMax
}
```

**Effet :** Progression plus prudente pour tous les niveaux

### Exemple 5 : Changer les couleurs du thème

**Fichier :** `css/styles.css`

```css
/* Passer d'un thème sombre à un thème clair */
body {
    background-color: #ffffff;  /* Au lieu de #0d1117 */
    color: #24292e;             /* Au lieu de #c9d1d9 */
}

.card {
    background-color: #f6f8fa;  /* Au lieu de #161b22 */
    border: 1px solid #d0d7de;  /* Au lieu de #30363d */
}
```

**Effet :** Interface en mode clair

---

## 🐛 Débogage facilité

### Problème : Les tests ne s'affichent pas

**Étapes :**
1. Ouvrir la console (F12)
2. Vérifier `js/core/progression.js` → fonction `generateWeekConfigs()`
3. Ajouter un `console.log` :
```javascript
configs.push({
    km: targetWeekKm,
    isTest: testWeeks.includes(i) && !isRecovery,
    isRecovery: isRecovery
});
console.log('Semaine', i+1, 'isTest:', testWeeks.includes(i) && !isRecovery);
```
4. Observer dans la console quelles semaines ont `isTest: true`

### Problème : Séances mal placées

**Étapes :**
1. Ouvrir `js/core/placement.js`
2. Ajouter des logs dans `placeHardSessions()` :
```javascript
console.log('Placement séance', session.type, 'jour', session.day);
```
3. Identifier quelle règle de placement échoue
4. Ajuster les priorités dans `CONFIG.preferredDays`

### Problème : Mauvais calcul d'allures

**Étapes :**
1. Ouvrir `js/core/vdot.js`
2. Ajouter un log dans `getTrainingPaces()` :
```javascript
console.log('VDOT:', vdot, 'Paces:', paces);
```
3. Vérifier que les pourcentages sont corrects
4. Comparer avec les tables de Daniels

---

## 📦 Ordre de chargement des scripts

⚠️ **IMPORTANT** : Respecter cet ordre dans `index.html` !

```html
<!-- 1. Configuration -->
<script src="js/config.js"></script>

<!-- 2. Utilitaires (pas de dépendances) -->
<script src="js/utils/dates.js"></script>
<script src="js/utils/formatters.js"></script>
<script src="js/utils/storage.js"></script>

<!-- 3. Core (dépend des utilitaires et config) -->
<script src="js/core/vdot.js"></script>
<script src="js/core/progression.js"></script>
<script src="js/core/placement.js"></script>

<!-- 4. Bibliothèques de séances (dépend de config) -->
<script src="js/sessions/beginner.js"></script>
<script src="js/sessions/intermediate.js"></script>
<script src="js/sessions/advanced.js"></script>

<!-- 5. UI (dépend de tout le reste) -->
<script src="js/ui/forms.js"></script>
<script src="js/ui/render.js"></script>
<script src="js/ui/interactions.js"></script>

<!-- 6. Application principale (orchestre tout) -->
<script src="js/app.js"></script>
```

---

## ✅ Avantages de l'architecture modulaire

### 1. **Maintenance simplifiée**
- Chaque fichier = une responsabilité
- Bugs faciles à localiser
- Tests unitaires possibles

### 2. **Extensibilité**
- Ajouter de nouvelles séances sans toucher au reste
- Créer de nouveaux niveaux facilement
- Ajouter des fonctionnalités (export PDF, sync Strava...)

### 3. **Collaboration**
- Plusieurs personnes peuvent travailler en parallèle
- Conflits Git minimisés
- Code review plus efficace

### 4. **Réutilisabilité**
- Modules indépendants réutilisables
- `VDOT.js` peut servir dans d'autres projets
- `Storage.js` est générique

### 5. **Performance**
- Chargement modulaire possible (lazy loading)
- Minification fichier par fichier
- Cache navigateur optimisé

---

## 🔄 Flux de données

```
┌─────────────┐
│ Formulaire  │
│  (forms.js) │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ Validation & VDOT   │
│  (vdot.js)          │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Calcul progression  │
│  (progression.js)   │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Sélection séances   │
│  (sessions/*.js)    │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Placement séances   │
│  (placement.js)     │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Génération plan     │
│  (app.js)           │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Affichage           │
│  (render.js)        │
└─────────────────────┘
```

---

## 📝 Conventions de code

### Nommage
- **Constantes :** `UPPER_SNAKE_CASE` (ex: `CONFIG`, `STATE`)
- **Objets modules :** `PascalCase` (ex: `VDOT`, `Placement`)
- **Fonctions :** `camelCase` (ex: `calculateVDOT`, `placeSession`)
- **Variables :** `camelCase` (ex: `weeklyKm`, `isTest`)

### Commentaires
- **En-tête de fichier :** Toujours indiquer le rôle
- **Fonctions publiques :** JSDoc avec description
- **Logique complexe :** Expliquer le "pourquoi"

### Structure des fonctions
```javascript
/**
 * Description de la fonction
 * @param {type} param - Description
 * @returns {type} Description
 */
functionName(param) {
    // 1. Validation
    if (!param) return null;
    
    // 2. Calculs
    const result = doSomething(param);
    
    // 3. Retour
    return result;
}
```

---

## 🚦 Tests suggérés

### Tests unitaires à implémenter

**vdot.js**
```javascript
// Test VDOT pour semi en 1h30
const vdot = VDOT.calculate(21.0975, 5400);
console.assert(vdot > 50 && vdot < 52, 'VDOT semi 1h30 incorrect');
```

**progression.js**
```javascript
// Test progression sur 16 semaines
const configs = Progression.generateWeekConfigs(16, 30, 60, CONFIG.profiles.intermediate, 2);
console.assert(configs.length === 16, 'Nombre de semaines incorrect');
console.assert(configs[5].isTest === true, 'Test semaine 6 manquant');
```

**placement.js**
```javascript
// Test placement séance VMA
const placed = Placement.placeSession(
    {type: 'VMA', intensity: 4},
    1, // Lundi
    [1, 2, 3, 4, 5, 6],
    new Set(),
    []
);
console.assert(placed === true, 'Placement VMA lundi échoué');
```

---

## 🎓 Pour aller plus loin

### Améliorations suggérées

**1. TypeScript**
- Typage fort pour éviter les erreurs
- Autocomplétion améliorée
- Documentation automatique

**2. Tests automatisés**
- Jest ou Mocha
- Tests unitaires pour chaque module
- CI/CD avec GitHub Actions

**3. Build system**
- Webpack ou Vite
- Minification automatique
- Hot reload en développement

**4. Framework UI**
- React ou Vue.js
- Composants réutilisables
- State management (Redux/Vuex)

**5. Backend**
- API REST pour sauvegarder les plans
- Base de données (PostgreSQL)
- Authentification utilisateur

---

## 📞 Support

Pour toute question sur l'architecture :
1. Consulter ce README
2. Lire les commentaires dans le code
3. Utiliser la console développeur (F12)

---

**Version 2.1.0 - Build 2025-01-10**  
**Architecture modulaire par Claude (Anthropic)**
    //
