/**
 * ================================================
 * js/ui/render.js - Affichage du plan
 * ================================================
 * Rendu des semaines, séances et graphiques
 * VERSION 2.2.2 - Avec correctifs bugs #3
 * Date: 21 octobre 2025
 * 
 * CHANGELOG 2.2.2:
 * - BUG FIX #3: Correction accès aux alertes (week.alerts au lieu de week.sessions.metadata.alerts)
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
        planData.weeks.forEach((week, weekIndex) => {
            this.renderWeek(content, week, weekIndex, planData, openStates);
        });
        
        // Afficher les boutons d'action
        this.showPlanControls();
        
        // Filtrer par phase active
        const phaseToDisplay = activePhase || [...new Set(planData.weeks.map(w => w.phase))][0];
        this.filterWeeksByPhase(phaseToDisplay);
    },
    
    /**
     * Afficher l'en-tête avec les allures
     */
    renderHeader(container, planData) {
        const paceKeys = ['M', 'T', 'I', 'R'];
        const paceItems = paceKeys.map(key => `
            <div class="card p-2 rounded-md text-center">
                <p class="font-bold text-green-400">${this.getPaceLabel(key)}</p>
                <p class="text-white font-semibold">${Formatters.secondsToPace(planData.paces[key]).replace('/km', '')}</p>
            </div>
        `).join('');
        
        const enduranceItem = `
            <div class="card p-2 rounded-md text-center">
                <p class="font-bold text-green-400">Endurance</p>
                <p class="text-white font-semibold">${Formatters.secondsToPace(planData.paces.E_high).replace('/km', '')} - ${Formatters.secondsToPace(planData.paces.E_low).replace('/km', '')}</p>
            </div>
        `;
        
        const header = document.createElement('div');
        header.className = 'mb-6 pb-4 border-b border-gray-700';
        header.innerHTML = `
            <h2 class="text-3xl font-bold text-white mb-2">Plan de ${planData.weeks.length} semaines</h2>
            <p class="text-sm text-gray-400">Objectif: ${planData.userInput.raceDistance.toUpperCase()} • VDOT: ${planData.vdot}</p>
            <div class="mt-4 grid grid-cols-3 md:grid-cols-5 gap-2 text-sm">
                ${enduranceItem}
                ${paceItems}
            </div>
        `;
        container.appendChild(header);
    },
    
    /**
     * Obtenir le label d'une allure
     */
    getPaceLabel(key) {
        const labels = {
            'E': 'Endurance',
            'M': 'Marathon',
            'T': 'Seuil',
            'I': 'VMA',
            'R': 'Répétitions'
        };
        return labels[key] || key;
    },
    
    /**
     * Afficher les onglets de phases
     */
    renderPhaseTabs(container, planData, activePhase) {
        const phases = [...new Set(planData.weeks.map(w => w.phase))];
        const firstPhase = activePhase || phases[0];
        
        const tabsContainer = document.createElement('div');
        tabsContainer.id = 'phase-tabs';
        tabsContainer.className = 'flex space-x-1 mb-6 bg-gray-800 p-1 rounded-lg';
        
        phases.forEach(phase => {
            const tab = document.createElement('button');
            tab.className = `flex-1 py-2 px-4 rounded-md font-semibold transition-all ${
                phase === firstPhase 
                    ? 'bg-green-600 text-white' 
                    : 'bg-transparent text-gray-400 hover:text-white hover:bg-gray-700'
            }`;
            tab.textContent = phase;
            tab.dataset.phase = phase;
            
            tab.addEventListener('click', () => {
                this.filterWeeksByPhase(phase);
            });
            
            tabsContainer.appendChild(tab);
        });
        
        container.appendChild(tabsContainer);
    },
    
    /**
     * Filtrer les semaines par phase
     */
    filterWeeksByPhase(phase) {
        // Mettre à jour les onglets
        document.querySelectorAll('#phase-tabs button').forEach(btn => {
            if (btn.dataset.phase === phase) {
                btn.className = 'flex-1 py-2 px-4 rounded-md font-semibold transition-all bg-green-600 text-white';
            } else {
                btn.className = 'flex-1 py-2 px-4 rounded-md font-semibold transition-all bg-transparent text-gray-400 hover:text-white hover:bg-gray-700';
            }
        });
        
        // Afficher/masquer les semaines
        document.querySelectorAll('.week-card').forEach(card => {
            if (card.dataset.phase === phase) {
                card.classList.remove('hidden');
            } else {
                card.classList.add('hidden');
            }
        });
    },
    
    /**
     * Afficher une semaine
     */
    renderWeek(container, week, weekIndex, planData, openStates) {
        const isOpen = openStates.get(weekIndex) || false;
        
        const weekCard = document.createElement('div');
        weekCard.className = 'week-card card mb-4';
        weekCard.dataset.phase = week.phase;
        weekCard.dataset.weekIndex = weekIndex;
        
        // En-tête de semaine
        const weekHeader = this.createWeekHeader(week, weekIndex, isOpen, planData);
        weekCard.appendChild(weekHeader);
        
        // Contenu de semaine (séances)
        if (isOpen) {
            const weekContent = this.createWeekContent(week, weekIndex, planData);
            weekCard.appendChild(weekContent);
        }
        
        container.appendChild(weekCard);
    },
    
    /**
     * Créer l'en-tête d'une semaine
     */
    createWeekHeader(week, weekIndex, isOpen, planData) {
        const header = document.createElement('div');
        header.className = 'week-header flex items-center justify-between p-4 cursor-pointer hover:bg-gray-750 transition-colors';
        
        // ✅ BUG FIX #3: Accéder directement à week.alerts
        const alerts = week.alerts || [];
        const hasAlerts = alerts.length > 0;
        const validationScore = week.validationScore || 100;
        
        // 🆕 Badge de validation coloré selon le score
        let validationBadge = '';
        if (validationScore < 60) {
            validationBadge = '<span class="badge-error">⛔ Placement risqué</span>';
        } else if (validationScore < 80) {
            validationBadge = '<span class="badge-warning">⚠️ À surveiller</span>';
        } else if (validationScore >= 95) {
            validationBadge = '<span class="badge-success">✅ Optimal</span>';
        }
        
        const totalKm = week.sessions.reduce((sum, s) => sum + (s.volume || 0), 0);
        
        header.innerHTML = `
            <div class="flex items-center space-x-4 flex-1">
                <div class="flex items-center space-x-2">
                    <span class="text-2xl font-bold text-white">S${week.number}</span>
                    ${week.isRecovery ? '<span class="badge-recovery">Récup</span>' : ''}
                    ${validationBadge}
                </div>
                <div class="text-sm text-gray-400">
                    <span class="font-semibold text-white">${week.phase}</span>
                    <span class="mx-2">•</span>
                    <span>${totalKm.toFixed(1)} km</span>
                    <span class="mx-2">•</span>
                    <span>TSS: ${week.totalTSS}</span>
                    ${validationScore < 100 ? `<span class="mx-2">•</span><span class="text-yellow-400">Score: ${validationScore}/100</span>` : ''}
                </div>
            </div>
            <div class="flex items-center space-x-3">
                ${this.createFatigueIndicator(week.fatigue)}
                <svg class="w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}" 
                     fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
            </div>
        `;
        
        // Gérer le clic pour ouvrir/fermer
        header.addEventListener('click', () => {
            const newState = new Map(STATE.openWeeks);
            newState.set(weekIndex, !isOpen);
            STATE.openWeeks = newState;
            this.renderPlan(planData, newState, null);
        });
        
        return header;
    },
    
    /**
     * Créer l'indicateur de fatigue
     */
    createFatigueIndicator(fatigue) {
        if (!fatigue) return '';
        
        const colors = {
            'Frais': 'bg-blue-500',
            'Optimal': 'bg-green-500',
            'Fatigué': 'bg-yellow-500',
            'Très fatigué': 'bg-red-500'
        };
        
        const color = colors[fatigue.status] || 'bg-gray-500';
        
        return `
            <div class="flex items-center space-x-2">
                <div class="w-2 h-2 rounded-full ${color}"></div>
                <span class="text-xs text-gray-400">${fatigue.status}</span>
            </div>
        `;
    },
    
    /**
     * Créer le contenu d'une semaine (liste des séances)
     */
    createWeekContent(week, weekIndex, planData) {
        const content = document.createElement('div');
        content.className = 'week-content border-t border-gray-700 p-4 space-y-3';
        
        // ✅ BUG FIX #3: Alertes accessibles directement
        const alerts = week.alerts || [];
        const recommendations = week.recommendations || [];
        const validationResult = week.validationResult;
        
        // 🆕 Afficher le rapport de validation détaillé si score < 100
        if (validationResult && validationResult.score < 100) {
            const validationDiv = document.createElement('div');
            validationDiv.className = 'validation-report-container bg-gray-800 border border-gray-600 rounded-lg p-4 mb-4';
            
            let validationHTML = `
                <div class="flex items-center justify-between mb-3">
                    <h4 class="font-semibold text-white">📊 Analyse du placement des séances</h4>
                    <span class="text-sm ${validationResult.score >= 80 ? 'text-green-400' : validationResult.score >= 60 ? 'text-yellow-400' : 'text-red-400'}">
                        Score: ${validationResult.score}/100
                    </span>
                </div>
            `;
            
            // Erreurs critiques
            if (validationResult.errors && validationResult.errors.length > 0) {
                validationHTML += `
                    <div class="validation-section mb-3">
                        <p class="text-red-400 font-semibold mb-2">⛔ Erreurs critiques:</p>
                        <ul class="space-y-2">
                `;
                validationResult.errors.forEach(error => {
                    validationHTML += `
                        <li class="text-sm">
                            <p class="text-red-300">${error.message}</p>
                            <p class="text-gray-400 text-xs mt-1">💡 ${error.suggestion}</p>
                        </li>
                    `;
                });
                validationHTML += `</ul></div>`;
            }
            
            // Avertissements
            if (validationResult.warnings && validationResult.warnings.length > 0) {
                validationHTML += `
                    <div class="validation-section mb-3">
                        <p class="text-yellow-400 font-semibold mb-2">⚠️ Avertissements:</p>
                        <ul class="space-y-2">
                `;
                validationResult.warnings.forEach(warning => {
                    validationHTML += `
                        <li class="text-sm">
                            <p class="text-yellow-300">${warning.message}</p>
                            <p class="text-gray-400 text-xs mt-1">💡 ${warning.suggestion}</p>
                        </li>
                    `;
                });
                validationHTML += `</ul></div>`;
            }
            
            // Recommandations
            if (validationResult.recommendations && validationResult.recommendations.length > 0) {
                validationHTML += `
                    <div class="validation-section">
                        <p class="text-blue-400 font-semibold mb-2">💡 Recommandations d'optimisation:</p>
                        <ul class="space-y-2">
                `;
                validationResult.recommendations.forEach(rec => {
                    validationHTML += `
                        <li class="text-sm">
                            <p class="text-blue-300">${rec.message}</p>
                            <p class="text-gray-400 text-xs mt-1">${rec.suggestion}</p>
                        </li>
                    `;
                });
                validationHTML += `</ul></div>`;
            }
            
            validationDiv.innerHTML = validationHTML;
            content.appendChild(validationDiv);
        }
        
        // Afficher les alertes simples (compatibilité ancienne version)
        if (alerts.length > 0 && (!validationResult || validationResult.score === 100)) {
            const alertsDiv = document.createElement('div');
            alertsDiv.className = 'bg-yellow-900/30 border border-yellow-700 rounded-lg p-3 mb-3';
            alertsDiv.innerHTML = `
                <p class="font-semibold text-yellow-400 mb-2">⚠️ Alertes</p>
                <ul class="text-sm text-yellow-200 space-y-1">
                    ${alerts.map(alert => `<li>• ${alert}</li>`).join('')}
                </ul>
            `;
            content.appendChild(alertsDiv);
        }
        
        // Afficher les recommandations simples (compatibilité ancienne version)
        if (recommendations.length > 0 && (!validationResult || validationResult.score === 100)) {
            const recsDiv = document.createElement('div');
            recsDiv.className = 'bg-blue-900/30 border border-blue-700 rounded-lg p-3 mb-3';
            recsDiv.innerHTML = `
                <p class="font-semibold text-blue-400 mb-2">💡 Recommandations</p>
                <ul class="text-sm text-blue-200 space-y-1">
                    ${recommendations.map(rec => `<li>• ${rec}</li>`).join('')}
                </ul>
            `;
            content.appendChild(recsDiv);
        }
        
        // 🆕 Afficher le planning visuel de la semaine
        const weekCalendar = this.createWeekCalendar(week.sessions);
        content.appendChild(weekCalendar);
        
        // Liste des séances
        const sessionsContainer = document.createElement('div');
        sessionsContainer.className = 'sessions-list space-y-2 mt-4';
        sessionsContainer.dataset.weekIndex = weekIndex;
        
        week.sessions.forEach((session, sessionIndex) => {
            const sessionCard = this.createSessionCard(session, sessionIndex, weekIndex, planData);
            sessionsContainer.appendChild(sessionCard);
        });
        
        content.appendChild(sessionsContainer);
        
        return content;
    },
    
    /**
     * 🆕 Créer un calendrier visuel de la semaine
     */
    createWeekCalendar(sessions) {
        const calendar = document.createElement('div');
        calendar.className = 'week-calendar bg-gray-800 rounded-lg p-3 mb-3';
        
        const days = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
        const daysFull = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
        
        // Créer un tableau des séances par jour
        const sessionsByDay = new Array(7).fill(null);
        sessions.forEach(session => {
            if (session.assignedDay !== undefined) {
                sessionsByDay[session.assignedDay] = session;
            }
        });
        
        let calendarHTML = '<div class="grid grid-cols-7 gap-1">';
        
        days.forEach((day, index) => {
            const session = sessionsByDay[index];
            const hasSession = session !== null;
            
            let bgColor = 'bg-gray-700';
            let icon = '○';
            let tooltip = daysFull[index];
            
            if (hasSession) {
                if (session.type === 'quality' || session.intensity === 'I' || session.intensity === 'T') {
                    bgColor = 'bg-purple-600';
                    icon = '⚡';
                    tooltip = `${daysFull[index]}: ${session.name}`;
                } else if (session.type === 'long') {
                    bgColor = 'bg-blue-600';
                    icon = '🏃';
                    tooltip = `${daysFull[index]}: ${session.name}`;
                } else {
                    bgColor = 'bg-green-600';
                    icon = '✓';
                    tooltip = `${daysFull[index]}: ${session.name}`;
                }
            }
            
            calendarHTML += `
                <div class="${bgColor} rounded text-center p-2 text-white text-xs font-semibold relative group">
                    <div>${day}</div>
                    <div class="text-lg">${icon}</div>
                    <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
                        ${tooltip}
                    </div>
                </div>
            `;
        });
        
        calendarHTML += '</div>';
        calendar.innerHTML = calendarHTML;
        
        return calendar;
    },
    
    /**
     * Créer une carte de séance
     */
    createSessionCard(session, sessionIndex, weekIndex, planData) {
        const card = document.createElement('div');
        card.className = 'session-card bg-gray-750 rounded-lg p-3 hover:bg-gray-700 transition-colors cursor-move';
        card.draggable = true;
        card.dataset.weekIndex = weekIndex;
        card.dataset.sessionIndex = sessionIndex;
        card.dataset.sessionId = session.id;
        
        const typeColors = {
            'long': 'bg-blue-600',
            'quality': 'bg-purple-600',
            'easy': 'bg-green-600',
            'recovery': 'bg-gray-600'
        };
        
        const typeColor = typeColors[session.type] || 'bg-gray-600';
        
        card.innerHTML = `
            <div class="flex items-start justify-between">
                <div class="flex-1">
                    <div class="flex items-center space-x-2 mb-1">
                        <span class="w-2 h-2 rounded-full ${typeColor}"></span>
                        <span class="font-semibold text-white">${session.name}</span>
                        ${session.adjusted ? '<span class="text-xs text-yellow-400">✨ Ajusté</span>' : ''}
                    </div>
                    <p class="text-sm text-gray-400">${session.description}</p>
                    <div class="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                        <span>${session.volume.toFixed(1)} km</span>
                        <span>•</span>
                        <span>TSS: ${session.tss}</span>
                    </div>
                </div>
                <button class="edit-session-btn text-gray-400 hover:text-white transition-colors"
                        data-week-index="${weekIndex}"
                        data-session-index="${sessionIndex}">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                </button>
            </div>
        `;
        
        // Gestionnaire d'événement pour l'édition
        card.querySelector('.edit-session-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            SessionManager.openSessionModal(weekIndex, sessionIndex, planData);
        });
        
        return card;
    },
    
    /**
     * Afficher les contrôles du plan (boutons d'action)
     */
    showPlanControls() {
        const buttons = ['#save-plan', '#print-plan', '#reset-plan'];
        buttons.forEach(selector => {
            const btn = document.querySelector(selector);
            if (btn) {
                btn.classList.remove('hidden');
            }
        });
    },
    
    /**
     * Afficher le graphique de charge
     */
    renderLoadChart(planData) {
        const chartContainer = document.querySelector('#load-chart');
        if (!chartContainer) return;
        
        chartContainer.innerHTML = '';
        
        const canvas = document.createElement('canvas');
        canvas.id = 'tss-chart';
        canvas.height = 200;
        chartContainer.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        const weeks = planData.weeks;
        
        // Préparer les données
        const labels = weeks.map((w, i) => `S${i + 1}`);
        const tssData = weeks.map(w => w.totalTSS);
        const atlData = weeks.map(w => w.fatigue?.ATL || 0);
        const ctlData = weeks.map(w => w.fatigue?.CTL || 0);
        
        // Dessiner le graphique
        this.drawChart(ctx, canvas, {
            labels,
            datasets: [
                { label: 'TSS', data: tssData, color: 'rgba(34, 197, 94, 0.8)' },
                { label: 'ATL', data: atlData, color: 'rgba(234, 179, 8, 0.6)' },
                { label: 'CTL', data: ctlData, color: 'rgba(59, 130, 246, 0.6)' }
            ]
        });
    },
    
    /**
     * Dessiner un graphique simple
     */
    drawChart(ctx, canvas, data) {
        const padding = 40;
        const width = canvas.width;
        const height = canvas.height;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;
        
        // Trouver les valeurs min/max
        const allValues = data.datasets.flatMap(ds => ds.data);
        const maxValue = Math.max(...allValues);
        const minValue = 0;
        
        // Effacer le canvas
        ctx.clearRect(0, 0, width, height);
        
        // Dessiner les axes
        ctx.strokeStyle = '#4B5563';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();
        
        // Dessiner chaque dataset
        data.datasets.forEach(dataset => {
            ctx.strokeStyle = dataset.color;
            ctx.fillStyle = dataset.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            const stepX = chartWidth / (data.labels.length - 1);
            
            dataset.data.forEach((value, index) => {
                const x = padding + index * stepX;
                const y = height - padding - ((value - minValue) / (maxValue - minValue)) * chartHeight;
                
                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
                
                // Point
                ctx.fillRect(x - 2, y - 2, 4, 4);
            });
            
            ctx.stroke();
        });
        
        // Labels
        ctx.fillStyle = '#9CA3AF';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        
        data.labels.forEach((label, index) => {
            const x = padding + index * (chartWidth / (data.labels.length - 1));
            ctx.fillText(label, x, height - padding + 15);
        });
        
        // Légende
        let legendX = padding;
        const legendY = 20;
        data.datasets.forEach(dataset => {
            ctx.fillStyle = dataset.color;
            ctx.fillRect(legendX, legendY - 8, 12, 12);
            ctx.fillStyle = '#E5E7EB';
            ctx.textAlign = 'left';
            ctx.fillText(dataset.label, legendX + 16, legendY);
            legendX += 80;
        });
    }
};
