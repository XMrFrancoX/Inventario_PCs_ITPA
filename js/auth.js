/**
 * auth.js — Sistema de login, registro, y gestión de sesión con roles
 */
const Auth = (() => {
    let currentUser = null;
    let pendingInviteToken = null;
    let pendingInviteRole = null;

    function init() {
        const saved = sessionStorage.getItem('itpa_session');
        if (saved) {
            currentUser = JSON.parse(saved);
            const fresh = DataStore.authenticate(currentUser.username, currentUser.password);
            if (fresh) {
                currentUser = fresh;
                onLoginSuccess();
            } else {
                sessionStorage.removeItem('itpa_session');
                currentUser = null;
            }
        }

        // Detectar token de invitación en la URL
        const params = new URLSearchParams(window.location.search);
        const inviteToken = params.get('invite');
        if (inviteToken && !currentUser) {
            const invites = DataStore.getInvites();
            const invite = invites.find(i => i.token === inviteToken && !i.used);
            if (invite) {
                pendingInviteToken = inviteToken;
                pendingInviteRole = invite.role;
                setTimeout(() => {
                    document.getElementById('loginCard').style.display = 'none';
                    document.getElementById('registerCard').style.display = '';
                    const roleLabel = DataStore.ROLES[invite.role]?.label || invite.role;
                    const infoEl = document.getElementById('registerInviteInfo');
                    if (infoEl) {
                        infoEl.textContent = `Invitación válida — Se le asignará el rol: ${roleLabel}`;
                        infoEl.style.display = '';
                    }
                }, 100);
            }
            window.history.replaceState({}, '', window.location.pathname);
        }

        setupListeners();
    }

    function setupListeners() {
        document.getElementById('loginForm')?.addEventListener('submit', e => {
            e.preventDefault();
            handleLogin();
        });

        document.getElementById('registerForm')?.addEventListener('submit', e => {
            e.preventDefault();
            handleRegister();
        });

        document.getElementById('showRegisterBtn')?.addEventListener('click', () => {
            document.getElementById('loginCard').style.display = 'none';
            document.getElementById('registerCard').style.display = '';
        });

        document.getElementById('showLoginBtn')?.addEventListener('click', () => {
            document.getElementById('registerCard').style.display = 'none';
            document.getElementById('loginCard').style.display = '';
        });

        document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
    }

    function handleLogin() {
        const username = document.getElementById('loginUser').value.trim();
        const password = document.getElementById('loginPass').value.trim();
        const errorEl = document.getElementById('loginError');

        if (!username || !password) {
            errorEl.textContent = 'Por favor, complete ambos campos.';
            return;
        }

        const user = DataStore.authenticate(username, password);
        if (user) {
            currentUser = user;
            sessionStorage.setItem('itpa_session', JSON.stringify(user));
            errorEl.textContent = '';
            onLoginSuccess();
        } else {
            errorEl.textContent = 'Usuario o contraseña incorrectos.';
            document.getElementById('loginPass').value = '';
        }
    }

    function handleRegister() {
        const username = document.getElementById('regUser').value.trim();
        const password = document.getElementById('regPass').value.trim();
        const passConfirm = document.getElementById('regPassConfirm').value.trim();
        const fullName = document.getElementById('regFullName').value.trim();
        const errorEl = document.getElementById('registerError');
        const successEl = document.getElementById('registerSuccess');

        errorEl.textContent = '';
        successEl.textContent = '';

        if (!username || !password || !passConfirm || !fullName) {
            errorEl.textContent = 'Por favor, complete todos los campos.';
            return;
        }
        if (password !== passConfirm) {
            errorEl.textContent = 'Las contraseñas no coinciden.';
            return;
        }

        // Si hay invitación pendiente, canjearla
        let assignedRole = null;
        if (pendingInviteToken) {
            assignedRole = DataStore.redeemInvite(pendingInviteToken);
            if (!assignedRole) {
                errorEl.textContent = 'La invitación ya fue usada o es inválida.';
                pendingInviteToken = null;
                pendingInviteRole = null;
                const infoEl = document.getElementById('registerInviteInfo');
                if (infoEl) infoEl.style.display = 'none';
                return;
            }
        }

        const result = DataStore.registerUser(username, password, fullName, assignedRole);
        if (result.success) {
            const roleLabel = DataStore.ROLES[result.user.role]?.label || result.user.role;
            successEl.textContent = `Cuenta creada exitosamente. Su rol es "${roleLabel}".${!assignedRole ? ' Un administrador puede asignarle más permisos.' : ''}`;
            document.getElementById('regUser').value = '';
            document.getElementById('regPass').value = '';
            document.getElementById('regPassConfirm').value = '';
            document.getElementById('regFullName').value = '';
            pendingInviteToken = null;
            pendingInviteRole = null;
            const infoEl = document.getElementById('registerInviteInfo');
            if (infoEl) infoEl.style.display = 'none';

            setTimeout(() => {
                document.getElementById('registerCard').style.display = 'none';
                document.getElementById('loginCard').style.display = '';
                successEl.textContent = '';
            }, 3000);
        } else {
            errorEl.textContent = result.error;
        }
    }

    function onLoginSuccess() {
        document.getElementById('loginSection').classList.remove('active');
        document.getElementById('cartSection').classList.add('active');

        const menuBtn = document.getElementById('menuBtn');
        if (menuBtn) menuBtn.style.display = '';

        const badge = document.getElementById('userBadge');
        const nameSpan = document.getElementById('userName');
        if (badge && nameSpan) {
            const roleLabel = DataStore.ROLES[currentUser.role]?.label || currentUser.role;
            nameSpan.textContent = `${currentUser.fullName} (${roleLabel})`;
            badge.classList.remove('hidden');
        }

        document.querySelectorAll('.sidebar__nav-item[data-requires-auth]').forEach(el => {
            const requiredRole = el.dataset.minRole || 'viewer';
            if (DataStore.hasPermission(currentUser, requiredRole)) {
                el.style.display = '';
            } else {
                el.style.display = 'none';
            }
        });

        applyPermissions();
        document.getElementById('logoutBtn').style.display = '';
        document.querySelector('.sidebar__nav-item[data-section="cartSection"]')?.classList.add('active');

        Cart.render();
        Summary.update();
        CartManager.updateCartSelector();
    }

    function applyPermissions() {
        document.querySelectorAll('[data-min-role]').forEach(el => {
            const req = el.dataset.minRole;
            el.style.display = DataStore.hasPermission(currentUser, req) ? '' : 'none';
        });
    }

    function handleLogout() {
        currentUser = null;
        sessionStorage.removeItem('itpa_session');

        document.getElementById('userBadge').classList.add('hidden');
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.getElementById('loginSection').classList.add('active');
        document.querySelectorAll('.sidebar__nav-item').forEach(n => n.classList.remove('active'));

        document.querySelectorAll('.sidebar__nav-item[data-requires-auth]').forEach(el => {
            el.style.display = 'none';
        });

        document.getElementById('logoutBtn').style.display = 'none';
        const menuBtn = document.getElementById('menuBtn');
        if (menuBtn) menuBtn.style.display = 'none';

        document.getElementById('loginCard').style.display = '';
        document.getElementById('registerCard').style.display = 'none';

        App.closeSidebar();
    }

    function getUser() { return currentUser; }
    function isLoggedIn() { return currentUser !== null; }
    function isAdmin() { return currentUser?.role === 'admin'; }
    function canEdit() { return DataStore.hasPermission(currentUser, 'editor'); }

    function refreshSession() {
        if (!currentUser) return;
        const users = DataStore.getUsers();
        const fresh = users.find(u =>
            (u.username === currentUser.username) ||
            (u.isMaster && currentUser.isMaster)
        );
        if (fresh) {
            currentUser = fresh;
            sessionStorage.setItem('itpa_session', JSON.stringify(fresh));
        }
    }

    return { init, getUser, isLoggedIn, isAdmin, canEdit, handleLogout, refreshSession, applyPermissions };
})();
