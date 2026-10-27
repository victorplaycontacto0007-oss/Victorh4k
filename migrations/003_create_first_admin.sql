-- ═══════════════════════════════════════════════════════════════
-- VictorH4K — Migración 003: Crear primer administrador
-- Instrucciones:
--   1. Ve a Supabase Dashboard → Authentication → Users
--   2. Click "Add user" → Email + contraseña segura
--   3. Copia el UUID del usuario creado
--   4. Reemplaza 'PEGAR-UUID-AQUI' con ese UUID
--   5. Ejecuta este script
-- ═══════════════════════════════════════════════════════════════

-- EDITAR ANTES DE EJECUTAR:
INSERT INTO admin_profiles (user_id, full_name, is_active)
VALUES (
  '5c33f4c8-5240-4184-b26e-8589166802da',  -- <── reemplaza con el UUID del usuario
  'Victor',
  true
)
ON CONFLICT (user_id) DO UPDATE SET is_active = true;

-- Verificar que se creó:
-- SELECT ap.*, au.email
-- FROM admin_profiles ap
-- JOIN auth.users au ON ap.user_id = au.id;
