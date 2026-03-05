/**
 * transactions.js — Módulo de Transacciones / Movimiento de Equipo
 *
 * Reemplaza la entrega masiva con un formulario completo de movimiento
 * que registra: tipo, solicitante, retirante, timestamp automático,
 * y usuario activo (auditoría).
 */
const Transactions = (() => {

    const MOVEMENT_TYPES = {
        clase: { label: 'Clase (En uso)', status: 'enuso', color: 'var(--status-red)' },
        staff: { label: 'Staff', status: 'staff', color: 'var(--status-blue)' },
        excepcion: { label: 'Excepción', status: 'excepcion', color: 'var(--status-yellow)' },
        retorno: { label: 'Retorno al Carro', status: 'almacenada', color: 'var(--status-green)' }
    };

    function init() {
        // Mass delivery button opens the transaction modal
        document.getElementById('massDeliverBtn')?.addEventListener('click', openTransactionModal);
        document.getElementById('massCancelBtn')?.addEventListener('click', () => Cart.toggleSelectionMode());

        // Close modal
        document.getElementById('txnModalClose')?.addEventListener('click', closeModal);
        document.getElementById('massDeliveryModal')?.addEventListener('click', e => {
            if (e.target.id === 'massDeliveryModal') closeModal();
        });

        // Form submit
        document.getElementById('txnForm')?.addEventListener('submit', e => {
            e.preventDefault();
            handleMovement();
        });

        // Toggle destino fields visibility based on movement type
        document.getElementById('txnTipo')?.addEventListener('change', e => {
            const tipo = e.target.value;
            const detalleGroup = document.getElementById('txnDetalleGroup');
            const cursoGroup = document.getElementById('txnCursoGroup');
            const solicitanteGroup = document.getElementById('txnSolicitanteGroup');
            const retiranteGroup = document.getElementById('txnRetiranteGroup');

            if (tipo === 'retorno') {
                // Al devolver, los campos de responsable no son obligatorios
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

    function openTransactionModal() {
        const selected = Cart.getSelectedSlots();
        if (selected.length === 0) return;

        const slots = selected.map(s => DataStore.getSlot(s.shelf, s.index)).filter(Boolean);

        // Update count
        document.getElementById('txnCount').textContent = selected.length;

        // List selected IDs
        const listEl = document.getElementById('txnSelectedList');
        listEl.innerHTML = slots.map(s => `
            <span class="status-badge status-badge--${s.status}">${s.laptopId || `R${s.slotIndex + 1}`}</span>
        `).join(' ');

        // Auto-fill timestamp
        const now = new Date();
        const timestampEl = document.getElementById('txnTimestamp');
        timestampEl.value = now.toLocaleString('es-AR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });

        // Auto-fill active user
        const user = Auth.getUser();
        document.getElementById('txnUsuarioActivo').value = user ? `${user.fullName} (@${user.username})` : '';

        // Reset form fields
        document.getElementById('txnTipo').value = 'clase';
        document.getElementById('txnTipo').dispatchEvent(new Event('change'));
        document.getElementById('txnSolicitante').value = '';
        document.getElementById('txnRetirante').value = '';
        document.getElementById('txnCurso').value = '';
        document.getElementById('txnDestino').value = '';
        document.getElementById('txnObservaciones').value = '';
        document.getElementById('txnError').textContent = '';

        // Show modal
        document.getElementById('massDeliveryModal').classList.add('visible');
    }

    function closeModal() {
        document.getElementById('massDeliveryModal').classList.remove('visible');
    }

    function handleMovement() {
        const tipo = document.getElementById('txnTipo').value;
        const solicitante = document.getElementById('txnSolicitante').value.trim();
        const retirante = document.getElementById('txnRetirante').value.trim();
        const curso = document.getElementById('txnCurso').value.trim();
        const destino = document.getElementById('txnDestino').value.trim();
        const observaciones = document.getElementById('txnObservaciones').value.trim();
        const errorEl = document.getElementById('txnError');
        const user = Auth.getUser();

        errorEl.textContent = '';

        // Validations
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

        // Build slot updates
        const movInfo = MOVEMENT_TYPES[tipo];
        const now = new Date();
        const horaStr = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

        const updates = selected.map(s => ({
            shelf: s.shelf,
            index: s.index,
            fields: {
                status: movInfo.status,
                responsable: tipo === 'retorno' ? '' : solicitante,
                curso: tipo === 'retorno' ? '' : curso,
                hora: tipo === 'retorno' ? '' : horaStr,
                entregadoPor: user ? user.fullName : '',
                ubicacion: tipo === 'retorno' ? 'Carro' : destino
            }
        }));

        // Apply bulk update
        DataStore.bulkUpdate(updates);

        // Get laptop IDs for the transaction record
        const laptopIds = selected.map(s => {
            const slot = DataStore.getSlot(s.shelf, s.index);
            return slot ? slot.laptopId : `R${s.index + 1}`;
        });

        // Log transaction
        DataStore.addTransaction({
            laptopIds,
            tipoMovimiento: tipo,
            solicitante,
            retirante,
            curso,
            destino,
            observaciones,
            usuario: user
        });

        // Close & refresh
        closeModal();
        Cart.toggleSelectionMode();
        Cart.render();
        Summary.update();
    }

    /* --------- Historial --------- */
    function renderHistory() {
        const container = document.getElementById('txnHistoryBody');
        if (!container) return;

        const transactions = DataStore.getTransactions();

        if (transactions.length === 0) {
            container.innerHTML = `
                <tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:40px; font-size:.88rem;">
                    No hay movimientos registrados aún.
                </td></tr>
            `;
            return;
        }

        container.innerHTML = transactions.map(txn => {
            const date = new Date(txn.timestamp);
            const dateStr = date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' });
            const timeStr = date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
            const movType = MOVEMENT_TYPES[txn.tipoMovimiento];
            const badgeClass = txn.tipoMovimiento === 'retorno' ? 'almacenada'
                : txn.tipoMovimiento === 'clase' ? 'enuso'
                    : txn.tipoMovimiento === 'staff' ? 'staff'
                        : 'excepcion';

            const ids = txn.laptopIds.map(id =>
                `<span class="status-badge status-badge--${badgeClass}" style="font-size:.6rem;">${id}</span>`
            ).join(' ');

            return `
                <tr class="users-table__row">
                    <td class="users-table__cell" style="white-space:nowrap;">
                        <div style="font-weight:600; font-size:.82rem;">${dateStr}</div>
                        <div style="font-size:.7rem; color:var(--text-muted);">${timeStr}</div>
                    </td>
                    <td class="users-table__cell">
                        <span class="status-badge status-badge--${badgeClass}">${movType ? movType.label : txn.tipoMovimiento}</span>
                    </td>
                    <td class="users-table__cell">
                        <div style="display:flex; flex-wrap:wrap; gap:4px;">${ids}</div>
                    </td>
                    <td class="users-table__cell">
                        ${txn.solicitante ? `<div style="font-size:.82rem;"><strong>Solicita:</strong> ${esc(txn.solicitante)}</div>` : ''}
                        ${txn.retirante ? `<div style="font-size:.78rem; color:var(--text-secondary);">Retira: ${esc(txn.retirante)}</div>` : ''}
                        ${txn.curso ? `<div style="font-size:.78rem; color:var(--text-secondary);">Curso: ${esc(txn.curso)}</div>` : ''}
                    </td>
                    <td class="users-table__cell" style="font-size:.78rem; color:var(--text-secondary);">
                        ${txn.usuario ? esc(txn.usuario.fullName) : '—'}
                    </td>
                </tr>
            `;
        }).join('');
    }

    function esc(val) { return (val || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }

    return { init, openTransactionModal, closeModal, renderHistory };
})();
