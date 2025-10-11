// ============================================================================
// SESSION MANAGER V9 - OPTIMISÉ AVEC DIAGNOSTIC
// ============================================================================
// Gestion complète des séances avec validation des allures et debug amélioré
// Basé sur le diagnostic: allures correctement calculées (E: 6:13/km, M: 5:01/km)

import { formatPace, formatDistance } from '../utils/formatters.js';

class SessionManager {
  constructor() {
    this.sessions = [];
    this.paces = null;
    this.debugMode = false; // Activable via window.DEBUG = true
  }

  // ========================================================================
  // INITIALISATION & CONFIGURATION
  // ========================================================================

  initialize(paces) {
    this.paces = paces;
    this.validatePaces();
    
    if (this.debugMode) {
      console.group('🏃 SessionManager initialized');
      this.debugPaces();
      console.groupEnd();
    }
  }

  // ========================================================================
  // VALIDATION DES ALLURES
  // ========================================================================

  validatePaces() {
    if (!this.paces) {
      console.error('❌ Aucune allure définie');
      return false;
    }

    const required = ['E_low', 'E_high', 'M', 'T', 'I', 'R'];
    const missing = required.filter(key => !this.paces[key]);
    
    if (missing.length > 0) {
      console.error(`❌ Allures manquantes: ${missing.join(', ')}`);
      return false;
    }

    // Vérifier la cohérence (R < I < T < M < E_high < E_low)
    const order = ['R', 'I', 'T', 'M', 'E_high', 'E_low'];
    for (let i = 0; i < order.length - 1; i++) {
      const current = this.paces[order[i]];
      const next = this.paces[order[i + 1]];
      
      if (current >= next) {
        // Parser l'allure - utiliser E_low/E_high au lieu de juste 'E'
        const paces = SessionManager.currentPaces;
        if (!paces) {
            step.pace = 'E';
            return step;
        }
        
        // Tester chaque allure disponible
        if (paces.R && description.includes(Formatters.secondsToPace(paces.R))) step.pace = 'R';
        else if (paces.I && description.includes(Formatters.secondsToPace(paces.I))) step.pace = 'I';
        else if (paces.T && description.includes(Formatters.secondsToPace(paces.T))) step.pace = 'T';
        else if (paces.M && description.includes(Formatters.secondsToPace(paces.M))) step.pace = 'M';
        else if (paces.C && description.includes(Formatters.secondsToPace(paces.C))) step.pace = 'C';
        else if (paces.E_high && description.includes(Formatters.secondsToPace(paces.E_high))) step.pace = 'E';
        else if (paces.E_low && description.includes(Formatters.secondsToPace(paces.E_low))) step.pace = 'E';
        else step.pace = 'E'; // Défaut sur endurance
        
        return step;
    },
    
    /**
     * Parser une description de récupération
     */
    parseRecoveryFromDescription(description) {
        const recovery = {
            type: 'time',
            value: 90,
            unit: 'sec',
            intensity: 'none'
        };
        
        // Parser le temps (ex: "90 sec", "2 min")
        const timeSecMatch = description.match(/(\d+)\s*sec/i);
        if (timeSecMatch) {
            recovery.type = 'time';
            recovery.value = parseInt(timeSecMatch[1]);
            recovery.unit = 'sec';
        }
        
        const timeMinMatch = description.match(/(\d+)\s*min/i);
        if (timeMinMatch && !timeSecMatch) {
            recovery.type = 'time';
            recovery.value = parseInt(timeMinMatch[1]);
            recovery.unit = 'min';
        }
        
        // Parser la distance (ex: "200m", "0.4km")
        const distanceMetersMatch = description.match(/(\d+)\s*m(?!\s*min)/i);
        if (distanceMetersMatch) {
            recovery.type = 'distance';
            recovery.value = parseInt(distanceMetersMatch[1]);
            recovery.unit = 'm';
        }
        
        const distanceKmMatch = description.match(/(\d+(?:\.\d+)?)\s*km/i);
        if (distanceKmMatch && !distanceMetersMatch) {
            recovery.type = 'distance';
            recovery.value = parseFloat(distanceKmMatch[1]);
            recovery.unit = 'km';
        }
        
        // Parser l'intensité - utiliser le mapping correct
        const paces = SessionManager.currentPaces;
        if (!paces) {
            recovery.intensity = 'none';
            return recovery;
        }
        
        // Tester chaque allure disponible
        if (paces.E_low && description.includes(Formatters.secondsToPace(paces.E_low))) {
            recovery.intensity = 'E';
        } else if (paces.E_high && description.includes(Formatters.secondsToPace(paces.E_high))) {
            recovery.intensity = 'E';
        } else if (paces.M && description.includes(Formatters.secondsToPace(paces.M))) {
            recovery.intensity = 'M';
        } else if (paces.T && description.includes(Formatters.secondsToPace(paces.T))) {
            recovery.intensity = 'T';
        } else if (description.includes('trot')) {
            recovery.intensity = 'none';
        }
        
        return recovery;console.warn(
          `⚠️ Incohérence allures: ${order[i]} (${formatPace(current)}) ` +
          `devrait être plus rapide que ${order[i + 1]} (${formatPace(next)})`
        );
      }
    }

    return true;
  }

