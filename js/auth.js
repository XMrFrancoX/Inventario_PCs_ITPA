/**
 * auth.js — Sistema de login, registro, y gestión de sesión con roles
 */
const Auth = (() => {
    let currentUser = null;

    function init() {
        const saved = sessionStorage.getItem('itpa_session');
        if (saved) {
            currentUser = JSON.parse(saved);
            // Re-verificar que el usuario siga existiendo en storage
            const fresh = DataStore.authenticate(currentUser.username, currentUser.password);
            if (fresh) {
                currentUser = fresh;
                onLoginSuccess();
            } else {
                sessionStorage.removeItem('itpa_session');
                currentUser = null;
            }
        }
        setupListeners();
    }

    function setupListeners() {
        // Login form
        document.getElementById('loginForm')?.addEventListener('submit', e => {
            e.preventDefault();
            handleLogin();
        });

        // Register form
        document.getElementById('registerForm')?.addEventListener('submit', e => {
            e.preventDefault();
            handleRegister();
        });

        // Toggle between login / register views
        document.getElementById('showRegisterBtn')?.addEventListener('click', () => {
            document.getElementById('loginCard').style.display = 'none';
            document.getElementById('registerCard').style.display = '';
        });

        document.getElementById('showLoginBtn')?.addEventListener('click', () => {
            document.getElementById('registerCard').style.display = 'none';
            document.getElementById('loginCard').style.display = '';
        });

        // Logout
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

        const result = DataStore.registerUser(username, password, fullName);
        if (result.success) {
            successEl.textContent = '✅ Cuenta creada exitosamente. Su rol es "Solo Lectura". Un administrador puede asignarle más permisos.';
            // Clear fields
            document.getElementById('regUser').value = '';
            document.getElementById('regPass').value = '';
            document.getElementById('regPassConfirm').value = '';
            document.getElementById('regFullName').value = '';

            // Auto-switch to login after 3s
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
        // Hide login, show app content
        document.getElementById('loginSection').classList.remove('active');
        document.getElementById('cartSection').classList.add('active');

        // Show header menu button
        const menuBtn = document.getElementById('menuBtn');
        if (menuBtn) menuBtn.style.display = '';

        // Update user badge with role
        const badge = document.getElementById('userBadge');
        const nameSpan = document.getElementById('userName');
        if (badge && nameSpan) {
            const roleLabel = DataStore.ROLES[currentUser.role]?.label || currentUser.role;
            nameSpan.textContent = `${currentUser.fullName} (${roleLabel})`;
            badge.classList.remove('hidden');
        }

        // Show sidebar nav items based on permissions
        document.querySelectorAll('.sidebar__nav-item[data-requires-auth]').forEach(el => {
            const requiredRole = el.dataset.minRole || 'viewer';
            if (DataStore.hasPermission(currentUser, requiredRole)) {
                el.style.display = '';
            } else {
                el.style.display = 'none';
            }
        });

        // Show/hide action buttons based on role
        applyPermissions();

        // Show logout button
        document.getElementById('logoutBtn').style.display = '';

        // Set active nav
        document.querySelector('.sidebar__nav-item[data-section="cartSection"]')?.classList.add('active');

        // Initialize all modules
        Cart.render();
        Summary.update();
    }

    /** Oculta/muestra elementos de la UI según el rol del usuario */
    function applyPermissions() {
        const isAdmin = currentUser.role === 'admin';
        const isEditor = currentUser.role === 'editor' || isAdmin;

        // Action buttons that require editor or higher
        document.querySelectorAll('[data-min-role]').forEach(el => {
            const req = el.dataset.minRole;
            el.style.display = DataStore.hasPermission(currentUser, req) ? '' : 'none';
        });

        // Edit mode in modals — the switch is hidden for viewers
        // This is handled dynamically in modal.js when rendering
    }

    function handleLogout() {
        currentUser = null;
        sessionStorage.removeItem('itpa_session');

        // Reset UI
        document.getElementById('userBadge').classList.add('hidden');
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.getElementById('loginSection').classList.add('active');
        document.querySelectorAll('.sidebar__nav-item').forEach(n => n.classList.remove('active'));

        // Hide auth-required nav
        document.querySelectorAll('.sidebar__nav-item[data-requires-auth]').forEach(el => {
            el.style.display = 'none';
        });

        document.getElementById('logoutBtn').style.display = 'none';

        // Hide header menu button
        const menuBtn = document.getElementById('menuBtn');
        if (menuBtn) menuBtn.style.display = 'none';

        // Make sure login card is visible (not register)
        document.getElementById('loginCard').style.display = '';
        document.getElementById('registerCard').style.display = 'none';

        // Close sidebar
        App.closeSidebar();
    }

    function getUser() { return currentUser; }
    function isLoggedIn() { return currentUser !== null; }
    function isAdmin() { return currentUser?.role === 'admin'; }
    function canEdit() { return DataStore.hasPermission(currentUser, 'editor'); }

    /** Refresca el usuario actual desde storage (después de editar su propio perfil) */
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
