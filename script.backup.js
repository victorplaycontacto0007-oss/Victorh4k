'use strict';

/* ── CONFIG ──────────────────────────────────────────────── */
const WA = 'https://wa.me/573026021232?text=Hola%2C+vi+tu+p%C3%A1gina+web+y+me+gustar%C3%ADa+recibir+m%C3%A1s+informaci%C3%B3n';
const SB_URL = 'https://qejdkzmanvcolfignqiq.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlamRrem1hbnZjb2xmaWducWlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2NjAyMjcsImV4cCI6MjA5NzIzNjIyN30.XSGLfFlU-KgiRGuH-IjyITFRDvwIidqjzOQ_eXX8CSo';
const ADMIN_PW = 'victorh4k2025';

let sb = null;
try { if (window.supabase) sb = window.supabase.createClient(SB_URL, SB_KEY); } catch (e) {}

/* ── LOADER ─────────────────────────────────────────────── */
(function () {
  document.body.style.overflow = 'hidden';
  let pct = 0;
  const fill = document.getElementById('ldr-fill');
  const pctEl = document.getElementById('ldr-pct');
  const iv = setInterval(() => {
    pct = Math.min(pct + (Math.random() * 8 + 2), 100);
    if (fill) fill.style.width = pct + '%';
    if (pctEl) pctEl.textContent = Math.round(pct) + '%';
    if (pct >= 100) clearInterval(iv);
  }, 60);

  const hide = () => {
    const l = document.getElementById('loader');
    if (!l) return;
    l.classList.add('out');
    document.body.style.overflow = '';
    // Trigger hero title reveal after loader
    setTimeout(() => {
      document.querySelectorAll('.line-inner').forEach((el, i) => {
        setTimeout(() => el.classList.add('revealed'), i * 120);
      });
      document.querySelectorAll('#s1 .reveal-fade, #s1 .reveal-scale').forEach(el => {
        el.classList.add('revealed');
      });
    }, 100);
    setTimeout(() => { if (l) l.style.display = 'none'; }, 1000);
  };

  setTimeout(hide, 2800);
})();

/* ── CUSTOM CURSOR ─────────────────────────────────────── */
(function () {
  const cur = document.getElementById('cursor');
  const trail = document.getElementById('cursor-trail');
  if (!cur || !trail) return;
  let mx = 0, my = 0, tx = 0, ty = 0;
  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    cur.style.left = mx + 'px';
    cur.style.top = my + 'px';
  });
  function animTrail() {
    tx += (mx - tx) * 0.12;
    ty += (my - ty) * 0.12;
    trail.style.left = tx + 'px';
    trail.style.top = ty + 'px';
    requestAnimationFrame(animTrail);
  }
  animTrail();
})();

/* ── PARTICLE CANVAS ────────────────────────────────────── */
(function () {
  const canvas = document.getElementById('ptc');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const particles = [];
  const COLS = ['#00ffcc', '#8855ff', '#ff8800', '#00ff88', '#ff44aa', '#0088ff'];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * canvas.width;
      this.y = canvas.height + Math.random() * 100;
      this.size = 0.8 + Math.random() * 2;
      this.speed = 0.4 + Math.random() * 1;
      this.col = COLS[Math.floor(Math.random() * COLS.length)];
      this.alpha = 0;
      this.maxAlpha = 0.3 + Math.random() * 0.4;
      this.drift = (Math.random() - 0.5) * 0.5;
      this.life = 0;
      this.maxLife = 200 + Math.random() * 200;
    }
    update() {
      this.y -= this.speed;
      this.x += this.drift;
      this.life++;
      if (this.life < 40) this.alpha = (this.life / 40) * this.maxAlpha;
      else if (this.life > this.maxLife - 40) this.alpha = ((this.maxLife - this.life) / 40) * this.maxAlpha;
      if (this.life >= this.maxLife) this.reset();
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.shadowBlur = this.size * 4;
      ctx.shadowColor = this.col;
      ctx.fillStyle = this.col;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  for (let i = 0; i < 60; i++) {
    const p = new Particle();
    p.life = Math.random() * p.maxLife;
    p.y = Math.random() * canvas.height;
    particles.push(p);
  }

  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(loop);
  }
  loop();
})();

