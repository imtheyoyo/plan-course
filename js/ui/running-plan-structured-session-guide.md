# 🎨 Modal d'ajout structuré - Style Garmin

## ✨ Fonctionnalités

La nouvelle interface d'ajout de séance permet de créer des entraînements **par étapes**, comme dans Garmin Connect :

✅ **Ajout d'étapes multiples** (Échauffement, Bloc principal, Récupération, Retour au calme)
✅ **Choix Temps/Distance** pour chaque étape
✅ **Répétitions** (ex: 6x 400m)
✅ **Sélection d'allure** avec calculs automatiques
✅ **Résumé en temps réel** (durée + distance totales)
✅ **Glisser-déposer** pour réorganiser les étapes (à venir)

---

## 📋 Comment utiliser

### 1️⃣ Ouvrir le modal

1. Générer un plan
2. Survoler un jour vide
3. Cliquer sur le bouton **➕**

### 2️⃣ Créer les étapes

Le modal s'ouvre avec une **première étape** (Échauffement) déjà créée.

#### Configurer une étape :

| Champ | Description | Exemple |
|-------|-------------|---------|
| **Nom** | Type d'étape | "Échauffement", "VMA Courte" |
| **Temps/Distance** | Basée sur temps ou distance | Temps: 20 min / Distance: 2 km |
| **Valeur** | Durée ou distance | 20 min ou 2 km |
| **Allure** | Intensité cible | Endurance, Seuil, VMA... |

#### Types d'étapes :

- **Échauffement** : Préparation (15-20 min en Endurance)
- **Course à pied** : Bloc principal (intervalles, tempo, etc.)
- **Récupération** : Entre les répétitions (1-3 min trot)
- **Retour au calme** : Fin de séance (10-15 min facile)

### 3️⃣ Ajouter des répétitions

Pour créer des intervalles (ex: 6x 400m) :

1. Créer une étape normale
2. Cliquer sur **"🔁 Convertir en répétition"**
3. Définir le nombre de répétitions (ex: 6)
4. L'étape devient : **"6x 400m à 4:00/km"**

### 4️⃣ Ajouter d'autres étapes

Cliquer sur **"➕ Ajouter une étape"** autant de fois que nécessaire.

**Exemple de séance VMA complète :**

```
1. Échauffement
   └─ 20 min à Endurance

2. VMA Courte (répétition)
   └─ 10x 400m à Répétition
   └─ Récup: 90 sec trot

3. Retour au calme
   └─ 15 min à Endurance
```

### 5️⃣ Vérifier le résumé

En bas du modal, le résumé affiche :
- **Durée totale estimée** : 50:30
- **Distance estimée** : 9.06 km

Ces valeurs se mettent à jour automatiquement à chaque modification.

### 6️⃣ Enregistrer

Cliquer sur **"💾 Enregistrer l'entraînement"**

La séance est ajoutée au plan avec :
- Kilométrage recalculé
- TSS mis à jour
- Structure détaillée visible

---

## 🎯 Exemples de séances

### Exemple 1 : Séance VMA courte

| Étape | Type | Valeur | Allure | Répétitions |
|-------|------|--------|--------|-------------|
| 1 | Temps | 20 min | Endurance | - |
| 2 | Distance | 400 m | Répétition | 10x |
| 3 | Temps | 15 min | Endurance | - |

**Résultat :** VMA Courte - 8.5 km en 50 min

### Exemple 2 : Séance Seuil

| Étape | Type | Valeur | Allure | Répétitions |
|-------|------|--------|--------|-------------|
| 1 | Temps | 20 min | Endurance | - |
| 2 | Distance | 2 km | Seuil | 3x |
| 3 | Temps | 15 min | Endurance | - |

**Résultat :** Seuil - 12 km en 60 min

### Exemple 3 : Sortie longue spécifique

| Étape | Type | Valeur | Allure | Répétitions |
|-------|------|--------|--------|-------------|
| 1 | Distance | 15 km | Endurance | - |
| 2 | Distance | 5 km | Marathon | - |

**Résultat :** Sortie Longue Spécifique - 20 km

### Exemple 4 : Fartlek

| Étape | Type | Valeur | Allure | Répétitions |
|-------|------|--------|--------|-------------|
| 1 | Temps | 15 min | Endurance | - |
| 2 | Temps | 2 min | Seuil | 8x |
| 3 | Temps | 10 min | Endurance | - |

