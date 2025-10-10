/**
 * ================================================
 * js/sessions/intermediate.js - Bibliothèque Intermédiaire
 * ================================================
 * 12 types de séances pour coureurs intermédiaires
 * Plus de variété et d'intensité
 */

const IntermediateSessions = {
    /**
     * Phase de base
     */
    base: [
        {
            type: 'VMA Courte',
            intensity: 4,
            reps: [8, 10, 12],
            distance: [200, 200, 200]
        },
        {
            type: 'Fartlek',
            intensity: 3,
            reps: [8, 10, 12],
            duration: [1, 1, 1]
        },
        {
            type: 'VMA Moyenne',
            intensity: 4,
            reps: [8, 9, 10],
            distance: [300, 300, 400]
        },
        {
            type: 'Tempo Court',
            intensity: 3,
            reps: [2, 3, 3],
            duration: [8, 8, 10]
        }
    ],
    
    /**
     * Phase de qualité
     */
    quality: [
        {
            type: 'Seuil Fractionné',
            intensity: 3,
            reps: [4, 4, 5],
            duration: [6, 7, 6]
        },
        {
            type: 'VMA Longue',
            intensity: 4,
            reps: [5, 6, 7],
            distance: [800, 800, 1000]
        },
        {
            type: 'Seuil Long',
            intensity: 3,
            reps: [2, 2, 1],
            duration: [10, 12, 20]
        },
        {
            type: 'Pyramide VMA',
            intensity: 4,
            pyramid: true
        }
    ],
    
    /**
     * Phase de pic
     */
    peak: [
        {
            type: 'VMA Intensive',
            intensity: 4,
            reps: [8, 10, 12],
            distance: [400, 400, 400]
        },
        {
            type: 'Seuil Continu',
            intensity: 3,
            reps: [1, 1, 1],
            duration: [20, 25, 30]
        },
        {
            type: 'Spécifique Course',
            intensity: 3,
            reps: [3, 3, 4],
            distance: [2000, 2000, 2000]
        },
        {
            type: 'VMA Longue Intensive',
            intensity: 4,
            reps: [6, 7, 8],
            distance: [1000, 1000, 1200]
        }
    ],
    
    /**
     * Obtenir une séance complète
     */
    getSession(phase, workoutIndex, progressIndex, paces) {
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
        
        // Bloc principal
        if (template.pyramid) {
            session.structure.bloc = `400m + 600m + 800m + 1000m + 800m + 600m + 400m à ${Formatters.secondsToPace(paces.I)}`;
            session.structure.recuperation = "Récup = durée effort en trot";
        } else {
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
                const paceKey = template.intensity === 4 ? 'I' : 'T';
                
                if (reps === 1) {
                    session.structure.bloc = `${dur} min à ${Formatters.secondsToPace(paces[paceKey])}`;
                } else {
                    session.structure.bloc = `${reps}x ${dur} min à ${Formatters.secondsToPace(paces[paceKey])}`;
                    session.structure.recuperation = dur >= 10 ? "3 min trot" : "2 min trot";
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
            // Pyramide
            if (bloc.includes('+')) {
                const pyramidMatch = bloc.match(/(\d+)m/g);
                if (pyramidMatch) {
                    pyramidMatch.forEach(match => {
                        totalKm += parseInt(match) / 1000;
                    });
                    totalKm += (pyramidMatch.length - 1) * 0.3; // Récup
                }
            } 
            // Répétitions
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
                            totalKm += (reps - 1) * 0.25;
                        }
                    }
                }
            }
        }
        
        return Math.max(totalKm, 1);
    }
};