/* ── LENIS SMOOTH SCROLL ────────────────────────────────── */
let lenis;
if (window.Lenis) {
  lenis = new Lenis({ duration: 1.4, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
  function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
  requestAnimationFrame(raf);
  if (window.gsap && window.ScrollTrigger) {
    gsap.ticker.add(time => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }
}

/* ── SCROLL REVEAL (IntersectionObserver) ─────────────────── */
(function () {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      el.classList.add('revealed');
      io.unobserve(el);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  // Observe all reveal classes (except hero which fires after loader)
  document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right, .reveal-fade, .reveal-scale').forEach(el => {
    if (!el.closest('#s1')) io.observe(el);
  });
})();

/* ── GSAP SCROLL ANIMATIONS ────────────────────────────────── */
(function () {
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  function splitChars(el) {
    el.innerHTML = el.textContent.split('').map(c =>
      `<span class="char" style="display:inline-block">${c === ' ' ? '&nbsp;' : c}</span>`
    ).join('');
  }

  // Section titles char-by-char reveal
  ['s2-title', 's3-title', 's35-title'].forEach((id, idx) => {
    const el = document.getElementById(id);
    if (!el) return;
    splitChars(el);
    gsap.from(`#${id} .char`, {
      scrollTrigger: { trigger: `#${id}`, start: 'top 82%' },
      opacity: 0, y: 50, rotateX: -20,
      stagger: 0.04, duration: 0.65, ease: 'back.out(1.8)',
      delay: idx * 0.05
    });
  });

  // Dashboard panels parallax
  [['#s2-dash', '#s2'], ['#s3-dash', '#s3'], ['#s35-dash', '#s35']].forEach(([panel, section]) => {
    gsap.from(panel, {
      scrollTrigger: { trigger: section, start: 'top 78%', end: 'center center', scrub: 1.2 },
      y: 70, opacity: 0
    });
  });

  // Bar chart trigger
  ScrollTrigger.create({
    trigger: '#s2', start: 'top 62%', once: true,
    onEnter() {
      document.querySelectorAll('#s2-bars .bar').forEach(b => {
        b.style.height = (b.dataset.h || 50) + '%';
      });
      const path = document.getElementById('chart-path');
      if (path) { path.style.transition = 'stroke-dashoffset 2.2s ease .3s'; path.style.strokeDashoffset = '0'; }

      document.querySelectorAll('#s2-dash .dp-m-n').forEach(el => {
        const prefix = el.dataset.prefix || '';
        const suffix = el.dataset.suffix || '';
        const target = parseFloat(el.dataset.count || 0);
        if (!target) return;
        const isLarge = target > 100;
        let cur = 0;
        const steps = 70;
        const inc = target / steps;
        const iv = setInterval(() => {
          cur = Math.min(cur + inc, target);
          el.textContent = isLarge
            ? prefix + Math.round(cur).toLocaleString() + suffix
            : prefix + cur.toFixed(2) + suffix;
          if (cur >= target) clearInterval(iv);
        }, 22);
      });
    }
  });

  // Service cards stagger
  gsap.from('.svc-card', {
    scrollTrigger: { trigger: '#s4', start: 'top 78%' },
    y: 64, opacity: 0, stagger: 0.13, duration: 0.75, ease: 'power2.out'
  });

  // Reputation counters
  gsap.from('.repc', {
    scrollTrigger: { trigger: '#s5', start: 'top 80%' },
    y: 28, opacity: 0, stagger: 0.1, duration: 0.6
  });

  // Contact
  gsap.from('.cfwrap', {
    scrollTrigger: { trigger: '#s6 .cfwrap', start: 'top 85%' },
    x: 60, opacity: 0, duration: 0.8, ease: 'power2.out'
  });
})();

/* ── NAVBAR ─────────────────────────────────────────────── */
const nav = document.getElementById('nav');
const SCENES = ['s1', 's2', 's3', 's35', 's4', 's5', 's6'];

window.addEventListener('scroll', () => {
  const sy = window.scrollY;
  nav.classList.toggle('solid', sy > 40);
  const btt = document.getElementById('btt');
  if (btt) btt.classList.toggle('show', sy > 400);

  let cur = 0;
  SCENES.forEach((id, i) => {
    const el = document.getElementById(id);
    if (el && sy >= el.offsetTop - 220) cur = i;
  });

  document.querySelectorAll('.nav-links a').forEach(a => {
    a.classList.toggle('act', a.dataset.scene == cur);
  });
  document.querySelectorAll('.sdot').forEach(d => {
    d.classList.toggle('on', +d.dataset.i === cur);
  });
}, { passive: true });

/* ── HAMBURGER ──────────────────────────────────────────── */
const hbg = document.getElementById('hbg');
const mob = document.getElementById('mob');
if (hbg) hbg.addEventListener('click', () => {
  hbg.classList.toggle('open');
  mob.classList.toggle('open');
});

function closeMob() {
  if (hbg) hbg.classList.remove('open');
  if (mob) mob.classList.remove('open');
}

/* ── SMOOTH SCROLL ANCHORS ──────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { offset: -72, duration: 1.4 });
    else target.scrollIntoView({ behavior: 'smooth' });
    closeMob();
  });
});

/* ── SCENE DOTS ─────────────────────────────────────────── */
document.querySelectorAll('.sdot').forEach(d => {
  d.addEventListener('click', () => {
    const target = document.getElementById(SCENES[+d.dataset.i]);
    if (!target) return;
    if (lenis) lenis.scrollTo(target, { offset: -72, duration: 1.4 });
    else target.scrollIntoView({ behavior: 'smooth' });
  });
});

/* ── TYPED EFFECT ────────────────────────────────────────── */
(function () {
  const el = document.getElementById('typed-el');
  if (!el) return;
  const phrases = ['Desarrollo Web', 'Automatización WhatsApp', 'Producción Musical IA', 'Plataformas Digitales'];
  let pi = 0, ci = 0, del = false, pause = 0;
  function tick() {
    const cur = phrases[pi];
    if (pause-- > 0) { setTimeout(tick, 55); return; }
    if (!del) {
      el.textContent = cur.slice(0, ++ci);
      if (ci === cur.length) { del = true; pause = 28; }
      setTimeout(tick, 70);
    } else {
      el.textContent = cur.slice(0, --ci);
      if (ci === 0) { del = false; pi = (pi + 1) % phrases.length; setTimeout(tick, 380); return; }
      setTimeout(tick, 36);
    }
  }
  setTimeout(tick, 3200);
})();

/* ── PLATFORM ACCORDION ──────────────────────────────────── */
function tPA(hdr) {
  const item = hdr.parentElement;
  const body = item.querySelector('.pa-body');
  const isOpen = body.style.maxHeight && body.style.maxHeight !== '0px';
  document.querySelectorAll('.pa-body').forEach(b => b.style.maxHeight = '0');
  document.querySelectorAll('.pa-hdr i').forEach(i => i.style.transform = '');
  if (!isOpen) {
    body.style.maxHeight = body.scrollHeight + 40 + 'px';
    hdr.querySelector('i').style.transform = 'rotate(180deg)';
  }
}

/* ── COUNTERS ──────────────────────────────────────────────── */
(function () {
  const els = document.querySelectorAll('[data-target]');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = +el.dataset.target;
      const suffix = el.dataset.suffix || '';
      const display = target >= 1000 ? 1 : target;
      let cur = 0;
      const step = Math.ceil(display / 70);
      const iv = setInterval(() => {
        cur = Math.min(cur + step, display);
        el.textContent = (target >= 1000 ? cur + 'K+' : cur + suffix);
        if (cur >= display) clearInterval(iv);
      }, 18);
      obs.unobserve(el);
    });
  }, { threshold: 0.5 });
  els.forEach(el => obs.observe(el));
})();

