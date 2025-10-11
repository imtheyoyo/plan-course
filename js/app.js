/**
 * ================================================
 * js/app.js - Application principale
 * ================================================
 * Orchestration de tous les modules
 * Point d'entrée de l'application
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
            } catch (error) {
                console.error('❌ Erreur lors de la génération:', error);
                alert('Erreur lors de la génération du plan. Consultez la console pour plus de détails.');
            }
        });
    },
    
    /**
     * Générer le plan complet
     */
    generatePlan(userInput, vdot) {
        const startDate = DateUtils.fromISO(userInput.startDate);
        const raceDate = DateUtils.fromISO(userInput.raceDate);
        const raceDistanceKm = parseFloat(userInput.raceDistance);
        const runnerLevel = userInput.runnerLevel;
        const currentKm = parseFloat(userInput.currentKm);
        
        // Ajuster au lundi
        const planStartDate = DateUtils.adjustToMonday(startDate);
        const totalWeeks = DateUtils.weeksBetween(planStartDate, raceDate);
        
        // Calculer les allures
        const paces = VDOT.getTrainingPaces(vdot, raceDistanceKm);
        
        // Obtenir le profil
        const profile = CONFIG.profiles[runnerLevel];
        
        // Calculer les phases
        const phases = Progression.calculatePhases(totalWeeks, raceDistanceKm);
        const taperWeeks = phases.find(p => p.type === 'taper').weeks;
        
        // Calculer le kilométrage cible
        const targetKm = Progression.calculateTargetWeeklyKm(raceDistanceKm, vdot, runnerLevel);
        
        // Générer les configurations de semaines
        const weekConfigs = Progression.generateWeekConfigs(
            totalWeeks,
            currentKm,
            targetKm,
            profile,
            taperWeeks
        );
        
        // Générer chaque semaine
        const plan = [];
        let weekOffset = 0;
        
        phases.forEach(phase => {
            let phaseWeekNumber = 0;
            
            for (let i = 0; i < phase.weeks; i++) {
                const weekStart = DateUtils.addDays(planStartDate, weekOffset * 7);
                const weekConfig = weekConfigs[weekOffset];
                
                const week = {
                    weekNumber: weekOffset + 1,
                    phase: phase.name,
                    startDate: weekStart,
                    totalKm: Math.round(weekConfig.km),
                    sessions: this.generateWeekSchedule({
                        weekNumber: weekOffset + 1,
                        phaseWeekNumber: phaseWeekNumber + 1,
                        totalPhaseWeeks: phase.weeks,
                        phaseType: phase.type,
                        trainingDays: userInput.trainingDays.map(d => parseInt(d)),
                        longRunDay: parseInt(userInput.longRunDay),
                        paces,
                        weeklyKm: weekConfig.km,
                        raceDistanceKm,
                        weekStartDate: weekStart,
                        isLastWeek: weekOffset === totalWeeks - 1,
                        isRecoveryWeek: weekConfig.isRecovery || false,
                        isTestWeek: weekConfig.isTest || false,
                        weeksUntilRace: totalWeeks - weekOffset,
                        runnerLevel,
                        profile
                    })
                };
                
                // Calculer le TSS de la semaine
                week.tss = week.sessions.reduce((sum, s) => sum + VDOT.calculateTSS(s, paces), 0);
                
                plan.push(week);
                weekOffset++;
                phaseWeekNumber++;
            }
        });
        
        return {
            plan,
            paces,
            userInput
        };
    },
    
    /**
     * Générer les séances d'une semaine
     */
    generateWeekSchedule(config) {
        const {
            weekNumber, phaseWeekNumber, totalPhaseWeeks, phaseType,
            trainingDays, longRunDay, paces, weeklyKm, raceDistanceKm,
            weekStartDate, isLastWeek, isRecoveryWeek, isTestWeek,
            runnerLevel, profile
        } = config;
        
        let allSessions = [];
        const finalSessions = [];
        
        // Semaine de course (dernière semaine)
        if (isLastWeek) {
            return this.generateRaceWeek(trainingDays, paces, weekStartDate);
        }
        
        // Créer le test si nécessaire (sera ajouté aux sessions dures)
        let testSession = null;
        if (isTestWeek) {
            testSession = {
                type: raceDistanceKm >= 21 ? '📊 Test 5km' : '📊 Test VMA (Demi-Cooper)',
                structure: {
                    echauffement: "20 min EF + 3 accélérations",
                    bloc: raceDistanceKm >= 21 
                        ? "5km à fond - Notez votre temps"
                        : "6 minutes à intensité maximale - Notez la distance",
                    retourAuCalme: "15 min RC très facile"
                },
                intensity: 4,
                isTest: true,
                distance: raceDistanceKm >= 21 ? 5 : 1.6
            };
        }
        
        // Nombre de séances de qualité
        let numQuality = 0;
        if (!isRecoveryWeek) {
            const baseQuality = phaseType === 'peak' && trainingDays.length >= 5 ? 2 :
                               ((phaseType === 'quality' || phaseType === 'peak') && trainingDays.length >= 4 ? 1 : 
                               (phaseType === 'base' && trainingDays.length >= 5 ? 1 : 0));
            numQuality = Math.floor(baseQuality * profile.qualityMultiplier);
        }
        
        // Générer séances de qualité
        const qualitySessions = this.generateQualitySessions(
            numQuality, phaseType, paces, weekNumber,
            raceDistanceKm, runnerLevel, phaseWeekNumber, totalPhaseWeeks
        );
        
        // Générer sortie longue
        const longRunSession = this.generateLongRun(
            weeklyKm, trainingDays.length, phaseType, isRecoveryWeek,
            paces, weekNumber, raceDistanceKm, phaseWeekNumber
        );
        
        // Générer footings
        const testKm = testSession ? testSession.distance : 0;
        const qualityKm = qualitySessions.reduce((sum, s) => sum + (s.distance || 0), 0);
        const longRunKm = longRunSession.km || 0;
        const remainingKm = Math.max(0, weeklyKm - longRunKm - qualityKm - testKm);
        
        const numEasy = Math.max(0, trainingDays.length - 1 - numQuality - (testSession ? 1 : 0));
        const easySessions = this.generateEasySessions(numEasy, remainingKm, longRunKm, isRecoveryWeek, paces);
        
        // Combiner toutes les séances
        allSessions = [
            ...(testSession ? [testSession] : []),
            ...qualitySessions,
            longRunSession,
            ...easySessions
        ];
        
        // Ajouter les structures manquantes
        allSessions.forEach(s => {
            if (!s.structure) {
                s.structure = this.getSessionStructure(s, paces, isRecoveryWeek);
            }
            if (!s.distance) {
                s.distance = this.calculateSessionDistance(s, paces);
            }
        });
        
        // Placer les séances dans les jours
        const availableDays = [...trainingDays];
        const assignedDays = new Set();
        
        // 1. Placer la sortie longue
        Placement.placeSession(longRunSession, longRunDay, availableDays, assignedDays, finalSessions);
        
        // 2. Placer les séances dures (qualité + test)
        const hardSessions = allSessions.filter(s => (s.intensity >= 3 || s.isTest) && !s.type.includes('Sortie Longue'))
            .sort((a, b) => (b.isTest ? 10 : b.intensity) - (a.isTest ? 10 : a.intensity));
        
        const remainingDays = Placement.placeHardSessions(hardSessions, availableDays.filter(d => !assignedDays.has(d)), assignedDays, finalSessions);
        
        // 3. Placer les footings
        const otherSessions = allSessions.filter(s => s.intensity < 3 && !s.type.includes('Sortie Longue'));
        Placement.placeEasySessions(otherSessions, remainingDays, finalSessions);
        
        // Ajouter les dates complètes
        finalSessions.forEach(s => {
            const sessionDate = DateUtils.addDays(weekStartDate, s.day);
            s.fullDate = `${CONFIG.fullDayNames[s.day]} ${DateUtils.format(sessionDate)}`;
        });
        
        return finalSessions.sort((a, b) => a.day - b.day);
    },
    
    /**
     * Générer les séances de qualité
     */
    generateQualitySessions(count, phase, paces, weekNumber, raceDistanceKm, runnerLevel, phaseWeekNumber, totalPhaseWeeks) {
        const sessions = [];
        const progressIndex = Math.min(2, Math.floor((phaseWeekNumber - 1) / Math.max(1, totalPhaseWeeks / 3)));
        
        // Sélectionner la bibliothèque appropriée
        let library;
        if (runnerLevel === 'beginner') library = BeginnerSessions;
        else if (runnerLevel === 'intermediate') library = IntermediateSessions;
        else library = AdvancedSessions;
        
        for (let i = 0; i < count; i++) {
            const workoutIndex = (weekNumber + i) % (library[phase]?.length || 1);
            const session = library.getSession(phase, workoutIndex, progressIndex, paces, raceDistanceKm);
            
            if (session) {
                session.distance = library.calculateDistance(session, paces);
                sessions.push(session);
            }
        }
        
        return sessions;
    },
    
    /**
     * Générer la sortie longue
     */
    generateLongRun(weeklyKm, numTrainingDays, phase, isRecovery, paces, weekNumber, raceDistanceKm, phaseWeekNumber) {
        const percentage = numTrainingDays <= 3 ? 0.38 : (numTrainingDays === 4 ? 0.33 : 0.28);
        
        let cap;
        if (raceDistanceKm >= 42) cap = Math.min(35, 20 + Math.floor(weekNumber / 2));
        else if (raceDistanceKm >= 21) cap = Math.min(24, 14 + Math.floor(weekNumber / 2));
        else if (raceDistanceKm >= 10) cap = Math.min(16, 10 + Math.floor(weekNumber / 3));
        else cap = Math.min(12, 8 + Math.floor(weekNumber / 3));
        
        let km = Math.round(Math.min(weeklyKm * percentage, cap));
        if (isRecovery) km = Math.round(km * 0.8);
        
        // Sortie longue spécifique en phase de pic
        if (phase === 'peak' && !isRecovery && km >= 15 && raceDistanceKm >= 21) {
            const finishKm = Math.min(Math.floor(km * 0.25), raceDistanceKm >= 42 ? 10 : 6);
            return {
                type: 'Sortie Longue Spécifique',
                km,
                intensity: 3,
                structure: {
                    bloc: `${Formatters.formatDuration((km - finishKm) * (paces.E_low / 60))} EF + ${Formatters.formatDuration(finishKm * (paces.M / 60))} à ${Formatters.secondsToPace(paces.M)}`
                }
            };
        }
        
        // Sortie longue progressive
        if (phase === 'quality' && phaseWeekNumber % 3 === 0 && km >= 12) {
            return {
                type: 'Sortie Longue Progressive',
                km,
                intensity: 2,
                structure: {
                    bloc: `Démarrer ${Formatters.secondsToPace(paces.E_low)} → Finir ${Formatters.secondsToPace(paces.E_high)} (${Formatters.formatDuration(km * (paces.E_low / 60))})`
                }
            };
        }
        
        // Sortie longue classique
        return {
            type: isRecovery ? 'Sortie Longue Allégée' : 'Sortie Longue',
            km,
            intensity: 2
        };
    },
    
    /**
     * Générer les footings
     */
    generateEasySessions(count, totalKm, longRunKm, isRecovery, paces) {
        if (count === 0) return [];
        
        const ratios = CONFIG.distributionPatterns[count] || Array(count).fill(1 / count);
        let kms = ratios.map(r => totalKm * r);
        
        // Ajuster si le premier footing est trop proche de la sortie longue
        if (kms[0] >= longRunKm * 0.85) {
            const excess = kms[0] - (longRunKm * 0.70);
            kms[0] = longRunKm * 0.70;
            if (kms.length > 1) {
                for (let i = 1; i < kms.length; i++) {
                    kms[i] += excess / (kms.length - 1);
                }
            }
        }
        
        return kms.map((km, index) => ({
            type: index === 0 && count > 1 ? 'Sortie Moyenne' : (isRecovery ? 'Footing Régénération' : 'Footing'),
            km: Math.round(km),
            intensity: 1
        }));
    },
    
    /**
     * Générer la semaine de course
     */
    generateRaceWeek(trainingDays, paces, weekStartDate) {
        const raceDay = (new Date(DOM.raceDate.value).getDay() + 6) % 7;
        const finalSessions = [];
        
        finalSessions.push({
            type: `COURSE - ${DOM.raceDistance.options[DOM.raceDistance.selectedIndex].text}`,
            structure: { bloc: "Bonne chance ! 🏁" },
            intensity: 4,
            day: raceDay,
            distance: parseFloat(DOM.raceDistance.value)
        });
        
        const activationSession = {
            type: 'Activation',
            structure: {
                echauffement: "15 min EF + 4 lignes droites",
                bloc: "6x 100m accélérations progressives",
                recuperation: "100m marche",
                retourAuCalme: "10 min RC"
            },
            intensity: 2,
            distance: 5
        };
        
        const reminderSession = {
            type: 'Rappel Court',
            structure: {
                echauffement: "15 min EF",
                bloc: `3x 2 min à ${Formatters.secondsToPace(paces.C)}`,
                recuperation: "90 sec trot",
                retourAuCalme: "10 min RC"
            },
            intensity: 3,
            distance: 4
        };
        
        const recoverySession = {
            type: 'Décrassage',
            structure: {
                bloc: `25 min facile (${Formatters.secondsToPace(paces.E_high)})`
            },
            intensity: 1,
            distance: 3
        };
        
        // Placer les séances avant la course
        if (raceDay >= 5) {
            const schedule = [
                { session: reminderSession, offset: -5 },
                { session: activationSession, offset: -3 },
                { session: recoverySession, offset: -1 }
            ];
            
            schedule.forEach(({ session, offset }) => {
                const targetDay = raceDay + offset;
                if (targetDay >= 0 && trainingDays.includes(targetDay)) {
                    session.day = targetDay;
                    finalSessions.push(session);
                }
            });
        } else {
            let availableDays = trainingDays.filter(d => d < raceDay).sort((a, b) => b - a);
            [reminderSession, activationSession, recoverySession].forEach(session => {
                if (availableDays.length > 0) {
                    session.day = availableDays.shift();
                    finalSessions.push(session);
                }
            });
        }
        
        // Ajouter les dates
        finalSessions.forEach(s => {
            const sessionDate = DateUtils.addDays(weekStartDate, s.day);
            s.fullDate = `${CONFIG.fullDayNames[s.day]} ${DateUtils.format(sessionDate)}`;
        });
        
        return finalSessions.sort((a, b) => a.day - b.day);
    },
    
    /**
     * Obtenir la structure d'une séance basique
     */
    getSessionStructure(session, paces, isRecovery) {
        if (session.structure) return session.structure;
        
        const paceSec = isRecovery ? paces.E_high : paces.E_low;
        const duration = Math.round(session.km * (paceSec / 60));
        const paceStr = `(~${Formatters.secondsToPace(paceSec)})`;
        
        switch (session.type) {
            case 'Footing':
            case 'Sortie Moyenne':
                return { bloc: `${Formatters.formatDuration(duration)} en Endurance ${paceStr}` };
            case 'Footing Régénération':
                return { bloc: `${Formatters.formatDuration(duration)} très facile (${Formatters.secondsToPace(paces.E_high)})` };
            case 'Sortie Longue':
                return { bloc: `${Formatters.formatDuration(duration)} en Endurance ${paceStr}` };
            case 'Sortie Longue Allégée':
                return { bloc: `${Formatters.formatDuration(duration)} facile (${Formatters.secondsToPace(paces.E_high)})` };
            default:
                return { bloc: "Détails non spécifiés" };
        }
    },
    
    /**
     * Calculer la distance d'une séance
     */
    calculateSessionDistance(session, paces) {
        if (session.km) return session.km;
        if (session.distance) return session.distance;
        if (!session.structure) return 0;
        
        let totalKm = 0;
        const { echauffement, bloc, recuperation, retourAuCalme } = session.structure;
        
        // Échauffement
        if (echauffement) {
            const min = parseInt(echauffement);
            if (!isNaN(min)) {
                totalKm += (min * 60) / paces.E_low / 1000;
            }
        }
        
        // Retour au calme
        if (retourAuCalme) {
            const min = parseInt(retourAuCalme);
            if (!isNaN(min)) {
                totalKm += (min * 60) / paces.E_low / 1000;
            }
        }
        
        // Bloc principal
        if (bloc) {
            // km direct
            if (bloc.includes('km') && !bloc.includes('x')) {
                const kmMatch = bloc.match(/(\d+)km/);
                if (kmMatch) totalKm += parseInt(kmMatch[1]);
            }
            // Répétitions
            else if (bloc.match(/(\d+)\s*x\s*(\d+(\.\d+)?)\s*(m|min)/)) {
                const match = bloc.match(/(\d+)\s*x\s*(\d+(\.\d+)?)\s*(m|min)/);
                const [_, reps, val, , unit] = match;
                
                if (unit === 'm') {
                    totalKm += (parseInt(reps) * parseFloat(val)) / 1000;
                } else {
                    const paceKey = session.intensity === 4 ? 'I' : 'T';
                    totalKm += parseInt(reps) * (parseFloat(val) * 60) / paces[paceKey] / 1000;
                }
                
                // Récupération
                if (recuperation && parseInt(reps) > 1) {
                    const recupMatch = recuperation.match(/(\d+(\.\d+)?)\s*(m|min|sec)/);
                    if (recupMatch) {
                        const [_, recupVal, , recupUnit] = recupMatch;
                        const recupNum = parseFloat(recupVal);
                        
                        if (recupUnit === 'm') {
                            totalKm += (parseInt(reps) - 1) * recupNum / 1000;
                        } else if (recupUnit === 'min') {
                            totalKm += (parseInt(reps) - 1) * (recupNum * 60) / paces.E_high / 1000;
                        } else if (recupUnit === 'sec') {
                            totalKm += (parseInt(reps) - 1) * recupNum / paces.E_high / 1000;
                        }
                    } else {
                        totalKm += (parseInt(reps) - 1) * 0.2;
                    }
                }
            }
            // Minutes continues
            else {
                const match = bloc.match(/(\d+)\s*min/);
                if (match) {
                    const min = parseInt(match[1]);
                    const paceKey = session.intensity === 3 ? 'T' : 'E_low';
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
