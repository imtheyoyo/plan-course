/**
 * ================================================
 * js/ui/forms.js - Gestion des formulaires
 * ================================================
 * Initialisation, validation et événements
 */

const Forms = {
    /**
     * Initialiser les références DOM
     */
    initDOM() {
        DOM.trainingDays = document.querySelector('#training-days');
        DOM.longRunDay = document.querySelector('#long-run-day');
        DOM.startDate = document.querySelector('#start-date');
        DOM.raceDate = document.querySelector('#race-date');
        DOM.raceDistance = document.querySelector('#race-distance');
        DOM.runnerLevel = document.querySelector('#runner-level');
        DOM.perfValue = document.querySelector('#perf-value');
        DOM.perfValueLabel = document.querySelector('#perf-value-label');
        DOM.perfDist = document.querySelector('#perf-distance');
        DOM.currentKm = document.querySelector('#current-km');
        DOM.vdotDisplay = document.querySelector('#vdot-display');
    },
    
    /**
     * Initialiser les boutons des jours d'entraînement
     */
    initializeDayButtons() {
        CONFIG.dayNames.forEach((day, index) => {
            const btn = document.createElement('button');
            btn.textContent = day;
            btn.dataset.dayIndex = index;
            btn.className = 'day-btn p-2 rounded-md text-sm';
            
            // Jours par défaut : Mar, Jeu, Sam, Dim
            if ([1, 3, 5, 6].includes(index)) {
                btn.classList.add('selected');
            }
            
            btn.addEventListener('click', () => {
                btn.classList.toggle('selected');
                this.updateLongRunDayOptions();
            });
            
            DOM.trainingDays.appendChild(btn);
        });
    },
    
    /**
     * Initialiser les dates par défaut
     */
    initializeDates() {
        const nextMonday = DateUtils.getNextMonday();
        DOM.startDate.value = DateUtils.toISO(nextMonday);
        
        const defaultRaceDate = DateUtils.addDays(nextMonday, (16 * 7) - 1); // Dimanche de la semaine 16
        DOM.raceDate.value = DateUtils.toISO(defaultRaceDate);
        
        // Valeurs par défaut
        DOM.perfValue.value = "01:41:45";
        DOM.raceDistance.value = "21.0975";
        DOM.perfDist.value = "21.0975";
        DOM.currentKm.value = "30";
    },
    
    /**
     * Mettre à jour les options du jour de sortie longue
     */
    updateLongRunDayOptions() {
        const selectedDays = this.getSelectedTrainingDays();
        const currentVal = DOM.longRunDay.value;
        
        DOM.longRunDay.innerHTML = '';
        
        selectedDays.forEach(dayIndex => {
            const option = document.createElement('option');
            option.value = dayIndex;
            option.textContent = CONFIG.fullDayNames[dayIndex];
            DOM.longRunDay.appendChild(option);
        });
        
        // Restaurer la valeur précédente si possible
        if (selectedDays.includes(parseInt(currentVal))) {
            DOM.longRunDay.value = currentVal;
        } else if (selectedDays.length > 0) {
            DOM.longRunDay.value = selectedDays[selectedDays.length - 1];
        }
    },
    
    /**
     * Afficher le VDOT et la VMA calculés
     */
    updateVDOTDisplay() {
        let vdot, vma;
        
        if (DOM.perfDist.value === 'demi-cooper') {
            const distMeters = parseFloat(DOM.perfValue.value);
            if (!isNaN(distMeters) && distMeters > 0) {
                vma = (distMeters / 1000) * 10;
                vdot = VDOT.calculateFromVMA(vma);
            }
        } else {
            const timeSeconds = Formatters.timeToSeconds(DOM.perfValue.value);
            vdot = VDOT.calculate(parseFloat(DOM.perfDist.value), timeSeconds);
            if (vdot) {
                vma = VDOT.calculateVMA(vdot);
            }
        }
        
        if (vdot && vma) {
            DOM.vdotDisplay.innerHTML = `
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <p class="text-sm text-gray-400">VDOT</p>
                        <p class="text-3xl font-bold text-green-400">${vdot.toFixed(1)}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-400">VMA</p>
                        <p class="text-3xl font-bold text-blue-400">${vma.toFixed(1)} km/h</p>
                    </div>
                </div>`;
        } else {
            DOM.vdotDisplay.innerHTML = '';
        }
    },
    
    /**
     * Basculer entre temps et distance (Demi-Cooper)
     */
    togglePerfInput() {
        if (DOM.perfDist.value === 'demi-cooper') {
            DOM.perfValueLabel.textContent = 'Distance (mètres)';
            DOM.perfValue.placeholder = '1600';
            DOM.perfValue.value = '';
        } else {
            DOM.perfValueLabel.textContent = 'Temps (hh:mm:ss)';
            DOM.perfValue.placeholder = '01:41:45';
            DOM.perfValue.value = '01:41:45';
        }
        this.updateVDOTDisplay();
    },
    
    /**
     * Obtenir les jours d'entraînement sélectionnés
     */
    getSelectedTrainingDays() {
        return Array.from(DOM.trainingDays.querySelectorAll('.selected'))
            .map(btn => parseInt(btn.dataset.dayIndex));
    },
    
    /**
     * Récupérer toutes les données du formulaire
     */
    getFormData() {
        return {
            startDate: DOM.startDate.value,
            raceDate: DOM.raceDate.value,
            raceDistance: DOM.raceDistance.value,
            runnerLevel: DOM.runnerLevel.value,
            perfDistance: DOM.perfDist.value,
            perfTime: DOM.perfValue.value,
            currentKm: DOM.currentKm.value,
            trainingDays: this.getSelectedTrainingDays(),
            longRunDay: DOM.longRunDay.value
        };
    },
    
    /**
     * Remplir le formulaire avec des données
     */
    setFormData(data) {
        DOM.startDate.value = data.startDate;
        DOM.raceDate.value = data.raceDate;
        DOM.raceDistance.value = data.raceDistance;
        DOM.runnerLevel.value = data.runnerLevel || 'intermediate';
        DOM.perfDist.value = data.perfDistance;
        DOM.currentKm.value = data.currentKm;
        
        this.togglePerfInput();
        DOM.perfValue.value = data.perfTime;
        
        DOM.trainingDays.querySelectorAll('.day-btn').forEach(btn => {
            const dayIndex = parseInt(btn.dataset.dayIndex);
            if (data.trainingDays.includes(dayIndex)) {
                btn.classList.add('selected');
            } else {
                btn.classList.remove('selected');
            }
        });
        
        this.updateLongRunDayOptions();
        DOM.longRunDay.value = data.longRunDay;
        this.updateVDOTDisplay();
    },
    
    /**
     * Valider les données du formulaire
     */
    validate() {
        const data = this.getFormData();
        
        // Vérifier les dates
        if (!data.startDate || !data.raceDate) {
            return { valid: false, error: 'Veuillez sélectionner les dates' };
        }
        
        const startDate = new Date(data.startDate);
        const raceDate = new Date(data.raceDate);
        const weeks = DateUtils.weeksBetween(startDate, raceDate);
        
        if (weeks < CONFIG.planDuration.min || weeks > CONFIG.planDuration.max) {
            return { 
                valid: false, 
                error: `La durée du plan doit être entre ${CONFIG.planDuration.min} et ${CONFIG.planDuration.max} semaines` 
            };
        }
        
        // Vérifier la performance
        let vdot;
        if (data.perfDistance === 'demi-cooper') {
            const distMeters = parseFloat(data.perfTime);
            if (isNaN(distMeters) || distMeters <= 0) {
                return { valid: false, error: 'Veuillez entrer une distance valide pour le test Demi-Cooper' };
            }
            const vma = (distMeters / 1000) * 10;
            vdot = VDOT.calculateFromVMA(vma);
        } else {
            const timeSeconds = Formatters.timeToSeconds(data.perfTime);
            vdot = VDOT.calculate(parseFloat(data.perfDistance), timeSeconds);
        }
        
        if (!vdot) {
            return { valid: false, error: 'Veuillez entrer une performance valide' };
        }
        
        // Vérifier les jours d'entraînement
        if (data.trainingDays.length < 3) {
            return { valid: false, error: 'Sélectionnez au moins 3 jours d\'entraînement' };
        }
        
        return { valid: true, vdot };
    },
    
    /**
     * Configurer tous les événements
     */
    setupEventListeners() {
        // Changement de date de début → ajuster date de course
        DOM.startDate.addEventListener('change', () => {
            const startDate = new Date(DOM.startDate.value);
            if (DOM.startDate.value && !isNaN(startDate.getTime())) {
                const raceDate = DateUtils.addDays(startDate, 16 * 7);
                DOM.raceDate.value = DateUtils.toISO(raceDate);
            }
        });
        
        // Changement de type de performance
        DOM.perfDist.addEventListener('change', () => {
            this.togglePerfInput();
        });
        
        // Mise à jour VDOT à la saisie
        DOM.perfValue.addEventListener('input', () => {
            this.updateVDOTDisplay();
        });
    },
    
    /**
     * Initialisation complète
     */
    init() {
        this.initDOM();
        this.initializeDayButtons();
        this.initializeDates();
        this.updateLongRunDayOptions();
        this.setupEventListeners();
        this.updateVDOTDisplay();
    }
};
