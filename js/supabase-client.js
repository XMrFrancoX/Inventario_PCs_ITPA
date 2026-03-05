/**
 * supabase-client.js — Inicialización del cliente Supabase
 */

const SUPABASE_URL = 'https://jdmsecfdhbnzzycdwxvc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkbXNlY2ZkaGJuenp5Y2R3eHZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NzgzNDcsImV4cCI6MjA4ODI1NDM0N30.vdDYJG-qFKbBdb0A2yOl8vxKbo9wzltuB2ibj8eYLJ8';

// Use a different variable name to avoid collision with window.supabase (the library)
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
console.log('[Supabase] Client initialized:', !!db);
