# 🏃‍♂️ Générateur de Plan de Course V2.1

> Générateur de plan d'entraînement personnalisé avec périodisation intelligente, tests de contrôle automatiques et visualisation de charge.

[![Version](https://img.shields.io/badge/version-2.1.0-blue.svg)](https://github.com/imtheyoyo/plan-course)
[![Build](https://img.shields.io/badge/build-2025--01--10-orange.svg)](https://github.com/imtheyoyo/plan-course)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

[🚀 Démo en ligne](https://imtheyoyo.github.io/plan-course/)
[📖 Documentation](https://github.com/imtheyoyo/plan-course/tree/main/docs)
[🐛 Signaler un bug](https://github.com/imtheyoyo/plan-course/issues)

---

## ✨ Fonctionnalités

### 🎯 Planification intelligente
- **Périodisation en 4 phases** : Fondation → Qualité → Pic → Affûtage
- **Progression adaptative** : Cycles 3/1 avec micro-variations
- **3 profils de coureur** : Débutant, Intermédiaire, Avancé
- **33 types de séances** différentes

### 📊 Suivi et analyse
- **Tests automatiques** toutes les 6 semaines
- **Calcul VDOT** (formule Jack Daniels)
- **Visualisation TSS** (Training Stress Score)
- **6 allures d'entraînement** personnalisées

### 🎨 Interface moderne
- **Drag & drop** pour réorganiser les séances
- **Éditeur de séances** intégré
- **Export/Import JSON** pour sauvegarder
- **Responsive** : fonctionne sur mobile/tablette

---

## 🚀 Installation rapide

### Option 1 : Utilisation directe (recommandé)
```bash
# Cloner le projet
git clone https://github.com/VOTRE-USERNAME/plan-course-v2.1.git
cd plan-course-v2.1

# Ouvrir dans le navigateur
open index.html
```

Aucune dépendance, aucune installation ! 🎉

### Option 2 : Installation via script
```bash
# Télécharger deploy.html
curl -O https://raw.githubusercontent.com/VOTRE-USERNAME/plan-course-v2.1/main/deploy.html

# Ouvrir dans le navigateur
open deploy.html

# Cliquer sur "Créer le projet"
```

---

## 📖 Utilisation

### 1. Configurer votre profil
- **Dates** : Date de début et date de course
- **Objectif** : Distance (5km, 10km, semi, marathon)
- **Niveau** : Débutant, Intermédiaire ou Avancé
- **Performance** : Entrer un temps de référence

### 2. Définir vos disponibilités
- Sélectionner vos jours d'entraînement (3-7 jours)
- Choisir le jour de la sortie longue

### 3. Générer et personnaliser
- Cliquer sur "Générer mon Plan"
- Glisser-déposer les séances pour réorganiser
- Éditer les détails si nécessaire
- Exporter en JSON pour sauvegarder

---

## 🏗️ Architecture

```
plan-course-v2.1/
├── index.html              # Interface principale
├── css/
│   └── styles.css         # Styles (dark theme)
└── js/
    ├── config.js          # Configuration globale
    ├── utils/             # Utilitaires (dates, formatters, storage)
    ├── core/              # Algorithmes (VDOT, progression, placement)
    ├── sessions/          # Bibliothèques de séances (x3 niveaux)
    ├── ui/                # Interface (forms, render, interactions)
    └── app.js             # Orchestration principale
```

**Total :** 16 fichiers modulaires (~2870 lignes)

---

## 🔧 Technologies

- **Frontend** : HTML5, CSS3, JavaScript (ES6+)
- **Styling** : Tailwind CSS (CDN)
- **Bundler** : Aucun (vanilla JS)
- **Dépendances** : JSZip (pour export)

---

## 🎓 Algorithmes

### VDOT (Jack Daniels)
Calcul scientifique de la VO2max à partir d'une performance.

### Progression 3/1
- 3 semaines de charge progressive
- 1 semaine de récupération (65-70% de charge)
- Taux de croissance adapté au niveau (8-12%)

### Placement intelligent
- Séances VMA en début de semaine
- Séances seuil en milieu de semaine
- Espacement minimum entre séances dures

---

## 🤝 Contribution

Les contributions sont les bienvenues ! Voici comment participer :

1. **Fork** le projet
2. Créer une **branche** (`git checkout -b feature/AmazingFeature`)
3. **Commit** vos changements (`git commit -m 'Add AmazingFeature'`)
4. **Push** vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une **Pull Request**

Voir [CONTRIBUTING.md](CONTRIBUTING.md) pour plus de détails.

---

## 📝 Roadmap

### V2.2 (Q1 2025)
- [ ] Export .ics (calendrier)
- [ ] Mode sombre/clair
- [ ] Graphiques Recharts
- [ ] Tests unitaires Jest

### V3.0 (Q2 2025)
- [ ] Backend API (Node.js)
- [ ] Authentification utilisateurs
- [ ] Suivi des performances
- [ ] Application mobile (PWA)

---

## 🐛 Bugs connus

Aucun bug critique connu. Si vous en trouvez un :
1. Vérifier les [issues existantes](issues/)
2. Ouvrir une [nouvelle issue](issues/new) avec :
   - Description du problème
   - Étapes pour reproduire
   - Navigateur et version
   - Console (F12) si erreur JS

---

## 📄 Licence

Ce projet est sous licence **MIT** - voir [LICENSE](LICENSE) pour plus de détails.

---

## 👨‍💻 Auteur

**Créé avec ❤️ par Claude (Anthropic)**

- Version : 2.1.0
- Build : 2025-01-10
- Architecture modulaire pour faciliter la maintenance

---

## 🙏 Remerciements

- [Jack Daniels](https://runsmartproject.com/calculator/) pour les formules VDOT
- [Tailwind CSS](https://tailwindcss.com/) pour le design
- Communauté des coureurs pour les retours

---

## 📞 Support

- 📖 [Documentation complète](docs/)
- 💬 [Discussions](discussions/)
- 🐛 [Issues](issues/)
- ⭐ Si ce projet vous plaît, pensez à lui donner une étoile !

---

<div align="center">
  
**[⬆ Retour en haut](#-générateur-de-plan-de-course-v21)**

Made with 🏃‍♂️ and ☕

</div>
