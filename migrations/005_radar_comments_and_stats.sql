-- ═══════════════════════════════════════════════════════════════
-- VictorH4K — Migración 005: Comentarios y estadísticas Radar Musical
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- Ejecutar DESPUÉS de 001, 002, 003 y 004
-- ═══════════════════════════════════════════════════════════════
-- POLÍTICA: Solo tablas NUEVAS. Nada de esta migración
-- modifica tablas, columnas, índices, políticas RLS ni funciones
-- que ya existan. Es totalmente aditiva.
-- ═══════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════
-- BLOQUE 1: TABLA DE COMENTARIOS DE ARTÍCULOS
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS radar_article_comments (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id   uuid NOT NULL REFERENCES radar_articles(id) ON DELETE CASCADE,
  author_name  text NOT NULL CHECK (char_length(trim(author_name)) BETWEEN 2 AND 80),
  author_email text CHECK (author_email IS NULL OR author_email ~* '^[^@]+@[^@]+\.[^@]+$'),
  content      text NOT NULL CHECK (char_length(trim(content)) BETWEEN 5 AND 2000),
  status       text NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'approved', 'rejected')),
  ip_hash      text,          -- Hash de IP para detección de duplicados (no datos personales)
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_radar_comments_article ON radar_article_comments(article_id);
CREATE INDEX IF NOT EXISTS idx_radar_comments_status  ON radar_article_comments(status);
CREATE INDEX IF NOT EXISTS idx_radar_comments_created ON radar_article_comments(created_at DESC);

-- RLS activado
ALTER TABLE radar_article_comments ENABLE ROW LEVEL SECURITY;

-- Política: Visitantes pueden insertar comentarios nuevos (siempre quedan en 'pending')
CREATE POLICY "radar_comments_public_insert" ON radar_article_comments
  FOR INSERT WITH CHECK (status = 'pending');

-- Política: Todos pueden leer comentarios aprobados
CREATE POLICY "radar_comments_public_read" ON radar_article_comments
  FOR SELECT USING (status = 'approved');

