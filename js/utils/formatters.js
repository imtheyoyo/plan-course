/**
 * ================================================
 * js/utils/formatters.js - Formatage des données
 * ================================================
 */

const Formatters = {
    /**
     * Convertir hh:mm:ss en secondes
     */
    timeToSeconds(timeStr) {
        const parts = timeStr.split(':').map(Number);
        if (parts.length === 3) {
            return parts[0] * 3600 + parts[1] * 60 + parts[2];
        } else if (parts.length === 2) {
            return parts[0] * 60 + parts[1];
        }
        return NaN;
    },
    
    /**
     * Convertir secondes en allure min:sec/km
     */
    secondsToPace(seconds) {
        if (isNaN(seconds) || seconds === 0) return 'N/A';
        const minutes = Math.floor(seconds / 60);
        const secs = Math.round(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, '0')}/km`;
    },
    
    /**
     * Formater une durée en minutes vers hh:mm ou mm min
     */
    formatDuration(minutes) {
        if (isNaN(minutes) || minutes <= 0) return '';
        const hours = Math.floor(minutes / 60);
        const mins = Math.round(minutes % 60);
        if (hours === 0) return `${mins}min`;
        return `${hours}h${mins.toString().padStart(2, '0')}`;
    },
    
    /**
     * Formater un nombre avec décimales
     */
    formatNumber(num, decimals = 1) {
        return Number(num).toFixed(decimals);
    },
    
    /**
     * Formater kilométrage
     */
    formatKm(km) {
        return `${Math.round(km)} km`;
    },
    
    /**
     * Capitaliser première lettre
     */
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
};
