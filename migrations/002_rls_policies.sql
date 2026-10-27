-- ═══════════════════════════════════════════════════════════════
-- VictorH4K — Migración 002: Políticas RLS
-- Ejecutar DESPUÉS de 001_initial_schema.sql
-- ═══════════════════════════════════════════════════════════════

-- ── Activar RLS en todas las tablas ─────────────────────────────
ALTER TABLE artists              ENABLE ROW LEVEL SECURITY;
ALTER TABLE releases             ENABLE ROW LEVEL SECURITY;
ALTER TABLE release_artists      ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews              ENABLE ROW LEVEL SECURITY;
ALTER TABLE radar_categories     ENABLE ROW LEVEL SECURITY;
ALTER TABLE radar_tags           ENABLE ROW LEVEL SECURITY;
ALTER TABLE radar_articles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE radar_article_tags   ENABLE ROW LEVEL SECURITY;
ALTER TABLE radar_related_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_config          ENABLE ROW LEVEL SECURITY;

-- ══════════════════════════════════════════════════════════════════
-- POLÍTICAS PÚBLICAS (lectura sin autenticación)
-- Solo datos publicados son visibles al público
-- ══════════════════════════════════════════════════════════════════

-- Artistas publicados → público puede leer
CREATE POLICY "artists_public_read" ON artists
  FOR SELECT USING (is_published = true);

-- Lanzamientos publicados → público puede leer
CREATE POLICY "releases_public_read" ON releases
  FOR SELECT USING (status = 'published');

-- Relación release_artists → público puede leer (filtra por JOIN)
CREATE POLICY "release_artists_public_read" ON release_artists
  FOR SELECT USING (true);

-- Opiniones aprobadas → público puede leer
CREATE POLICY "reviews_public_read" ON reviews
  FOR SELECT USING (status = 'approved');

-- Opiniones → público puede insertar (enviar reseña)
CREATE POLICY "reviews_public_insert" ON reviews
  FOR INSERT WITH CHECK (status = 'pending' AND featured = false);

-- Categorías → siempre públicas
CREATE POLICY "radar_categories_public_read" ON radar_categories
  FOR SELECT USING (true);

-- Tags → siempre públicos
CREATE POLICY "radar_tags_public_read" ON radar_tags
  FOR SELECT USING (true);

-- Artículos publicados → público puede leer
CREATE POLICY "radar_articles_public_read" ON radar_articles
  FOR SELECT USING (status = 'published' AND published_at <= now());

-- Article tags → público puede leer
CREATE POLICY "radar_article_tags_public_read" ON radar_article_tags
  FOR SELECT USING (true);

-- Related articles → público puede leer
CREATE POLICY "radar_related_public_read" ON radar_related_articles
  FOR SELECT USING (true);

-- Site config → público puede leer (no hay secretos aquí)
CREATE POLICY "site_config_public_read" ON site_config
  FOR SELECT USING (true);

-- ══════════════════════════════════════════════════════════════════
-- POLÍTICAS ADMIN (escritura → solo usuarios autenticados con rol admin)
-- ══════════════════════════════════════════════════════════════════

-- Función helper para verificar rol admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  -- Verificar que el usuario esté en la tabla de perfiles admin
  -- auth.uid() devuelve el UUID del usuario autenticado
  RETURN EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE user_id = auth.uid()
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Tabla de perfiles admin
CREATE TABLE IF NOT EXISTS admin_profiles (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  text,
  is_active  boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;

-- Admin puede ver su propio perfil
CREATE POLICY "admin_profiles_own_read" ON admin_profiles
  FOR SELECT USING (user_id = auth.uid());

-- ── Artistas: admin puede todo ──────────────────────────────────
CREATE POLICY "artists_admin_all" ON artists
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ── Lanzamientos: admin puede todo ─────────────────────────────
CREATE POLICY "releases_admin_all" ON releases
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "release_artists_admin_all" ON release_artists
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ── Opiniones: admin puede gestionar ────────────────────────────
CREATE POLICY "reviews_admin_all" ON reviews
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ── Radar: admin puede todo ─────────────────────────────────────
CREATE POLICY "radar_categories_admin_all" ON radar_categories
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "radar_tags_admin_all" ON radar_tags
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "radar_articles_admin_all" ON radar_articles
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "radar_article_tags_admin_all" ON radar_article_tags
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "radar_related_admin_all" ON radar_related_articles
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "site_config_admin_write" ON site_config
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ══════════════════════════════════════════════════════════════════
-- NOTA: Para crear el primer administrador, ejecutar después:
-- 003_create_first_admin.sql
-- (con el UUID del usuario creado en Authentication → Users)
-- ══════════════════════════════════════════════════════════════════
