/**
 * ================================================
 * js/core/vdot.js - Calculs physiologiques
 * ================================================
 */

const VDOT = {
    /**
     * Calculer le VDOT à partir d'une distance et d'un temps
     */
    calculate(distanceKm, timeSeconds) {
        if (isNaN(timeSeconds) || timeSeconds <= 0) return null;
        
        const velocity = (distanceKm * 1000) / (timeSeconds / 60);
        const vo2 = -4.6 + 0.182258 * velocity + 0.000104 * velocity * velocity;
        const intensity = 0.8 + 0.1894393 * Math.exp(-0.012778 * (timeSeconds/60)) + 
                         0.2989558 * Math.exp(-0.1932605 * (timeSeconds/60));
        
        return vo2 / intensity;
    },
    
    /**
     * Calculer VMA depuis VDOT
     */
    calculateVMA(vdot) {
        return vdot / 2.85;
    },
    
    /**
     * Calculer VDOT depuis VMA (test Demi-Cooper)
     */
    calculateFromVMA(vma) {
        return vma * 2.85;
    },
    
    /**
     * Calculer toutes les allures d'entraînement
     */
    getTrainingPaces(vdot, raceDistanceKm) {
        if (!vdot) return null;
        
        // Fonction helper : VO2 -> Vitesse
        const velFromVO2 = (vo2) => {
            const a = 0.000104, b = 0.182258, c = -(4.6 + vo2);
            const delta = b * b - 4 * a * c;
            return delta < 0 ? 0 : (-b + Math.sqrt(delta)) / (2 * a);
        };
        
        // Fonction helper : Vitesse -> Allure (sec/km)
        const velToPace = (velocity) => {
            return velocity <= 0 ? 0 : (1000 / velocity) * 60;
        };
        
        // Prédiction du temps de course
        const predictedTimeSec = (distKm) => {
            const timeMinutes = -31.06 + 11.24 * distKm - 1.15 * Math.pow(distKm, 2) + 0.04 * Math.pow(distKm, 3);
            const intensity = 0.8 + 0.1894393 * Math.exp(-0.012778 * timeMinutes) + 
                             0.2989558 * Math.exp(-0.1932605 * timeMinutes);
            const targetVO2 = vdot * intensity;
            const velocity = velFromVO2(targetVO2);
            return (distKm * 1000) / (velocity / 60);
        };
        
        // Calcul des allures
        const percentages = {
            E_low: 0.62,
            E_high: 0.7,
            M: 0.81,
            T: 0.88,
            I: 0.97
        };
        
        const paces = {};
        for (const [key, pct] of Object.entries(percentages)) {
            paces[key] = velToPace(velFromVO2(vdot * pct));
        }
        
        // Allure VMA (I) et Répétition (R)
        const vI = velFromVO2(vdot * percentages.I);
        paces.I = velToPace(vI);
        paces.R = velToPace(vI * 1.06);
        
        // Allure Course (C)
        paces.C = predictedTimeSec(raceDistanceKm) / raceDistanceKm;
        
        return paces;
    },
    
    /**
     * Calculer le TSS d'une séance
     */
    calculateTSS(session, paces) {
        const duration = session.distance ? (session.distance * (paces.E_low / 60)) : 0;
        const IF = CONFIG.intensityFactors[session.intensity] || 0.6;
        return duration * IF;
    }
};