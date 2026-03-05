/**
 * carts.js — Gestión de carros de laptops (crear, eliminar, seleccionar)
 */
const CartManager = (() => {

    function init() {
        // Cart selector change
        document.getElementById('cartSelector')?.addEventListener('change', async e => {
            DataStore.setActiveCart(e.target.value);
            await Cart.render();
            await Summary.update();
            await updateCartSelector();
        });

        // Create cart form
        document.getElementById('createCartForm')?.addEventListener('submit', e => {
            e.preventDefault();
            handleCreate();
        });

        // Edit cart modal
        document.getElementById('editCartModalClose')?.addEventListener('click', closeEditModal);
        document.getElementById('editCartModal')?.addEventListener('click', e => {
            if (e.target.id === 'editCartModal') closeEditModal();
        });
    }

    /** Renderizar la tabla de gestión de carros */
    async function render() {
        const container = document.getElementById('cartsTableBody');
        if (!container) return;

        const carts = await DataStore.getCarts();
        const activeCartId = DataStore.getActiveCart();

        container.innerHTML = carts.map(cart => {
            const isActive = activeCartId === cart.id;
            const dateStr = cart.createdAt ? new Date(cart.createdAt).toLocaleDateString('es-AR') : '—';

            return `
                <tr class="users-table__row">
                    <td class="users-table__cell">
                        <div style="display:flex;align-items:center;gap:8px;">
                            <strong>${esc(cart.name)}</strong>
                            ${isActive ? '<span class="status-badge status-badge--almacenada" style="font-size:.65rem;">ACTIVO</span>' : ''}
                        </div>
                        ${cart.macAddress ? `<div style="font-size:.75rem; color:var(--text-muted); margin-top:4px; font-family:monospace;">${esc(cart.macAddress)}</div>` : ''}
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
                            <button class="btn btn--secondary btn--sm" onclick="CartManager.openEditModal('${esc(cart.id)}')" title="Editar Carro">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                            </button>
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
    async function handleCreate() {
        const name = document.getElementById('newCartName').value.trim();
        const shelves = parseInt(document.getElementById('newCartShelves').value) || 2;
        const slots = parseInt(document.getElementById('newCartSlots').value) || 20;
        const msgEl = document.getElementById('createCartMsg');

        msgEl.textContent = 'Creando carro...';
        msgEl.style.color = 'var(--text-muted)';

        const result = await DataStore.createCart(name, shelves, slots, Auth.getUser());
        if (result.success) {
            msgEl.textContent = `Carro "${name}" creado correctamente.`;
            msgEl.style.color = 'var(--status-green)';
            document.getElementById('newCartName').value = '';
            await render();
            await updateCartSelector();
        } else {
            msgEl.textContent = `${result.error}`;
            msgEl.style.color = 'var(--status-yellow)';
        }
    }

    /** Eliminar un carro */
    async function handleDelete(cartId) {
        const carts = await DataStore.getCarts();
        const cart = carts.find(c => c.id === cartId);
        if (!cart) return;

        if (!confirm(`¿Eliminar el carro "${cart.name}"? Se perderán todos los datos de inventario de este carro. Esta acción no se puede deshacer.`)) return;

        const result = await DataStore.deleteCart(cartId, Auth.getUser());
        if (result.success) {
            await render();
            await updateCartSelector();
            await Cart.render();
            await Summary.update();
        } else {
            alert(result.error);
        }
    }

    /** Activar un carro */
    async function activate(cartId) {
        DataStore.setActiveCart(cartId);
        await Cart.render();
        await Summary.update();
        await render();
        await updateCartSelector();
    }

    /** Actualizar el selector de carro en el cartSection */
    async function updateCartSelector() {
        const selector = document.getElementById('cartSelector');
        if (!selector) return;

        const carts = await DataStore.getCarts();
        const activeCartId = DataStore.getActiveCart();

        selector.innerHTML = carts.map(c =>
            `<option value="${esc(c.id)}" ${activeCartId === c.id ? 'selected' : ''}>${esc(c.name)}</option>`
        ).join('');

        // Ocultar selector si solo hay un carro
        const wrapper = document.getElementById('cartSelectorWrapper');
        if (wrapper) {
            wrapper.style.display = carts.length > 1 ? '' : 'none';
        }
    }

    /** Abrir modal de edición */
    async function openEditModal(cartId) {
        const carts = await DataStore.getCarts();
        const cart = carts.find(c => c.id === cartId);
        if (!cart) return;

        document.getElementById('editCartId').value = cart.id;
        document.getElementById('editCartName').value = cart.name;
        document.getElementById('editCartMac').value = cart.macAddress || '';
        document.getElementById('editCartError').textContent = '';

        document.getElementById('editCartModal').classList.add('visible');
    }

    function closeEditModal() {
        document.getElementById('editCartModal').classList.remove('visible');
        document.getElementById('editCartId').value = '';
        document.getElementById('editCartError').textContent = '';
    }

    /** Guardar edición de carro */
    async function saveEdit() {
        const cartId = document.getElementById('editCartId').value;
        const name = document.getElementById('editCartName').value.trim();
        const macAddress = document.getElementById('editCartMac').value.trim();
        const errorEl = document.getElementById('editCartError');

        if (!name) {
            errorEl.textContent = 'El nombre es obligatorio.';
            return;
        }

        errorEl.textContent = 'Guardando...';
        errorEl.style.color = 'var(--text-muted)';

        const result = await DataStore.updateCart(cartId, name, macAddress, Auth.getUser());
        if (result.success) {
            closeEditModal();
            await render();
            await updateCartSelector();

            // If the edited cart was the active cart, we might want to re-render the cart title
            if (cartId === DataStore.getActiveCart()) {
                await Cart.render();
            }
        } else {
            errorEl.textContent = result.error;
            errorEl.style.color = 'var(--status-yellow)';
        }
    }

    function esc(val) { return (val || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }

    return { init, render, handleCreate, handleDelete, activate, updateCartSelector, openEditModal, closeEditModal, saveEdit };
})();
