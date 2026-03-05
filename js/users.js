/**
 * users.js — Panel de administración de usuarios (solo admins)
 */
const UserManager = (() => {

    function init() {
        // No setup needed
    }

    /** Renderizar la tabla de usuarios en la sección de gestión */
    async function render() {
        const container = document.getElementById('usersTableBody');
        if (!container) return;

        const users = await DataStore.getUsers();
        const current = Auth.getUser();

        container.innerHTML = users.map(user => {
            const roleOptions = Object.entries(DataStore.ROLES).map(([key, val]) =>
                `<option value="${key}" ${user.role === key ? 'selected' : ''}>${val.label}</option>`
            ).join('');

            const isSelf = current.username === user.username;
            const masterBadge = user.isMaster ? '<span class="status-badge status-badge--staff" style="font-size:.65rem;">MAESTRA</span>' : '';

            return `
                <tr class="users-table__row">
                    <td class="users-table__cell">
                        <div style="display:flex;align-items:center;gap:8px;">
                            <strong>${esc(user.fullName)}</strong>
                            ${masterBadge}
                            ${isSelf ? '<span class="status-badge status-badge--almacenada" style="font-size:.65rem;">TÚ</span>' : ''}
                        </div>
                        <div style="font-size:.75rem;color:var(--text-muted);margin-top:2px;">@${esc(user.username)}</div>
                    </td>
                    <td class="users-table__cell">
                        <select class="form-select" style="padding:6px 10px;font-size:.82rem;"
                                data-username="${esc(user.username)}"
                                id="roleSelect_${esc(user.username)}"
                                ${user.isMaster ? 'disabled title="La cuenta maestra siempre es administrador."' : ''}>
                            ${roleOptions}
                        </select>
                    </td>
                    <td class="users-table__cell" style="font-size:.75rem;color:var(--text-muted);">
                        ${user.createdAt ? new Date(user.createdAt).toLocaleDateString('es-AR') : '—'}
                    </td>
                    <td class="users-table__cell">
                        <div style="display:flex;gap:6px;">
                            <button class="btn btn--secondary btn--sm" onclick="UserManager.editUser('${esc(user.username)}')" title="Editar">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                </svg>
                            </button>
                            ${!user.isMaster && !isSelf ? `
                                <button class="btn btn--danger btn--sm" onclick="UserManager.deleteUser('${esc(user.username)}')" title="Eliminar">
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

        // Attach role change listeners
        container.querySelectorAll('select[data-username]').forEach(sel => {
            sel.addEventListener('change', async e => {
                const username = sel.dataset.username;
                const newRole = e.target.value;
                const result = await DataStore.updateUserRole(username, newRole, Auth.getUser());
                if (!result.success) {
                    alert(result.error);
                    await render();
                }
            });
        });
    }

    /** Abrir modal de edición de usuario */
    function editUser(username) {
        // We need the user data but the edit modal was removed by the user.
        // If they add it back, this would work:
        alert('Modal de edición de usuario no disponible. Fue eliminado del HTML.');
    }

    async function saveUserEdit() {
        const original = document.getElementById('editUserOriginal')?.value;
        const newUsername = document.getElementById('editUserName')?.value.trim();
        const newFullName = document.getElementById('editUserFullName')?.value.trim();
        const newPass = document.getElementById('editUserPass')?.value;
        const errorEl = document.getElementById('editUserError');
        const successEl = document.getElementById('editUserSuccess');

        if (!errorEl || !successEl) return;
        errorEl.textContent = '';
        successEl.textContent = '';

        const fields = {};
        if (newUsername) fields.username = newUsername;
        if (newFullName) fields.fullName = newFullName;
        if (newPass) fields.password = newPass;

        const result = await DataStore.updateUser(original, fields, Auth.getUser());
        if (result.success) {
            successEl.textContent = 'Usuario actualizado correctamente.';
            await Auth.refreshSession();
            await render();
            const current = Auth.getUser();
            if (current) {
                const nameSpan = document.getElementById('userName');
                if (nameSpan) {
                    const roleLabel = DataStore.ROLES[current.role]?.label || current.role;
                    nameSpan.textContent = `${current.fullName} (${roleLabel})`;
                }
            }
        } else {
            errorEl.textContent = result.error;
        }
    }

    function closeEditModal() {
        document.getElementById('editUserModal')?.classList.remove('visible');
    }

    async function deleteUser(username) {
        if (!confirm(`¿Eliminar al usuario "${username}"? Esta acción no se puede deshacer.`)) return;
        const result = await DataStore.deleteUser(username, Auth.getUser());
        if (result.success) {
            await render();
        } else {
            alert(result.error);
        }
    }

    function esc(val) { return (val || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }

    return { init, render, editUser, saveUserEdit, closeEditModal, deleteUser };
})();
