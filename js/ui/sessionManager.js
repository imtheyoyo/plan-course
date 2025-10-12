/**
 * ================================================
 * SessionManager.js
 * Version: 9.2.0
 * Date: 2025-01-11
 * Heure: 16:00 UTC
 * ================================================
 * IMPORTANT: Support du format liste pyramide
 * - Format répétitions: "10x 400m + 5x 1000m"
 * - Format liste: "400m + 600m + 800m à 4:20/km" ← NOUVEAU
 * ================================================
 */

const SessionManager = {
    // Variables globales pour le modal structuré
    currentSteps: [],
    currentPaces: null,
    
    /**
     * Initialiser les événements
     */
    init() {
        console.log('🔧 Initialisation de SessionManager V9');
        this.setupDeleteButtons();
        this.setupAddButton();
    },
    
    /**
     * Obtenir l'allure correcte depuis l'objet paces
     * IMPORTANT : Résout le bug N/A en mappant E -> E_low
     */
    getPaceValue(paces, paceKey) {
        // Mapping des clés courtes vers les clés du STATE
        const paceMap = {
            'E': 'E_low',    // Endurance facile
            'M': 'M',        // Marathon
            'T': 'T',        // Tempo/Seuil
            'I': 'I',        // Intervalle
            'R': 'R',        // Répétition
            'C': 'C'         // Course
        };
        
        const actualKey = paceMap[paceKey] || paceKey;
        const paceValue = paces[actualKey];
        
        if (!paceValue) {
            console.warn(`⚠️ Allure non trouvée pour: ${paceKey} (cherché: ${actualKey})`);
            console.log('=== DIAGNOSTIC ===');
            console.log('1. Clé demandée:', paceKey);
            console.log('2. Clé mappée:', actualKey);
            console.log('3. Clés disponibles:', Object.keys(paces));
            console.log('4. Valeur trouvée:', paceValue);
            return paces.E_low || 360; // Fallback sur endurance ou 6:00/km
        }
        
        return paceValue;
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
     * Afficher le modal d'édition de séance
     */
    showEditSessionModal(sessionCard) {
        const weekIndex = parseInt(sessionCard.dataset.weekIndex);
        const sessionIndex = parseInt(sessionCard.dataset.sessionIndex);
        const dayIndex = parseInt(sessionCard.dataset.dayIndex);
        
        const week = STATE.currentPlanData.plan[weekIndex];
        const session = week.sessions[sessionIndex];
        const paces = STATE.currentPlanData.paces;
        
        const modal = SessionManager.createEditSessionModal(weekIndex, sessionIndex, dayIndex, session, week, paces);
        document.body.appendChild(modal);
        
        setTimeout(() => modal.classList.add('show'), 10);
    },
    
    /**
     * Créer le modal d'édition
     */
    createEditSessionModal(weekIndex, sessionIndex, dayIndex, session, week, paces) {
        const modal = document.createElement('div');
        modal.className = 'session-modal-overlay';
        modal.innerHTML = `
            <div class="session-modal-structured">
                <div class="session-modal-header">
                    <h3>✏️ Modifier la séance</h3>
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
                    <button class="btn-primary" onclick="SessionManager.updateStructuredSession(${weekIndex}, ${sessionIndex}, ${dayIndex})">
                        💾 Enregistrer les modifications
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
            SessionManager.loadSessionSteps(session);
        }, 100);
        
        return modal;
    },
    
    /**
     * Charger les étapes d'une séance existante
     */
    loadSessionSteps(session) {
        console.log('📥 Chargement de la séance:', session);
        const steps = [];
        
        // Échauffement
        if (session.structure?.echauffement) {
            console.log('🔥 Parsing échauffement:', session.structure.echauffement);
            const step = SessionManager.parseStepFromDescription('Échauffement', session.structure.echauffement);
            steps.push(step);
        }
        
        // Bloc principal - détecter les répétitions
        if (session.structure?.bloc) {
            console.log('💪 Parsing bloc principal:', session.structure.bloc);
            const isRepeat = session.structure.bloc.includes('x') || session.structure.bloc.includes('X');
            
            if (isRepeat) {
                const step = SessionManager.parseStepFromDescription(
                    session.type, 
                    session.structure.bloc, 
                    true // Indiquer que c'est une répétition
                );
                
                // Ajouter la récupération si elle existe
                if (session.structure?.recuperation) {
                    console.log('🔄 Parsing récupération:', session.structure.recuperation);
                    step.recovery = SessionManager.parseRecoveryFromDescription(session.structure.recuperation);
                }
                
                steps.push(step);
            } else {
                steps.push(SessionManager.parseStepFromDescription(session.type, session.structure.bloc));
            }
        }
        
        // Retour au calme
        if (session.structure?.retourAuCalme) {
            console.log('🧘 Parsing retour au calme:', session.structure.retourAuCalme);
            const step = SessionManager.parseStepFromDescription('Retour au calme', session.structure.retourAuCalme);
            steps.push(step);
        }
        
        // Si aucune étape n'a pu être parsée, créer une étape par défaut
        if (steps.length === 0) {
            console.warn('⚠️ Aucune étape parsée, création d\'une étape par défaut');
            steps.push({
                id: `step-${Date.now()}`,
                type: session.type || 'Séance',
                durationType: 'distance',
                duration: 30,
                distance: session.distance || 10,
                distanceUnit: 'km',
                pace: 'E',
                repeat: 1,
                isRepeat: false,
                recovery: {
                    type: 'time',
                    value: 90,
                    unit: 'sec',
                    intensity: 'none'
                }
            });
        }
        
        console.log('✅ Étapes chargées:', steps);
        SessionManager.currentSteps = steps;
        SessionManager.renderSteps();
        SessionManager.updateSummary();
    },
    
    /**
     * Parser une description d'étape
     */
    parseStepFromDescription(name, description, isRepeat = false) {
        const step = {
            id: `step-${Date.now()}-${Math.random()}`,
            type: name,
            durationType: 'time',
            duration: 20,
            distance: 1,
            distanceUnit: 'km',
            pace: 'E',
            repeat: 1,
            isRepeat: isRepeat,
            recovery: {
                type: 'time',
                value: 90,
                unit: 'sec',
                intensity: 'none'
            }
        };
        
        // Parser les répétitions (ex: "10x 400m", "8x 30 sec")
        const repeatMatch = description.match(/(\d+)x\s*/i);
        if (repeatMatch) {
            step.repeat = parseInt(repeatMatch[1]);
            step.isRepeat = true;
            console.log(`🔁 Répétition détectée: ${step.repeat}x`);
        }
        
        // Parser le temps (ex: "20 min", "35min", "30 sec")
        const timeMinMatch = description.match(/(\d+)\s*min(?!\s*à)/i);
        if (timeMinMatch) {
            step.durationType = 'time';
            step.duration = parseInt(timeMinMatch[1]);
            console.log(`⏱️ Temps détecté: ${step.duration} min`);
        }
        
        // Parser les secondes (ex: "30 sec", "45sec") - pour les intervalles courts
        const timeSecMatch = description.match(/(\d+)\s*sec/i);
        if (timeSecMatch && !timeMinMatch) {
            step.durationType = 'time';
            // Convertir en minutes pour uniformiser
            step.duration = Math.round(parseInt(timeSecMatch[1]) / 60 * 10) / 10; // Arrondi à 0.1 près
            if (step.duration < 1) step.duration = 1; // Minimum 1 minute pour l'UI
            console.log(`⏱️ Secondes détectées: ${timeSecMatch[1]}s → ${step.duration} min`);
        }
        
        // Parser la distance en mètres (ex: "400m", "1000m")
        const distanceMetersMatch = description.match(/(?<!\d)(\d+(?:\.\d+)?)\s*m(?!\s*min)(?=\s|$|à)/i);
        if (distanceMetersMatch && !timeMinMatch && !timeSecMatch) {
            step.durationType = 'distance';
            step.distance = parseFloat(distanceMetersMatch[1]);
            step.distanceUnit = 'm';
            console.log(`📏 Distance détectée: ${step.distance}m`);
        }
        
        // Parser la distance en km (ex: "5km", "2.5 km")
        const distanceKmMatch = description.match(/(\d+(?:\.\d+)?)\s*km(?=\s|$|à)/i);
        if (distanceKmMatch && !timeMinMatch && !timeSecMatch && !distanceMetersMatch) {
            step.durationType = 'distance';
            step.distance = parseFloat(distanceKmMatch[1]);
            step.distanceUnit = 'km';
            console.log(`📏 Distance détectée: ${step.distance}km`);
        }
        
        const paces = SessionManager.currentPaces;
        if (!paces) {
            step.pace = 'E';
            return step;
        }
        
        if (paces.R && description.includes(Formatters.secondsToPace(paces.R))) step.pace = 'R';
        else if (paces.I && description.includes(Formatters.secondsToPace(paces.I))) step.pace = 'I';
        else if (paces.T && description.includes(Formatters.secondsToPace(paces.T))) step.pace = 'T';
        else if (paces.M && description.includes(Formatters.secondsToPace(paces.M))) step.pace = 'M';
        else if (paces.C && description.includes(Formatters.secondsToPace(paces.C))) step.pace = 'C';
        else if (paces.E_high && description.includes(Formatters.secondsToPace(paces.E_high))) step.pace = 'E';
        else if (paces.E_low && description.includes(Formatters.secondsToPace(paces.E_low))) step.pace = 'E';
        else step.pace = 'E';
        
        return step;
    },
    
    /**
     * Parser une description de récupération
     */
    parseRecoveryFromDescription(description) {
        const recovery = {
            type: 'time',
            value: 90,
            unit: 'sec',
            intensity: 'none'
        };
        
        const timeSecMatch = description.match(/(\d+)\s*sec/i);
        if (timeSecMatch) {
            recovery.type = 'time';
            recovery.value = parseInt(timeSecMatch[1]);
            recovery.unit = 'sec';
        }
        
        const timeMinMatch = description.match(/(\d+)\s*min/i);
        if (timeMinMatch && !timeSecMatch) {
            recovery.type = 'time';
            recovery.value = parseInt(timeMinMatch[1]);
            recovery.unit = 'min';
        }
        
        const distanceMetersMatch = description.match(/(\d+)\s*m(?!\s*min)/i);
        if (distanceMetersMatch) {
            recovery.type = 'distance';
            recovery.value = parseInt(distanceMetersMatch[1]);
            recovery.unit = 'm';
        }
        
        const distanceKmMatch = description.match(/(\d+(?:\.\d+)?)\s*km/i);
        if (distanceKmMatch && !distanceMetersMatch) {
            recovery.type = 'distance';
            recovery.value = parseFloat(distanceKmMatch[1]);
            recovery.unit = 'km';
        }
        
        const paces = SessionManager.currentPaces;
        if (!paces) {
            recovery.intensity = 'none';
            return recovery;
        }
        
        if (paces.E_low && description.includes(Formatters.secondsToPace(paces.E_low))) {
            recovery.intensity = 'E';
        } else if (paces.E_high && description.includes(Formatters.secondsToPace(paces.E_high))) {
            recovery.intensity = 'E';
        } else if (paces.M && description.includes(Formatters.secondsToPace(paces.M))) {
            recovery.intensity = 'M';
        } else if (paces.T && description.includes(Formatters.secondsToPace(paces.T))) {
            recovery.intensity = 'T';
        } else if (description.includes('trot')) {
            recovery.intensity = 'none';
        }
        
        return recovery;
    },
    
    /**
     * Mettre à jour une séance existante
     */
    updateStructuredSession(weekIndex, sessionIndex, dayIndex) {
        if (!SessionManager.currentSteps || SessionManager.currentSteps.length === 0) {
            alert('Veuillez ajouter au moins une étape à la séance');
            return;
        }
        
        const week = STATE.currentPlanData.plan[weekIndex];
        const paces = STATE.currentPlanData.paces;
        
        if (!paces) {
            console.error('⚠️ Paces non disponibles');
            alert('Erreur : Les allures ne sont pas disponibles');
            return;
        }
        
        let totalDistance = 0;
        let maxIntensity = 1;
        
        SessionManager.currentSteps.forEach(step => {
            const repeat = step.isRepeat ? step.repeat : 1;
            
            let stepDistanceKm = 0;
            if (step.durationType === 'time') {
                const paceSeconds = SessionManager.getPaceValue(paces, step.pace);
                stepDistanceKm = (step.duration * 60 / paceSeconds) * repeat;
            } else {
                stepDistanceKm = (step.distanceUnit === 'm' ? step.distance / 1000 : step.distance) * repeat;
            }
            
            totalDistance += stepDistanceKm;
            
            if (step.isRepeat && step.recovery && repeat > 1) {
                const recupCount = repeat - 1;
                if (step.recovery.type === 'distance') {
                    const recupDistanceKm = step.recovery.unit === 'm' ? 
                        step.recovery.value / 1000 : step.recovery.value;
                    totalDistance += recupDistanceKm * recupCount;
                } else if (step.recovery.intensity !== 'none') {
                    const recupMinutes = step.recovery.unit === 'min' ? 
                        step.recovery.value : step.recovery.value / 60;
                    const recupPace = SessionManager.getPaceValue(paces, step.recovery.intensity);
                    totalDistance += (recupMinutes * 60 / recupPace) * recupCount;
                }
            }
            
            const intensityMap = { E: 1, M: 2, T: 3, I: 4, R: 4, C: 3 };
            maxIntensity = Math.max(maxIntensity, intensityMap[step.pace] || 1);
        });
        
        const sessionName = SessionManager.currentSteps[0]?.type || 'Séance personnalisée';
        
        const structure = {};
        SessionManager.currentSteps.forEach((step, index) => {
            const repeat = step.isRepeat ? step.repeat : 1;
            const paceValue = SessionManager.getPaceValue(paces, step.pace);
            const paceStr = Formatters.secondsToPace(paceValue);
            
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
                    const recupPaceValue = SessionManager.getPaceValue(paces, step.recovery.intensity);
                    const recupPaceStr = Formatters.secondsToPace(recupPaceValue);
                    structure.recuperation = `${recupDesc} à ${recupPaceStr}`;
                } else {
                    structure.recuperation = `${recupDesc} trot`;
                }
            }
            
            if (index === 0) structure.echauffement = desc;
            else if (index === SessionManager.currentSteps.length - 1) structure.retourAuCalme = desc;
            else structure.bloc = (structure.bloc ? structure.bloc + ' + ' : '') + desc;
        });
        
        week.sessions[sessionIndex] = {
            type: sessionName,
            intensity: maxIntensity,
            structure: structure,
            distance: totalDistance,
            day: dayIndex,
            fullDate: `${CONFIG.fullDayNames[dayIndex]} ${DateUtils.format(DateUtils.addDays(week.startDate, dayIndex))}`
        };
        
        week.totalKm = Math.round(week.sessions.reduce((sum, s) => sum + (s.distance || 0), 0));
        week.tss = Math.round(week.sessions.reduce((sum, s) => 
            sum + VDOT.calculateTSS(s, paces), 0
        ));
        
        document.querySelector('.session-modal-overlay').remove();
        SessionManager.refreshPlan();
        
        console.log(`✅ Séance modifiée : Semaine ${weekIndex + 1}, ${CONFIG.fullDayNames[dayIndex]}`);
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
            distanceUnit: 'km',
            pace: 'E',
            repeat: 1,
            isRepeat: false,
            recovery: {
                type: 'time',
                value: 90,
                unit: 'sec',
                intensity: 'none'
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
        
        const paces = SessionManager.currentPaces;
        if (!paces) {
            console.error('⚠️ currentPaces non défini');
            return;
        }
        
        container.innerHTML = SessionManager.currentSteps.map(step => `
            <div class="session-step" data-step-id="${step.id}" draggable="true">
                <div class="step-header">
                    <div class="step-drag-handle" style="cursor: grab;">⋮⋮</div>
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
                            <option value="E" ${step.pace === 'E' ? 'selected' : ''}>Endurance (${paces.E_low ? Formatters.secondsToPace(paces.E_low) : 'N/A'})</option>
                            <option value="M" ${step.pace === 'M' ? 'selected' : ''}>Marathon (${paces.M ? Formatters.secondsToPace(paces.M) : 'N/A'})</option>
                            <option value="T" ${step.pace === 'T' ? 'selected' : ''}>Seuil (${paces.T ? Formatters.secondsToPace(paces.T) : 'N/A'})</option>
                            <option value="I" ${step.pace === 'I' ? 'selected' : ''}>Intervalle (${paces.I ? Formatters.secondsToPace(paces.I) : 'N/A'})</option>
                            <option value="R" ${step.pace === 'R' ? 'selected' : ''}>Répétition (${paces.R ? Formatters.secondsToPace(paces.R) : 'N/A'})</option>
                            ${paces.C ? `<option value="C" ${step.pace === 'C' ? 'selected' : ''}>Course (${Formatters.secondsToPace(paces.C)})</option>` : ''}
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
                                    <option value="E" ${step.recovery.intensity === 'E' ? 'selected' : ''}>Endurance (${paces.E_low ? Formatters.secondsToPace(paces.E_low) : 'N/A'})</option>
                                    <option value="M" ${step.recovery.intensity === 'M' ? 'selected' : ''}>Marathon (${paces.M ? Formatters.secondsToPace(paces.M) : 'N/A'})</option>
                                    <option value="T" ${step.recovery.intensity === 'T' ? 'selected' : ''}>Seuil (${paces.T ? Formatters.secondsToPace(paces.T) : 'N/A'})</option>
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
        
        // Activer le drag & drop sur les étapes
        SessionManager.setupStepsDragDrop();
    },
    
    /**
     * Configurer le drag & drop des étapes
     */
    setupStepsDragDrop() {
        const steps = document.querySelectorAll('.session-step');
        let draggedElement = null;
        let draggedIndex = null;
        
        steps.forEach((step, index) => {
            // Événements de drag
            step.addEventListener('dragstart', (e) => {
                draggedElement = step;
                draggedIndex = index;
                step.style.opacity = '0.5';
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/html', step.innerHTML);
            });
            
            step.addEventListener('dragend', (e) => {
                step.style.opacity = '1';
                // Supprimer les classes de survol
                steps.forEach(s => s.classList.remove('drag-over'));
            });
            
            // Événements de drop
            step.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                
                if (draggedElement !== step) {
                    step.classList.add('drag-over');
                }
            });
            
            step.addEventListener('dragleave', (e) => {
                step.classList.remove('drag-over');
            });
            
            step.addEventListener('drop', (e) => {
                e.preventDefault();
                step.classList.remove('drag-over');
                
                if (draggedElement !== step) {
                    const dropIndex = index;
                    
                    // Réorganiser le tableau currentSteps
                    const [movedStep] = SessionManager.currentSteps.splice(draggedIndex, 1);
                    SessionManager.currentSteps.splice(dropIndex, 0, movedStep);
                    
                    // Re-render
                    SessionManager.renderSteps();
                    SessionManager.updateSummary();
                    
                    console.log(`✅ Étape déplacée de ${draggedIndex} vers ${dropIndex}`);
                }
            });
        });
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
            
            let stepDistanceKm = 0;
            if (step.durationType === 'distance') {
                stepDistanceKm = step.distanceUnit === 'm' ? step.distance / 1000 : step.distance;
            }
            
            if (step.durationType === 'time') {
                totalMinutes += step.duration * repeat;
                const paceSeconds = SessionManager.getPaceValue(paces, step.pace);
                totalDistance += (step.duration * 60 / paceSeconds) * repeat;
            } else {
                totalDistance += stepDistanceKm * repeat;
                const paceSeconds = SessionManager.getPaceValue(paces, step.pace);
                totalMinutes += (stepDistanceKm * paceSeconds / 60) * repeat;
            }
            
            if (step.isRepeat && step.recovery && repeat > 1) {
                const recupCount = repeat - 1;
                
                if (step.recovery.type === 'time') {
                    const recupMinutes = step.recovery.unit === 'min' ? 
                        step.recovery.value : step.recovery.value / 60;
                    totalMinutes += recupMinutes * recupCount;
                    
                    if (step.recovery.intensity !== 'none') {
                        const recupPace = SessionManager.getPaceValue(paces, step.recovery.intensity);
                        totalDistance += (recupMinutes * 60 / recupPace) * recupCount;
                    }
                } else {
                    const recupDistanceKm = step.recovery.unit === 'm' ? 
                        step.recovery.value / 1000 : step.recovery.value;
                    totalDistance += recupDistanceKm * recupCount;
                    
                    if (step.recovery.intensity !== 'none') {
                        const recupPace = SessionManager.getPaceValue(paces, step.recovery.intensity);
                        totalMinutes += (recupDistanceKm * recupPace / 60) * recupCount;
                    } else {
                        const ePace = SessionManager.getPaceValue(paces, 'E');
                        totalMinutes += (recupDistanceKm * ePace / 60) * recupCount;
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
        
        if (!paces) {
            console.error('⚠️ Paces non disponibles dans STATE');
            alert('Erreur : Les allures ne sont pas disponibles');
            return;
        }
        
        let totalDistance = 0;
        let maxIntensity = 1;
        
        SessionManager.currentSteps.forEach(step => {
            const repeat = step.isRepeat ? step.repeat : 1;
            
            let stepDistanceKm = 0;
            if (step.durationType === 'time') {
                const paceSeconds = SessionManager.getPaceValue(paces, step.pace);
                stepDistanceKm = (step.duration * 60 / paceSeconds) * repeat;
            } else {
                stepDistanceKm = (step.distanceUnit === 'm' ? step.distance / 1000 : step.distance) * repeat;
            }
            
            totalDistance += stepDistanceKm;
            
            if (step.isRepeat && step.recovery && repeat > 1) {
                const recupCount = repeat - 1;
                if (step.recovery.type === 'distance') {
                    const recupDistanceKm = step.recovery.unit === 'm' ? 
                        step.recovery.value / 1000 : step.recovery.value;
                    totalDistance += recupDistanceKm * recupCount;
                } else if (step.recovery.intensity !== 'none') {
                    const recupMinutes = step.recovery.unit === 'min' ? 
                        step.recovery.value : step.recovery.value / 60;
                    const recupPace = SessionManager.getPaceValue(paces, step.recovery.intensity);
                    totalDistance += (recupMinutes * 60 / recupPace) * recupCount;
                }
            }
            
            const intensityMap = { E: 1, M: 2, T: 3, I: 4, R: 4, C: 3 };
            maxIntensity = Math.max(maxIntensity, intensityMap[step.pace] || 1);
        });
        
        const sessionName = SessionManager.currentSteps[0]?.type || 'Séance personnalisée';
        
        const structure = {};
        SessionManager.currentSteps.forEach((step, index) => {
            const repeat = step.isRepeat ? step.repeat : 1;
            const paceValue = SessionManager.getPaceValue(paces, step.pace);
            const paceStr = Formatters.secondsToPace(paceValue);
            
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
                    const recupPaceValue = SessionManager.getPaceValue(paces, step.recovery.intensity);
                    const recupPaceStr = Formatters.secondsToPace(recupPaceValue);
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
    console.log('📦 DOM chargé - Initialisation de SessionManager V9');
    SessionManager.init();
});

// Export global
if (typeof window !== 'undefined') {
    window.SessionManager = SessionManager;
    console.log('🌍 SessionManager V9 disponible globalement');
}
