/**
 * auth.js — Sistema de login, registro, y gestión de sesión con roles
 * Usa Supabase para autenticación
 */
const Auth = (() => {
    let currentUser = null;

    async function init() {
        const saved = sessionStorage.getItem('itpa_session');
        if (saved) {
            const parsed = JSON.parse(saved);
            // Re-validate session against DB
            const fresh = await DataStore.authenticate(parsed.username, parsed._pw);
            if (fresh) {
                currentUser = { ...fresh, _pw: parsed._pw };
                sessionStorage.setItem('itpa_session', JSON.stringify(currentUser));
                await onLoginSuccess();
            } else {
                sessionStorage.removeItem('itpa_session');
                currentUser = null;
            }
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

    async function handleLogin() {
        const username = document.getElementById('loginUser').value.trim();
        const password = document.getElementById('loginPass').value.trim();
        const errorEl = document.getElementById('loginError');

        if (!username || !password) {
            errorEl.textContent = 'Por favor, complete ambos campos.';
            return;
        }

        errorEl.textContent = 'Iniciando sesión...';

        const user = await DataStore.authenticate(username, password);
        if (user) {
            if (user.role === 'pending') {
                errorEl.textContent = 'Su cuenta está pendiente de aprobación. Un administrador debe autorizar su ingreso y asignarle un rol.';
                document.getElementById('loginPass').value = '';
                return;
            }
            currentUser = { ...user, _pw: password };
            sessionStorage.setItem('itpa_session', JSON.stringify(currentUser));
            errorEl.textContent = '';
            await onLoginSuccess();
        } else {
            errorEl.textContent = 'Usuario o contraseña incorrectos.';
            document.getElementById('loginPass').value = '';
        }
    }

    async function handleRegister() {
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

        errorEl.textContent = 'Creando cuenta...';

        const result = await DataStore.registerUser(username, password, fullName);
        if (result.success) {
            const roleLabel = DataStore.ROLES[result.user.role]?.label || result.user.role;
            successEl.textContent = `Cuenta creada exitosamente. Su cuenta está pendiente de aprobación. Un administrador debe autorizar su ingreso antes de que pueda acceder al sistema.`;
            errorEl.textContent = '';
            document.getElementById('regUser').value = '';
            document.getElementById('regPass').value = '';
            document.getElementById('regPassConfirm').value = '';
            document.getElementById('regFullName').value = '';

            setTimeout(() => {
                document.getElementById('registerCard').style.display = 'none';
                document.getElementById('loginCard').style.display = '';
                successEl.textContent = '';
            }, 3000);
        } else {
            errorEl.textContent = result.error;
        }
    }

    async function onLoginSuccess() {
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

        await Cart.render();
        await Summary.update();
        await CartManager.updateCartSelector();
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

    async function refreshSession() {
        if (!currentUser) return;
        const users = await DataStore.getUsers();
        const fresh = users.find(u =>
            (u.username === currentUser.username) ||
            (u.isMaster && currentUser.isMaster)
        );
        if (fresh) {
            currentUser = { ...fresh, _pw: currentUser._pw };
            sessionStorage.setItem('itpa_session', JSON.stringify(currentUser));
        }
    }

    return { init, getUser, isLoggedIn, isAdmin, canEdit, handleLogout, refreshSession, applyPermissions };
})();
