/**
 * ================================================
 * js/ui/render.js - Affichage du plan
 * ================================================
 * Rendu des semaines, séances et graphiques
 * VERSION 2.2.0 - Avec vérifications sécurisées
 */

const Render = {
    /**
     * Afficher le plan complet
     */
    renderPlan(planData, openStates = new Map(), activePhase = null) {
        // 🆕 VÉRIFICATIONS DE SÉCURITÉ
        const placeholder = document.querySelector('#plan-placeholder');
        const wrapper = document.querySelector('#plan-content-wrapper');
        const content = document.querySelector('#plan-content');
        
        if (!placeholder || !wrapper || !content) {
            console.error('❌ Éléments DOM manquants pour le rendu du plan');
            console.error('Vérifiez que index.html contient :');
            console.error('- #plan-placeholder');
            console.error('- #plan-content-wrapper');
            console.error('- #plan-content');
            return;
        }
        
        placeholder.classList.add('hidden');
        wrapper.classList.remove('hidden');
        content.innerHTML = '';
        
        // En-tête avec allures
        this.renderHeader(content, planData);
        
        // Onglets de phases
        this.renderPhaseTabs(content, planData, activePhase);
        
        // Semaines
        planData.plan.forEach((week, weekIndex) => {
            this.renderWeek(content, week, weekIndex, planData, openStates);
        });
        
        // Afficher les boutons d'action
        this.showPlanControls();
        
        // Filtrer par phase active
        const phaseToDisplay = activePhase || [...new Set(planData.plan.map(w => w.phase))][0];
        this.filterWeeksByPhase(phaseToDisplay);

        // Ajouter et Supprimer des séances
        setTimeout(() => SessionManager.addSessionButtons(), 100);
    },
    
    /**
     * Afficher l'en-tête avec les allures
     */
    renderHeader(container, planData) {
        const paceKeys = ['C', 'M', 'T', 'I', 'R'];
        const paceItems = paceKeys.map(key => `
            <div class="card p-2 rounded-md text-center">
                <p class="font-bold text-green-400">${CONFIG.paceLabels[key]}</p>
                <p class="pace-value font-semibold">${Formatters.secondsToPace(planData.paces[key]).replace('/km', '')}</p>
            </div>
        `).join('');
    
        const enduranceItem = `
            <div class="card p-2 rounded-md text-center">
                <p class="font-bold pace-label">${CONFIG.paceLabels.E}</p>
                <p class="pace-value font-semibold">${Formatters.secondsToPace(planData.paces.E_high).replace('/km', '')} - ${Formatters.secondsToPace(planData.paces.E_low).replace('/km', '')}</p>
            </div>
        `;

        
        const header = document.createElement('div');
        header.className = 'mb-6 pb-4 border-b border-gray-700';
        header.innerHTML = `
            <h2 class="text-3xl font-bold text-white">Plan de ${planData.plan.length} semaines</h2>
            <p class="text-sm text-gray-400 mt-1">Profil: ${DOM.runnerLevel.options[DOM.runnerLevel.selectedIndex].text}</p>
            <div class="mt-4 grid grid-cols-3 md:grid-cols-6 gap-2 text-sm">${paceItems}${enduranceItem}</div>
            <div id="phase-tabs" class="flex space-x-1 mt-4 border-b border-gray-700"></div>
        `;
        
        container.appendChild(header);
    },
    
    /**
     * Afficher les onglets de phases
     */
    renderPhaseTabs(container, planData, activePhase) {
        const phases = [...new Set(planData.plan.map(w => w.phase))];
        const phaseToDisplay = activePhase || phases[0];
        const tabsContainer = container.querySelector('#phase-tabs');
        
        if (!tabsContainer) {
            console.warn('⚠️ #phase-tabs non trouvé');
            return;
        }
        
        phases.forEach(phase => {
            const tab = document.createElement('button');
            tab.textContent = phase;
            tab.className = 'phase-tab px-4 py-2 text-sm';
            if (phase === phaseToDisplay) tab.classList.add('active');
            tab.dataset.phase = phase;
            tab.addEventListener('click', (e) => this.filterWeeksByPhase(e.target.dataset.phase));
            tabsContainer.appendChild(tab);
        });
    },
    
    /**
     * Afficher une semaine
     */
    renderWeek(container, week, weekIndex, planData, openStates) {
        const weekEl = document.createElement('details');
        const wasOpen = openStates.get(weekIndex.toString());
        weekEl.open = wasOpen !== undefined ? wasOpen : (week.weekNumber === 1);
        weekEl.className = `card rounded-lg mb-4 overflow-hidden week-details phase-${week.phase.replace(/\s+/g, '-')}`;
        weekEl.dataset.phase = week.phase;
        
        // 🆕 Détecter si la semaine contient un test
        const hasTest = week.sessions.some(s => 
            s.isTest || s.type?.includes('Test') || s.type?.includes('📊')
        );
        if (hasTest) {
            weekEl.classList.add('has-test');
        }
        
        const endDate = DateUtils.addDays(week.startDate, 6);
        const tss = week.tss || 0;
        const maxPlanTSS = Math.max(...planData.plan.map(w => w.tss || 0));
        const loadPercent = (tss / maxPlanTSS) * 100;
        
        let loadClass, loadLabel;
        if (loadPercent < 50) { loadClass = 'load-low'; loadLabel = 'Faible'; }
        else if (loadPercent < 70) { loadClass = 'load-medium'; loadLabel = 'Modérée'; }
        else if (loadPercent < 85) { loadClass = 'load-high'; loadLabel = 'Élevée'; }
        else { loadClass = 'load-very-high'; loadLabel = 'Très élevée'; }
        
        // Badge test amélioré
        const testBadge = hasTest ? '<span class="test-badge ml-2 px-2 py-1 bg-purple-600 text-xs rounded font-semibold">📊 TEST</span>' : '';
        
        // 🆕 Afficher alertes SmartPlacement si disponibles
        let alertsBadge = '';
        if (week.sessions.metadata && week.sessions.metadata.alerts && week.sessions.metadata.alerts.length > 0) {
            const criticalAlerts = week.sessions.metadata.alerts.filter(a => a.type === 'critical');
            const warningAlerts = week.sessions.metadata.alerts.filter(a => a.type === 'warning');
            
            if (criticalAlerts.length > 0) {
                alertsBadge = '<span class="alert-badge ml-2 px-2 py-1 bg-red-600 text-xs rounded font-semibold">🚨 CRITIQUE</span>';
            } else if (warningAlerts.length > 0) {
                alertsBadge = '<span class="alert-badge ml-2 px-2 py-1 bg-yellow-600 text-xs rounded font-semibold">⚠️ ALERTE</span>';
            }
        }
        
        weekEl.innerHTML = `
            <summary class="p-4 cursor-pointer hover:bg-gray-800">
                <div class="flex justify-between items-center flex-wrap">
                    <div class="mr-4">
                        <h3 class="font-bold text-lg text-white">Semaine ${week.weekNumber} <span class="text-sm font-normal text-gray-400">(${week.phase})</span>${testBadge}${alertsBadge}</h3>
                        <p class="text-xs text-gray-500">${DateUtils.format(week.startDate)} - ${DateUtils.format(endDate)}</p>
                    </div>
                    <div class="flex items-center gap-4 mt-2 sm:mt-0">
                        <div class="text-right">
                            <p class="text-xs text-gray-400">Charge: ${loadLabel}</p>
                            <div class="w-24 h-1 bg-gray-700 rounded mt-1">
                                <div class="load-indicator ${loadClass}" style="width: ${loadPercent}%"></div>
                            </div>
                        </div>
                        <span class="font-semibold text-green-400">~${Math.round(week.totalKm)} km</span>
                    </div>
                </div>
            </summary>
            <div class="p-4 border-t border-gray-700 grid grid-cols-1 md:grid-cols-7 gap-3 week-content" data-week-index="${weekIndex}"></div>
        `;
        
        const weekContent = weekEl.querySelector('.week-content');
        this.renderWeekSessions(weekContent, week, weekIndex);
        
        // 🆕 Afficher les alertes SmartPlacement si disponibles
        if (week.sessions.metadata && (week.sessions.metadata.alerts?.length > 0 || week.sessions.metadata.recommendations?.length > 0)) {
            this.renderWeekAlerts(weekEl, week.sessions.metadata);
        }
        
        container.appendChild(weekEl);
    },
    
    /**
     * 🆕 Afficher les alertes d'une semaine
     */
    renderWeekAlerts(weekEl, metadata) {
        const alertsContainer = document.createElement('div');
        alertsContainer.className = 'p-4 border-t border-gray-700 bg-gray-800';
        
        let html = '<div class="space-y-2">';
        
        // Alertes critiques et warnings
        if (metadata.alerts && metadata.alerts.length > 0) {
            metadata.alerts.forEach(alert => {
                const bgColor = alert.type === 'critical' ? 'bg-red-900' : 'bg-yellow-900';
                const borderColor = alert.type === 'critical' ? 'border-red-600' : 'border-yellow-600';
                
                html += `
                    <div class="p-3 rounded-md border-l-4 ${bgColor} ${borderColor}">
                        <p class="font-bold text-sm">${alert.title}</p>
                        <p class="text-xs text-gray-300 mt-1">${alert.message}</p>
                        <p class="text-xs text-gray-400 mt-1 italic">→ ${alert.action}</p>
                    </div>
                `;
            });
        }
        
        // Recommandations
        if (metadata.recommendations && metadata.recommendations.length > 0) {
            metadata.recommendations.forEach(rec => {
                html += `
                    <div class="p-3 rounded-md border-l-4 bg-blue-900 border-blue-600">
                        <p class="font-bold text-sm">${rec.title}</p>
                        <p class="text-xs text-gray-300 mt-1">${rec.message}</p>
                        <p class="text-xs text-gray-400 mt-1 italic">→ ${rec.action}</p>
                    </div>
                `;
            });
        }
        
        html += '</div>';
        alertsContainer.innerHTML = html;
        weekEl.appendChild(alertsContainer);
    },
    
    /**
     * Afficher les séances d'une semaine
     */
    renderWeekSessions(container, week, weekIndex) {
        const sessionsByDay = new Map(week.sessions.map(s => [s.day, s]));
        
        for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
            if (sessionsByDay.has(dayIndex)) {
                const session = sessionsByDay.get(dayIndex);
                const sessionIndex = week.sessions.indexOf(session);
                const sessionEl = this.createSessionCard(session, sessionIndex, dayIndex, weekIndex);
                container.appendChild(sessionEl);
            } else {
                const emptySlot = this.createEmptySlot(dayIndex);
                container.appendChild(emptySlot);
            }
        }
    },
    
    /**
     * Créer une carte de séance
     */
    createSessionCard(session, sessionIndex, dayIndex, weekIndex) {
        const sessionEl = document.createElement('div');
        sessionEl.className = `border-transparent p-3 rounded-md session-card intensity-${session.intensity}`;
        sessionEl.setAttribute('draggable', true);
        sessionEl.dataset.sessionIndex = sessionIndex;
        sessionEl.dataset.dayIndex = dayIndex;
        sessionEl.dataset.weekIndex = weekIndex;
        
        // Classe spéciale pour les tests
        if (session.isTest || session.type?.includes('Test') || session.type?.includes('📊')) {
            sessionEl.classList.add('test-session');
            sessionEl.setAttribute('data-type', 'test');
        }
        
        // 🆕 Notes de variation si disponibles
        let notesHtml = '';
        if (session.notes && session.notes.length > 0) {
            notesHtml = `<p class="text-xs text-blue-400 mt-1">${session.notes.join(' ')}</p>`;
        }
        
        let detailsHtml = '';
        if (session.structure) {
            detailsHtml = `<ul class="text-sm text-gray-400 mt-1">
                ${session.structure.echauffement ? `<li><strong>Échauf:</strong> ${session.structure.echauffement}</li>` : ''}
                ${session.structure.bloc ? `<li><strong>Bloc:</strong> ${session.structure.bloc}</li>` : ''}
                ${session.structure.recuperation ? `<li><strong>Récup:</strong> ${session.structure.recuperation}</li>` : ''}
                ${session.structure.retourAuCalme ? `<li><strong>RC:</strong> ${session.structure.retourAuCalme}</li>` : ''}
            </ul>`;
        } else {
            detailsHtml = `<p class="text-sm text-gray-400 mt-1">${session.details || ''}</p>`;
        }
        
        const testIcon = session.isTest ? ' 📊' : '';
        sessionEl.innerHTML = `
            <p class="font-bold text-green-400 pointer-events-none">${CONFIG.fullDayNames[dayIndex].substring(0,3)}: ${session.type}${testIcon} (~${(session.distance || 0).toFixed(1)} km)</p>
            ${detailsHtml}
            ${notesHtml}
        `;
        
        return sessionEl;
    },
    
    /**
     * Créer un slot vide
     */
    createEmptySlot(dayIndex) {
        const emptySlot = document.createElement('div');
        emptySlot.className = 'empty-day-slot flex items-center justify-center text-gray-600 text-sm';
        emptySlot.textContent = CONFIG.fullDayNames[dayIndex].substring(0,3);
        emptySlot.dataset.dayIndex = dayIndex;
        return emptySlot;
    },
    
    /**
     * Filtrer les semaines par phase
     */
    filterWeeksByPhase(phase) {
        const tabs = document.querySelectorAll('#phase-tabs .phase-tab');
        if (tabs.length === 0) {
            console.warn('⚠️ Aucun onglet de phase trouvé');
            return;
        }
        
        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.phase === phase);
        });
        
        document.querySelectorAll('.week-details').forEach(weekEl => {
            weekEl.style.display = weekEl.dataset.phase === phase ? '' : 'none';
        });
    },
    
    /**
     * Afficher le graphique de charge
     */
    renderLoadChart(planData) {
        const chartContainer = document.querySelector('#load-chart');
        const chartWrapper = document.querySelector('#load-chart-container');
        
        if (!chartContainer || !chartWrapper) {
            console.warn('⚠️ Éléments de graphique manquants');
            return;
        }
        
        chartContainer.innerHTML = '';
        chartWrapper.classList.remove('hidden');
        
        const maxTSS = Math.max(...planData.plan.map(w => w.tss));
        const chartWidth = chartContainer.offsetWidth;
        const barWidth = Math.max(20, (chartWidth / planData.plan.length) - 4);
        
        planData.plan.forEach((week, index) => {
            // Conteneur pour la barre + label
            const barContainer = document.createElement('div');
            barContainer.className = 'chart-bar-container';
            barContainer.style.position = 'absolute';
            barContainer.style.left = `${index * (barWidth + 4)}px`;
            barContainer.style.width = `${barWidth}px`;
            barContainer.style.height = '100%';
            barContainer.style.display = 'flex';
            barContainer.style.flexDirection = 'column';
            barContainer.style.justifyContent = 'flex-end';
            barContainer.style.alignItems = 'center';
            barContainer.style.cursor = 'pointer';
            
            // Barre
            const bar = document.createElement('div');
            const heightPercent = (week.tss / maxTSS) * 100;
            
            let loadClass;
            if (week.tss < maxTSS * 0.5) loadClass = 'load-low';
            else if (week.tss < maxTSS * 0.7) loadClass = 'load-medium';
            else if (week.tss < maxTSS * 0.85) loadClass = 'load-high';
            else loadClass = 'load-very-high';
            
            // Marqueur visuel pour les semaines de test
            const hasTest = week.sessions.some(s => s.isTest || s.type?.includes('Test'));
            if (hasTest) {
                bar.classList.add('test-week-bar');
            }
            
            bar.className = `chart-bar ${loadClass}`;
            bar.style.width = '100%';
            bar.style.height = `${heightPercent}%`;
            bar.style.marginBottom = '4px';
            bar.title = `S${week.weekNumber}: ${Math.round(week.tss)} TSS - ${week.totalKm}km - ${week.phase}${hasTest ? ' - 📊 TEST' : ''}`;
            
            // Label "S1", "S2", etc.
            const label = document.createElement('div');
            label.className = 'chart-bar-label';
            label.textContent = `S${week.weekNumber}`;
            label.style.fontSize = '10px';
            label.style.color = '#9ca3af';
            label.style.textAlign = 'center';
            label.style.marginTop = '2px';
            label.style.whiteSpace = 'nowrap';
            label.style.pointerEvents = 'none';
            
            // Événement click sur le conteneur
            barContainer.addEventListener('click', () => {
                // 1. Trouver l'élément semaine
                const weekEl = document.querySelector(`[data-week-index="${index}"]`);
                if (!weekEl) return;
                
                const detailsEl = weekEl.closest('details');
                if (!detailsEl) return;
                
                // 2. Ouvrir la semaine
                detailsEl.open = true;
                
                // 3. Activer la phase correspondante
                const phase = week.phase;
                this.filterWeeksByPhase(phase);
                
                // 4. Scroll vers la semaine avec un petit délai pour l'animation
                setTimeout(() => {
                    detailsEl.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center' 
                    });
                    
                    // 5. Flash visuel pour attirer l'attention
                    detailsEl.style.transition = 'box-shadow 0.3s ease';
                    detailsEl.style.boxShadow = '0 0 0 3px rgba(34, 211, 238, 0.5)';
                    
                    setTimeout(() => {
                        detailsEl.style.boxShadow = '';
                    }, 1000);
                }, 100);
            });
            
            // Effet hover
            barContainer.addEventListener('mouseenter', () => {
                bar.style.opacity = '0.8';
                label.style.color = '#fff';
            });
            
            barContainer.addEventListener('mouseleave', () => {
                bar.style.opacity = '1';
                label.style.color = '#9ca3af';
            });
            
            barContainer.appendChild(bar);
            barContainer.appendChild(label);
            chartContainer.appendChild(barContainer);
        });
    },
    
    /**
     * Afficher les boutons de contrôle
     */
    showPlanControls() {
        const printBtn = document.querySelector('#print-plan');
        const saveBtn = document.querySelector('#save-plan');
        const resetBtn = document.querySelector('#reset-plan');
        
        if (printBtn) printBtn.classList.remove('hidden');
        if (saveBtn) saveBtn.classList.remove('hidden');
        if (resetBtn) resetBtn.classList.remove('hidden');
    },
    
    /**
     * Cacher les boutons de contrôle
     */
    hidePlanControls() {
        const printBtn = document.querySelector('#print-plan');
        const saveBtn = document.querySelector('#save-plan');
        const resetBtn = document.querySelector('#reset-plan');
        
        if (printBtn) printBtn.classList.add('hidden');
        if (saveBtn) saveBtn.classList.add('hidden');
        if (resetBtn) resetBtn.classList.add('hidden');
    },
    
    /**
     * Réinitialiser l'affichage
     */
    reset() {
        const content = document.querySelector('#plan-content');
        const wrapper = document.querySelector('#plan-content-wrapper');
        const placeholder = document.querySelector('#plan-placeholder');
        const chartWrapper = document.querySelector('#load-chart-container');
        
        if (content) content.innerHTML = '';
        if (wrapper) wrapper.classList.add('hidden');
        if (placeholder) placeholder.classList.remove('hidden');
        if (chartWrapper) chartWrapper.classList.add('hidden');
        
        this.hidePlanControls();
    }
};