/* ── STAR PICKER ─────────────────────────────────────────── */
let selStar = 0;
document.querySelectorAll('#srow .ss').forEach(s => {
  s.addEventListener('mouseover', () => {
    const v = +s.dataset.v;
    document.querySelectorAll('#srow .ss').forEach(x => x.classList.toggle('on', +x.dataset.v <= v));
  });
  s.addEventListener('mouseout', () => {
    document.querySelectorAll('#srow .ss').forEach(x => x.classList.toggle('on', +x.dataset.v <= selStar));
  });
  s.addEventListener('click', () => {
    selStar = +s.dataset.v;
    document.querySelectorAll('#srow .ss').forEach(x => x.classList.toggle('on', +x.dataset.v <= selStar));
  });
  s.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { s.click(); e.preventDefault(); }
  });
});

/* ── CHAR COUNTER ─────────────────────────────────────────── */
const rvTa = document.getElementById('rv-txt');
if (rvTa) rvTa.addEventListener('input', () => {
  const cc = document.getElementById('cc');
  if (cc) cc.textContent = `(${rvTa.value.length}/400)`;
});

/* ── REACT BUTTONS ─────────────────────────────────────────── */
function doR(btn, id) {
  const s = JSON.parse(localStorage.getItem('vh4k_r') || '{}');
  const cnt = btn.querySelector('span');
  const n = +cnt.textContent;
  if (s[id]) { s[id] = false; btn.classList.remove('on'); cnt.textContent = Math.max(0, n - 1); }
  else { s[id] = true; btn.classList.add('on'); cnt.textContent = n + 1; }
  localStorage.setItem('vh4k_r', JSON.stringify(s));
}
(() => {
  const s = JSON.parse(localStorage.getItem('vh4k_r') || '{}');
  Object.keys(s).forEach(id => {
    if (s[id]) { const b = document.querySelector(`[data-id="${id}"]`); if (b) b.classList.add('on'); }
  });
})();

