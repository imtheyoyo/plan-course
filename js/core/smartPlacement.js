/**
 * ================================================
 * js/core/smartPlacement.js - Placement Intelligent avec Règles Expertes
 * ================================================
 * Version: 1.0.0
 * Date: 16 octobre 2025
 * 
 * SYSTÈME DE RÈGLES EXPERTES POUR OPTIMISATION DU PLACEMENT DES SÉANCES
 * 
 * Améliore placement.js avec :
 * - Score de fatigue dynamique
 * - Règles de récupération intelligentes
 * - Détection de surcharge
 * - Variations automatiques
 * - Alertes et recommandations
 */

const SmartPlacement = {
    /**
     * ================================================
     * CONFIGURATION DES RÈGLES
     * ================================================
     */
    config: {
        // Seuils de fatigue (0-100)
        fatigueThresholds: {
            fresh: 20,      // < 20 : Frais
            normal: 40,     // 20-40 : Normal
            tired: 60,      // 40-60 : Fatigué
            exhausted: 80   // 60-80 : Épuisé
            // > 80 : Surcharge
        },
        
        // Points de fatigue par intensité
        fatiguePoints: {
            1: 10,   // Endurance
            2: 15,   // Endurance+
            3: 35,   // Seuil
            4: 50    // VMA
        },
        
        // Récupération par jour (points retirés)
        recoveryRate: {
            rest: 25,           // Jour de repos complet
            easy: 15,           // Footing récupération
            afterHard: 20       // Jour suivant séance dure
        },
        
        // Délais minimum entre séances (en jours)
        minRecoveryDays: {
            vma_vma: 2,         // VMA → VMA : 2 jours
            vma_threshold: 1,   // VMA → Seuil : 1 jour
            threshold_vma: 1,   // Seuil → VMA : 1 jour
            threshold_threshold: 1, // Seuil → Seuil : 1 jour
            test_any: 2,        // Test → Tout : 2 jours
            any_test: 2         // Tout → Test : 2 jours
        },
        
        // Seuils TSS hebdomadaire
        weeklyTSSLimits: {
            beginner: { warning: 350, critical: 450 },
            intermediate: { warning: 450, critical: 600 },
            advanced: { warning: 550, critical: 750 }
        },
        
        // Variation dans les séances similaires (%)
        variationRange: { min: 0.85, max: 1.15 }
    },
    
    /**
     * ================================================
     * MODULE 1 : SCORE DE FATIGUE
     * ================================================
     */
    
    /**
     * Calculer le score de fatigue pour chaque jour de la semaine
     */
    calculateWeekFatigue(sessions, availableDays) {
        const fatigue = {};
        
        // Initialiser tous les jours
        for (let day = 0; day < 7; day++) {
            fatigue[day] = 0;
        }
        
        // Simuler la fatigue cumulative jour par jour
        let currentFatigue = 0;
        
        for (let day = 0; day < 7; day++) {
            // Trouver séance ce jour
            const session = sessions.find(s => s.day === day);
            
            if (session) {
                // Ajouter fatigue de la séance
                const points = this.config.fatiguePoints[session.intensity] || 10;
                currentFatigue += points;
                
                // Facteur d'accumulation si déjà fatigué
                if (currentFatigue > this.config.fatigueThresholds.tired) {
                    currentFatigue *= 1.2; // +20% si déjà fatigué
                }
            } else {
                // Jour de repos : récupération
                if (availableDays.includes(day)) {
                    // Jour disponible mais pas de séance = récupération active
                    currentFatigue = Math.max(0, currentFatigue - this.config.recoveryRate.easy);
                } else {
                    // Jour non disponible = repos complet
                    currentFatigue = Math.max(0, currentFatigue - this.config.recoveryRate.rest);
                }
            }
            
            // Récupération passive (toujours)
            if (currentFatigue > 0) {
                currentFatigue = Math.max(0, currentFatigue - 5);
            }
            
            fatigue[day] = Math.round(currentFatigue);
        }
        
        return fatigue;
    },
    
    /**
     * Obtenir le niveau de fatigue (texte)
     */
    getFatigueLevel(fatigueScore) {
        const t = this.config.fatigueThresholds;
        if (fatigueScore >= 80) return 'surcharge';
        if (fatigueScore >= t.exhausted) return 'exhausted';
        if (fatigueScore >= t.tired) return 'tired';
        if (fatigueScore >= t.normal) return 'normal';
        return 'fresh';
    },
    
    /**
     * ================================================
     * MODULE 2 : RÈGLES DE PLACEMENT
     * ================================================
     */
    
    /**
     * Évaluer la qualité d'un placement (0-100)
     */
    evaluatePlacement(session, day, placedSessions, fatigue, availableDays) {
        let score = 100;
        
        // RÈGLE 1 : Fatigue actuelle
        const fatigueLevel = this.getFatigueLevel(fatigue[day]);
        if (session.intensity >= 3) {
            if (fatigueLevel === 'exhausted') score -= 40;
            else if (fatigueLevel === 'tired') score -= 20;
            else if (fatigueLevel === 'fresh') score += 10;
        }
        
        // RÈGLE 2 : Récupération depuis dernière séance dure
        const lastHardSession = this.findLastHardSession(day, placedSessions);
        if (lastHardSession && session.intensity >= 3) {
            const daysSince = day - lastHardSession.day;
            const minDays = this.getMinRecoveryDays(lastHardSession, session);
            
            if (daysSince < minDays) {
                score -= 30;
            } else if (daysSince === minDays) {
                score -= 10;
            } else {
                score += 5;
            }
        }
        
        // RÈGLE 3 : Éviter séances intenses consécutives
        const prevDay = placedSessions.find(s => s.day === day - 1);
        const nextDay = placedSessions.find(s => s.day === day + 1);
        
        if (session.intensity >= 3) {
            if (prevDay && prevDay.intensity >= 3) score -= 25;
            if (nextDay && nextDay.intensity >= 3) score -= 25;
        }
        
        // RÈGLE 4 : Tests nécessitent préparation
        if (session.isTest) {
            // Préférer milieu de semaine
            if (day >= 2 && day <= 4) score += 15;
            
            // Éviter après longue sortie
            const yesterday = placedSessions.find(s => s.day === day - 1);
            if (yesterday && yesterday.type?.includes('Longue')) score -= 20;
        }
        
        // RÈGLE 5 : Jours préférés selon type
        if (session.intensity === 4) {
            // VMA : préférer début semaine
            if (CONFIG.preferredDays.vma.includes(day)) score += 10;
        } else if (session.intensity === 3 && !session.isTest) {
            // Seuil : préférer milieu semaine
            if (CONFIG.preferredDays.threshold.includes(day)) score += 10;
        }
        
        // RÈGLE 6 : Éviter lundi si possible (sauf si nécessaire)
        if (day === 0 && session.intensity >= 3) {
            score -= 5;
        }
        
        // RÈGLE 7 : Répartition équilibrée dans la semaine
        const placedDays = placedSessions.map(s => s.day);
        const gaps = this.calculateGaps(placedDays, availableDays);
        const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
        
        // Pénaliser si crée un déséquilibre
        const newGaps = this.calculateGaps([...placedDays, day], availableDays);
        const newAvgGap = newGaps.reduce((a, b) => a + b, 0) / newGaps.length;
        const variance = Math.abs(newAvgGap - avgGap);
        
        if (variance > 2) score -= 10;
        
        return Math.max(0, score);
    },
    
    /**
     * Trouver la dernière séance dure avant un jour
     */
    findLastHardSession(day, sessions) {
        const hardSessions = sessions
            .filter(s => s.day < day && (s.intensity >= 3 || s.isTest))
            .sort((a, b) => b.day - a.day);
        
        return hardSessions[0] || null;
    },
    
    /**
     * Obtenir délai minimum entre deux types de séances
     */
    getMinRecoveryDays(session1, session2) {
        const type1 = session1.isTest ? 'test' : 
                     (session1.intensity === 4 ? 'vma' : 'threshold');
        const type2 = session2.isTest ? 'test' : 
                     (session2.intensity === 4 ? 'vma' : 'threshold');
        
        const key = `${type1}_${type2}`;
        return this.config.minRecoveryDays[key] || 
               this.config.minRecoveryDays[`${type2}_${type1}`] || 
               1;
    },
    
    /**
     * Calculer les écarts entre jours de séances
     */
    calculateGaps(days, availableDays) {
        if (days.length <= 1) return [0];
        
        const sorted = [...days].sort((a, b) => a - b);
        const gaps = [];
        
        for (let i = 1; i < sorted.length; i++) {
            gaps.push(sorted[i] - sorted[i - 1]);
        }
        
        return gaps;
    },
    
    /**
     * ================================================
     * MODULE 3 : PLACEMENT OPTIMISÉ
     * ================================================
     */
    
    /**
     * Placer toutes les séances avec optimisation
     */
    placeAllSessions(allSessions, availableDays, longRunDay) {
        const finalSessions = [];
        const assignedDays = new Set();
        
        // 1. Placer sortie longue en premier (priorité absolue)
        const longRun = allSessions.find(s => s.type?.includes('Sortie Longue'));
        if (longRun && availableDays.includes(longRunDay)) {
            longRun.day = longRunDay;
            finalSessions.push(longRun);
            assignedDays.add(longRunDay);
        }
        
        // 2. Calculer fatigue initiale
        let fatigue = this.calculateWeekFatigue(finalSessions, availableDays);
        
        // 3. Séparer séances dures et faciles
        const remainingSessions = allSessions.filter(s => !s.type?.includes('Sortie Longue'));
        const hardSessions = remainingSessions
            .filter(s => s.intensity >= 3 || s.isTest)
            .sort((a, b) => {
                // Prioriser : tests > VMA > seuil
                if (a.isTest) return -1;
                if (b.isTest) return 1;
                return b.intensity - a.intensity;
            });
        
        const easySessions = remainingSessions.filter(s => s.intensity < 3);
        
        // 4. Placer séances dures avec optimisation
        for (const session of hardSessions) {
            const bestDay = this.findBestDay(
                session, 
                availableDays.filter(d => !assignedDays.has(d)),
                finalSessions,
                fatigue
            );
            
            if (bestDay !== null) {
                session.day = bestDay;
                finalSessions.push(session);
                assignedDays.add(bestDay);
                
                // Recalculer fatigue
                fatigue = this.calculateWeekFatigue(finalSessions, availableDays);
            }
        }
        
        // 5. Placer séances faciles
        const remainingDays = availableDays
            .filter(d => !assignedDays.has(d))
            .sort((a, b) => {
                // Préférer jours avec fatigue basse
                return fatigue[a] - fatigue[b];
            });
        
        easySessions
            .sort((a, b) => (b.km || b.distance || 0) - (a.km || a.distance || 0))
            .forEach(session => {
                const day = remainingDays.shift();
                if (day !== undefined) {
                    session.day = day;
                    finalSessions.push(session);
                }
            });
        
        return finalSessions.sort((a, b) => a.day - b.day);
    },
    
    /**
     * Trouver le meilleur jour pour une séance
     */
    findBestDay(session, availableDays, placedSessions, fatigue) {
        if (availableDays.length === 0) return null;
        
        let bestDay = null;
        let bestScore = -1;
        
        for (const day of availableDays) {
            const score = this.evaluatePlacement(
                session, 
                day, 
                placedSessions, 
                fatigue,
                availableDays
            );
            
            if (score > bestScore) {
                bestScore = score;
                bestDay = day;
            }
        }
        
        return bestDay;
    },
    
    /**
     * ================================================
     * MODULE 4 : DÉTECTION ET ALERTES
     * ================================================
     */
    
    /**
     * Analyser la semaine et générer alertes
     */
    analyzeWeek(weekData, runnerLevel, paces) {
        const alerts = [];
        const recommendations = [];
        
        // Calculer TSS total
        let totalTSS = 0;
        weekData.sessions.forEach(session => {
            totalTSS += VDOT.calculateTSS(session, paces);
        });
        
        // ALERTE 1 : TSS trop élevé
        const limits = this.config.weeklyTSSLimits[runnerLevel];
        if (totalTSS > limits.critical) {
            alerts.push({
                type: 'critical',
                title: '⚠️ Surcharge critique',
                message: `TSS de ${totalTSS} dépasse largement la limite (${limits.critical}). Risque de blessure élevé !`,
                action: 'Réduire intensité ou supprimer une séance dure'
            });
        } else if (totalTSS > limits.warning) {
            alerts.push({
                type: 'warning',
                title: '⚡ Charge élevée',
                message: `TSS de ${totalTSS} est élevé (limite conseillée : ${limits.warning})`,
                action: 'Surveillez la récupération'
            });
        }
        
        // ALERTE 2 : Séances intenses trop rapprochées
        const hardSessions = weekData.sessions
            .filter(s => s.intensity >= 3)
            .sort((a, b) => a.day - b.day);
        
        for (let i = 1; i < hardSessions.length; i++) {
            const gap = hardSessions[i].day - hardSessions[i - 1].day;
            if (gap < 2) {
                alerts.push({
                    type: 'warning',
                    title: '🔴 Récupération insuffisante',
                    message: `${hardSessions[i - 1].type} (${CONFIG.fullDayNames[hardSessions[i - 1].day]}) et ${hardSessions[i].type} (${CONFIG.fullDayNames[hardSessions[i].day]}) trop proches`,
                    action: 'Espacer de 48h minimum'
                });
            }
        }
        
        // ALERTE 3 : Manque de variété
        const types = weekData.sessions.map(s => s.type);
        const uniqueTypes = new Set(types);
        if (types.length - uniqueTypes.size >= 2) {
            recommendations.push({
                type: 'info',
                title: '💡 Variété limitée',
                message: 'Plusieurs séances identiques cette semaine',
                action: 'Varier les types de séances améliore la progression'
            });
        }
        
        // ALERTE 4 : Pas de séance de qualité (si phase quality/peak)
        if (weekData.phase !== 'Fondation' && weekData.phase !== 'Affûtage') {
            const hasQuality = weekData.sessions.some(s => s.intensity >= 3);
            if (!hasQuality && !weekData.isRecoveryWeek) {
                recommendations.push({
                    type: 'info',
                    title: '📊 Manque d\'intensité',
                    message: `Phase ${weekData.phase} sans séance de qualité`,
                    action: 'Ajouter une séance de seuil ou VMA'
                });
            }
        }
        
        // RECOMMANDATION 1 : Répartition déséquilibrée
        const gaps = this.calculateGaps(
            weekData.sessions.map(s => s.day),
            weekData.sessions.map(s => s.day)
        );
        const maxGap = Math.max(...gaps);
        const minGap = Math.min(...gaps);
        
        if (maxGap - minGap > 3) {
            recommendations.push({
                type: 'info',
                title: '⚖️ Répartition irrégulière',
                message: `Écart entre séances varie de ${minGap} à ${maxGap} jours`,
                action: 'Répartir plus uniformément si possible'
            });
        }
        
        return { alerts, recommendations, tss: totalTSS };
    },
    
    /**
     * ================================================
     * MODULE 5 : VARIATIONS AUTOMATIQUES
     * ================================================
     */
    
    /**
     * Appliquer variations aux séances similaires
     */
    applyVariations(allWeeks) {
        const sessionHistory = new Map(); // Type → count
        
        allWeeks.forEach(week => {
            week.sessions.forEach(session => {
                const baseType = session.type?.split(' ')[0]; // Ex: "VMA" de "VMA Courte"
                
                if (session.intensity >= 3 && baseType) {
                    const count = sessionHistory.get(baseType) || 0;
                    sessionHistory.set(baseType, count + 1);
                    
                    // Varier tous les 2-3 occurrences
                    if (count > 0 && count % 2 === 0) {
                        this.varySession(session, count);
                    }
                }
            });
        });
        
        return allWeeks;
    },
    
    /**
     * Varier une séance
     */
    varySession(session, occurrenceCount) {
        if (!session.structure) return;
        
        const variation = (occurrenceCount % 4) === 2 ? 
            this.config.variationRange.min : 
            this.config.variationRange.max;
        
        // Varier le bloc principal
        if (session.structure.bloc) {
            const bloc = session.structure.bloc;
            
            // Varier répétitions
            const repsMatch = bloc.match(/(\d+)x/);
            if (repsMatch) {
                const originalReps = parseInt(repsMatch[1]);
                const newReps = Math.round(originalReps * variation);
                session.structure.bloc = bloc.replace(
                    /(\d+)x/, 
                    `${newReps}x`
                );
            }
            
            // Varier durée si en minutes
            const minMatch = bloc.match(/(\d+)\s*min/);
            if (minMatch) {
                const originalMin = parseInt(minMatch[1]);
                const newMin = Math.round(originalMin * variation);
                session.structure.bloc = bloc.replace(
                    /(\d+)\s*min/,
                    `${newMin} min`
                );
            }
        }
        
        // Ajouter note de variation
        if (!session.notes) session.notes = [];
        session.notes.push(`🔄 Variante ${variation > 1 ? '+' : '-'}${Math.abs(Math.round((variation - 1) * 100))}%`);
    },
    
    /**
     * ================================================
     * API PUBLIQUE - Fonction principale
     * ================================================
     */
    
    /**
     * Placer intelligemment toutes les séances d'une semaine
     * 
     * @param {Array} allSessions - Toutes les séances à placer
     * @param {Array} availableDays - Jours disponibles [0-6]
     * @param {Number} longRunDay - Jour de la sortie longue
     * @param {Object} weekData - Données de la semaine (phase, etc.)
     * @param {String} runnerLevel - Niveau coureur
     * @param {Object} paces - Allures calculées
     * @returns {Object} { sessions, alerts, recommendations, fatigue, tss }
     */
    optimizeWeek(allSessions, availableDays, longRunDay, weekData, runnerLevel, paces) {
        // 1. Placer toutes les séances
        const placedSessions = this.placeAllSessions(
            allSessions, 
            availableDays, 
            longRunDay
        );
        
        // 2. Calculer fatigue finale
        const fatigue = this.calculateWeekFatigue(placedSessions, availableDays);
        
        // 3. Analyser et générer alertes
        const analysis = this.analyzeWeek(
            { ...weekData, sessions: placedSessions },
            runnerLevel,
            paces
        );
        
        // 4. Logger résultats
        console.log(`📊 Semaine ${weekData.weekNumber} optimisée:`);
        console.log(`   TSS: ${analysis.tss}`);
        console.log(`   Fatigue max: ${Math.max(...Object.values(fatigue))}`);
        console.log(`   Alertes: ${analysis.alerts.length}`);
        
        return {
            sessions: placedSessions,
            alerts: analysis.alerts,
            recommendations: analysis.recommendations,
            fatigue: fatigue,
            tss: analysis.tss
        };
    }
};

/**
 * ================================================
 * EXPORT GLOBAL
 * ================================================
 */
if (typeof window !== 'undefined') {
    window.SmartPlacement = SmartPlacement;
}

/**
 * ================================================
 * UTILISATION DANS APP.JS
 * ================================================
 * 
 * Remplacer dans generateWeekSchedule() :
 * 
 * // AVANT (ligne ~300)
 * const finalSessions = [];
 * Placement.placeSession(...);
 * Placement.placeHardSessions(...);
 * Placement.placeEasySessions(...);
 * 
 * // APRÈS
 * const optimized = SmartPlacement.optimizeWeek(
 *     allSessions,
 *     availableDays,
 *     longRunDay,
 *     {
 *         weekNumber,
 *         phase: phaseType,
 *         isRecoveryWeek,
 *         totalKm: weeklyKm
 *     },
 *     runnerLevel,
 *     paces
 * );
 * 
 * const finalSessions = optimized.sessions;
 * week.alerts = optimized.alerts;
 * week.recommendations = optimized.recommendations;
 * week.fatigue = optimized.fatigue;
 * 
 * ================================================
 */
