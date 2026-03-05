/**
 * summary.js — Resumen general con contadores automáticos
 */
const Summary = (() => {

    async function update() {
        const stats = await DataStore.getStats();

        setCount('countTotal', stats.total);
        setCount('countAlmacenadas', stats.almacenada);
        setCount('countEnUso', stats.enuso);
        setCount('countExcepciones', stats.excepcion);
        setCount('countStaff', stats.staff);
        setCount('countVacios', stats.vacio);

        // Also update summary page counters
        setCount('countTotal2', stats.total);
        setCount('countAlmacenadas2', stats.almacenada);
        setCount('countEnUso2', stats.enuso);
        setCount('countExcepciones2', stats.excepcion);
        setCount('countStaff2', stats.staff);
        setCount('countVacios2', stats.vacio);
    }

    function setCount(id, value) {
        const el = document.getElementById(id);
        if (el) {
            const current = parseInt(el.textContent) || 0;
            if (current !== value) {
                animateValue(el, current, value, 400);
            }
        }
    }

    function animateValue(el, start, end, duration) {
        const range = end - start;
        if (range === 0) return;
        const startTime = performance.now();

        function step(timestamp) {
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.round(start + range * eased);
            if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }

    function init() {
        // No longer needed to listen for 'data-updated' events since we use async calls
    }

    return { init, update };
})();
