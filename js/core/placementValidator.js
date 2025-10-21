/**
 * ================================================
 * js/core/placementValidator.js - Validation placement séances
 * ================================================
 * Valide l'agencement des séances pour éviter le surentraînement
 * et optimiser la récupération
 * 
 * VERSION 1.0.0
 * Date: 21 octobre 2025
 */

const PlacementValidator = {
    /**
     * Règles de placement selon le niveau
     */
    RULES: {
        'debutant': {
            minRestBetweenQuality: 72,      // 3 jours entre qualité
            minRestAfterLong: 48,            // 2 jours après sortie longue
            maxConsecutiveDays: 2,           // Max 2 jours consécutifs
            minRestPerWeek: 2,               // Min 2 jours de repos
            maxQualityPerWeek: 1             // Max 1 séance qualité
        },
        'intermediaire': {
            minRestBetweenQuality: 48,      // 2 jours entre qualité
            minRestAfterLong: 24,            // 1 jour après sortie longue
            maxConsecutiveDays: 3,           // Max 3 jours consécutifs
            minRestPerWeek: 1,               // Min 1 jour de repos
            maxQualityPerWeek: 2             // Max 2 séances qualité
        },
        'avance': {
            minRestBetweenQuality: 48,      // 2 jours entre qualité
            minRestAfterLong: 24,            // 1 jour après sortie longue
            maxConsecutiveDays: 4,           // Max 4 jours consécutifs
            minRestPerWeek: 1,               // Min 1 jour de repos
            maxQualityPerWeek: 3             // Max 3 séances qualité
        }
    },

    /**
     * Valider le placement des séances dans une semaine
     * @param {Array} schedule - Planning de la semaine [0-6]
     * @param {String} level - Niveau du coureur
     * @returns {Object} Résultat de validation avec erreurs et avertissements
     */
    validateWeekSchedule(schedule, level) {
        const rules = this.RULES[level];
        const result = {
            valid: true,
            errors: [],
            warnings: [],
            recommendations: [],
            score: 100  // Score de qualité du placement (0-100)
        };

        // Analyser le planning
        const analysis = this.analyzeSchedule(schedule);

        // 1. RÈGLES STRICTES (bloquantes)
        this.checkStrictRules(schedule, analysis, rules, result);

        // 2. AVERTISSEMENTS (non bloquants mais importants)
        this.checkWarnings(schedule, analysis, rules, result);

        // 3. RECOMMANDATIONS (optimisations)
        this.checkRecommendations(schedule, analysis, rules, result);

        // Calculer le score final
        result.score = this.calculateScore(result);

        return result;
    },

    /**
     * Analyser le planning de la semaine
     */
    analyzeSchedule(schedule) {
        const analysis = {
            qualitySessions: [],
            longRuns: [],
            easySessions: [],
            restDays: [],
            consecutiveTrainingDays: [],
            qualityCount: 0,
            totalSessions: 0
        };

        let consecutiveCount = 0;
        let consecutiveStart = -1;

        schedule.forEach((session, dayIndex) => {
            if (!session || session.type === 'rest') {
                analysis.restDays.push(dayIndex);
                
                // Enregistrer la séquence de jours consécutifs
                if (consecutiveCount > 0) {
                    analysis.consecutiveTrainingDays.push({
                        start: consecutiveStart,
                        end: dayIndex - 1,
                        count: consecutiveCount
                    });
                }
                consecutiveCount = 0;
                consecutiveStart = -1;
            } else {
                analysis.totalSessions++;
                
                if (consecutiveStart === -1) {
                    consecutiveStart = dayIndex;
                }
                consecutiveCount++;

                if (session.type === 'quality' || session.intensity === 'I' || 
                    session.intensity === 'T' || session.intensity === 'R') {
                    analysis.qualitySessions.push({ day: dayIndex, session });
                    analysis.qualityCount++;
                } else if (session.type === 'long') {
                    analysis.longRuns.push({ day: dayIndex, session });
                } else {
                    analysis.easySessions.push({ day: dayIndex, session });
                }
            }
        });

        // Dernière séquence si elle va jusqu'à la fin
        if (consecutiveCount > 0) {
            analysis.consecutiveTrainingDays.push({
                start: consecutiveStart,
                end: 6,
                count: consecutiveCount
            });
        }

        return analysis;
    },

    /**
     * Vérifier les règles strictes
     */
    checkStrictRules(schedule, analysis, rules, result) {
        // Règle 1: Espacement entre séances de qualité
        if (analysis.qualitySessions.length >= 2) {
            for (let i = 0; i < analysis.qualitySessions.length - 1; i++) {
                const day1 = analysis.qualitySessions[i].day;
                const day2 = analysis.qualitySessions[i + 1].day;
                const daysBetween = (day2 - day1) * 24;

                if (daysBetween < rules.minRestBetweenQuality) {
                    result.valid = false;
                    result.errors.push({
                        type: 'QUALITY_TOO_CLOSE',
                        severity: 'error',
                        message: `⛔ Séances de qualité trop rapprochées (${this.getDayName(day1)} et ${this.getDayName(day2)}). Minimum ${rules.minRestBetweenQuality}h requis.`,
                        days: [day1, day2],
                        suggestion: `Espacer d'au moins ${rules.minRestBetweenQuality / 24} jours`
                    });
                }
            }
        }

        // Règle 2: Repos après sortie longue
        analysis.longRuns.forEach(longRun => {
            const nextDay = longRun.day + 1;
            if (nextDay < 7) {
                const nextSession = schedule[nextDay];
                if (nextSession && (nextSession.type === 'quality' || nextSession.intensity === 'I' || nextSession.intensity === 'T')) {
                    const hoursRest = 24;
                    if (hoursRest < rules.minRestAfterLong) {
                        result.valid = false;
                        result.errors.push({
                            type: 'QUALITY_AFTER_LONG',
                            severity: 'error',
                            message: `⛔ Séance de qualité le ${this.getDayName(nextDay)} trop proche de la sortie longue du ${this.getDayName(longRun.day)}. Minimum ${rules.minRestAfterLong}h de repos requis.`,
                            days: [longRun.day, nextDay],
                            suggestion: 'Placer un jour de repos ou une séance facile après la sortie longue'
                        });
                    }
                }
            }
        });

        // Règle 3: Jours consécutifs d'entraînement
        analysis.consecutiveTrainingDays.forEach(sequence => {
            if (sequence.count > rules.maxConsecutiveDays) {
                result.valid = false;
                result.errors.push({
                    type: 'TOO_MANY_CONSECUTIVE',
                    severity: 'error',
                    message: `⛔ ${sequence.count} jours d'entraînement consécutifs (du ${this.getDayName(sequence.start)} au ${this.getDayName(sequence.end)}). Maximum ${rules.maxConsecutiveDays} jours conseillé pour votre niveau.`,
                    days: [sequence.start, sequence.end],
                    suggestion: `Ajouter un jour de repos dans cette séquence`
                });
            }
        });

        // Règle 4: Nombre de jours de repos minimum
        if (analysis.restDays.length < rules.minRestPerWeek) {
            result.valid = false;
            result.errors.push({
                type: 'INSUFFICIENT_REST',
                severity: 'error',
                message: `⛔ Seulement ${analysis.restDays.length} jour(s) de repos. Minimum ${rules.minRestPerWeek} jour(s) requis pour votre niveau.`,
                days: [],
                suggestion: 'Ajouter des jours de repos pour favoriser la récupération'
            });
        }

        // Règle 5: Nombre maximum de séances de qualité
        if (analysis.qualityCount > rules.maxQualityPerWeek) {
            result.valid = false;
            result.errors.push({
                type: 'TOO_MANY_QUALITY',
                severity: 'error',
                message: `⛔ ${analysis.qualityCount} séances de qualité prévues. Maximum ${rules.maxQualityPerWeek} recommandé pour votre niveau.`,
                days: analysis.qualitySessions.map(q => q.day),
                suggestion: 'Remplacer certaines séances de qualité par des sorties faciles'
            });
        }
    },

    /**
     * Vérifier les avertissements
     */
    checkWarnings(schedule, analysis, rules, result) {
        // Avertissement 1: Qualité en début de semaine après week-end chargé
        if (schedule[0] && schedule[0].type === 'quality') {
            const sunday = schedule[6];
            if (sunday && sunday.type === 'long') {
                result.warnings.push({
                    type: 'QUALITY_MONDAY_AFTER_LONG_SUNDAY',
                    severity: 'warning',
                    message: `⚠️ Séance de qualité le lundi après une sortie longue le dimanche. Risque de fatigue résiduelle.`,
                    days: [0, 6],
                    suggestion: 'Placer une séance facile le lundi et reporter la qualité à mardi/mercredi'
                });
            }
        }

        // Avertissement 2: Sortie longue après qualité récente
        analysis.longRuns.forEach(longRun => {
            const prevDay = longRun.day - 1;
            if (prevDay >= 0) {
                const prevSession = schedule[prevDay];
                if (prevSession && (prevSession.type === 'quality' || prevSession.intensity === 'I')) {
                    result.warnings.push({
                        type: 'LONG_AFTER_QUALITY',
                        severity: 'warning',
                        message: `⚠️ Sortie longue le ${this.getDayName(longRun.day)} juste après une séance de qualité. Les jambes peuvent être fatiguées.`,
                        days: [prevDay, longRun.day],
                        suggestion: 'Laisser au moins 24h de récupération facile entre ces séances'
                    });
                }
            }
        });

        // Avertissement 3: Absence de séance facile entre deux intenses
        for (let i = 0; i < 5; i++) {
            const current = schedule[i];
            const next = schedule[i + 2];
            const between = schedule[i + 1];

            if (current && next && 
                (current.type === 'quality' || current.type === 'long') &&
                (next.type === 'quality' || next.type === 'long') &&
                (!between || between.type === 'rest')) {
                
                result.warnings.push({
                    type: 'MISSING_ACTIVE_RECOVERY',
                    severity: 'warning',
                    message: `⚠️ Jour de repos complet entre deux séances intenses (${this.getDayName(i)} et ${this.getDayName(i + 2)}). Une récupération active serait plus bénéfique.`,
                    days: [i, i + 1, i + 2],
                    suggestion: 'Remplacer le repos par une sortie facile de 30-40 min pour favoriser la récupération active'
                });
            }
        }
    },

    /**
     * Générer des recommandations d'optimisation
     */
    checkRecommendations(schedule, analysis, rules, result) {
        // Recommandation 1: Placement optimal des séances de qualité
        const optimalQualityDays = [1, 3, 5]; // Mardi, Jeudi, Samedi
        analysis.qualitySessions.forEach(quality => {
            if (!optimalQualityDays.includes(quality.day)) {
                result.recommendations.push({
                    type: 'OPTIMAL_QUALITY_PLACEMENT',
                    message: `💡 Les séances de qualité sont optimales les mardis, jeudis et samedis (actuellement: ${this.getDayName(quality.day)})`,
                    days: [quality.day],
                    suggestion: `Déplacer vers ${this.getDayName(optimalQualityDays[0])} ou ${this.getDayName(optimalQualityDays[1])}`
                });
            }
        });

        // Recommandation 2: Sortie longue le dimanche
        const longOnSunday = analysis.longRuns.some(lr => lr.day === 6);
        if (!longOnSunday && analysis.longRuns.length > 0) {
            result.recommendations.push({
                type: 'LONG_RUN_SUNDAY',
                message: `💡 La sortie longue est traditionnellement placée le dimanche pour plus de disponibilité`,
                days: analysis.longRuns.map(lr => lr.day),
                suggestion: 'Déplacer la sortie longue au dimanche'
            });
        }

        // Recommandation 3: Distribution équilibrée
        const firstHalf = schedule.slice(0, 3).filter(s => s && s.type !== 'rest').length;
        const secondHalf = schedule.slice(4, 7).filter(s => s && s.type !== 'rest').length;
        const imbalance = Math.abs(firstHalf - secondHalf);
        
        if (imbalance > 2) {
            result.recommendations.push({
                type: 'BALANCED_DISTRIBUTION',
                message: `💡 Charge déséquilibrée: ${firstHalf} séances en début de semaine, ${secondHalf} en fin de semaine`,
                days: [],
                suggestion: 'Répartir plus équitablement les séances sur la semaine'
            });
        }

        // Recommandation 4: Récupération active
        if (analysis.restDays.length > rules.minRestPerWeek + 1) {
            result.recommendations.push({
                type: 'ACTIVE_RECOVERY',
                message: `💡 ${analysis.restDays.length} jours de repos. Certains pourraient être remplacés par de la récupération active`,
                days: analysis.restDays,
                suggestion: 'Remplacer 1-2 jours de repos par des sorties très faciles de 20-30 min'
            });
        }
    },

    /**
     * Calculer le score de qualité du placement (0-100)
     */
    calculateScore(result) {
        let score = 100;

        // Pénalités pour erreurs
        score -= result.errors.length * 25;

        // Pénalités pour avertissements
        score -= result.warnings.length * 10;

        // Bonus pour peu de recommandations
        if (result.recommendations.length === 0) {
            score += 10;
        } else {
            score -= result.recommendations.length * 3;
        }

        return Math.max(0, Math.min(100, score));
    },

    /**
     * Obtenir le nom d'un jour
     */
    getDayName(dayIndex) {
        const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
        return days[dayIndex];
    },

    /**
     * Suggérer un placement optimal automatique
     */
    suggestOptimalPlacement(sessions, level, trainingDays) {
        const rules = this.RULES[level];
        const suggestions = {
            quality: [],
            long: [],
            easy: [],
            rest: []
        };

        // Identifier les types de séances
        const qualitySessions = sessions.filter(s => s.type === 'quality' || s.intensity === 'I' || s.intensity === 'T');
        const longRuns = sessions.filter(s => s.type === 'long');
        const easySessions = sessions.filter(s => s.type === 'easy' || s.type === 'recovery');

        // Placements optimaux par défaut
        const optimalDays = {
            quality: [1, 3, 5],  // Mardi, Jeudi, Samedi
            long: [6],           // Dimanche
            easy: [0, 2, 4]      // Lundi, Mercredi, Vendredi
        };

        // Filtrer selon jours disponibles
        const availableQualityDays = optimalDays.quality.filter(d => trainingDays.includes(d));
        const availableLongDays = optimalDays.long.filter(d => trainingDays.includes(d));
        const availableEasyDays = optimalDays.easy.filter(d => trainingDays.includes(d));

        // Placer les séances de qualité
        qualitySessions.slice(0, Math.min(qualitySessions.length, rules.maxQualityPerWeek))
            .forEach((session, index) => {
                if (availableQualityDays[index] !== undefined) {
                    suggestions.quality.push({
                        session,
                        day: availableQualityDays[index],
                        reason: 'Placement optimal avec récupération'
                    });
                }
            });

        // Placer la sortie longue
        if (longRuns.length > 0 && availableLongDays.length > 0) {
            suggestions.long.push({
                session: longRuns[0],
                day: availableLongDays[0],
                reason: 'Dimanche = plus de temps disponible'
            });
        }

        // Placer les séances faciles
        easySessions.forEach((session, index) => {
            const usedDays = [
                ...suggestions.quality.map(s => s.day),
                ...suggestions.long.map(s => s.day)
            ];
            const availableDays = trainingDays.filter(d => !usedDays.includes(d));
            
            if (availableDays[index] !== undefined) {
                suggestions.easy.push({
                    session,
                    day: availableDays[index],
                    reason: 'Récupération entre séances intenses'
                });
            }
        });

        return suggestions;
    },

    /**
     * Générer un rapport visuel de validation
     */
    generateValidationReport(validationResult) {
        const report = {
            html: '',
            summary: ''
        };

        // Résumé
        if (validationResult.valid) {
            report.summary = `✅ Planning validé (Score: ${validationResult.score}/100)`;
        } else {
            report.summary = `❌ Planning non recommandé (${validationResult.errors.length} erreur(s))`;
        }

        // HTML détaillé
        let html = `<div class="validation-report">`;
        html += `<div class="validation-score ${validationResult.valid ? 'valid' : 'invalid'}">`;
        html += `<h3>${report.summary}</h3>`;
        html += `<div class="score-bar"><div class="score-fill" style="width: ${validationResult.score}%"></div></div>`;
        html += `</div>`;

        // Erreurs
        if (validationResult.errors.length > 0) {
            html += `<div class="validation-section errors">`;
            html += `<h4>⛔ Erreurs (bloquantes)</h4>`;
            html += `<ul>`;
            validationResult.errors.forEach(error => {
                html += `<li class="error-item">`;
                html += `<p class="error-message">${error.message}</p>`;
                html += `<p class="error-suggestion">💡 ${error.suggestion}</p>`;
                html += `</li>`;
            });
            html += `</ul></div>`;
        }

        // Avertissements
        if (validationResult.warnings.length > 0) {
            html += `<div class="validation-section warnings">`;
            html += `<h4>⚠️ Avertissements</h4>`;
            html += `<ul>`;
            validationResult.warnings.forEach(warning => {
                html += `<li class="warning-item">`;
                html += `<p class="warning-message">${warning.message}</p>`;
                html += `<p class="warning-suggestion">💡 ${warning.suggestion}</p>`;
                html += `</li>`;
            });
            html += `</ul></div>`;
        }

        // Recommandations
        if (validationResult.recommendations.length > 0) {
            html += `<div class="validation-section recommendations">`;
            html += `<h4>💡 Recommandations</h4>`;
            html += `<ul>`;
            validationResult.recommendations.forEach(rec => {
                html += `<li class="recommendation-item">`;
                html += `<p class="recommendation-message">${rec.message}</p>`;
                html += `<p class="recommendation-suggestion">${rec.suggestion}</p>`;
                html += `</li>`;
            });
            html += `</ul></div>`;
        }

        html += `</div>`;
        report.html = html;

        return report;
    }
};