  // ========================================================================
  // DEBUG & DIAGNOSTICS
  // ========================================================================

  debugPaces(label = 'Allures actuelles') {
    console.group(`📊 ${label}`);
    console.table({
      'Récupération (R)': formatPace(this.paces.R),
      'Intervalle (I)': formatPace(this.paces.I),
      'Tempo (T)': formatPace(this.paces.T),
      'Marathon (M)': formatPace(this.paces.M),
      'Endurance haute (E_high)': formatPace(this.paces.E_high),
      'Endurance basse (E_low)': formatPace(this.paces.E_low)
    });
    console.groupEnd();
  }

  debugSession(session) {
    console.group(`🔍 Détails séance: ${session.name}`);
    console.log('Type:', session.type);
    console.log('Durée:', session.duration, 'min');
    console.log('Distance:', session.distance ? formatDistance(session.distance) : 'N/A');
    
    if (session.steps && session.steps.length > 0) {
      console.log('Étapes:');
      session.steps.forEach((step, i) => {
        console.log(`  ${i + 1}. ${step.description}`);
      });
    }
    
    console.groupEnd();
  }

  // ========================================================================
  // CRÉATION DE SÉANCES
  // ========================================================================

  createSession(type, params = {}) {
    const sessionTemplates = {
      'endurance': this.createEnduranceSession.bind(this),
      'vma': this.createVMASession.bind(this),
      'seuil': this.createThresholdSession.bind(this),
      'sortie_longue': this.createLongRunSession.bind(this),
      'recuperation': this.createRecoverySession.bind(this),
      'test': this.createTestSession.bind(this)
    };

    const creator = sessionTemplates[type];
    if (!creator) {
      console.error(`❌ Type de séance inconnu: ${type}`);
      return null;
    }

    const session = creator(params);
    
    if (this.debugMode) {
      this.debugSession(session);
    }

    return session;
  }

  // ========================================================================
  // TEMPLATES DE SÉANCES
  // ========================================================================

  createEnduranceSession(params) {
    const duration = params.duration || 45;
    const pace = params.useHighPace ? this.paces.E_high : this.paces.E_low;
    const distance = (duration * 60) / pace; // en mètres

    return {
      id: this.generateId(),
      type: 'endurance',
      name: `Endurance ${duration}min`,
      duration,
      distance: Math.round(distance),
      intensity: 'facile',
      steps: [
        {
          type: 'warmup',
          duration: 10,
          pace: this.paces.E_low,
          description: `Échauffement ${formatPace(this.paces.E_low)}`
        },
        {
          type: 'main',
          duration: duration - 10,
          pace,
          description: `Allure ${formatPace(pace)}`
        }
      ]
    };
  }

