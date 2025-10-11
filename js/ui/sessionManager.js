/**
 * ================================================
 * js/ui/sessionManager.js - Gestion des séances
 * ================================================
 * Ajout, suppression et modification de séances
 * Version complète avec modal structuré style Garmin
 */

const SessionManager = {
    // Variables globales pour le modal structuré
    currentSteps: [],
    currentPaces: null,
    
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
            if (e.target.classList.contains('delete-session-btn')) {
                e.stopPropagation();
                e.preventDefault();
                const sessionCard = e.target.closest('.session-card');
                if (sessionCard) {
                    SessionManager.deleteSession(sessionCard, e);
                }
            }
        }, true);
    },
    
    /**
     * Configurer le bouton d'ajout
     */
    setupAddButton() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('add-session-btn')) {
                const emptySlot = e.target.closest('.empty-day-slot');
                if (emptySlot) {
                    const weekContent = emptySlot.closest('.week-content');
                    const weekIndex = parseInt(weekContent.dataset.weekIndex);
                    const dayIndex = parseInt(emptySlot.dataset.dayIndex);
                    SessionManager.showAddSessionModal(weekIndex, dayIndex);
                }
            }
        });
    },
    
    /**
     * Supprimer une séance
     */
    deleteSession(sessionCard, event) {
        if (event) {
            event.stopImmediatePropagation();
            event.preventDefault();
        }
        
        const weekIndex = parseInt(sessionCard.dataset.weekIndex);
        const dayIndex = parseInt(sessionCard.dataset.dayIndex);
        const sessionIndex = parseInt(sessionCard.dataset.sessionIndex);
        
        const week = STATE.currentPlanData.plan[weekIndex];
        const session = week.sessions[sessionIndex];
        
        const confirmDelete = confirm(
            `Supprimer cette séance ?\n\n` +
            `${CONFIG.fullDayNames[dayIndex]} : ${session.type}\n` +
            `Distance : ${session.distance?.toFixed(1) || '?'} km`
        );
        
        if (!confirmDelete) return;
        
        week.sessions.splice(sessionIndex, 1);
        week.totalKm = week.sessions.reduce((sum, s) => sum + (s.distance || 0), 0);
        week.tss = week.sessions.reduce((sum, s) => 
            sum + VDOT.calculateTSS(s, STATE.currentPlanData.paces), 0
        );
        
        SessionManager.refreshPlan();
        console.log(`✅ Séance supprimée : Semaine ${weekIndex + 1}, ${CONFIG.fullDayNames[dayIndex]}`);
    },
    
    /**
     * Afficher le modal d'ajout de séance
     */
    showAddSessionModal(weekIndex, dayIndex) {
        const week = STATE.currentPlanData.plan[weekIndex];
        const paces = STATE.currentPlanData.paces;
        
        const modal = SessionManager.createAddSessionModal(weekIndex, dayIndex, week, paces);
        document.body.appendChild(modal);
        
        setTimeout(() => modal.classList.add('show'), 10);
    },
    
    /**
     * Créer le HTML du modal d'ajout
     */
    createAddSessionModal(weekIndex, dayIndex, week, paces) {
        const modal = document.createElement('div');
        modal.className = 'session-modal-overlay';
        modal.innerHTML = `
            <div class="session-modal-structured">
                <div class="session-modal-header">
                    <h3>➕ Ajouter une séance</h3>
                    <p class="text-sm">Semaine ${week.weekNumber} - ${CONFIG.fullDayNames[dayIndex]} ${DateUtils.format(DateUtils.addDays(week.startDate, dayIndex))}</p>
                    <button class="close-modal-btn" onclick="this.closest('.session-modal-overlay').remove()">✕</button>
                </div>
                
                <div class="session-modal-body-structured">
                    <div class="session-steps-container" id="session-steps">
                        <!-- Les étapes seront ajoutées ici -->
                    </div>
                    
                    <div class="session-actions">
                        <button class="btn-add-step" onclick="SessionManager.addStepToSession()">
                            ➕ Ajouter une étape
                        </button>
                    </div>
                    
                    <div class="session-summary">
                        <div class="summary-item">
                            <span class="summary-label">Durée totale estimée</span>
                            <span class="summary-value" id="total-duration">0:00</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">Distance estimée</span>
                            <span class="summary-value" id="total-distance">0.00 km</span>
                        </div>
                    </div>
                </div>
                
                <div class="session-modal-footer">
                    <button class="btn-secondary" onclick="this.closest('.session-modal-overlay').remove()">
                        Annuler
                    </button>
                    <button class="btn-primary" onclick="SessionManager.saveStructuredSession(${weekIndex}, ${dayIndex})">
                        💾 Enregistrer l'entraînement
                    </button>
                </div>
            </div>
        `;
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
        
        setTimeout(() => {
            SessionManager.currentSteps = [];
            SessionManager.currentPaces = paces;
            SessionManager.addStepToSession('Échauffement');
        }, 100);
        
        return modal;
    },
    
    /**
     * Ajouter une étape à la séance
     */
    addStepToSession(defaultType = 'Course à pied') {
        const stepId = `step-${Date.now()}`;
        const step = {
            id: stepId,
            type: defaultType,
            durationType: 'time',
            duration: defaultType === 'Échauffement' ? 20 : 10,
            distance: 1,
            distanceUnit: 'km',  // 🆕 Unité de distance (km ou m)
            pace: 'E',
            repeat: 1,
            isRepeat: false,
            recovery: {  // 🆕 Récupération entre répétitions
                type: 'time',  // 'time' ou 'distance'
                value: 90,  // 90 secondes ou distance
                unit: 'sec',  // 'sec', 'min', 'm', 'km'
                intensity: 'none'  // 'none' ou code allure
            }
        };
        
        SessionManager.currentSteps.push(step);
        SessionManager.renderSteps();
        SessionManager.updateSummary();
    },
    
    /**
     * Afficher toutes les étapes
     */
    renderSteps() {
        const container = document.getElementById('session-steps');
        if (!container) return;
        
        container.innerHTML = SessionManager.currentSteps.map(step => `
            <div class="session-step" data-step-id="${step.id}">
                <div class="step-header">
                    <div class="step-drag-handle">⋮⋮</div>
                    <input type="text" class="step-title" value="${step.type}" 
                           onchange="SessionManager.updateStep('${step.id}', 'type', this.value)"
                           placeholder="Nom de l'étape">
                    <button class="step-delete" onclick="SessionManager.deleteStep('${step.id}')">
                        🗑️
                    </button>
                </div>
                
                <div class="step-body">
                    ${step.isRepeat ? `
                        <div class="step-row">
                            <label>Répéter</label>
                            <div class="step-input-group">
                                <input type="number" value="${step.repeat}" min="1" max="50"
                                       onchange="SessionManager.updateStep('${step.id}', 'repeat', this.value)">
                                <span>Fois</span>
                            </div>
                        </div>
                    ` : ''}
                    
                    <div class="step-row">
                        <label>Durée/Distance</label>
                        <div class="step-toggle-group">
                            <button class="step-toggle ${step.durationType === 'time' ? 'active' : ''}"
                                    onclick="SessionManager.updateStep('${step.id}', 'durationType', 'time')">
                                Temps
                            </button>
                            <button class="step-toggle ${step.durationType === 'distance' ? 'active' : ''}"
                                    onclick="SessionManager.updateStep('${step.id}', 'durationType', 'distance')">
                                Distance
                            </button>
                        </div>
                    </div>
                    
                    ${step.durationType === 'time' ? `
                        <div class="step-row">
                            <label>Temps total</label>
                            <div class="step-input-group">
                                <input type="number" value="${step.duration}" min="1" max="300"
                                       onchange="SessionManager.updateStep('${step.id}', 'duration', this.value)">
                                <span>min</span>
                            </div>
                        </div>
                    ` : `
                        <div class="step-row">
                            <label>Distance totale</label>
                            <div class="step-input-group">
                                <input type="number" value="${step.distance}" min="0.1" max="50000" step="0.1"
                                       onchange="SessionManager.updateStep('${step.id}', 'distance', this.value)">
                                <select class="step-unit-select"
                                        onchange="SessionManager.updateStep('${step.id}', 'distanceUnit', this.value)">
                                    <option value="km" ${step.distanceUnit === 'km' ? 'selected' : ''}>km</option>
                                    <option value="m" ${step.distanceUnit === 'm' ? 'selected' : ''}>m</option>
                                </select>
                            </div>
                        </div>
                    `}
                    
                    <div class="step-row">
                        <label>Allure</label>
                        <select class="step-select" 
                                onchange="SessionManager.updateStep('${step.id}', 'pace', this.value)">
                            <option value="E" ${step.pace === 'E' ? 'selected' : ''}>Endurance (${Formatters.secondsToPace(SessionManager.currentPaces.E_low)})</option>
                            <option value="M" ${step.pace === 'M' ? 'selected' : ''}>Marathon (${Formatters.secondsToPace(SessionManager.currentPaces.M)})</option>
                            <option value="T" ${step.pace === 'T' ? 'selected' : ''}>Seuil (${Formatters.secondsToPace(SessionManager.currentPaces.T)})</option>
                            <option value="I" ${step.pace === 'I' ? 'selected' : ''}>Intervalle (${Formatters.secondsToPace(SessionManager.currentPaces.I)})</option>
                            <option value="R" ${step.pace === 'R' ? 'selected' : ''}>Répétition (${Formatters.secondsToPace(SessionManager.currentPaces.R)})</option>
                            <option value="C" ${step.pace === 'C' ? 'selected' : ''}>Course (${Formatters.secondsToPace(SessionManager.currentPaces.C)})</option>
                        </select>
                    </div>
                    
                    ${step.isRepeat ? `
                        <div class="step-recovery-section">
                            <div class="step-row">
                                <label>Récupération</label>
                                <div class="step-toggle-group">
                                    <button class="step-toggle ${step.recovery.type === 'time' ? 'active' : ''}"
                                            onclick="SessionManager.updateRecovery('${step.id}', 'type', 'time')">
                                        Temps
                                    </button>
                                    <button class="step-toggle ${step.recovery.type === 'distance' ? 'active' : ''}"
                                            onclick="SessionManager.updateRecovery('${step.id}', 'type', 'distance')">
                                        Distance
                                    </button>
                                </div>
                            </div>
                            
                            ${step.recovery.type === 'time' ? `
                                <div class="step-row">
                                    <label>Durée récup</label>
                                    <div class="step-input-group">
                                        <input type="number" value="${step.recovery.unit === 'min' ? step.recovery.value : step.recovery.value}" 
                                               min="1" max="600"
                                               onchange="SessionManager.updateRecovery('${step.id}', 'value', this.value)">
                                        <select class="step-unit-select"
                                                onchange="SessionManager.updateRecovery('${step.id}', 'unit', this.value)">
                                            <option value="sec" ${step.recovery.unit === 'sec' ? 'selected' : ''}>sec</option>
                                            <option value="min" ${step.recovery.unit === 'min' ? 'selected' : ''}>min</option>
                                        </select>
                                    </div>
                                </div>
                            ` : `
                                <div class="step-row">
                                    <label>Distance récup</label>
                                    <div class="step-input-group">
                                        <input type="number" value="${step.recovery.value}" 
                                               min="1" max="5000" step="1"
                                               onchange="SessionManager.updateRecovery('${step.id}', 'value', this.value)">
                                        <select class="step-unit-select"
                                                onchange="SessionManager.updateRecovery('${step.id}', 'unit', this.value)">
                                            <option value="m" ${step.recovery.unit === 'm' ? 'selected' : ''}>m</option>
                                            <option value="km" ${step.recovery.unit === 'km' ? 'selected' : ''}>km</option>
                                        </select>
                                    </div>
                                </div>
                            `}
                            
                            <div class="step-row">
                                <label>Intensité récup</label>
                                <select class="step-select"
                                        onchange="SessionManager.updateRecovery('${step.id}', 'intensity', this.value)">
                                    <option value="none" ${step.recovery.intensity === 'none' ? 'selected' : ''}>Pas de cible</option>
                                    <option value="E" ${step.recovery.intensity === 'E' ? 'selected' : ''}>Endurance (${Formatters.secondsToPace(SessionManager.currentPaces.E_low)})</option>
                                    <option value="M" ${step.recovery.intensity === 'M' ? 'selected' : ''}>Marathon (${Formatters.secondsToPace(SessionManager.currentPaces.M)})</option>
                                    <option value="T" ${step.recovery.intensity === 'T' ? 'selected' : ''}>Seuil (${Formatters.secondsToPace(SessionManager.currentPaces.T)})</option>
                                </select>
                            </div>
                        </div>
                    ` : `
                        <div class="step-row">
                            <button class="btn-convert-repeat" onclick="SessionManager.convertToRepeat('${step.id}')">
                                🔁 Convertir en répétition
                            </button>
                        </div>
                    `}
                </div>
            </div>
        `).join('');
    },
    
    /**
     * Mettre à jour une étape
     */
    updateStep(stepId, field, value) {
        const step = SessionManager.currentSteps.find(s => s.id === stepId);
        if (!step) return;
        
        step[field] = field === 'repeat' || field === 'duration' ? parseInt(value) : 
                      field === 'distance' ? parseFloat(value) : value;
        
        if (field === 'durationType') {
            // Réinitialiser les valeurs par défaut
            if (value === 'distance') {
                step.distance = 1;
                step.distanceUnit = 'km';
            }
            SessionManager.renderSteps();
        }
        
        SessionManager.updateSummary();
    },
    
    /**
     * Mettre à jour la récupération d'une étape
     */
    updateRecovery(stepId, field, value) {
        const step = SessionManager.currentSteps.find(s => s.id === stepId);
        if (!step || !step.recovery) return;
        
        step.recovery[field] = field === 'value' ? 
            (step.recovery.type === 'time' && step.recovery.unit === 'sec' ? parseInt(value) : parseFloat(value)) : 
            value;
        
        if (field === 'type') {
            // Réinitialiser les valeurs par défaut
            if (value === 'time') {
                step.recovery.value = 90;
                step.recovery.unit = 'sec';
            } else {
                step.recovery.value = 200;
                step.recovery.unit = 'm';
            }
            SessionManager.renderSteps();
        }
        
        if (field === 'unit') {
            // Convertir les valeurs si nécessaire
            if (step.recovery.type === 'time') {
                if (value === 'min' && step.recovery.unit !== 'min') {
                    step.recovery.value = Math.round(step.recovery.value / 60);
                } else if (value === 'sec' && step.recovery.unit === 'min') {
                    step.recovery.value = step.recovery.value * 60;
                }
            } else {
                if (value === 'km' && step.recovery.unit === 'm') {
                    step.recovery.value = step.recovery.value / 1000;
                } else if (value === 'm' && step.recovery.unit === 'km') {
                    step.recovery.value = step.recovery.value * 1000;
                }
            }
            SessionManager.renderSteps();
        }
        
        SessionManager.updateSummary();
    },
    
    /**
     * Supprimer une étape
     */
    deleteStep(stepId) {
        SessionManager.currentSteps = SessionManager.currentSteps.filter(s => s.id !== stepId);
        SessionManager.renderSteps();
        SessionManager.updateSummary();
    },
    
    /**
     * Convertir en répétition
     */
    convertToRepeat(stepId) {
        const step = SessionManager.currentSteps.find(s => s.id === stepId);
        if (!step) return;
        
        step.isRepeat = true;
        step.repeat = 6;
        // Initialiser la récupération si elle n'existe pas
        if (!step.recovery) {
            step.recovery = {
                type: 'time',
                value: 90,
                unit: 'sec',
                intensity: 'none'
            };
        }
        SessionManager.renderSteps();
    },
    
    /**
     * Mettre à jour le résumé
     */
    updateSummary() {
        let totalMinutes = 0;
        let totalDistance = 0;
        
        SessionManager.currentSteps.forEach(step => {
            const repeat = step.isRepeat ? step.repeat : 1;
            const paces = SessionManager.currentPaces;
            
            // Distance de l'étape en km
            let stepDistanceKm = 0;
            if (step.durationType === 'distance') {
                stepDistanceKm = step.distanceUnit === 'm' ? step.distance / 1000 : step.distance;
            }
            
            if (step.durationType === 'time') {
                totalMinutes += step.duration * repeat;
                const paceSeconds = paces[step.pace] || paces.E_low;
                totalDistance += (step.duration * 60 / paceSeconds) * repeat;
            } else {
                totalDistance += stepDistanceKm * repeat;
                const paceSeconds = paces[step.pace] || paces.E_low;
                totalMinutes += (stepDistanceKm * paceSeconds / 60) * repeat;
            }
            
            // Ajouter le temps/distance de récupération
            if (step.isRepeat && step.recovery && repeat > 1) {
                const recupCount = repeat - 1; // Une récup de moins que de répétitions
                
                if (step.recovery.type === 'time') {
                    const recupMinutes = step.recovery.unit === 'min' ? 
                        step.recovery.value : step.recovery.value / 60;
                    totalMinutes += recupMinutes * recupCount;
                    
                    // Estimer la distance de récupération
                    if (step.recovery.intensity !== 'none') {
                        const recupPace = paces[step.recovery.intensity] || paces.E_high;
                        totalDistance += (recupMinutes * 60 / recupPace) * recupCount;
                    }
                } else {
                    const recupDistanceKm = step.recovery.unit === 'm' ? 
                        step.recovery.value / 1000 : step.recovery.value;
                    totalDistance += recupDistanceKm * recupCount;
                    
                    // Estimer le temps de récupération
                    if (step.recovery.intensity !== 'none') {
                        const recupPace = paces[step.recovery.intensity] || paces.E_high;
                        totalMinutes += (recupDistanceKm * recupPace / 60) * recupCount;
                    } else {
                        // Estimer à allure E si pas de cible
                        totalMinutes += (recupDistanceKm * paces.E_high / 60) * recupCount;
                    }
                }
            }
        });
        
        const durationEl = document.getElementById('total-duration');
        const distanceEl = document.getElementById('total-distance');
        
        if (durationEl) {
            const hours = Math.floor(totalMinutes / 60);
            const mins = Math.round(totalMinutes % 60);
            durationEl.textContent = hours > 0 ? `${hours}:${mins.toString().padStart(2, '0')}` : `${mins}:00`;
        }
        
        if (distanceEl) {
            distanceEl.textContent = `${totalDistance.toFixed(2)} km`;
        }
    },
    
    /**
     * Sauvegarder la séance structurée
     */
    saveStructuredSession(weekIndex, dayIndex) {
        if (!SessionManager.currentSteps || SessionManager.currentSteps.length === 0) {
            alert('Veuillez ajouter au moins une étape à la séance');
            return;
        }
        
        const week = STATE.currentPlanData.plan[weekIndex];
        const paces = STATE.currentPlanData.paces;
        
        let totalDistance = 0;
        let maxIntensity = 1;
        
        SessionManager.currentSteps.forEach(step => {
            const repeat = step.isRepeat ? step.repeat : 1;
            
            // Calculer la distance de l'étape
            let stepDistanceKm = 0;
            if (step.durationType === 'time') {
                const paceSeconds = paces[step.pace] || paces.E_low;
                stepDistanceKm = (step.duration * 60 / paceSeconds) * repeat;
            } else {
                stepDistanceKm = (step.distanceUnit === 'm' ? step.distance / 1000 : step.distance) * repeat;
            }
            
            totalDistance += stepDistanceKm;
            
            // Ajouter la distance de récupération
            if (step.isRepeat && step.recovery && repeat > 1) {
                const recupCount = repeat - 1;
                if (step.recovery.type === 'distance') {
                    const recupDistanceKm = step.recovery.unit === 'm' ? 
                        step.recovery.value / 1000 : step.recovery.value;
                    totalDistance += recupDistanceKm * recupCount;
                } else if (step.recovery.intensity !== 'none') {
                    // Estimer la distance si récup en temps avec intensité
                    const recupMinutes = step.recovery.unit === 'min' ? 
                        step.recovery.value : step.recovery.value / 60;
                    const recupPace = paces[step.recovery.intensity] || paces.E_high;
                    totalDistance += (recupMinutes * 60 / recupPace) * recupCount;
                }
            }
            
            const intensityMap = { E: 1, M: 2, T: 3, I: 4, R: 4, C: 3 };
            maxIntensity = Math.max(maxIntensity, intensityMap[step.pace] || 1);
        });
        
        const sessionName = SessionManager.currentSteps[0]?.type || 'Séance personnalisée';
        
        // Créer la structure
        const structure = {};
        SessionManager.currentSteps.forEach((step, index) => {
            const repeat = step.isRepeat ? step.repeat : 1;
            const paceStr = Formatters.secondsToPace(paces[step.pace]);
            
            let desc;
            if (step.durationType === 'time') {
                desc = repeat > 1 
                    ? `${repeat}x ${step.duration} min à ${paceStr}`
                    : `${step.duration} min à ${paceStr}`;
            } else {
                const distValue = step.distanceUnit === 'm' ? 
                    `${step.distance}m` : `${step.distance}km`;
                desc = repeat > 1
                    ? `${repeat}x ${distValue} à ${paceStr}`
                    : `${distValue} à ${paceStr}`;
            }
            
            // Ajouter la récupération si applicable
            if (step.isRepeat && step.recovery) {
                let recupDesc = '';
                if (step.recovery.type === 'time') {
                    recupDesc = step.recovery.unit === 'min' ?
                        `${step.recovery.value} min` : `${step.recovery.value} sec`;
                } else {
                    recupDesc = step.recovery.unit === 'm' ?
                        `${step.recovery.value}m` : `${step.recovery.value}km`;
                }
                
                if (step.recovery.intensity !== 'none') {
                    const recupPaceStr = Formatters.secondsToPace(paces[step.recovery.intensity]);
                    structure.recuperation = `${recupDesc} à ${recupPaceStr}`;
                } else {
                    structure.recuperation = `${recupDesc} trot`;
                }
            }
            
            if (index === 0) structure.echauffement = desc;
            else if (index === SessionManager.currentSteps.length - 1) structure.retourAuCalme = desc;
            else structure.bloc = (structure.bloc ? structure.bloc + ' + ' : '') + desc;
        });
        
        const newSession = {
            type: sessionName,
            intensity: maxIntensity,
            structure: structure,
            distance: totalDistance,
            day: dayIndex,
            fullDate: `${CONFIG.fullDayNames[dayIndex]} ${DateUtils.format(DateUtils.addDays(week.startDate, dayIndex))}`
        };
        
        week.sessions.push(newSession);
        week.totalKm = Math.round(week.sessions.reduce((sum, s) => sum + (s.distance || 0), 0));
        week.tss = Math.round(week.sessions.reduce((sum, s) => 
            sum + VDOT.calculateTSS(s, paces), 0
        ));
        
        document.querySelector('.session-modal-overlay').remove();
        SessionManager.refreshPlan();
        
        console.log(`✅ Séance structurée ajoutée : Semaine ${weekIndex + 1}, ${CONFIG.fullDayNames[dayIndex]}`);
    },
    
    /**
     * Rafraîchir l'affichage du plan
     */
    refreshPlan() {
        const openStates = new Map();
        document.querySelectorAll('.week-details').forEach((details, index) => {
            openStates.set(index.toString(), details.open);
        });
        
        const activeTab = document.querySelector('.phase-tab.active');
        const activePhase = activeTab ? activeTab.dataset.phase : null;
        
        Render.renderPlan(STATE.currentPlanData, openStates, activePhase);
        Render.renderLoadChart(STATE.currentPlanData);
        Interactions.setupDragDrop();
        SessionManager.addSessionButtons();
    },
    
    /**
     * Ajouter les boutons d'ajout et suppression
     */
    addSessionButtons() {
        console.log('➕ Ajout des boutons de gestion de séances');
        
        document.querySelectorAll('.empty-day-slot').forEach(slot => {
            if (!slot.querySelector('.add-session-btn')) {
                const addBtn = document.createElement('button');
                addBtn.className = 'add-session-btn';
                addBtn.innerHTML = '➕';
                addBtn.title = 'Ajouter une séance';
                slot.appendChild(addBtn);
            }
        });
        
        document.querySelectorAll('.session-card').forEach(card => {
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

// Export global
if (typeof window !== 'undefined') {
    window.SessionManager = SessionManager;
    console.log('🌍 SessionManager disponible globalement');
}
