/**
 * ================================================
 * js/ui/interactions.js - Interactions utilisateur
 * ================================================
 * Drag & drop, édition, modals
 */

const Interactions = {
    /**
     * Ajouter les listeners de drag & drop à un élément
     */
    addDragDropListeners(element) {
        element.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('session-card')) {
                STATE.draggedItem = e.target;
                setTimeout(() => e.target.classList.add('dragging'), 0);
            } else {
                e.preventDefault();
            }
        });
        
        element.addEventListener('dragend', () => {
            if (STATE.draggedItem) {
                STATE.draggedItem.classList.remove('dragging');
                STATE.draggedItem = null;
            }
        });
        
        element.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (e.target.classList.contains('empty-day-slot')) {
                e.target.classList.add('drag-over');
            }
        });
        
        element.addEventListener('dragleave', (e) => {
            if (e.target.classList.contains('empty-day-slot')) {
                e.target.classList.remove('drag-over');
            }
        });
        
        element.addEventListener('drop', (e) => {
            e.preventDefault();
            if (!STATE.draggedItem) return;
            
            const target = e.target.closest('.session-card, .empty-day-slot');
            if (!target) return;
            
            target.classList.remove('drag-over');
            this.handleDrop(target);
        });
    },
    
    /**
     * Gérer le drop d'une séance
     */
    handleDrop(target) {
        const activePhase = document.querySelector('#phase-tabs .active')?.dataset.phase;
        
        // Sauvegarder l'état des accordéons
        const openStates = new Map();
        document.querySelectorAll('#plan-content details').forEach(detail => {
            const weekIndex = detail.querySelector('.week-content')?.dataset.weekIndex;
            if (weekIndex) openStates.set(weekIndex, detail.open);
        });
        
        const weekIndex = parseInt(target.parentElement.dataset.weekIndex);
        openStates.set(weekIndex.toString(), true);
        
        const sessions = STATE.currentPlanData.plan[weekIndex].sessions;
        const fromSessionIndex = parseInt(STATE.draggedItem.dataset.sessionIndex);
        const toDayIndex = parseInt(target.dataset.dayIndex);
        const fromSession = sessions[fromSessionIndex];
        
        // Échange ou déplacement
        if (target.classList.contains('session-card')) {
            const toSessionIndex = parseInt(target.dataset.sessionIndex);
            const toSession = sessions[toSessionIndex];
            const fromDayIndex = fromSession.day;
            fromSession.day = toDayIndex;
            toSession.day = fromDayIndex;
        } else {
            fromSession.day = toDayIndex;
        }
        
        // Mettre à jour les dates
        sessions.forEach(s => {
            const weekStart = STATE.currentPlanData.plan[weekIndex].startDate;
            s.fullDate = `${CONFIG.fullDayNames[s.day]} ${DateUtils.format(DateUtils.addDays(weekStart, s.day))}`;
        });
        
        // Retrier par jour
        sessions.sort((a, b) => a.day - b.day);
        
        // Réafficher
        Render.renderPlan(STATE.currentPlanData, openStates, activePhase);
        this.setupDragDrop();
    },
    
    /**
     * Initialiser le drag & drop sur toutes les cartes
     */
    setupDragDrop() {
        document.querySelectorAll('.session-card, .empty-day-slot').forEach(element => {
            this.addDragDropListeners(element);
        });
        
        // Ajouter listener pour l'édition
        document.querySelectorAll('.session-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // Vérifier qu'on ne double-clique pas sur le bouton de suppression
                if (e.target.classList.contains('delete-session-btn')) {
                    return;
                }
                // Utiliser le nouveau modal structuré
                SessionManager.showEditSessionModal(card);
            });
        });
    },
    
    /**
     * Ouvrir l'éditeur de séance
     */
    openEditor(weekIndex, sessionIndex) {
        STATE.currentlyEditing = { weekIndex, sessionIndex };
        
        const session = STATE.currentPlanData.plan[weekIndex].sessions[sessionIndex];
        const editModal = document.querySelector('#edit-modal');
        const editType = document.querySelector('#edit-type');
        const editDetails = document.querySelector('#edit-details');
        
        editType.value = session.type;
        
        let detailsText = '';
        if (session.structure) {
            if (session.structure.echauffement) detailsText += `Échauffement: ${session.structure.echauffement}\n`;
            if (session.structure.bloc) detailsText += `Bloc: ${session.structure.bloc}\n`;
            if (session.structure.recuperation) detailsText += `Récupération: ${session.structure.recuperation}\n`;
            if (session.structure.retourAuCalme) detailsText += `Retour au calme: ${session.structure.retourAuCalme}`;
        } else {
            detailsText = session.details || '';
        }
        
        editDetails.value = detailsText.trim();
        editModal.classList.remove('hidden');
    },
    
    /**
     * Fermer l'éditeur
     */
    closeEditor() {
        document.querySelector('#edit-modal').classList.add('hidden');
        STATE.currentlyEditing = null;
    },
    
    /**
     * Sauvegarder l'édition de séance
     */
    saveSession() {
        if (!STATE.currentlyEditing) return;
        
        const { weekIndex, sessionIndex } = STATE.currentlyEditing;
        const session = STATE.currentPlanData.plan[weekIndex].sessions[sessionIndex];
        
        session.type = document.querySelector('#edit-type').value;
        session.details = document.querySelector('#edit-details').value;
        delete session.structure;
        
        // Sauvegarder l'état des accordéons
        const openStates = new Map();
        document.querySelectorAll('#plan-content details').forEach(detail => {
            const wIndex = detail.querySelector('.week-content')?.dataset.weekIndex;
            if (wIndex) openStates.set(wIndex, detail.open);
        });
        
        this.closeEditor();
        Render.renderPlan(STATE.currentPlanData, openStates);
        this.setupDragDrop();
    },
    
    /**
     * Ouvrir le modal Demi-Cooper
     */
    openCooperModal() {
        document.querySelector('#cooper-modal').classList.remove('hidden');
    },
    
    /**
     * Fermer le modal Demi-Cooper
     */
    closeCooperModal() {
        document.querySelector('#cooper-modal').classList.add('hidden');
    },
    
    /**
     * Configurer les listeners des modals
     */
    setupModalListeners() {
        // Éditeur de séance
        document.querySelector('#save-edit').addEventListener('click', () => {
            this.saveSession();
        });
        
        document.querySelector('#cancel-edit').addEventListener('click', () => {
            this.closeEditor();
        });
        
        document.querySelector('#edit-modal').addEventListener('click', (e) => {
            if (e.target.id === 'edit-modal') {
                this.closeEditor();
            }
        });
        
        // Modal Demi-Cooper
        document.querySelector('#demi-cooper-link').addEventListener('click', (e) => {
            e.preventDefault();
            this.openCooperModal();
        });
        
        document.querySelector('#close-cooper-modal').addEventListener('click', () => {
            this.closeCooperModal();
        });
        
        document.querySelector('#cooper-modal').addEventListener('click', (e) => {
            if (e.target.id === 'cooper-modal') {
                this.closeCooperModal();
            }
        });
    },
    
    /**
     * Configurer les boutons d'action
     */
    setupActionButtons() {
        // Sauvegarder
        document.querySelector('#save-plan').addEventListener('click', () => {
            if (!STATE.currentPlanData) {
                alert('Générez un plan avant de sauvegarder.');
                return;
            }
            Storage.exportPlan(STATE.currentPlanData, Forms.getFormData());
        });
        
        // Importer
        document.querySelector('#import-plan').addEventListener('click', () => {
            document.querySelector('#import-file').click();
        });
        
        document.querySelector('#import-file').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            Storage.importPlan(file, (error, data) => {
                if (error) {
                    alert('Erreur lors de la lecture du fichier: ' + error.message);
                    return;
                }
                
                Forms.setFormData(data.userInput);
                STATE.currentPlanData = data.planData;
                Render.renderPlan(STATE.currentPlanData);
                Render.renderLoadChart(STATE.currentPlanData);
            });
            
            e.target.value = '';
        });
        
        // Imprimer
        document.querySelector('#print-plan').addEventListener('click', () => {
            window.print();
        });
        
        // Réinitialiser
        document.querySelector('#reset-plan').addEventListener('click', () => {
            if (confirm('Voulez-vous vraiment réinitialiser le plan ?')) {
                STATE.currentPlanData = null;
                Render.reset();
            }
        });
    }
};
