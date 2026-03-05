/**
 * bulk.js — Carga Híbrida (la entrega masiva ahora es manejada por transactions.js)
 */
const Bulk = (() => {

    function init() {
        // Carga híbrida form
        const hybridForm = document.getElementById('hybridLoadForm');
        if (hybridForm) {
            hybridForm.addEventListener('submit', e => {
                e.preventDefault();
                handleHybridLoad();
            });
        }
    }

    /* --------- Carga Híbrida --------- */
    function handleHybridLoad() {
        const shelf = document.getElementById('hybridShelf').value;
        const startSlot = parseInt(document.getElementById('hybridStartSlot').value) - 1; // 0-indexed
        const endSlot = parseInt(document.getElementById('hybridEndSlot').value) - 1;
        const prefix = document.getElementById('hybridPrefix').value.trim().toUpperCase();
        const startNum = parseInt(document.getElementById('hybridStartNum').value) || 1;
        const msgEl = document.getElementById('hybridMsg');

        if (!prefix) {
            msgEl.textContent = 'Ingrese un prefijo (ej: D, L, V, H)';
            msgEl.style.color = 'var(--status-yellow)';
            return;
        }
        if (isNaN(startSlot) || isNaN(endSlot) || startSlot < 0 || endSlot > 19 || startSlot > endSlot) {
            msgEl.textContent = 'Rango de ranuras inválido (1-20)';
            msgEl.style.color = 'var(--status-yellow)';
            return;
        }

        DataStore.assignRange(shelf, startSlot, endSlot, prefix, startNum);
        Cart.render();
        Summary.update();

        const count = endSlot - startSlot + 1;
        msgEl.textContent = `Se asignaron ${count} laptops (${prefix}${String(startNum).padStart(2, '0')} — ${prefix}${String(startNum + count - 1).padStart(2, '0')}) al estante ${shelf === 'superior' ? 'Superior' : 'Inferior'}.`;
        msgEl.style.color = 'var(--status-green)';
    }

    return { init };
})();
