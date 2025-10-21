/**
 * ================================================
 * js/core/paceCalculator.js - Calcul des allures
 * ================================================
 * Calcule toutes les allures d'entraînement selon VDOT
 * Basé sur les tables de Jack Daniels
 * 
 * VERSION 1.0.0
 * Date: 21 octobre 2025
 */

const PaceCalculator = {
    /**
     * Calculer toutes les allures à partir du VDOT
     * @param {Number} vdot - Valeur VDOT du coureur
     * @returns {Object} Objet contenant toutes les allures en secondes/km
     */
    calculateAllPaces(vdot) {
        if (!vdot || vdot < 20 || vdot > 90) {
            console.error('❌ VDOT invalide:', vdot);
            return this.getDefaultPaces();
        }

        // Calculer la vitesse à partir du VO2
        const velFromVO2 = (vo2) => {
            const a = 0.000104;
            const b = 0.182258;
            const c = -(4.6 + vo2);
            const discriminant = b * b - 4 * a * c;
            
            if (discriminant < 0) return 0;
            return (-b + Math.sqrt(discriminant)) / (2 * a);
        };

        // Convertir vitesse en allure (sec/km)
        const velToPace = (velocity) => {
            if (velocity <= 0) return 0;
            return (1000 / velocity) * 60; // m/min → sec/km
        };

        // Pourcentages VDOT pour chaque zone selon Daniels
        const intensityFactors = {
            'E_low': 0.62,   // Endurance basse (récupération)
            'E_high': 0.70,  // Endurance haute
            'M': 0.81,       // Marathon pace
            'T': 0.88,       // Threshold (seuil)
            'I': 0.97,       // Interval (VMA)
        };

        const paces = {};

        // Calculer les allures principales
        for (const [zone, factor] of Object.entries(intensityFactors)) {
            const vo2 = vdot * factor;
            const velocity = velFromVO2(vo2);
            paces[zone] = velToPace(velocity);
        }

        // Allure R (Répétitions) = 6% plus rapide que I
        const velocityI = velFromVO2(vdot * intensityFactors.I);
        const velocityR = velocityI * 1.06;
        paces.R = velToPace(velocityR);

        // Prédire l'allure de compétition selon la distance
        paces.race_5km = this.predictRacePace(vdot, 5);
        paces.race_10km = this.predictRacePace(vdot, 10);
        paces.race_semi = this.predictRacePace(vdot, 21.1);
        paces.race_marathon = this.predictRacePace(vdot, 42.195);

        // Validation des cohérences
        if (!this.validatePaces(paces)) {
            console.warn('⚠️ Incohérence détectée dans les allures');
        }

        return paces;
    },

    /**
     * Prédire l'allure de course pour une distance donnée
     * @param {Number} vdot - VDOT du coureur
     * @param {Number} distanceKm - Distance en km
     * @returns {Number} Allure en secondes/km
     */
    predictRacePace(vdot, distanceKm) {
        // Formule de Daniels pour prédire le temps
        const timeMinutes = -31.06 + 11.24 * distanceKm - 
                           1.15 * Math.pow(distanceKm, 2) + 
                           0.04 * Math.pow(distanceKm, 3);
        
        // Facteur d'intensité selon la durée
        const intensity = 0.8 + 
                         0.1894393 * Math.exp(-0.012778 * timeMinutes) + 
                         0.2989558 * Math.exp(-0.1932605 * timeMinutes);
        
        // VO2 cible pour cette course
        const targetVO2 = vdot * intensity;
        
        // Calculer la vitesse
        const velFromVO2 = (vo2) => {
            const a = 0.000104;
            const b = 0.182258;
            const c = -(4.6 + vo2);
            const discriminant = b * b - 4 * a * c;
            return discriminant < 0 ? 0 : (-b + Math.sqrt(discriminant)) / (2 * a);
        };
        
        const velocity = velFromVO2(targetVO2);
        
        // Temps total en secondes
        const totalSeconds = (distanceKm * 1000) / (velocity / 60);
        
        // Allure par km
        return totalSeconds / distanceKm;
    },

    /**
     * Valider la cohérence des allures
     * R doit être plus rapide que I, I plus rapide que T, etc.
     */
    validatePaces(paces) {
        const order = ['R', 'I', 'T', 'M', 'E_high', 'E_low'];
        
        for (let i = 0; i < order.length - 1; i++) {
            const current = paces[order[i]];
            const next = paces[order[i + 1]];
            
            if (current >= next) {
                console.warn(`⚠️ Incohérence: ${order[i]} (${current.toFixed(0)}s) devrait être plus rapide que ${order[i+1]} (${next.toFixed(0)}s)`);
                return false;
            }
        }
        
        return true;
    },

    /**
     * Obtenir des allures par défaut en cas d'erreur
     */
    getDefaultPaces() {
        console.warn('⚠️ Utilisation des allures par défaut (VDOT 45)');
        return {
            'E_low': 372,   // 6:12/km
            'E_high': 339,  // 5:39/km
            'M': 301,       // 5:01/km
            'T': 282,       // 4:42/km
            'I': 260,       // 4:20/km
            'R': 245,       // 4:05/km
            'race_5km': 255,
            'race_10km': 268,
            'race_semi': 301,
            'race_marathon': 320
        };
    },

    /**
     * Afficher un résumé des allures (pour debug)
     */
    displayPaces(paces, vdot) {
        console.log('\n🏃 ALLURES D\'ENTRAÎNEMENT');
        console.log('═'.repeat(50));
        console.log(`VDOT: ${vdot ? vdot.toFixed(1) : 'N/A'}`);
        console.log('─'.repeat(50));
        
        const zones = [
            { key: 'E_low', label: 'Endurance basse (E)' },
            { key: 'E_high', label: 'Endurance haute (E)' },
            { key: 'M', label: 'Marathon (M)' },
            { key: 'T', label: 'Seuil (T)' },
            { key: 'I', label: 'Intervalle VMA (I)' },
            { key: 'R', label: 'Répétitions (R)' }
        ];
        
        zones.forEach(zone => {
            const pace = paces[zone.key];
            if (pace) {
                const formatted = this.formatPace(pace);
                console.log(`${zone.label.padEnd(25)} : ${formatted}`);
            }
        });
        
        console.log('─'.repeat(50));
        console.log('ALLURES DE COURSE:');
        
        const races = [
            { key: 'race_5km', label: '5km' },
            { key: 'race_10km', label: '10km' },
            { key: 'race_semi', label: 'Semi-marathon' },
            { key: 'race_marathon', label: 'Marathon' }
        ];
        
        races.forEach(race => {
            const pace = paces[race.key];
            if (pace) {
                const formatted = this.formatPace(pace);
                console.log(`${race.label.padEnd(25)} : ${formatted}`);
            }
        });
        
        console.log('═'.repeat(50) + '\n');
    },

    /**
     * Formater une allure en min:sec/km
     */
    formatPace(seconds) {
        if (isNaN(seconds) || seconds <= 0) return 'N/A';
        
        const minutes = Math.floor(seconds / 60);
        const secs = Math.round(seconds % 60);
        
        return `${minutes}:${secs.toString().padStart(2, '0')}/km`;
    },

    /**
     * Calculer le VDOT à partir d'une performance
     * @param {Number} distanceMeters - Distance en mètres
     * @param {Number} timeSeconds - Temps en secondes
     * @returns {Number} VDOT calculé
     */
    calculateVDOT(distanceMeters, timeSeconds) {
        if (!distanceMeters || !timeSeconds || timeSeconds <= 0) {
            console.error('❌ Distance ou temps invalide');
            return null;
        }

        // Vitesse en m/min
        const velocity = (distanceMeters * 1000) / (timeSeconds / 60);
        
        // VO2max à partir de la vitesse (formule de Daniels)
        const vo2 = -4.6 + 0.182258 * velocity + 0.000104 * velocity * velocity;
        
        // Facteur d'intensité selon la durée
        const timeMinutes = timeSeconds / 60;
        const intensity = 0.8 + 
                         0.1894393 * Math.exp(-0.012778 * timeMinutes) + 
                         0.2989558 * Math.exp(-0.1932605 * timeMinutes);
        
        // VDOT = VO2 / intensité
        const vdot = vo2 / intensity;
        
        return Math.max(20, Math.min(90, vdot)); // Limiter entre 20 et 90
    },

    /**
     * Obtenir une estimation du niveau selon VDOT
     */
    getRunnerLevel(vdot) {
        if (vdot < 35) return 'Débutant';
        if (vdot < 50) return 'Intermédiaire';
        if (vdot < 60) return 'Confirmé';
        if (vdot < 70) return 'Avancé';
        return 'Elite';
    },

    /**
     * Convertir un temps de course en secondes
     * @param {String} timeString - Format "HH:MM:SS" ou "MM:SS"
     * @returns {Number} Temps en secondes
     */
    parseTimeToSeconds(timeString) {
        const parts = timeString.split(':').map(Number);
        
        if (parts.length === 3) {
            // Format HH:MM:SS
            return parts[0] * 3600 + parts[1] * 60 + parts[2];
        } else if (parts.length === 2) {
            // Format MM:SS
            return parts[0] * 60 + parts[1];
        }
        
        return NaN;
    }
};
