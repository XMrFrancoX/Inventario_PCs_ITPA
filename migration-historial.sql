-- ============================================
-- Migración: Agregar campos al historial de movimientos
-- ============================================
-- Ejecutar en Supabase Dashboard → SQL Editor → New Query → Pegar → Run
--
-- Esta migración agrega los campos faltantes a la tabla 'transactions'
-- para almacenar la información completa del formulario de movimiento.

-- 1. Agregar columnas faltantes
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS curso TEXT DEFAULT '';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS destino TEXT DEFAULT '';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS retirante TEXT DEFAULT '';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS observaciones TEXT DEFAULT '';

-- 2. Agregar políticas de UPDATE y DELETE (si no existen)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transactions' AND policyname = 'Allow public update') THEN
        CREATE POLICY "Allow public update" ON transactions FOR UPDATE USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transactions' AND policyname = 'Allow public delete') THEN
        CREATE POLICY "Allow public delete" ON transactions FOR DELETE USING (true);
    END IF;
END $$;

-- Listo. Ahora el historial guardará todos los datos del formulario.
