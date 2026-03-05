/**
 * supabase-client.js — Inicialización del cliente Supabase
 *
 * INSTRUCCIONES:
 * 1. Ir a tu proyecto en https://supabase.com
 * 2. Settings → API
 * 3. Copiar "Project URL" y "anon public" key
 * 4. Pegarlos abajo
 */

const SUPABASE_URL = 'TU_SUPABASE_URL_AQUI';
const SUPABASE_ANON_KEY = 'TU_SUPABASE_ANON_KEY_AQUI';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