/* ── SUBMIT REVIEW ─────────────────────────────────────────── */
async function submitRv() {
  const name = document.getElementById('rv-name').value.trim();
  const text = document.getElementById('rv-txt').value.trim();
  const msg = document.getElementById('rv-msg');
  if (!name) { msg.className = 'fmsg err'; msg.textContent = 'Ingresa tu nombre.'; return; }
  if (!selStar) { msg.className = 'fmsg err'; msg.textContent = 'Selecciona una calificación.'; return; }
  if (text.length < 10) { msg.className = 'fmsg err'; msg.textContent = 'Escribe al menos 10 caracteres.'; return; }
  const btn = document.querySelector('#s5 .bsub');
  btn.disabled = true; btn.textContent = 'Enviando...';
  try {
    if (sb) await sb.from('reviews').insert([{ name, rating: selStar, text, status: 'pending', featured: false, created_at: new Date().toISOString() }]);
  } catch (e) {}
  msg.className = 'fmsg ok'; msg.textContent = '✅ ¡Gracias! Tu opinión será revisada pronto.';
  document.getElementById('rv-name').value = '';
  rvTa.value = '';
  const cc = document.getElementById('cc');
  if (cc) cc.textContent = '(0/400)';
  selStar = 0;
  document.querySelectorAll('#srow .ss').forEach(s => s.classList.remove('on'));
  btn.disabled = false; btn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Opinión';
}

/* ── LOAD APPROVED REVIEWS ─────────────────────────────────── */
async function loadRv() {
  if (!sb) return;
  try {
    const { data } = await sb.from('reviews').select('*').eq('status', 'approved').order('created_at', { ascending: false }).limit(6);
    if (!data || !data.length) return;
    const g = document.createElement('div');
    g.className = 'rv-grid'; g.style.marginBottom = '40px';
    data.forEach(r => {
      const stars = '★'.repeat(r.rating || 5) + '☆'.repeat(5 - (r.rating || 5));
      const d = new Date(r.created_at).toLocaleDateString('es', { year: 'numeric', month: 'short' });
      const c = document.createElement('article'); c.className = 'rv-card';
      c.innerHTML = `<div class="rv-stars">${stars}</div><p class="rv-txt">"${esc(r.text || r.comment || '')}"</p><div class="rv-name">${esc(r.name)}</div><div class="rv-role">${d}</div>`;
      g.appendChild(c);
    });
    const dynRv = document.getElementById('dyn-rv');
    if (dynRv) dynRv.appendChild(g);
  } catch (e) {}
}
loadRv();

/* ── CONTACT → WHATSAPP ────────────────────────────────────── */
function submitCt() {
  const n = document.getElementById('ct-n').value.trim();
  const m = document.getElementById('ct-m').value.trim();
  if (!n || !m) { alert('Completa nombre y mensaje.'); return; }
  const e2 = document.getElementById('ct-e').value.trim();
  const p = document.getElementById('ct-p').value.trim();
  const txt = `Hola Victor! 👋\n\n👤 ${n}\n${p ? '📱 ' + p + '\n' : ''}${e2 ? '📧 ' + e2 + '\n' : ''}\n📝 ${m}`;
  window.open('https://wa.me/573026021232?text=' + encodeURIComponent(txt), '_blank');
}

/* ── RIPPLE EFFECT ─────────────────────────────────────────── */
document.addEventListener('click', e => {
  const b = e.target.closest('.btn, .bsub, .ct-btn, .nav-cta');
  if (!b) return;
  const r = document.createElement('span'); r.className = 'rip';
  const rc = b.getBoundingClientRect();
  const sz = Math.max(rc.width, rc.height);
  r.style.cssText = `width:${sz}px;height:${sz}px;left:${e.clientX - rc.left - sz / 2}px;top:${e.clientY - rc.top - sz / 2}px`;
  b.appendChild(r);
  setTimeout(() => r.remove(), 650);
});

