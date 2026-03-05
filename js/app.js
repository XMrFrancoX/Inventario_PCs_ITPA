/**
 * app.js — Inicialización y gestión global de la aplicación
 */
const App = (() => {

    async function init() {
        try {
            console.log('[App] Iniciando DataStore...');
            await DataStore.init();
            console.log('[App] DataStore OK');
        } catch (e) {
            console.error('[App] Error en DataStore.init:', e);
        }

        Summary.init();
        Modal.init();

        try {
            console.log('[App] Iniciando Auth...');
            await Auth.init();
            console.log('[App] Auth OK');
        } catch (e) {
            console.error('[App] Error en Auth.init:', e);
        }

        Bulk.init();
        UserManager.init();
        Transactions.init();
        CartManager.init();
        setupSidebar();
        setupNavigation();
        registerSW();

        // Render Lucide icons
        if (typeof lucide !== 'undefined') lucide.createIcons();

        const menuBtn = document.getElementById('menuBtn');
        if (menuBtn) {
            menuBtn.style.display = Auth.isLoggedIn() ? '' : 'none';
        }
        console.log('[App] Inicialización completa.');
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
            btn.addEventListener('click', async () => {
                const target = btn.dataset.section;

                if (!Auth.isLoggedIn() && btn.hasAttribute('data-requires-auth')) return;

                document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
                document.getElementById(target)?.classList.add('active');

                document.querySelectorAll('.sidebar__nav-item').forEach(n => n.classList.remove('active'));
                btn.classList.add('active');

                closeSidebar();

                if (target === 'cartSection') { await Cart.render(); await CartManager.updateCartSelector(); }
                if (target === 'summarySection') await Summary.update();
                if (target === 'usersSection') { await UserManager.render(); }
                if (target === 'historySection') await Transactions.renderHistory();
                if (target === 'cartsSection') await CartManager.render();
            });
        });

        document.getElementById('selectionModeBtn')?.addEventListener('click', () => {
            Cart.toggleSelectionMode();
        });

        document.getElementById('returnAllBtn')?.addEventListener('click', handleReturnAll);
    }

    /* ---------- Devolver todas las laptops en uso ---------- */
    async function handleReturnAll() {
        if (!confirm('¿Devolver TODAS las laptops en uso al estado "Almacenada"?')) return;

        const slots = await DataStore.getAll();
        const slotsInUse = slots.filter(s => s.status === 'enuso');
        const updates = slotsInUse.map(s => ({
            shelf: s.shelf,
            slotIndex: s.slotIndex,
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
            await DataStore.bulkUpdate(updates);

            const laptopIds = slotsInUse.map(s => s.laptopId).filter(Boolean);
            await DataStore.addTransaction({
                tipo: 'retorno',
                equipos: laptopIds.join(', '),
                responsable: '',
                operador: Auth.getUser()?.fullName || ''
            });
        }

        await Cart.render();
        await Summary.update();
    }

    /* ---------- Service Worker ---------- */
    function registerSW() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(() => { });
        }
    }

    return { init, closeSidebar, toggleSidebar };
})();

document.addEventListener('DOMContentLoaded', App.init);
