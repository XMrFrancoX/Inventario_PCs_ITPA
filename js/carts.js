/**
 * carts.js — Gestión de carros de laptops (crear, eliminar, seleccionar)
 */
const CartManager = (() => {

    function init() {
        // Cart selector change
        document.getElementById('cartSelector')?.addEventListener('change', e => {
            DataStore.setActiveCart(e.target.value);
            Cart.render();
            Summary.update();
            updateCartSelector();
        });

        // Create cart form
        document.getElementById('createCartForm')?.addEventListener('submit', e => {
            e.preventDefault();
            handleCreate();
        });
    }

    /** Renderizar la tabla de gestión de carros */
    function render() {
        const container = document.getElementById('cartsTableBody');
        if (!container) return;

        const carts = DataStore.getCarts();
        const activeCart = DataStore.getActiveCart();

        container.innerHTML = carts.map(cart => {
            const isActive = activeCart && activeCart.id === cart.id;
            const shelvesInfo = cart.shelves.map(s => DataStore.getShelfLabel(s)).join(', ');
            const dateStr = cart.createdAt ? new Date(cart.createdAt).toLocaleDateString('es-AR') : '—';

            return `
                <tr class="users-table__row">
                    <td class="users-table__cell">
                        <div style="display:flex;align-items:center;gap:8px;">
                            <strong>${esc(cart.name)}</strong>
                            ${isActive ? '<span class="status-badge status-badge--almacenada" style="font-size:.65rem;">ACTIVO</span>' : ''}
                        </div>
                    </td>
                    <td class="users-table__cell" style="font-size:.82rem;">
                        ${cart.shelves.length} estante(s) × ${cart.slotsPerShelf} ranuras
                    </td>
                    <td class="users-table__cell" style="font-size:.75rem;color:var(--text-muted);">
                        ${dateStr}
                    </td>
                    <td class="users-table__cell">
                        <div style="display:flex;gap:6px;">
                            ${!isActive ? `
                                <button class="btn btn--primary btn--sm" onclick="CartManager.activate('${esc(cart.id)}')" title="Activar">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="20 6 9 17 4 12"/>
                                    </svg>
                                </button>
                            ` : ''}
                            ${carts.length > 1 ? `
                                <button class="btn btn--danger btn--sm" onclick="CartManager.handleDelete('${esc(cart.id)}')" title="Eliminar">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                        <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                                    </svg>
                                </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    /** Crear un nuevo carro */
    function handleCreate() {
        const name = document.getElementById('newCartName').value.trim();
        const shelves = parseInt(document.getElementById('newCartShelves').value) || 2;
        const slots = parseInt(document.getElementById('newCartSlots').value) || 20;
        const msgEl = document.getElementById('createCartMsg');

        msgEl.textContent = '';
        msgEl.style.color = '';

        const result = DataStore.createCart(name, shelves, slots, Auth.getUser());
        if (result.success) {
            msgEl.textContent = `Carro "${name}" creado correctamente.`;
            msgEl.style.color = 'var(--status-green)';
            document.getElementById('newCartName').value = '';
            render();
            updateCartSelector();
        } else {
            msgEl.textContent = `${result.error}`;
            msgEl.style.color = 'var(--status-yellow)';
        }
    }

    /** Eliminar un carro */
    function handleDelete(cartId) {
        const carts = DataStore.getCarts();
        const cart = carts.find(c => c.id === cartId);
        if (!cart) return;

        if (!confirm(`¿Eliminar el carro "${cart.name}"? Se perderán todos los datos de inventario de este carro. Esta acción no se puede deshacer.`)) return;

        const result = DataStore.deleteCart(cartId, Auth.getUser());
        if (result.success) {
            render();
            updateCartSelector();
            Cart.render();
            Summary.update();
        } else {
            alert(result.error);
        }
    }

    /** Activar un carro */
    function activate(cartId) {
        DataStore.setActiveCart(cartId);
        Cart.render();
        Summary.update();
        render();
        updateCartSelector();
    }

    /** Actualizar el selector de carro en el cartSection */
    function updateCartSelector() {
        const selector = document.getElementById('cartSelector');
        if (!selector) return;

        const carts = DataStore.getCarts();
        const activeCart = DataStore.getActiveCart();

        selector.innerHTML = carts.map(c =>
            `<option value="${esc(c.id)}" ${activeCart && activeCart.id === c.id ? 'selected' : ''}>${esc(c.name)}</option>`
        ).join('');

        // Ocultar selector si solo hay un carro
        const wrapper = document.getElementById('cartSelectorWrapper');
        if (wrapper) {
            wrapper.style.display = carts.length > 1 ? '' : 'none';
        }
    }

    function esc(val) { return (val || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }

    return { init, render, handleCreate, handleDelete, activate, updateCartSelector };
})();
