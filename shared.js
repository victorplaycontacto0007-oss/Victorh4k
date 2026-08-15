'use strict';
/* ── SUPABASE CONFIG ─── */
const SB_URL   = 'https://qejdkzmanvcolfignqiq.supabase.co';
const SB_KEY   = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlamRrem1hbnZjb2xmaWducWlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2NjAyMjcsImV4cCI6MjA5NzIzNjIyN30.XSGLfFlU-KgiRGuH-IjyITFRDvwIidqjzOQ_eXX8CSo';
const ADMIN_PW = 'victorh4k2025';
let sb = null;
try { if (window.supabase) sb = window.supabase.createClient(SB_URL, SB_KEY); } catch(e) {}

/* ── LOADER (solo index) ─── */
window.addEventListener('load', () => {
  const loader = document.getElementById('loader');
  if (!loader) return;
  setTimeout(() => {
    loader.classList.add('out');
    document.body.style.overflow = '';
    setTimeout(() => { loader.style.display = 'none'; }, 700);
  }, 1000);
});
if (document.getElementById('loader')) document.body.style.overflow = 'hidden';

/* ── NAVBAR ─── */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 40);
  const bt = document.getElementById('back-top');
  if (bt) bt.classList.toggle('visible', window.scrollY > 500);
}, { passive: true });

/* ── MOBILE MENU ─── */
const burger = document.getElementById('nav-burger');
const mobileMenu = document.getElementById('mobile-menu');
if (burger && mobileMenu) {
  burger.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    burger.setAttribute('aria-expanded', isOpen);
    burger.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });
}
function closeMobileMenu() {
  if (!mobileMenu) return;
  mobileMenu.classList.remove('open');
  burger.setAttribute('aria-expanded', 'false');
  burger.setAttribute('aria-label', 'Abrir menú');
  document.body.style.overflow = '';
}

/* ── SMOOTH SCROLL (anclas) ─── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const offset = 90;
    window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
    closeMobileMenu();
  });
});

/* ── REVEAL ON SCROLL ─── */
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); revealObs.unobserve(e.target); } });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

/* ── PLATFORM ACCORDION ─── */
function togglePlat(header) {
  const body = header.nextElementSibling;
  const icon = header.querySelector('i');
  const isOpen = body.style.maxHeight && body.style.maxHeight !== '0px';
  document.querySelectorAll('.plat-body').forEach(b => b.style.maxHeight = '0');
  document.querySelectorAll('.plat-header i').forEach(i => i.style.transform = '');
  if (!isOpen) { body.style.maxHeight = body.scrollHeight + 'px'; if (icon) icon.style.transform = 'rotate(180deg)'; }
}

/* ── CONTACT → WHATSAPP ─── */
function submitContact() {
  const name  = document.getElementById('ct-name')?.value.trim();
  const msg   = document.getElementById('ct-msg')?.value.trim();
  if (!name || !msg) { alert('Completa nombre y mensaje.'); return; }
  const phone = document.getElementById('ct-phone')?.value.trim() || '';
  const email = document.getElementById('ct-email')?.value.trim() || '';
  const motivo = document.getElementById('ct-motivo')?.value || '';
  const text = `Hola Victor! 👋\n\n👤 ${name}${phone?'\n📱 '+phone:''}${email?'\n📧 '+email:''}${motivo?'\n🎯 '+motivo:''}\n\n📝 ${msg}`;
  window.open('https://wa.me/573026021232?text=' + encodeURIComponent(text), '_blank');
}

/* ── UTILS ─── */
function esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function showMsg(el, type, text) {
  if (!el) return;
  el.className = 'form-msg ' + type;
  el.textContent = text;
  setTimeout(() => { el.textContent = ''; el.className = 'form-msg'; }, 6000);
}

/* ── ADMIN MODAL ─── */
const admModal = document.getElementById('adm-modal');
if (admModal) {
  if (location.search.includes('admin')) {
    const pw = prompt('Password:');
    if (pw === ADMIN_PW) { admModal.classList.add('open'); admLoad('pending'); }
  }
  admModal.addEventListener('click', e => { if (e.target === admModal) admModal.classList.remove('open'); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') admModal.classList.remove('open'); });
}
function admTab(status, btn) {
  document.querySelectorAll('.adm-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active'); admLoad(status);
}
async function admLoad(status) {
  const list = document.getElementById('adm-list');
  if (!list) return;
  list.innerHTML = '<div class="adm-empty">Cargando...</div>';
  if (!sb) { list.innerHTML = '<div class="adm-empty">Supabase no disponible.</div>'; return; }
  try {
    const { data, error } = await sb.from('reviews').select('*').eq('status', status).order('created_at', { ascending: false });
    if (error) throw error;
    if (!data || !data.length) { list.innerHTML = '<div class="adm-empty">Sin opiniones.</div>'; return; }
    list.innerHTML = data.map(r => `<div class="adm-item" id="ai-${r.id}"><div><div class="adm-item-name">${esc(r.name)}</div><div class="adm-item-stars">${'★'.repeat(r.rating||5)}</div><div class="adm-item-text">"${esc(r.text||r.comment||'')}"</div><div class="adm-item-date">${new Date(r.created_at).toLocaleString('es')}</div></div><div class="adm-actions">${status!=='approved'?`<button class="ab ab-ok" onclick="admAct('${r.id}','approve')">✓ Aprobar</button>`:''}${status!=='rejected'?`<button class="ab ab-no" onclick="admAct('${r.id}','reject')">✗ Rechazar</button>`:''}<button class="ab ab-dl" onclick="admAct('${r.id}','del')">🗑</button></div></div>`).join('');
  } catch(e) { list.innerHTML = `<div class="adm-empty">Error: ${esc(e.message)}</div>`; }
}
async function admAct(id, action) {
  if (!sb) return;
  try {
    if (action==='del') { if (!confirm('¿Eliminar?')) return; await sb.from('reviews').delete().eq('id',id); }
    else if (action==='approve') await sb.from('reviews').update({status:'approved'}).eq('id',id);
    else if (action==='reject')  await sb.from('reviews').update({status:'rejected'}).eq('id',id);
    document.getElementById('ai-'+id)?.remove();
  } catch(e) { alert('Error: '+e.message); }
}
