'use strict';
/* ═══════════════════════════════════════════════════════
   VictorH4K — Admin Core JS
   Cargado en todas las páginas del panel admin
   ═══════════════════════════════════════════════════════ */

const SB_URL = 'https://wmxmfserrqbxvnvghvnp.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndteG1mc2VycnFieHZudmdodm5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4MTkyNjIsImV4cCI6MjEwODM5NTI2Mn0.vs4x3wDM_oIV3UPm7T4NRCVwLjKVPO_d99Vue42KhP4';

// Supabase client (cargado desde CDN antes de este script)
let sb;
try { sb = supabase.createClient(SB_URL, SB_KEY); } catch(e) { console.error('Supabase no disponible'); }

/* ── Auth guard: redirige al login si no hay sesión ─────────── */
async function requireAuth() {
  if (!sb) { location.href = '/admin/'; return null; }
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { location.href = '/admin/'; return null; }

  // ── Verificar email autorizado ──────────────────────────────
  const ALLOWED_EMAIL = 'victorplaycontacto0007@gmail.com';
  const userEmail = session.user.email?.toLowerCase().trim();
  if (userEmail !== ALLOWED_EMAIL.toLowerCase()) {
    await sb.auth.signOut();
    location.href = '/admin/?error=no_access';
    return null;
  }

  // ── Verificar que el usuario tiene rol admin activo ──────────
  const { data: profile, error } = await sb
    .from('admin_profiles')
    .select('*')
    .eq('user_id', session.user.id)
    .eq('is_active', true)
    .single();

  if (error || !profile) {
    await sb.auth.signOut();
    location.href = '/admin/?error=no_access';
    return null;
  }
  return { session, profile };
}

/* ── Logout ──────────────────────────────────────────────────── */
async function adminLogout() {
  if (sb) await sb.auth.signOut();
  location.href = '/admin/';
}

/* ── Toast notifications ─────────────────────────────────────── */
function toast(msg, type = 'success') {
  const container = document.getElementById('a-toast') || (() => {
    const el = document.createElement('div');
    el.id = 'a-toast';
    document.body.appendChild(el);
    return el;
  })();
  const icon = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
  const item = document.createElement('div');
  item.className = `a-toast-item ${type}`;
  item.innerHTML = `<i class="fas ${icon}"></i> ${escHtml(msg)}`;
  container.appendChild(item);
  setTimeout(() => { item.style.opacity = '0'; item.style.transition = 'opacity 0.3s'; setTimeout(() => item.remove(), 300); }, 3500);
}

/* ── XSS escaping ────────────────────────────────────────────── */
function escHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
}

/* ── Generar slug desde título ───────────────────────────────── */
function makeSlug(title) {
  return title
    .toLowerCase()
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

/* ── Calcular tiempo de lectura ──────────────────────────────── */
function readingTime(htmlContent) {
  const text = htmlContent.replace(/<[^>]+>/g, ' ');
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

/* ── Formato de fecha ────────────────────────────────────────── */
function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es', { year: 'numeric', month: 'short', day: 'numeric' });
}

/* ── Upload de imagen a Supabase Storage ─────────────────────── */
async function uploadImage(file, bucket, folder) {
  if (!file) return null;
  const MAX_MB = 5;
  if (file.size > MAX_MB * 1024 * 1024) { toast(`La imagen supera los ${MAX_MB} MB`, 'error'); return null; }
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowed.includes(file.type)) { toast('Formato no permitido. Usa JPG, PNG, WebP o GIF.', 'error'); return null; }

  const ext  = file.name.split('.').pop().toLowerCase();
  const name = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { data, error } = await sb.storage.from(bucket).upload(name, file, { upsert: false });
  if (error) { toast('Error subiendo imagen: ' + error.message, 'error'); return null; }
  const { data: { publicUrl } } = sb.storage.from(bucket).getPublicUrl(name);
  return publicUrl;
}

/* ── Sidebar mobile toggle ───────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.querySelector('.a-sidebar');
  const toggle  = document.getElementById('a-menu-toggle');
  if (toggle && sidebar) {
    toggle.addEventListener('click', () => sidebar.classList.toggle('open'));
    document.addEventListener('click', e => {
      if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target !== toggle) {
        sidebar.classList.remove('open');
      }
    });
  }

  // Marcar enlace activo en nav
  const current = location.pathname.replace(/\/$/, '');
  document.querySelectorAll('.a-nav a').forEach(a => {
    const href = a.getAttribute('href').replace(/\/$/, '');
    if (href === current || (href !== '/admin' && current.startsWith(href))) {
      a.classList.add('active');
    }
  });
});

/* ── Componente de nav lateral compartido ────────────────────── */
function renderAdminNav(activeSection) {
  return `
  <aside class="a-sidebar">
    <div class="a-sidebar-logo">
      <div class="logo-mark">VH</div>
      <div>
        <div class="logo-text">VictorH4K</div>
        <div class="logo-sub">Panel Admin</div>
      </div>
    </div>
    <nav class="a-nav">
      <div class="a-nav-section">Principal</div>
      <a href="/admin/dashboard.html" class="${activeSection==='dashboard'?'active':''}">
        <i class="fas fa-chart-bar"></i> Dashboard
      </a>
      <div class="a-nav-section">Subsello Musical</div>
      <a href="/admin/artistas.html" class="${activeSection==='artistas'?'active':''}">
        <i class="fas fa-users"></i> Artistas
      </a>
      <a href="/admin/lanzamientos.html" class="${activeSection==='lanzamientos'?'active':''}">
        <i class="fas fa-compact-disc"></i> Lanzamientos
      </a>
      <a href="/admin/reviews.html" class="${activeSection==='reviews'?'active':''}">
        <i class="fas fa-star"></i> Opiniones
      </a>
      <div class="a-nav-section">Radar Musical</div>
      <a href="/admin/radar-articulos.html" class="${activeSection==='radar'?'active':''}">
        <i class="fas fa-newspaper"></i> Artículos
      </a>
      <a href="/admin/radar-categorias.html" class="${activeSection==='categorias'?'active':''}">
        <i class="fas fa-tag"></i> Categorías
      </a>
      <div class="a-nav-section">Configuración</div>
      <a href="/admin/configuracion.html" class="${activeSection==='config'?'active':''}">
        <i class="fas fa-cog"></i> General
      </a>
    </nav>
    <div class="a-sidebar-footer">
      <a href="/" target="_blank"><i class="fas fa-external-link-alt"></i> Ver sitio</a>
      <a href="#" onclick="adminLogout()" style="margin-top:8px">
        <i class="fas fa-sign-out-alt"></i> Cerrar sesión
      </a>
    </div>
  </aside>`;
}
