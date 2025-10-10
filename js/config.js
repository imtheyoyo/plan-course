/**
 * ================================================
 * GENERATEUR DE PLAN DE COURSE V2.1 - CONFIGURATION
 * Version: 2.1.0
 * Build: 2025-01-10
 * ================================================
 */

const CONFIG = {
    version: '2.1.0',
    buildDate: '2025-01-10',
    generator: 'Claude (Anthropic)',
    
    // Noms des jours
    dayNames: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
    fullDayNames: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'],
    
    // Labels des allures
    paceLabels: {
        E: "Endurance",
        M: "Marathon",
        T: "Seuil",
        I: "Intervalle",
        R: "Répétition",
        C: "Course"
    },
    
    // Profils de coureur
    profiles: {
        beginner: {
            label: 'Débutant',
            qualityMultiplier: 0.8,
            buildRateMax: 1.08,
            recoveryFactor: 0.70
        },
        intermediate: {
            label: 'Intermédiaire',
            qualityMultiplier: 1.0,
            buildRateMax: 1.10,
            recoveryFactor: 0.65
        },
        advanced: {
            label: 'Avancé',
            qualityMultiplier: 1.2,
            buildRateMax: 1.12,
            recoveryFactor: 0.60
        }
    },
    
    // Facteurs d'intensité pour TSS
    intensityFactors: {
        1: 0.6,   // Endurance
        2: 0.75,  // Endurance+
        3: 0.95,  // Seuil
        4: 1.15   // VMA
    },
    
    // Configuration de l'affûtage
    taperConfig: {
        marathon: 3,      // 3 semaines
        halfMarathon: 2,  // 2 semaines
        short: 1          // 1 semaine
    },
    
    // Fréquence des tests (en semaines)
    testFrequency: 6,
    
    // Première semaine de test (après 5 semaines de préparation)
    firstTestWeek: 5,
    
    // Durée du plan
    planDuration: {
        min: 8,
        max: 40
    },
    
    // Distribution des footings
    distributionPatterns: {
        1: [1.0],
        2: [0.62, 0.38],
        3: [0.48, 0.32, 0.20],
        4: [0.38, 0.28, 0.20, 0.14],
        5: [0.32, 0.24, 0.18, 0.14, 0.12]
    },
    
    // Jours préférés pour les séances
    preferredDays: {
        vma: [1, 2],           // Lundi, Mardi
        threshold: [3, 4],     // Mercredi, Jeudi
        test: [2, 3, 4]        // Mardi, Mercredi, Jeudi
    }
};

// État global de l'application
const STATE = {
    currentPlanData: null,
    currentlyEditing: null,
    draggedItem: null
};

// Sélecteurs DOM (mis à jour au chargement)
const DOM = {};