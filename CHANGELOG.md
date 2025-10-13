# Changelog

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).

## [Non publié]

### À venir
- Export calendrier .ics
- Mode sombre/clair
- Graphiques interactifs avec Recharts
- Tests unitaires Jest

---

## [2.1.0] - 2025-10-12

### 🐛 Corrections
- **Initialisation durée** : Durée initialisée à 0 au lieu de 10:00 lors de l'ajout d'une étape
- **Parsing durée** : Amélioration des regex avec lookbehind/lookahead pour parser correctement "50:00 à 6:13/km"
- **Fonction manquante** : Ajout de la fonction `hhmmssToMinutes()` pour la conversion temps
- **Validation** : Ajout validation empêchant l'enregistrement de séances avec durée = 0:00

### 🔧 Améliorations
- Ajout de logs de debug pour tracer le parsing des descriptions
- Messages d'erreur plus explicites lors de la validation

### 📝 Documentation
- Création de la documentation technique complète (TECHNICAL_DOCUMENTATION.md)
- Ajout de ce CHANGELOG

### Fichiers modifiés
- `sessionManager.js` (lignes 48, 529, 650, 670-677, 1077, 1235)

---

## [2.0.0] - 2025-01-10

### ✨ Nouvelles fonctionnalités
- **Éditeur de séances structuré** : Modal avec étapes multiples, drag & drop
- **Formats flexibles** : Support temps (hh:mm:ss) et distance (km/m)
- **Calcul automatique** : Durée et distance totales calculées en temps réel
- **Allures étendues** : 6 allures (E/M/T/I/R/C) + option "Pas de cible"
- **Types d'étapes** : Échauffement, Course à pied, Retour au calme

### 🎨 Interface
- Design moderne avec dark theme
- Interface responsive (mobile/tablette)
- Graphique TSS amélioré
- Animations et transitions fluides

### 🏗️ Technique
- Architecture modulaire : 16 fichiers (~2870 lignes)
- Séparation claire des responsabilités
- Code documenté et maintenable

### 📦 Modules
- `sessionManager.js` : Gestion complète des séances
- `vdot.js` : Calculs scientifiques (VDOT, TSS, allures)
- `progression.js` : Périodisation et cycles 3/1
- `placement.js` : Placement intelligent des séances

---

## [1.0.0] - 2025-01-01

### 🚀 Première version
- **Génération de plans** : 3 niveaux (débutant, intermédiaire, avancé)
- **Périodisation intelligente** : 4 phases (Fondation, Qualité, Pic, Affûtage)
- **Calcul VDOT** : Méthode Jack Daniels
- **Allures personnalisées** : E, M, T, I, R basées sur VDOT
- **Cycles 3/1** : 3 semaines de charge + 1 semaine de récupération
- **33 types de séances** : Bibliothèques pour chaque niveau
- **Visualisation TSS** : Graphique de charge d'entraînement
- **Drag & drop** : Réorganisation des séances
- **Export/Import** : Sauvegarde en JSON
- **Responsive** : Fonctionne sur mobile et tablette

### 📊 Algorithmes
- Formule VDOT (Jack Daniels)
- Calcul TSS (Training Stress Score)
- Progression adaptative (8-12% selon niveau)
- Placement intelligent des séances

### 🎯 Distances supportées
- 5km
- 10km
- Semi-marathon (21.1km)
- Marathon (42.2km)

---

## Format des versions

- **[X.0.0]** : Version majeure (changements incompatibles)
- **[0.X.0]** : Version mineure (nouvelles fonctionnalités)
- **[0.0.X]** : Patch (corrections de bugs)

## Légende

- ✨ `Added` : Nouvelles fonctionnalités
- 🔧 `Changed` : Modifications de fonctionnalités existantes
- 🗑️ `Deprecated` : Fonctionnalités obsolètes (seront supprimées)
- ❌ `Removed` : Fonctionnalités supprimées
- 🐛 `Fixed` : Corrections de bugs
- 🔒 `Security` : Corrections de sécurité

---

[Non publié]: https://github.com/imtheyoyo/plan-course/compare/v2.1.0...HEAD
[2.1.0]: https://github.com/imtheyoyo/plan-course/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/imtheyoyo/plan-course/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/imtheyoyo/plan-course/releases/tag/v1.0.0
