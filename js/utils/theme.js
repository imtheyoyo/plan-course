/**
 * ================================================
 * Theme Manager - Gestion mode sombre/clair
 * ================================================
 * Version: 1.0.0
 * Date: 2025-10-12
 * Fichier: js/utils/theme.js
 * ================================================
 */

const ThemeManager = {
    // Clé localStorage
    STORAGE_KEY: 'plan-course-theme',
    
    // Thèmes disponibles
    THEMES: {
        LIGHT: 'light',
        DARK: 'dark'
    },
    
    /**
     * Initialiser le gestionnaire de thème
     */
    init() {
        console.log('🎨 Initialisation ThemeManager');
        
        // Charger le thème sauvegardé ou détecter préférence système
        const savedTheme = this.getSavedTheme();
        const systemTheme = this.getSystemTheme();
        const initialTheme = savedTheme || this.THEMES.DARK; /* systemTheme;*/
        
        // Appliquer le thème initial
        this.setTheme(initialTheme, false);
        
        // Écouter les changements de préférence système
        this.watchSystemTheme();
        
        // Setup toggle button
        this.setupToggleButton();
        
        console.log(`✅ Thème appliqué : ${initialTheme}`);
    },
    
    /**
     * Récupérer le thème sauvegardé
     */
    getSavedTheme() {
        return localStorage.getItem(this.STORAGE_KEY);
    },
    
    /**
     * Détecter la préférence système
     */
    getSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return this.THEMES.DARK;
        }
        return this.THEMES.DARK;
    },
    
    /**
     * Obtenir le thème actuel
     */
    getCurrentTheme() {
        return document.documentElement.getAttribute('data-theme') || this.THEMES.DARK;
    },
    
    /**
     * Appliquer un thème
     * @param {string} theme - 'light' ou 'dark'
     * @param {boolean} save - Sauvegarder dans localStorage
     */
    setTheme(theme, save = true) {
        // Valider le thème
        if (!Object.values(this.THEMES).includes(theme)) {
            console.warn(`⚠️ Thème invalide: ${theme}`);
            return;
        }
        
        // Appliquer sur l'élément racine
        document.documentElement.setAttribute('data-theme', theme);
        
        // Mettre à jour le toggle button
        this.updateToggleButton(theme);
        
        // Sauvegarder si demandé
        if (save) {
            localStorage.setItem(this.STORAGE_KEY, theme);
            console.log(`💾 Thème sauvegardé : ${theme}`);
        }
    },
    
    /**
     * Toggle entre les thèmes
     */
    toggleTheme() {
        const currentTheme = this.getCurrentTheme();
        const newTheme = currentTheme === this.THEMES.DARK 
            ? this.THEMES.LIGHT 
            : this.THEMES.DARK;
        
        this.setTheme(newTheme);
        
        // Animation du bouton
        const button = document.getElementById('theme-toggle');
        if (button) {
            button.classList.add('theme-toggle-animate');
            setTimeout(() => {
                button.classList.remove('theme-toggle-animate');
            }, 300);
        }
        
        console.log(`🔄 Thème changé : ${currentTheme} → ${newTheme}`);
    },
    
    /**
     * Écouter les changements de préférence système
     */
    watchSystemTheme() {
        if (!window.matchMedia) return;
        
        const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        darkModeQuery.addEventListener('change', (e) => {
            // Ne changer que si l'utilisateur n'a pas de préférence sauvegardée
            if (!this.getSavedTheme()) {
                const newTheme = e.matches ? this.THEMES.DARK : this.THEMES.LIGHT;
                this.setTheme(newTheme, false);
                console.log(`🔄 Thème système changé : ${newTheme}`);
            }
        });
    },
    
    /**
     * Setup du bouton toggle
     */
    setupToggleButton() {
        const button = document.getElementById('theme-toggle');
        if (!button) {
            console.warn('⚠️ Bouton theme-toggle non trouvé');
            return;
        }
        
        button.addEventListener('click', () => {
            this.toggleTheme();
        });
        
        // Accessibility
        button.setAttribute('role', 'button');
        button.setAttribute('tabindex', '0');
        
        // Support clavier (Enter et Space)
        button.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.toggleTheme();
            }
        });
    },
    
    /**
     * Mettre à jour l'icône du toggle
     */
    updateToggleButton(theme) {
        const button = document.getElementById('theme-toggle');
        if (!button) return;
        
        if (theme === this.THEMES.LIGHT) {
            button.innerHTML = '🌙'; // Lune pour passer au mode sombre
            button.setAttribute('aria-label', 'Activer le mode sombre');
            button.setAttribute('title', 'Mode sombre');
        } else {
            button.innerHTML = '☀️'; // Soleil pour passer au mode clair
            button.setAttribute('aria-label', 'Activer le mode clair');
            button.setAttribute('title', 'Mode clair');
        }
    },
    
    /**
     * Réinitialiser au thème par défaut
     */
    reset() {
        localStorage.removeItem(this.STORAGE_KEY);
        const systemTheme = this.getSystemTheme();
        this.setTheme(systemTheme, false);
        console.log('🔄 Thème réinitialisé');
    }
};

// Export global
if (typeof window !== 'undefined') {
    window.ThemeManager = ThemeManager;
}

// Auto-init au chargement
document.addEventListener('DOMContentLoaded', () => {
    ThemeManager.init();
});

console.log('✅ theme.js chargé');
