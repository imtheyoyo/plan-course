/**
 * ================================================
 * js/sessions/beginner.js - Bibliothèque Débutant
 * ================================================
 * 9 types de séances adaptées aux coureurs débutants
 * Progression douce et sécurisée
 */

const BeginnerSessions = {
    /**
     * Phase de base (Fondation)
     */
    base: [
        {
            type: 'Fartlek Découverte',
            intensity: 3,
            reps: [6, 8, 10],
            duration: [1, 1, 1]
        },
        {
            type: 'VMA Courte',
            intensity: 4,
            reps: [6, 7, 8],
            distance: [200, 200, 200]
        },
        {
            type: 'Tempo Court',
            intensity: 3,
            reps: [2, 2, 3],
            duration: [6, 7, 6]
        }
    ],
    
    /**
     * Phase de qualité
     */
    quality: [
        {
            type: 'Seuil Fractionné',
            intensity: 3,
            reps: [3, 4, 4],
            duration: [6, 6, 7]
        },
        {
            type: 'VMA Moyenne',
            intensity: 4,
            reps: [6, 7, 8],
            distance: [300, 300, 400]
        },
        {
            type: 'Tempo Moyen',
            intensity: 3,
            reps: [2, 2, 3],
            duration: [8, 9, 8]
        }
    ],
    
    /**
     * Phase de pic
     */
    peak: [
        {
            type: 'Seuil Long',
            intensity: 3,
            reps: [1, 2, 2],
            duration: [15, 10, 12]
        },
        {
            type: 'VMA Longue',
            intensity: 4,
            reps: [4, 5, 6],
            distance: [600, 600, 800]
        },
        {
            type: 'Spécifique Course',
            intensity: 3,
            reps: [2, 3, 3],
            distance: [1000, 1000, 1200]
        }
    ],
    
    /**
     * Obtenir une séance complète avec échauffement et structure
     */
    getSession(phase, workoutIndex, progressIndex, paces) {
        const library = this[phase];
        if (!library) return null;
        
        const template = library[workoutIndex % library.length];
        const reps = template.reps[progressIndex];
        
        const session = {
            type: template.type,
            intensity: template.intensity,
            structure: {}
        };
        
        // Échauffement adapté
        const EF = `(~${Formatters.secondsToPace(paces.E_low)})`;
        if (template.intensity === 4) {
            session.structure.echauffement = template.type.includes('Courte') 
                ? `25 min EF ${EF} + 4 lignes droites`
                : `20 min EF ${EF} + 3 accélérations`;
        } else {
            session.structure.echauffement = `20 min EF ${EF}`;
        }
        
        // Bloc principal
        if (template.distance) {
            const dist = template.distance[progressIndex];
            const paceKey = dist <= 400 ? 'R' : 'I';
            session.structure.bloc = `${reps}x ${dist}m à ${Formatters.secondsToPace(paces[paceKey])}`;
            
            // Récupération
            if (dist <= 300) {
                session.structure.recuperation = `${dist}m trot`;
            } else if (dist <= 600) {
                session.structure.recuperation = "90 sec trot";
            } else {
                session.structure.recuperation = "2 min trot";
            }
        } else if (template.duration) {
            const dur = template.duration[progressIndex];
            const paceKey = template.intensity === 4 ? 'I' : 'T';
            
            if (reps === 1) {
                session.structure.bloc = `${dur} min à ${Formatters.secondsToPace(paces[paceKey])}`;
            } else {
                session.structure.bloc = `${reps}x ${dur} min à ${Formatters.secondsToPace(paces[paceKey])}`;
                session.structure.recuperation = dur >= 8 ? "2.5 min trot" : "2 min trot";
            }
        }
        
        // Retour au calme
        session.structure.retourAuCalme = template.intensity === 4 
            ? `12 min RC ${EF}`
            : `10 min RC ${EF}`;
        
        return session;
    },
    
    /**
     * Calculer la distance totale d'une séance
     */
    calculateDistance(session, paces) {
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
                        totalKm += (reps - 1) * 0.2; // Estimation
                    }
                }
            }
        }
        
        return Math.max(totalKm, 1);
    }
};