  createVMASession(params) {
    const repCount = params.repCount || 8;
    const repDuration = params.repDuration || 30; // secondes
    const recoveryDuration = params.recoveryDuration || repDuration;

    return {
      id: this.generateId(),
      type: 'vma',
      name: `VMA ${repCount}x${repDuration}"`,
      duration: 15 + Math.ceil((repCount * (repDuration + recoveryDuration)) / 60),
      intensity: 'difficile',
      steps: [
        {
          type: 'warmup',
          duration: 15,
          pace: this.paces.E_low,
          description: `Échauffement 15min à ${formatPace(this.paces.E_low)}`
        },
        {
          type: 'interval',
          repetitions: repCount,
          workDuration: repDuration,
          workPace: this.paces.I,
          recoveryDuration,
          recoveryPace: this.paces.R,
          description: `${repCount} × ${repDuration}" à ${formatPace(this.paces.I)} (récup ${recoveryDuration}" à ${formatPace(this.paces.R)})`
        },
        {
          type: 'cooldown',
          duration: 10,
          pace: this.paces.E_low,
          description: `Retour au calme 10min`
        }
      ]
    };
  }

  createThresholdSession(params) {
    const blocks = params.blocks || 2;
    const blockDuration = params.blockDuration || 10; // minutes
    const recoveryDuration = params.recoveryDuration || 3;

    return {
      id: this.generateId(),
      type: 'seuil',
      name: `Seuil ${blocks}×${blockDuration}min`,
      duration: 15 + (blocks * blockDuration) + ((blocks - 1) * recoveryDuration) + 10,
      intensity: 'modéré',
      steps: [
        {
          type: 'warmup',
          duration: 15,
          pace: this.paces.E_low,
          description: `Échauffement 15min`
        },
        {
          type: 'tempo',
          repetitions: blocks,
          workDuration: blockDuration * 60,
          workPace: this.paces.T,
          recoveryDuration: recoveryDuration * 60,
          recoveryPace: this.paces.E_low,
          description: `${blocks} × ${blockDuration}min à ${formatPace(this.paces.T)} (récup ${recoveryDuration}min)`
        },
        {
          type: 'cooldown',
          duration: 10,
          pace: this.paces.E_low,
          description: `Retour au calme 10min`
        }
      ]
    };
  }

  createLongRunSession(params) {
    const duration = params.duration || 90;
    const progressiveEnd = params.progressive || false;
    
    const steps = [
      {
        type: 'warmup',
        duration: 15,
        pace: this.paces.E_low,
        description: `Début tranquille 15min à ${formatPace(this.paces.E_low)}`
      }
    ];

    if (progressiveEnd) {
      steps.push(
        {
          type: 'main',
          duration: duration - 30,
          pace: this.paces.E_high,
          description: `Allure stable ${duration - 30}min à ${formatPace(this.paces.E_high)}`
        },
        {
          type: 'progressive',
          duration: 15,
          startPace: this.paces.E_high,
          endPace: this.paces.M,
          description: `Finish progressif 15min (${formatPace(this.paces.E_high)} → ${formatPace(this.paces.M)})`
        }
      );
    } else {
      steps.push({
        type: 'main',
        duration: duration - 15,
        pace: this.paces.E_high,
        description: `Allure constante ${duration - 15}min à ${formatPace(this.paces.E_high)}`
      });
    }

    const distance = (duration * 60) / this.paces.E_high;

    return {
      id: this.generateId(),
      type: 'sortie_longue',
      name: `Sortie longue ${duration}min`,
      duration,
      distance: Math.round(distance),
      intensity: 'modéré',
      steps
    };
  }

  createRecoverySession(params) {
    const duration = params.duration || 30;
    const distance = (duration * 60) / this.paces.E_low;

    return {
      id: this.generateId(),
      type: 'recuperation',
      name: `Récupération ${duration}min`,
      duration,
      distance: Math.round(distance),
      intensity: 'très_facile',
      steps: [
        {
          type: 'easy',
          duration,
          pace: this.paces.E_low,
          description: `Course très facile ${formatPace(this.paces.E_low)} - Privilégier les sensations`
        }
      ]
    };
  }

