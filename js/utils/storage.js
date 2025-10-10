/**
 * ================================================
 * js/utils/storage.js - Import/Export
 * ================================================
 */

const Storage = {
    /**
     * Exporter le plan en JSON
     */
    exportPlan(planData, userInput) {
        const saveData = {
            version: CONFIG.version,
            buildDate: CONFIG.buildDate,
            exportDate: new Date().toISOString(),
            userInput: userInput,
            planData: planData
        };
        
        const dataStr = JSON.stringify(saveData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `plan-course-v${CONFIG.version}-${DateUtils.toISO(new Date())}.json`;
        a.click();
        URL.revokeObjectURL(url);
    },
    
    /**
     * Importer un plan depuis JSON
     */
    importPlan(file, callback) {
        const reader = new FileReader();
        
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                
                if (!data.planData || !data.userInput) {
                    throw new Error('Format JSON invalide');
                }
                
                // Convertir les dates string en objets Date
                data.planData.plan.forEach(week => {
                    week.startDate = new Date(week.startDate);
                });
                
                callback(null, data);
            } catch (error) {
                callback(error, null);
            }
        };
        
        reader.onerror = () => {
            callback(new Error('Erreur de lecture du fichier'), null);
        };
        
        reader.readAsText(file);
    },
    
    /**
     * Sauvegarder dans localStorage (optionnel)
     */
    saveToLocal(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.warn('localStorage non disponible:', e);
            return false;
        }
    },
    
    /**
     * Charger depuis localStorage (optionnel)
     */
    loadFromLocal(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.warn('localStorage non disponible:', e);
            return null;
        }
    },
    
    /**
     * Effacer localStorage
     */
    clearLocal(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.warn('localStorage non disponible:', e);
            return false;
        }
    }
};