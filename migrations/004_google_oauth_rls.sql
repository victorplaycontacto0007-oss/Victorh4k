-- ═══════════════════════════════════════════════════════════════
-- VictorH4K — Migración 004: RLS para Google OAuth
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- Ejecutar DESPUÉS de 001, 002 y 003
-- ═══════════════════════════════════════════════════════════════

-- ── Función que verifica que el usuario autenticado
--    tiene exactamente el email autorizado ────────────────────
CREATE OR REPLACE FUNCTION is_allowed_email()
RETURNS boolean AS $$
BEGIN
  RETURN lower(auth.jwt() ->> 'email') = 'victorplaycontacto0007@gmail.com';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Función combinada: email correcto + perfil admin activo ──
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN is_allowed_email() AND EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE user_id = auth.uid()
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Verificar que el insert en admin_profiles
--    solo lo puede hacer el email autorizado ────────────────────
-- (Eliminar política previa si existe)
DROP POLICY IF EXISTS "admin_profiles_own_read" ON admin_profiles;
DROP POLICY IF EXISTS "admin_self_insert" ON admin_profiles;

-- Leer su propio perfil
CREATE POLICY "admin_profiles_own_read" ON admin_profiles
  FOR SELECT USING (user_id = auth.uid() AND is_allowed_email());

-- Insertar su propio perfil (primera vez con Google OAuth)
CREATE POLICY "admin_self_insert" ON admin_profiles
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND is_allowed_email()
  );

-- Actualizar su propio perfil
CREATE POLICY "admin_self_update" ON admin_profiles
  FOR UPDATE USING (user_id = auth.uid() AND is_allowed_email());

-- ── Confirmar que el email está registrado como proveedor OAuth
-- (esto es informativo — lo habilitas en el dashboard de Supabase)
-- Auth → Providers → Google → Enable

-- ── Verificar configuración ──────────────────────────────────
-- Ejecuta esto para comprobar que la función existe:
-- SELECT is_allowed_email();   -- debe devolver false si no hay sesión
-- SELECT is_admin();           -- debe devolver false si no hay sesión
