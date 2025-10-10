/**
 * ================================================
 * js/utils/dates.js - Gestion des dates
 * ================================================
 */

const DateUtils = {
    /**
     * Formater une date en JJ/MM/AA
     */
    format(date) {
        return `${date.getDate().toString().padStart(2,'0')}/${(date.getMonth()+1).toString().padStart(2,'0')}/${date.getFullYear().toString().slice(-2)}`;
    },
    
    /**
     * Obtenir le prochain lundi
     */
    getNextMonday(fromDate = new Date()) {
        const dayOfWeek = fromDate.getDay();
        const daysUntilMonday = dayOfWeek === 1 ? 7 : (8 - dayOfWeek) % 7;
        const nextMonday = new Date(fromDate);
        nextMonday.setDate(fromDate.getDate() + daysUntilMonday);
        return nextMonday;
    },
    
    /**
     * Ajouter des jours à une date
     */
    addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    },
    
    /**
     * Calculer le nombre de semaines entre deux dates
     */
    weeksBetween(startDate, endDate) {
        const msPerDay = 86400000;
        return Math.round((endDate - startDate) / (msPerDay * 7));
    },
    
    /**
     * Ajuster une date au début de semaine (lundi)
     */
    adjustToMonday(date) {
        const dayOfWeek = date.getDay();
        const adjustment = (dayOfWeek === 0) ? 6 : dayOfWeek - 1;
        return this.addDays(date, -adjustment);
    },
    
    /**
     * Convertir string ISO en Date
     */
    fromISO(isoString) {
        return new Date(isoString);
    },
    
    /**
     * Convertir Date en string ISO
     */
    toISO(date) {
        return date.toISOString().split('T')[0];
    }
};