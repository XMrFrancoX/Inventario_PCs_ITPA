/**
 * data.js — Modelo de datos y persistencia en Supabase (PostgreSQL)
 *
 * Roles del sistema:
 *   - 'admin'   → Control total (editar, asignar, gestionar usuarios)
 *   - 'editor'  → Puede editar laptops y hacer entregas
 *   - 'viewer'  → Solo puede visualizar (rol por defecto al crear cuenta)
 *
 * Todas las funciones son async y devuelven Promises.
 */
const DataStore = (() => {

    let _activeCartId = null;

    /* ---------- Roles disponibles ---------- */
    const ROLES = {
        admin: { label: 'Administrador', level: 3 },
        editor: { label: 'Editor', level: 2 },
        viewer: { label: 'Solo Lectura', level: 1 }
    };

    /* ---------- Shelf labels ---------- */
    const SHELF_LABELS = {
        superior: 'Estante Superior',
        inferior: 'Estante Inferior',
        estante_3: 'Estante 3',
        estante_4: 'Estante 4',
        estante_5: 'Estante 5',
        estante_6: 'Estante 6'
    };

    const SHELF_KEYS = ['superior', 'inferior', 'estante_3', 'estante_4', 'estante_5', 'estante_6'];

    /* ---------- Inicializar ---------- */
    async function init() {
        // Cargar carro activo desde sessionStorage (preferencia local)
        const savedCartId = sessionStorage.getItem('itpa_active_cart');
        if (savedCartId) {
            _activeCartId = savedCartId;
        } else {
            // Obtener el primer carro
            try {
                const carts = await getCarts();
                console.log('[DataStore] Carros encontrados:', carts.length);
                if (carts.length > 0) {
                    _activeCartId = carts[0].id;
                    sessionStorage.setItem('itpa_active_cart', _activeCartId);
                }
            } catch (e) {
                console.error('[DataStore] Error obteniendo carros:', e);
            }
        }
        console.log('[DataStore] Active cart:', _activeCartId);
    }

    /* =================== INVENTARIO CRUD =================== */

    /** Obtener todos los slots del carro activo */
    async function getAll() {
        if (!_activeCartId) return [];
        const { data, error } = await db
            .from('slots')
            .select('*')
            .eq('cart_id', _activeCartId)
            .order('shelf')
            .order('slot_index');
        if (error) { console.error('getAll error:', error); return []; }
        return data.map(mapSlotFromDB);
    }

    /** Obtener un slot específico */
    async function getSlot(shelf, index) {
        if (!_activeCartId) return null;
        const { data, error } = await db
            .from('slots')
            .select('*')
            .eq('cart_id', _activeCartId)
            .eq('shelf', shelf)
            .eq('slot_index', index)
            .single();
        if (error) { console.error('getSlot error:', error); return null; }
        return mapSlotFromDB(data);
    }

    /** Actualizar un slot */
    async function updateSlot(shelf, index, fields) {
        if (!_activeCartId) return false;
        const dbFields = mapSlotToDB(fields);
        const { error } = await db
            .from('slots')
            .update(dbFields)
            .eq('cart_id', _activeCartId)
            .eq('shelf', shelf)
            .eq('slot_index', index);
        if (error) { console.error('updateSlot error:', error); return false; }
        return true;
    }

    /** Actualizar múltiples slots de una vez */
    async function bulkUpdate(updates) {
        // updates es un array de { shelf, slotIndex, fields }
        const promises = updates.map(u => updateSlot(u.shelf, u.slotIndex, u.fields));
        await Promise.all(promises);
    }

    /** Guardar todos los slots (reemplazar completo - usado por bulk ops) */
    async function save(slots) {
        // Para operaciones bulk, actualizar cada slot individualmente
        const promises = slots.map(s => {
            const fields = { ...s };
            delete fields.slotIndex;
            delete fields.shelf;
            delete fields.cartId;
            return updateSlot(s.shelf, s.slotIndex, fields);
        });
        await Promise.all(promises);
    }

    /* ---------- Estadísticas ---------- */
    async function getStats() {
        const slots = await getAll();
        const stats = { total: 0, almacenada: 0, enuso: 0, excepcion: 0, staff: 0, vacio: 0 };

        slots.forEach(s => {
            stats[s.status] = (stats[s.status] || 0) + 1;
            if (s.status !== 'vacio') stats.total++;
        });
        stats.vacio = slots.filter(s => s.status === 'vacio').length;

        return stats;
    }

    /* ---------- Carga Híbrida ---------- */
    async function assignRange(shelf, startSlot, endSlot, prefix, startNum) {
        for (let i = startSlot; i <= endSlot; i++) {
            const num = startNum + (i - startSlot);
            const laptopId = `${prefix}${String(num).padStart(2, '0')}`;
            await updateSlot(shelf, i, { laptopId, status: 'almacenada' });
        }
    }

    /* =================== GESTIÓN DE USUARIOS =================== */

    /** Obtener todos los usuarios */
    async function getUsers() {
        const { data, error } = await db
            .from('users')
            .select('id, username, full_name, role, is_master, created_at')
            .order('created_at');
        if (error) { console.error('getUsers error:', error); return []; }
        return data.map(u => ({
            id: u.id,
            username: u.username,
            fullName: u.full_name,
            role: u.role,
            isMaster: u.is_master,
            createdAt: u.created_at
        }));
    }

    /** Autenticar usuario (login) */
    async function authenticate(username, password) {
        const { data, error } = await db.rpc('verify_password', {
            p_username: username,
            p_password: password
        });
        if (error) { console.error('auth error:', error); return null; }
        if (!data || data.length === 0) return null;
        const u = data[0];
        return {
            id: u.id,
            username: u.username,
            fullName: u.full_name,
            role: u.role,
            isMaster: u.is_master,
            createdAt: u.created_at
        };
    }

    /** Registrar nuevo usuario */
    async function registerUser(username, password, fullName, role) {
        const assignedRole = role || 'viewer';

        // Verificar si el username ya existe
        const { data: existing } = await db
            .from('users')
            .select('id')
            .eq('username', username)
            .single();
        if (existing) {
            return { success: false, error: 'El nombre de usuario ya existe.' };
        }

        // Registrar via función RPC (hashes la contraseña server-side)
        const { data: newId, error } = await db.rpc('register_user', {
            p_username: username,
            p_password: password,
            p_full_name: fullName,
            p_role: assignedRole
        });

        if (error) {
            console.error('register error:', error);
            return { success: false, error: error.message };
        }

        return {
            success: true,
            user: { username, fullName, role: assignedRole, isMaster: false, createdAt: new Date().toISOString() }
        };
    }

    /** Actualizar rol de un usuario */
    async function updateUserRole(username, newRole, requestingUser) {
        if (!hasPermission(requestingUser, 'admin')) {
            return { success: false, error: 'No tiene permisos para cambiar roles.' };
        }

        // No permitir cambiar el rol de la cuenta maestra
        const { data: target } = await db.from('users').select('is_master').eq('username', username).single();
        if (target?.is_master) {
            return { success: false, error: 'No se puede cambiar el rol de la cuenta maestra.' };
        }

        const { error } = await db
            .from('users')
            .update({ role: newRole })
            .eq('username', username);

        if (error) return { success: false, error: error.message };
        return { success: true };
    }

    /** Actualizar datos de un usuario */
    async function updateUser(username, fields, requestingUser) {
        const isSelf = requestingUser.username === username;
        const isAdmin = hasPermission(requestingUser, 'admin');

        if (!isSelf && !isAdmin) {
            return { success: false, error: 'No tiene permisos.' };
        }

        const updateFields = {};
        if (fields.fullName) updateFields.full_name = fields.fullName;
        if (fields.username) updateFields.username = fields.username;

        if (Object.keys(updateFields).length > 0) {
            const { error } = await db.from('users').update(updateFields).eq('username', username);
            if (error) return { success: false, error: error.message };
        }

        // Si hay nueva contraseña, usar la función RPC
        if (fields.password) {
            const targetUsername = fields.username || username;
            const { error } = await db.rpc('update_user_password', {
                p_username: targetUsername,
                p_new_password: fields.password
            });
            if (error) return { success: false, error: error.message };
        }

        return { success: true };
    }

    /** Eliminar un usuario */
    async function deleteUser(username, requestingUser) {
        if (!hasPermission(requestingUser, 'admin')) {
            return { success: false, error: 'No tiene permisos.' };
        }

        const { data: target } = await db.from('users').select('is_master').eq('username', username).single();
        if (target?.is_master) {
            return { success: false, error: 'No se puede eliminar la cuenta maestra.' };
        }

        const { error } = await db.from('users').delete().eq('username', username);
        if (error) return { success: false, error: error.message };
        return { success: true };
    }

    /** Verificar permisos */
    function hasPermission(user, requiredRole) {
        if (!user || !user.role) return false;
        return (ROLES[user.role]?.level || 0) >= (ROLES[requiredRole]?.level || 99);
    }

    /* =================== TRANSACCIONES =================== */

    /** Registrar una transacción */
    async function addTransaction(txn) {
        const { error } = await db.from('transactions').insert({
            tipo: txn.tipo,
            equipos: txn.equipos,
            responsable: txn.responsable || '',
            operador: txn.operador || '',
            created_at: new Date().toISOString()
        });
        if (error) console.error('addTransaction error:', error);
    }

    /** Obtener todas las transacciones */
    async function getTransactions() {
        const { data, error } = await db
            .from('transactions')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) { console.error('getTransactions error:', error); return []; }
        return data.map(t => ({
            tipo: t.tipo,
            equipos: t.equipos,
            responsable: t.responsable,
            operador: t.operador,
            fecha: t.created_at
        }));
    }

    /* =================== GESTIÓN DE CARROS =================== */

    /** Obtener todos los carros */
    async function getCarts() {
        const { data, error } = await db
            .from('carts')
            .select('*')
            .order('created_at');
        if (error) { console.error('getCarts error:', error); return []; }
        return data.map(c => ({
            id: c.id,
            name: c.name,
            shelves: c.shelves,
            slotsPerShelf: c.slots_per_shelf,
            createdAt: c.created_at
        }));
    }

    /** Obtener el carro activo */
    function getActiveCart() {
        return _activeCartId;
    }

    /** Establecer el carro activo */
    function setActiveCart(cartId) {
        _activeCartId = cartId;
        sessionStorage.setItem('itpa_active_cart', cartId);
    }

    /** Crear un nuevo carro */
    async function createCart(name, shelvesCount, slotsPerShelf, requestingUser) {
        if (!hasPermission(requestingUser, 'admin')) {
            return { success: false, error: 'No tiene permisos.' };
        }
        if (!name || !name.trim()) {
            return { success: false, error: 'El nombre del carro es obligatorio.' };
        }

        const shelvesArr = SHELF_KEYS.slice(0, shelvesCount);

        // Insertar el carro
        const { data: newCart, error: cartError } = await db
            .from('carts')
            .insert({ name: name.trim(), shelves: shelvesArr, slots_per_shelf: slotsPerShelf })
            .select()
            .single();

        if (cartError) return { success: false, error: cartError.message };

        // Generar slots vacíos
        const slotsToInsert = [];
        shelvesArr.forEach(shelf => {
            for (let i = 1; i <= slotsPerShelf; i++) {
                slotsToInsert.push({ cart_id: newCart.id, shelf, slot_index: i });
            }
        });

        const { error: slotsError } = await db.from('slots').insert(slotsToInsert);
        if (slotsError) console.error('Error creating slots:', slotsError);

        return { success: true, cart: newCart };
    }

    /** Eliminar un carro */
    async function deleteCart(cartId, requestingUser) {
        if (!hasPermission(requestingUser, 'admin')) {
            return { success: false, error: 'No tiene permisos.' };
        }

        const carts = await getCarts();
        if (carts.length <= 1) {
            return { success: false, error: 'No se puede eliminar el único carro del sistema.' };
        }

        // Eliminar el carro (ON DELETE CASCADE eliminará los slots)
        const { error } = await db.from('carts').delete().eq('id', cartId);
        if (error) return { success: false, error: error.message };

        // Si era el carro activo, cambiar al primero disponible
        if (_activeCartId === cartId) {
            const remaining = await getCarts();
            if (remaining.length > 0) {
                setActiveCart(remaining[0].id);
            }
        }

        return { success: true };
    }

    /** Obtener label de un estante */
    function getShelfLabel(shelfKey) {
        return SHELF_LABELS[shelfKey] || shelfKey;
    }

    /* =================== HELPERS =================== */

    /** Mapear slot de DB (snake_case) a JS (camelCase) */
    function mapSlotFromDB(row) {
        return {
            slotIndex: row.slot_index,
            shelf: row.shelf,
            cartId: row.cart_id,
            laptopId: row.laptop_id || '',
            status: row.status || 'vacio',
            responsable: row.responsable || '',
            curso: row.curso || '',
            hora: row.hora || '',
            entregadoPor: row.entregado_por || '',
            ubicacion: row.ubicacion || '',
            marca: row.marca || '',
            modelo: row.modelo || '',
            serie: row.serie || '',
            mac: row.mac || '',
            ip: row.ip || '',
            adminLocal: row.admin_local || '',
            biosPass: row.bios_pass || '',
            observaciones: row.observaciones || '',
            cpu: row.cpu || '',
            ram: row.ram || '',
            storage: row.storage_info || '',
            software: row.software || { windows: false, office: false, autocad: false, solidworks: false, vscode: false, arduino: false },
            mantenimiento: row.mantenimiento || { limpiezaInterna: false, limpiezaExterna: false, actualizacionSO: false, actualizacionDrivers: false, revisionBateria: false, revisionCargador: false, revisionPantalla: false, revisionTeclado: false }
        };
    }

    /** Mapear slot de JS (camelCase) a DB (snake_case) */
    function mapSlotToDB(fields) {
        const mapped = {};
        if ('laptopId' in fields) mapped.laptop_id = fields.laptopId;
        if ('status' in fields) mapped.status = fields.status;
        if ('responsable' in fields) mapped.responsable = fields.responsable;
        if ('curso' in fields) mapped.curso = fields.curso;
        if ('hora' in fields) mapped.hora = fields.hora;
        if ('entregadoPor' in fields) mapped.entregado_por = fields.entregadoPor;
        if ('ubicacion' in fields) mapped.ubicacion = fields.ubicacion;
        if ('marca' in fields) mapped.marca = fields.marca;
        if ('modelo' in fields) mapped.modelo = fields.modelo;
        if ('serie' in fields) mapped.serie = fields.serie;
        if ('mac' in fields) mapped.mac = fields.mac;
        if ('ip' in fields) mapped.ip = fields.ip;
        if ('adminLocal' in fields) mapped.admin_local = fields.adminLocal;
        if ('biosPass' in fields) mapped.bios_pass = fields.biosPass;
        if ('observaciones' in fields) mapped.observaciones = fields.observaciones;
        if ('cpu' in fields) mapped.cpu = fields.cpu;
        if ('ram' in fields) mapped.ram = fields.ram;
        if ('storage' in fields) mapped.storage_info = fields.storage;
        if ('software' in fields) mapped.software = fields.software;
        if ('mantenimiento' in fields) mapped.mantenimiento = fields.mantenimiento;
        return mapped;
    }

    /* ---------- Exportar ---------- */
    return {
        init, getAll, getSlot, updateSlot, bulkUpdate, getStats,
        authenticate, assignRange, save,
        registerUser, updateUserRole, updateUser, deleteUser,
        getUsers, hasPermission, ROLES,
        addTransaction, getTransactions,
        getCarts, getActiveCart, setActiveCart, createCart, deleteCart, getShelfLabel
    };
})();