  createTestSession(params) {
    const distance = params.distance || 5000; // 5km par défaut
    const estimatedTime = distance / this.paces.T; // Estimation à allure seuil
    const duration = Math.ceil(estimatedTime / 60);

    return {
      id: this.generateId(),
      type: 'test',
      name: `Test ${formatDistance(distance)}`,
      duration: 15 + duration + 10,
      distance,
      intensity: 'difficile',
      isTest: true,
      steps: [
        {
          type: 'warmup',
          duration: 15,
          pace: this.paces.E_low,
          description: `Échauffement complet 15min + accélérations`
        },
        {
          type: 'test',
          distance,
          targetPace: this.paces.T,
          description: `Test ${formatDistance(distance)} - Effort maximal contrôlé`
        },
        {
          type: 'cooldown',
          duration: 10,
          pace: this.paces.E_low,
          description: `Retour au calme 10min`
        }
      ]
    };
  }

  // ========================================================================
  // GESTION DES SESSIONS
  // ========================================================================

  addSession(session) {
    this.sessions.push(session);
    return session.id;
  }

  getSession(id) {
    return this.sessions.find(s => s.id === id);
  }

  updateSession(id, updates) {
    const session = this.getSession(id);
    if (!session) {
      console.error(`❌ Séance introuvable: ${id}`);
      return null;
    }

    Object.assign(session, updates);
    
    if (this.debugMode) {
      console.log(`✅ Séance mise à jour: ${id}`);
      this.debugSession(session);
    }

    return session;
  }

  deleteSession(id) {
    const index = this.sessions.findIndex(s => s.id === id);
    if (index === -1) {
      console.error(`❌ Séance introuvable: ${id}`);
      return false;
    }

    this.sessions.splice(index, 1);
    return true;
  }

  // ========================================================================
  // STATISTIQUES
  // ========================================================================

  getWeeklyStats(week) {
    const weekSessions = this.sessions.filter(s => s.week === week);
    
    return {
      totalDuration: weekSessions.reduce((sum, s) => sum + s.duration, 0),
      totalDistance: weekSessions.reduce((sum, s) => sum + (s.distance || 0), 0),
      sessionCount: weekSessions.length,
      intensityBreakdown: this.getIntensityBreakdown(weekSessions)
    };
  }

  getIntensityBreakdown(sessions) {
    const breakdown = {
      'très_facile': 0,
      'facile': 0,
      'modéré': 0,
      'difficile': 0
    };

    sessions.forEach(s => {
      breakdown[s.intensity] = (breakdown[s.intensity] || 0) + s.duration;
    });

    return breakdown;
  }

  // ========================================================================
  // UTILITAIRES
  // ========================================================================

  generateId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  exportSessions() {
    return {
      sessions: this.sessions,
      paces: this.paces,
      exportDate: new Date().toISOString()
    };
  }

  importSessions(data) {
    if (!data.sessions || !data.paces) {
      console.error('❌ Format de données invalide');
      return false;
    }

    this.sessions = data.sessions;
    this.paces = data.paces;
    
    console.log(`✅ ${this.sessions.length} séances importées`);
    return true;
  }
}

// ============================================================================
// EXPORT & UTILISATION
// ============================================================================

export default SessionManager;

// Exemple d'utilisation:
/*
import SessionManager from './sessionManager.js';

const manager = new SessionManager();

// Activer le debug
window.DEBUG = true;
manager.debugMode = true;

// Initialiser avec les allures du diagnostic
manager.initialize({
  E_low: 372.89,   // 6:13/km
  E_high: 338.65,  // 5:39/km
  M: 301.28,       // 5:01/km
  T: 281.82,       // 4:42/km
  I: 260.50,       // 4:21/km
  R: 390           // 6:30/km (estimation)
});

// Créer une séance d'endurance
const session1 = manager.createSession('endurance', { duration: 45 });

// Créer une séance de VMA
const session2 = manager.createSession('vma', {
  repCount: 10,
  repDuration: 30,
  recoveryDuration: 30
});

// Créer une sortie longue avec finish progressif
const session3 = manager.createSession('sortie_longue', {
  duration: 90,
  progressive: true
});

// Obtenir les stats
console.log(manager.getWeeklyStats(1));
*/