-- Política: Administradores pueden hacer todo (leer todos los estados, aprobar, rechazar, eliminar)
CREATE POLICY "radar_comments_admin_all" ON radar_article_comments
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ══════════════════════════════════════════════════════════════
-- BLOQUE 2: TABLA DE VISUALIZACIONES (vistas individuales)
-- ══════════════════════════════════════════════════════════════
-- Guarda cada visita con timestamp para permitir análisis temporal.
-- ip_hash permite estimar visitantes únicos sin almacenar IPs reales.
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS radar_article_views (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id  uuid NOT NULL REFERENCES radar_articles(id) ON DELETE CASCADE,
  session_key text,           -- Clave de sesión anónima (localStorage UUID), no rastreable
  ip_hash     text,           -- SHA256 truncado de IP+UserAgent (no reversible)
  viewed_at   timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_radar_views_article ON radar_article_views(article_id);
CREATE INDEX IF NOT EXISTS idx_radar_views_time    ON radar_article_views(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_radar_views_session ON radar_article_views(article_id, session_key)
  WHERE session_key IS NOT NULL;

-- RLS
ALTER TABLE radar_article_views ENABLE ROW LEVEL SECURITY;

-- Visitantes pueden insertar vistas
CREATE POLICY "radar_views_public_insert" ON radar_article_views
  FOR INSERT WITH CHECK (true);

-- Admin puede leer todas las vistas para estadísticas
CREATE POLICY "radar_views_admin_read" ON radar_article_views
  FOR SELECT USING (is_admin());

-- ══════════════════════════════════════════════════════════════
-- BLOQUE 3: TABLA DE COMPARTIDOS
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS radar_article_shares (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id  uuid NOT NULL REFERENCES radar_articles(id) ON DELETE CASCADE,
  platform    text NOT NULL CHECK (platform IN ('twitter','whatsapp','facebook','copy','native')),
  shared_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_radar_shares_article ON radar_article_shares(article_id);

ALTER TABLE radar_article_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "radar_shares_public_insert" ON radar_article_shares
  FOR INSERT WITH CHECK (true);

CREATE POLICY "radar_shares_admin_read" ON radar_article_shares
  FOR SELECT USING (is_admin());

-- ══════════════════════════════════════════════════════════════
-- BLOQUE 4: FUNCIÓN RPC — incrementar view_count
-- ══════════════════════════════════════════════════════════════
-- Necesaria porque RLS en radar_articles no permite UPDATE público.
-- SECURITY DEFINER ejecuta con privilegios del creador de la función.
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION increment_article_view(p_article_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE radar_articles
  SET view_count = view_count + 1
  WHERE id = p_article_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ══════════════════════════════════════════════════════════════
-- BLOQUE 5: FUNCIÓN RPC — registrar vista con deduplicación
-- ══════════════════════════════════════════════════════════════
-- Registra la vista en radar_article_views e incrementa view_count.
-- Si la misma session_key ya visitó el artículo en los últimos 30 min,
-- no registra una vista nueva (evita inflar con recargas).
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION record_article_view(
  p_article_id  uuid,
  p_session_key text DEFAULT NULL,
  p_ip_hash     text DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
  v_already_viewed boolean := false;
BEGIN
  -- Verificar si ya existe una vista reciente de esta sesión (últimos 30 minutos)
  IF p_session_key IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM radar_article_views
      WHERE article_id = p_article_id
        AND session_key = p_session_key
        AND viewed_at > now() - interval '30 minutes'
    ) INTO v_already_viewed;
  END IF;

  IF NOT v_already_viewed THEN
    -- Registrar la vista
    INSERT INTO radar_article_views (article_id, session_key, ip_hash)
    VALUES (p_article_id, p_session_key, p_ip_hash);

    -- Incrementar contador en la tabla principal
    UPDATE radar_articles
    SET view_count = view_count + 1
    WHERE id = p_article_id;

    RETURN true;  -- Vista nueva registrada
  END IF;

  RETURN false;  -- Vista duplicada, no contada
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ══════════════════════════════════════════════════════════════
-- BLOQUE 6: FUNCIÓN RPC — conteo de comentarios por artículo
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_article_comment_counts(p_article_id uuid)
RETURNS TABLE(status text, total bigint) AS $$
  SELECT status, COUNT(*) as total
  FROM radar_article_comments
  WHERE article_id = p_article_id
  GROUP BY status;
$$ LANGUAGE sql SECURITY DEFINER;

-- ══════════════════════════════════════════════════════════════
-- BLOQUE 7: FUNCIÓN RPC — estadísticas completas de un artículo
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_article_stats(p_article_id uuid)
RETURNS json AS $$
DECLARE
  v_result json;
BEGIN
  SELECT json_build_object(
    'total_views',          (SELECT COUNT(*) FROM radar_article_views WHERE article_id = p_article_id),
    'unique_views_est',     (SELECT COUNT(DISTINCT session_key) FROM radar_article_views WHERE article_id = p_article_id AND session_key IS NOT NULL),
    'total_shares',         (SELECT COUNT(*) FROM radar_article_shares WHERE article_id = p_article_id),
    'shares_by_platform',  (SELECT json_object_agg(platform, cnt) FROM (SELECT platform, COUNT(*) as cnt FROM radar_article_shares WHERE article_id = p_article_id GROUP BY platform) x),
    'comments_approved',   (SELECT COUNT(*) FROM radar_article_comments WHERE article_id = p_article_id AND status = 'approved'),
    'comments_pending',    (SELECT COUNT(*) FROM radar_article_comments WHERE article_id = p_article_id AND status = 'pending'),
    'comments_rejected',   (SELECT COUNT(*) FROM radar_article_comments WHERE article_id = p_article_id AND status = 'rejected'),
    'views_last_24h',      (SELECT COUNT(*) FROM radar_article_views WHERE article_id = p_article_id AND viewed_at > now() - interval '24 hours'),
    'views_last_7d',       (SELECT COUNT(*) FROM radar_article_views WHERE article_id = p_article_id AND viewed_at > now() - interval '7 days'),
    'views_last_30d',      (SELECT COUNT(*) FROM radar_article_views WHERE article_id = p_article_id AND viewed_at > now() - interval '30 days')
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ══════════════════════════════════════════════════════════════
-- BLOQUE 8: FUNCIÓN RPC — vistas por día (para gráfico)
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_article_views_by_day(
  p_article_id uuid,
  p_days        integer DEFAULT 30
)
RETURNS TABLE(day date, views bigint) AS $$
  SELECT
    DATE(viewed_at AT TIME ZONE 'America/Bogota') as day,
    COUNT(*) as views
  FROM radar_article_views
  WHERE article_id = p_article_id
    AND viewed_at > now() - (p_days || ' days')::interval
  GROUP BY DATE(viewed_at AT TIME ZONE 'America/Bogota')
  ORDER BY day ASC;
$$ LANGUAGE sql SECURITY DEFINER;

-- ══════════════════════════════════════════════════════════════
-- VERIFICACIÓN FINAL
-- ══════════════════════════════════════════════════════════════
-- Ejecuta estas líneas para verificar que todo se creó bien:
-- SELECT table_name FROM information_schema.tables
--   WHERE table_schema = 'public'
--   AND table_name LIKE 'radar_%'
--   ORDER BY table_name;
--
-- SELECT routine_name FROM information_schema.routines
--   WHERE routine_schema = 'public'
--   AND routine_name LIKE '%article%'
--   ORDER BY routine_name;