**Résultat :** Fartlek - 10 km en 55 min

---

## 🎨 Interface visuelle

```
┌─────────────────────────────────────────────┐
│  ➕ Ajouter une séance                      │
│  Semaine 6 - Mercredi 12/02/2025           │
├─────────────────────────────────────────────┤
│  ⋮⋮ Échauffement                        🗑️ │
│  ├─ Temps / Distance  [Temps] [Distance]   │
│  ├─ Temps total:  [20] min                 │
│  └─ Allure: [Endurance (5:45/km) ▼]       │
├─────────────────────────────────────────────┤
│  ⋮⋮ VMA Courte                          🗑️ │
│  ├─ Répéter: [10] Fois                     │
│  ├─ Temps / Distance  [Temps] [Distance]   │
│  ├─ Distance totale: [0.4] km              │
│  └─ Allure: [Répétition (3:50/km) ▼]      │
├─────────────────────────────────────────────┤
│  ➕ Ajouter une étape                       │
├─────────────────────────────────────────────┤
│  Durée totale estimée:     50:30           │
│  Distance estimée:         9.06 km         │
├─────────────────────────────────────────────┤
│  [Annuler]  [💾 Enregistrer l'entraînement]│
└─────────────────────────────────────────────┘
```

---

## 🔧 Fonctionnement technique

### Calcul automatique

**Distance → Temps :**
```javascript
temps (min) = distance (km) × allure (sec/km) / 60
```

**Temps → Distance :**
```javascript
distance (km) = temps (min) × 60 / allure (sec/km)
```

### Allures disponibles

| Code | Nom | Description | Exemple |
|------|-----|-------------|---------|
| E | Endurance | Footing facile | 5:45/km |
| M | Marathon | Allure marathon | 4:55/km |
| T | Seuil | Tempo run | 4:25/km |
| I | Intervalle | VMA longue | 4:00/km |
| R | Répétition | VMA courte | 3:50/km |
| C | Course | Objectif race | 4:35/km |

### Structure générée

La séance est sauvegardée avec cette structure :

```javascript
{
    type: "VMA Courte",
    intensity: 4,
    structure: {
        echauffement: "20 min à 5:45/km",
        bloc: "10x 400m à 3:50/km",
        retourAuCalme: "15 min à 5:45/km"
    },
    distance: 9.06,
    day: 2,
    fullDate: "Mercredi 12/02/2025"
}
```

---

## 🚀 Améliorations à venir (V2.3)

- [ ] **Drag & drop** des étapes pour réorganiser
- [ ] **Templates** de séances (VMA, Seuil, Fartlek prédéfinis)
- [ ] **Récupération calculée** automatiquement
- [ ] **Validation intelligente** (pas trop de VMA d'affilée)
- [ ] **Copier/coller** d'étapes
- [ ] **Import depuis Garmin/Strava**
- [ ] **Zones cardiaques** en plus des allures
- [ ] **Graphique de la séance** (allure dans le temps)

---

## 🐛 Résolution de problèmes

### Le modal ne s'ouvre pas

**Console (F12) :**
```javascript
console.log('SessionManager:', typeof SessionManager);
```

Si `undefined`, vérifier que `sessionManager.js` est chargé.

### Les valeurs ne se mettent pas à jour

**Vider le cache :** Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)

### Le résumé affiche 0:00

**Vérifier** que les étapes ont des valeurs > 0 et une allure sélectionnée.

### Erreur lors de la sauvegarde

**Vérifier** qu'au moins une étape existe et a des valeurs valides.

---

## 📝 Checklist de création

Avant de sauvegarder, vérifier :

- [ ] Au moins 1 étape existe
- [ ] Chaque étape a un nom
- [ ] Chaque étape a une durée/distance > 0
- [ ] Chaque étape a une allure sélectionnée
- [ ] Le résumé affiche des valeurs réalistes
- [ ] Les répétitions sont configurées correctement

---

## 💡 Astuces

### Créer rapidement une séance VMA

1. **Échauffement** : 20 min Endurance
2. **Ajouter étape** → 400m Répétition
3. **Convertir en répétition** → 10x
4. **Ajouter étape** → 15 min Endurance

✅ Séance VMA prête en 30 secondes !

### Séance Seuil en 3 clics

