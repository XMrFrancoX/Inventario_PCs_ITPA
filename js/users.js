/**
 * users.js — Panel de administración de usuarios (solo admins)
 */
const UserManager = (() => {

    function init() {
        // El botón de guardar edición se maneja dinámicamente
    }

    /** Renderizar la tabla de usuarios en la sección de gestión */
    function render() {
        const container = document.getElementById('usersTableBody');
        if (!container) return;

        const users = DataStore.getUsers();
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
            sel.addEventListener('change', e => {
                const username = sel.dataset.username;
                const newRole = e.target.value;
                const result = DataStore.updateUserRole(username, newRole, Auth.getUser());
                if (!result.success) {
                    alert(result.error);
                    render(); // revert
                }
            });
        });
    }

    /** Abrir modal de edición de usuario */
    function editUser(username) {
        const users = DataStore.getUsers();
        const user = users.find(u => u.username === username);
        if (!user) return;

        const modal = document.getElementById('editUserModal');
        document.getElementById('editUserOriginal').value = username;
        document.getElementById('editUserName').value = user.username;
        document.getElementById('editUserFullName').value = user.fullName;
        document.getElementById('editUserPass').value = '';
        document.getElementById('editUserError').textContent = '';
        document.getElementById('editUserSuccess').textContent = '';

        modal.classList.add('visible');
    }

    function saveUserEdit() {
        const original = document.getElementById('editUserOriginal').value;
        const newUsername = document.getElementById('editUserName').value.trim();
        const newFullName = document.getElementById('editUserFullName').value.trim();
        const newPass = document.getElementById('editUserPass').value;
        const errorEl = document.getElementById('editUserError');
        const successEl = document.getElementById('editUserSuccess');

        errorEl.textContent = '';
        successEl.textContent = '';

        const fields = {};
        if (newUsername) fields.username = newUsername;
        if (newFullName) fields.fullName = newFullName;
        if (newPass) fields.password = newPass;

        const result = DataStore.updateUser(original, fields, Auth.getUser());
        if (result.success) {
            successEl.textContent = '✅ Usuario actualizado correctamente.';
            Auth.refreshSession();
            render();
            // Update header badge if editing self
            const current = Auth.getUser();
            if (current) {
                const nameSpan = document.getElementById('userName');
                if (nameSpan) {
                    const roleLabel = DataStore.ROLES[current.role]?.label || current.role;
                    nameSpan.textContent = `${current.fullName} (${roleLabel})`;
                }
            }
            setTimeout(() => {
                document.getElementById('editUserModal').classList.remove('visible');
            }, 1500);
        } else {
            errorEl.textContent = result.error;
        }
    }

    function closeEditModal() {
        document.getElementById('editUserModal').classList.remove('visible');
    }

    function deleteUser(username) {
        if (!confirm(`¿Eliminar al usuario "${username}"? Esta acción no se puede deshacer.`)) return;
        const result = DataStore.deleteUser(username, Auth.getUser());
        if (result.success) {
            render();
        } else {
            alert(result.error);
        }
    }

<<<<<<< HEAD
    function esc(val) { return (val || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }

    return { init, render, editUser, saveUserEdit, closeEditModal, deleteUser };
=======
    /* =================== INVITACIONES =================== */

    /** Renderizar la tabla de invitaciones activas */
    function renderInvites() {
        const container = document.getElementById('invitesTableBody');
        if (!container) return;

        const invites = DataStore.getInvites();
        const activeInvites = invites.filter(i => !i.used);

        if (activeInvites.length === 0) {
            container.innerHTML = `
                <tr><td colspan="4" style="text-align:center; color:var(--text-muted); padding:24px; font-size:.85rem;">
                    No hay invitaciones activas.
                </td></tr>
            `;
            return;
        }

        container.innerHTML = activeInvites.map(invite => {
            const roleLabel = DataStore.ROLES[invite.role]?.label || invite.role;
            const dateStr = new Date(invite.createdAt).toLocaleDateString('es-AR');
            const link = `${window.location.origin}${window.location.pathname}?invite=${invite.token}`;

            return `
                <tr class="users-table__row">
                    <td class="users-table__cell">
                        <span class="status-badge status-badge--${invite.role === 'admin' ? 'staff' : invite.role === 'editor' ? 'enuso' : 'almacenada'}">${esc(roleLabel)}</span>
                    </td>
                    <td class="users-table__cell">
                        <div class="invite-link-cell">
                            <input class="form-input invite-link-input" value="${esc(link)}" readonly style="font-size:.72rem;padding:6px 8px;">
                            <button class="btn btn--secondary btn--sm" onclick="UserManager.copyInviteLink('${esc(invite.token)}')" title="Copiar">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                                </svg>
                            </button>
                        </div>
                    </td>
                    <td class="users-table__cell" style="font-size:.75rem;color:var(--text-muted);">
                        ${dateStr}
                    </td>
                    <td class="users-table__cell">
                        <button class="btn btn--danger btn--sm" onclick="UserManager.handleDeleteInvite('${esc(invite.token)}')" title="Eliminar">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                            </svg>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    /** Generar una nueva invitación */
    function handleGenerateInvite() {
        const roleSelect = document.getElementById('inviteRoleSelect');
        const msgEl = document.getElementById('inviteMsg');

        if (!roleSelect) return;
        const role = roleSelect.value;

        const result = DataStore.createInvite(role, Auth.getUser());
        if (result.success) {
            const link = `${window.location.origin}${window.location.pathname}?invite=${result.invite.token}`;
            msgEl.textContent = '✅ Invitación creada. Copie el link de la tabla.';
            msgEl.style.color = 'var(--status-green)';
            renderInvites();
        } else {
            msgEl.textContent = `⚠️ ${result.error}`;
            msgEl.style.color = 'var(--status-yellow)';
        }
    }

    /** Eliminar una invitación */
    function handleDeleteInvite(token) {
        if (!confirm('¿Eliminar esta invitación? El link dejará de funcionar.')) return;
        const result = DataStore.deleteInvite(token, Auth.getUser());
        if (result.success) {
            renderInvites();
        } else {
            alert(result.error);
        }
    }

    /** Copiar link al portapapeles */
    function copyInviteLink(token) {
        const link = `${window.location.origin}${window.location.pathname}?invite=${token}`;
        navigator.clipboard.writeText(link).then(() => {
            const msgEl = document.getElementById('inviteMsg');
            if (msgEl) {
                msgEl.textContent = '📋 Link copiado al portapapeles.';
                msgEl.style.color = 'var(--accent)';
                setTimeout(() => { msgEl.textContent = ''; }, 2000);
            }
        }).catch(() => {
            // Fallback
            prompt('Copie este link:', link);
        });
    }

    function esc(val) { return (val || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }

    return { init, render, renderInvites, editUser, saveUserEdit, closeEditModal, deleteUser, handleGenerateInvite, handleDeleteInvite, copyInviteLink };
>>>>>>> 08b288a (feat: implement initial ITPA PC inventory management application with data storage, user authentication, and multi-cart support.)
})();
