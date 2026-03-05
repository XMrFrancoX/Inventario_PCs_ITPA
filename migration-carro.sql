-- ============================================
-- Migración: Agregar MAC Address a Carros
-- ============================================
-- Ejecutar en Supabase Dashboard → SQL Editor → New Query → Pegar → Run
--
-- Esta migración agrega el campo 'mac_address' a la tabla 'carts'
-- para permitir vincular una dirección de red física al carro.

ALTER TABLE carts ADD COLUMN IF NOT EXISTS mac_address TEXT DEFAULT '';

-- Listo. Ahora los carros pueden guardar su dirección MAC.
