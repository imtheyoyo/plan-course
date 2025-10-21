/**
 * ================================================
 * js/app.js - Application principale
 * ================================================
 * Orchestration de tous les modules
 * Point d'entrée de l'application
 * 
 * VERSION 2.2.2 - Correctif double réduction récupération
 * Date: 21 octobre 2025
 * 
 * CHANGELOG 2.2.2:
 * - BUG FIX #1: SmartPlacement avec vérification typeof + fallback
 * - BUG FIX #2: displayPlanStatistics() déplacée dans App
 * - BUG FIX #3: week.alerts au lieu de week.sessions.metadata.alerts
 * - BUG FIX #4: Metadata stockée dans week au lieu de finalSessions
 * - BUG FIX #5: Correction double réduction volume en récupération
 */

const App = {
    /**
     * Initialisation de l'application
     */
    init() {
        console.log(`🏃 Générateur de Plan de Course V${CONFIG.version}`);
        console.log(`📅 Build: ${CONFIG.buildDate}`);
        console.log(`🤖 Par: ${CONFIG.generator}`);
        
        // Initialiser les modules
        Forms.init();
        Interactions.setupModalListeners();
        Interactions.setupActionButtons();
        
        // Configurer le bouton de génération
        this.setupGenerateButton();
    },
    
    /**
     * Configurer le bouton de génération
     */
    setupGenerateButton() {
        document.querySelector('#generate-plan').addEventListener('click', () => {
            // Valider les données
            const validation = Forms.validate();
            
            if (!validation.valid) {
                alert(validation.error);
                return;
            }
            
            // Récupérer les données du formulaire
            const userInput = Forms.getFormData();
            
            // Générer le plan
            try {
                STATE.currentPlanData = this.generatePlan(userInput, validation.vdot);
                
                // Afficher
                Render.renderPlan(STATE.currentPlanData);
                Render.renderLoadChart(STATE.currentPlanData);
                Interactions.setupDragDrop();
                
                console.log('✅ Plan généré avec succès');
                
                // ✅ BUG FIX #2: Afficher statistiques SmartPlacement
                this.displayPlanStatistics(STATE.currentPlanData);
                
            } catch (error) {
                console.error('❌ Erreur lors de la génération:', error);
                alert('Erreur lors de la génération du plan. Consultez la console pour plus de détails.');
            }
        });
    },
    
    /**
     * ✅ BUG FIX #2: Fonction displayPlanStatistics déplacée dans App
     * Afficher les statistiques du plan après génération
     */
    displayPlanStatistics(planData) {
        console.log('\n📊 STATISTIQUES DU PLAN GÉNÉRÉ');
        console.log('═'.repeat(60));
        
        let totalAlerts = 0;
        let totalRecommendations = 0;
        let totalAdjustments = 0;
        
        planData.weeks.forEach((week, idx) => {
            // ✅ BUG FIX #3: Accéder directement à week.alerts
            const alerts = week.alerts || [];
            const recs = week.recommendations || [];
            
            if (alerts.length > 0 || recs.length > 0) {
                console.log(`\nSemaine ${idx + 1}:`);
                
                if (alerts.length > 0) {
                    console.log('  ⚠️ Alertes:', alerts);
                    totalAlerts += alerts.length;
                }
                
                if (recs.length > 0) {
                    console.log('  💡 Recommandations:', recs);
                    totalRecommendations += recs.length;
                }
            }
            
            // Compter les ajustements
            week.sessions.forEach(session => {
                if (session.adjusted) totalAdjustments++;
            });
        });
        
        console.log('\n📈 RÉSUMÉ:');
        console.log(`  Alertes: ${totalAlerts}`);
        console.log(`  Recommandations: ${totalRecommendations}`);
        console.log(`  Séances ajustées: ${totalAdjustments}`);
        console.log('═'.repeat(60));
    },
    
    /**
     * Générer le plan d'entraînement
     */
    generatePlan(userInput, vdot) {
        console.log('\n🎯 Génération du plan...');
        
        // 1. Calculer les allures
        const paces = PaceCalculator.calculateAllPaces(vdot);
        
        // 2. Configurer les phases
        const phases = this.setupPhases(userInput);
        
        // 3. Générer semaines avec progression
        const weeks = this.generateWeeks(phases, userInput, paces);
        
        // 4. ✅ BUG FIX #1: Appliquer SmartPlacement avec vérification
        let finalWeeks = weeks;
        
        // Vérifier que SmartPlacement existe ET est une fonction
        if (typeof SmartPlacement !== 'undefined' && 
            typeof SmartPlacement.optimizeWeeklyPlacement === 'function') {
            try {
                console.log('🧠 Application de SmartPlacement...');
                finalWeeks = weeks.map((week, weekIndex) => 
                    SmartPlacement.optimizeWeeklyPlacement(week, weekIndex, weeks, paces)
                );
                console.log('✅ SmartPlacement appliqué avec succès');
            } catch (error) {
                console.warn('⚠️ Erreur SmartPlacement, utilisation du placement basique:', error);
                finalWeeks = weeks;
            }
        } else {
            console.warn('⚠️ SmartPlacement non disponible, utilisation du placement basique');
        }
        
        return {
            userInput,
            vdot,
            paces,
            phases,
            weeks: finalWeeks
        };
    },
    
    /**
     * Configurer les phases d'entraînement
     */
    setupPhases(userInput) {
        const totalWeeks = userInput.duration;
        const raceDistance = userInput.raceDistance;
        
        // Distribution des phases selon la distance
        let distribution;
        if (raceDistance === '5km' || raceDistance === '10km') {
            distribution = { foundation: 0.30, quality: 0.40, peak: 0.20, taper: 0.10 };
        } else if (raceDistance === 'semi') {
            distribution = { foundation: 0.35, quality: 0.35, peak: 0.20, taper: 0.10 };
        } else { // marathon
            distribution = { foundation: 0.40, quality: 0.30, peak: 0.20, taper: 0.10 };
        }
        
        return [
            {
                name: 'Fondation',
                weeks: Math.floor(totalWeeks * distribution.foundation),
                focus: 'endurance',
                intensity: 'low'
            },
            {
                name: 'Qualité',
                weeks: Math.floor(totalWeeks * distribution.quality),
                focus: 'quality',
                intensity: 'medium'
            },
            {
                name: 'Pic',
                weeks: Math.floor(totalWeeks * distribution.peak),
                focus: 'race-specific',
                intensity: 'high'
            },
            {
                name: 'Affûtage',
                weeks: Math.ceil(totalWeeks * distribution.taper),
                focus: 'recovery',
                intensity: 'low'
            }
        ];
    },
    
    /**
     * Générer toutes les semaines
     */
    generateWeeks(phases, userInput, paces) {
        const weeks = [];
        let weekNumber = 1;
        let accumulatedLoad = 0;
        
        phases.forEach((phase, phaseIndex) => {
            for (let i = 0; i < phase.weeks; i++) {
                const progressInPhase = i / phase.weeks;
                const isRecoveryWeek = this.isRecoveryWeek(weekNumber);
                
                const week = this.generateWeek(
                    weekNumber,
                    phase,
                    progressInPhase,
                    isRecoveryWeek,
                    userInput,
                    paces,
                    accumulatedLoad
                );
                
                weeks.push(week);
                accumulatedLoad = week.totalTSS;
                weekNumber++;
            }
        });
        
        return weeks;
    },
    
    /**
     * Déterminer si c'est une semaine de récupération
     */
    isRecoveryWeek(weekNumber) {
        // Récupération toutes les 3-4 semaines
        return weekNumber % 4 === 0;
    },
    
    /**
     * Générer une semaine d'entraînement
     */
    generateWeek(weekNumber, phase, progress, isRecovery, userInput, paces, accumulatedLoad) {
        const level = userInput.level;
        const raceDistance = userInput.raceDistance;
        
        // Calculer le volume de base
        let baseVolume = this.calculateBaseVolume(userInput, phase, progress);
        
        // ✅ BUG FIX #5: Réduction unique pour récupération
        if (isRecovery) {
            baseVolume *= 0.70; // Une seule réduction de 30%
            console.log(`🔄 Semaine ${weekNumber} : Récupération (-30% volume)`);
        }
        
        // Sélectionner les séances
        const sessions = this.selectSessions(
            phase,
            progress,
            isRecovery,
            level,
            raceDistance,
            baseVolume,
            paces
        );
        
        // Calculer TSS et fatigue
        const totalTSS = this.calculateWeekTSS(sessions);
        const fatigue = this.calculateFatigue(totalTSS, accumulatedLoad);
        
        // ✅ BUG FIX #4: Stocker metadata dans week, pas dans sessions
        const week = {
            number: weekNumber,
            phase: phase.name,
            isRecovery,
            sessions,
            totalTSS,
            fatigue,
            // Metadata stockées au niveau de la semaine
            alerts: [],
            recommendations: [],
            adjustments: 0
        };
        
        return week;
    },
    
    /**
     * Calculer le volume de base hebdomadaire
     */
    calculateBaseVolume(userInput, phase, progress) {
        const baseKm = {
            'debutant': { '5km': 25, '10km': 30, 'semi': 40, 'marathon': 50 },
            'intermediaire': { '5km': 35, '10km': 45, 'semi': 60, 'marathon': 70 },
            'avance': { '5km': 50, '10km': 60, 'semi': 80, 'marathon': 100 }
        };
        
        let volume = baseKm[userInput.level][userInput.raceDistance];
        
        // Progression dans la phase
        if (phase.name === 'Fondation') {
            volume *= (0.70 + 0.30 * progress); // 70% → 100%
        } else if (phase.name === 'Qualité') {
            volume *= (0.90 + 0.10 * progress); // 90% → 100%
        } else if (phase.name === 'Pic') {
            volume *= (0.95 + 0.05 * progress); // 95% → 100%
        } else if (phase.name === 'Affûtage') {
            volume *= (0.80 - 0.30 * progress); // 80% → 50%
        }
        
        return Math.round(volume);
    },
    
    /**
     * Sélectionner les séances de la semaine
     */
    selectSessions(phase, progress, isRecovery, level, raceDistance, baseVolume, paces) {
        const sessions = [];
        
        // Configuration selon le niveau
        const config = {
            'debutant': { mainWorkouts: 1, easyRuns: 3 },
            'intermediaire': { mainWorkouts: 2, easyRuns: 3 },
            'avance': { mainWorkouts: 2, easyRuns: 4 }
        };
        
        const { mainWorkouts, easyRuns } = config[level];
        
        // Séance longue
        const longRunKm = this.calculateLongRunDistance(raceDistance, phase, progress, isRecovery);
        sessions.push({
            id: Utils.generateId(),
            type: 'long',
            name: 'Sortie longue',
            description: `${longRunKm} km allure E`,
            volume: longRunKm,
            intensity: 'E_low',
            tss: this.calculateSessionTSS(longRunKm, 'E_low', paces),
            steps: [{
                type: 'steady',
                duration: longRunKm * 1000,
                unit: 'distance',
                pace: 'E_low'
            }]
        });
        
        // Séances qualité
        if (!isRecovery) {
            for (let i = 0; i < mainWorkouts; i++) {
                const workout = this.createQualityWorkout(phase, progress, raceDistance, paces);
                sessions.push(workout);
            }
        }
        
        // Sorties faciles
        const remainingKm = baseVolume - longRunKm;
        const easyRunKm = Math.round(remainingKm / easyRuns);
        
        for (let i = 0; i < easyRuns; i++) {
            sessions.push({
                id: Utils.generateId(),
                type: 'easy',
                name: 'Sortie facile',
                description: `${easyRunKm} km récupération`,
                volume: easyRunKm,
                intensity: 'E_low',
                tss: this.calculateSessionTSS(easyRunKm, 'E_low', paces),
                steps: [{
                    type: 'steady',
                    duration: easyRunKm * 1000,
                    unit: 'distance',
                    pace: 'E_low'
                }]
            });
        }
        
        return sessions;
    },
    
    /**
     * Calculer la distance de sortie longue
     */
    calculateLongRunDistance(raceDistance, phase, progress, isRecovery) {
        const baseDistances = {
            '5km': { base: 10, max: 15 },
            '10km': { base: 12, max: 18 },
            'semi': { base: 15, max: 28 },
            'marathon': { base: 20, max: 35 }
        };
        
        const { base, max } = baseDistances[raceDistance];
        
        let distance;
        if (phase.name === 'Fondation' || phase.name === 'Qualité') {
            distance = base + (max - base) * progress;
        } else if (phase.name === 'Pic') {
            distance = max;
        } else { // Affûtage
            distance = base + (max - base) * (1 - progress);
        }
        
        if (isRecovery) {
            distance *= 0.80;
        }
        
        return Math.round(distance);
    },
    
    /**
     * Créer une séance de qualité
     */
    createQualityWorkout(phase, progress, raceDistance, paces) {
        // Bibliothèque de séances selon la phase
        const workouts = {
            'Fondation': [
                {
                    name: 'Fartlek progressif',
                    description: '8-12x 1min T + 1min récup',
                    type: 'fartlek',
                    steps: [
                        { type: 'warmup', duration: 15, unit: 'time', pace: 'E_low' },
                        { 
                            type: 'repeat',
                            reps: 10,
                            work: { duration: 60, unit: 'time', pace: 'T' },
                            recovery: { duration: 60, unit: 'time', pace: 'E_low', intensity: 'E_low' }
                        },
                        { type: 'cooldown', duration: 10, unit: 'time', pace: 'E_low' }
                    ]
                },
                {
                    name: 'Tempo court',
                    description: '20min allure M',
                    type: 'tempo',
                    steps: [
                        { type: 'warmup', duration: 15, unit: 'time', pace: 'E_low' },
                        { type: 'steady', duration: 20, unit: 'time', pace: 'M' },
                        { type: 'cooldown', duration: 10, unit: 'time', pace: 'E_low' }
                    ]
                }
            ],
            'Qualité': [
                {
                    name: 'Seuil',
                    description: '3x 10min T + 2min récup',
                    type: 'threshold',
                    steps: [
                        { type: 'warmup', duration: 15, unit: 'time', pace: 'E_low' },
                        {
                            type: 'repeat',
                            reps: 3,
                            work: { duration: 10, unit: 'time', pace: 'T' },
                            recovery: { duration: 2, unit: 'time', pace: 'E_low', intensity: 'E_low' }
                        },
                        { type: 'cooldown', duration: 10, unit: 'time', pace: 'E_low' }
                    ]
                },
                {
                    name: 'VMA courte',
                    description: '10x 400m I + 90sec récup',
                    type: 'interval',
                    steps: [
                        { type: 'warmup', duration: 20, unit: 'time', pace: 'E_low' },
                        {
                            type: 'repeat',
                            reps: 10,
                            work: { duration: 400, unit: 'distance', pace: 'I' },
                            recovery: { duration: 90, unit: 'time', pace: 'E_low', intensity: 'E_low' }
                        },
                        { type: 'cooldown', duration: 10, unit: 'time', pace: 'E_low' }
                    ]
                }
            ],
            'Pic': [
                {
                    name: 'Spécifique allure objectif',
                    description: '4x 2km allure objectif + 2min récup',
                    type: 'race-pace',
                    steps: [
                        { type: 'warmup', duration: 20, unit: 'time', pace: 'E_low' },
                        {
                            type: 'repeat',
                            reps: 4,
                            work: { duration: 2000, unit: 'distance', pace: this.getRacePace(raceDistance) },
                            recovery: { duration: 2, unit: 'time', pace: 'E_low', intensity: 'E_low' }
                        },
                        { type: 'cooldown', duration: 10, unit: 'time', pace: 'E_low' }
                    ]
                }
            ],
            'Affûtage': [
                {
                    name: 'Piqûres de rappel',
                    description: '6x 200m R + 200m récup',
                    type: 'sharpener',
                    steps: [
                        { type: 'warmup', duration: 15, unit: 'time', pace: 'E_low' },
                        {
                            type: 'repeat',
                            reps: 6,
                            work: { duration: 200, unit: 'distance', pace: 'R' },
                            recovery: { duration: 200, unit: 'distance', pace: 'E_low', intensity: 'E_low' }
                        },
                        { type: 'cooldown', duration: 10, unit: 'time', pace: 'E_low' }
                    ]
                }
            ]
        };
        
        const phaseWorkouts = workouts[phase.name];
        const selectedWorkout = phaseWorkouts[Math.floor(Math.random() * phaseWorkouts.length)];
        
        // Calculer volume et TSS
        const volume = this.calculateWorkoutVolume(selectedWorkout.steps, paces);
        const tss = this.calculateSessionTSS(volume, 'T', paces);
        
        return {
            id: Utils.generateId(),
            type: selectedWorkout.type,
            name: selectedWorkout.name,
            description: selectedWorkout.description,
            volume,
            intensity: 'T',
            tss,
            steps: selectedWorkout.steps
        };
    },
    
    /**
     * Déterminer l'allure objectif selon la distance
     */
    getRacePace(raceDistance) {
        const paceMap = {
            '5km': 'I',
            '10km': 'T',
            'semi': 'M',
            'marathon': 'M'
        };
        return paceMap[raceDistance];
    },
    
    /**
     * Calculer le TSS d'une semaine
     */
    calculateWeekTSS(sessions) {
        return sessions.reduce((total, session) => total + session.tss, 0);
    },
    
    /**
     * Calculer le TSS d'une séance
     */
    calculateSessionTSS(distance, intensity, paces) {
        const intensityFactors = {
            'E_low': 0.65,
            'E_high': 0.75,
            'M': 0.88,
            'T': 0.95,
            'I': 1.00,
            'R': 1.05
        };
        
        const durationMin = (distance * 1000) / paces[intensity] / 60;
        const IF = intensityFactors[intensity] || 0.70;
        
        return Math.round(durationMin * IF * IF * 100);
    },
    
    /**
     * Calculer la fatigue accumulée
     */
    calculateFatigue(currentTSS, accumulatedLoad) {
        const ATL = accumulatedLoad * 0.93 + currentTSS * 0.07; // Acute Training Load
        const CTL = accumulatedLoad * 0.98 + currentTSS * 0.02; // Chronic Training Load
        const TSB = CTL - ATL; // Training Stress Balance
        
        return {
            ATL: Math.round(ATL),
            CTL: Math.round(CTL),
            TSB: Math.round(TSB),
            status: TSB > 0 ? 'Frais' : TSB > -10 ? 'Optimal' : 'Fatigué'
        };
    },
    
    /**
     * Calculer le volume d'une séance
     */
    calculateWorkoutVolume(steps, paces) {
        let totalKm = 0;
        
        for (const step of steps) {
            if (step.type === 'repeat') {
                const workDist = step.work.unit === 'distance' 
                    ? step.work.duration / 1000 
                    : (step.work.duration * 60) / paces[step.work.pace] / 1000;
                
                const recDist = step.recovery.unit === 'distance'
                    ? step.recovery.duration / 1000
                    : (step.recovery.duration * 60) / paces[step.recovery.intensity] / 1000;
                
                totalKm += (workDist + recDist) * step.reps;
            } else {
                if (step.unit === 'distance') {
                    totalKm += step.duration / 1000;
                } else {
                    const min = step.duration;
                    const paceKey = step.pace === 'T' ? 'T' : 'E_low';
                    totalKm += (min * 60) / paces[paceKey] / 1000;
                }
            }
        }
        
        return Math.max(totalKm, 1);
    }
};

/**
 * ================================================
 * INITIALISATION AU CHARGEMENT
 * ================================================
 */
document.addEventListener('DOMContentLoaded', () => {
    App.init();
    console.log('✅ Application initialisée');
});
