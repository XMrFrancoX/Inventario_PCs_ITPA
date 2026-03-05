/**
 * transactions.js — Módulo de Transacciones / Movimiento de Equipo
 */
const Transactions = (() => {

    const MOVEMENT_TYPES = {
        clase: { label: 'Clase (En uso)', status: 'enuso', color: 'var(--status-red)' },
        staff: { label: 'Staff', status: 'staff', color: 'var(--status-blue)' },
        excepcion: { label: 'Excepción', status: 'excepcion', color: 'var(--status-yellow)' },
        retorno: { label: 'Retorno al Carro', status: 'almacenada', color: 'var(--status-green)' }
    };

    function init() {
        document.getElementById('massDeliverBtn')?.addEventListener('click', openTransactionModal);
        document.getElementById('massCancelBtn')?.addEventListener('click', () => Cart.toggleSelectionMode());

        document.getElementById('txnModalClose')?.addEventListener('click', closeModal);
        document.getElementById('massDeliveryModal')?.addEventListener('click', e => {
            if (e.target.id === 'massDeliveryModal') closeModal();
        });

        document.getElementById('txnForm')?.addEventListener('submit', e => {
            e.preventDefault();
            handleMovement();
        });

        document.getElementById('txnTipo')?.addEventListener('change', e => {
            const tipo = e.target.value;
            const detalleGroup = document.getElementById('txnDetalleGroup');
            const cursoGroup = document.getElementById('txnCursoGroup');
            const solicitanteGroup = document.getElementById('txnSolicitanteGroup');
            const retiranteGroup = document.getElementById('txnRetiranteGroup');

            if (tipo === 'retorno') {
                detalleGroup.style.display = 'none';
                cursoGroup.style.display = 'none';
                solicitanteGroup.style.display = 'none';
                retiranteGroup.style.display = 'none';
            } else {
                detalleGroup.style.display = '';
                cursoGroup.style.display = tipo === 'clase' ? '' : 'none';
                solicitanteGroup.style.display = '';
                retiranteGroup.style.display = '';
            }
        });
    }

    async function openTransactionModal() {
        const selected = Cart.getSelectedSlots();
        if (selected.length === 0) return;

        // Fetch slot data for selected slots
        const slotPromises = selected.map(s => DataStore.getSlot(s.shelf, s.index));
        const slots = (await Promise.all(slotPromises)).filter(Boolean);

        document.getElementById('txnCount').textContent = selected.length;

        const listEl = document.getElementById('txnSelectedList');
        listEl.innerHTML = slots.map(s => `
            <span class="status-badge status-badge--${s.status}">${s.laptopId || `R${s.slotIndex}`}</span>
        `).join(' ');

        const now = new Date();
        const timestampEl = document.getElementById('txnTimestamp');
        timestampEl.value = now.toLocaleString('es-AR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });

        const user = Auth.getUser();
        document.getElementById('txnUsuarioActivo').value = user ? `${user.fullName} (@${user.username})` : '';

        document.getElementById('txnTipo').value = 'clase';
        document.getElementById('txnTipo').dispatchEvent(new Event('change'));
        document.getElementById('txnSolicitante').value = '';
        document.getElementById('txnRetirante').value = '';
        document.getElementById('txnCurso').value = '';
        document.getElementById('txnDestino').value = '';
        document.getElementById('txnObservaciones').value = '';
        document.getElementById('txnError').textContent = '';

        document.getElementById('massDeliveryModal').classList.add('visible');
    }

    function closeModal() {
        document.getElementById('massDeliveryModal').classList.remove('visible');
    }

    async function handleMovement() {
        const tipo = document.getElementById('txnTipo').value;
        const solicitante = document.getElementById('txnSolicitante').value.trim();
        const retirante = document.getElementById('txnRetirante').value.trim();
        const curso = document.getElementById('txnCurso').value.trim();
        const destino = document.getElementById('txnDestino').value.trim();
        const observaciones = document.getElementById('txnObservaciones').value.trim();
        const errorEl = document.getElementById('txnError');
        const user = Auth.getUser();

        errorEl.textContent = '';

        if (tipo !== 'retorno') {
            if (!solicitante) {
                errorEl.textContent = 'Ingrese quién solicita el equipo (Docente/Jefe).';
                return;
            }
        }

        const selected = Cart.getSelectedSlots();
        if (selected.length === 0) {
            errorEl.textContent = 'No hay laptops seleccionadas.';
            return;
        }

        const movInfo = MOVEMENT_TYPES[tipo];
        const now = new Date();
        const horaStr = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

        const updates = selected.map(s => ({
            shelf: s.shelf,
            slotIndex: s.index,
            fields: {
                status: movInfo.status,
                responsable: tipo === 'retorno' ? '' : solicitante,
                curso: tipo === 'retorno' ? '' : curso,
                hora: tipo === 'retorno' ? '' : horaStr,
                entregadoPor: user ? user.fullName : '',
                ubicacion: tipo === 'retorno' ? 'Carro' : destino
            }
        }));

        errorEl.textContent = 'Procesando...';
        await DataStore.bulkUpdate(updates);

        // Get laptop IDs for the transaction record
        const slotPromises = selected.map(s => DataStore.getSlot(s.shelf, s.index));
        const slotsAfter = (await Promise.all(slotPromises)).filter(Boolean);
        const laptopIds = slotsAfter.map(s => s.laptopId || `R${s.slotIndex}`);

        await DataStore.addTransaction({
            tipo: tipo,
            equipos: laptopIds.join(', '),
            responsable: solicitante || '',
            operador: user ? user.fullName : '',
            curso: curso || '',
            destino: destino || '',
            retirante: retirante || '',
            observaciones: observaciones || ''
        });

        closeModal();
        Cart.toggleSelectionMode();
        await Cart.render();
        await Summary.update();
    }

    /* --------- Historial --------- */
    async function renderHistory() {
        const container = document.getElementById('txnHistoryBody');
        if (!container) return;

        // Show loading state
        container.innerHTML = `
            <tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding:40px; font-size:.88rem;">
                Cargando movimientos...
            </td></tr>
        `;

        let transactions;
        try {
            transactions = await DataStore.getTransactions();
        } catch (err) {
            console.error('renderHistory error:', err);
            container.innerHTML = `
                <tr><td colspan="5" style="text-align:center; color:var(--status-red); padding:40px; font-size:.88rem;">
                    Error al cargar el historial. Verifique la conexión.
                </td></tr>
            `;
            return;
        }

        if (!transactions || transactions.length === 0) {
            container.innerHTML = `
                <tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding:40px; font-size:.88rem;">
                    No hay movimientos registrados aún.
                </td></tr>
            `;
            return;
        }

        const user = Auth.getUser();
        const isAdmin = user && DataStore.hasPermission(user, 'admin');

        container.innerHTML = transactions.map(txn => {
            const date = new Date(txn.fecha);
            const dateStr = date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' });
            const timeStr = date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
            const movType = MOVEMENT_TYPES[txn.tipo];
            const badgeClass = txn.tipo === 'retorno' ? 'almacenada'
                : txn.tipo === 'clase' ? 'enuso'
                    : txn.tipo === 'staff' ? 'staff'
                        : 'excepcion';

            const ids = (txn.equipos || '').split(', ').filter(Boolean).map(id =>
                `<span class="status-badge status-badge--${badgeClass}" style="font-size:.6rem;">${id}</span>`
            ).join(' ');

            // Build detail lines
            let detailHtml = '';
            if (txn.responsable) detailHtml += `<div style="font-size:.82rem;"><strong>Solicita:</strong> ${esc(txn.responsable)}</div>`;
            if (txn.retirante) detailHtml += `<div style="font-size:.78rem; color:var(--text-secondary);"><strong>Retira:</strong> ${esc(txn.retirante)}</div>`;
            if (txn.curso) detailHtml += `<div style="font-size:.78rem; color:var(--text-secondary);"><strong>Curso:</strong> ${esc(txn.curso)}</div>`;
            if (txn.destino) detailHtml += `<div style="font-size:.78rem; color:var(--text-secondary);"><strong>Destino:</strong> ${esc(txn.destino)}</div>`;
            if (txn.observaciones) detailHtml += `<div style="font-size:.75rem; color:var(--text-muted); font-style:italic; margin-top:2px;">${esc(txn.observaciones)}</div>`;

            const deleteBtn = isAdmin ? `
                <button class="btn btn--danger btn--sm txn-delete-btn" data-txn-id="${txn.id}" 
                    style="padding:4px 8px; font-size:.7rem; margin-left:8px;" title="Eliminar registro">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                </button>
            ` : '';

            return `
                <tr class="users-table__row">
                    <td class="users-table__cell" style="white-space:nowrap;">
                        <div style="font-weight:600; font-size:.82rem;">${dateStr}</div>
                        <div style="font-size:.7rem; color:var(--text-muted);">${timeStr}</div>
                    </td>
                    <td class="users-table__cell">
                        <span class="status-badge status-badge--${badgeClass}">${movType ? movType.label : txn.tipo}</span>
                    </td>
                    <td class="users-table__cell">
                        <div style="display:flex; flex-wrap:wrap; gap:4px;">${ids}</div>
                    </td>
                    <td class="users-table__cell">
                        ${detailHtml || '<span style="color:var(--text-muted);">—</span>'}
                    </td>
                    <td class="users-table__cell" style="font-size:.78rem; color:var(--text-secondary);">
                        ${txn.operador ? esc(txn.operador) : '—'}${deleteBtn}
                    </td>
                </tr>
            `;
        }).join('');

        // Attach delete handlers
        container.querySelectorAll('.txn-delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const txnId = btn.dataset.txnId;
                if (!confirm('¿Eliminar este registro del historial?')) return;
                btn.disabled = true;
                btn.textContent = '...';
                const ok = await DataStore.deleteTransaction(txnId);
                if (ok) {
                    await renderHistory();
                } else {
                    btn.disabled = false;
                    btn.textContent = '✕';
                    alert('Error al eliminar el registro.');
                }
            });
        });
    }

    function esc(val) { return (val || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }

    return { init, openTransactionModal, closeModal, renderHistory };
})();
