/**
 * ================================================
 * js/ui/sessionManager.js - Gestion des séances
 * ================================================
 * Ajout, suppression et modification de séances
 */

const SessionManager = {
    /**
     * Initialiser les événements
     */
    init() {
        console.log('🔧 Initialisation de SessionManager');
        this.setupDeleteButtons();
        this.setupAddButton();
    },
    
    /**
     * Configurer les boutons de suppression
     */
    setupDeleteButtons() {
        document.addEventListener('click', (e) => {
            // Bouton de suppression sur une carte de séance
            if (e.target.classList.contains('delete-session-btn')) {
                e.stopPropagation();
                e.preventDefault();
                const sessionCard = e.target.closest('.session-card');
                if (sessionCard) {
                    this.deleteSession(sessionCard, e);
                }
            }
        }, true); // Mode capture pour intercepter avant le double-clic
    },
    
    /**
     * Configurer le bouton d'ajout
     */
    setupAddButton() {
        document.addEventListener('click', (e) => {
            // Bouton + sur un jour vide
            if (e.target.classList.contains('add-session-btn')) {
                const emptySlot = e.target.closest('.empty-day-slot');
                if (emptySlot) {
                    const weekContent = emptySlot.closest('.week-content');
                    const weekIndex = parseInt(weekContent.dataset.weekIndex);
                    const dayIndex = parseInt(emptySlot.dataset.dayIndex);
                    this.showAddSessionModal(weekIndex, dayIndex);
                }
            }
        });
    },
    
    /**
     * Supprimer une séance
     */
    deleteSession(sessionCard, event) {
        // Empêcher toute propagation
        if (event) {
            event.stopImmediatePropagation();
            event.preventDefault();
        }
        
        const weekIndex = parseInt(sessionCard.dataset.weekIndex);
        const dayIndex = parseInt(sessionCard.dataset.dayIndex);
        const sessionIndex = parseInt(sessionCard.dataset.sessionIndex);
        
        const week = STATE.currentPlanData.plan[weekIndex];
        const session = week.sessions[sessionIndex];
        
        // Confirmation
        const confirmDelete = confirm(
            `Supprimer cette séance ?\n\n` +
            `${CONFIG.fullDayNames[dayIndex]} : ${session.type}\n` +
            `Distance : ${session.distance?.toFixed(1) || '?'} km`
        );
        
        if (!confirmDelete) return;
        
        // Supprimer la séance
        week.sessions.splice(sessionIndex, 1);
        
        // Recalculer le kilométrage et TSS
        week.totalKm = week.sessions.reduce((sum, s) => sum + (s.distance || 0), 0);
        week.tss = week.sessions.reduce((sum, s) => 
            sum + VDOT.calculateTSS(s, STATE.currentPlanData.paces), 0
        );
        
        // Réafficher le plan
        this.refreshPlan();
        
        console.log(`✅ Séance supprimée : Semaine ${weekIndex + 1}, ${CONFIG.fullDayNames[dayIndex]}`);
    },
    
    /**
     * Afficher le modal d'ajout de séance
     */
    showAddSessionModal(weekIndex, dayIndex) {
        const week = STATE.currentPlanData.plan[weekIndex];
        const paces = STATE.currentPlanData.paces;
        
        // Créer le modal
        const modal = this.createAddSessionModal(weekIndex, dayIndex, week, paces);
        document.body.appendChild(modal);
        
        // Afficher avec animation
        setTimeout(() => modal.classList.add('show'), 10);
    },
    
    /**
     * Créer le HTML du modal d'ajout
     */
    createAddSessionModal(weekIndex, dayIndex, week, paces) {
        const modal = document.createElement('div');
        modal.className = 'session-modal-overlay';
        modal.innerHTML = `
            <div class="session-modal">
                <div class="session-modal-header">
                    <h3>➕ Ajouter une séance</h3>
                    <button class="close-modal-btn" onclick="this.closest('.session-modal-overlay').remove()">✕</button>
                </div>
                
                <div class="session-modal-body">
                    <div class="form-group">
                        <label>Semaine ${week.weekNumber} - ${CONFIG.fullDayNames[dayIndex]}</label>
                        <p class="text-sm text-gray-400">${DateUtils.format(DateUtils.addDays(week.startDate, dayIndex))}</p>
                    </div>
                    
                    <div class="form-group">
                        <label>Type de séance</label>
                        <select id="new-session-type" class="form-input">
                            <optgroup label="Endurance">
                                <option value="footing">Footing</option>
                                <option value="sortie-moyenne">Sortie Moyenne</option>
                                <option value="sortie-longue">Sortie Longue</option>
                                <option value="regeneration">Régénération</option>
                            </optgroup>
                            <optgroup label="Qualité">
                                <option value="vma">VMA Courte</option>
                                <option value="vma-longue">VMA Longue</option>
                                <option value="seuil">Seuil</option>
                                <option value="tempo">Tempo Run</option>
                                <option value="fartlek">Fartlek</option>
                            </optgroup>
                            <optgroup label="Spécifique">
                                <option value="allure-course">Allure Course</option>
                                <option value="longue-specifique">Sortie Longue Spécifique</option>
                            </optgroup>
                            <optgroup label="Tests">
                                <option value="test-vma">Test VMA</option>
                                <option value="test-5km">Test 5km</option>
                            </optgroup>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Distance (km)</label>
                        <input type="number" id="new-session-distance" class="form-input" 
                               value="10" min="1" max="50" step="0.5">
                    </div>
                    
                    <div class="form-group">
                        <label>Description (optionnel)</label>
                        <textarea id="new-session-description" class="form-input" rows="3" 
                                  placeholder="Ex: 3x2000m à allure seuil, récup 2min"></textarea>
                    </div>
                </div>
                
                <div class="session-modal-footer">
                    <button class="btn-secondary" onclick="this.closest('.session-modal-overlay').remove()">
                        Annuler
                    </button>
                    <button class="btn-primary" onclick="SessionManager.addSession(${weekIndex}, ${dayIndex})">
                        ➕ Ajouter
                    </button>
                </div>
            </div>
        `;
        
        // Fermer en cliquant sur l'overlay
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
        
        return modal;
    },
    
    /**
     * Ajouter une séance
     */
    addSession(weekIndex, dayIndex) {
        const week = STATE.currentPlanData.plan[weekIndex];
        const paces = STATE.currentPlanData.paces;
        
        // Récupérer les valeurs
        const type = document.getElementById('new-session-type').value;
        const distance = parseFloat(document.getElementById('new-session-distance').value);
        const description = document.getElementById('new-session-description').value.trim();
        
        // Créer la nouvelle séance
        const newSession = this.createSessionFromType(type, distance, description, paces, dayIndex, week);
        
        // Ajouter à la semaine
        week.sessions.push(newSession);
        
        // Recalculer le kilométrage et TSS
        week.totalKm = Math.round(week.sessions.reduce((sum, s) => sum + (s.distance || 0), 0));
        week.tss = Math.round(week.sessions.reduce((sum, s) => 
            sum + VDOT.calculateTSS(s, paces), 0
        ));
        
        // Fermer le modal
        document.querySelector('.session-modal-overlay').remove();
        
        // Réafficher le plan
        this.refreshPlan();
        
        console.log(`✅ Séance ajoutée : Semaine ${weekIndex + 1}, ${CONFIG.fullDayNames[dayIndex]}`);
    },
    
    /**
     * Créer une séance selon le type
     */
    createSessionFromType(type, distance, description, paces, dayIndex, week) {
        const structures = {
            'footing': {
                type: 'Footing',
                intensity: 1,
                structure: {
                    bloc: `${Formatters.formatDuration(distance * (paces.E_low / 60))} en Endurance (~${Formatters.secondsToPace(paces.E_low)})`
                }
            },
            'sortie-moyenne': {
                type: 'Sortie Moyenne',
                intensity: 2,
                structure: {
                    bloc: `${Formatters.formatDuration(distance * (paces.E_low / 60))} en Endurance`
                }
            },
            'sortie-longue': {
                type: 'Sortie Longue',
                intensity: 2,
                structure: {
                    bloc: `${Formatters.formatDuration(distance * (paces.E_low / 60))} en Endurance`
                }
            },
            'regeneration': {
                type: 'Footing Régénération',
                intensity: 1,
                structure: {
                    bloc: `${Formatters.formatDuration(distance * (paces.E_high / 60))} très facile (${Formatters.secondsToPace(paces.E_high)})`
                }
            },
            'vma': {
                type: 'VMA Courte',
                intensity: 4,
                structure: {
                    echauffement: '20 min EF + 3 accélérations',
                    bloc: `10x 400m à ${Formatters.secondsToPace(paces.R)}`,
                    recuperation: '90 sec trot',
                    retourAuCalme: '15 min RC'
                }
            },
            'vma-longue': {
                type: 'VMA Longue',
                intensity: 4,
                structure: {
                    echauffement: '20 min EF + 3 accélérations',
                    bloc: `5x 1000m à ${Formatters.secondsToPace(paces.I)}`,
                    recuperation: '2 min trot',
                    retourAuCalme: '15 min RC'
                }
            },
            'seuil': {
                type: 'Seuil',
                intensity: 3,
                structure: {
                    echauffement: '20 min EF',
                    bloc: `3x 2000m à ${Formatters.secondsToPace(paces.T)}`,
                    recuperation: '90 sec trot',
                    retourAuCalme: '15 min RC'
                }
            },
            'tempo': {
                type: 'Tempo Run',
                intensity: 3,
                structure: {
                    echauffement: '15 min EF',
                    bloc: `20 min à ${Formatters.secondsToPace(paces.T)}`,
                    retourAuCalme: '10 min RC'
                }
            },
            'fartlek': {
                type: 'Fartlek',
                intensity: 3,
                structure: {
                    echauffement: '15 min EF',
                    bloc: '8x (2min rapide / 2min lent)',
                    retourAuCalme: '10 min RC'
                }
            },
            'allure-course': {
                type: 'Allure Course',
                intensity: 3,
                structure: {
                    echauffement: '20 min EF',
                    bloc: `${Math.floor(distance * 0.4)}km à ${Formatters.secondsToPace(paces.C)}`,
                    retourAuCalme: '10 min RC'
                }
            },
            'longue-specifique': {
                type: 'Sortie Longue Spécifique',
                intensity: 3,
                structure: {
                    bloc: `${Math.floor(distance * 0.7)}km EF + ${Math.floor(distance * 0.3)}km à ${Formatters.secondsToPace(paces.M)}`
                }
            },
            'test-vma': {
                type: '📊 Test VMA (Demi-Cooper)',
                intensity: 4,
                isTest: true,
                structure: {
                    echauffement: '20 min EF + 3 accélérations',
                    bloc: '6 minutes à intensité maximale - Notez la distance',
                    retourAuCalme: '15 min RC très facile'
                }
            },
            'test-5km': {
                type: '📊 Test 5km',
                intensity: 4,
                isTest: true,
                structure: {
                    echauffement: '20 min EF + 3 accélérations',
                    bloc: '5km à fond - Notez votre temps',
                    retourAuCalme: '15 min RC très facile'
                }
            }
        };
        
        const template = structures[type] || structures['footing'];
        
        const session = {
            ...template,
            distance: distance,
            day: dayIndex,
            fullDate: `${CONFIG.fullDayNames[dayIndex]} ${DateUtils.format(DateUtils.addDays(week.startDate, dayIndex))}`
        };
        
        // Ajouter la description personnalisée si fournie
        if (description) {
            session.structure.bloc = description;
        }
        
        return session;
    },
    
    /**
     * Rafraîchir l'affichage du plan
     */
    refreshPlan() {
        // Sauvegarder l'état des semaines ouvertes
        const openStates = new Map();
        document.querySelectorAll('.week-details').forEach((details, index) => {
            openStates.set(index.toString(), details.open);
        });
        
        // Sauvegarder la phase active
        const activeTab = document.querySelector('.phase-tab.active');
        const activePhase = activeTab ? activeTab.dataset.phase : null;
        
        // Réafficher
        Render.renderPlan(STATE.currentPlanData, openStates, activePhase);
        Render.renderLoadChart(STATE.currentPlanData);
        
        // Réinitialiser le drag & drop
        Interactions.setupDragDrop();
        
        // Réinitialiser les boutons d'ajout/suppression
        this.addSessionButtons();
    },
    
    /**
     * Ajouter les boutons d'ajout et suppression
     */
    addSessionButtons() {
        console.log('➕ Ajout des boutons de gestion de séances');
        
        // Bouton + sur les jours vides
        const emptySlots = document.querySelectorAll('.empty-day-slot');
        console.log(`   Jours vides trouvés: ${emptySlots.length}`);
        
        emptySlots.forEach(slot => {
            if (!slot.querySelector('.add-session-btn')) {
                const addBtn = document.createElement('button');
                addBtn.className = 'add-session-btn';
                addBtn.innerHTML = '➕';
                addBtn.title = 'Ajouter une séance';
                slot.appendChild(addBtn);
            }
        });
        
        // Bouton ✕ sur les cartes de séance
        const sessionCards = document.querySelectorAll('.session-card');
        console.log(`   Cartes de séance trouvées: ${sessionCards.length}`);
        
        sessionCards.forEach(card => {
            if (!card.querySelector('.delete-session-btn')) {
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-session-btn';
                deleteBtn.innerHTML = '✕';
                deleteBtn.title = 'Supprimer cette séance';
                card.appendChild(deleteBtn);
            }
        });
        
        console.log('✅ Boutons ajoutés');
    }
};

// Initialiser au chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log('📦 DOM chargé - Initialisation de SessionManager');
    SessionManager.init();
});

// Export global pour vérification
if (typeof window !== 'undefined') {
    window.SessionManager = SessionManager;
    console.log('🌍 SessionManager disponible globalement');
}
