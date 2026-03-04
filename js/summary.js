/**
 * summary.js — Resumen general con contadores automáticos
 */
const Summary = (() => {

    function update() {
        const stats = DataStore.getStats();

        setCount('countTotal', stats.total);
        setCount('countAlmacenadas', stats.almacenadas);
        setCount('countEnUso', stats.enUso);
        setCount('countExcepciones', stats.excepciones);
        setCount('countStaff', stats.staff);
        setCount('countVacios', stats.vacios);

        // Also update summary page counters
        setCount('countTotal2', stats.total);
        setCount('countAlmacenadas2', stats.almacenadas);
        setCount('countEnUso2', stats.enUso);
        setCount('countExcepciones2', stats.excepciones);
        setCount('countStaff2', stats.staff);
        setCount('countVacios2', stats.vacios);
    }

    function setCount(id, value) {
        const el = document.getElementById(id);
        if (el) {
            // Animate counter
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
            const eased = 1 - Math.pow(1 - progress, 3); // ease out cubic
            el.textContent = Math.round(start + range * eased);
            if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }

    function init() {
        window.addEventListener('data-updated', update);
    }

    return { init, update };
})();
