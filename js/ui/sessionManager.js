/**
 * ================================================
 * SessionManager.js
 * Version: 9.4.0
 * Date: 2025-01-11
 * Heure: 17:30 UTC
 * ================================================
 * IMPORTANT: Support du format liste pyramide
 * - Format répétitions: "10x 400m + 5x 1000m"
 * - Format liste: "400m + 600m + 800m à 4:20/km"
 * - Durée au format hh:mm:ss avec validation
 * - Liste de titres prédéfinis ← NOUVEAU V9.4
 * - Allure "Pas de cible" ← NOUVEAU V9.4
 * ================================================
 */

const SessionManager = {
    // Variables globales pour le modal structuré
    currentSteps: [],
    currentPaces: null,
    
    // Liste des titres d'étapes autorisés
    stepTitles: [
        'Échauffement',
        'Course à pied',
        'Retour au calme'
    ],
    
    /**
     * Convertir minutes en hh:mm:ss
     */
    minutesToHHMMSS(minutes) {
        const totalSeconds = Math.round(minutes * 60);
        const hours = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        
        if (hours > 0) {
            return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        }
    },
    
    /**
     * Valider et formater une saisie de durée hh:mm:ss
     */
    validateTimeInput(input) {
        // Filtrer uniquement chiffres et :
        let cleaned = input.replace(/[^\d:]/g, '');
        
        // Limiter le nombre de :
        const colonCount = (cleaned.match(/:/g) || []).length;
        if (colonCount > 2) {
            cleaned = cleaned.replace(/:([^:]*)$/, '$1');
        }
        
        return cleaned;
    },
    
    /**
     * Vérifier si une durée est valide (non zéro)
     */
    isValidDuration(timeStr) {
        const minutes = SessionManager.hhmmssToMinutes(timeStr);
        return minutes > 0;
    },
    
    /**
     * Initialiser les événements
     */
    init() {
        console.log('🔧 Initialisation de SessionManager V9.2');
        this.setupDeleteButtons();
        this.setupAddButton();
    },
    
    /**
     * Obtenir l'allure correcte depuis l'objet paces
     * IMPORTANT : Résout le bug N/A en mappant E -> E_low
     */
    getPaceValue(paces, paceKey) {
        // Si "Pas de cible", retourner une valeur par défaut
        if (paceKey === 'none') {
            return paces.E_low || 360;
        }
        
        const paceMap = {
            'E': 'E_low',
            'M': 'M',
            'T': 'T',
            'I': 'I',
            'R': 'R',
            'C': 'C'
        };
        
        const actualKey = paceMap[paceKey] || paceKey;
        const paceValue = paces[actualKey];
        
        if (!paceValue) {
            console.warn(`⚠️ Allure non trouvée pour: ${paceKey} (cherché: ${actualKey})`);
            return paces.E_low || 360;
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
                    <div class="session-steps-container" id="session-steps"></div>
                    
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
     * V9.4: Support format liste "400m + 600m + 800m à 4:20/km"
     */
    loadSessionSteps(session) {
        console.log('📥 Chargement de la séance:', session);
        console.log('📋 Structure complète:', JSON.stringify(session.structure, null, 2));
        const steps = [];
        
        // Échauffement
        if (session.structure?.echauffement) {
            console.log('🔥 Parsing échauffement:', session.structure.echauffement);
            const step = SessionManager.parseStepFromDescription('Échauffement', session.structure.echauffement);
            // S'assurer que le titre reste Échauffement
            step.type = 'Échauffement';
            steps.push(step);
            console.log('  ✅ Étape échauffement ajoutée:', step);
        }
        
        // Bloc principal
        if (session.structure?.bloc) {
            console.log('💪 Parsing bloc principal:', session.structure.bloc);
            
            // Détecter le format: répétitions (10x 400m) ou liste (400m + 600m + 800m)
            const hasRepetitionFormat = /\d+x\s*\d+/i.test(session.structure.bloc);
            console.log('🔍 Format détecté:', hasRepetitionFormat ? 'répétitions' : 'liste');
            
            if (hasRepetitionFormat) {
                // Format standard: "10x 400m + 5x 1000m"
                const blocSteps = session.structure.bloc.split(/\s*\+\s*/);
                console.log(`📋 ${blocSteps.length} étape(s) (format répétition)`);
                
                blocSteps.forEach((blocDesc, index) => {
                    // Toujours utiliser "Course à pied" pour les blocs
                    const stepName = 'Course à pied';
                    
                    const isRepeat = /\d+x/i.test(blocDesc);
                    const step = SessionManager.parseStepFromDescription(stepName, blocDesc, isRepeat);
                    
                    // Forcer le titre
                    step.type = 'Course à pied';
                    
                    if (isRepeat && session.structure?.recuperation) {
                        step.recovery = SessionManager.parseRecoveryFromDescription(session.structure.recuperation);
                    }
                    
                    steps.push(step);
                    console.log(`  ✅ Étape "${step.type}" ajoutée:`, step);
                });
            } else {
                // Format liste: "400m + 600m + 800m + 1000m à 4:20/km"
                console.log('📋 Format liste détecté');
                
                // Extraire l'allure globale
                const globalPaceMatch = session.structure.bloc.match(/à\s+(\d+:\d+\/km)\s*$/);
                const globalPace = globalPaceMatch ? globalPaceMatch[1] : null;
                console.log(`  └─ Allure globale: ${globalPace || 'non trouvée'}`);
                
                // Extraire les distances
                let distancesPart = session.structure.bloc;
                if (globalPace) {
                    distancesPart = session.structure.bloc.replace(/\s*à\s+\d+:\d+\/km\s*$/, '');
                }
                
                const distances = distancesPart.split(/\s*\+\s*/).map(d => d.trim());
                console.log(`  └─ ${distances.length} distance(s):`, distances);
                
                // Créer une étape par distance
                distances.forEach((dist, index) => {
                    // Toujours "Course à pied" pour les blocs
                    const stepName = 'Course à pied';
                    const fullDesc = globalPace ? `${dist} à ${globalPace}` : dist;
                    
                    const step = SessionManager.parseStepFromDescription(stepName, fullDesc, false);
                    
                    // Forcer le titre
                    step.type = 'Course à pied';
                    
                    // Ajouter récupération sauf pour la dernière
                    if (session.structure?.recuperation && index < distances.length - 1) {
                        step.recovery = SessionManager.parseRecoveryFromDescription(session.structure.recuperation);
                    }
                    
                    steps.push(step);
                    console.log(`  ✅ Étape "${step.type}" ajoutée:`, step);
                });
                
                console.log(`  ✅ ${distances.length} étapes ajoutées`);
            }
        }
        
        // Retour au calme
        if (session.structure?.retourAuCalme) {
            console.log('🧘 Parsing retour au calme:', session.structure.retourAuCalme);
            const step = SessionManager.parseStepFromDescription('Retour au calme', session.structure.retourAuCalme);
            // S'assurer que le titre reste Retour au calme
            step.type = 'Retour au calme';
            steps.push(step);
            console.log('  ✅ Étape retour au calme ajoutée:', step);
        }
        
        // Étape par défaut si aucune trouvée
        if (steps.length === 0) {
            console.warn('⚠️ Aucune étape parsée, création étape par défaut');
            steps.push({
                id: `step-${Date.now()}`,
                type: 'Course à pied',
                durationType: 'distance',
                duration: 10,
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
        
        console.log(`✅ ${steps.length} étape(s) chargée(s) au total`);
        console.log('📊 Résumé des étapes:');
        steps.forEach((s, i) => {
            console.log(`  ${i + 1}. ${s.type} - ${s.durationType === 'time' ? s.duration + ' min' : s.distance + s.distanceUnit}`);
        });
        
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
            duration: 10,
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
        
        // Parser répétitions
        const repeatMatch = description.match(/(\d+)x\s*/i);
        if (repeatMatch) {
            step.repeat = parseInt(repeatMatch[1]);
            step.isRepeat = true;
            console.log(`🔁 Répétition: ${step.repeat}x`);
        }
        
        // Parser temps au format hh:mm:ss ou mm:ss ou XX min
        // IMPORTANT: Vérifier d'abord si c'est une allure (X:XX/km) pour ne pas la confondre avec un temps
        const isPaceFormat = /\d+:\d+\/km/.test(description);
        
        const timeHHMMSSMatch = description.match(/(\d+):(\d+):(\d+)(?!\/)/) && !isPaceFormat;
        const timeMMSSMatch = description.match(/(\d+):(\d+)(?!\/)(?!\d)/) && !isPaceFormat;
        const timeMinMatch = description.match(/(\d+)\s*min(?!\s*à)/i);
        
        if (timeHHMMSSMatch) {
            // Format hh:mm:ss
            const hours = parseInt(timeHHMMSSMatch[1]);
            const mins = parseInt(timeHHMMSSMatch[2]);
            const secs = parseInt(timeHHMMSSMatch[3]);
            step.durationType = 'time';
            step.duration = hours * 60 + mins + secs / 60;
            console.log(`⏱️ Temps détecté (hh:mm:ss): ${hours}:${mins}:${secs} → ${step.duration.toFixed(2)} min`);
        } else if (timeMMSSMatch) {
            // Format mm:ss (ex: 10:00, 45:30)
            const mins = parseInt(timeMMSSMatch[1]);
            const secs = parseInt(timeMMSSMatch[2]);
            step.durationType = 'time';
            step.duration = mins + secs / 60;
            console.log(`⏱️ Temps détecté (mm:ss): ${mins}:${secs} → ${step.duration.toFixed(2)} min`);
        } else if (timeMinMatch) {
            step.durationType = 'time';
            step.duration = parseInt(timeMinMatch[1]);
            console.log(`⏱️ Temps détecté (min): ${step.duration} min`);
        }
        
        // Parser distance mètres
        const distanceMetersMatch = description.match(/(?<!\d)(\d+(?:\.\d+)?)\s*m(?!\s*min)(?=\s|$|à)/i);
        if (distanceMetersMatch && !timeMinMatch && !timeMMSSMatch && !timeHHMMSSMatch) {
            step.durationType = 'distance';
            step.distance = parseFloat(distanceMetersMatch[1]);
            step.distanceUnit = 'm';
            console.log(`📏 Distance: ${step.distance}m`);
        }
        
        // Parser distance km
        const distanceKmMatch = description.match(/(\d+(?:\.\d+)?)\s*km(?=\s|$|à)/i);
        if (distanceKmMatch && !timeMinMatch && !distanceMetersMatch && !timeMMSSMatch && !timeHHMMSSMatch) {
            step.durationType = 'distance';
            step.distance = parseFloat(distanceKmMatch[1]);
            step.distanceUnit = 'km';
            console.log(`📏 Distance: ${step.distance}km`);
        }
        
        // Parser allure
        const paces = SessionManager.currentPaces;
        if (paces) {
            if (paces.R && description.includes(Formatters.secondsToPace(paces.R))) step.pace = 'R';
            else if (paces.I && description.includes(Formatters.secondsToPace(paces.I))) step.pace = 'I';
            else if (paces.T && description.includes(Formatters.secondsToPace(paces.T))) step.pace = 'T';
            else if (paces.M && description.includes(Formatters.secondsToPace(paces.M))) step.pace = 'M';
            else if (paces.C && description.includes(Formatters.secondsToPace(paces.C))) step.pace = 'C';
            else if (paces.E_high && description.includes(Formatters.secondsToPace(paces.E_high))) step.pace = 'E';
            else if (paces.E_low && description.includes(Formatters.secondsToPace(paces.E_low))) step.pace = 'E';
        }
        
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
        if (paces) {
            if (description.includes('trot')) {
                recovery.intensity = 'none';
            } else if (paces.E_low && description.includes(Formatters.secondsToPace(paces.E_low))) {
                recovery.intensity = 'E';
            } else if (paces.E_high && description.includes(Formatters.secondsToPace(paces.E_high))) {
                recovery.intensity = 'E';
            } else if (paces.M && description.includes(Formatters.secondsToPace(paces.M))) {
                recovery.intensity = 'M';
            } else if (paces.T && description.includes(Formatters.secondsToPace(paces.T))) {
                recovery.intensity = 'T';
            }
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
            
            const intensityMap = { E: 1, M: 2, T: 3, I: 4, R: 4, C: 3, none: 1 };
            maxIntensity = Math.max(maxIntensity, intensityMap[step.pace] || 1);
        });
        
        const sessionName = SessionManager.currentSteps[0]?.type || 'Séance personnalisée';
        
        // Créer la structure
        const structure = {};
        const blocSteps = [];
        let hasRecovery = false;
        
        SessionManager.currentSteps.forEach((step, index) => {
            const repeat = step.isRepeat ? step.repeat : 1;
            const paceValue = SessionManager.getPaceValue(paces, step.pace);
            const paceStr = Formatters.secondsToPace(paceValue);
            
            let desc;
            if (step.durationType === 'time') {
                const timeStr = SessionManager.minutesToHHMMSS(step.duration);
                if (step.pace === 'none') {
                    desc = repeat > 1 
                        ? `${repeat}x ${timeStr}`
                        : `${timeStr}`;
                } else {
                    desc = repeat > 1 
                        ? `${repeat}x ${timeStr} à ${paceStr}`
                        : `${timeStr} à ${paceStr}`;
                }
            } else {
                const distValue = step.distanceUnit === 'm' ? 
                    `${step.distance}m` : `${step.distance}km`;
                if (step.pace === 'none') {
                    desc = repeat > 1
                        ? `${repeat}x ${distValue}`
                        : `${distValue}`;
                } else {
                    desc = repeat > 1
                        ? `${repeat}x ${distValue} à ${paceStr}`
                        : `${distValue} à ${paceStr}`;
                }
            }
            
            if (step.isRepeat && step.recovery && !hasRecovery) {
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
                hasRecovery = true;
            }
            
            const typeLower = step.type.toLowerCase();
            const isWarmup = typeLower.includes('échauffement') || typeLower.includes('warmup') || typeLower.includes('chauffe');
            const isCooldown = typeLower.includes('retour') || typeLower.includes('cool') || typeLower.includes('calme');
            
            if (index === 0 && isWarmup) {
                structure.echauffement = desc;
            } else if (index === SessionManager.currentSteps.length - 1 && isCooldown) {
                structure.retourAuCalme = desc;
            } else {
                blocSteps.push(desc);
            }
        });
        
        if (blocSteps.length > 0) {
            structure.bloc = blocSteps.join(' + ');
        }
        
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
        
        console.log(`✅ Séance modifiée : Semaine ${weekIndex + 1}`);
    },
    
    /**
     * Créer le modal d'ajout
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
                    <div class="session-steps-container" id="session-steps"></div>
                    
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
     * Ajouter une étape
     */
    addStepToSession(defaultType = 'Course à pied') {
        const step = {
            id: `step-${Date.now()}`,
            type: defaultType,
            durationType: 'time',
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
                    <select class="step-title-select" 
                            onchange="SessionManager.updateStep('${step.id}', 'type', this.value)"
                            style="flex: 1; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.875rem;">
                        ${SessionManager.stepTitles.map(title => 
                            `<option value="${title}" ${step.type === title ? 'selected' : ''}>${title}</option>`
                        ).join('')}
                    </select>
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
                                <input type="text" 
                                       value="${SessionManager.minutesToHHMMSS(step.duration)}" 
                                       placeholder="hh:mm:ss"
                                       class="time-input"
                                       data-step-id="${step.id}"
                                       oninput="this.value = SessionManager.validateTimeInput(this.value)"
                                       onblur="SessionManager.validateAndUpdateDuration('${step.id}', this.value, this)"
                                       onchange="SessionManager.validateAndUpdateDuration('${step.id}', this.value, this)">
                                <span>hh:mm:ss</span>
                            </div>
                            <small class="time-hint" style="color: #6b7280; font-size: 0.75rem; display: block; margin-top: 4px;">
                                Format: mm:ss ou hh:mm:ss (ex: 10:00 ou 1:30:00)
                            </small>
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
                            <option value="none" ${step.pace === 'none' ? 'selected' : ''}>Pas de cible</option>
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
                                        <input type="number" value="${step.recovery.value}" 
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
        
        SessionManager.setupStepsDragDrop();
    },
    
    /**
     * Configurer le drag & drop
     */
    setupStepsDragDrop() {
        const steps = document.querySelectorAll('.session-step');
        let draggedElement = null;
        let draggedIndex = null;
        
        steps.forEach((step, index) => {
            step.addEventListener('dragstart', (e) => {
                draggedElement = step;
                draggedIndex = index;
                step.style.opacity = '0.5';
                e.dataTransfer.effectAllowed = 'move';
            });
            
            step.addEventListener('dragend', () => {
                step.style.opacity = '1';
                steps.forEach(s => s.classList.remove('drag-over'));
            });
            
            step.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (draggedElement !== step) {
                    step.classList.add('drag-over');
                }
            });
            
            step.addEventListener('dragleave', () => {
                step.classList.remove('drag-over');
            });
            
            step.addEventListener('drop', (e) => {
                e.preventDefault();
                step.classList.remove('drag-over');
                
                if (draggedElement !== step) {
                    const [movedStep] = SessionManager.currentSteps.splice(draggedIndex, 1);
                    SessionManager.currentSteps.splice(index, 0, movedStep);
                    SessionManager.renderSteps();
                    SessionManager.updateSummary();
                }
            });
        });
    },
    
    /**
     * Valider et mettre à jour la durée
     */
    validateAndUpdateDuration(stepId, value, inputElement) {
        // Valider que la durée n'est pas zéro
        if (!SessionManager.isValidDuration(value)) {
            // Afficher erreur
            inputElement.style.borderColor = '#ef4444';
            inputElement.style.backgroundColor = '#fee2e2';
            
            // Afficher message d'erreur
            let errorMsg = inputElement.parentElement.parentElement.querySelector('.error-msg');
            if (!errorMsg) {
                errorMsg = document.createElement('small');
                errorMsg.className = 'error-msg';
                errorMsg.style.color = '#ef4444';
                errorMsg.style.fontSize = '0.75rem';
                errorMsg.style.display = 'block';
                errorMsg.style.marginTop = '4px';
                inputElement.parentElement.parentElement.appendChild(errorMsg);
            }
            errorMsg.textContent = '❌ La durée doit être supérieure à zéro';
            
            // Restaurer la valeur précédente après 2 secondes
            setTimeout(() => {
                const step = SessionManager.currentSteps.find(s => s.id === stepId);
                if (step) {
                    inputElement.value = SessionManager.minutesToHHMMSS(step.duration);
                    inputElement.style.borderColor = '';
                    inputElement.style.backgroundColor = '';
                    if (errorMsg) errorMsg.remove();
                }
            }, 2000);
            
            return;
        }
        
        // Supprimer le message d'erreur si présent
        const errorMsg = inputElement.parentElement.parentElement.querySelector('.error-msg');
        if (errorMsg) errorMsg.remove();
        
        // Réinitialiser le style
        inputElement.style.borderColor = '';
        inputElement.style.backgroundColor = '';
        
        // Mettre à jour l'étape
        SessionManager.updateStep(stepId, 'duration', value);
    },
    
    /**
     * Mettre à jour une étape
     */
    updateStep(stepId, field, value) {
        const step = SessionManager.currentSteps.find(s => s.id === stepId);
        if (!step) return;
        
        if (field === 'duration') {
            // Convertir hh:mm:ss en minutes
            step.duration = SessionManager.hhmmssToMinutes(value);
        } else if (field === 'repeat') {
            step.repeat = parseInt(value);
        } else if (field === 'distance') {
            step.distance = parseFloat(value);
        } else {
            step[field] = value;
        }
        
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
     * Mettre à jour la récupération
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
            const mins = Math.floor(totalMinutes % 60);
            const secs = Math.round((totalMinutes % 1) * 60);
            
            if (hours > 0) {
                durationEl.textContent = `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            } else {
                durationEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
            }
        }
        
        if (distanceEl) {
            distanceEl.textContent = `${totalDistance.toFixed(2)} km`;
        }
    },
    
    /**
     * Sauvegarder la séance
     */
    saveStructuredSession(weekIndex, dayIndex) {
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
        const blocSteps = [];
        let hasRecovery = false;
        
        SessionManager.currentSteps.forEach((step, index) => {
            const repeat = step.isRepeat ? step.repeat : 1;
            const paceValue = SessionManager.getPaceValue(paces, step.pace);
            const paceStr = step.pace === 'none' ? '' : Formatters.secondsToPace(paceValue);
            
            let desc;
            if (step.durationType === 'time') {
                const timeStr = SessionManager.minutesToHHMMSS(step.duration);
                if (step.pace === 'none') {
                    desc = repeat > 1 
                        ? `${repeat}x ${timeStr}`
                        : `${timeStr}`;
                } else {
                    desc = repeat > 1 
                        ? `${repeat}x ${timeStr} à ${paceStr}`
                        : `${timeStr} à ${paceStr}`;
                }
            } else {
                const distValue = step.distanceUnit === 'm' ? 
                    `${step.distance}m` : `${step.distance}km`;
                if (step.pace === 'none') {
                    desc = repeat > 1
                        ? `${repeat}x ${distValue}`
                        : `${distValue}`;
                } else {
                    desc = repeat > 1
                        ? `${repeat}x ${distValue} à ${paceStr}`
                        : `${distValue} à ${paceStr}`;
                }
            }
            
            if (step.isRepeat && step.recovery && !hasRecovery) {
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
                hasRecovery = true;
            }
            
            const typeLower = step.type.toLowerCase();
            const isWarmup = typeLower.includes('échauffement') || typeLower.includes('warmup') || typeLower.includes('chauffe');
            const isCooldown = typeLower.includes('retour') || typeLower.includes('cool') || typeLower.includes('calme');
            
            if (index === 0 && isWarmup) {
                structure.echauffement = desc;
            } else if (index === SessionManager.currentSteps.length - 1 && isCooldown) {
                structure.retourAuCalme = desc;
            } else {
                blocSteps.push(desc);
            }
        });
        
        if (blocSteps.length > 0) {
            structure.bloc = blocSteps.join(' + ');
        }
        
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
        
        console.log(`✅ Séance ajoutée : Semaine ${weekIndex + 1}`);
    },
    
    /**
     * Rafraîchir le plan
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
     * Ajouter les boutons
     */
    addSessionButtons() {
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
    }
};

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    console.log('📦 SessionManager V9.2 initialisé');
    SessionManager.init();
});

// Export global
if (typeof window !== 'undefined') {
    window.SessionManager = SessionManager;
    console.log('✅ SessionManager V9.2 disponible');
}
