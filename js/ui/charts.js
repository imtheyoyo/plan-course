/**
 * ================================================
 * Charts Manager - Graphiques de progression
 * ================================================
 * Version: 1.0.0
 * Date: 2025-10-12
 * Dépendance: Chart.js 4.4.1
 * ================================================
 */

const ChartsManager = {
    // Instances des graphiques
    charts: {},
    
    // Configuration couleurs selon thème
    getColors(theme) {
        const isDark = theme === 'dark' || !theme;
        
        return {
            primary: isDark ? 'rgba(16, 185, 129, 0.8)' : 'rgba(5, 150, 105, 0.8)',
            secondary: isDark ? 'rgba(59, 130, 246, 0.8)' : 'rgba(37, 99, 235, 0.8)',
            tertiary: isDark ? 'rgba(249, 115, 22, 0.8)' : 'rgba(234, 88, 12, 0.8)',
            quaternary: isDark ? 'rgba(239, 68, 68, 0.8)' : 'rgba(220, 38, 38, 0.8)',
            success: isDark ? 'rgba(34, 197, 94, 0.8)' : 'rgba(22, 163, 74, 0.8)',
            text: isDark ? '#c9d1d9' : '#1f2937',
            grid: isDark ? 'rgba(48, 54, 61, 0.5)' : 'rgba(209, 213, 219, 0.5)',
            background: isDark ? '#161b22' : '#ffffff'
        };
    },
    
    /**
     * Initialiser tous les graphiques
     */
    init(planData) {
        console.log('📊 Initialisation ChartsManager');
        
        if (!window.Chart) {
            console.error('❌ Chart.js non chargé');
            return;
        }
        
        // Détecter le thème actuel
        const theme = document.documentElement.getAttribute('data-theme') || 'dark';
        
        // Créer les graphiques
        this.renderTSSChart(planData, theme);
        this.renderDistanceChart(planData, theme);
        this.renderIntensityChart(planData, theme);
        this.renderVDOTChart(planData, theme);
        this.renderSessionTypeChart(planData, theme);
        this.renderPaceChart(planData, theme);
        
        console.log('✅ Graphiques créés');
    },
    
    /**
     * Mettre à jour le thème de tous les graphiques
     */
    updateTheme(theme) {
        console.log(`🎨 Mise à jour thème graphiques: ${theme}`);
        
        // Détruire tous les graphiques
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        this.charts = {};
        
        // Recréer avec le nouveau thème
        if (window.STATE && window.STATE.currentPlanData) {
            this.init(window.STATE.currentPlanData);
        }
    },
    
    /**
     * 1. Graphique TSS (Charge d'entraînement)
     */
    renderTSSChart(planData, theme) {
        const canvas = document.getElementById('tss-chart');
        if (!canvas) return;
        
        const colors = this.getColors(theme);
        const weeks = planData.plan.map((w, i) => `S${i + 1}`);
        const tssData = planData.plan.map(w => w.tss);
        const phases = planData.plan.map(w => w.phase);
        
        // Moyenne mobile (3 semaines)
        const movingAvg = tssData.map((_, i) => {
            const start = Math.max(0, i - 2);
            const subset = tssData.slice(start, i + 1);
            return Math.round(subset.reduce((a, b) => a + b) / subset.length);
        });
        
        this.charts.tss = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: weeks,
                datasets: [{
                    type: 'bar',
                    label: 'TSS hebdomadaire',
                    data: tssData,
                    backgroundColor: tssData.map((_, i) => {
                        const phase = phases[i];
                        if (phase === 'Fondation') return colors.secondary;
                        if (phase === 'Qualité') return colors.primary;
                        if (phase === 'Pic') return colors.tertiary;
                        return colors.success;
                    }),
                    borderWidth: 0
                }, {
                    type: 'line',
                    label: 'Moyenne mobile (3 sem.)',
                    data: movingAvg,
                    borderColor: colors.quaternary,
                    borderWidth: 3,
                    tension: 0.4,
                    fill: false,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { 
                        labels: { color: colors.text, padding: 15 }
                    },
                    tooltip: {
                        callbacks: {
                            afterLabel: (context) => `Phase: ${phases[context.dataIndex]}`
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'TSS',
                            color: colors.text
                        },
                        ticks: { color: colors.text },
                        grid: { color: colors.grid }
                    },
                    x: {
                        ticks: { color: colors.text },
                        grid: { color: colors.grid }
                    }
                }
            }
        });
    },
    
    /**
     * 2. Graphique Distance hebdomadaire
     */
    renderDistanceChart(planData, theme) {
        const canvas = document.getElementById('distance-chart');
        if (!canvas) return;
        
        const colors = this.getColors(theme);
        const weeks = planData.plan.map((w, i) => `S${i + 1}`);
        const distanceData = planData.plan.map(w => w.totalKm);
        
        this.charts.distance = new Chart(canvas, {
            type: 'line',
            data: {
                labels: weeks,
                datasets: [{
                    label: 'Distance (km)',
                    data: distanceData,
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    borderColor: colors.primary,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: colors.primary,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Kilomètres',
                            color: colors.text
                        },
                        ticks: { color: colors.text },
                        grid: { color: colors.grid }
                    },
                    x: {
                        ticks: { color: colors.text },
                        grid: { color: colors.grid }
                    }
                }
            }
        });
    },
    
    /**
     * 3. Graphique Répartition par intensité
     */
    renderIntensityChart(planData, theme) {
        const canvas = document.getElementById('intensity-chart');
        if (!canvas) return;
        
        const colors = this.getColors(theme);
        
        // Compter les séances par intensité
        const intensityCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };
        planData.plan.forEach(week => {
            week.sessions.forEach(session => {
                intensityCounts[session.intensity] = (intensityCounts[session.intensity] || 0) + 1;
            });
        });
        
        this.charts.intensity = new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: ['Faible (E)', 'Modérée (M)', 'Élevée (T)', 'Très élevée (I/R)'],
                datasets: [{
                    data: [
                        intensityCounts[1],
                        intensityCounts[2],
                        intensityCounts[3],
                        intensityCounts[4]
                    ],
                    backgroundColor: [
                        colors.secondary,
                        colors.success,
                        colors.tertiary,
                        colors.quaternary
                    ],
                    borderWidth: 2,
                    borderColor: colors.background
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { 
                            color: colors.text,
                            padding: 15
                        }
                    }
                }
            }
        });
    },
    
    /**
     * 4. Graphique Progression VDOT
     */
    renderVDOTChart(planData, theme) {
        const canvas = document.getElementById('vdot-chart');
        if (!canvas) return;
        
        const colors = this.getColors(theme);
        const weeks = planData.plan.map((w, i) => `S${i + 1}`);
        
        // Simulation progression VDOT (tests tous les 6 semaines)
        const vdotData = weeks.map((_, i) => {
            if (i === 0) return planData.vdot;
            if ((i + 1) % 6 === 0) {
                // Test toutes les 6 semaines, +0.5 à +1.5 VDOT
                const progression = 0.5 + (Math.random() * 1);
                const previousVdot = vdotData[i - 6] || planData.vdot;
                return Math.round((previousVdot + progression) * 10) / 10;
            }
            return null;
        });
        
        this.charts.vdot = new Chart(canvas, {
            type: 'line',
            data: {
                labels: weeks,
                datasets: [{
                    label: 'VDOT',
                    data: vdotData,
                    borderColor: colors.secondary,
                    backgroundColor: colors.secondary,
                    borderWidth: 3,
                    tension: 0,
                    pointRadius: 8,
                    pointHoverRadius: 10,
                    spanGaps: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                if (context.parsed.y === null) return null;
                                return `VDOT: ${context.parsed.y} (Test)`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        min: planData.vdot - 2,
                        max: planData.vdot + 5,
                        title: {
                            display: true,
                            text: 'VDOT',
                            color: colors.text
                        },
                        ticks: { color: colors.text },
                        grid: { color: colors.grid }
                    },
                    x: {
                        ticks: { color: colors.text },
                        grid: { color: colors.grid }
                    }
                }
            }
        });
    },
    
    /**
     * 5. Graphique Types de séances
     */
    renderSessionTypeChart(planData, theme) {
        const canvas = document.getElementById('session-type-chart');
        if (!canvas) return;
        
        const colors = this.getColors(theme);
        
        // Compter les types de séances
        const typeCounts = {};
        planData.plan.forEach(week => {
            week.sessions.forEach(session => {
                typeCounts[session.type] = (typeCounts[session.type] || 0) + 1;
            });
        });
        
        // Trier par nombre décroissant
        const sortedTypes = Object.entries(typeCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8); // Top 8
        
        this.charts.sessionType = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: sortedTypes.map(([type]) => type),
                datasets: [{
                    label: 'Nombre de séances',
                    data: sortedTypes.map(([, count]) => count),
                    backgroundColor: [
                        colors.secondary,
                        colors.quaternary,
                        colors.tertiary,
                        colors.success,
                        'rgba(168, 85, 247, 0.8)',
                        'rgba(236, 72, 153, 0.8)',
                        'rgba(251, 191, 36, 0.8)',
                        'rgba(156, 163, 175, 0.8)'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: { color: colors.text },
                        grid: { color: colors.grid }
                    },
                    y: {
                        ticks: { color: colors.text },
                        grid: { display: false }
                    }
                }
            }
        });
    },
    
    /**
     * 6. Graphique Allures par phase
     */
    renderPaceChart(planData, theme) {
        const canvas = document.getElementById('pace-chart');
        if (!canvas) return;
        
        const colors = this.getColors(theme);
        
        // Compter les allures par phase
        const phaseData = {
            'Fondation': { E: 0, M: 0, T: 0, I: 0, R: 0 },
            'Qualité': { E: 0, M: 0, T: 0, I: 0, R: 0 },
            'Pic': { E: 0, M: 0, T: 0, I: 0, R: 0 }
        };
        
        planData.plan.forEach(week => {
            if (!phaseData[week.phase]) return;
            
            week.sessions.forEach(session => {
                // Déduire l'allure de l'intensité
                if (session.intensity === 1) phaseData[week.phase].E++;
                else if (session.intensity === 2) phaseData[week.phase].M++;
                else if (session.intensity === 3) phaseData[week.phase].T++;
                else if (session.intensity === 4) {
                    // Séparer I et R selon le type
                    if (session.type.includes('Répétition') || session.type.includes('VMA courte')) {
                        phaseData[week.phase].R++;
                    } else {
                        phaseData[week.phase].I++;
                    }
                }
            });
        });
        
        this.charts.pace = new Chart(canvas, {
            type: 'radar',
            data: {
                labels: ['Endurance', 'Marathon', 'Seuil', 'Intervalle', 'Répétition'],
                datasets: [{
                    label: 'Fondation',
                    data: [
                        phaseData['Fondation'].E,
                        phaseData['Fondation'].M,
                        phaseData['Fondation'].T,
                        phaseData['Fondation'].I,
                        phaseData['Fondation'].R
                    ],
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    borderColor: colors.secondary,
                    borderWidth: 2
                }, {
                    label: 'Qualité',
                    data: [
                        phaseData['Qualité'].E,
                        phaseData['Qualité'].M,
                        phaseData['Qualité'].T,
                        phaseData['Qualité'].I,
                        phaseData['Qualité'].R
                    ],
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    borderColor: colors.primary,
                    borderWidth: 2
                }, {
                    label: 'Pic',
                    data: [
                        phaseData['Pic'].E,
                        phaseData['Pic'].M,
                        phaseData['Pic'].T,
                        phaseData['Pic'].I,
                        phaseData['Pic'].R
                    ],
                    backgroundColor: 'rgba(249, 115, 22, 0.2)',
                    borderColor: colors.tertiary,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        ticks: { color: colors.text },
                        grid: { color: colors.grid },
                        pointLabels: { color: colors.text }
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: colors.text, padding: 15 }
                    }
                }
            }
        });
    },
    
    /**
     * Détruire tous les graphiques
     */
    destroy() {
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        this.charts = {};
        console.log('🗑️ Graphiques détruits');
    }
};

// Export global
if (typeof window !== 'undefined') {
    window.ChartsManager = ChartsManager;
}

console.log('✅ charts.js chargé');
