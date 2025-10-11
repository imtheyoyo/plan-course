/**
 * ================================================
 * CSS pour l'ajout/suppression de séances
 * À ajouter dans css/styles.css
 * ================================================
 */

/* ===== BOUTONS D'ACTION SUR LES SÉANCES ===== */

/* Bouton d'ajout sur les jours vides */
.empty-day-slot {
    position: relative;
    min-height: 80px;
    border: 2px dashed #374151;
    border-radius: 8px;
    transition: all 0.2s ease;
}

.empty-day-slot:hover {
    border-color: #10b981;
    background: rgba(16, 185, 129, 0.05);
}

.add-session-btn {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    border: none;
    border-radius: 50%;
    color: white;
    font-size: 1.5rem;
    cursor: pointer;
    opacity: 0;
    transition: all 0.2s ease;
    box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.empty-day-slot:hover .add-session-btn {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.1);
}

.add-session-btn:hover {
    background: linear-gradient(135deg, #059669 0%, #047857 100%);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.5);
}

.add-session-btn:active {
    transform: translate(-50%, -50%) scale(0.95);
}

/* Bouton de suppression sur les cartes */
.session-card {
    position: relative;
}

.delete-session-btn {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 24px;
    height: 24px;
    background: rgba(239, 68, 68, 0.9);
    border: none;
    border-radius: 50%;
    color: white;
    font-size: 0.9rem;
    font-weight: bold;
    cursor: pointer;
    opacity: 0;
    transition: all 0.2s ease;
    z-index: 100; /* Z-index élevé pour intercepter le clic */
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    pointer-events: auto; /* Force l'interception du clic */
}

.session-card:hover .delete-session-btn {
    opacity: 1;
}

.delete-session-btn:hover {
    background: rgba(220, 38, 38, 1);
    transform: scale(1.1);
}

.delete-session-btn:active {
    transform: scale(0.9);
}

/* ===== MODAL D'AJOUT DE SÉANCE ===== */

.session-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    opacity: 0;
    transition: opacity 0.2s ease;
}

.session-modal-overlay.show {
    opacity: 1;
}

.session-modal {
    background: #1f2937;
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    max-width: 500px;
    width: 90%;
    max-height: 90vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    transform: scale(0.9);
    transition: transform 0.2s ease;
}

.session-modal-overlay.show .session-modal {
    transform: scale(1);
}

/* En-tête du modal */
.session-modal-header {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    padding: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.session-modal-header h3 {
    color: white;
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0;
}

.close-modal-btn {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    color: white;
    font-size: 1.2rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
}

.close-modal-btn:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: rotate(90deg);
}

/* Corps du modal */
.session-modal-body {
    padding: 24px;
    overflow-y: auto;
    flex: 1;
}

.form-group {
    margin-bottom: 20px;
}

.form-group label {
    display: block;
    color: #e5e7eb;
    font-weight: 600;
    margin-bottom: 8px;
    font-size: 0.9rem;
}

.form-input {
    width: 100%;
    padding: 10px 12px;
    background: #111827;
    border: 1px solid #374151;
    border-radius: 6px;
    color: white;
    font-size: 0.95rem;
    transition: all 0.2s ease;
}

.form-input:focus {
    outline: none;
    border-color: #10b981;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.form-input option {
    background: #1f2937;
    color: white;
    padding: 8px;
}

textarea.form-input {
    resize: vertical;
    min-height: 80px;
    font-family: inherit;
}

/* Pied du modal */
.session-modal-footer {
    padding: 16px 24px;
    background: #111827;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    border-top: 1px solid #374151;
}

.btn-primary,
.btn-secondary {
    padding: 10px 20px;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.2s ease;
}

.btn-primary {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.btn-primary:hover {
    background: linear-gradient(135deg, #059669 0%, #047857 100%);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.5);
    transform: translateY(-1px);
}

.btn-primary:active {
    transform: translateY(0);
}

.btn-secondary {
    background: #374151;
    color: #e5e7eb;
}

.btn-secondary:hover {
    background: #4b5563;
}

/* ===== RESPONSIVE ===== */

@media (max-width: 640px) {
    .session-modal {
        width: 95%;
        max-height: 95vh;
    }
    
    .session-modal-header {
        padding: 16px;
    }
    
    .session-modal-header h3 {
        font-size: 1.25rem;
    }
    
    .session-modal-body {
        padding: 16px;
    }
    
    .session-modal-footer {
        padding: 12px 16px;
        flex-direction: column-reverse;
    }
    
    .btn-primary,
    .btn-secondary {
        width: 100%;
    }
    
    .delete-session-btn {
        opacity: 1;
    }
    
    .add-session-btn {
        opacity: 0.7;
    }
}

/* ===== ANIMATIONS ===== */

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.session-card {
    animation: fadeIn 0.3s ease;
}

/* ===== ÉTATS ===== */

.session-card.deleting {
    animation: fadeOut 0.3s ease forwards;
}

@keyframes fadeOut {
    to {
        opacity: 0;
        transform: scale(0.9);
    }
}
