/**
 * VictorH4K — Servidor local de desarrollo
 * Uso: node server.js
 * Acceder en: http://localhost:3000
 *
 * Rutas disponibles:
 *   GET /                   → página principal
 *   GET /artistas/          → sección artistas
 *   GET /api/spotify-artist?id=<artistId>  → proxy seguro a Spotify API
 *   GET /api/spotify-status → estado de la integración Spotify
 */
const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');
const url   = require('url');

const ROOT = path.join(__dirname, 'Victorh4k');
const PORT = 3000;

/* ─── Leer credenciales desde .env.local ─────────────────────────────── */
function loadEnv(filePath) {
  const env = {};
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    raw.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eq = trimmed.indexOf('=');
      if (eq === -1) return;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      env[key] = val;
    });
  } catch (e) { /* archivo no existe */ }
  return env;
}

const envFile = path.join(__dirname, '.env.local');
const ENV = loadEnv(envFile);

const SPOTIFY_CLIENT_ID     = ENV.SPOTIFY_CLIENT_ID     || '';
const SPOTIFY_CLIENT_SECRET = ENV.SPOTIFY_CLIENT_SECRET || '';
const spotifyConfigured = SPOTIFY_CLIENT_ID.length > 4 && SPOTIFY_CLIENT_SECRET.length > 4
  && SPOTIFY_CLIENT_ID !== 'TU_CLIENT_ID_AQUI';

/* ─── Caché en memoria para tokens y datos de artistas ───────────────── */
const tokenCache  = { token: null, expiresAt: 0 };
const artistCache = new Map(); // id → { data, cachedAt }
const ARTIST_CACHE_TTL = 3600 * 1000; // 1 hora

