/**
 * ================================================
 * js/core/progression.js - Algorithme de progression
 * ================================================
 */

const Progression = {
    /**
     * Calculer le kilométrage hebdomadaire cible
     */
    calculateTargetWeeklyKm(raceDistanceKm, vdot, runnerLevel) {
        let baseTarget;
        
        if (raceDistanceKm >= 42) {
            baseTarget = vdot < 45 ? 65 : (vdot < 55 ? 80 : 95);
        } else if (raceDistanceKm >= 21) {
            baseTarget = vdot < 45 ? 50 : (vdot < 55 ? 65 : 75);
        } else if (raceDistanceKm >= 10) {
            baseTarget = vdot < 45 ? 40 : (vdot < 55 ? 55 : 65);
        } else {
            baseTarget = vdot < 45 ? 35 : (vdot < 55 ? 45 : 55);
        }
        
        // Ajustement selon le niveau
        if (runnerLevel === 'beginner') baseTarget *= 0.85;
        if (runnerLevel === 'advanced') baseTarget *= 1.15;
        
        return baseTarget;
    },
    
    /**
     * Générer la configuration des semaines (kilométrage, tests, récupération)
     */
    generateWeekConfigs(weeks, currentKm, targetKm, profile, taperWeeks) {
        const configs = [];
        const weeksToTarget = weeks - taperWeeks;
        
        // Taux de croissance
        let buildRate = Math.pow(targetKm / currentKm, 1 / (weeksToTarget * 0.75));
        buildRate = Math.min(buildRate, profile.buildRateMax);
        
        let peakKm = currentKm;
        let lastBuildKm = currentKm;
        
        // Semaines de test
        const testWeeks = [];
        for (let i = CONFIG.firstTestWeek; i < weeksToTarget; i += CONFIG.testFrequency) {
            testWeeks.push(i);
        }
        
        // Phase de construction
        for (let i = 0; i < weeksToTarget; i++) {
            const weekInCycle = (i % 4) + 1;
            const isRecovery = weekInCycle === 4;
            let targetWeekKm;
            
            if (isRecovery) {
                targetWeekKm = lastBuildKm * profile.recoveryFactor;
            } else {
                const cycleProgress = weekInCycle / 3;
                const microLoad = 1 + (cycleProgress - 1) * 0.05;
                targetWeekKm = currentKm * microLoad;
                
                if (weekInCycle === 3) {
                    lastBuildKm = targetWeekKm;
                    currentKm *= buildRate;
                }
            }
            
            configs.push({
                km: targetWeekKm,
                isTest: testWeeks.includes(i) && !isRecovery,
                isRecovery: isRecovery
            });
            
            if (targetWeekKm > peakKm) peakKm = targetWeekKm;
        }
        
        // Phase d'affûtage
        const taperReductions = taperWeeks === 3 ? [0.25, 0.45, 0.70] :
                               taperWeeks === 2 ? [0.35, 0.65] : [0.60];
        
        for (let i = 0; i < taperWeeks; i++) {
            configs.push({
                km: Math.max(15, peakKm * (1 - taperReductions[i])),
                isRecovery: false,
                isTest: false
            });
        }
        
        return configs;
    },
    
    /**
     * Déterminer les phases du plan
     */
    calculatePhases(totalWeeks, raceDistanceKm) {
        const taperWeeks = raceDistanceKm >= 42 ? 3 : (raceDistanceKm >= 21 ? 2 : 1);
        const peakWeeks = Math.max(2, Math.floor(totalWeeks * 0.22));
        const qualityWeeks = Math.max(3, Math.floor(totalWeeks * 0.38));
        const baseWeeks = totalWeeks - taperWeeks - peakWeeks - qualityWeeks;
        
        return [
            { name: 'Fondation', weeks: baseWeeks, type: 'base' },
            { name: 'Qualité', weeks: qualityWeeks, type: 'quality' },
            { name: 'Pic', weeks: peakWeeks, type: 'peak' },
            { name: 'Affûtage', weeks: taperWeeks, type: 'taper' }
        ];
    }
};