/**
 * data.js — Modelo de datos y persistencia en localStorage
 *
 * Roles del sistema:
 *   - 'admin'   → Control total (editar, asignar, gestionar usuarios)
 *   - 'editor'  → Puede editar laptops y hacer entregas
 *   - 'viewer'  → Solo puede visualizar (rol por defecto al crear cuenta)
 *
 * La cuenta "admin" es la cuenta maestra del sistema y no puede ser eliminada.
 */
const DataStore = (() => {
    const STORAGE_KEY = 'itpa_inventory';
    const USERS_KEY = 'itpa_users';
    const TRANSACTIONS_KEY = 'itpa_transactions';
<<<<<<< HEAD
=======
    const INVITES_KEY = 'itpa_invites';
    const CARTS_KEY = 'itpa_carts';
    const ACTIVE_CART_KEY = 'itpa_active_cart';
>>>>>>> 08b288a (feat: implement initial ITPA PC inventory management application with data storage, user authentication, and multi-cart support.)

    /* ---------- Roles disponibles ---------- */
    const ROLES = {
        admin: { label: 'Administrador', level: 3 },
        editor: { label: 'Editor', level: 2 },
        viewer: { label: 'Solo Lectura', level: 1 }
    };

    /* ---------- Cuenta maestra por defecto ---------- */
    const MASTER_ACCOUNT = {
        username: 'admin',
        password: 'admin',
        fullName: 'Administrador ITPA',
        role: 'admin',
        isMaster: true,       // Flag: no se puede eliminar
        createdAt: new Date().toISOString()
    };

    /* ---------- Plantilla de slot vacío ---------- */
    function emptySlot(index, shelf) {
        return {
            slotIndex: index,
            shelf: shelf,
            laptopId: '',
            status: 'vacio',
            responsable: '',
            curso: '',
            hora: '',
            entregadoPor: '',
            ubicacion: '',
            marca: '',
            modelo: '',
            serie: '',
            mac: '',
            ip: '',
            adminLocal: '',
            biosPass: '',
            observaciones: '',
            cpu: '',
            ram: '',
            storage: '',
            software: {
                windows: false,
                office: false,
                autocad: false,
                solidworks: false,
                vscode: false,
                arduino: false
            },
            mantenimiento: {
                limpiezaInterna: false,
                limpiezaExterna: false,
                actualizacionSO: false,
                actualizacionDrivers: false,
                revisionBateria: false,
                revisionCargador: false,
                revisionPantalla: false,
                revisionTeclado: false
            }
        };
    }

    /* ---------- Inicializar datos ---------- */
    function init() {
        if (!localStorage.getItem(USERS_KEY)) {
            localStorage.setItem(USERS_KEY, JSON.stringify([MASTER_ACCOUNT]));
        } else {
            // Asegurar que la cuenta maestra siempre exista
            const users = getUsers();
            const hasMaster = users.some(u => u.isMaster);
            if (!hasMaster) {
                users.push(MASTER_ACCOUNT);
                saveUsers(users);
            }
        }
<<<<<<< HEAD
        if (!localStorage.getItem(STORAGE_KEY)) {
            const slots = [];
            for (let i = 0; i < 20; i++) slots.push(emptySlot(i, 'superior'));
            for (let i = 0; i < 20; i++) slots.push(emptySlot(i, 'inferior'));
            save(slots);
=======

        // Migrar de sistema de carro único a multi-carro
        if (!localStorage.getItem(CARTS_KEY)) {
            const defaultId = 'cart_' + Date.now();
            const defaultCart = {
                id: defaultId,
                name: 'Carro Principal',
                shelves: ['superior', 'inferior'],
                slotsPerShelf: 20,
                createdAt: new Date().toISOString()
            };
            localStorage.setItem(CARTS_KEY, JSON.stringify([defaultCart]));
            localStorage.setItem(ACTIVE_CART_KEY, defaultId);

            // Migrar datos existentes o crear vacíos
            const existingData = localStorage.getItem(STORAGE_KEY);
            if (existingData) {
                localStorage.setItem('itpa_inventory_' + defaultId, existingData);
            } else {
                const slots = [];
                for (let i = 0; i < 20; i++) slots.push(emptySlot(i, 'superior'));
                for (let i = 0; i < 20; i++) slots.push(emptySlot(i, 'inferior'));
                localStorage.setItem('itpa_inventory_' + defaultId, JSON.stringify(slots));
            }
        }

        // Asegurar carro activo válido
        const carts = getCarts();
        const activeId = localStorage.getItem(ACTIVE_CART_KEY);
        if (!activeId || !carts.some(c => c.id === activeId)) {
            if (carts.length > 0) localStorage.setItem(ACTIVE_CART_KEY, carts[0].id);
        }

        // Inicializar invitaciones si no existen
        if (!localStorage.getItem(INVITES_KEY)) {
            localStorage.setItem(INVITES_KEY, JSON.stringify([]));
>>>>>>> 08b288a (feat: implement initial ITPA PC inventory management application with data storage, user authentication, and multi-cart support.)
        }
    }

    /* =================== INVENTARIO CRUD =================== */
<<<<<<< HEAD
    function getAll() {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    }

    function save(slots) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(slots));
=======
    function _cartStorageKey() {
        const activeId = localStorage.getItem(ACTIVE_CART_KEY);
        return activeId ? 'itpa_inventory_' + activeId : STORAGE_KEY;
    }

    function getAll() {
        return JSON.parse(localStorage.getItem(_cartStorageKey()) || '[]');
    }

    function save(slots) {
        localStorage.setItem(_cartStorageKey(), JSON.stringify(slots));
>>>>>>> 08b288a (feat: implement initial ITPA PC inventory management application with data storage, user authentication, and multi-cart support.)
        window.dispatchEvent(new CustomEvent('data-updated'));
    }

    function getSlot(shelf, index) {
        return getAll().find(s => s.shelf === shelf && s.slotIndex === index) || null;
    }

    function updateSlot(shelf, index, fields) {
        const slots = getAll();
        const i = slots.findIndex(s => s.shelf === shelf && s.slotIndex === index);
        if (i !== -1) {
            slots[i] = { ...slots[i], ...fields };
            save(slots);
        }
        return slots[i];
    }

    function bulkUpdate(updates) {
        const slots = getAll();
        updates.forEach(({ shelf, index, fields }) => {
            const i = slots.findIndex(s => s.shelf === shelf && s.slotIndex === index);
            if (i !== -1) slots[i] = { ...slots[i], ...fields };
        });
        save(slots);
    }

    /* ---------- Estadísticas ---------- */
    function getStats() {
        const slots = getAll();
        const assigned = slots.filter(s => s.laptopId);
        return {
            total: assigned.length,
            almacenadas: slots.filter(s => s.status === 'almacenada').length,
            enUso: slots.filter(s => s.status === 'enuso').length,
            excepciones: slots.filter(s => s.status === 'excepcion').length,
            staff: slots.filter(s => s.status === 'staff').length,
            vacios: slots.filter(s => s.status === 'vacio').length
        };
    }

    /* ---------- Carga Híbrida ---------- */
    function assignRange(shelf, startSlot, endSlot, prefix, startNum) {
        const slots = getAll();
        let num = startNum;
        for (let idx = startSlot; idx <= endSlot && idx < 20; idx++) {
            const i = slots.findIndex(s => s.shelf === shelf && s.slotIndex === idx);
            if (i !== -1) {
                const paddedNum = String(num).padStart(2, '0');
                slots[i].laptopId = `${prefix}${paddedNum}`;
                if (slots[i].status === 'vacio') slots[i].status = 'almacenada';
                num++;
            }
        }
        save(slots);
    }

    /* =================== GESTIÓN DE USUARIOS =================== */
    function getUsers() {
        return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    }

    function saveUsers(users) {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    function authenticate(username, password) {
        const users = getUsers();
        return users.find(u => u.username === username && u.password === password) || null;
    }

<<<<<<< HEAD
    /** Registrar nuevo usuario (rol viewer por defecto) */
    function registerUser(username, password, fullName) {
=======
    /** Registrar nuevo usuario (rol viewer por defecto, o rol de invitación) */
    function registerUser(username, password, fullName, role) {
>>>>>>> 08b288a (feat: implement initial ITPA PC inventory management application with data storage, user authentication, and multi-cart support.)
        const users = getUsers();
        // Verificar si ya existe
        if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
            return { success: false, error: 'El nombre de usuario ya está en uso.' };
        }
        if (username.length < 3) {
            return { success: false, error: 'El usuario debe tener al menos 3 caracteres.' };
        }
        if (password.length < 4) {
            return { success: false, error: 'La contraseña debe tener al menos 4 caracteres.' };
        }
        if (!fullName.trim()) {
            return { success: false, error: 'Debe ingresar su nombre completo.' };
        }

<<<<<<< HEAD
=======
        const assignedRole = (role && ROLES[role]) ? role : 'viewer';

>>>>>>> 08b288a (feat: implement initial ITPA PC inventory management application with data storage, user authentication, and multi-cart support.)
        const newUser = {
            username: username.trim(),
            password: password,
            fullName: fullName.trim(),
<<<<<<< HEAD
            role: 'viewer',           // Nivel más bajo por defecto
=======
            role: assignedRole,
>>>>>>> 08b288a (feat: implement initial ITPA PC inventory management application with data storage, user authentication, and multi-cart support.)
            isMaster: false,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        saveUsers(users);
        return { success: true, user: newUser };
    }

    /** Actualizar rol de un usuario (solo admins pueden hacer esto) */
    function updateUserRole(username, newRole, requestingUser) {
        if (requestingUser.role !== 'admin') {
            return { success: false, error: 'Solo los administradores pueden cambiar roles.' };
        }
        if (!ROLES[newRole]) {
            return { success: false, error: 'Rol inválido.' };
        }
        const users = getUsers();
        const user = users.find(u => u.username === username);
        if (!user) {
            return { success: false, error: 'Usuario no encontrado.' };
        }
        user.role = newRole;
        saveUsers(users);
        return { success: true };
    }

    /** Actualizar datos de un usuario (usuario o contraseña) */
    function updateUser(username, fields, requestingUser) {
        const users = getUsers();
        const user = users.find(u => u.username === username);
        if (!user) {
            return { success: false, error: 'Usuario no encontrado.' };
        }
        // Solo el propio usuario o un admin puede editar
        if (requestingUser.username !== username && requestingUser.role !== 'admin') {
            return { success: false, error: 'No tiene permisos para editar este usuario.' };
        }
        // Check si cambia username y ya existe otro con ese nombre
        if (fields.username && fields.username !== username) {
            if (users.some(u => u.username.toLowerCase() === fields.username.toLowerCase() && u.username !== username)) {
                return { success: false, error: 'Ese nombre de usuario ya está en uso.' };
            }
            user.username = fields.username.trim();
        }
        if (fields.password) user.password = fields.password;
        if (fields.fullName) user.fullName = fields.fullName.trim();

        saveUsers(users);
        return { success: true, user };
    }

    /** Eliminar un usuario (solo admins, nunca la cuenta maestra) */
    function deleteUser(username, requestingUser) {
        if (requestingUser.role !== 'admin') {
            return { success: false, error: 'Solo los administradores pueden eliminar usuarios.' };
        }
        const users = getUsers();
        const user = users.find(u => u.username === username);
        if (!user) return { success: false, error: 'Usuario no encontrado.' };
        if (user.isMaster) return { success: false, error: 'La cuenta maestra no puede ser eliminada.' };

        const filtered = users.filter(u => u.username !== username);
        saveUsers(filtered);
        return { success: true };
    }

    /** Verifica si el usuario tiene permiso para una acción */
    function hasPermission(user, requiredRole) {
        if (!user) return false;
        return (ROLES[user.role]?.level || 0) >= (ROLES[requiredRole]?.level || 0);
    }

    /* =================== TRANSACCIONES =================== */
    /**
     * Registrar una transacción de movimiento de equipo.
     * @param {Object} txn - Datos de la transacción
     * @param {string[]} txn.laptopIds - IDs de laptops afectadas
     * @param {string} txn.tipoMovimiento - 'clase'|'staff'|'excepcion'|'retorno'
     * @param {string} txn.solicitante - Quién solicita (Docente/Jefe)
     * @param {string} txn.retirante - Quién retira físicamente (Alumno/Ayudante)
     * @param {string} txn.curso - Curso/División (opcional)
     * @param {string} txn.destino - Ubicación destino detallada (opcional)
     * @param {string} txn.observaciones - Notas adicionales (opcional)
     * @param {Object} txn.usuario - Usuario que realizó la operación (auto)
     */
    function addTransaction(txn) {
        const transactions = getTransactions();
        const record = {
            id: Date.now() + '-' + Math.random().toString(36).substr(2, 6),
            timestamp: new Date().toISOString(),
            laptopIds: txn.laptopIds || [],
            tipoMovimiento: txn.tipoMovimiento,
            solicitante: txn.solicitante || '',
            retirante: txn.retirante || '',
            curso: txn.curso || '',
            destino: txn.destino || '',
            observaciones: txn.observaciones || '',
            usuario: txn.usuario ? {
                username: txn.usuario.username,
                fullName: txn.usuario.fullName,
                role: txn.usuario.role
            } : null
        };
        transactions.unshift(record); // Más recientes primero
        localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
        return record;
    }

    function getTransactions() {
        return JSON.parse(localStorage.getItem(TRANSACTIONS_KEY) || '[]');
    }

<<<<<<< HEAD
=======
    /* =================== INVITACIONES =================== */
    function getInvites() {
        return JSON.parse(localStorage.getItem(INVITES_KEY) || '[]');
    }

    function saveInvites(invites) {
        localStorage.setItem(INVITES_KEY, JSON.stringify(invites));
    }

    /** Crear una invitación con rol preseleccionado (solo admins) */
    function createInvite(role, requestingUser) {
        if (!requestingUser || requestingUser.role !== 'admin') {
            return { success: false, error: 'Solo los administradores pueden crear invitaciones.' };
        }
        if (!ROLES[role]) {
            return { success: false, error: 'Rol inválido.' };
        }
        const token = Date.now().toString(36) + Math.random().toString(36).substr(2, 8);
        const invite = {
            token,
            role,
            createdAt: new Date().toISOString(),
            createdBy: requestingUser.username,
            used: false
        };
        const invites = getInvites();
        invites.push(invite);
        saveInvites(invites);
        return { success: true, invite };
    }

    /** Canjear una invitación por su token */
    function redeemInvite(token) {
        const invites = getInvites();
        const invite = invites.find(i => i.token === token && !i.used);
        if (!invite) return null;
        invite.used = true;
        invite.usedAt = new Date().toISOString();
        saveInvites(invites);
        return invite.role;
    }

    /** Eliminar una invitación */
    function deleteInvite(token, requestingUser) {
        if (!requestingUser || requestingUser.role !== 'admin') {
            return { success: false, error: 'Solo los administradores pueden eliminar invitaciones.' };
        }
        const invites = getInvites().filter(i => i.token !== token);
        saveInvites(invites);
        return { success: true };
    }

    /* =================== GESTIÓN DE CARROS =================== */
    function getCarts() {
        return JSON.parse(localStorage.getItem(CARTS_KEY) || '[]');
    }

    function saveCarts(carts) {
        localStorage.setItem(CARTS_KEY, JSON.stringify(carts));
    }

    function getActiveCart() {
        const activeId = localStorage.getItem(ACTIVE_CART_KEY);
        const carts = getCarts();
        return carts.find(c => c.id === activeId) || carts[0] || null;
    }

    function setActiveCart(cartId) {
        localStorage.setItem(ACTIVE_CART_KEY, cartId);
        window.dispatchEvent(new CustomEvent('data-updated'));
    }

    /** Crear un nuevo carro */
    function createCart(name, shelvesCount, slotsPerShelf, requestingUser) {
        if (!requestingUser || requestingUser.role !== 'admin') {
            return { success: false, error: 'Solo los administradores pueden crear carros.' };
        }
        if (!name || !name.trim()) {
            return { success: false, error: 'El carro debe tener un nombre.' };
        }
        const numShelves = shelvesCount || 2;
        const numSlots = slotsPerShelf || 20;
        const shelfNames = [];
        if (numShelves === 1) {
            shelfNames.push('unico');
        } else if (numShelves === 2) {
            shelfNames.push('superior', 'inferior');
        } else {
            for (let i = 1; i <= numShelves; i++) shelfNames.push('estante_' + i);
        }

        const id = 'cart_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
        const cart = {
            id,
            name: name.trim(),
            shelves: shelfNames,
            slotsPerShelf: numSlots,
            createdAt: new Date().toISOString()
        };

        // Crear slots vacíos
        const slots = [];
        shelfNames.forEach(shelf => {
            for (let i = 0; i < numSlots; i++) slots.push(emptySlot(i, shelf));
        });
        localStorage.setItem('itpa_inventory_' + id, JSON.stringify(slots));

        const carts = getCarts();
        carts.push(cart);
        saveCarts(carts);
        return { success: true, cart };
    }

    /** Eliminar un carro (solo admin, no el último) */
    function deleteCart(cartId, requestingUser) {
        if (!requestingUser || requestingUser.role !== 'admin') {
            return { success: false, error: 'Solo los administradores pueden eliminar carros.' };
        }
        const carts = getCarts();
        if (carts.length <= 1) {
            return { success: false, error: 'No se puede eliminar el último carro.' };
        }
        const filtered = carts.filter(c => c.id !== cartId);
        saveCarts(filtered);
        localStorage.removeItem('itpa_inventory_' + cartId);

        // Si el carro eliminado era el activo, cambiar al primero
        const activeId = localStorage.getItem(ACTIVE_CART_KEY);
        if (activeId === cartId) {
            localStorage.setItem(ACTIVE_CART_KEY, filtered[0].id);
        }

        window.dispatchEvent(new CustomEvent('data-updated'));
        return { success: true };
    }

    function getShelfLabel(shelfKey) {
        const labels = {
            superior: 'Superior',
            inferior: 'Inferior',
            unico: 'Único'
        };
        if (labels[shelfKey]) return labels[shelfKey];
        // estante_1 → "Estante 1"
        if (shelfKey.startsWith('estante_')) return 'Estante ' + shelfKey.split('_')[1];
        return shelfKey;
    }

>>>>>>> 08b288a (feat: implement initial ITPA PC inventory management application with data storage, user authentication, and multi-cart support.)
    /* ---------- Exportar ---------- */
    return {
        init, getAll, getSlot, updateSlot, bulkUpdate, getStats,
        authenticate, assignRange, save,
        registerUser, updateUserRole, updateUser, deleteUser,
        getUsers, hasPermission, ROLES,
<<<<<<< HEAD
        addTransaction, getTransactions
=======
        addTransaction, getTransactions,
        // Invitaciones
        createInvite, getInvites, redeemInvite, deleteInvite,
        // Carros
        getCarts, getActiveCart, setActiveCart, createCart, deleteCart, getShelfLabel
>>>>>>> 08b288a (feat: implement initial ITPA PC inventory management application with data storage, user authentication, and multi-cart support.)
    };
})();
