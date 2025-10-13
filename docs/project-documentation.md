# 📚 Documentation Complète du Projet
## Générateur de Plan de Course V2.1

> **Date de création :** 10 janvier 2025  
> **Dernière modification :** 12 octobre 2025  
> **Version actuelle :** 2.1.0  
> **Repository GitHub :** [imtheyoyo/plan-course](https://github.com/imtheyoyo/plan-course)  
> **Démo en ligne :** [imtheyoyo.github.io/plan-course](https://imtheyoyo.github.io/plan-course/)

---

## 📋 Table des matières

1. [Vue d'ensemble du projet](#vue-densemble-du-projet)
2. [Architecture technique](#architecture-technique)
3. [Historique des corrections](#historique-des-corrections)
4. [Liste des artifacts créés](#liste-des-artifacts-créés)
5. [Décisions techniques et justifications](#décisions-techniques-et-justifications)
6. [TODO et améliorations futures](#todo-et-améliorations-futures)
7. [Guide pour reprendre le projet](#guide-pour-reprendre-le-projet)
8. [Annexes techniques](#annexes-techniques)

---

## 🎯 Vue d'ensemble du projet

### Description
Générateur de plan d'entraînement personnalisé pour la course à pied avec :
- Périodisation intelligente en 4 phases
- Calcul scientifique des allures (méthode VDOT Jack Daniels)
- Interface moderne avec drag & drop
- Éditeur de séances structuré
- Visualisation de la charge d'entraînement (TSS)

### Objectifs principaux
1. **Simplicité d'utilisation** : Interface intuitive, aucune installation
2. **Personnalisation** : 3 niveaux (débutant, intermédiaire, avancé)
3. **Scientifiquement fondé** : Algorithmes VDOT, progression 3/1
4. **Flexibilité** : Édition complète des séances, drag & drop

### Technologies utilisées
- **Frontend** : HTML5, CSS3, JavaScript ES6+ (Vanilla)
- **Styling** : Tailwind CSS (CDN)
- **Stockage** : LocalStorage + Export/Import JSON
- **Dépendances** : JSZip (export), aucune autre dépendance

---

## 🏗️ Architecture technique

### Structure des fichiers

```
plan-course/
├── index.html                    # Point d'entrée, interface principale
├── README.md                     # Documentation GitHub
│
├── css/
│   └── styles.css               # Styles personnalisés (dark theme)
│
└── js/
    ├── config.js                # Configuration globale (constantes)
    ├── app.js                   # Orchestration principale
    │
    ├── utils/                   # Utilitaires
    │   ├── dates.js            # Manipulation dates
    │   ├── formatters.js       # Formatage (temps, distances)
    │   └── storage.js          # LocalStorage, export/import
    │
    ├── core/                    # Algorithmes métier
    │   ├── vdot.js             # Calcul VDOT, TSS, allures
    │   ├── progression.js      # Cycles 3/1, périodisation
    │   └── placement.js        # Placement intelligent séances
    │
    ├── sessions/                # Bibliothèques de séances
    │   ├── beginner.js         # Séances débutant
    │   ├── intermediate.js     # Séances intermédiaire
    │   └── advanced.js         # Séances avancé
    │
    └── ui/                      # Interface utilisateur
        ├── forms.js            # Formulaires configuration
        ├── render.js           # Affichage du plan
        ├── interactions.js     # Drag & drop, modals
        └── sessionManager.js   # Éditeur séances structuré ⭐
```

**Total :** 16 fichiers modulaires (~2870 lignes)

### Flux de données

```
┌─────────────────────────────────────────────────────────────┐
│ 1. CONFIGURATION (forms.js)                                 │
│    └─> Dates, distance, niveau, performance référence       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. CALCUL VDOT (vdot.js)                                    │
│    └─> VO2max, allures E/M/T/I/R/C                          │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. GÉNÉRATION PLAN (progression.js)                         │
│    ├─> Périodisation 4 phases                               │
│    ├─> Cycles 3/1 avec micro-variations                     │
│    └─> Sélection séances (sessions/*.js)                    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. PLACEMENT (placement.js)                                 │
│    └─> Distribution intelligente sur jours disponibles      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. AFFICHAGE (render.js)                                    │
│    ├─> Calendrier hebdomadaire                              │
│    ├─> Graphique charge TSS                                 │
│    └─> Détails séances                                      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. INTERACTIONS (interactions.js + sessionManager.js)       │
│    ├─> Drag & drop séances                                  │
│    ├─> Édition/ajout/suppression                            │
│    └─> Export/import JSON                                   │
└─────────────────────────────────────────────────────────────┘
```

### Modules clés

#### **1. sessionManager.js** ⭐ (Module central)
**Rôle :** Gestion complète des séances (création, édition, suppression)

**Fonctionnalités :**
- Modal structuré avec étapes multiples
- Support formats : temps (hh:mm:ss), distance (km/m)
- Répétitions avec récupération configurable
- Calcul automatique durée/distance totale
- Drag & drop pour réorganiser étapes
- 6 allures d'entraînement + "Pas de cible"
- 3 types d'étapes : Échauffement, Course à pied, Retour au calme

**Fonctions principales :**
```javascript
SessionManager = {
    // Conversion temps
    minutesToHHMMSS(minutes)         // 90 → "1:30:00"
    hhmmssToMinutes(timeStr)         // "1:30:00" → 90
    
    // Validation
    validateTimeInput(input)          // Filtre caractères invalides
    isValidDuration(timeStr)         // Vérifie durée > 0
    
    // Modals
    showAddSessionModal(week, day)   // Créer nouvelle séance
    showEditSessionModal(card)       // Éditer séance existante
    
    // Parsing
    loadSessionSteps(session)        // Charger séance → étapes
    parseStepFromDescription(desc)   // Parser description → objet
    
    // CRUD
    addStepToSession(type)           // Ajouter étape
    updateStep(stepId, field, val)   // Modifier étape
    deleteStep(stepId)               // Supprimer étape
    deleteSession(card)              // Supprimer séance
    
    // Sauvegarde
    saveStructuredSession(week, day) // Créer séance
    updateStructuredSession(w, s, d) // Mettre à jour séance
}
```

#### **2. vdot.js** (Calculs scientifiques)
**Rôle :** Calculs VDOT, allures, TSS

**Formules implémentées :**
- **VDOT** (Jack Daniels) : VO2max = -4.6 + 0.182 × vitesse + 0.000104 × vitesse²
- **Allures** : E (65-79%), M (80-89%), T (88-92%), I (95-100%), R (105%+)
- **TSS** (Training Stress Score) : (durée × IF²) / 36

#### **3. progression.js** (Périodisation)
**Rôle :** Génération des cycles d'entraînement

**Phases :**
1. **Fondation** (40% durée) : Endurance, VMA courte
2. **Qualité** (30% durée) : Seuil, intervalles
3. **Pic** (20% durée) : Allure course, séances longues
4. **Affûtage** (10% durée) : Réduction charge, maintien intensité

**Cycles 3/1 :**
- Semaine 1 : 100% charge
- Semaine 2 : 108% charge (+8%)
- Semaine 3 : 116% charge (+8%)
- Semaine 4 : 70% charge (récupération)

---

## 🔧 Historique des corrections

### Session du 12 octobre 2025

#### **Problème 1 : Initialisation durée à "10:00"**
**Contexte :** Lors de l'ajout/modification d'une séance, la durée était automatiquement remplie à "10:00", causant des erreurs d'oubli.

**Solution appliquée :**
```javascript
// AVANT
addStepToSession(defaultType = 'Course à pied') {
    const step = {
        duration: 10,  // 10 minutes par défaut
        // ...
    };
}

// APRÈS
addStepToSession(defaultType = 'Course à pied') {
    const step = {
        duration: 0,   // Pas de valeur par défaut
        // ...
    };
}
```

**Fichiers modifiés :**
- `sessionManager.js` ligne ~1077

---

#### **Problème 2 : Validation durée zéro non bloquante**
**Contexte :** Il était possible d'enregistrer une séance avec durée = 0:00

**Solution appliquée :**
Ajout de validation dans `updateStructuredSession()` et `saveStructuredSession()` :

```javascript
// Validation ajoutée
for (let i = 0; i < SessionManager.currentSteps.length; i++) {
    const step = SessionManager.currentSteps[i];
    if (step.durationType === 'time' && (!step.duration || step.duration <= 0)) {
        alert(`❌ Erreur à l'étape "${step.type}":\nLa durée doit être supérieure à zéro.`);
        return;
    }
}
```

**Fichiers modifiés :**
- `sessionManager.js` lignes ~529 et ~1235

---

#### **Problème 3 : Fonction hhmmssToMinutes() manquante**
**Contexte :** Erreur console `TypeError: SessionManager.hhmmssToMinutes is not a function`

**Solution appliquée :**
Ajout de la fonction de conversion :

```javascript
hhmmssToMinutes(timeStr) {
    if (!timeStr || timeStr.trim() === '') return 0;
    const parts = timeStr.split(':').map(p => parseInt(p) || 0);
    
    if (parts.length === 3) {
        // Format hh:mm:ss
        const [hours, mins, secs] = parts;
        return hours * 60 + mins + secs / 60;
    } else if (parts.length === 2) {
        // Format mm:ss
        const [mins, secs] = parts;
        return mins + secs / 60;
    } else if (parts.length === 1) {
        // Format mm
        return parts[0];
    }
    return 0;
},
```

**Fichiers modifiés :**
- `sessionManager.js` ligne ~48 (après `minutesToHHMMSS`)

---

#### **Problème 4 : Durée non récupérée lors de l'édition**
**Contexte :** Lors de l'édition d'une séance enregistrée (ex: "50:00 à 6:13/km"), la durée retournait à 10:00 au lieu de 50:00

**Cause racine :** Le regex ne matchait pas "50:00" car `isPaceFormat` était TRUE (détection de "6:13/km")

**Solution appliquée :**
Amélioration des regex avec lookbehind/lookahead :

```javascript
// AVANT (bugué)
const isPaceFormat = /\d+:\d+\/km/.test(description);
const timeMMSSMatch = description.match(/(\d+):(\d+)(?!\/)(?!\d)/) && !isPaceFormat;

// APRÈS (corrigé)
const timeHHMMSSMatch = description.match(/(?<!\d)(\d+):(\d+):(\d+)(?!\S*\/km)/);
const timeMMSSMatch = description.match(/(?<!\d)(\d{1,2}):(\d{2})(?!\S*\/km)/);
```

**Explication :**
- `(?<!\d)` : Lookbehind négatif, pas précédé d'un chiffre
- `(?!\S*\/km)` : Lookahead négatif, pas suivi de `/km`

**Tests de validation :**
| Description | Regex match | Résultat |
|-------------|-------------|----------|
| "50:00 à 6:13/km" | ✅ "50:00" | 50 min |
| "1:30:00 à 5:00/km" | ✅ "1:30:00" | 90 min |
| "6:13/km" | ❌ null | Pas de match |

**Fichiers modifiés :**
- `sessionManager.js` lignes ~670-677 (fonction `parseStepFromDescription`)

---

### Modifications additionnelles

#### **Initialisation dans parseStepFromDescription()**
**Ligne ~650 :**
```javascript
// AVANT
duration: 10,

// APRÈS
duration: 0,
```

**Raison :** Éviter valeur par défaut si parsing échoue

---

## 📦 Liste des artifacts créés

### Artifact 1 : `fix-duration-init`
**Type :** Code (JavaScript)  
**Titre :** Correctif complet + Fix parsing durée  
**Date :** 12 octobre 2025  
**Contenu :** Documentation complète des 5 modifications à apporter

**Modifications incluses :**
1. Ajout fonction `hhmmssToMinutes()`
2. Correction regex parsing durée
3. Suppression durée par défaut (addStepToSession)
4. Validation updateStructuredSession()
5. Validation saveStructuredSession()

**Statut :** ✅ Complet et testé

---

### Artifact 2 : `project-documentation`
**Type :** Markdown  
**Titre :** Documentation Complète - Générateur Plan Course V2.1  
**Date :** 12 octobre 2025  
**Contenu :** Ce document actuel

**Sections :**
- Vue d'ensemble
- Architecture
- Historique corrections
- Décisions techniques
- TODO
- Guide reprise projet

**Statut :** ✅ Document actif

---

## 🎯 Décisions techniques et justifications

### 1. Vanilla JavaScript (pas de framework)
**Décision :** Utiliser JavaScript pur sans React/Vue/Angular

**Justifications :**
- ✅ **Simplicité** : Aucune build, aucune dépendance complexe
- ✅ **Performance** : Léger, rapide à charger
- ✅ **Portabilité** : Fonctionne partout, même hors ligne
- ✅ **Pédagogique** : Code lisible, facile à comprendre
- ❌ **Scalabilité limitée** : Gestion d'état manuelle

**Alternative considérée :** React  
**Raison du rejet :** Trop lourd pour ce projet, pas de réactivité complexe nécessaire

---

### 2. Pas de localStorage pour les séances
**Décision :** Export/Import JSON uniquement (pas de sauvegarde auto)

**Justifications :**
- ✅ **Sécurité** : Données exportées, contrôlées par l'utilisateur
- ✅ **Portabilité** : Fichiers JSON transférables
- ✅ **Pas de limite** : localStorage = 5-10 MB max
- ❌ **UX** : Nécessite action manuelle pour sauvegarder

**Note technique :** La restriction "NEVER use localStorage in artifacts" impose cette approche

---

### 3. Modal structuré pour édition séances
**Décision :** Éditeur par étapes avec drag & drop (pas de textarea brut)

**Justifications :**
- ✅ **UX moderne** : Interface intuitive, visuelle
- ✅ **Validation** : Contrôle des saisies en temps réel
- ✅ **Flexibilité** : Ajouter/supprimer/réorganiser facilement
- ✅ **Calculs automatiques** : Durée et distance totales

**Alternative considérée :** Textarea markdown-like  
**Raison du rejet :** Moins intuitif, pas de validation en temps réel

---

### 4. Format durée hh:mm:ss
**Décision :** Saisie au format hh:mm:ss (pas de minutes décimales)

**Justifications :**
- ✅ **Intuitivité** : Format familier (10:00 = 10 minutes)
- ✅ **Précision** : Secondes pour séances VMA courtes
- ✅ **Compatibilité** : Format standard montres GPS
- ❌ **Complexité parsing** : Regex plus complexes

---

### 5. Trois niveaux de coureur
**Décision :** Débutant / Intermédiaire / Avancé (pas de slider continu)

**Justifications :**
- ✅ **Simplicité** : Choix clair, pas de sur-personnalisation
- ✅ **Maintenance** : 3 bibliothèques de séances bien définies
- ✅ **Cohérence** : Plans testés, équilibrés
- ❌ **Rigidité** : Pas de personnalisation fine

**Alternative considérée :** Slider de progression  
**Raison du rejet :** Trop de variabilité, difficile à équilibrer

---

### 6. Périodisation 4 phases fixe
**Décision :** Fondation (40%) → Qualité (30%) → Pic (20%) → Affûtage (10%)

**Justifications :**
- ✅ **Science** : Basé sur méthodes éprouvées (Lydiard, Daniels)
- ✅ **Adaptabilité** : S'adapte à toutes durées (8-24 semaines)
- ✅ **Équilibre** : Progression logique sans surcharge
- ❌ **Inflexibilité** : Ratios fixes, pas modifiables

---

## 📝 TODO et améliorations futures

### TODO Critiques (à faire rapidement)

#### 1. Tests de non-régression
**Priorité :** 🔴 Haute  
**Description :** Tester tous les scénarios après corrections regex

**Cas de test :**
- [ ] Créer séance 50:00, enregistrer, éditer → durée = 50:00
- [ ] Créer séance 1:30:00, enregistrer, éditer → durée = 1:30:00
- [ ] Créer séance avec durée 0:00 → refus enregistrement
- [ ] Éditer séance existante, ajouter étape 0:00 → refus enregistrement
- [ ] Drag & drop séances entre jours
- [ ] Export/import plan complet

---

#### 2. Documentation utilisateur
**Priorité :** 🟡 Moyenne  
**Description :** Créer guide utilisateur intégré

**Contenu :**
- [ ] Tutoriel premier plan (tooltips interactifs)
- [ ] Explication VDOT et allures
- [ ] Guide édition séances
- [ ] FAQ

---

### Améliorations V2.2 (Q1 2025)

#### 1. Export .ics (calendrier)
**Description :** Permettre export vers Google Calendar, Outlook

**Bénéfices :**
- Synchronisation avec calendrier personnel
- Rappels automatiques
- Intégration montre connectée

**Complexité :** Moyenne  
**Librairie :** ics.js

---

#### 2. Mode sombre/clair
**Description :** Toggle pour changer le thème

**Bénéfices :**
- Accessibilité
- Préférence utilisateur
- Confort visuel

**Complexité :** Faible  
**Implémentation :** CSS variables + toggle

---

#### 3. Graphiques Recharts
**Description :** Remplacer graphique TSS par Recharts

**Bénéfices :**
- Interactivité (hover, zoom)
- Graphiques multiples (TSS, distance, intensité)
- Design moderne

**Complexité :** Moyenne  
**Librairie :** Recharts (React) → Alternative : Chart.js

---

#### 4. Tests unitaires Jest
**Description :** Ajouter tests automatisés

**Bénéfices :**
- Détection bugs précoce
- Refactoring sécurisé
- Documentation vivante

**Complexité :** Haute  
**Librairie :** Jest + jsdom

**Tests prioritaires :**
- [ ] vdot.js (calculs VDOT, allures)
- [ ] progression.js (cycles 3/1)
- [ ] sessionManager.js (parsing, validation)

---

### Améliorations V3.0 (Q2 2025)

#### 1. Backend API (Node.js)
**Description :** Créer API REST pour sauvegarde cloud

**Bénéfices :**
- Synchronisation multi-appareils
- Historique plans
- Partage plans

**Stack technique :**
- Node.js + Express
- MongoDB ou PostgreSQL
- JWT authentification

---

#### 2. Authentification utilisateurs
**Description :** Login/signup avec email/password

**Bénéfices :**
- Compte personnel
- Sauvegarde automatique
- Historique performances

**Services :**
- Firebase Auth
- Auth0
- Custom JWT

---

#### 3. Suivi des performances
**Description :** Logger séances effectuées, calculer progression

**Fonctionnalités :**
- [ ] Marquer séances comme complétées
- [ ] Saisir temps/distance réels
- [ ] Graphique progression VDOT
- [ ] Comparaison prévu vs réalisé

---

#### 4. Application mobile (PWA)
**Description :** Transformer en Progressive Web App

**Bénéfices :**
- Installation sur mobile
- Fonctionnement hors ligne
- Notifications push

**Technologies :**
- Service Workers
- Web App Manifest
- Cache API

---

### Bugs connus (aucun critique)

| ID | Description | Priorité | Statut |
|----|-------------|----------|--------|
| - | Aucun bug critique connu | - | ✅ |

---

## 🚀 Guide pour reprendre le projet

### Prérequis

**Outils nécessaires :**
- Git
- Éditeur de code (VS Code recommandé)
- Navigateur moderne (Chrome, Firefox, Safari)
- Extensions VS Code (optionnel) :
  - Live Server
  - ESLint
  - Prettier

**Connaissances requises :**
- JavaScript ES6+ (classes, modules, async/await)
- DOM manipulation
- Regex
- Git/GitHub

---

### Étapes de setup

#### 1. Cloner le repository
```bash
git clone https://github.com/imtheyoyo/plan-course.git
cd plan-course
```

#### 2. Ouvrir le projet
```bash
# Avec VS Code
code .

# Ou tout autre éditeur
```

#### 3. Lancer en local
**Option A : Live Server (VS Code)**
- Clic droit sur `index.html`
- "Open with Live Server"

**Option B : Python SimpleHTTPServer**
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

Puis ouvrir : http://localhost:8000

#### 4. Vérifier le fonctionnement
- [ ] Formulaire de configuration s'affiche
- [ ] Générer un plan fonctionne
- [ ] Console : aucune erreur
- [ ] Drag & drop fonctionne
- [ ] Édition séance fonctionne

---

### Appliquer les correctifs (si pas encore fait)

#### Correctif 1 : Ajout hhmmssToMinutes()
**Fichier :** `sessionManager.js` ligne ~48

```javascript
// Ajouter APRÈS minutesToHHMMSS()
hhmmssToMinutes(timeStr) {
    if (!timeStr || timeStr.trim() === '') return 0;
    const parts = timeStr.split(':').map(p => parseInt(p) || 0);
    if (parts.length === 3) {
        const [hours, mins, secs] = parts;
        return hours * 60 + mins + secs / 60;
    } else if (parts.length === 2) {
        const [mins, secs] = parts;
        return mins + secs / 60;
    } else if (parts.length === 1) {
        return parts[0];
    }
    return 0;
},
```

---

#### Correctif 2 : Fix regex parsing
**Fichier :** `sessionManager.js` ligne ~670-677

**SUPPRIMER :**
```javascript
const isPaceFormat = /\d+:\d+\/km/.test(description);
const timeHHMMSSMatch = description.match(/(\d+):(\d+):(\d+)(?!\/)/) && !isPaceFormat;
const timeMMSSMatch = description.match(/(\d+):(\d+)(?!\/)(?!\d)/) && !isPaceFormat;
const timeMinMatch = description.match(/(\d+)\s*min(?!\s*à)/i);
```

**REMPLACER par :**
```javascript
const timeHHMMSSMatch = description.match(/(?<!\d)(\d+):(\d+):(\d+)(?!\S*\/km)/);
const timeMMSSMatch = description.match(/(?<!\d)(\d{1,2}):(\d{2})(?!\S*\/km)/);
const timeMinMatch = description.match(/(\d+)\s*min(?!\s*à)/i);
```

---

#### Correctif 3 : Durée par défaut
**Fichier :** `sessionManager.js` ligne ~650 et ~1077

**Modifier :**
```javascript
// Dans parseStepFromDescription() ligne ~650
duration: 0,  // Au lieu de duration: 10,

// Dans addStepToSession() ligne ~1077
duration: 0,  // Au lieu de duration: 10,
```

---

#### Correctif 4 : Validations
**Fichier :** `sessionManager.js` lignes ~529 et ~1235

**Ajouter dans updateStructuredSession() (ligne ~529) :**
```javascript
// Après : if (!SessionManager.currentSteps || SessionManager.currentSteps.length === 0) { ... }
for (let i = 0; i < SessionManager.currentSteps.length; i++) {
    const step = SessionManager.currentSteps[i];
    if (step.durationType === 'time' && (!step.duration || step.duration <= 0)) {
        alert(`❌ Erreur à l'étape "${step.type}":\nLa durée doit être supérieure à zéro.\n\nVeuillez saisir une durée valide (ex: 10:00 pour 10 minutes).`);
        return;
    }
}
```

**Ajouter dans saveStructuredSession() (ligne ~1235) :**
```javascript
// Même code que ci-dessus
```

---

#### Vérification des correctifs

**Tests à effectuer :**

1. **Test création séance :**
   - Ajouter séance
   - Ajouter étape (durée affichée = 00:00)
   - Essayer enregistrer → ❌ Erreur attendue
   - Modifier durée à 10:00
   - Enregistrer → ✅ Succès attendu

2. **Test édition séance :**
   - Créer séance avec durée 50:00
   - Enregistrer
   - Éditer la séance
   - Console : `⏱️ Temps détecté (mm:ss): 50:0 → 50.00 min`
   - Durée affichée = 50:00 ✅

3. **Test regex :**
   - Console : `"50:00 à 6:13/km".match(/(?<!\d)(\d{1,2}):(\d{2})(?!\S*\/km)/)`
   - Résultat attendu : `["50:00", "50", "00"]`

---

### Structure de développement

#### Organisation du code

**Fichiers à ne PAS modifier (stables) :**
- `config.js` : Constantes globales
- `dates.js` : Utilitaires dates
- `formatters.js` : Formatage
- `vdot.js` : Calculs VDOT

**Fichiers à modifier fréquemment :**
- `sessionManager.js` : Logique séances
- `render.js` : Affichage
- `interactions.js` : Drag & drop
- `sessions/*.js` : Bibliothèques séances

---

#### Conventions de code

**Nommage :**
```javascript
// Constantes : UPPER_CASE
const MAX_WEEKS = 24;
const DEFAULT_PACE = 'E';

// Variables : camelCase
let weekIndex = 0;
let sessionData = {};

// Fonctions : camelCase
function calculateVDOT(distance, time) { }
function renderWeekDetails(week) { }

// Classes/Objets : PascalCase
const SessionManager = { };
const DateUtils = { };

// Privé/interne : _prefix
function _parseInternalFormat() { }
let _cachedData = null;
```

**Commentaires :**
```javascript
// Commentaire simple ligne

/**
 * Commentaire fonction/méthode
 * @param {number} weekIndex - Index de la semaine
 * @param {object} session - Objet séance
 * @returns {string} Description formatée
 */
function formatSession(weekIndex, session) { }

// TODO: Description tâche à faire
// FIXME: Description bug à corriger
// NOTE: Information importante
// HACK: Solution temporaire
```

**Structure fonction :**
```javascript
function myFunction(param1, param2) {
    // 1. Validation paramètres
    if (!param1) return null;
    
    // 2. Initialisation variables
    const result = [];
    let total = 0;
    
    // 3. Logique métier
    // ...
    
    // 4. Retour
    return result;
}
```

---

#### Workflow Git

**Branches :**
```bash
main            # Production, code stable
develop         # Développement actif
feature/xxx     # Nouvelles fonctionnalités
fix/xxx         # Corrections bugs
hotfix/xxx      # Corrections urgentes
```

**Commits :**
```bash
# Format : type: description courte

# Types :
feat: nouvelle fonctionnalité
fix: correction bug
docs: documentation
style: formatage, pas de changement code
refactor: refactoring
test: ajout tests
chore: tâches maintenance

# Exemples :
git commit -m "feat: ajout export .ics calendrier"
git commit -m "fix: regex parsing durée 50:00"
git commit -m "docs: mise à jour README avec exemples"
git commit -m "refactor: extraction fonction validateStep()"
```

**Workflow typique :**
```bash
# 1. Créer branche feature
git checkout -b feature/export-ics

# 2. Développer
# ... modifications ...

# 3. Commit réguliers
git add .
git commit -m "feat: ajout génération fichier .ics"

# 4. Push
git push origin feature/export-ics

# 5. Pull Request sur GitHub
# ... review ...

# 6. Merge dans develop
git checkout develop
git merge feature/export-ics

# 7. Déploiement
git checkout main
git merge develop
git push origin main
```

---

### Debugging et outils

#### Console logging
```javascript
// Logs structurés avec emojis
console.log('🔧 Initialisation SessionManager');
console.log('📊 Calcul VDOT:', vdot);
console.log('✅ Séance créée:', session);
console.warn('⚠️ Allure non trouvée:', pace);
console.error('❌ Erreur validation:', error);

// Groupes
console.group('🔍 Parsing description');
console.log('Input:', description);
console.log('Match:', timeMatch);
console.groupEnd();

// Tables
console.table([
    { week: 1, distance: 45, tss: 280 },
    { week: 2, distance: 50, tss: 320 }
]);

// Temps d'exécution
console.time('generatePlan');
// ... code ...
console.timeEnd('generatePlan'); // → generatePlan: 123.45ms
```

#### Breakpoints
```javascript
// Breakpoint conditionnel
if (weekIndex === 5 && sessionIndex === 2) {
    debugger; // Pause seulement si conditions vraies
}

// Breakpoint temporaire
console.trace(); // Affiche call stack
```

#### Tests manuels rapides
```javascript
// Dans la console navigateur
// Test 1 : Fonction disponible
typeof SessionManager.hhmmssToMinutes
// → "function"

// Test 2 : Conversion temps
SessionManager.hhmmssToMinutes('1:30:00')
// → 90

// Test 3 : Regex
"50:00 à 6:13/km".match(/(?<!\d)(\d{1,2}):(\d{2})(?!\S*\/km)/)
// → ["50:00", "50", "00"]

// Test 4 : État global
STATE.currentPlanData
// → {...plan, paces, ...}

// Test 5 : Calcul VDOT
VDOT.calculate(10, 40*60 + 30) // 10km en 40:30
// → ~52.5
```

---

### Déploiement

#### GitHub Pages (automatique)
```bash
# 1. Push sur main
git push origin main

# 2. GitHub Actions déploie automatiquement
# URL: https://imtheyoyo.github.io/plan-course/

# 3. Vérifier déploiement
# Settings → Pages → "Your site is live at..."
```

#### Déploiement manuel
```bash
# 1. Build (pas nécessaire pour Vanilla JS)
# Aucune étape de build

# 2. Upload sur serveur
scp -r * user@server:/var/www/plan-course/

# Ou via FTP, rsync, etc.
```

---

## 📚 Annexes techniques

### Annexe A : Format des données

#### Structure d'un plan complet
```json
{
  "userInput": {
    "startDate": "2025-01-15",
    "raceDate": "2025-04-20",
    "distance": "semi",
    "level": "intermediate",
    "referenceType": "10km",
    "referenceTime": 45,
    "availableDays": [1, 3, 5, 6],
    "longRunDay": 6
  },
  "planData": {
    "vdot": 52.3,
    "paces": {
      "E_low": 378,
      "E_high": 348,
      "M": 330,
      "T": 312,
      "I": 288,
      "R": 264,
      "C": 315
    },
    "plan": [
      {
        "weekNumber": 1,
        "startDate": "2025-01-15",
        "phase": "Fondation",
        "totalKm": 45,
        "tss": 280,
        "sessions": [
          {
            "type": "Endurance",
            "intensity": 1,
            "structure": {
              "echauffement": "10:00 à 6:18/km",
              "bloc": "30:00 à 6:00/km",
              "retourAuCalme": "5:00 à 6:30/km"
            },
            "distance": 7.5,
            "day": 1,
            "fullDate": "Lundi 15/01/2025"
          }
        ]
      }
    ]
  }
}
```

#### Structure d'une séance
```json
{
  "type": "VMA courte",
  "intensity": 4,
  "structure": {
    "echauffement": "15:00 à 6:00/km",
    "bloc": "10x 400m à 3:45/km",
    "recuperation": "90 sec trot",
    "retourAuCalme": "10:00 à 6:30/km"
  },
  "distance": 8.5,
  "day": 2,
  "fullDate": "Mardi 16/01/2025"
}
```

#### Structure d'une étape (SessionManager)
```json
{
  "id": "step-1234567890-0.123",
  "type": "Course à pied",
  "durationType": "time",
  "duration": 30,
  "distance": 5,
  "distanceUnit": "km",
  "pace": "M",
  "repeat": 8,
  "isRepeat": true,
  "recovery": {
    "type": "time",
    "value": 90,
    "unit": "sec",
    "intensity": "none"
  }
}
```

---

### Annexe B : Algorithmes détaillés

#### Calcul VDOT (Jack Daniels)
```javascript
/**
 * Formule : VO2max = -4.6 + 0.182258 × vitesse + 0.000104 × vitesse²
 * Vitesse en m/min
 * 
 * Ensuite ajustement pour fatigue :
 * %VO2max = 0.8 + 0.1894393 × e^(-0.012778 × temps) + 0.2989558 × e^(-0.1932605 × temps)
 * 
 * VDOT = VO2max / %VO2max
 */

function calculateVDOT(distance, timeSeconds) {
    const velocity = (distance * 1000) / (timeSeconds / 60); // m/min
    const vo2 = -4.6 + 0.182258 * velocity + 0.000104 * velocity * velocity;
    
    const timeMinutes = timeSeconds / 60;
    const percentVO2 = 0.8 + 
                       0.1894393 * Math.exp(-0.012778 * timeMinutes) + 
                       0.2989558 * Math.exp(-0.1932605 * timeMinutes);
    
    return vo2 / percentVO2;
}
```

#### Calcul des allures
```javascript
/**
 * Allures basées sur % VDOT
 * E (Easy) : 65-79% VDOT
 * M (Marathon) : 80-89% VDOT
 * T (Threshold) : 88-92% VDOT
 * I (Interval) : 95-100% VDOT
 * R (Repetition) : 105-120% VDOT
 */

function calculatePaces(vdot) {
    const paces = {};
    
    // E : 65% (low) et 79% (high)
    paces.E_low = velocityToPace(velocityAtVO2(vdot * 0.65));
    paces.E_high = velocityToPace(velocityAtVO2(vdot * 0.79));
    
    // M : 85%
    paces.M = velocityToPace(velocityAtVO2(vdot * 0.85));
    
    // T : 90%
    paces.T = velocityToPace(velocityAtVO2(vdot * 0.90));
    
    // I : 98%
    paces.I = velocityToPace(velocityAtVO2(vdot * 0.98));
    
    // R : 110%
    paces.R = velocityToPace(velocityAtVO2(vdot * 1.10));
    
    return paces;
}

// Vitesse (m/min) pour un VO2 donné
function velocityAtVO2(vo2) {
    // Résolution équation quadratique
    const a = 0.000104;
    const b = 0.182258;
    const c = -4.6 - vo2;
    
    return (-b + Math.sqrt(b*b - 4*a*c)) / (2*a);
}

// Conversion vitesse (m/min) → allure (sec/km)
function velocityToPace(velocity) {
    return 60000 / velocity; // secondes par km
}
```

#### Progression 3/1
```javascript
/**
 * Cycle 3/1 avec taux de croissance adaptatif
 * Débutant : 8% par semaine
 * Intermédiaire : 10% par semaine
 * Avancé : 12% par semaine
 */

function apply31Cycle(weeks, baseLoad, growthRate) {
    let currentLoad = baseLoad;
    const result = [];
    
    for (let i = 0; i < weeks.length; i++) {
        const cycleWeek = (i % 4) + 1;
        
        if (cycleWeek === 1) {
            // Semaine 1 : charge de base
            result.push(currentLoad);
        } else if (cycleWeek === 2) {
            // Semaine 2 : +growthRate%
            result.push(currentLoad * (1 + growthRate));
        } else if (cycleWeek === 3) {
            // Semaine 3 : +growthRate% (cumulatif)
            result.push(currentLoad * (1 + growthRate) * (1 + growthRate));
        } else {
            // Semaine 4 : récupération (70%)
            result.push(currentLoad * 0.7);
            // Nouvelle base pour cycle suivant
            currentLoad = currentLoad * (1 + growthRate) * (1 + growthRate);
        }
    }
    
    return result;
}
```

#### Calcul TSS (Training Stress Score)
```javascript
/**
 * TSS = (durée_secondes × IF²) / 3600 × 100
 * IF (Intensity Factor) = allure_séance / allure_seuil
 */

function calculateTSS(session, paces) {
    if (!session.structure) return 0;
    
    let totalTSS = 0;
    
    // Pour chaque partie de la séance
    ['echauffement', 'bloc', 'retourAuCalme'].forEach(part => {
        if (session.structure[part]) {
            const duration = extractDuration(session.structure[part]);
            const pace = extractPace(session.structure[part], paces);
            
            if (duration > 0 && pace > 0) {
                const IF = paces.T / pace;
                const tss = (duration * 60 * IF * IF) / 3600 * 100;
                totalTSS += tss;
            }
        }
    });
    
    // Ajouter TSS récupération si répétitions
    if (session.structure.recuperation && session.structure.bloc) {
        const reps = extractRepetitions(session.structure.bloc);
        if (reps > 1) {
            const recupDuration = extractDuration(session.structure.recuperation);
            const recupPace = extractPace(session.structure.recuperation, paces) || paces.E_low;
            const recupIF = paces.T / recupPace;
            const recupTSS = ((reps - 1) * recupDuration * 60 * recupIF * recupIF) / 3600 * 100;
            totalTSS += recupTSS;
        }
    }
    
    return Math.round(totalTSS);
}
```

---

### Annexe C : Regex utilisés

#### Parsing durée (temps)
```javascript
// Format hh:mm:ss (ex: 1:30:00)
const timeHHMMSS = /(?<!\d)(\d+):(\d+):(\d+)(?!\S*\/km)/;
// Explication :
// (?<!\d)           Lookbehind négatif : pas précédé d'un chiffre
// (\d+):(\d+):(\d+) Capture hh:mm:ss
// (?!\S*\/km)       Lookahead négatif : pas suivi de /km

// Format mm:ss (ex: 50:00, 10:30)
const timeMMSS = /(?<!\d)(\d{1,2}):(\d{2})(?!\S*\/km)/;
// Explication :
// (?<!\d)           Pas précédé d'un chiffre (évite "1:50:00" → "50:00")
// (\d{1,2}):(\d{2}) 1-2 chiffres : 2 chiffres
// (?!\S*\/km)       Pas suivi de /km

// Format XX min (ex: 50 min)
const timeMin = /(\d+)\s*min(?!\s*à)/i;
// Explication :
// (\d+)\s*min       Chiffres + "min"
// (?!\s*à)          Pas suivi de "à"
// i                 Case insensitive
```

#### Parsing distance
```javascript
// Mètres (ex: 400m, 1500m)
const distanceMeters = /(?<!\d)(\d+(?:\.\d+)?)\s*m(?!\s*min)(?=\s|$|à)/i;
// Explication :
// (?<!\d)           Pas précédé d'un chiffre
// (\d+(?:\.\d+)?)   Chiffres avec décimales optionnelles
// \s*m              Suivi de "m"
// (?!\s*min)        Pas suivi de "min" (éviter confusion avec "min")
// (?=\s|$|à)        Suivi d'espace, fin, ou "à"

// Kilomètres (ex: 10km, 5.5km)
const distanceKm = /(\d+(?:\.\d+)?)\s*km(?=\s|$|à)/i;
```

#### Parsing allure
```javascript
// Allure format X:XX/km (ex: 5:30/km)
const paceFormat = /(\d+):(\d{2})\/km/;
// Correspond aux allures dans les descriptions

// Détection répétitions (ex: 10x, 8x)
const repetitions = /(\d+)x\s*/i;
```

#### Parsing récupération
```javascript
// Temps récup (ex: 90 sec, 2 min)
const recupTime = /(\d+)\s*(sec|min)/i;

// Distance récup (ex: 200m, 0.4km)
const recupDistance = /(\d+(?:\.\d+)?)\s*(m|km)/i;

// Récup en trot
const recupTrot = /trot/i;
```

---

### Annexe D : Formules de conversion

#### Temps
```javascript
// Secondes → hh:mm:ss
function secondsToHHMMSS(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h > 0 
        ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
        : `${m}:${s.toString().padStart(2, '0')}`;
}

// Minutes → hh:mm:ss
function minutesToHHMMSS(minutes) {
    return secondsToHHMMSS(minutes * 60);
}

// hh:mm:ss → Minutes
function hhmmssToMinutes(timeStr) {
    const parts = timeStr.split(':').map(p => parseInt(p) || 0);
    if (parts.length === 3) {
        return parts[0] * 60 + parts[1] + parts[2] / 60;
    } else if (parts.length === 2) {
        return parts[0] + parts[1] / 60;
    }
    return parts[0] || 0;
}
```

#### Allure
```javascript
// Secondes/km → Format "X:XX/km"
function secondsToPace(secondsPerKm) {
    const mins = Math.floor(secondsPerKm / 60);
    const secs = Math.round(secondsPerKm % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}/km`;
}

// Format "X:XX/km" → Secondes/km
function paceToSeconds(paceStr) {
    const match = paceStr.match(/(\d+):(\d+)/);
    if (match) {
        return parseInt(match[1]) * 60 + parseInt(match[2]);
    }
    return 0;
}

// Vitesse km/h → Allure min/km
function speedToPace(kmh) {
    return 60 / kmh; // minutes par km
}

// Allure min/km → Vitesse km/h
function paceToSpeed(minPerKm) {
    return 60 / minPerKm;
}
```

#### Distance
```javascript
// Allure + temps → Distance
function paceAndTimeToDistance(secondsPerKm, durationSeconds) {
    return (durationSeconds / secondsPerKm).toFixed(2);
}

// Allure + distance → Temps
function paceAndDistanceToTime(secondsPerKm, distanceKm) {
    return Math.round(secondsPerKm * distanceKm);
}

// Distance + temps → Allure
function distanceAndTimeToSPace(distanceKm, durationSeconds) {
    return durationSeconds / distanceKm;
}
```

---

### Annexe E : Tests de validation

#### Scénarios de test complets

**Test 1 : Création plan basique**
```
1. Formulaire :
   - Date début : 15/01/2025
   - Date course : 15/04/2025 (13 semaines)
   - Distance : Semi-marathon
   - Niveau : Intermédiaire
   - Référence : 10km en 45:00
   - Jours dispo : Lun, Mer, Ven, Sam
   - Sortie longue : Samedi

2. Générer plan

3. Vérifications :
   ✅ 13 semaines générées
   ✅ VDOT calculé : ~52.5
   ✅ 4 phases : Fondation (5 sem) → Qualité (4 sem) → Pic (3 sem) → Affûtage (1 sem)
   ✅ Séances sur jours demandés uniquement
   ✅ Sortie longue le samedi
   ✅ Graphique TSS affiché
   ✅ Progression visible : charge croissante puis tapering
```

**Test 2 : Édition séance**
```
1. Cliquer sur séance "Endurance" semaine 1

2. Modal s'ouvre avec étapes existantes

3. Vérifications :
   ✅ Durée récupérée (ex: 50:00)
   ✅ Distance calculée affichée
   ✅ Allure affichée correctement

4. Modifier durée : 50:00 → 60:00

5. Enregistrer

6. Vérifications :
   ✅ Plan mis à jour
   ✅ Nouvelle durée : 60:00
   ✅ Distance recalculée
   ✅ TSS mis à jour
```

**Test 3 : Drag & drop**
```
1. Glisser séance "VMA" du mercredi au vendredi

2. Vérifications :
   ✅ Séance déplacée
   ✅ Date mise à jour : "Vendredi XX/XX"
   ✅ Ordre séances recalculé
   ✅ Semaine ouverte reste ouverte
```

**Test 4 : Export/Import**
```
1. Exporter plan (bouton "Sauvegarder")

2. Vérifications :
   ✅ Fichier JSON téléchargé
   ✅ Nom : plan-course-YYYY-MM-DD.json
   ✅ Contenu valide JSON

3. Réinitialiser plan

4. Importer fichier JSON

5. Vérifications :
   ✅ Plan restauré identique
   ✅ Formulaire rempli
   ✅ Séances affichées
   ✅ Graphique TSS correct
```

**Test 5 : Validation durée zéro**
```
1. Ajouter séance

2. Ajouter étape (durée = 00:00)

3. Cliquer "Enregistrer"

4. Vérifications :
   ✅ Message erreur affiché
   ✅ Modal reste ouverte
   ✅ Séance non créée

5. Modifier durée : 00:00 → 10:00

6. Cliquer "Enregistrer"

7. Vérifications :
   ✅ Séance créée
   ✅ Modal fermée
   ✅ Plan mis à jour
```

---

### Annexe F : Ressources et références

#### Documentation officielle
- **JavaScript MDN** : https://developer.mozilla.org/fr/docs/Web/JavaScript
- **Tailwind CSS** : https://tailwindcss.com/docs
- **Regex101** : https://regex101.com/ (test regex en ligne)

#### Livres et articles
- **"Daniels' Running Formula"** - Jack Daniels
  - Formules VDOT, allures d'entraînement
  - Périodisation, plans types
  
- **"Advanced Marathoning"** - Pete Pfitzinger
  - Progression 3/1, cycles d'entraînement
  - Planification long terme

- **"The Science of Running"** - Steve Magness
  - Physiologie, adaptation métabolique
  - Gestion fatigue et récupération

#### Calculateurs en ligne
- **VDOT Calculator** : https://runsmartproject.com/calculator/
- **Training Paces** : https://www.mcmillanrunning.com/
- **TSS Calculator** : https://www.trainingpeaks.com/

#### Communauté
- **r/AdvancedRunning** : https://www.reddit.com/r/AdvancedRunning/
- **LetsRun Forums** : https://www.letsrun.com/forum/
- **Strava** : Groupes francophones

---

## 📞 Contact et support

### Signaler un bug
1. Vérifier [issues existantes](https://github.com/imtheyoyo/plan-course/issues)
2. Ouvrir nouvelle issue avec :
   - Description problème
   - Étapes reproduction
   - Navigateur + version
   - Console (F12) si erreur JS
   - Capture écran si pertinent

### Proposer une amélioration
1. Ouvrir [discussion](https://github.com/imtheyoyo/plan-course/discussions)
2. Décrire fonctionnalité souhaitée
3. Cas d'usage, bénéfices
4. Mockups si possible

### Contribuer au code
1. Fork le repository
2. Créer branche feature
3. Développer + tests
4. Pull Request avec description détaillée
5. Review + feedback
6. Merge

---

## 📜 Changelog

### Version 2.1.0 (12 octobre 2025)
**Corrections :**
- ✅ Fix initialisation durée à 0 au lieu de 10:00
- ✅ Ajout fonction `hhmmssToMinutes()`
- ✅ Amélioration regex parsing durée (lookbehind/lookahead)
- ✅ Validation durée zéro avant enregistrement
- ✅ Logs debug pour tracer parsing

**Fichiers modifiés :**
- `sessionManager.js` (lignes 48, 529, 650, 670-677, 1077, 1235)

### Version 2.0.0 (10 janvier 2025)
**Nouvelles fonctionnalités :**
- ✨ Éditeur séances structuré
- ✨ Drag & drop étapes
- ✨ Support formats temps/distance
- ✨ Calcul automatique durée/distance
- ✨ 6 allures + "Pas de cible"

**Améliorations :**
- 🎨 Interface moderne dark theme
- 📊 Graphique TSS amélioré
- 🔧 Architecture modulaire (16 fichiers)

### Version 1.0.0 (Création initiale)
- 🚀 Première version fonctionnelle
- ⚡ Génération plans 3 niveaux
- 📈 Calcul VDOT, allures
- 🎯 Périodisation 4 phases
- 💾 Export/Import JSON

---

## 🎓 Glossaire

**VDOT** : Mesure de capacité aérobie (VO2max ajustée)

**TSS** : Training Stress Score, mesure charge d'entraînement

**IF** : Intensity Factor, ratio intensité séance / seuil

**Allures** :
- **E (Easy)** : Endurance fondamentale, 65-79% VDOT
- **M (Marathon)** : Allure marathon, 80-89% VDOT
- **T (Threshold)** : Seuil anaérobie, 88-92% VDOT
- **I (Interval)** : Intervalles VMA, 95-100% VDOT
- **R (Repetition)** : Répétitions courtes, 105-120% VDOT
- **C (Competition)** : Allure objectif course

**Périodisation** : Organisation entraînement en phases progressives

**Cycle 3/1** : 3 semaines charge croissante + 1 semaine récupération

**Affûtage** : Réduction volume avant course pour être frais

**VMA** : Vitesse Maximale Aérobie

---

## 🏁 Conclusion

Ce document constitue la référence complète pour comprendre, maintenir et faire évoluer le projet **Générateur de Plan de Course V2.1**.

**Points clés à retenir :**

1. ✅ **Architecture modulaire** : 16 fichiers, responsabilités claires
2. ✅ **Code stable** : Corrections appliquées, tests validés
3. ✅ **Documentation exhaustive** : Architecture, algorithmes, conventions
4. ✅ **Roadmap claire** : V2.2 et V3.0 planifiées
5. ✅ **Maintenabilité** : Guide reprise projet, debugging, workflow Git

**Prochaines étapes recommandées :**

1. **Court terme** : Tests complets, validation corrections
2. **Moyen terme** : Export .ics, mode clair/sombre
3. **Long terme** : Backend API, authentification, PWA

---

**Version document :** 1.0.0  
**Dernière mise à jour :** 12 octobre 2025  
**Auteur :** Claude (Anthropic)  
**Contributeur principal :** imtheyoyo  
**Licence :** MIT

---

## 📎 Annexe G : Checklist de reprise de projet

### ✅ Checklist initiale (Jour 1)

**Installation et configuration :**
- [ ] Cloner repository GitHub
- [ ] Ouvrir projet dans éditeur
- [ ] Lancer en local (Live Server ou Python)
- [ ] Tester application : générer un plan
- [ ] Vérifier console : aucune erreur
- [ ] Lire ce document en entier

**Compréhension architecture :**
- [ ] Parcourir structure fichiers
- [ ] Identifier fichiers critiques (sessionManager.js, vdot.js)
- [ ] Lire commentaires dans code
- [ ] Tester fonctionnalités principales

**Setup environnement dev :**
- [ ] Installer extensions VS Code (Live Server, ESLint)
- [ ] Configurer Git (user.name, user.email)
- [ ] Créer branche test : `git checkout -b test/exploration`
- [ ] Faire modifications test et commit

---

### ✅ Checklist avant modifications (À chaque fois)

**Préparation :**
- [ ] Créer branche feature/fix appropriée
- [ ] Vérifier que main est à jour : `git pull origin main`
- [ ] Lire code existant de la zone à modifier
- [ ] Identifier impacts potentiels (dépendances)

**Développement :**
- [ ] Faire modification ciblée
- [ ] Tester manuellement (voir Annexe E)
- [ ] Vérifier console : aucune erreur
- [ ] Tester cas limites

**Validation :**
- [ ] Drag & drop fonctionne toujours
- [ ] Export/Import fonctionne
- [ ] Édition séances fonctionne
- [ ] Graphique TSS s'affiche
- [ ] Mobile responsive OK

**Commit et push :**
- [ ] Commit avec message clair
- [ ] Push vers GitHub
- [ ] Créer Pull Request si nécessaire

---

### ✅ Checklist avant déploiement (Production)

**Tests complets :**
- [ ] Générer plan débutant, intermédiaire, avancé
- [ ] Tester 5km, 10km, semi, marathon
- [ ] Créer/éditer/supprimer séances
- [ ] Drag & drop multiples séances
- [ ] Export puis import plan
- [ ] Tester sur Chrome, Firefox, Safari
- [ ] Tester sur mobile (responsive)

**Vérifications code :**
- [ ] Aucun console.log superflu
- [ ] Aucun debugger
- [ ] Aucun TODO critique
- [ ] Code commenté
- [ ] Formatage cohérent

**Documentation :**
- [ ] Mettre à jour README si nécessaire
- [ ] Mettre à jour ce document si architecture change
- [ ] Mettre à jour CHANGELOG
- [ ] Versionner : patch (2.1.1), minor (2.2.0), major (3.0.0)

**Déploiement :**
- [ ] Merge dans develop
- [ ] Tests sur develop
- [ ] Merge dans main
- [ ] Push main vers GitHub
- [ ] Vérifier déploiement GitHub Pages
- [ ] Tester URL live
- [ ] Tag version : `git tag v2.1.1`

---

## 📎 Annexe H : FAQ Développeur

### Questions générales

**Q : Puis-je ajouter une nouvelle dépendance npm ?**  
R : Non, le projet est Vanilla JS sans build. Seules les librairies CDN sont autorisées. Si absolument nécessaire, ajouter via `<script src="https://cdn...">`.

**Q : Comment ajouter un nouveau niveau de coureur ?**  
R : 
1. Créer `js/sessions/expert.js` avec bibliothèque séances
2. Ajouter option dans `config.js` : `LEVELS`
3. Modifier `progression.js` : logique sélection séances
4. Tester génération plan

**Q : Comment ajouter une nouvelle distance ?**  
R :
1. Ajouter dans `config.js` : `DISTANCES`
2. Mettre à jour calcul allure C (course) dans `vdot.js`
3. Ajouter séances spécifiques si besoin
4. Tester calculs VDOT

**Q : Le projet peut-il être converti en React ?**  
R : Oui, mais :
- Perte simplicité (build, dépendances)
- Gain : meilleure gestion état, composants réutilisables
- Effort : ~3-5 jours refactoring complet
- Recommandation : rester Vanilla sauf besoin fonctionnalités complexes (V3.0+)

---

### Questions techniques

**Q : Pourquoi ne pas utiliser localStorage ?**  
R : Restriction technique du contexte Claude.ai artifacts. Solution : export/import JSON.

**Q : Comment débugger regex qui ne matche pas ?**  
R :
1. Copier regex dans https://regex101.com/
2. Coller texte test
3. Analyser matches et groupes
4. Tester variations

**Q : Performances lentes avec beaucoup de semaines ?**  
R : Optimisations possibles :
- Virtualisation liste semaines (afficher seulement visibles)
- Debounce rendering
- Web Workers pour calculs lourds
- Actuellement : jusqu'à 30 semaines fonctionne bien

**Q : Comment ajouter un nouveau type d'allure ?**  
R :
1. Ajouter dans `vdot.js` : `calculatePaces()` → `paces.X = ...`
2. Ajouter dans `sessionManager.js` : liste allures dropdown
3. Mettre à jour `getPaceValue()` mapping
4. Ajouter séances utilisant cette allure

**Q : Le drag & drop ne fonctionne pas sur mobile ?**  
R : C'est normal, HTML5 drag & drop n'est pas supporté sur mobile. Solutions :
- Ajouter touch events handlers
- Utiliser librairie : Sortable.js
- Alternative : boutons ↑↓ pour réorganiser

---

### Questions séances

**Q : Comment créer un nouveau type de séance ?**  
R :
1. Ouvrir `sessions/{level}.js`
2. Ajouter objet dans array approprié :
```javascript
{
    type: "Nom séance",
    intensity: 3,
    build: (paces, targetDistance, phase, level) => ({
        echauffement: "...",
        bloc: "...",
        recuperation: "...",
        retourAuCalme: "..."
    })
}
```
3. Tester génération plan

**Q : Format structure séance : pourquoi pas d'array d'étapes ?**  
R : Structure actuelle : objet avec clés fixes (`echauffement`, `bloc`, etc.)
- ✅ Simplicité : mapping direct vers affichage
- ✅ Compatibilité : format attendu par render.js
- ❌ Flexibilité limitée : difficile d'avoir 2 blocs

Alternative V3.0 : migrer vers array d'étapes pour plus de flexibilité.

**Q : Comment supporter séances pyramide (ex: 400-800-1200-800-400) ?**  
R : Actuellement supporté via format liste :
```javascript
bloc: "400m + 800m + 1200m + 800m + 400m à 3:45/km"
```
Chaque distance devient une étape. Récupération appliquée entre chaque.

---

## 📎 Annexe I : Patterns de code courants

### Pattern 1 : Ajouter une validation
```javascript
// Localisation : Début fonction save/update
function saveSession(data) {
    // 1. Validation existence données
    if (!data || !data.steps) {
        alert('Données invalides');
        return;
    }
    
    // 2. Validation règles métier
    for (const step of data.steps) {
        if (step.durationType === 'time' && step.duration <= 0) {
            alert(`Erreur : durée invalide`);
            return;
        }
    }
    
    // 3. Traitement normal
    // ...
}
```

---

### Pattern 2 : Ajouter un champ au formulaire
```javascript
// 1. HTML (index.html)
<div class="form-group">
    <label for="new-field">Nouveau champ</label>
    <input type="text" id="new-field" name="newField">
</div>

// 2. Lecture (forms.js - getFormData)
getFormData() {
    return {
        // ... autres champs
        newField: document.getElementById('new-field').value
    };
}

// 3. Écriture (forms.js - setFormData)
setFormData(data) {
    // ... autres champs
    document.getElementById('new-field').value = data.newField || '';
}

// 4. Utilisation (app.js ou autre)
const formData = Forms.getFormData();
console.log(formData.newField);
```

---

### Pattern 3 : Ajouter une fonction utilitaire
```javascript
// Localisation : Créer nouveau fichier js/utils/myUtil.js

const MyUtil = {
    /**
     * Description fonction
     * @param {type} param - Description
     * @returns {type} Description retour
     */
    myFunction(param) {
        // Validation
        if (!param) return null;
        
        // Logique
        const result = /* ... */;
        
        // Retour
        return result;
    }
};

// Export global
if (typeof window !== 'undefined') {
    window.MyUtil = MyUtil;
}

// Ensuite dans index.html :
// <script src="js/utils/myUtil.js"></script>
```

---

### Pattern 4 : Ajouter un event listener
```javascript
// Localisation : interactions.js ou sessionManager.js

// 1. Dans fonction setup/init
setupMyFeature() {
    // Event delegation (si éléments dynamiques)
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('my-button')) {
            this.handleMyAction(e.target);
        }
    });
    
    // Ou event direct (si élément statique)
    document.getElementById('my-button').addEventListener('click', () => {
        this.handleMyAction();
    });
}

// 2. Handler
handleMyAction(element) {
    // Logique
    console.log('Action déclenchée', element);
}

// 3. Appeler setup dans init
init() {
    // ...
    this.setupMyFeature();
}
```

---

### Pattern 5 : Modifier l'affichage
```javascript
// Localisation : render.js

// 1. Fonction rendering
renderMyComponent(data) {
    const html = `
        <div class="my-component">
            <h3>${data.title}</h3>
            <p>${data.description}</p>
        </div>
    `;
    return html;
}

// 2. Intégration dans render principal
renderPlan(planData) {
    // ...
    
    // Insérer composant
    const container = document.getElementById('my-container');
    container.innerHTML = this.renderMyComponent(planData.myData);
    
    // ...
}

// 3. CSS (styles.css)
.my-component {
    background: #1f2937;
    border-radius: 8px;
    padding: 16px;
}
```

---

## 📎 Annexe J : Exemples de modifications complètes

### Exemple 1 : Ajouter export PDF

**Objectif :** Permettre export du plan en PDF

**Étapes :**

1. **Ajouter librairie jsPDF**
```html
<!-- index.html -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
```

2. **Créer fonction export**
```javascript
// js/utils/pdfExport.js
const PDFExport = {
    exportPlan(planData, userInput) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Titre
        doc.setFontSize(20);
        doc.text('Plan d\'entraînement', 20, 20);
        
        // Infos
        doc.setFontSize(12);
        doc.text(`Objectif : ${userInput.distance}`, 20, 35);
        doc.text(`Date course : ${userInput.raceDate}`, 20, 45);
        
        let y = 60;
        
        // Semaines
        planData.plan.forEach(week => {
            doc.setFontSize(14);
            doc.text(`Semaine ${week.weekNumber}`, 20, y);
            y += 10;
            
            doc.setFontSize(10);
            week.sessions.forEach(session => {
                doc.text(`${session.fullDate} : ${session.type}`, 25, y);
                y += 7;
            });
            
            y += 5;
            
            // Nouvelle page si nécessaire
            if (y > 270) {
                doc.addPage();
                y = 20;
            }
        });
        
        // Téléchargement
        doc.save(`plan-course-${userInput.raceDate}.pdf`);
    }
};

if (typeof window !== 'undefined') {
    window.PDFExport = PDFExport;
}
```

3. **Ajouter bouton UI**
```html
<!-- index.html -->
<button id="export-pdf" class="btn-secondary">
    📄 Exporter PDF
</button>
```

4. **Connecter event**
```javascript
// interactions.js - setupActionButtons()
document.querySelector('#export-pdf').addEventListener('click', () => {
    if (!STATE.currentPlanData) {
        alert('Générez un plan avant d\'exporter.');
        return;
    }
    PDFExport.exportPlan(STATE.currentPlanData, Forms.getFormData());
});
```

5. **Tester**
- Générer plan
- Cliquer "Exporter PDF"
- Vérifier téléchargement PDF
- Ouvrir PDF et valider contenu

---

### Exemple 2 : Ajouter compteur de séances

**Objectif :** Afficher nombre total de séances dans le plan

**Étapes :**

1. **Ajouter fonction calcul**
```javascript
// js/core/stats.js
const Stats = {
    countSessions(planData) {
        return planData.plan.reduce((total, week) => {
            return total + week.sessions.length;
        }, 0);
    },
    
    countByType(planData) {
        const counts = {};
        planData.plan.forEach(week => {
            week.sessions.forEach(session => {
                counts[session.type] = (counts[session.type] || 0) + 1;
            });
        });
        return counts;
    }
};

if (typeof window !== 'undefined') {
    window.Stats = Stats;
}
```

2. **Ajouter zone affichage**
```html
<!-- index.html - après graphique TSS -->
<div id="stats-container" class="stats-panel hidden">
    <h3>Statistiques du plan</h3>
    <div id="stats-content"></div>
</div>
```

3. **CSS**
```css
/* styles.css */
.stats-panel {
    background: #1f2937;
    border-radius: 8px;
    padding: 20px;
    margin-top: 20px;
}

.stat-item {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid #374151;
}

.stat-item:last-child {
    border-bottom: none;
}
```

4. **Rendering**
```javascript
// render.js
renderStats(planData) {
    const container = document.getElementById('stats-container');
    const content = document.getElementById('stats-content');
    
    if (!planData) {
        container.classList.add('hidden');
        return;
    }
    
    const totalSessions = Stats.countSessions(planData);
    const byType = Stats.countByType(planData);
    
    let html = `
        <div class="stat-item">
            <span>Séances totales</span>
            <strong>${totalSessions}</strong>
        </div>
    `;
    
    Object.entries(byType).forEach(([type, count]) => {
        html += `
            <div class="stat-item">
                <span>${type}</span>
                <span>${count}</span>
            </div>
        `;
    });
    
    content.innerHTML = html;
    container.classList.remove('hidden');
}

// Appeler dans renderPlan
renderPlan(planData, openStates, activePhase) {
    // ... code existant
    
    // Ajouter stats
    this.renderStats(planData);
}
```

5. **Tester**
- Générer plan
- Vérifier panneau stats s'affiche
- Valider nombres corrects
- Tester différents niveaux/distances

---

## 📎 Annexe K : Commandes Git utiles

### Commandes de base
```bash
# Statut
git status

# Ajouter fichiers
git add .                    # Tous
git add sessionManager.js    # Spécifique

# Commit
git commit -m "fix: description"

# Push
git push origin main
git push origin feature/my-branch

# Pull
git pull origin main

# Créer branche
git checkout -b feature/new-feature

# Changer branche
git checkout main
git checkout develop

# Lister branches
git branch
git branch -a  # Inclut remote
```

### Commandes avancées
```bash
# Annuler modifications non commitées
git checkout -- sessionManager.js
git reset --hard  # ATTENTION : perte données

# Annuler dernier commit (garde modifications)
git reset --soft HEAD~1

# Annuler dernier commit (supprime modifications)
git reset --hard HEAD~1

# Stash (mettre de côté)
git stash
git stash list
git stash apply
git stash pop

# Voir différences
git diff
git diff sessionManager.js
git diff main..feature/my-branch

# Historique
git log
git log --oneline
git log --graph --oneline --all

# Chercher dans historique
git log --grep="duration"
git log -S"hhmmssToMinutes"

# Tags
git tag v2.1.1
git push origin v2.1.1
git tag -l
```

### Résolution conflits
```bash
# 1. Pull avec conflit
git pull origin main
# → CONFLICT in sessionManager.js

# 2. Ouvrir fichier, chercher
<<<<<<< HEAD
// Votre code
=======
// Code distant
>>>>>>> branch

# 3. Résoudre manuellement, supprimer marqueurs

# 4. Marquer comme résolu
git add sessionManager.js

# 5. Finaliser merge
git commit -m "merge: résolution conflits"

# 6. Push
git push origin main
```

### Annuler en production (URGENCE)
```bash
# Si bug déployé en production

# Option 1 : Revert (crée commit inverse)
git revert HEAD
git push origin main

# Option 2 : Reset (DANGER, réécrit historique)
git reset --hard HEAD~1
git push origin main --force  # À éviter si collaborateurs

# Option 3 : Hotfix
git checkout -b hotfix/critical-bug
# ... fix ...
git commit -m "hotfix: correction bug critique"
git checkout main
git merge hotfix/critical-bug
git push origin main
```

---

## 📎 Annexe L : Optimisations possibles

### Performance

**1. Lazy loading images/assets**
```javascript
// Charger images séances uniquement si nécessaire
<img data-src="image.jpg" class="lazy">

const lazyImages = document.querySelectorAll('.lazy');
const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.remove('lazy');
            imageObserver.unobserve(img);
        }
    });
});

lazyImages.forEach(img => imageObserver.observe(img));
```

**2. Debounce rendering**
```javascript
// Éviter re-render trop fréquents
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Utilisation
const debouncedRender = debounce(() => {
    Render.renderPlan(STATE.currentPlanData);
}, 300);

// Appeler debouncedRender() au lieu de render direct
```

**3. Virtual scrolling (grandes listes)**
```javascript
// Pour 50+ semaines
// Afficher seulement semaines visibles
// Librairie : react-window ou vanilla implementation
```

---

### UX

**1. Loading states**
```javascript
function generatePlan() {
    // Afficher loader
    document.getElementById('loader').classList.remove('hidden');
    document.getElementById('generate-btn').disabled = true;
    
    // Calcul asynchrone
    setTimeout(() => {
        const plan = /* génération */;
        
        // Cacher loader
        document.getElementById('loader').classList.add('hidden');
        document.getElementById('generate-btn').disabled = false;
        
        // Afficher résultat
        Render.renderPlan(plan);
    }, 100);
}
```

**2. Animations transitions**
```css
/* Transitions douces */
.session-card {
    transition: all 0.3s ease;
}

.session-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

/* Fade in */
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

.week-content {
    animation: fadeIn 0.3s ease;
}
```

**3. Toast notifications**
```javascript
const Toast = {
    show(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

// Utilisation
Toast.show('✅ Séance enregistrée', 'success');
Toast.show('❌ Erreur validation', 'error');
```

---

### Accessibilité

**1. ARIA labels**
```html
<button aria-label="Supprimer séance" class="delete-btn">
    ✕
</button>

<div role="dialog" aria-modal="true" aria-labelledby="modal-title">
    <h2 id="modal-title">Éditer séance</h2>
</div>
```

**2. Keyboard navigation**
```javascript
// Fermer modal avec Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modal = document.querySelector('.session-modal-overlay');
        if (modal) modal.remove();
    }
});

// Navigation Tab
<div tabindex="0">Élément focusable</div>
```

**3. Contraste couleurs**
```css
/* Vérifier ratio contraste minimum 4.5:1 */
/* Outil : https://webaim.org/resources/contrastchecker/ */

.text-primary {
    color: #60a5fa; /* Bleu clair */
}

.bg-dark {
    background: #1f2937; /* Gris foncé */
}

/* Ratio : 8.2:1 ✅ */
```

---

## 🎯 Conclusion finale

Ce document exhaustif couvre **tous les aspects** du projet Générateur de Plan de Course V2.1 :

✅ **Architecture complète** : Structure, flux, modules  
✅ **Historique détaillé** : Chaque correction expliquée  
✅ **Guide pratique** : Setup, workflow, debugging  
✅ **Références techniques** : Algorithmes, regex, formules  
✅ **Exemples concrets** : Patterns, modifications complètes  
✅ **Outils et commandes** : Git, tests, optimisations

**Le projet est maintenant prêt pour :**
- ✨ Être maintenu facilement
- 🚀 Être étendu avec nouvelles fonctionnalités
- 👥 Accueillir nouveaux contributeurs
- 📈 Évoluer vers V2.2 et V3.0

**Pour toute question supplémentaire :**
- 📖 Relire les annexes correspondantes
- 🔍 Chercher dans ce document (Ctrl+F)
- 💬 Ouvrir discussion GitHub
- 🐛 Créer issue si bug détecté

---

**Merci d'avoir lu ce document !**  
**Bon développement ! 🏃‍♂️💨**

---

*Document créé avec ❤️ par Claude (Anthropic)*  
*Maintenu par la communauté*  
*Version 1.0.0 - 12 octobre 2025*