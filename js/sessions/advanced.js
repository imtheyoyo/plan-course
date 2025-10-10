/**
 * ================================================
 * js/sessions/advanced.js - Bibliothèque Avancé
 * ================================================
 * 12 types de séances pour coureurs avancés
 * Séances complexes et intensives
 */

const AdvancedSessions = {
    /**
     * Phase de base
     */
    base: [
        {
            type: 'VMA Courte Intensive',
            intensity: 4,
            reps: [10, 12, 15],
            distance: [200, 200, 200]
        },
        {
            type: 'VMA Moyenne',
            intensity: 4,
            reps: [10, 12, 14],
            distance: [300, 300, 400]
        },
        {
            type: 'Tempo Soutenu',
            intensity: 3,
            reps: [3, 3, 2],
            duration: [8, 10, 15]
        },
        {
            type: 'Fartlek Rapide',
            intensity: 4,
            reps: [10, 12, 14],
            duration: [1, 1, 1]
        }
    ],
    
    /**
     * Phase de qualité
     */
    quality: [
        {
            type: 'Double Seuil',
            intensity: 3,
            doubleSeuil: true,
            duration: [10, 12, 15]
        },
        {
            type: 'VMA Longue',
            intensity: 4,
            reps: [6, 7, 8],
            distance: [1000, 1000, 1200]
        },
        {
            type: 'Seuil Long',
            intensity: 3,
            reps: [1, 2, 1],
            duration: [25, 12, 30]
        },
        {
            type: 'Pyramide Inversée',
            intensity: 4,
            pyramidInverse: true
        }
    ],
    
    /**
     * Phase de pic
     */
    peak: [
        {
            type: 'VMA Maximale',
            intensity: 4,
            reps: [12, 15, 10],
            distance: [400, 400, 600]
        },
        {
            type: 'Seuil Très Long',
            intensity: 3,
            reps: [1, 1, 1],
            duration: [30, 35, 40]
        },
        {
            type: 'Spécifique Marathon',
            intensity: 3,
            reps: [1, 1, 1],
            distance: [12000, 14000, 16000]
        },
        {
            type: 'VMA Mixte',
            intensity: 4,
            mixed: true
        }
    ],
    
    /**
     * Obtenir une séance complète
     */
    getSession(phase, workoutIndex, progressIndex, paces, raceDistance) {
        const library = this[phase];
        if (!library) return null;
        
        const template = library[workoutIndex % library.length];
        
        const session = {
            type: template.type,
            intensity: template.intensity,
            structure: {}
        };
        
        const EF = `(~${Formatters.secondsToPace(paces.E_low)})`;
        
        // Échauffement
        if (template.intensity === 4) {
            session.structure.echauffement = template.type.includes('Courte')
                ? `25 min EF ${EF} + 4 lignes droites`
                : `20 min EF ${EF} + 3 accélérations`;
        } else {
            session.structure.echauffement = template.type.includes('Long')
                ? `15 min EF ${EF}`
                : `20 min EF ${EF}`;
        }
        
        // Bloc principal - Séances spéciales
        if (template.pyramidInverse) {
            session.structure.bloc = `1200m + 1000m + 800m + 600m + 400m à ${Formatters.secondsToPace(paces.I)}`;
            session.structure.recuperation = "Récup = 50% durée effort";
        } 
        else if (template.doubleSeuil) {
            const dur = template.duration[progressIndex];
            session.structure.bloc = `${dur} min à ${Formatters.secondsToPace(paces.T)} + 5 min récup + ${dur} min à ${Formatters.secondsToPace(paces.T)}`;
        }
        else if (template.mixed) {
            session.structure.bloc = `3x (800m à ${Formatters.secondsToPace(paces.I)} + 400m à ${Formatters.secondsToPace(paces.R)})`;
            session.structure.recuperation = "2 min trot entre séries";
        }
        else if (template.type === 'Spécifique Marathon' && raceDistance >= 42) {
            const dist = template.distance[progressIndex];
            session.structure.bloc = `${dist/1000}km à ${Formatters.secondsToPace(paces.M)} (allure marathon)`;
        }
        // Séances classiques
        else {
            const reps = template.reps[progressIndex];
            
            if (template.distance) {
                const dist = template.distance[progressIndex];
                const paceKey = dist <= 400 ? 'R' : 'I';
                session.structure.bloc = `${reps}x ${dist}m à ${Formatters.secondsToPace(paces[paceKey])}`;
                
                if (dist <= 300) {
                    session.structure.recuperation = `${dist}m trot`;
                } else if (dist <= 600) {
                    session.structure.recuperation = "90 sec trot";
                } else {
                    session.structure.recuperation = dist >= 1000 ? "2.5 min trot" : "2 min trot";
                }
            } else if (template.duration) {
                const dur = template.duration[progressIndex];
                const paceKey = 'T';
                
                if (reps === 1) {
                    session.structure.bloc = `${dur} min à ${Formatters.secondsToPace(paces[paceKey])}`;
                } else {
                    session.structure.bloc = `${reps}x ${dur} min à ${Formatters.secondsToPace(paces[paceKey])}`;
                    session.structure.recuperation = dur >= 10 ? "3 min trot" : "2.5 min trot";
                }
            }
        }
        
        // Retour au calme
        session.structure.retourAuCalme = template.intensity === 4
            ? `12 min RC ${EF}`
            : `10 min RC ${EF}`;
        
        return session;
    },
    
    /**
     * Calculer la distance totale
     */
    calculateDistance(session, paces) {
        if (!session.structure) return 0;
        
        let totalKm = 0;
        const { echauffement, bloc, recuperation, retourAuCalme } = session.structure;
        
        // Échauffement
        if (echauffement) {
            const min = parseInt(echauffement);
            if (!isNaN(min)) totalKm += (min * 60) / paces.E_low / 1000;
        }
        
        // Retour au calme
        if (retourAuCalme) {
            const min = parseInt(retourAuCalme);
            if (!isNaN(min)) totalKm += (min * 60) / paces.E_low / 1000;
        }
        
        // Bloc principal
        if (bloc) {
            // Spécifique Marathon (distance directe)
            if (bloc.includes('km à') && !bloc.includes('x')) {
                const kmMatch = bloc.match(/(\d+)km/);
                if (kmMatch) totalKm += parseInt(kmMatch[1]);
            }
            // Pyramide
            else if (bloc.includes('+')) {
                const pyramidMatch = bloc.match(/(\d+)m/g);
                if (pyramidMatch) {
                    pyramidMatch.forEach(match => {
                        totalKm += parseInt(match) / 1000;
                    });
                    totalKm += (pyramidMatch.length - 1) * 0.3;
                }
            }
            // Répétitions standard
            else {
                const match = bloc.match(/(\d+)\s*x\s*(\d+(\.\d+)?)\s*(m|min)/);
                if (match) {
                    const [_, repsStr, valStr, , unit] = match;
                    const reps = parseInt(repsStr);
                    const val = parseFloat(valStr);
                    
                    if (unit === 'm') {
                        totalKm += (reps * val) / 1000;
                    } else {
                        const paceKey = session.intensity === 4 ? 'I' : 'T';
                        totalKm += reps * (val * 60) / paces[paceKey] / 1000;
                    }
                    
                    // Récupération
                    if (recuperation && reps > 1) {
                        const recupMatch = recuperation.match(/(\d+(\.\d+)?)\s*(m|min|sec)/);
                        if (recupMatch) {
                            const [_, recupVal, , recupUnit] = recupMatch;
                            const recupNum = parseFloat(recupVal);
                            
                            if (recupUnit === 'm') {
                                totalKm += (reps - 1) * recupNum / 1000;
                            } else if (recupUnit === 'min') {
                                totalKm += (reps - 1) * (recupNum * 60) / paces.E_high / 1000;
                            } else if (recupUnit === 'sec') {
                                totalKm += (reps - 1) * recupNum / paces.E_high / 1000;
                            }
                        } else {
                            totalKm += (reps - 1) * 0.3;
                        }
                    }
                }
            }
        }
        
        return Math.max(totalKm, 1);
    }
};