/* ─── Utilidad: petición HTTPS ────────────────────────────────────────── */
function httpsRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let raw = '';
      res.on('data', d => { raw += d; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch (e) { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

/* ─── Obtener token OAuth2 (Client Credentials) ──────────────────────── */
async function getSpotifyToken() {
  if (tokenCache.token && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token;
  }
  const credentials = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');
  const body = 'grant_type=client_credentials';
  const resp = await httpsRequest({
    hostname: 'accounts.spotify.com',
    path:     '/api/token',
    method:   'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type':  'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(body),
    },
  }, body);

  if (resp.status !== 200 || !resp.body.access_token) {
    throw new Error(`Spotify token error ${resp.status}: ${JSON.stringify(resp.body)}`);
  }
  tokenCache.token     = resp.body.access_token;
  tokenCache.expiresAt = Date.now() + (resp.body.expires_in - 60) * 1000;
  return tokenCache.token;
}

/* ─── Obtener datos del artista desde Spotify ────────────────────────── */
async function fetchSpotifyArtist(artistId) {
  /* Validar ID: solo caracteres alfanuméricos */
  if (!/^[A-Za-z0-9]{1,40}$/.test(artistId)) {
    throw new Error('Artist ID inválido');
  }
  /* Revisar caché */
  const cached = artistCache.get(artistId);
  if (cached && Date.now() - cached.cachedAt < ARTIST_CACHE_TTL) {
    return cached.data;
  }
  const token = await getSpotifyToken();
  const resp = await httpsRequest({
    hostname: 'api.spotify.com',
    path:     `/v1/artists/${artistId}`,
    method:   'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (resp.status !== 200) {
    throw new Error(`Spotify API error ${resp.status}`);
  }
  /* Guardar solo los campos necesarios (sin datos sensibles) */
  const data = {
    id:         resp.body.id,
    name:       resp.body.name,
    popularity: resp.body.popularity,
    followers:  resp.body.followers?.total ?? 0,
    genres:     resp.body.genres ?? [],
    images:     resp.body.images ?? [],
    external_url: resp.body.external_urls?.spotify ?? '',
  };
  artistCache.set(artistId, { data, cachedAt: Date.now() });
  return data;
}

/* ─── MIME types ─────────────────────────────────────────────────────── */
const MIME = {
  '.html':        'text/html; charset=utf-8',
  '.css':         'text/css; charset=utf-8',
  '.js':          'application/javascript; charset=utf-8',
  '.json':        'application/json; charset=utf-8',
  '.png':         'image/png',
  '.jpg':         'image/jpeg',
  '.jpeg':        'image/jpeg',
  '.gif':         'image/gif',
  '.svg':         'image/svg+xml',
  '.ico':         'image/x-icon',
  '.webp':        'image/webp',
  '.xml':         'application/xml',
  '.txt':         'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.woff':        'font/woff',
  '.woff2':       'font/woff2',
};

/* ─── Redirecciones 301 ───────────────────────────────────────────────── */
const REDIRECTS = {
  '/music/':      '/artistas/',
  '/music':       '/artistas/',
  '/digital/':    '/',
  '/digital':     '/',
  '/proyectos/':  '/lanzamientos/',
  '/proyectos':   '/lanzamientos/',
  '/nosotros/':   '/el-sello/',
  '/nosotros':    '/el-sello/',
};

/* ─── Cabeceras de seguridad ─────────────────────────────────────────── */
function securityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
}

function escapeHtml(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function jsonResponse(res, status, data) {
  securityHeaders(res);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(data));
}

/* ─── Servidor principal ─────────────────────────────────────────────── */
const server = http.createServer(async (req, res) => {
  const parsed   = url.parse(req.url, true);
  const pathname = decodeURIComponent(parsed.pathname).replace(/\.\./g, '');

  /* ── Ruta API: estado de Spotify ── */
  if (pathname === '/api/spotify-status') {
    return jsonResponse(res, 200, {
      configured: spotifyConfigured,
      message: spotifyConfigured
        ? 'Spotify API configurada correctamente.'
        : 'Credenciales no configuradas. Edita .env.local con tus datos de developer.spotify.com',
      cacheSize: artistCache.size,
    });
  }

  /* ── Ruta API: datos de artista Spotify ── */
  if (pathname === '/api/spotify-artist') {
    if (!spotifyConfigured) {
      return jsonResponse(res, 503, {
        error: 'spotify_not_configured',
        message: 'Credenciales de Spotify no configuradas en .env.local',
      });
    }
    const artistId = (parsed.query.id || '').trim();
    if (!artistId) {
      return jsonResponse(res, 400, { error: 'missing_id', message: 'Parámetro id requerido' });
    }
    try {
      const data = await fetchSpotifyArtist(artistId);
      securityHeaders(res);
      res.writeHead(200, {
        'Content-Type':  'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      });
      return res.end(JSON.stringify(data));
    } catch (e) {
      console.error(`[Spotify] Error para ID ${artistId}:`, e.message);
      return jsonResponse(res, 502, { error: 'spotify_error', message: e.message });
    }
  }

  /* ── Ruta API: generar artículo estático (SEO) ── */
  if (pathname === '/api/generate-article' && req.method === 'POST') {
    const articleId = (parsed.query.id || '').trim();
    if (!articleId || !/^[a-f0-9-]{36}$/.test(articleId)) return jsonResponse(res, 400, { error: 'invalid_id' });
    try {
      const sbHost = 'wmxmfserrqbxvnvghvnp.supabase.co';
      const sbKey  = ENV.SUPABASE_ANON_KEY || '';
      const apiPath = `/rest/v1/radar_articles?id=eq.${encodeURIComponent(articleId)}&select=*,radar_categories(name,slug)`;
      const apiResp = await httpsRequest({
        hostname: sbHost, path: apiPath, method: 'GET',
        headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}` },
      });
      if (!apiResp.body?.length) return jsonResponse(res, 404, { error: 'not_found' });
      const article = apiResp.body[0];
      if (article.status !== 'published') return jsonResponse(res, 400, { error: 'not_published' });

      const slug      = article.slug;
      const seoTitle  = article.seo_title  || `${article.title} — Radar Musical`;
      const seoDesc   = article.seo_description || article.excerpt || '';
      const canonical = article.canonical_url || `https://victorh4k.com/radar-musical/${slug}/`;
      const pubDate   = article.published_at || new Date().toISOString();

      const articleDir = path.join(ROOT, 'radar-musical', slug);
      if (!fs.existsSync(articleDir)) fs.mkdirSync(articleDir, { recursive: true });

      const ld = JSON.stringify({
        '@context':'https://schema.org','@type':'Article',
        headline: article.title, description: seoDesc,
        datePublished: pubDate, dateModified: article.updated_at || pubDate,
        author: { '@type':'Person', name: article.author_name || 'VictorH4K' },
        publisher: { '@type':'Organization', name:'VictorH4K', url:'https://victorh4k.com' },
        mainEntityOfPage: { '@type':'WebPage', '@id': canonical },
        ...(article.featured_image ? { image: article.featured_image } : {}),
      });

      const html = '<!DOCTYPE html>\n<html lang="es">\n<head>\n' +
        '<meta charset="UTF-8"/>\n' +
        '<meta name="viewport" content="width=device-width,initial-scale=1.0"/>\n' +
        '<title>' + escapeHtml(seoTitle) + '</title>\n' +
        '<meta name="description" content="' + escapeHtml(seoDesc) + '"/>\n' +
        '<meta name="robots" content="index, follow"/>\n' +
        '<link rel="canonical" href="' + escapeHtml(canonical) + '"/>\n' +
        '<link rel="icon" href="/favicon.ico"/>\n' +
        '<meta property="og:type" content="article"/>\n' +
        '<meta property="og:url" content="' + escapeHtml(canonical) + '"/>\n' +
        '<meta property="og:title" content="' + escapeHtml(article.title) + '"/>\n' +
        '<meta property="og:description" content="' + escapeHtml(seoDesc) + '"/>\n' +
        '<meta property="og:image" content="' + escapeHtml(article.featured_image || 'https://victorh4k.com/images/og-image.png') + '"/>\n' +
        '<meta property="article:published_time" content="' + escapeHtml(pubDate) + '"/>\n' +
        '<meta property="article:modified_time" content="' + escapeHtml(article.updated_at || pubDate) + '"/>\n' +
        '<script type="application/ld+json">' + ld + '<\/script>\n' +
        '<link rel="preconnect" href="https://fonts.googleapis.com"/>\n' +
        '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>\n' +
        '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Syne:wght@700;800&display=swap" rel="stylesheet"/>\n' +
        '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" crossorigin="anonymous"/>\n' +
        '<link rel="stylesheet" href="/shared.css"/>\n' +
        '<noscript><style>#art-content-static{display:block!important}</style></noscript>\n' +
        '</head>\n<body>\n' +
        '<div id="art-content-static" style="display:none;padding:40px 20px;max-width:760px;margin:0 auto;font-family:Inter,sans-serif">\n' +
        '<h1 style="font-size:32px;font-weight:800;margin-bottom:20px">' + escapeHtml(article.title) + '</h1>\n' +
        (article.excerpt ? '<p style="font-size:17px;color:#444;margin-bottom:20px;font-style:italic">' + escapeHtml(article.excerpt) + '</p>\n' : '') +
        '<div>' + (article.content || '') + '</div>\n</div>\n' +
        '<script>\n(function(){var s="' + slug.replace(/"/g,'\\"') + '";location.replace("/radar-musical/articulo/?slug="+encodeURIComponent(s));})();\n<\/script>\n' +
        '</body>\n</html>';

      fs.writeFileSync(path.join(articleDir, 'index.html'), html, 'utf8');
      console.log(`[Generate] /radar-musical/${slug}/ creado`);
      return jsonResponse(res, 200, { ok: true, path: `/radar-musical/${slug}/` });
    } catch(e) {
      console.error('[Generate] Error:', e.message);
      return jsonResponse(res, 500, { error: e.message });
    }
  }

  /* ── Redirecciones 301 ── */
  if (REDIRECTS[pathname]) {
    securityHeaders(res);
    res.writeHead(301, { Location: REDIRECTS[pathname] });
    res.end();
    console.log(`[${new Date().toLocaleTimeString('es')}] ${req.method} ${pathname} → 301 ${REDIRECTS[pathname]}`);
    return;
  }

  /* ── Archivos estáticos ── */
  let filePath = path.join(ROOT, pathname);
  if (pathname.endsWith('/') || (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory())) {
    filePath = path.join(filePath, 'index.html');
  }
  const ext  = path.extname(filePath).toLowerCase();
  const mime = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      const fallback = path.join(ROOT, '404.html');
      fs.readFile(fallback, (_e2, d2) => {
        securityHeaders(res);
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(d2 || '<h1>404 — Página no encontrada</h1><p><a href="/">Volver al inicio</a></p>');
        console.log(`[${new Date().toLocaleTimeString('es')}] ${req.method} ${pathname} → 404`);
      });
      return;
    }
    securityHeaders(res);
    res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'no-cache' });
    res.end(data);
    console.log(`[${new Date().toLocaleTimeString('es')}] ${req.method} ${pathname} → 200`);
  });
});

server.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════════');
  console.log('   VictorH4K — Subsello Musical');
  console.log('   Servidor local de desarrollo');
  console.log('═══════════════════════════════════════════════');
  console.log(`   URL:   http://localhost:${PORT}/`);
  console.log('   Stop:  Ctrl + C');
  console.log('═══════════════════════════════════════════════');
  if (spotifyConfigured) {
    console.log('   Spotify API: ✓ Configurada');
  } else {
    console.log('   Spotify API: ✗ Sin credenciales (.env.local)');
    console.log('   → Edita .env.local con tus datos de developer.spotify.com');
  }
  console.log('═══════════════════════════════════════════════');
  console.log('');
  console.log('Páginas:');
  console.log('  http://localhost:3000/             — Inicio');
  console.log('  http://localhost:3000/artistas/    — Artistas');
  console.log('  http://localhost:3000/lanzamientos/— Lanzamientos');
  console.log('  http://localhost:3000/el-sello/    — El sello');
  console.log('  http://localhost:3000/contacto/    — Contacto');
  console.log('');
  console.log('API endpoints:');
  console.log('  GET /api/spotify-status');
  console.log('  GET /api/spotify-artist?id=<artistId>');
  console.log('');
});
