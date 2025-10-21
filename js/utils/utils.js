/**
 * ================================================
 * js/utils/utils.js - Fonctions utilitaires
 * ================================================
 * Fonctions générales utilisées dans toute l'application
 * 
 * VERSION 1.0.0
 * Date: 21 octobre 2025
 */

const Utils = {
    /**
     * Générer un ID unique
     */
    generateId() {
        return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    },

    /**
     * Deep clone d'un objet
     */
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    /**
     * Vérifier si une valeur est un nombre valide
     */
    isValidNumber(value) {
        return typeof value === 'number' && !isNaN(value) && isFinite(value);
    },

    /**
     * Arrondir à N décimales
     */
    round(value, decimals = 2) {
        const multiplier = Math.pow(10, decimals);
        return Math.round(value * multiplier) / multiplier;
    },

    /**
     * Formater un nombre avec séparateurs de milliers
     */
    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    },

    /**
     * Obtenir la date actuelle formatée
     */
    getCurrentDate() {
        const now = new Date();
        return {
            date: now,
            formatted: this.formatDate(now),
            iso: now.toISOString()
        };
    },

    /**
     * Formater une date en DD/MM/YYYY
     */
    formatDate(date) {
        if (!(date instanceof Date)) date = new Date(date);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
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
     * Obtenir le numéro de semaine ISO
     */
    getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    },

    /**
     * Debounce function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Throttle function
     */
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * Capitaliser la première lettre
     */
    capitalize(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    },

    /**
     * Obtenir un élément du DOM avec vérification
     */
    getElement(selector) {
        const element = document.querySelector(selector);
        if (!element) {
            console.warn(`⚠️ Élément non trouvé: ${selector}`);
        }
        return element;
    },

    /**
     * Afficher un message de confirmation
     */
    confirm(message) {
        return window.confirm(message);
    },

    /**
     * Afficher une alerte
     */
    alert(message) {
        window.alert(message);
    },

    /**
     * Copier du texte dans le presse-papier
     */
    copyToClipboard(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text)
                .then(() => console.log('✅ Copié dans le presse-papier'))
                .catch(err => console.error('❌ Erreur copie:', err));
        } else {
            // Fallback pour navigateurs anciens
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            console.log('✅ Copié dans le presse-papier (fallback)');
        }
    },

    /**
     * Télécharger un fichier
     */
    downloadFile(content, filename, type = 'text/plain') {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        console.log(`✅ Fichier téléchargé: ${filename}`);
    },

    /**
     * Valider un email
     */
    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    /**
     * Logger avec timestamp
     */
    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const emoji = {
            'info': 'ℹ️',
            'success': '✅',
            'warning': '⚠️',
            'error': '❌'
        };
        console.log(`${emoji[type] || 'ℹ️'} [${timestamp}] ${message}`);
    },

    /**
     * Sauvegarder dans localStorage
     */
    saveToLocalStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('❌ Erreur sauvegarde localStorage:', e);
            return false;
        }
    },

    /**
     * Charger depuis localStorage
     */
    loadFromLocalStorage(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('❌ Erreur chargement localStorage:', e);
            return null;
        }
    },

    /**
     * Supprimer de localStorage
     */
    removeFromLocalStorage(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('❌ Erreur suppression localStorage:', e);
            return false;
        }
    },

    /**
     * Vider tout le localStorage
     */
    clearLocalStorage() {
        if (this.confirm('Voulez-vous vraiment effacer toutes les données sauvegardées ?')) {
            localStorage.clear();
            console.log('✅ localStorage vidé');
            return true;
        }
        return false;
    },

    /**
     * Vérifier si le navigateur supporte une fonctionnalité
     */
    checkBrowserSupport(feature) {
        const features = {
            'localStorage': typeof(Storage) !== 'undefined',
            'serviceWorker': 'serviceWorker' in navigator,
            'geolocation': 'geolocation' in navigator,
            'notification': 'Notification' in window,
            'clipboard': navigator.clipboard !== undefined
        };
        return features[feature] || false;
    },

    /**
     * Détecter si mobile
     */
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },

    /**
     * Obtenir les dimensions de la fenêtre
     */
    getViewport() {
        return {
            width: window.innerWidth,
            height: window.innerHeight,
            isMobile: this.isMobile()
        };
    },

    /**
     * Smooth scroll vers un élément
     */
    scrollToElement(selector, offset = 0) {
        const element = document.querySelector(selector);
        if (element) {
            const top = element.getBoundingClientRect().top + window.pageYOffset - offset;
            window.scrollTo({ top, behavior: 'smooth' });
        }
    }
};
