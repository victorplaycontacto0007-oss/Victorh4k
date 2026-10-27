-- ═══════════════════════════════════════════════════════════════
-- VictorH4K — Migración 001: Esquema inicial completo
-- Proyecto: wmxmfserrqbxvnvghvnp
-- Fecha: 2026-10-24
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ── Extensiones necesarias ──────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- búsqueda de texto

-- ══════════════════════════════════════════════════════════════════
-- BLOQUE 1: ARTISTAS
-- ══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS artists (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            text NOT NULL,
  slug            text NOT NULL UNIQUE,
  bio             text,
  photo_url       text,               -- URL de imagen (Supabase Storage o externa)
  spotify_id      text,               -- ID en Spotify (para proxy de foto)
  spotify_url     text,
  apple_music_url text,
  youtube_url     text,
  instagram_url   text,
  other_links     jsonb DEFAULT '[]', -- [{label, url}]
  genres          text[]  DEFAULT '{}',
  sort_order      integer DEFAULT 0,
  is_published    boolean DEFAULT false,
  seo_title       text,
  seo_description text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER artists_updated_at
  BEFORE UPDATE ON artists
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ══════════════════════════════════════════════════════════════════
-- BLOQUE 2: LANZAMIENTOS
-- ══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS releases (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           text NOT NULL,
  slug            text NOT NULL UNIQUE,
  description     text,
  cover_url       text,
  release_type    text DEFAULT 'single' CHECK (release_type IN ('single','ep','album','remix')),
  release_date    date,
  spotify_url     text,
  apple_music_url text,
  youtube_url     text,
  deezer_url      text,
  other_links     jsonb DEFAULT '[]',
  sort_order      integer DEFAULT 0,
  status          text DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  seo_title       text,
  seo_description text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE TRIGGER releases_updated_at
  BEFORE UPDATE ON releases
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Tabla intermedia: relación artistas ↔ lanzamientos (muchos a muchos)
CREATE TABLE IF NOT EXISTS release_artists (
  release_id uuid REFERENCES releases(id) ON DELETE CASCADE,
  artist_id  uuid REFERENCES artists(id) ON DELETE CASCADE,
  role       text DEFAULT 'primary',  -- 'primary', 'featured', 'producer'
  PRIMARY KEY (release_id, artist_id)
);

-- ══════════════════════════════════════════════════════════════════
-- BLOQUE 3: OPINIONES/REVIEWS (tabla existente reconocida)
-- ══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS reviews (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       text NOT NULL,
  rating     smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text       text,
  comment    text,   -- alias alternativo guardado desde el código antiguo
  status     text DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  featured   boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ══════════════════════════════════════════════════════════════════
-- BLOQUE 4: RADAR MUSICAL — CATEGORÍAS
-- ══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS radar_categories (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        text NOT NULL,
  slug        text NOT NULL UNIQUE,
  description text,
  sort_order  integer DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

-- Categorías iniciales de Radar Musical
INSERT INTO radar_categories (name, slug, description, sort_order) VALUES
  ('Regalías y pagos', 'regalias-y-pagos',
   'Cuánto pagan las plataformas de streaming por reproducción', 1),
  ('Comparativas de plataformas', 'comparativas-plataformas',
   'Análisis comparativo entre servicios de streaming musical', 2),
  ('Distribución digital', 'distribucion-digital',
   'Guías de distribución musical y monetización', 3),
  ('Noticias de la industria', 'noticias-industria',
   'Novedades y tendencias del sector musical', 4),
  ('Guías para artistas', 'guias-artistas',
   'Recursos prácticos para artistas independientes', 5)
ON CONFLICT (slug) DO NOTHING;

-- ══════════════════════════════════════════════════════════════════
-- BLOQUE 5: RADAR MUSICAL — ETIQUETAS
-- ══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS radar_tags (
  id   uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE
);

-- ══════════════════════════════════════════════════════════════════
-- BLOQUE 6: RADAR MUSICAL — ARTÍCULOS
-- ══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS radar_articles (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title             text NOT NULL,
  slug              text NOT NULL UNIQUE,
  excerpt           text,
  content           text,              -- HTML sanitizado
  featured_image    text,
  featured_image_alt text DEFAULT '',
  category_id       uuid REFERENCES radar_categories(id) ON DELETE SET NULL,
  author_name       text DEFAULT 'VictorH4K',
  author_email      text,
  status            text DEFAULT 'draft'
                    CHECK (status IN ('draft','published','archived')),
  published_at      timestamptz,
  scheduled_at      timestamptz,       -- programar publicación
  -- SEO
  seo_title         text,
  seo_description   text,
  canonical_url     text,
  -- Metadatos
  sources           jsonb DEFAULT '[]',  -- [{title, url, date}]
  reading_time_min  integer DEFAULT 0,
  view_count        integer DEFAULT 0,
  -- Timestamps
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

CREATE TRIGGER radar_articles_updated_at
  BEFORE UPDATE ON radar_articles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Relación artículos ↔ tags
CREATE TABLE IF NOT EXISTS radar_article_tags (
  article_id uuid REFERENCES radar_articles(id) ON DELETE CASCADE,
  tag_id     uuid REFERENCES radar_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);

-- Artículos relacionados
CREATE TABLE IF NOT EXISTS radar_related_articles (
  article_id uuid REFERENCES radar_articles(id) ON DELETE CASCADE,
  related_id uuid REFERENCES radar_articles(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, related_id),
  CHECK (article_id <> related_id)
);

-- ══════════════════════════════════════════════════════════════════
-- BLOQUE 7: CONFIGURACIÓN GENERAL DE LA WEB
-- ══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS site_config (
  key        text PRIMARY KEY,
  value      text,
  updated_at timestamptz DEFAULT now()
);

INSERT INTO site_config (key, value) VALUES
  ('site_title',          'VictorH4K'),
  ('site_description',    'Subsello musical. Colombia.'),
  ('contact_whatsapp',    '573026021232'),
  ('contact_instagram',   'https://www.instagram.com/victorh4k/'),
  ('contact_youtube',     'https://www.youtube.com/@VictorH4K'),
  ('radar_title',         'Radar Musical'),
  ('radar_description',   'Portal informativo sobre la industria musical, regalías y distribución digital.'),
  ('radar_og_image',      '/images/og-image.png')
ON CONFLICT (key) DO NOTHING;

-- ══════════════════════════════════════════════════════════════════
-- BLOQUE 8: DATOS INICIALES DE ARTISTAS (hardcodeados → DB)
-- ══════════════════════════════════════════════════════════════════

INSERT INTO artists (name, slug, bio, spotify_id, spotify_url, genres, sort_order, is_published) VALUES
  (
    'Jack Holy',
    'jack-holy',
    'Pop, Trap y R&B con distribución global. Su música está disponible en más de 150 plataformas digitales a través del subsello VictorH4K.',
    '6DJGyCs8tE5gBsnz9QMjns',
    'https://open.spotify.com/artist/6DJGyCs8tE5gBsnz9QMjns',
    ARRAY['Pop','Trap','R&B'],
    1,
    true
  ),
  (
    'VictorH4K Producer',
    'victorh4k-producer',
    'Productor musical con lanzamientos en EDM y Reggaetón. Fundador del subsello VictorH4K con distribución digital global.',
    '4uDSnTqKriGk7plg6LuFku',
    'https://open.spotify.com/artist/4uDSnTqKriGk7plg6LuFku',
    ARRAY['Producción','EDM','Reggaetón'],
    2,
    true
  ),
  (
    'joseneiman',
    'joseneiman',
    'Artista de Pop y R&B con presencia en las principales plataformas de streaming. Distribución bajo el subsello VictorH4K.',
    '52DXUNl2kPMEMTP8ORleFU',
    'https://open.spotify.com/artist/52DXUNl2kPMEMTP8ORleFU',
    ARRAY['Pop','R&B'],
    3,
    true
  )
ON CONFLICT (slug) DO NOTHING;

-- ══════════════════════════════════════════════════════════════════
-- BLOQUE 9: ÍNDICES PARA RENDIMIENTO
-- ══════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_artists_published    ON artists(is_published, sort_order);
CREATE INDEX IF NOT EXISTS idx_artists_slug         ON artists(slug);
CREATE INDEX IF NOT EXISTS idx_releases_status      ON releases(status, release_date DESC);
CREATE INDEX IF NOT EXISTS idx_releases_slug        ON releases(slug);
CREATE INDEX IF NOT EXISTS idx_radar_status_pub     ON radar_articles(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_radar_slug           ON radar_articles(slug);
CREATE INDEX IF NOT EXISTS idx_radar_category       ON radar_articles(category_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status       ON reviews(status, created_at DESC);

-- Búsqueda de texto en artículos
CREATE INDEX IF NOT EXISTS idx_radar_fts ON radar_articles
  USING gin(to_tsvector('spanish', coalesce(title,'') || ' ' || coalesce(excerpt,'') || ' ' || coalesce(content,'')));
