-- ===========================================
-- ITPA Inventario PCs — Schema para Supabase
-- ===========================================
-- Pegar este SQL completo en el SQL Editor de Supabase
-- (Dashboard → SQL Editor → New Query → Pegar → Run)

-- 1. Habilitar pgcrypto para hash de contraseñas
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Tabla de usuarios
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'pending' CHECK (role IN ('admin', 'editor', 'viewer', 'pending')),
    is_master BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Insertar cuenta administrador por defecto
INSERT INTO users (username, password_hash, full_name, role, is_master)
VALUES (
    'admin',
    crypt('admin', gen_salt('bf')),
    'Administrador ITPA',
    'admin',
    TRUE
);

-- 4. Tabla de carros
CREATE TABLE carts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    shelves TEXT[] NOT NULL DEFAULT '{superior,inferior}',
    slots_per_shelf INTEGER NOT NULL DEFAULT 20,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Insertar carro principal por defecto
INSERT INTO carts (name, shelves, slots_per_shelf)
VALUES ('Carro Principal', '{superior,inferior}', 20);

-- 6. Tabla de slots (inventario)
CREATE TABLE slots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    shelf TEXT NOT NULL,
    slot_index INTEGER NOT NULL,
    laptop_id TEXT DEFAULT '',
    status TEXT DEFAULT 'vacio' CHECK (status IN ('vacio', 'almacenada', 'enuso', 'excepcion', 'staff')),
    responsable TEXT DEFAULT '',
    curso TEXT DEFAULT '',
    hora TEXT DEFAULT '',
    entregado_por TEXT DEFAULT '',
    ubicacion TEXT DEFAULT '',
    marca TEXT DEFAULT '',
    modelo TEXT DEFAULT '',
    serie TEXT DEFAULT '',
    mac TEXT DEFAULT '',
    ip TEXT DEFAULT '',
    admin_local TEXT DEFAULT '',
    bios_pass TEXT DEFAULT '',
    observaciones TEXT DEFAULT '',
    cpu TEXT DEFAULT '',
    ram TEXT DEFAULT '',
    storage_info TEXT DEFAULT '',
    software JSONB DEFAULT '{"windows":false,"office":false,"autocad":false,"solidworks":false,"vscode":false,"arduino":false}',
    mantenimiento JSONB DEFAULT '{"limpiezaInterna":false,"limpiezaExterna":false,"actualizacionSO":false,"actualizacionDrivers":false,"revisionBateria":false,"revisionCargador":false,"revisionPantalla":false,"revisionTeclado":false}',
    UNIQUE(cart_id, shelf, slot_index)
);

-- 7. Generar slots vacíos para el carro principal
DO $$
DECLARE
    cart_uuid UUID;
    shelf_name TEXT;
    i INTEGER;
BEGIN
    SELECT id INTO cart_uuid FROM carts WHERE name = 'Carro Principal' LIMIT 1;
    FOREACH shelf_name IN ARRAY ARRAY['superior', 'inferior']
    LOOP
        FOR i IN 1..20 LOOP
            INSERT INTO slots (cart_id, shelf, slot_index)
            VALUES (cart_uuid, shelf_name, i);
        END LOOP;
    END LOOP;
END $$;

-- 8. Tabla de transacciones
CREATE TABLE transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tipo TEXT NOT NULL CHECK (tipo IN ('clase', 'staff', 'excepcion', 'retorno')),
    equipos TEXT DEFAULT '',
    responsable TEXT DEFAULT '',
    operador TEXT DEFAULT '',
    curso TEXT DEFAULT '',
    destino TEXT DEFAULT '',
    retirante TEXT DEFAULT '',
    observaciones TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Row Level Security (RLS)
-- Habilitar RLS en todas las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Política: cualquier usuario autenticado (con anon key) puede leer todo
-- (la app gestiona permisos a nivel de aplicación con el campo role)
CREATE POLICY "Allow public read" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON users FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON users FOR DELETE USING (true);

CREATE POLICY "Allow public read" ON carts FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON carts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON carts FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON carts FOR DELETE USING (true);

CREATE POLICY "Allow public read" ON slots FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON slots FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON slots FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON slots FOR DELETE USING (true);

CREATE POLICY "Allow public read" ON transactions FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON transactions FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON transactions FOR DELETE USING (true);

-- 10. Función para verificar contraseñas
CREATE OR REPLACE FUNCTION verify_password(p_username TEXT, p_password TEXT)
RETURNS TABLE(id UUID, username TEXT, full_name TEXT, role TEXT, is_master BOOLEAN, created_at TIMESTAMPTZ) AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, u.username, u.full_name, u.role, u.is_master, u.created_at
    FROM users u
    WHERE u.username = p_username
      AND u.password_hash = crypt(p_password, u.password_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Función para registrar usuario con contraseña hasheada
CREATE OR REPLACE FUNCTION register_user(p_username TEXT, p_password TEXT, p_full_name TEXT, p_role TEXT DEFAULT 'viewer')
RETURNS UUID AS $$
DECLARE
    new_id UUID;
BEGIN
    INSERT INTO users (username, password_hash, full_name, role)
    VALUES (p_username, crypt(p_password, gen_salt('bf')), p_full_name, p_role)
    RETURNING id INTO new_id;
    RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Función para actualizar contraseña
CREATE OR REPLACE FUNCTION update_user_password(p_username TEXT, p_new_password TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE users SET password_hash = crypt(p_new_password, gen_salt('bf'))
    WHERE username = p_username;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- MIGRACIÓN: Agregar rol 'pending' (ejecutar solo en DBs existentes)
-- ===========================================
-- ALTER TABLE users DROP CONSTRAINT users_role_check;
-- ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'editor', 'viewer', 'pending'));
