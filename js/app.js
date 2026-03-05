/**
 * app.js — Inicialización y gestión global de la aplicación
 */
const App = (() => {

    function init() {
        DataStore.init();
        Summary.init();
        Modal.init();
        Auth.init();
        Bulk.init();
        UserManager.init();
        Transactions.init();
<<<<<<< HEAD
=======
        CartManager.init();
>>>>>>> 08b288a (feat: implement initial ITPA PC inventory management application with data storage, user authentication, and multi-cart support.)
        setupSidebar();
        setupNavigation();
        registerSW();

        // Check auth to show/hide menu button initially
        const menuBtn = document.getElementById('menuBtn');
        if (menuBtn) {
            menuBtn.style.display = Auth.isLoggedIn() ? '' : 'none';
        }
    }

    /* ---------- Sidebar ---------- */
    function setupSidebar() {
        const menuBtn = document.getElementById('menuBtn');
        const overlay = document.getElementById('sidebarOverlay');

        menuBtn?.addEventListener('click', toggleSidebar);
        overlay?.addEventListener('click', closeSidebar);
    }

    function toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        sidebar.classList.toggle('open');
        overlay.classList.toggle('visible');
    }

    function closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        sidebar.classList.remove('open');
        overlay.classList.remove('visible');
    }

    /* ---------- Navegación entre secciones ---------- */
    function setupNavigation() {
        document.querySelectorAll('.sidebar__nav-item[data-section]').forEach(btn => {
            btn.addEventListener('click', () => {
                const target = btn.dataset.section;

                if (!Auth.isLoggedIn() && btn.hasAttribute('data-requires-auth')) return;

                // Switch active section
                document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
                document.getElementById(target)?.classList.add('active');

                // Switch active nav
                document.querySelectorAll('.sidebar__nav-item').forEach(n => n.classList.remove('active'));
                btn.classList.add('active');

                closeSidebar();

                // Refresh data when switching to views
<<<<<<< HEAD
                if (target === 'cartSection') Cart.render();
                if (target === 'summarySection') Summary.update();
                if (target === 'usersSection') UserManager.render();
                if (target === 'historySection') Transactions.renderHistory();
=======
                if (target === 'cartSection') { Cart.render(); CartManager.updateCartSelector(); }
                if (target === 'summarySection') Summary.update();
                if (target === 'usersSection') { UserManager.render(); UserManager.renderInvites(); }
                if (target === 'historySection') Transactions.renderHistory();
                if (target === 'cartsSection') CartManager.render();
>>>>>>> 08b288a (feat: implement initial ITPA PC inventory management application with data storage, user authentication, and multi-cart support.)
            });
        });

        // Selection mode toggle
        document.getElementById('selectionModeBtn')?.addEventListener('click', () => {
            Cart.toggleSelectionMode();
        });

        // Return all laptops button
        document.getElementById('returnAllBtn')?.addEventListener('click', handleReturnAll);
    }

    /* ---------- Devolver todas las laptops en uso ---------- */
    function handleReturnAll() {
        if (!confirm('¿Devolver TODAS las laptops en uso al estado "Almacenada"?')) return;

        const slots = DataStore.getAll();
        const slotsInUse = slots.filter(s => s.status === 'enuso');
        const updates = slotsInUse.map(s => ({
            shelf: s.shelf,
            index: s.slotIndex,
            fields: {
                status: 'almacenada',
                responsable: '',
                curso: '',
                hora: '',
                entregadoPor: '',
                ubicacion: 'Carro'
            }
        }));

        if (updates.length > 0) {
            DataStore.bulkUpdate(updates);

            // Log as a transaction
            const laptopIds = slotsInUse.map(s => s.laptopId).filter(Boolean);
            DataStore.addTransaction({
                laptopIds,
                tipoMovimiento: 'retorno',
                solicitante: '',
                retirante: '',
                observaciones: 'Devolución masiva de todas las laptops en uso.',
                usuario: Auth.getUser()
            });
        }

        Cart.render();
        Summary.update();
    }

    /* ---------- Service Worker ---------- */
    function registerSW() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(() => {
                // Silently fail in dev
            });
        }
    }

    /* ---------- Public API ---------- */
    return { init, closeSidebar, toggleSidebar };
})();

document.addEventListener('DOMContentLoaded', App.init);
