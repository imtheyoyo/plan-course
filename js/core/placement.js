/**
 * ================================================
 * js/core/placement.js - Placement intelligent des séances
 * ================================================
 */

const Placement = {
    /**
     * Placer une séance dans un jour préféré
     */
    placeSession(session, preferredDay, availableDays, assignedDays, finalSessions) {
        if (session && availableDays.includes(preferredDay) && !assignedDays.has(preferredDay)) {
            session.day = preferredDay;
            finalSessions.push(session);
            assignedDays.add(preferredDay);
            return true;
        }
        return false;
    },
    
    /**
     * Placer les séances dures avec espacement
     */
    placeHardSessions(hardSessions, availableDays, assignedDays, finalSessions) {
        for (const session of hardSessions) {
            let placed = false;
            
            // Tests : priorité mardi/mercredi/jeudi
            if (session.isTest) {
                for (const day of CONFIG.preferredDays.test) {
                    if (this.placeSession(session, day, availableDays, assignedDays, finalSessions)) {
                        placed = true;
                        break;
                    }
                }
            }
            
            // VMA : priorité lundi/mardi
            if (!placed && session.intensity === 4) {
                for (const day of CONFIG.preferredDays.vma) {
                    if (this.placeSession(session, day, availableDays, assignedDays, finalSessions)) {
                        placed = true;
                        break;
                    }
                }
            }
            
            // Seuil : priorité mercredi/jeudi
            if (!placed && session.intensity === 3) {
                for (const day of CONFIG.preferredDays.threshold) {
                    if (this.placeSession(session, day, availableDays, assignedDays, finalSessions)) {
                        placed = true;
                        break;
                    }
                }
            }
            
            // Placement avec espacement de 2 jours
            if (!placed) {
                for (const day of availableDays) {
                    if (!assignedDays.has(day - 1) && !assignedDays.has(day - 2) &&
                        !assignedDays.has(day + 1) && !assignedDays.has(day + 2)) {
                        session.day = day;
                        finalSessions.push(session);
                        assignedDays.add(day);
                        placed = true;
                        break;
                    }
                }
            }
            
            // Placement avec espacement de 1 jour minimum
            if (!placed) {
                for (const day of availableDays) {
                    if (!assignedDays.has(day - 1) && !assignedDays.has(day + 1)) {
                        session.day = day;
                        finalSessions.push(session);
                        assignedDays.add(day);
                        placed = true;
                        break;
                    }
                }
            }
            
            // Placement forcé si nécessaire
            if (!placed) {
                const day = availableDays.find(d => !assignedDays.has(d));
                if (day !== undefined) {
                    session.day = day;
                    finalSessions.push(session);
                    assignedDays.add(day);
                }
            }
        }
        
        return availableDays.filter(d => !assignedDays.has(d));
    },
    
    /**
     * Placer les footings dans les jours restants
     */
    placeEasySessions(easySessions, availableDays, finalSessions) {
        // Éviter le lundi si possible
        const preferredDays = availableDays.filter(d => d !== 0);
        const mondayDays = availableDays.filter(d => d === 0);
        const orderedDays = [...preferredDays, ...mondayDays];
        
        easySessions.sort((a, b) => (b.km || 0) - (a.km || 0)).forEach(session => {
            const day = orderedDays.shift();
            if (day !== undefined) {
                session.day = day;
                finalSessions.push(session);
            }
        });
    }
};