1. **Échauffement** : 20 min Endurance
2. **Ajouter étape** → 2km Seuil → Répétition 3x
3. **Ajouter étape** → 15 min Endurance

### Sortie longue progressive

1. **Étape 1** : 15 km Endurance
2. **Étape 2** : 5 km Marathon

Le changement d'allure se fait automatiquement !

---

## ✅ Mise à jour des fichiers

Pour activer cette fonctionnalité :

1. **Remplacer** `js/ui/sessionManager.js` par la nouvelle version
2. **Mettre à jour** `css/styles.css` avec les nouveaux styles
3. **Tester** en ajoutant une séance
4. **Commit** et push sur GitHub

```bash
git add js/ui/sessionManager.js css/styles.css
git commit -m "feat: Modal d'ajout structuré style Garmin"
git push origin main
```

---

## 🎓 Comparaison Ancien vs Nouveau

### Ancien modal (simple)

```
Type de séance: [VMA Courte ▼]
Distance: [10] km
Description: "10x 400m à 3:50"
```

❌ Pas de structure par étapes
❌ Description en texte libre
❌ Pas de calcul automatique
❌ Pas de répétitions natives

### Nouveau modal (structuré)

```
Étape 1: Échauffement - 20 min
Étape 2: 10x 400m à 3:50/km
Étape 3: Retour au calme - 15 min

Durée totale: 50:30
Distance totale: 9.06 km
```

✅ Structure par étapes
✅ Calculs automatiques
✅ Répétitions intégrées
✅ Résumé en temps réel
✅ Interface professionnelle

---

## 📊 Exemples de séances avancées

### Séance Pyramidale

| # | Étape | Valeur | Allure | Rép |
|---|-------|--------|--------|-----|
| 1 | Échauffement | 20 min | E | - |
| 2 | Course | 400m | I | 1x |
| 3 | Course | 800m | I | 1x |
| 4 | Course | 1200m | I | 1x |
| 5 | Course | 800m | I | 1x |
| 6 | Course | 400m | I | 1x |
| 7 | RC | 15 min | E | - |

**Résultat :** Pyramide VMA - 11 km en 60 min

---

### Séance Allure Course

| # | Étape | Valeur | Allure | Rép |
|---|-------|--------|--------|-----|
| 1 | Échauffement | 15 min | E | - |
| 2 | Course | 3 km | C | 3x |
| 3 | RC | 10 min | E | - |

**Résultat :** Allure Course - 15 km

---

### Séance Longue Allure Marathon

| # | Étape | Valeur | Allure | Rép |
|---|-------|--------|--------|-----|
| 1 | EF | 3 km | E | - |
| 2 | Bloc | 16 km | M | - |
| 3 | RC | 1 km | E | - |

**Résultat :** Sortie Marathon - 20 km

---

### Double Seuil

| # | Étape | Valeur | Allure | Rép |
|---|-------|--------|--------|-----|
| 1 | Échauffement | 20 min | E | - |
| 2 | Seuil 1 | 15 min | T | - |
| 3 | Récup | 5 min | E | - |
| 4 | Seuil 2 | 15 min | T | - |
| 5 | RC | 10 min | E | - |

**Résultat :** Double Seuil - 16 km

---

## 🔥 Séances Types Prêtes à l'emploi

### 📘 Pour débutants

**VMA Découverte**
- 15 min EF
- 8x 200m (R) - 90sec récup
- 10 min RC
- **Total :** 6 km

**Seuil Court**
- 15 min EF
- 10 min (T)
- 10 min RC
- **Total :** 8 km

---

### 📗 Pour intermédiaires

**VMA Classique**
- 20 min EF
- 10x 400m (R) - 90sec récup
- 15 min RC
- **Total :** 9 km

**Tempo 20 min**
- 20 min EF
- 20 min (T)
- 10 min RC
- **Total :** 12 km

**Allure Spécifique**
- 3 km EF
- 10 km (M)
- 2 km RC
- **Total :** 15 km

---

### 📕 Pour avancés

**VMA Longue**
- 25 min EF
- 6x 1000m (I) - 2min récup
- 15 min RC
- **Total :** 13 km

**Double Seuil**
- 20 min EF
- 2x 15 min (T) - 5min récup
- 10 min RC
- **Total :** 16 km

**Sortie Marathon**
- 5 km EF
- 20 km (M)
- 3 km RC
- **Total :** 28 km

---