/* ── CANVAS CARD BACKGROUNDS ─────────────────────────────── */
function drawCardCanvas(id, glows) {
  const c = document.getElementById(id);
  if (!c) return;
  const ctx = c.getContext('2d');
  const W = c.offsetParent ? c.offsetParent.offsetWidth : 600;
  const H = c.offsetParent ? c.offsetParent.offsetHeight : 320;
  c.width = W; c.height = H;
  ctx.clearRect(0, 0, W, H);
  glows.forEach(([x, y, r, col]) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, col + '66'); g.addColorStop(0.5, col + '18'); g.addColorStop(1, 'transparent');
    ctx.globalAlpha = 0.6; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  });
  ctx.globalAlpha = 0.04;
  for (let i = 0; i < 1000; i++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.5})`;
    ctx.fillRect(Math.random() * W, Math.random() * H, Math.random() * 1.5, Math.random() * 1.5);
  }
  ctx.globalAlpha = 1;
}

setTimeout(() => {
  drawCardCanvas('cv-roy', [[400, 80, 220, '#00ffcc'], [100, 240, 160, '#0088ff'], [280, 300, 120, '#004466']]);
  drawCardCanvas('cv-odi', [[130, 100, 200, '#ff8800'], [360, 210, 160, '#ff4400'], [200, 290, 110, '#cc2200']]);
  drawCardCanvas('cv-beauty', [[360, 80, 220, '#ff44aa'], [100, 200, 160, '#aa0055'], [280, 270, 130, '#660033']]);
}, 500);

/* ── UTILS ──────────────────────────────────────────────────── */
function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ── ADMIN PANEL ─────────────────────────────────────────── */
if (location.search.includes('admin')) {
  const pw = prompt('Password:');
  if (pw === ADMIN_PW) { document.getElementById('adm-modal').classList.add('open'); admLoad('pending'); }
}
const admModal = document.getElementById('adm-modal');
if (admModal) {
  admModal.addEventListener('click', e => { if (e.target === admModal) admModal.classList.remove('open'); });
}
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { const m = document.getElementById('adm-modal'); if (m) m.classList.remove('open'); }
});

let admCur = 'pending';
function admTab(t, btn) {
  admCur = t;
  document.querySelectorAll('.adm-tab').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  admLoad(t);
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
    list.innerHTML = data.map(r => `
      <div class="adm-item" id="ai-${r.id}">
        <div>
          <div class="ai-name">${esc(r.name)}</div>
          <div class="ai-stars">${'★'.repeat(r.rating || 5)}</div>
          <div class="ai-text">"${esc(r.text || r.comment || '')}"</div>
          <div style="font-size:10px;color:var(--tx3);margin-top:3px">${new Date(r.created_at).toLocaleString('es')}</div>
        </div>
        <div class="adm-acts">
          ${status !== 'approved' ? `<button class="ab ab-ok" onclick="admAct('${r.id}','approve')">✓</button>` : ''}
          ${status !== 'rejected' ? `<button class="ab ab-no" onclick="admAct('${r.id}','reject')">✗</button>` : ''}
          <button class="ab ab-st" onclick="admAct('${r.id}','feature')">⭐</button>
          <button class="ab ab-dl" onclick="admAct('${r.id}','del')">🗑</button>
        </div>
      </div>`).join('');
  } catch (e) { list.innerHTML = `<div class="adm-empty">Error: ${esc(e.message)}</div>`; }
}
async function admAct(id, action) {
  if (!sb) return;
  try {
    if (action === 'del') { if (!confirm('¿Eliminar?')) return; await sb.from('reviews').delete().eq('id', id); }
    else if (action === 'approve') await sb.from('reviews').update({ status: 'approved' }).eq('id', id);
    else if (action === 'reject') await sb.from('reviews').update({ status: 'rejected' }).eq('id', id);
    else if (action === 'feature') {
      const { data } = await sb.from('reviews').select('featured').eq('id', id).single();
      await sb.from('reviews').update({ featured: !(data && data.featured) }).eq('id', id);
    }
    document.getElementById('ai-' + id)?.remove();
  } catch (e) { alert('Error: ' + e.message); }
}
