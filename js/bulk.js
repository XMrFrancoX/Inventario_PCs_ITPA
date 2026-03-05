/**
 * bulk.js — Carga Híbrida
 */
const Bulk = (() => {

    function init() {
        const hybridForm = document.getElementById('hybridLoadForm');
        if (hybridForm) {
            hybridForm.addEventListener('submit', e => {
                e.preventDefault();
                handleHybridLoad();
            });
        }
    }

    /* --------- Carga Híbrida --------- */
    async function handleHybridLoad() {
        const shelf = document.getElementById('hybridShelf').value;
        const startSlot = parseInt(document.getElementById('hybridStartSlot').value);
        const endSlot = parseInt(document.getElementById('hybridEndSlot').value);
        const prefix = document.getElementById('hybridPrefix').value.trim().toUpperCase();
        const startNum = parseInt(document.getElementById('hybridStartNum').value) || 1;
        const msgEl = document.getElementById('hybridMsg');

        if (!prefix) {
            msgEl.textContent = 'Ingrese un prefijo (ej: D, L, V, H)';
            msgEl.style.color = 'var(--status-yellow)';
            return;
        }
        if (isNaN(startSlot) || isNaN(endSlot) || startSlot < 1 || endSlot > 20 || startSlot > endSlot) {
            msgEl.textContent = 'Rango de ranuras inválido (1-20)';
            msgEl.style.color = 'var(--status-yellow)';
            return;
        }

        msgEl.textContent = 'Asignando laptops...';
        msgEl.style.color = 'var(--text-muted)';

        await DataStore.assignRange(shelf, startSlot, endSlot, prefix, startNum);
        await Cart.render();
        await Summary.update();

        const count = endSlot - startSlot + 1;
        msgEl.textContent = `Se asignaron ${count} laptops (${prefix}${String(startNum).padStart(2, '0')} — ${prefix}${String(startNum + count - 1).padStart(2, '0')}) al estante ${DataStore.getShelfLabel(shelf)}.`;
        msgEl.style.color = 'var(--status-green)';
    }

    return { init };
})();