## 🎬 Tutoriel vidéo (à venir)

1. **Ouvrir le modal** (0:10)
2. **Ajouter des étapes** (0:30)
3. **Configurer les répétitions** (0:50)
4. **Vérifier le résumé** (1:10)
5. **Enregistrer la séance** (1:20)

---

## 🌟 Fonctionnalités cachées

### Raccourcis clavier (à venir)

- `Ctrl + E` : Ajouter une étape
- `Ctrl + S` : Sauvegarder
- `Ctrl + W` : Fermer le modal
- `↑ ↓` : Naviguer entre les étapes
- `Delete` : Supprimer l'étape active

### Copier une séance existante (à venir)

1. Clic droit sur une séance
2. "Copier la structure"
3. Coller dans un autre jour

---

## 📱 Version mobile

L'interface s'adapte automatiquement :

- **Labels en colonnes** sur mobile
- **Boutons pleine largeur**
- **Scroll optimisé**
- **Touch-friendly** (pas besoin de hover)

---

## 🔄 Migration des anciennes séances

Les séances créées avec l'ancien modal **continuent de fonctionner**.

Pour les convertir en format structuré :
1. Double-clic sur la séance
2. Éditer et sauvegarder
3. La structure sera modernisée automatiquement

---

## 💾 Format d'export

Lors de l'export JSON, les séances structurées sont sauvegardées comme :

```json
{
  "type": "VMA Courte",
  "intensity": 4,
  "structure": {
    "echauffement": "20 min à 5:45/km",
    "bloc": "10x 400m à 3:50/km",
    "retourAuCalme": "15 min à 5:45/km"
  },
  "distance": 9.06,
  "isStructured": true,
  "steps": [
    {
      "id": "step-1641234567890",
      "type": "Échauffement",
      "durationType": "time",
      "duration": 20,
      "pace": "E",
      "repeat": 1
    },
    {
      "id": "step-1641234567891",
      "type": "VMA Courte",
      "durationType": "distance",
      "distance": 0.4,
      "pace": "R",
      "repeat": 10,
      "isRepeat": true
    }
  ]
}
```

---

## 🎯 Objectifs pédagogiques

Cette interface aide à :

✅ **Comprendre** la structure d'une séance
✅ **Planifier** précisément chaque étape
✅ **Visualiser** la charge totale
✅ **Progresser** méthodiquement
✅ **S'organiser** comme un pro

---

## 🏆 Meilleures pratiques

### ✅ À faire

- Toujours commencer par un échauffement (15-20 min)
- Terminer par un retour au calme (10-15 min)
- Espacer les répétitions avec une récupération suffisante
- Vérifier le résumé avant de sauvegarder
- Nommer clairement chaque étape

### ❌ À éviter

- Séances trop courtes (< 30 min)
- Trop de VMA sans récupération
- Oublier l'échauffement
- Répétitions trop longues sans récup
- Allures irréalistes

---

## 📚 Ressources complémentaires

### Liens utiles

- [Calculateur d'allures VDOT](https://runsmartproject.com/calculator/)
- [Guide des allures Jack Daniels](https://www.trainingpeaks.com/blog/daniels-running-formula/)
- [Tutoriel Garmin Connect](https://support.garmin.com/fr-FR/)

### Livres recommandés

- **Daniels' Running Formula** - Jack Daniels
- **Advanced Marathoning** - Pete Pfitzinger
- **80/20 Running** - Matt Fitzgerald

---

## 🎉 Conclusion

Avec ce nouveau modal structuré, vous pouvez créer des séances d'entraînement **professionnelles** en quelques clics, avec :

- 🎯 **Précision** au mètre et à la seconde
- 📊 **Calculs** automatiques
- 🔁 **Répétitions** intégrées
- 💡 **Interface** intuitive
- 🚀 **Gain de temps** considérable

**Prêt à créer votre première séance structurée ?** 🏃‍♂️💨

---

## 📞 Support

- 🐛 [Signaler un bug](https://github.com/imtheyoyo/plan-course/issues)
- 💬 [Poser une question](https://github.com/imtheyoyo/plan-course/discussions)
- ⭐ [Donner une étoile sur GitHub](https://github.com/imtheyoyo/plan-course)

---

**Version du guide :** 1.0
**Dernière mise à jour :** 11 janvier 2025
**Compatibilité :** Plan de Course V2.1+